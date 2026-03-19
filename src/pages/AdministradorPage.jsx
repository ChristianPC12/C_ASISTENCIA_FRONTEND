import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSetupAdministrador } from '../hooks/useSetupAdministrador';
import { useAuth } from '../hooks/useAuth';
import { CATEGORIAS_METRICA_OPCIONES } from '../utils/metricasConfig';
import InfoCategoriasMetricas from '../components/administrador/InfoCategoriasMetricas';
import InfoRolesUsuarios from '../components/administrador/InfoRolesUsuarios';
import UsuarioPage from './UsuarioPage';
import {
  EVENT_ADMIN_ABRIR_CATEGORIAS_METRICAS,
  EVENT_ADMIN_ABRIR_CULTOS,
  EVENT_ADMIN_ABRIR_METRICAS,
  EVENT_ADMIN_ABRIR_PROCEDENCIAS,
  EVENT_ADMIN_ABRIR_USUARIOS,
  EVENT_ADMIN_VISTA_ACTIVA
} from '../config/events';
import { confirmar } from '../utils/notify';

const VISTA_RESUMEN = 'RESUMEN';
const VISTA_CULTOS = 'CULTOS';
const VISTA_METRICAS = 'METRICAS';
const VISTA_PROCEDENCIAS = 'PROCEDENCIAS';
const VISTA_CATEGORIAS_METRICAS = 'CATEGORIAS_METRICAS';
const VISTA_USUARIOS = 'USUARIOS';
const CATEGORIAS_AUTOMATICAS = new Set(['procedencia', 'visitas']);
const CATEGORIAS_METRICA_OPCIONES_MANUALES = CATEGORIAS_METRICA_OPCIONES.filter(
  (opcion) => !CATEGORIAS_AUTOMATICAS.has(opcion.valor)
);

const DESCRIPCIONES_CATEGORIA_METRICA = {
  informacion_culto: 'Datos de control del culto, por ejemplo llegadas antes y después de la hora.',
  composicion_asistentes: 'Composición demográfica de asistentes, como niños y jóvenes.',
  procedencia: 'Conteos por zona de procedencia para medir origen de asistentes.',
  visitas: 'Métricas de visitas y nombres de visitas por procedencia.',
  permanencia: 'Métricas relacionadas con permanencia durante el culto.',
  total_asistentes: 'Métrica total de asistentes, calculada según reglas del sistema.',
  observaciones: 'Campos descriptivos para notas y observaciones del registro.',
  adicionales: 'Métricas opcionales para necesidades específicas de una iglesia o grupo.'
};

const ACCESO_ROLES_PRELIMINAR = [
  {
    rol: 'Administrador',
    estado: 'En definición',
    detalle: 'Acceso operativo amplio. Alcance final pendiente según módulos restantes.'
  },
  {
    rol: 'Secretario/a',
    estado: 'En definición',
    detalle: 'Accesos orientados a registro y seguimiento. Permisos finales pendientes.'
  },
  {
    rol: 'Ministerio personal',
    estado: 'En definición',
    detalle: 'Espacio reservado para reglas futuras de visitas y consolidación.'
  }
];

const INFO_SECCIONES = [
  { id: 'METRICAS', etiqueta: 'Métricas', icono: 'bi-journal-text' },
  { id: 'ROLES', etiqueta: 'Roles por usuario', icono: 'bi-shield-check' }
];

function BadgeEstado({ completo }) {
  return (
    <span className={`badge w-100 text-center py-2 ${completo ? 'text-bg-success' : 'text-bg-warning'}`}>
      {completo ? 'Setup completo' : 'Setup pendiente'}
    </span>
  );
}

function traducirFaltante(item) {
  switch (item) {
    case 'cultos':
      return 'Definir al menos un culto activo';
    case 'procedencias_minimas':
      return 'Definir al menos una procedencia';
    case 'procedencias_maximas':
      return 'Reducir procedencias a máximo 10';
    case 'metricas':
      return 'Debe habilitar al menos una métrica en el panel de Métricas.';
    case 'admin_definitivo':
      return 'Crear al menos un usuario administrador definitivo.';
    case 'dependencias_metricas':
      return null;
    default:
      return item;
  }
}

function obtenerFaltantesVisibles(faltantes = []) {
  return (Array.isArray(faltantes) ? faltantes : [])
    .map((item) => traducirFaltante(item))
    .filter((item) => typeof item === 'string' && item.trim() !== '');
}

function resolverEstadoBloques(faltantes = []) {
  const lista = new Set(Array.isArray(faltantes) ? faltantes : []);
  return {
    cultos: !lista.has('cultos'),
    metricas: !lista.has('metricas'),
    procedencias: !lista.has('procedencias_minimas') && !lista.has('procedencias_maximas'),
    usuarios: !lista.has('admin_definitivo')
  };
}

function EstadoBloqueCard({ titulo, detalle, completo }) {
  return (
    <div className={`card h-100 shadow-sm admin-setup-step-card ${completo ? 'is-complete' : 'is-pending'}`}>
      <div className="card-body">
        <div className="d-flex align-items-start justify-content-between gap-2">
          <h3 className="h6 mb-2">{titulo}</h3>
          <span className={`badge ${completo ? 'text-bg-success' : 'text-bg-warning'}`}>
            {completo ? 'Listo' : 'Pendiente'}
          </span>
        </div>
        <p className="text-muted mb-0 small">{detalle}</p>
      </div>
    </div>
  );
}

function BotonCerrarPanel({ onClick, label }) {
  return (
    <button
      type="button"
      className="btn btn-outline-light btn-sm admin-panel-close"
      onClick={onClick}
      aria-label={label}
      title="Cerrar"
    >
      <i className="bi bi-x-lg" aria-hidden="true"></i>
    </button>
  );
}

export default function AdministradorPage() {
  const { esAdminTemporal, diasRestantesPassword } = useAuth();
  const {
    cultos,
    procedencias,
    metricas,
    erroresCultos,
    erroresProcedencias,
    erroresMetricas,
    guardandoCultos,
    guardandoProcedencias,
    guardandoMetricas,
    finalizando,
    tieneCambiosCultos,
    tieneCambiosProcedencias,
    tieneCambiosMetricas,
    restaurarCultos,
    restaurarProcedencias,
    restaurarMetricas,
    resumen,
    DIA_OPCIONES,
    cambiarCulto,
    agregarCulto,
    eliminarCulto,
    cambiarProcedencia,
    agregarProcedencia,
    eliminarProcedencia,
    cambiarMetrica,
    agregarMetrica,
    eliminarMetrica,
    guardarCultos,
    guardarProcedencias,
    guardarMetricas,
    finalizarSetup
  } = useSetupAdministrador();

  const [vistaActiva, setVistaActiva] = useState(VISTA_RESUMEN);
  const [infoSeccionActiva, setInfoSeccionActiva] = useState(INFO_SECCIONES[0].id);
  const metricaPendienteFocusRef = useRef(null);
  const metricaInputRefs = useRef(new Map());
  const estadoSetupNormalizado = String(resumen.estado_setup || '').toUpperCase();
  const setupCompleto = estadoSetupNormalizado === 'COMPLETO' && !Boolean(resumen.bloqueada_operacion);
  const faltantes = useMemo(
    () => (Array.isArray(resumen.faltantes) ? resumen.faltantes : []),
    [resumen.faltantes]
  );
  const faltantesVisibles = useMemo(() => obtenerFaltantesVisibles(faltantes), [faltantes]);
  const estadoBloques = useMemo(() => resolverEstadoBloques(faltantes), [faltantes]);
  const diasRestantes = Number.isInteger(diasRestantesPassword) ? Math.max(diasRestantesPassword, 0) : null;
  const cultosActivos = cultos.filter((item) => item.activo).length;
  const metricasHabilitadas = metricas.filter((item) => item.habilitado).length;
  const procedenciasActivas = procedencias.filter((item) => item.activo).length;
  const adminsDefinitivosActivos = Number.isFinite(Number(resumen.admins_definitivos_activos))
    ? Number(resumen.admins_definitivos_activos)
    : 0;
  const registrarInputMetricaRef = useCallback((uiId, node) => {
    if (!uiId) return;
    if (node) {
      metricaInputRefs.current.set(uiId, node);
      return;
    }
    metricaInputRefs.current.delete(uiId);
  }, []);
  const manejarAgregarMetrica = useCallback(() => {
    const nuevaUiId = agregarMetrica();
    if (nuevaUiId) {
      metricaPendienteFocusRef.current = nuevaUiId;
    }
  }, [agregarMetrica]);

  const abrirVistaDesdeTopbar = useCallback(async (nuevaVista) => {
    if (vistaActiva === nuevaVista) {
      return;
    }

    let tieneCambios = false;
    let etiqueta = '';
    let restaurarFn = null;

    if (vistaActiva === VISTA_CULTOS) {
      tieneCambios = tieneCambiosCultos;
      etiqueta = 'cultos';
      restaurarFn = restaurarCultos;
    } else if (vistaActiva === VISTA_METRICAS) {
      tieneCambios = tieneCambiosMetricas;
      etiqueta = 'métricas';
      restaurarFn = restaurarMetricas;
    } else if (vistaActiva === VISTA_PROCEDENCIAS) {
      tieneCambios = tieneCambiosProcedencias;
      etiqueta = 'procedencias';
      restaurarFn = restaurarProcedencias;
    }

    if (tieneCambios && restaurarFn) {
      const confirmado = await confirmar(
        `Tiene cambios sin guardar en ${etiqueta}. ¿Desea descartarlos y cerrar?`
      );
      if (!confirmado) {
        return;
      }
      restaurarFn();
    }

    setVistaActiva(nuevaVista);
  }, [
    vistaActiva,
    tieneCambiosCultos,
    tieneCambiosMetricas,
    tieneCambiosProcedencias,
    restaurarCultos,
    restaurarMetricas,
    restaurarProcedencias
  ]);

  useEffect(() => {
    const manejarAbrirCultos = () => { void abrirVistaDesdeTopbar(VISTA_CULTOS); };
    const manejarAbrirMetricas = () => { void abrirVistaDesdeTopbar(VISTA_METRICAS); };
    const manejarAbrirProcedencias = () => { void abrirVistaDesdeTopbar(VISTA_PROCEDENCIAS); };
    const manejarAbrirCategorias = () => { void abrirVistaDesdeTopbar(VISTA_CATEGORIAS_METRICAS); };
    const manejarAbrirUsuarios = () => { void abrirVistaDesdeTopbar(VISTA_USUARIOS); };

    window.addEventListener(EVENT_ADMIN_ABRIR_CULTOS, manejarAbrirCultos);
    window.addEventListener(EVENT_ADMIN_ABRIR_METRICAS, manejarAbrirMetricas);
    window.addEventListener(EVENT_ADMIN_ABRIR_PROCEDENCIAS, manejarAbrirProcedencias);
    window.addEventListener(EVENT_ADMIN_ABRIR_CATEGORIAS_METRICAS, manejarAbrirCategorias);
    window.addEventListener(EVENT_ADMIN_ABRIR_USUARIOS, manejarAbrirUsuarios);

    return () => {
      window.removeEventListener(EVENT_ADMIN_ABRIR_CULTOS, manejarAbrirCultos);
      window.removeEventListener(EVENT_ADMIN_ABRIR_METRICAS, manejarAbrirMetricas);
      window.removeEventListener(EVENT_ADMIN_ABRIR_PROCEDENCIAS, manejarAbrirProcedencias);
      window.removeEventListener(EVENT_ADMIN_ABRIR_CATEGORIAS_METRICAS, manejarAbrirCategorias);
      window.removeEventListener(EVENT_ADMIN_ABRIR_USUARIOS, manejarAbrirUsuarios);
    };
  }, [abrirVistaDesdeTopbar]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(EVENT_ADMIN_VISTA_ACTIVA, {
        detail: { vista: vistaActiva }
      })
    );
  }, [vistaActiva]);

  useEffect(() => {
    const metricaPendienteFocus = metricaPendienteFocusRef.current;
    if (!metricaPendienteFocus) {
      return;
    }
    const input = metricaInputRefs.current.get(metricaPendienteFocus);
    if (!input) {
      return;
    }
    input.focus();
    input.select?.();
    input.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    metricaPendienteFocusRef.current = null;
  }, [metricas]);

  const mostrarResumen = vistaActiva === VISTA_RESUMEN;
  const mostrarCultos = vistaActiva === VISTA_CULTOS;
  const mostrarMetricas = vistaActiva === VISTA_METRICAS;
  const mostrarProcedencias = vistaActiva === VISTA_PROCEDENCIAS;
  const mostrarCategoriasMetricas = vistaActiva === VISTA_CATEGORIAS_METRICAS;
  const mostrarUsuarios = vistaActiva === VISTA_USUARIOS;
  const mensajeEncabezado = setupCompleto
    ? 'Configuración inicial completada. Ya puede registrar asistencia, ver reportes/estadísticas y crear usuarios; también puede editar el setup cuando lo necesite.'
    : 'Complete la configuración inicial para habilitar registro, reportes y estadísticas. Debe crear al menos un administrador definitivo.';
  const textoBotonPrincipal = setupCompleto
    ? 'Editar setup'
    : (finalizando ? 'Finalizando...' : 'Finalizar setup inicial');

  const manejarAccionPrincipalSetup = async () => {
    if (setupCompleto) {
      setVistaActiva(VISTA_CULTOS);
      return;
    }
    await finalizarSetup();
  };

  const manejarEliminarCulto = async (index) => {
    if (cultos.length <= 1) {
      return;
    }
    const confirmado = await confirmar(
      '¿Desea eliminar este culto? Si ya existen registros asociados, el sistema podría rechazar el cambio al guardar.'
    );
    if (!confirmado) {
      return;
    }
    eliminarCulto(index);
  };

  const manejarEliminarMetrica = async (index) => {
    if (metricas.length <= 1 || metricas[index]?.es_fija) {
      return;
    }
    const confirmado = await confirmar(
      '¿Desea eliminar esta métrica? Esta acción puede afectar reportes y comparaciones configuradas.'
    );
    if (!confirmado) {
      return;
    }
    eliminarMetrica(index);
  };

  const manejarEliminarProcedencia = async (index) => {
    if (procedencias.length <= 1) {
      return;
    }
    const confirmado = await confirmar(
      '¿Desea eliminar esta procedencia? Si ya existen registros asociados, el sistema puede rechazar el cambio al guardar.'
    );
    if (!confirmado) {
      return;
    }
    eliminarProcedencia(index);
  };

  const manejarCerrarPanelConDescartar = async (etiqueta, tieneCambios, restaurarFn) => {
    if (tieneCambios) {
      const confirmado = await confirmar(
        `Tiene cambios sin guardar en ${etiqueta}. ¿Desea descartarlos y cerrar?`
      );
      if (!confirmado) {
        return;
      }
      restaurarFn();
    }
    setVistaActiva(VISTA_RESUMEN);
  };

  const manejarLimpiarPanel = (tieneCambios, restaurarFn) => {
    if (!tieneCambios) {
      return;
    }
    restaurarFn();
  };

  const indiceInfoActivo = INFO_SECCIONES.findIndex((item) => item.id === infoSeccionActiva);
  const metaInfoActiva = INFO_SECCIONES[indiceInfoActivo >= 0 ? indiceInfoActivo : 0];

  const navegarInfo = (direccion) => {
    const total = INFO_SECCIONES.length;
    const base = indiceInfoActivo >= 0 ? indiceInfoActivo : 0;
    const siguiente = (base + direccion + total) % total;
    setInfoSeccionActiva(INFO_SECCIONES[siguiente].id);
  };

  return (
    <div className="container-fluid py-4">
      {mostrarResumen && (
        <>
          <div className="card border-0 shadow-sm mb-4 admin-setup-hero">
            <div className="card-body">
              <div className="mb-3">
                <p className="text-muted mb-0">
                  {mensajeEncabezado}
                </p>
              </div>

              <div className="row g-3 align-items-stretch">
                <div className="col-12 col-lg-8">
                  <div className="alert alert-iasd mb-0">
                    <strong>Estado actual:</strong> {resumen.estado_setup}
                    {resumen.setup_completado_en ? ` | completado en ${resumen.setup_completado_en}` : ''}
                    {resumen.ultima_revision_en ? ` | última revisión ${resumen.ultima_revision_en}` : ''}
                  </div>
                </div>
                <div className="col-12 col-lg-4">
                  <div className="d-flex flex-column gap-2 h-100 admin-setup-side-actions">
                    <BadgeEstado completo={setupCompleto} />
                    <button
                      type="button"
                      className={`btn w-100 ${setupCompleto ? 'btn-primary' : 'btn-success'}`}
                      onClick={manejarAccionPrincipalSetup}
                      disabled={!setupCompleto && finalizando}
                    >
                      {textoBotonPrincipal}
                    </button>
                  </div>
                </div>
              </div>

              {esAdminTemporal && (
                <div className="alert alert-warning mt-3 mb-0">
                  <strong>Cuenta ADMIN temporal:</strong>{' '}
                  {Number.isInteger(diasRestantes)
                    ? `dispone de ${diasRestantes} día(s) restantes para completar el setup inicial.`
                    : 'debe completarse el setup inicial dentro de los 5 días posteriores a la creación del usuario.'}
                </div>
              )}
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-12 col-md-6 col-lg-3">
              <EstadoBloqueCard
                titulo="Cultos de la instancia"
                detalle={`${cultosActivos} activo(s) de ${cultos.length} configurado(s)`}
                completo={estadoBloques.cultos}
              />
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <EstadoBloqueCard
                titulo="Métricas del formulario"
                detalle={`${metricasHabilitadas} habilitada(s) de ${metricas.length} configurada(s)`}
                completo={estadoBloques.metricas}
              />
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <EstadoBloqueCard
                titulo="Procedencias (1 a 10)"
                detalle={`${procedenciasActivas} activa(s) de ${procedencias.length} configurada(s)`}
                completo={estadoBloques.procedencias}
              />
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <EstadoBloqueCard
                titulo="Usuarios administradores"
                detalle={`${adminsDefinitivosActivos} administrador(es) definitivo(s) activo(s)`}
                completo={estadoBloques.usuarios}
              />
            </div>
          </div>

          {faltantesVisibles.length > 0 && (
            <div className="alert alert-warning">
              <strong className="d-block mb-2">Pendientes por completar:</strong>
              <ul className="mb-0">
                {faltantesVisibles.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="alert alert-secondary mb-0 admin-setup-help">
            <div>
              Use los botones de la esquina superior derecha para abrir cultos, métricas, procedencias, información y usuarios.
              Solo se muestra un panel a la vez para reducir scroll y mejorar uso en teléfono.
            </div>
            <div className="admin-quick-links">
              <button
                type="button"
                className="admin-quick-link-btn"
                onClick={() => { void abrirVistaDesdeTopbar(VISTA_CULTOS); }}
              >
                <i className="bi bi-calendar-week" aria-hidden="true"></i>
                Ir a Cultos
              </button>
              <button
                type="button"
                className="admin-quick-link-btn"
                onClick={() => { void abrirVistaDesdeTopbar(VISTA_METRICAS); }}
              >
                <i className="bi bi-bar-chart-line" aria-hidden="true"></i>
                Ir a Métricas
              </button>
              <button
                type="button"
                className="admin-quick-link-btn"
                onClick={() => { void abrirVistaDesdeTopbar(VISTA_PROCEDENCIAS); }}
              >
                <i className="bi bi-people" aria-hidden="true"></i>
                Ir a Procedencias
              </button>
              <button
                type="button"
                className="admin-quick-link-btn"
                onClick={() => {
                  setInfoSeccionActiva('METRICAS');
                  void abrirVistaDesdeTopbar(VISTA_CATEGORIAS_METRICAS);
                }}
              >
                <i className="bi bi-journal-text" aria-hidden="true"></i>
                Ir a Información
              </button>
              <button
                type="button"
                className="admin-quick-link-btn"
                onClick={() => { void abrirVistaDesdeTopbar(VISTA_USUARIOS); }}
              >
                <i className="bi bi-person-gear" aria-hidden="true"></i>
                Ir a Usuarios
              </button>
            </div>
          </div>
        </>
      )}

      {mostrarCultos && (
        <div className="card shadow-sm mb-4 admin-setup-panel">
          <div className="card-header d-flex justify-content-between align-items-center gap-2">
            <div className="d-flex align-items-center gap-2">
              <h5 className="mb-0" style={{ color: '#FFFFFF' }}>Cultos de la instancia</h5>
              <span className="badge text-bg-light">{cultos.length}</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button type="button" className="btn btn-light btn-sm" onClick={agregarCulto}>
                Agregar culto
              </button>
              <button
                type="button"
                className="btn btn-outline-light btn-sm"
                onClick={() => manejarLimpiarPanel(tieneCambiosCultos, restaurarCultos)}
                disabled={!tieneCambiosCultos}
              >
                Limpiar
              </button>
              <BotonCerrarPanel
                onClick={() => {
                  void manejarCerrarPanelConDescartar('cultos', tieneCambiosCultos, restaurarCultos);
                }}
                label="Cerrar panel de cultos"
              />
            </div>
          </div>
          <div className="card-body">
            {erroresCultos.general && <div className="alert alert-danger">{erroresCultos.general}</div>}

            <div className="table-responsive admin-setup-tabla-wrap">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Día</th>
                    <th>Hora</th>
                    <th>Activo</th>
                    <th className="text-center admin-col-acciones">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cultos.map((item, index) => {
                    const filaErrores = erroresCultos[`fila_${index}`] || {};
                    return (
                      <tr key={item.ui_id}>
                        <td>
                          <input
                            className={`form-control form-control-sm ${filaErrores.nombre ? 'is-invalid' : ''}`}
                            value={item.nombre}
                            maxLength={20}
                            onChange={(event) => cambiarCulto(index, 'nombre', event.target.value)}
                          />
                        </td>
                        <td>
                          <select
                            className={`form-select form-select-sm ${filaErrores.dia_semana ? 'is-invalid' : ''}`}
                            value={item.dia_semana}
                            onChange={(event) => cambiarCulto(index, 'dia_semana', event.target.value)}
                          >
                            {DIA_OPCIONES.map((dia) => (
                              <option key={dia.valor} value={dia.valor}>{dia.etiqueta}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="time"
                            className={`form-control form-control-sm ${filaErrores.hora_inicio ? 'is-invalid' : ''}`}
                            value={item.hora_inicio}
                            onChange={(event) => cambiarCulto(index, 'hora_inicio', event.target.value)}
                          />
                        </td>
                        <td className="text-center">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={!!item.activo}
                            onChange={(event) => cambiarCulto(index, 'activo', event.target.checked)}
                          />
                        </td>
                        <td className="text-center admin-col-acciones">
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm admin-table-icon-btn"
                            onClick={() => { void manejarEliminarCulto(index); }}
                            disabled={cultos.length <= 1}
                            title="Eliminar culto"
                            aria-label="Eliminar culto"
                          >
                            <i className="bi bi-trash" aria-hidden="true"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {tieneCambiosCultos && (
              <div className="d-flex justify-content-end mt-3">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={guardarCultos}
                  disabled={guardandoCultos}
                >
                  {guardandoCultos ? 'Guardando...' : 'Guardar cultos'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {mostrarMetricas && (
        <div className="card shadow-sm mb-4 admin-setup-panel">
          <div className="card-header d-flex justify-content-between align-items-center gap-2">
            <div className="d-flex align-items-center gap-2">
              <h5 className="mb-0" style={{ color: '#FFFFFF' }}>Métricas del formulario</h5>
              <span className="badge text-bg-light">{metricas.length}</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button type="button" className="btn btn-light btn-sm" onClick={manejarAgregarMetrica}>
                Agregar métrica
              </button>
              <button
                type="button"
                className="btn btn-outline-light btn-sm"
                onClick={() => manejarLimpiarPanel(tieneCambiosMetricas, restaurarMetricas)}
                disabled={!tieneCambiosMetricas}
              >
                Limpiar
              </button>
              <BotonCerrarPanel
                onClick={() => {
                  void manejarCerrarPanelConDescartar('métricas', tieneCambiosMetricas, restaurarMetricas);
                }}
                label="Cerrar panel de métricas"
              />
            </div>
          </div>
          <div className="card-body">
            <div className="admin-metricas-note mb-3">
              <i className="bi bi-info-circle-fill" aria-hidden="true"></i>
              <div>
                Las métricas base se validan automáticamente por el sistema. Para métricas nuevas, seleccione la
                categoría correspondiente y revise
                {' '}
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 align-baseline"
                  onClick={() => {
                    setInfoSeccionActiva('METRICAS');
                    void abrirVistaDesdeTopbar(VISTA_CATEGORIAS_METRICAS);
                  }}
                >
                  Información
                </button>
                .
                <div className="small text-muted mt-1">
                  Procedencia y Visitas se generan automáticamente al guardar una procedencia
                  (cantidad de visitas y nombres de visitas).
                  {' '}
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 align-baseline"
                    onClick={() => { void abrirVistaDesdeTopbar(VISTA_PROCEDENCIAS); }}
                  >
                    Ir a Procedencias
                  </button>
                </div>
              </div>
            </div>

            <div className="table-responsive admin-setup-tabla-wrap admin-setup-tabla-wrap-metricas">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Métrica</th>
                    <th>Categoría</th>
                    <th>Habilitado</th>
                    <th>Obligatorio</th>
                    <th className="text-center admin-col-acciones">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {metricas.map((item, index) => {
                    const filaErrores = erroresMetricas[`fila_${index}`] || {};
                    const categoriaActual = String(item.categoria || '').trim().toLowerCase();
                    const categoriaBloqueada = item.es_fija || CATEGORIAS_AUTOMATICAS.has(categoriaActual);
                    const opcionesCategoria = categoriaBloqueada
                      ? CATEGORIAS_METRICA_OPCIONES
                      : CATEGORIAS_METRICA_OPCIONES_MANUALES;

                    return (
                      <tr key={item.ui_id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <input
                              ref={(node) => registrarInputMetricaRef(item.ui_id, node)}
                              className={`form-control form-control-sm ${filaErrores.etiqueta ? 'is-invalid' : ''}`}
                              value={item.etiqueta}
                              placeholder="Nueva métrica"
                              onChange={(event) => cambiarMetrica(index, 'etiqueta', event.target.value)}
                              disabled={item.es_fija}
                            />
                            {item.es_fija && <span className="badge text-bg-secondary">Base</span>}
                          </div>
                          {filaErrores.etiqueta && (
                            <div className="invalid-feedback d-block">{filaErrores.etiqueta}</div>
                          )}
                        </td>
                        <td>
                          <select
                            className={`form-select form-select-sm ${filaErrores.categoria ? 'is-invalid' : ''}`}
                            value={item.categoria || 'adicionales'}
                            onChange={(event) => cambiarMetrica(index, 'categoria', event.target.value)}
                            disabled={categoriaBloqueada}
                          >
                            {opcionesCategoria.map((opcion) => (
                              <option key={opcion.valor} value={opcion.valor}>
                                {opcion.etiqueta}
                              </option>
                            ))}
                          </select>
                          {filaErrores.categoria && (
                            <div className="invalid-feedback d-block">{filaErrores.categoria}</div>
                          )}
                        </td>
                        <td className="text-center">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={!!item.habilitado}
                            onChange={(event) => cambiarMetrica(index, 'habilitado', event.target.checked)}
                          />
                        </td>
                        <td className="text-center">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={!!item.obligatorio}
                            onChange={(event) => cambiarMetrica(index, 'obligatorio', event.target.checked)}
                            disabled={!item.habilitado}
                          />
                        </td>
                        <td className="text-center admin-col-acciones">
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm admin-table-icon-btn"
                            onClick={() => { void manejarEliminarMetrica(index); }}
                            disabled={metricas.length <= 1 || item.es_fija}
                            title={item.es_fija ? 'Métrica base (no eliminable)' : 'Eliminar métrica'}
                            aria-label={item.es_fija ? 'Métrica base no eliminable' : 'Eliminar métrica'}
                          >
                            <i className="bi bi-trash" aria-hidden="true"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {tieneCambiosMetricas && (
              <div className="d-flex justify-content-end mt-3">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={guardarMetricas}
                  disabled={guardandoMetricas}
                >
                  {guardandoMetricas ? 'Guardando...' : 'Guardar métricas'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {mostrarCategoriasMetricas && (
        <div className="card shadow-sm mb-4 admin-setup-panel">
          <div className="card-header d-flex justify-content-between align-items-center gap-2">
            <h5 className="mb-0" style={{ color: '#FFFFFF' }}>Información</h5>
            <BotonCerrarPanel
              onClick={() => setVistaActiva(VISTA_RESUMEN)}
              label="Cerrar panel de información"
            />
          </div>
          <div className="card-body">
            <div className="admin-info-switch mb-3">
              <button
                type="button"
                className="btn btn-outline-primary btn-sm admin-info-arrow-btn"
                onClick={() => navegarInfo(-1)}
                aria-label="Ir a la información anterior"
                title="Anterior"
              >
                <i className="bi bi-chevron-left" aria-hidden="true"></i>
              </button>

              <div className="admin-info-switch-title">
                <span className="badge text-bg-secondary">{indiceInfoActivo + 1}/{INFO_SECCIONES.length}</span>
                <span>
                  <i className={`bi ${metaInfoActiva.icono} me-2`} aria-hidden="true"></i>
                  {metaInfoActiva.etiqueta}
                </span>
              </div>

              <button
                type="button"
                className="btn btn-outline-primary btn-sm admin-info-arrow-btn"
                onClick={() => navegarInfo(1)}
                aria-label="Ir a la siguiente información"
                title="Siguiente"
              >
                <i className="bi bi-chevron-right" aria-hidden="true"></i>
              </button>
            </div>

            <div className="admin-info-tab-list mb-3">
              {INFO_SECCIONES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`admin-info-tab-btn ${infoSeccionActiva === item.id ? 'is-active' : ''}`}
                  onClick={() => setInfoSeccionActiva(item.id)}
                >
                  <i className={`bi ${item.icono}`} aria-hidden="true"></i>
                  {item.etiqueta}
                </button>
              ))}
            </div>

            {infoSeccionActiva === 'METRICAS' ? (
              <InfoCategoriasMetricas
                categorias={CATEGORIAS_METRICA_OPCIONES}
                descripciones={DESCRIPCIONES_CATEGORIA_METRICA}
              />
            ) : (
              <InfoRolesUsuarios roles={ACCESO_ROLES_PRELIMINAR} />
            )}
          </div>
        </div>
      )}

      {mostrarUsuarios && (
        <div className="card shadow-sm mb-4 admin-setup-panel">
          <div className="card-header d-flex justify-content-between align-items-center gap-2">
            <h5 className="mb-0" style={{ color: '#FFFFFF' }}>Usuarios</h5>
            <BotonCerrarPanel
              onClick={() => setVistaActiva(VISTA_RESUMEN)}
              label="Cerrar panel de usuarios"
            />
          </div>
          <div className="card-body">
            <UsuarioPage modo="panel" />
          </div>
        </div>
      )}

      {mostrarProcedencias && (
        <div className="card shadow-sm mb-4 admin-setup-panel">
          <div className="card-header d-flex justify-content-between align-items-center gap-2">
            <div className="d-flex align-items-center gap-2">
              <h5 className="mb-0" style={{ color: '#FFFFFF' }}>Procedencias (1 a 10)</h5>
              <span className="badge text-bg-light">{procedencias.length}</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-light btn-sm"
                onClick={agregarProcedencia}
                disabled={procedencias.length >= 10}
              >
                Agregar procedencia
              </button>
              <button
                type="button"
                className="btn btn-outline-light btn-sm"
                onClick={() => manejarLimpiarPanel(tieneCambiosProcedencias, restaurarProcedencias)}
                disabled={!tieneCambiosProcedencias}
              >
                Limpiar
              </button>
              <BotonCerrarPanel
                onClick={() => {
                  void manejarCerrarPanelConDescartar(
                    'procedencias',
                    tieneCambiosProcedencias,
                    restaurarProcedencias
                  );
                }}
                label="Cerrar panel de procedencias"
              />
            </div>
          </div>
          <div className="card-body">
            {erroresProcedencias.general && <div className="alert alert-danger">{erroresProcedencias.general}</div>}

            <div className="table-responsive admin-setup-tabla-wrap">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Activo</th>
                    <th className="text-center admin-col-acciones">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {procedencias.map((item, index) => {
                    const filaErrores = erroresProcedencias[`fila_${index}`] || {};
                    return (
                      <tr key={item.ui_id}>
                        <td>
                          <input
                            className={`form-control form-control-sm ${filaErrores.nombre ? 'is-invalid' : ''}`}
                            value={item.nombre}
                            onChange={(event) => cambiarProcedencia(index, 'nombre', event.target.value)}
                          />
                        </td>
                        <td className="text-center">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={!!item.activo}
                            onChange={(event) => cambiarProcedencia(index, 'activo', event.target.checked)}
                          />
                        </td>
                        <td className="text-center admin-col-acciones">
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm admin-table-icon-btn"
                            onClick={() => { void manejarEliminarProcedencia(index); }}
                            disabled={procedencias.length <= 1}
                            title="Eliminar procedencia"
                            aria-label="Eliminar procedencia"
                          >
                            <i className="bi bi-trash" aria-hidden="true"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {tieneCambiosProcedencias && (
              <div className="d-flex justify-content-end mt-3">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={guardarProcedencias}
                  disabled={guardandoProcedencias}
                >
                  {guardandoProcedencias ? 'Guardando...' : 'Guardar procedencias'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
