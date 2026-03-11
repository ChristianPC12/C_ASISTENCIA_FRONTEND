import { Fragment, useEffect, useRef, useState } from 'react';
import {
  useSuperadminOrganizaciones,
  TIPO_ORGANIZACION_OPCIONES,
  ESTADO_ADMIN_OPCIONES
} from '../hooks/useSuperadminOrganizaciones';
import {
  EVENT_SUPERADMIN_ABRIR_CREAR_INSTANCIA,
  EVENT_SUPERADMIN_ABRIR_GESTION_CAMPOS,
  EVENT_SUPERADMIN_ABRIR_GESTION_DISTRITOS
} from '../config/events';
import { notificarError } from '../utils/notify';

function obtenerAnioRegistro(organizacion) {
  const raw = String(organizacion?.creado_en || '');
  if (raw.length >= 4 && /^[0-9]{4}/.test(raw)) {
    return raw.slice(0, 4);
  }
  return '-';
}

function construirEstadoCorreoDetalle(detalleAdmin, organizacion) {
  const correo = detalleAdmin?.correo;
  if (correo && typeof correo === 'object') {
    const enviado = !!correo.enviado;
    const destino = String(correo.destino || '').trim();
    return `${enviado ? 'Enviado' : 'No enviado'}${destino ? ` (${destino})` : ''}`;
  }

  const correoContacto = String(organizacion?.correo_contacto || '').trim();
  if (correoContacto) {
    return `No enviado (${correoContacto})`;
  }

  return 'No enviado';
}

function obtenerConfigEstadoAdmin(estadoAdmin) {
  switch (estadoAdmin) {
    case 'ADMIN_ACTIVO':
      return { etiqueta: 'ADMIN activo', clase: 'text-bg-info' };
    case 'ADMIN_EXPIRADO':
      return { etiqueta: 'ADMIN expirado', clase: 'text-bg-warning text-dark' };
    default:
      return { etiqueta: 'Sin ADMIN', clase: 'text-bg-danger' };
  }
}

function formatearFechaDetalle(fecha) {
  if (!fecha) {
    return 'Sin fecha disponible';
  }

  const fechaDate = new Date(fecha);
  if (Number.isNaN(fechaDate.getTime())) {
    return String(fecha);
  }

  return fechaDate.toLocaleString('es-CR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function generarNombreArchivoExportacion() {
  const ahora = new Date();
  const fecha = ahora.toISOString().slice(0, 10);
  return `organizaciones_filtradas_${fecha}.xlsx`;
}

export default function SuperadminPage() {
  const {
    formulario,
    errores,
    formularioAdminTemporal,
    erroresAdminTemporal,
    adminTemporalVisible,
    formularioEdicion,
    erroresEdicion,
    organizaciones,
    organizacionesFiltradas,
    organizacionesTablaOpciones,
    organizacionSeleccionadaTabla,
    organizacionSeleccionadaAdmin,
    detalleAdminTemporalSeleccionado,
    paginacion,
    cargandoLista,
    guardando,
    guardandoAdminTemporal,
    guardandoEdicion,
    ultimaCreada,
    ultimaEditada,
    filtrosTabla,
    camposOpciones,
    distritosOpciones,
    opcionesAnioFiltro,
    cambiarCampo,
    cambiarCampoAdminTemporal,
    abrirFormularioAdminTemporal,
    cerrarFormularioAdminTemporal,
    iniciarEdicion,
    cambiarCampoEdicion,
    seleccionarOrganizacionTabla,
    obtenerEstadoAdminOrganizacion,
    cambiarFiltroTabla,
    limpiarFiltrosTabla,
    crearOrganizacion,
    crearAdminTemporal,
    actualizarOrganizacion,
    crearCampoCatalogo,
    actualizarCampoCatalogo,
    crearDistritoCatalogo,
    actualizarDistritoCatalogo,
    limpiarFormulario,
    limpiarFormularioAdminTemporal,
    cancelarEdicion,
    recargarOrganizaciones
  } = useSuperadminOrganizaciones();

  const [crearInstanciaVisible, setCrearInstanciaVisible] = useState(false);
  const [gestionCamposVisible, setGestionCamposVisible] = useState(false);
  const [gestionDistritosVisible, setGestionDistritosVisible] = useState(false);
  const [exportandoExcel, setExportandoExcel] = useState(false);
  const [nuevoCampoCodigo, setNuevoCampoCodigo] = useState('');
  const [nuevoCampoNombre, setNuevoCampoNombre] = useState('');
  const [nuevoDistritoNombre, setNuevoDistritoNombre] = useState('');
  const [edicionCampos, setEdicionCampos] = useState({});
  const [edicionDistritos, setEdicionDistritos] = useState({});

  const manejarSubmitOrganizacion = async (event) => {
    event.preventDefault();
    const creada = await crearOrganizacion();
    if (creada) {
      setCrearInstanciaVisible(false);
    }
  };

  const manejarSubmitAdminTemporal = async (event) => {
    event.preventDefault();
    const creado = await crearAdminTemporal();
    if (creado) {
      manejarCerrarFormularioAdminTemporal();
    }
  };

  const manejarSubmitEdicion = async (event) => {
    event.preventDefault();
    await actualizarOrganizacion();
  };

  const manejarCerrarPanelCrearInstancia = () => {
    setCrearInstanciaVisible(false);
    limpiarFormulario();
  };

  const manejarAbrirFormularioAdminTemporal = (organizacion) => {
    setCrearInstanciaVisible(false);
    setGestionCamposVisible(false);
    setGestionDistritosVisible(false);
    abrirFormularioAdminTemporal(organizacion);
  };

  const manejarCerrarFormularioAdminTemporal = () => {
    cerrarFormularioAdminTemporal();
  };

  const manejarIniciarEdicion = (organizacion) => {
    setCrearInstanciaVisible(false);
    setGestionCamposVisible(false);
    setGestionDistritosVisible(false);
    iniciarEdicion(organizacion);
  };

  const manejarCancelarEdicion = () => {
    cancelarEdicion();
  };

  const manejarCerrarGestionCampos = () => {
    setGestionCamposVisible(false);
    setNuevoCampoCodigo('');
    setNuevoCampoNombre('');
    setEdicionCampos({});
  };

  const manejarCerrarGestionDistritos = () => {
    setGestionDistritosVisible(false);
    setNuevoDistritoNombre('');
    setEdicionDistritos({});
  };

  const manejarCrearCampo = (event) => {
    event.preventDefault();
    const creado = crearCampoCatalogo(nuevoCampoCodigo, nuevoCampoNombre);
    if (creado) {
      setNuevoCampoCodigo('');
      setNuevoCampoNombre('');
    }
  };

  const manejarCrearDistrito = (event) => {
    event.preventDefault();
    const codigoCreado = crearDistritoCatalogo(nuevoDistritoNombre);
    if (codigoCreado) {
      setNuevoDistritoNombre('');
    }
  };

  const manejarGuardarEdicionCampo = (codigo) => {
    const nombreEditado = edicionCampos[codigo];
    if (typeof nombreEditado !== 'string') {
      return;
    }

    const actualizado = actualizarCampoCatalogo(codigo, nombreEditado);
    if (actualizado) {
      setEdicionCampos((prev) => {
        const copia = { ...prev };
        delete copia[codigo];
        return copia;
      });
    }
  };

  const manejarGuardarEdicionDistrito = (codigo) => {
    const nombreEditado = edicionDistritos[codigo];
    if (typeof nombreEditado !== 'string') {
      return;
    }

    const actualizado = actualizarDistritoCatalogo(codigo, nombreEditado);
    if (actualizado) {
      setEdicionDistritos((prev) => {
        const copia = { ...prev };
        delete copia[codigo];
        return copia;
      });
    }
  };

  const estaEditando = !!formularioEdicion.id;
  const hayAccionAbierta = crearInstanciaVisible
    || adminTemporalVisible
    || estaEditando
    || gestionCamposVisible
    || gestionDistritosVisible;
  const mostrarTablaOrganizaciones = !hayAccionAbierta;
  const totalRegistros = paginacion.total || organizaciones.length;
  const totalFiltrados = organizacionesFiltradas.length;
  const adminTemporalTituloRef = useRef(null);
  const edicionTituloRef = useRef(null);
  const campoOrganizacionAdmin = organizacionSeleccionadaAdmin?.campo_nombre
    || organizacionSeleccionadaAdmin?.campo
    || '-';
  const tipoOrganizacionAdmin = organizacionSeleccionadaAdmin?.tipo_organizacion || '-';
  const nombreOrganizacionAdmin = organizacionSeleccionadaAdmin?.nombre_organizacion || '-';
  const manejarExportarExcel = async () => {
    if (organizacionesFiltradas.length === 0) {
      return;
    }

    try {
      setExportandoExcel(true);

      const exceljs = await import('exceljs');
      const workbook = new exceljs.Workbook();
      workbook.creator = 'Sistema C_ASISTENCIA';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('Organizaciones');

      worksheet.columns = [
        { header: 'Campo', key: 'campo', width: 24 },
        { header: 'Distrito', key: 'distrito', width: 24 },
        { header: 'Tipo', key: 'tipo', width: 14 },
        { header: 'Nombre', key: 'nombre', width: 38 },
        { header: 'Año de alta', key: 'anio', width: 14 },
        { header: 'Correo', key: 'correo', width: 32 },
        { header: 'Estado organización', key: 'estado_org', width: 20 },
        { header: 'Estado ADMIN', key: 'estado_admin', width: 20 }
      ];

      worksheet.views = [{ state: 'frozen', ySplit: 1 }];
      worksheet.autoFilter = 'A1:H1';

      const headerRow = worksheet.getRow(1);
      headerRow.height = 24;
      headerRow.eachCell((cell) => {
        cell.font = { name: 'Calibri', bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF003366' }
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF002244' } },
          left: { style: 'thin', color: { argb: 'FF002244' } },
          bottom: { style: 'thin', color: { argb: 'FF002244' } },
          right: { style: 'thin', color: { argb: 'FF002244' } }
        };
      });

      organizacionesFiltradas.forEach((item, index) => {
        const estadoAdminCodigo = obtenerEstadoAdminOrganizacion(item);
        const estadoAdmin = obtenerConfigEstadoAdmin(estadoAdminCodigo).etiqueta;

        const row = worksheet.addRow({
          campo: item.campo_nombre || item.campo || '-',
          distrito: item.distrito_nombre || item.distrito || '-',
          tipo: item.tipo_organizacion || '-',
          nombre: item.nombre_organizacion || '-',
          anio: obtenerAnioRegistro(item),
          correo: item.correo_contacto || '-',
          estado_org: item.activa ? 'Activa' : 'Inactiva',
          estado_admin: estadoAdmin
        });

        row.height = 22;

        let colorBase = index % 2 === 0 ? 'FFF8FBFF' : 'FFFFFFFF';
        if (estadoAdminCodigo === 'SIN_ADMIN') {
          colorBase = 'FFFBE1E1';
        } else if (estadoAdminCodigo === 'ADMIN_EXPIRADO') {
          colorBase = 'FFFFF2D9';
        }

        row.eachCell((cell, colNumber) => {
          cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF2D3436' } };
          cell.alignment = {
            vertical: 'middle',
            horizontal: colNumber >= 7 ? 'center' : 'left'
          };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: colorBase }
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFDDE3EA' } },
            left: { style: 'thin', color: { argb: 'FFDDE3EA' } },
            bottom: { style: 'thin', color: { argb: 'FFDDE3EA' } },
            right: { style: 'thin', color: { argb: 'FFDDE3EA' } }
          };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob(
        [buffer],
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );
      const enlace = document.createElement('a');
      const url = URL.createObjectURL(blob);
      enlace.href = url;
      enlace.download = generarNombreArchivoExportacion();
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
      URL.revokeObjectURL(url);
    } catch (error) {
      notificarError('No se pudo exportar la tabla a Excel.');
    } finally {
      setExportandoExcel(false);
    }
  };

  useEffect(() => {
    const manejarAbrirCrearInstancia = () => {
      cerrarFormularioAdminTemporal();
      cancelarEdicion();
      setGestionCamposVisible(false);
      setGestionDistritosVisible(false);
      setEdicionCampos({});
      setEdicionDistritos({});
      setCrearInstanciaVisible(true);
    };

    const manejarAbrirGestionCampos = () => {
      cerrarFormularioAdminTemporal();
      cancelarEdicion();
      setCrearInstanciaVisible(false);
      setGestionDistritosVisible(false);
      setGestionCamposVisible(true);
      setNuevoCampoCodigo('');
      setNuevoCampoNombre('');
      setEdicionDistritos({});
    };

    const manejarAbrirGestionDistritos = () => {
      cerrarFormularioAdminTemporal();
      cancelarEdicion();
      setCrearInstanciaVisible(false);
      setGestionCamposVisible(false);
      setGestionDistritosVisible(true);
      setNuevoDistritoNombre('');
      setEdicionCampos({});
    };

    window.addEventListener(EVENT_SUPERADMIN_ABRIR_CREAR_INSTANCIA, manejarAbrirCrearInstancia);
    window.addEventListener(EVENT_SUPERADMIN_ABRIR_GESTION_CAMPOS, manejarAbrirGestionCampos);
    window.addEventListener(EVENT_SUPERADMIN_ABRIR_GESTION_DISTRITOS, manejarAbrirGestionDistritos);

    return () => {
      window.removeEventListener(EVENT_SUPERADMIN_ABRIR_CREAR_INSTANCIA, manejarAbrirCrearInstancia);
      window.removeEventListener(EVENT_SUPERADMIN_ABRIR_GESTION_CAMPOS, manejarAbrirGestionCampos);
      window.removeEventListener(EVENT_SUPERADMIN_ABRIR_GESTION_DISTRITOS, manejarAbrirGestionDistritos);
    };
  }, [cerrarFormularioAdminTemporal, cancelarEdicion]);

  useEffect(() => {
    if (!adminTemporalVisible || estaEditando) {
      return undefined;
    }

    const timer = setTimeout(() => {
      adminTemporalTituloRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      adminTemporalTituloRef.current?.focus({ preventScroll: true });
    }, 60);

    return () => clearTimeout(timer);
  }, [adminTemporalVisible, estaEditando, formularioAdminTemporal.organizacion_id]);

  useEffect(() => {
    if (!formularioEdicion.id) {
      return undefined;
    }

    const timer = setTimeout(() => {
      edicionTituloRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      edicionTituloRef.current?.focus({ preventScroll: true });
    }, 60);

    return () => clearTimeout(timer);
  }, [formularioEdicion.id]);

  return (
    <div className="container-fluid py-4">
      {!estaEditando && (
        <>
          {crearInstanciaVisible && !adminTemporalVisible && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
                  <h3 className="h5 mb-0">Crear nueva instancia</h3>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={manejarCerrarPanelCrearInstancia}
                    disabled={guardando}
                  >
                    Cerrar
                  </button>
                </div>

              <form onSubmit={manejarSubmitOrganizacion} noValidate>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label htmlFor="campo" className="form-label">Campo</label>
                    <select
                      id="campo"
                      className={`form-select ${errores.campo ? 'is-invalid' : ''}`}
                      value={formulario.campo}
                      onChange={(event) => cambiarCampo('campo', event.target.value)}
                      disabled={guardando}
                    >
                      <option value="">Seleccione un campo</option>
                      {camposOpciones.map((campo) => (
                        <option key={campo.valor} value={campo.valor}>
                          {campo.etiqueta}
                        </option>
                      ))}
                    </select>
                    {errores.campo && <div className="invalid-feedback">{errores.campo}</div>}
                  </div>

                  <div className="col-12 col-md-6">
                    <label htmlFor="distrito" className="form-label">Distrito</label>
                    <select
                      id="distrito"
                      className={`form-select ${errores.distrito ? 'is-invalid' : ''}`}
                      value={formulario.distrito}
                      onChange={(event) => cambiarCampo('distrito', event.target.value)}
                      disabled={guardando}
                    >
                      <option value="">Seleccione un distrito</option>
                      {distritosOpciones.map((distrito) => (
                        <option key={distrito.valor} value={distrito.valor}>
                          {distrito.etiqueta}
                        </option>
                      ))}
                    </select>
                    {errores.distrito && <div className="invalid-feedback">{errores.distrito}</div>}
                  </div>

                  <div className="col-12 col-md-6">
                    <label htmlFor="tipo" className="form-label">Tipo de organización</label>
                    <select
                      id="tipo"
                      className={`form-select ${errores.tipo_organizacion ? 'is-invalid' : ''}`}
                      value={formulario.tipo_organizacion}
                      onChange={(event) => cambiarCampo('tipo_organizacion', event.target.value)}
                      disabled={guardando}
                    >
                      {TIPO_ORGANIZACION_OPCIONES.map((tipo) => (
                        <option key={tipo.valor} value={tipo.valor}>
                          {tipo.etiqueta}
                        </option>
                      ))}
                    </select>
                    {errores.tipo_organizacion && (
                      <div className="invalid-feedback">{errores.tipo_organizacion}</div>
                    )}
                  </div>

                  <div className="col-12 col-md-6">
                    <label htmlFor="nombre_organizacion" className="form-label">Nombre de organización</label>
                    <input
                      id="nombre_organizacion"
                      type="text"
                      maxLength={30}
                      className={`form-control ${errores.nombre_organizacion ? 'is-invalid' : ''}`}
                      placeholder="Ejemplo: Iglesia Central Cartago"
                      value={formulario.nombre_organizacion}
                      onChange={(event) => cambiarCampo('nombre_organizacion', event.target.value)}
                      disabled={guardando}
                    />
                    {errores.nombre_organizacion && (
                      <div className="invalid-feedback">{errores.nombre_organizacion}</div>
                    )}
                  </div>

                  <div className="col-12 col-md-6">
                    <label htmlFor="correo_contacto" className="form-label">Correo de contacto (opcional)</label>
                    <input
                      id="correo_contacto"
                      type="email"
                      maxLength={30}
                      className={`form-control ${errores.correo_contacto ? 'is-invalid' : ''}`}
                      placeholder="correo@dominio.com"
                      value={formulario.correo_contacto}
                      onChange={(event) => cambiarCampo('correo_contacto', event.target.value)}
                      disabled={guardando}
                    />
                    {errores.correo_contacto && (
                      <div className="invalid-feedback">{errores.correo_contacto}</div>
                    )}
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-2 mt-4">
                  <button type="submit" className="btn btn-primary" disabled={guardando}>
                    {guardando ? 'Creando...' : 'Crear instancia'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={limpiarFormulario}
                    disabled={guardando}
                  >
                    Limpiar
                  </button>
                </div>
                </form>
              </div>
            </div>
          )}

          {gestionCamposVisible && !adminTemporalVisible && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
                  <h3 className="h5 mb-0">Gestionar campos</h3>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={manejarCerrarGestionCampos}
                  >
                    Cerrar
                  </button>
                </div>

                <form className="row g-2 mb-3" onSubmit={manejarCrearCampo}>
                  <div className="col-12 col-md-3">
                    <label htmlFor="nuevo_campo_codigo" className="form-label">Código</label>
                    <input
                      id="nuevo_campo_codigo"
                      type="text"
                      className="form-control form-control-sm text-uppercase"
                      value={nuevoCampoCodigo}
                      maxLength={10}
                      onChange={(event) => setNuevoCampoCodigo(event.target.value.toUpperCase())}
                      placeholder="AN"
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label htmlFor="nuevo_campo_nombre" className="form-label">Nombre del campo</label>
                    <input
                      id="nuevo_campo_nombre"
                      type="text"
                      className="form-control form-control-sm"
                      value={nuevoCampoNombre}
                      maxLength={80}
                      onChange={(event) => setNuevoCampoNombre(event.target.value)}
                      placeholder="Asociación Norte"
                    />
                  </div>
                  <div className="col-12 col-md-3 d-flex align-items-end">
                    <button type="submit" className="btn btn-outline-primary btn-sm w-100">
                      Agregar campo
                    </button>
                  </div>
                </form>

                <div className="table-responsive superadmin-metricas-tabla-wrap">
                  <table className="table table-sm align-middle mb-0">
                    <thead>
                      <tr>
                        <th style={{ width: '140px' }}>Código</th>
                        <th>Nombre</th>
                        <th style={{ width: '120px' }}>Accion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {camposOpciones.map((item) => {
                        const valorEdicion = edicionCampos[item.valor] ?? item.etiqueta;
                        const cambioPendiente = valorEdicion.trim() !== item.etiqueta;

                        return (
                          <tr key={item.valor}>
                            <td><span className="badge text-bg-light border">{item.valor}</span></td>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={valorEdicion}
                                maxLength={80}
                                onChange={(event) => {
                                  const nuevoValor = event.target.value;
                                  setEdicionCampos((prev) => ({ ...prev, [item.valor]: nuevoValor }));
                                }}
                              />
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm w-100"
                                onClick={() => manejarGuardarEdicionCampo(item.valor)}
                                disabled={!cambioPendiente}
                              >
                                Guardar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {gestionDistritosVisible && !adminTemporalVisible && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
                  <h3 className="h5 mb-0">Gestionar distritos</h3>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={manejarCerrarGestionDistritos}
                  >
                    Cerrar
                  </button>
                </div>

                <form className="row g-2 mb-3" onSubmit={manejarCrearDistrito}>
                  <div className="col-12 col-md-9">
                    <label htmlFor="nuevo_distrito_nombre" className="form-label">Nombre del distrito</label>
                    <input
                      id="nuevo_distrito_nombre"
                      type="text"
                      className="form-control form-control-sm"
                      value={nuevoDistritoNombre}
                      maxLength={80}
                      onChange={(event) => setNuevoDistritoNombre(event.target.value)}
                      placeholder="Guanacaste 1"
                    />
                  </div>
                  <div className="col-12 col-md-3 d-flex align-items-end">
                    <button type="submit" className="btn btn-outline-primary btn-sm w-100">
                      Agregar distrito
                    </button>
                  </div>
                </form>

                <div className="table-responsive superadmin-metricas-tabla-wrap">
                  <table className="table table-sm align-middle mb-0">
                    <thead>
                      <tr>
                        <th style={{ width: '180px' }}>Código</th>
                        <th>Nombre</th>
                        <th style={{ width: '120px' }}>Accion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {distritosOpciones.map((item) => {
                        const valorEdicion = edicionDistritos[item.valor] ?? item.etiqueta;
                        const cambioPendiente = valorEdicion.trim() !== item.etiqueta;

                        return (
                          <tr key={item.valor}>
                            <td><span className="badge text-bg-light border">{item.valor}</span></td>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={valorEdicion}
                                maxLength={80}
                                onChange={(event) => {
                                  const nuevoValor = event.target.value;
                                  setEdicionDistritos((prev) => ({ ...prev, [item.valor]: nuevoValor }));
                                }}
                              />
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm w-100"
                                onClick={() => manejarGuardarEdicionDistrito(item.valor)}
                                disabled={!cambioPendiente}
                              >
                                Guardar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {ultimaCreada && (
            <div className="alert alert-success border-0 shadow-sm" role="alert">
              Instancia creada: <strong>{ultimaCreada.nombre_organizacion}</strong>
            </div>
          )}

          {adminTemporalVisible && (
            <div id="admin-temporal-form" className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
                  <h3
                    ref={adminTemporalTituloRef}
                    tabIndex={-1}
                    className="h5 mb-0"
                    style={{ scrollMarginTop: '5.5rem' }}
                  >
                    Crear ADMIN temporal
                  </h3>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={manejarCerrarFormularioAdminTemporal}
                    disabled={guardandoAdminTemporal}
                  >
                    Cerrar
                  </button>
                </div>

                <div className="alert alert-warning py-2">
                  El ADMIN temporal se crea con vigencia máxima de <strong>5 días</strong>.
                </div>

                <form onSubmit={manejarSubmitAdminTemporal} noValidate>
                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <label htmlFor="admin_campo" className="form-label">Campo</label>
                      <input
                        id="admin_campo"
                        type="text"
                        className="form-control bg-light"
                        value={campoOrganizacionAdmin}
                        readOnly
                        disabled
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label htmlFor="admin_tipo" className="form-label">Tipo</label>
                      <input
                        id="admin_tipo"
                        type="text"
                        className="form-control bg-light"
                        value={tipoOrganizacionAdmin}
                        readOnly
                        disabled
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label htmlFor="organizacion_id" className="form-label">Organización</label>
                      <input
                        id="organizacion_id"
                        type="text"
                        className={`form-control bg-light ${erroresAdminTemporal.organizacion_id ? 'is-invalid' : ''}`}
                        value={nombreOrganizacionAdmin}
                        readOnly
                        disabled
                      />
                      {erroresAdminTemporal.organizacion_id && (
                        <div className="invalid-feedback">{erroresAdminTemporal.organizacion_id}</div>
                      )}
                    </div>

                    <div className="col-12 col-md-6">
                      <label htmlFor="nombre_completo" className="form-label">Nombre completo</label>
                      <input
                        id="nombre_completo"
                        type="text"
                        maxLength={30}
                        className={`form-control ${erroresAdminTemporal.nombre_completo ? 'is-invalid' : ''}`}
                        placeholder="Nombre del administrador temporal"
                        value={formularioAdminTemporal.nombre_completo}
                        onChange={(event) => cambiarCampoAdminTemporal('nombre_completo', event.target.value)}
                        disabled={guardandoAdminTemporal}
                      />
                      {erroresAdminTemporal.nombre_completo && (
                        <div className="invalid-feedback">{erroresAdminTemporal.nombre_completo}</div>
                      )}
                    </div>

                    <div className="col-12 col-md-6">
                      <label htmlFor="usuario_admin_temp" className="form-label">Usuario</label>
                      <input
                        id="usuario_admin_temp"
                        type="text"
                        maxLength={50}
                        className={`form-control ${erroresAdminTemporal.usuario ? 'is-invalid' : ''}`}
                        placeholder="usuario.temporal"
                        value={formularioAdminTemporal.usuario}
                        onChange={(event) => cambiarCampoAdminTemporal('usuario', event.target.value)}
                        disabled={guardandoAdminTemporal}
                      />
                      {erroresAdminTemporal.usuario && (
                        <div className="invalid-feedback">{erroresAdminTemporal.usuario}</div>
                      )}
                    </div>

                    <div className="col-12 col-md-6">
                      <label htmlFor="correo_destino" className="form-label">Correo destino (automático)</label>
                      <input
                        id="correo_destino"
                        type="email"
                        maxLength={30}
                        className={`form-control bg-light ${erroresAdminTemporal.correo_destino ? 'is-invalid' : ''}`}
                        placeholder="correo@dominio.com"
                        value={formularioAdminTemporal.correo_destino}
                        readOnly
                        disabled={guardandoAdminTemporal}
                      />
                      {erroresAdminTemporal.correo_destino && (
                        <div className="invalid-feedback">{erroresAdminTemporal.correo_destino}</div>
                      )}
                      {!erroresAdminTemporal.correo_destino && organizacionSeleccionadaAdmin && !formularioAdminTemporal.correo_destino && (
                        <div className="form-text text-warning">
                          La organización seleccionada no tiene correo de contacto registrado.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-check mt-3">
                    <input
                      id="enviar_correo"
                      type="checkbox"
                      className="form-check-input"
                      checked={!!formularioAdminTemporal.enviar_correo}
                      onChange={(event) => cambiarCampoAdminTemporal('enviar_correo', event.target.checked)}
                      disabled={guardandoAdminTemporal || !formularioAdminTemporal.correo_destino}
                    />
                    <label htmlFor="enviar_correo" className="form-check-label">
                      Enviar credenciales por correo
                    </label>
                  </div>

                  <div className="d-flex flex-wrap gap-2 mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={guardandoAdminTemporal || !formularioAdminTemporal.organizacion_id}
                    >
                      {guardandoAdminTemporal ? 'Creando...' : 'Crear ADMIN temporal'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={limpiarFormularioAdminTemporal}
                      disabled={guardandoAdminTemporal}
                    >
                      Limpiar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </>
      )}

      {ultimaEditada && (
        <div className="alert alert-success border-0 shadow-sm" role="alert">
          Organización actualizada: <strong>{ultimaEditada.nombre_organizacion}</strong>
        </div>
      )}

      {formularioEdicion.id && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
              <h3
                ref={edicionTituloRef}
                tabIndex={-1}
                className="h5 mb-0"
                style={{ scrollMarginTop: '5.5rem' }}
              >
                Editar organización
              </h3>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={manejarCancelarEdicion}
                disabled={guardandoEdicion}
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={manejarSubmitEdicion} noValidate>
              <div className="row g-3">
                <div className="col-12 col-md-3">
                  <label htmlFor="edicion_distrito" className="form-label">Distrito</label>
                  <select
                    id="edicion_distrito"
                    className={`form-select ${erroresEdicion.distrito ? 'is-invalid' : ''}`}
                    value={formularioEdicion.distrito}
                    onChange={(event) => cambiarCampoEdicion('distrito', event.target.value)}
                    disabled={guardandoEdicion}
                  >
                    <option value="">Seleccione un distrito</option>
                    {distritosOpciones.map((distrito) => (
                      <option key={distrito.valor} value={distrito.valor}>
                        {distrito.etiqueta}
                      </option>
                    ))}
                  </select>
                  {erroresEdicion.distrito && (
                    <div className="invalid-feedback">{erroresEdicion.distrito}</div>
                  )}
                </div>

                <div className="col-12 col-md-3">
                  <label htmlFor="edicion_tipo" className="form-label">Tipo de organización</label>
                  <select
                    id="edicion_tipo"
                    className={`form-select ${erroresEdicion.tipo_organizacion ? 'is-invalid' : ''}`}
                    value={formularioEdicion.tipo_organizacion}
                    onChange={(event) => cambiarCampoEdicion('tipo_organizacion', event.target.value)}
                    disabled={guardandoEdicion}
                  >
                    {TIPO_ORGANIZACION_OPCIONES.map((tipo) => (
                      <option key={tipo.valor} value={tipo.valor}>
                        {tipo.etiqueta}
                      </option>
                    ))}
                  </select>
                  {erroresEdicion.tipo_organizacion && (
                    <div className="invalid-feedback">{erroresEdicion.tipo_organizacion}</div>
                  )}
                </div>

                <div className="col-12 col-md-3">
                  <label htmlFor="edicion_nombre" className="form-label">Nombre de organización</label>
                  <input
                    id="edicion_nombre"
                    type="text"
                    maxLength={30}
                    className={`form-control ${erroresEdicion.nombre_organizacion ? 'is-invalid' : ''}`}
                    value={formularioEdicion.nombre_organizacion}
                    onChange={(event) => cambiarCampoEdicion('nombre_organizacion', event.target.value)}
                    disabled={guardandoEdicion}
                  />
                  {erroresEdicion.nombre_organizacion && (
                    <div className="invalid-feedback">{erroresEdicion.nombre_organizacion}</div>
                  )}
                </div>

                <div className="col-12 col-md-3">
                  <label htmlFor="edicion_correo" className="form-label">Correo de contacto</label>
                  <input
                    id="edicion_correo"
                    type="email"
                    maxLength={30}
                    className={`form-control ${erroresEdicion.correo_contacto ? 'is-invalid' : ''}`}
                    value={formularioEdicion.correo_contacto}
                    onChange={(event) => cambiarCampoEdicion('correo_contacto', event.target.value)}
                    disabled={guardandoEdicion}
                  />
                  {erroresEdicion.correo_contacto && (
                    <div className="invalid-feedback">{erroresEdicion.correo_contacto}</div>
                  )}
                </div>

                <div className="col-12 col-md-3">
                  <label htmlFor="edicion_activa" className="form-label">Estado</label>
                  <select
                    id="edicion_activa"
                    className="form-select"
                    value={formularioEdicion.activa ? 'ACTIVA' : 'INACTIVA'}
                    onChange={(event) => cambiarCampoEdicion('activa', event.target.value === 'ACTIVA')}
                    disabled={guardandoEdicion}
                  >
                    <option value="ACTIVA">Activa</option>
                    <option value="INACTIVA">Inactiva</option>
                  </select>
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 mt-4">
                <button type="submit" className="btn btn-primary" disabled={guardandoEdicion}>
                  {guardandoEdicion ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={manejarCancelarEdicion}
                  disabled={guardandoEdicion}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarTablaOrganizaciones && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <h3 className="h5 mb-0">Organizaciones registradas</h3>
              <div className="d-flex flex-wrap align-items-center gap-2">
                <button
                  className="btn btn-outline-primary btn-sm"
                  type="button"
                  onClick={recargarOrganizaciones}
                  disabled={cargandoLista}
                >
                  {cargandoLista ? 'Actualizando...' : 'Actualizar lista'}
                </button>
                <span className="badge text-bg-light border">
                  Mostrando: {totalFiltrados} de {totalRegistros}
                </span>
              </div>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-12 col-md-2">
                <label htmlFor="filtro_campo_tabla" className="form-label mb-1">Campo</label>
                <select
                  id="filtro_campo_tabla"
                  className="form-select form-select-sm"
                  value={filtrosTabla.campo}
                  onChange={(event) => cambiarFiltroTabla('campo', event.target.value)}
                >
                  <option value="TODOS">Todos</option>
                  {camposOpciones.map((campo) => (
                    <option key={campo.valor} value={campo.valor}>
                      {campo.etiqueta}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-2">
                <label htmlFor="filtro_distrito_tabla" className="form-label mb-1">Distrito</label>
                <select
                  id="filtro_distrito_tabla"
                  className="form-select form-select-sm"
                  value={filtrosTabla.distrito}
                  onChange={(event) => cambiarFiltroTabla('distrito', event.target.value)}
                >
                  <option value="TODOS">Todos</option>
                  {distritosOpciones.map((distrito) => (
                    <option key={distrito.valor} value={distrito.valor}>
                      {distrito.etiqueta}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-2">
                <label htmlFor="filtro_tipo_tabla" className="form-label mb-1">Tipo</label>
                <select
                  id="filtro_tipo_tabla"
                  className="form-select form-select-sm"
                  value={filtrosTabla.tipo}
                  onChange={(event) => cambiarFiltroTabla('tipo', event.target.value)}
                >
                  <option value="TODOS">Todos</option>
                  {TIPO_ORGANIZACION_OPCIONES.map((tipo) => (
                    <option key={tipo.valor} value={tipo.valor}>
                      {tipo.etiqueta}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-2">
                <label htmlFor="filtro_anio_tabla" className="form-label mb-1">Año</label>
                <select
                  id="filtro_anio_tabla"
                  className="form-select form-select-sm"
                  value={filtrosTabla.anio}
                  onChange={(event) => cambiarFiltroTabla('anio', event.target.value)}
                >
                  <option value="TODOS">Todos</option>
                  {opcionesAnioFiltro.map((anio) => (
                    <option key={anio} value={String(anio)}>
                      {anio}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-2">
                <label htmlFor="filtro_estado_admin_tabla" className="form-label mb-1">Estado ADMIN</label>
                <select
                  id="filtro_estado_admin_tabla"
                  className="form-select form-select-sm"
                  value={filtrosTabla.estado_admin}
                  onChange={(event) => cambiarFiltroTabla('estado_admin', event.target.value)}
                >
                  {ESTADO_ADMIN_OPCIONES.map((estado) => (
                    <option key={estado.valor} value={estado.valor}>
                      {estado.etiqueta}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-2">
                <label htmlFor="filtro_organizacion_tabla" className="form-label mb-1">Organización</label>
                <select
                  id="filtro_organizacion_tabla"
                  className="form-select form-select-sm"
                  value={filtrosTabla.organizacion_id}
                  onChange={(event) => cambiarFiltroTabla('organizacion_id', event.target.value)}
                >
                  <option value="TODOS">Todas</option>
                  {organizacionesTablaOpciones.map((item) => (
                    <option key={item.id} value={String(item.id)}>
                      {item.nombre_organizacion}
                      {item.distrito_nombre ? ` - ${item.distrito_nombre}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 d-flex flex-wrap align-items-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={limpiarFiltrosTabla}
                >
                  Limpiar filtros
                </button>
                <button
                  type="button"
                  className="btn btn-outline-success btn-sm"
                  onClick={manejarExportarExcel}
                  disabled={organizacionesFiltradas.length === 0 || exportandoExcel}
                >
                  {exportandoExcel ? 'Exportando...' : 'Exportar Excel'}
                </button>
              </div>
            </div>

            {cargandoLista ? (
              <div className="text-muted">Cargando organizaciones...</div>
            ) : organizacionesFiltradas.length === 0 ? (
              <div className="text-muted">No hay organizaciones para los filtros seleccionados.</div>
            ) : (
              <div className="superadmin-tabla-scroll">
                <table className="table table-sm table-striped align-middle mb-0 superadmin-tabla">
                  <thead>
                    <tr>
                      <th>Campo</th>
                      <th>Distrito</th>
                      <th>Tipo</th>
                      <th>Nombre</th>
                      <th>Año de alta</th>
                      <th>Correo</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {organizacionesFiltradas.map((item) => {
                      const filaSeleccionada = Number(organizacionSeleccionadaTabla?.id) === Number(item.id);
                      const estadoAdmin = obtenerEstadoAdminOrganizacion(item);
                      const estadoAdminConfig = obtenerConfigEstadoAdmin(estadoAdmin);
                      const filaPendiente = estadoAdmin === 'SIN_ADMIN';
                      const filaExpirada = estadoAdmin === 'ADMIN_EXPIRADO';
                      const detalleFila = filaSeleccionada
                        ? detalleAdminTemporalSeleccionado?.admin_temporal || null
                        : null;
                      const estadoCorreoFila = filaSeleccionada
                        ? construirEstadoCorreoDetalle(detalleAdminTemporalSeleccionado, item)
                        : 'No enviado';

                      return (
                        <Fragment key={item.id}>
                          <tr
                            className={`fila-registro ${filaSeleccionada ? 'fila-activa' : ''} ${filaPendiente ? 'superadmin-fila-pendiente' : ''} ${filaExpirada ? 'superadmin-fila-expirada' : ''}`}
                            role="button"
                            tabIndex={0}
                            aria-pressed={filaSeleccionada}
                            aria-expanded={filaSeleccionada}
                            onClick={() => seleccionarOrganizacionTabla(item.id)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                seleccionarOrganizacionTabla(item.id);
                              }
                            }}
                          >
                            <td>{item.campo_nombre || item.campo}</td>
                            <td>{item.distrito_nombre || item.distrito || '-'}</td>
                            <td>{item.tipo_organizacion}</td>
                            <td>{item.nombre_organizacion}</td>
                            <td>{obtenerAnioRegistro(item)}</td>
                            <td>{item.correo_contacto || '-'}</td>
                            <td>
                              <div className="d-flex flex-wrap gap-1">
                                <span className={`badge ${item.activa ? 'text-bg-success' : 'text-bg-secondary'}`}>
                                  {item.activa ? 'Activa' : 'Inactiva'}
                                </span>
                                <span className={`badge ${estadoAdminConfig.clase}`}>
                                  {estadoAdminConfig.etiqueta}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm" role="group" aria-label="Acciones organización">
                                <button
                                  type="button"
                                  className="btn btn-outline-success"
                                  title="Crear ADMIN temporal"
                                  aria-label="Crear ADMIN temporal"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    manejarAbrirFormularioAdminTemporal(item);
                                  }}
                                  disabled={!item.activa || guardandoAdminTemporal}
                                >
                                  <i className="bi bi-person-plus-fill"></i>
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-primary"
                                  title="Editar organización"
                                  aria-label="Editar organización"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    manejarIniciarEdicion(item);
                                  }}
                                  disabled={guardandoEdicion}
                                >
                                  <i className="bi bi-pencil-square"></i>
                                </button>
                              </div>
                            </td>
                          </tr>

                          {filaSeleccionada && (
                            <tr className="fila-detalle">
                              <td colSpan={8}>
                                <div className="registro-detalle">
                                  {detalleFila ? (
                                    <div className="border rounded bg-light-subtle p-3 mb-0">
                                      <div className="fw-semibold mb-2">{item.nombre_organizacion}</div>
                                      <div className="mb-1">
                                        Distrito: <strong>{item.distrito_nombre || item.distrito || '-'}</strong>
                                      </div>
                                      <div className="mb-1">
                                        Estado ADMIN:{' '}
                                        <span className={`badge ${estadoAdminConfig.clase}`}>
                                          {estadoAdminConfig.etiqueta}
                                        </span>
                                      </div>
                                      <div>
                                        Usuario ADMIN temporal: <strong>{detalleFila.usuario || '-'}</strong>
                                      </div>
                                      <div>
                                        Password temporal:{' '}
                                        <strong>{detalleFila.password_temporal || 'No disponible'}</strong>
                                      </div>
                                      <div>
                                        Expira en: <strong>{formatearFechaDetalle(detalleFila.expira_en)}</strong>
                                      </div>
                                      <div>
                                        Correo: <strong>{estadoCorreoFila}</strong>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="border rounded bg-light-subtle p-3 mb-0">
                                      <div className="fw-semibold mb-1">{item.nombre_organizacion}</div>
                                      {estadoAdmin === 'ADMIN_EXPIRADO'
                                        ? 'Este ADMIN temporal ya expiró. Cree uno nuevo para restablecer el acceso.'
                                        : 'Esta organización no tiene ADMIN activo. Falta crear un administrador temporal.'}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
