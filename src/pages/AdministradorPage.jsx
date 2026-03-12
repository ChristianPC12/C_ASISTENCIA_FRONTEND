import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSetupAdministrador } from '../hooks/useSetupAdministrador';
import { useAuth } from '../hooks/useAuth';
import {
  EVENT_ADMIN_ABRIR_CULTOS,
  EVENT_ADMIN_ABRIR_METRICAS,
  EVENT_ADMIN_ABRIR_PROCEDENCIAS,
  EVENT_ADMIN_ABRIR_REGLAS_METRICAS
} from '../config/events';
import { confirmar } from '../utils/notify';

const VISTA_RESUMEN = 'RESUMEN';
const VISTA_CULTOS = 'CULTOS';
const VISTA_METRICAS = 'METRICAS';
const VISTA_PROCEDENCIAS = 'PROCEDENCIAS';
const VISTA_REGLAS_METRICAS = 'REGLAS_METRICAS';

function textoReglaDependencia(regla) {
  if (regla === 'SI_MAYOR_CERO') return 'Si la métrica base es mayor a cero';
  if (regla === 'AMBOS_O_NINGUNO') return 'Ambos o ninguno';
  return 'Sin regla';
}

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
      return 'Habilitar al menos una métrica';
    case 'dependencias_metricas':
      return 'Corregir dependencias entre métricas';
    default:
      return item;
  }
}

function resolverEstadoBloques(faltantes = []) {
  const lista = new Set(Array.isArray(faltantes) ? faltantes : []);
  return {
    cultos: !lista.has('cultos'),
    metricas: !lista.has('metricas') && !lista.has('dependencias_metricas'),
    procedencias: !lista.has('procedencias_minimas') && !lista.has('procedencias_maximas')
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
  const metricaPendienteFocusRef = useRef(null);
  const metricaInputRefs = useRef(new Map());
  const setupCompleto = resumen.estado_setup === 'COMPLETO' && !resumen.bloqueada_operacion;
  const faltantes = useMemo(
    () => (Array.isArray(resumen.faltantes) ? resumen.faltantes : []),
    [resumen.faltantes]
  );
  const estadoBloques = useMemo(() => resolverEstadoBloques(faltantes), [faltantes]);
  const diasRestantes = Number.isInteger(diasRestantesPassword) ? Math.max(diasRestantesPassword, 0) : null;
  const cultosActivos = cultos.filter((item) => item.activo).length;
  const metricasHabilitadas = metricas.filter((item) => item.habilitado).length;
  const procedenciasActivas = procedencias.filter((item) => item.activo).length;
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

  const abrirVistaDesdeTopbar = useCallback((nuevaVista) => {
    if (vistaActiva === nuevaVista) {
      return;
    }

    if (vistaActiva === VISTA_CULTOS && tieneCambiosCultos) {
      restaurarCultos();
    }
    if (vistaActiva === VISTA_METRICAS && tieneCambiosMetricas) {
      restaurarMetricas();
    }
    if (vistaActiva === VISTA_PROCEDENCIAS && tieneCambiosProcedencias) {
      restaurarProcedencias();
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
    const manejarAbrirCultos = () => abrirVistaDesdeTopbar(VISTA_CULTOS);
    const manejarAbrirMetricas = () => abrirVistaDesdeTopbar(VISTA_METRICAS);
    const manejarAbrirProcedencias = () => abrirVistaDesdeTopbar(VISTA_PROCEDENCIAS);
    const manejarAbrirReglasMetricas = () => abrirVistaDesdeTopbar(VISTA_REGLAS_METRICAS);

    window.addEventListener(EVENT_ADMIN_ABRIR_CULTOS, manejarAbrirCultos);
    window.addEventListener(EVENT_ADMIN_ABRIR_METRICAS, manejarAbrirMetricas);
    window.addEventListener(EVENT_ADMIN_ABRIR_PROCEDENCIAS, manejarAbrirProcedencias);
    window.addEventListener(EVENT_ADMIN_ABRIR_REGLAS_METRICAS, manejarAbrirReglasMetricas);

    return () => {
      window.removeEventListener(EVENT_ADMIN_ABRIR_CULTOS, manejarAbrirCultos);
      window.removeEventListener(EVENT_ADMIN_ABRIR_METRICAS, manejarAbrirMetricas);
      window.removeEventListener(EVENT_ADMIN_ABRIR_PROCEDENCIAS, manejarAbrirProcedencias);
      window.removeEventListener(EVENT_ADMIN_ABRIR_REGLAS_METRICAS, manejarAbrirReglasMetricas);
    };
  }, [abrirVistaDesdeTopbar]);

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
  const mostrarReglasMetricas = vistaActiva === VISTA_REGLAS_METRICAS;
  const opcionesDependenciaMetricas = useMemo(
    () => metricas.map((item) => ({ clave: item.clave, etiqueta: item.etiqueta || item.clave })),
    [metricas]
  );
  const etiquetaMetricaPorClave = useMemo(
    () => Object.fromEntries(metricas.map((item) => [item.clave, item.etiqueta || item.clave])),
    [metricas]
  );
  const mensajeEncabezado = setupCompleto
    ? 'Configuración inicial completada. Ya puede registrar asistencia, ver reportes/estadísticas y crear usuarios; también puede editar el setup cuando lo necesite.'
    : 'Complete la configuración inicial para habilitar registro, reportes, estadísticas y usuarios.';
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
            <div className="col-12 col-md-4">
              <EstadoBloqueCard
                titulo="Cultos de la instancia"
                detalle={`${cultosActivos} activo(s) de ${cultos.length} configurado(s)`}
                completo={estadoBloques.cultos}
              />
            </div>
            <div className="col-12 col-md-4">
              <EstadoBloqueCard
                titulo="Métricas del formulario"
                detalle={`${metricasHabilitadas} habilitada(s) de ${metricas.length} configurada(s)`}
                completo={estadoBloques.metricas}
              />
            </div>
            <div className="col-12 col-md-4">
              <EstadoBloqueCard
                titulo="Procedencias (1 a 10)"
                detalle={`${procedenciasActivas} activa(s) de ${procedencias.length} configurada(s)`}
                completo={estadoBloques.procedencias}
              />
            </div>
          </div>

          {faltantes.length > 0 && (
            <div className="alert alert-warning">
              <strong className="d-block mb-2">Pendientes por completar:</strong>
              <ul className="mb-0">
                {faltantes.map((item) => (
                  <li key={item}>{traducirFaltante(item)}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="alert alert-secondary mb-0">
            Use los botones de la esquina superior derecha para abrir cultos, métricas, procedencias o reglas.
            Solo se muestra un panel a la vez para reducir scroll y mejorar uso en teléfono.
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

      {mostrarReglasMetricas && (
        <div className="card shadow-sm mb-4 admin-setup-panel">
          <div className="card-header d-flex justify-content-between align-items-center gap-2">
            <h5 className="mb-0" style={{ color: '#FFFFFF' }}>Reglas de métricas</h5>
            <BotonCerrarPanel
              onClick={() => {
                setVistaActiva(VISTA_RESUMEN);
              }}
              label="Cerrar panel de reglas de métricas"
            />
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-12 col-lg-6">
                <div className="card h-100 admin-reglas-card">
                  <div className="card-body">
                    <h6 className="mb-2">Métricas base del sistema</h6>
                    <p className="mb-0 small text-muted">
                      Las métricas base ya vienen definidas. No se pueden eliminar ni editar en estructura; solo puede
                      cambiar habilitado y obligatorio.
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-12 col-lg-6">
                <div className="card h-100 admin-reglas-card">
                  <div className="card-body">
                    <h6 className="mb-2">Dependencias entre métricas</h6>
                    <p className="mb-0 small text-muted">
                      En métricas nuevas, "Depende de" se define con selector. Si deshabilita una métrica, automáticamente
                      deja de ser obligatoria.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <h6 className="mb-2">Reglas disponibles</h6>
              <ul className="mb-0 small admin-reglas-list">
                <li><strong>SI_MAYOR_CERO:</strong> exige la métrica dependiente cuando la métrica base es mayor a 0.</li>
                <li><strong>AMBOS_O_NINGUNO:</strong> las dos métricas deben comportarse en par (ambas o ninguna).</li>
                <li><strong>Puntualidad:</strong> `llegaron_antes_hora` y `llegaron_despues_hora` siempre deben mantenerse en par.</li>
                <li className="admin-regla-opcional">
                  <i className="bi bi-stars" aria-hidden="true"></i>
                  <span>
                    <strong>Métricas nuevas:</strong> crear métricas adicionales es opcional y solo para casos
                    específicos de una iglesia o grupo.
                  </span>
                </li>
              </ul>
            </div>
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
            {erroresMetricas.general && <div className="alert alert-danger">{erroresMetricas.general}</div>}

            <div className="admin-metricas-note mb-3">
              <i className="bi bi-info-circle-fill" aria-hidden="true"></i>
              <span>
                Use el botón <strong>Reglas</strong> para ver el detalle funcional de dependencias y métricas base.
              </span>
            </div>

            <div className="table-responsive admin-setup-tabla-wrap admin-setup-tabla-wrap-metricas">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Métrica</th>
                    <th>Depende de</th>
                    <th>Regla</th>
                    <th>Habilitado</th>
                    <th>Obligatorio</th>
                    <th className="text-center admin-col-acciones">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {metricas.map((item, index) => {
                    const filaErrores = erroresMetricas[`fila_${index}`] || {};
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
                          {item.es_fija ? (
                            <span className="admin-metrica-meta">
                              {item.depende_de_clave
                                ? (etiquetaMetricaPorClave[item.depende_de_clave] || item.depende_de_clave)
                                : 'Sin dependencia'}
                            </span>
                          ) : (
                            <select
                              className={`form-select form-select-sm ${filaErrores.depende_de_clave ? 'is-invalid' : ''}`}
                              value={item.depende_de_clave || ''}
                              onChange={(event) => cambiarMetrica(index, 'depende_de_clave', event.target.value)}
                            >
                              <option value="">Sin dependencia</option>
                              {opcionesDependenciaMetricas
                                .filter((opcion) => opcion.clave !== item.clave)
                                .map((opcion) => (
                                  <option key={opcion.clave} value={opcion.clave}>{opcion.etiqueta}</option>
                                ))}
                            </select>
                          )}
                          {filaErrores.depende_de_clave && (
                            <div className="invalid-feedback d-block">{filaErrores.depende_de_clave}</div>
                          )}
                        </td>
                        <td>
                          {item.es_fija ? (
                            <span className="admin-metrica-meta">{textoReglaDependencia(item.regla_dependencia)}</span>
                          ) : (
                            <select
                              className={`form-select form-select-sm ${filaErrores.regla_dependencia ? 'is-invalid' : ''}`}
                              value={item.regla_dependencia || ''}
                              onChange={(event) => cambiarMetrica(index, 'regla_dependencia', event.target.value)}
                              disabled={!item.depende_de_clave}
                            >
                              <option value="">Sin regla</option>
                              <option value="SI_MAYOR_CERO">SI_MAYOR_CERO</option>
                              <option value="AMBOS_O_NINGUNO">AMBOS_O_NINGUNO</option>
                            </select>
                          )}
                          {filaErrores.regla_dependencia && (
                            <div className="invalid-feedback d-block">{filaErrores.regla_dependencia}</div>
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
