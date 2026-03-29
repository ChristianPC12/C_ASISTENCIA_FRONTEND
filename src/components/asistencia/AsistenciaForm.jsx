import { useEffect, useMemo, useRef, useState } from 'react';
import SelectorFecha from './SelectorFecha';
import {
  ETIQUETAS_SECCION,
  agruparMetricasPorSeccion,
  obtenerMetricasNumericasPorSeccion
} from '../../utils/metricasConfig';
import { OBSERVACIONES_MAX, validarAsistencia } from '../../validators/asistenciaValidator';
import { notificarAdvertencia } from '../../utils/notify';

const FECHAS_REGISTRADAS_VACIAS = [];
const OBSERVACIONES_MAX_SALTOS = 3;
const SECCIONES_ORDEN = [
  'total_asistentes',
  'informacion_culto',
  'composicion_asistentes',
  'procedencia',
  'visitas',
  'permanencia',
  'adicionales',
  'observaciones'
];

function limitarSaltosObservaciones(valor) {
  const texto = String(valor ?? '').replace(/\r\n/g, '\n');
  const lineas = texto.split('\n');

  if (lineas.length <= OBSERVACIONES_MAX_SALTOS + 1) {
    return texto;
  }

  return lineas.slice(0, OBSERVACIONES_MAX_SALTOS + 1).join('\n');
}

function campoTieneValor(metrica, formulario) {
  const valor = formulario?.metricas?.[metrica.clave];
  if (metrica.tipo === 'texto') {
    return String(valor ?? '').trim() !== '';
  }
  return valor !== '' && valor !== null && valor !== undefined;
}

function seccionTieneDatos(metricas, formulario) {
  return (Array.isArray(metricas) ? metricas : []).some((metrica) => campoTieneValor(metrica, formulario));
}

function obtenerEstadoSeccion({ seccion, metricas, formulario, errores }) {
  const listaMetricas = Array.isArray(metricas) ? metricas : [];
  const erroresPropios = listaMetricas
    .filter((metrica) => Boolean(errores?.[metrica.clave]))
    .map((metrica) => ({
      clave: metrica.clave,
      etiqueta: metrica.etiqueta,
      mensaje: errores?.[metrica.clave]
    }));

  const erroresRelacionados = [];
  if (['procedencia', 'permanencia'].includes(seccion) && errores?.total_asistentes) {
    erroresRelacionados.push({
      clave: 'total_asistentes',
      etiqueta: 'Total de asistentes',
      mensaje: errores.total_asistentes
    });
  }

  return {
    valida: erroresPropios.length === 0 && erroresRelacionados.length === 0,
    erroresPropios,
    erroresRelacionados
  };
}

function obtenerClaseCampoBase(metrica) {
  if (metrica.clave === 'observaciones') return 'col-12';
  if (metrica.clave === 'total_asistentes') return 'col-12 col-sm-8 col-lg-6';
  if (metrica.clave.startsWith('nombres_visitas_')) return 'col-12';
  if (metrica.tipo === 'texto') return 'col-12';

  switch (metrica.seccion || metrica.categoria) {
    case 'informacion_culto':
      return 'col-12 col-sm-6';
    case 'composicion_asistentes':
    case 'procedencia':
    case 'permanencia':
      return 'col-12 col-sm-6 col-xl-4';
    default:
      return 'col-12 col-sm-6 col-lg-4';
  }
}

function agruparMetricasVisitas(metricas) {
  const grupos = [];
  const mapa = new Map();

  (Array.isArray(metricas) ? metricas : []).forEach((metrica) => {
    const clave = metrica.clave || '';
    let slug = null;

    if (clave.startsWith('visitas_')) {
      slug = clave.slice('visitas_'.length);
    } else if (clave.startsWith('nombres_visitas_')) {
      slug = clave.slice('nombres_visitas_'.length);
    }

    if (!slug) {
      grupos.push({ slug: clave || String(grupos.length), cantidad: null, nombres: null, extras: [metrica] });
      return;
    }

    if (!mapa.has(slug)) {
      const grupo = { slug, cantidad: null, nombres: null, extras: [] };
      mapa.set(slug, grupo);
      grupos.push(grupo);
    }

    const grupo = mapa.get(slug);
    if (clave.startsWith('visitas_')) {
      grupo.cantidad = metrica;
    } else if (clave.startsWith('nombres_visitas_')) {
      grupo.nombres = metrica;
    }
  });

  return grupos;
}

function campoTexto({ metrica, formulario, errores, cargando, onCambiarCampo, claseColumna }) {
  const esNombresVisitas = metrica.clave.startsWith('nombres_visitas_');
  const clase = claseColumna || obtenerClaseCampoBase(metrica);

  if (metrica.clave === 'observaciones') {
    return (
      <div className={clase} key={metrica.clave}>
        <label htmlFor={metrica.clave} className="form-label">
          {metrica.etiqueta}
        </label>
        <textarea
          id={metrica.clave}
          name={metrica.clave}
          rows={3}
          className={`form-control asistencia-observaciones-textarea ${errores[metrica.clave] ? 'is-invalid' : ''}`}
          value={formulario.metricas?.[metrica.clave] ?? ''}
          onChange={(event) => onCambiarCampo(metrica.clave, limitarSaltosObservaciones(event.target.value))}
          disabled={cargando}
          placeholder={metrica.etiqueta}
          maxLength={OBSERVACIONES_MAX}
          aria-invalid={errores[metrica.clave] ? 'true' : 'false'}
        />
      </div>
    );
  }

  return (
    <div className={clase} key={metrica.clave}>
      <label htmlFor={metrica.clave} className="form-label">
        {metrica.etiqueta}
      </label>
      <input
        type="text"
        id={metrica.clave}
        name={metrica.clave}
        className={`form-control ${esNombresVisitas ? 'asistencia-nombres-input ' : ''}${errores[metrica.clave] ? 'is-invalid' : ''}`.trim()}
        value={formulario.metricas?.[metrica.clave] ?? ''}
        onChange={(event) => onCambiarCampo(metrica.clave, event.target.value)}
        placeholder={esNombresVisitas ? 'Nombre 1, Nombre 2, Nombre 3' : metrica.etiqueta}
        disabled={cargando}
        aria-invalid={errores[metrica.clave] ? 'true' : 'false'}
        spellCheck={false}
      />
    </div>
  );
}

function campoNumero({
  metrica,
  formulario,
  errores,
  cargando,
  onCambiarCampo,
  totalAutoCalculado,
  permanenciaAuto,
  claseColumna
}) {
  const esTotal = metrica.clave === 'total_asistentes';
  const esPermanenciaAuto = Boolean(permanenciaAuto?.bloqueada)
    && permanenciaAuto?.clave === metrica.clave;
  const soloLectura = (esTotal && totalAutoCalculado) || esPermanenciaAuto;
  const clase = claseColumna || obtenerClaseCampoBase(metrica);

  return (
    <div className={clase} key={metrica.clave}>
      <label htmlFor={metrica.clave} className="form-label">
        {metrica.etiqueta}
      </label>
      <input
        type="number"
        id={metrica.clave}
        name={metrica.clave}
        className={`form-control ${errores[metrica.clave] ? 'is-invalid' : ''} ${soloLectura ? 'bg-light fw-bold' : ''}`}
        value={formulario.metricas?.[metrica.clave] ?? ''}
        onChange={(event) => onCambiarCampo(metrica.clave, event.target.value)}
        min="0"
        placeholder="Cantidad"
        disabled={cargando || soloLectura}
        readOnly={soloLectura}
        aria-invalid={errores[metrica.clave] ? 'true' : 'false'}
      />
    </div>
  );
}

function renderCampoMetrica({
  metrica,
  formulario,
  errores,
  cargando,
  onCambiarCampo,
  totalAutoCalculado,
  permanenciaAuto,
  claseColumna
}) {
  if (metrica.tipo === 'texto') {
    return campoTexto({
      metrica,
      formulario,
      errores,
      cargando,
      onCambiarCampo,
      claseColumna
    });
  }

  return campoNumero({
    metrica,
    formulario,
    errores,
    cargando,
    onCambiarCampo,
    totalAutoCalculado,
    permanenciaAuto,
    claseColumna
  });
}

export default function AsistenciaForm({
  formulario,
  cultos,
  editandoId,
  errores,
  cargando,
  metricasActivas,
  fechasRegistradas = FECHAS_REGISTRADAS_VACIAS,
  clavePermanenciaAuto = null,
  permanenciaAutoBloqueada = false,
  onCambiarCampo,
  onGuardar,
  onLimpiar
}) {
  const grupos = useMemo(() => agruparMetricasPorSeccion(metricasActivas), [metricasActivas]);
  const metricasInfoCulto = useMemo(
    () => obtenerMetricasNumericasPorSeccion(metricasActivas, 'informacion_culto'),
    [metricasActivas]
  );
  const totalAutoCalculado = metricasInfoCulto.length > 0;
  const permanenciaAuto = {
    clave: clavePermanenciaAuto,
    bloqueada: permanenciaAutoBloqueada
  };
  const seccionesVisibles = useMemo(
    () => {
      const ordenBase = totalAutoCalculado
        ? SECCIONES_ORDEN.filter((seccion) => seccion !== 'total_asistentes')
        : SECCIONES_ORDEN;

      return ordenBase.filter((seccion) => (grupos[seccion] || []).length > 0);
    },
    [grupos, totalAutoCalculado]
  );
  const [seccionActiva, setSeccionActiva] = useState(seccionesVisibles[0] || null);
  const cultoSelectRef = useRef(null);

  useEffect(() => {
    if (!seccionesVisibles.length) {
      setSeccionActiva(null);
      return;
    }

    if (seccionesVisibles.includes(seccionActiva)) {
      return;
    }

    setSeccionActiva(seccionesVisibles[0]);
  }, [seccionActiva, seccionesVisibles]);

  const formatearNombreCulto = (nombre = '', codigo = '') => {
    const valor = nombre || codigo || '';
    if (!valor) return '';

    return valor
      .replace(/Sabado/gi, 'Sabado')
      .replace(/Miercoles/gi, 'Miercoles');
  };

  const cultoSeleccionado = cultos.find((culto) => String(culto.id) === String(formulario.culto_id));
  const aDiaJs = (diaMysql) => {
    const dia = Number(diaMysql);
    if (!Number.isInteger(dia) || dia < 1 || dia > 7) return null;
    return dia === 1 ? 0 : dia - 1;
  };
  const diaPermitido = cultoSeleccionado ? aDiaJs(cultoSeleccionado.dia_semana) : null;
  const NOMBRES_DIA = {
    0: 'domingo',
    1: 'lunes',
    2: 'martes',
    3: 'mi\u00E9rcoles',
    4: 'jueves',
    5: 'viernes',
    6: 's\u00E1bado'
  };

  const manejarCambioCulto = (event) => {
    const nuevoCultoId = event.target.value;
    onCambiarCampo('culto_id', nuevoCultoId);
    if (formulario.fecha && nuevoCultoId) {
      const nuevoCulto = cultos.find((culto) => String(culto.id) === String(nuevoCultoId));
      if (nuevoCulto) {
        const diaRequerido = aDiaJs(nuevoCulto.dia_semana);
        const [anio, mes, dia] = formulario.fecha.split('-').map(Number);
        const fecha = new Date(anio, mes - 1, dia);
        if (diaRequerido !== null && diaRequerido !== undefined && fecha.getDay() !== diaRequerido) {
          onCambiarCampo('fecha', '');
        }
      }
    }
  };

  const mostrarSelectorFecha = Boolean(formulario.culto_id);
  const mostrarFormularioDetalle = Boolean(formulario.culto_id && formulario.fecha);
  const indiceSeccionActiva = seccionActiva ? seccionesVisibles.findIndex((item) => item === seccionActiva) : -1;
  const metricasSeccionActiva = seccionActiva ? grupos[seccionActiva] || [] : [];
  const haySeccionesDependientesDelTotal = useMemo(
    () => seccionesVisibles.some((seccion) => ['composicion_asistentes', 'procedencia', 'visitas', 'permanencia'].includes(seccion)),
    [seccionesVisibles]
  );
  const gruposVisitas = useMemo(
    () => (seccionActiva === 'visitas' ? agruparMetricasVisitas(metricasSeccionActiva) : []),
    [metricasSeccionActiva, seccionActiva]
  );
  const erroresPaso = useMemo(
    () => validarAsistencia(formulario, { metricasActivas }).errores,
    [formulario, metricasActivas]
  );
  const estadoSeccionActiva = useMemo(
    () => obtenerEstadoSeccion({
      seccion: seccionActiva,
      metricas: metricasSeccionActiva,
      formulario,
      errores: erroresPaso
    }),
    [seccionActiva, metricasSeccionActiva, formulario, erroresPaso]
  );
  const puedeRetroceder = indiceSeccionActiva > 0;
  const puedeAvanzar = indiceSeccionActiva >= 0 && indiceSeccionActiva < (seccionesVisibles.length - 1);
  const esUltimoPaso = indiceSeccionActiva >= 0 && indiceSeccionActiva === (seccionesVisibles.length - 1);

  const manejarEnvio = (event) => {
    event.preventDefault();

    if (!esUltimoPaso) {
      notificarAdvertencia('Complete el formulario hasta el \u00FAltimo paso antes de guardar.');
      return;
    }

    onGuardar();
  };

  const cambiarSeccion = (direccion) => {
    if (!seccionesVisibles.length) return;
    if (direccion < 0 && !puedeRetroceder) return;
    if (direccion > 0 && !puedeAvanzar) return;

    if (direccion > 0 && metricasSeccionActiva.length > 0) {
      if (
        seccionActiva === 'informacion_culto'
        && totalAutoCalculado
        && haySeccionesDependientesDelTotal
        && !seccionTieneDatos(metricasSeccionActiva, formulario)
      ) {
        notificarAdvertencia('Complete Información del culto para calcular Total de asistentes antes de continuar.');
        return;
      }

      if (
        seccionActiva === 'total_asistentes'
        && !totalAutoCalculado
        && haySeccionesDependientesDelTotal
        && !seccionTieneDatos(metricasSeccionActiva, formulario)
      ) {
        notificarAdvertencia('Indique Total de asistentes antes de continuar.');
        return;
      }

      if (estadoSeccionActiva.erroresPropios.length > 0) {
        notificarAdvertencia(estadoSeccionActiva.erroresPropios[0].mensaje);
        return;
      }

      if (estadoSeccionActiva.erroresRelacionados.length > 0) {
        notificarAdvertencia(estadoSeccionActiva.erroresRelacionados[0].mensaje);
        return;
      }
    }

    const siguienteIndice = (indiceSeccionActiva >= 0 ? indiceSeccionActiva : 0) + direccion;
    setSeccionActiva(seccionesVisibles[siguienteIndice]);
  };

  const manejarLimpiar = () => {
    setSeccionActiva(seccionesVisibles[0] || null);
    onLimpiar();
    setTimeout(() => {
      cultoSelectRef.current?.focus?.({ preventScroll: true });
    }, 0);
  };

  return (
    <div className="card shadow-sm mb-4 asistencia-form-card">
      <div className="card-body">
        <form onSubmit={manejarEnvio}>
          <div className="asistencia-top-grid">
            <div className="asistencia-top-card">
              <label htmlFor="culto_id" className="form-label">
                Culto <span className="text-danger">*</span>
              </label>
              <select
                ref={cultoSelectRef}
                id="culto_id"
                name="culto_id"
                className={`form-select ${errores.culto_id ? 'is-invalid' : ''}`}
                value={formulario.culto_id}
                onChange={manejarCambioCulto}
                disabled={cargando}
                aria-invalid={errores.culto_id ? 'true' : 'false'}
              >
                <option value="">-- Seleccionar culto --</option>
                {cultos.map((culto) => (
                  <option key={culto.id} value={culto.id}>
                    {formatearNombreCulto(culto.nombre, culto.codigo)} - {culto.hora_inicio?.substring(0, 5)}
                  </option>
                ))}
              </select>
            </div>

            {mostrarSelectorFecha && (
              <div className="asistencia-top-card">
                <label htmlFor="fecha" className="form-label">
                  Fecha <span className="text-danger">*</span>
                </label>
                <SelectorFecha
                  id="fecha"
                  value={formulario.fecha}
                  onChange={(valor) => onCambiarCampo('fecha', valor)}
                  diaPermitido={diaPermitido}
                  fechasDeshabilitadas={editandoId ? [] : fechasRegistradas}
                  disabled={cargando || !formulario.culto_id}
                  className={errores.fecha ? 'is-invalid' : ''}
                  placeholder="Seleccionar fecha"
                  nombreDia={NOMBRES_DIA[diaPermitido] || ''}
                />
              </div>
            )}
          </div>

          {!mostrarFormularioDetalle && (
            <div className="asistencia-empty-hint">
              {formulario.culto_id
                ? 'Seleccione una fecha para habilitar las categor\u00EDas.'
                : 'Seleccione un culto para habilitar la fecha y avanzar por categor\u00EDas.'}
            </div>
          )}

          {mostrarFormularioDetalle && (
            <>
              {seccionActiva && (
                <div className="asistencia-categoria-shell">
                  <div className="admin-info-switch asistencia-categoria-switch mb-3">
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm admin-info-arrow-btn"
                      onClick={() => cambiarSeccion(-1)}
                      aria-label="Ir a la categor\u00EDa anterior"
                      disabled={cargando || seccionesVisibles.length < 2 || !puedeRetroceder}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>

                    <div className="admin-info-switch-title asistencia-categoria-title">
                      <span className="badge text-bg-light border">{indiceSeccionActiva + 1} / {seccionesVisibles.length}</span>
                      <span>{ETIQUETAS_SECCION[seccionActiva] || seccionActiva}</span>
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm admin-info-arrow-btn"
                      onClick={() => cambiarSeccion(1)}
                      aria-label="Ir a la categor\u00EDa siguiente"
                      disabled={cargando || seccionesVisibles.length < 2 || !puedeAvanzar}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </div>

                  <div className="seccion-form asistencia-seccion-card">
                    <div className={`asistencia-seccion-scroll ${seccionActiva === 'visitas' ? 'asistencia-seccion-scroll-visitas' : ''}`.trim()}>
                      {seccionActiva === 'visitas' ? (
                        <div className="asistencia-visitas-stack">
                          {gruposVisitas.map((grupo) => (
                            <div className="row g-3 asistencia-visitas-row" key={grupo.slug}>
                              {grupo.cantidad && renderCampoMetrica({
                                metrica: grupo.cantidad,
                                formulario,
                                errores,
                                cargando,
                                onCambiarCampo,
                                totalAutoCalculado,
                                permanenciaAuto,
                                claseColumna: 'col-4 col-sm-4 asistencia-visitas-col asistencia-visitas-col-cantidad'
                              })}
                              {grupo.nombres && renderCampoMetrica({
                                metrica: grupo.nombres,
                                formulario,
                                errores,
                                cargando,
                                onCambiarCampo,
                                totalAutoCalculado,
                                permanenciaAuto,
                                claseColumna: 'col-8 col-sm-8 asistencia-visitas-col asistencia-visitas-col-nombres'
                              })}
                              {(grupo.extras || []).map((metrica) => renderCampoMetrica({
                                metrica,
                                formulario,
                                errores,
                                cargando,
                                onCambiarCampo,
                                totalAutoCalculado,
                                permanenciaAuto,
                                claseColumna: 'col-12'
                              }))}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="row g-3 asistencia-seccion-grid">
                          {metricasSeccionActiva.map((metrica) => renderCampoMetrica({
                            metrica,
                            formulario,
                            errores,
                            cargando,
                            onCambiarCampo,
                            totalAutoCalculado,
                            permanenciaAuto
                          }))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!seccionActiva && (
                <div className="asistencia-empty-hint">
                  No hay categor\u00EDas activas para este registro.
                </div>
              )}

              <div className="asistencia-form-actions mt-3">
                {esUltimoPaso && (
                  <button
                    type="submit"
                    className="btn btn-primary px-4 asistencia-form-action-btn"
                    disabled={cargando}
                    title={editandoId ? 'Actualizar registro' : 'Guardar registro'}
                    aria-label={editandoId ? 'Actualizar registro' : 'Guardar registro'}
                  >
                    {cargando ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        <span className="asistencia-form-btn-label">Guardando...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-floppy" aria-hidden="true"></i>
                        <span className="asistencia-form-btn-label">{editandoId ? 'Actualizar' : 'Guardar'}</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-outline-secondary asistencia-form-action-btn"
                  onClick={manejarLimpiar}
                  disabled={cargando}
                  title={editandoId ? 'Cancelar edición' : 'Limpiar formulario'}
                  aria-label={editandoId ? 'Cancelar edición' : 'Limpiar formulario'}
                >
                  <i className={`bi ${editandoId ? 'bi-x-lg' : 'bi-arrow-counterclockwise'}`} aria-hidden="true"></i>
                  <span className="asistencia-form-btn-label">{editandoId ? 'Cancelar' : 'Limpiar'}</span>
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
