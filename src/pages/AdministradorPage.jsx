import { useEffect, useMemo, useState } from 'react';
import { useSetupAdministrador } from '../hooks/useSetupAdministrador';
import { useAuth } from '../hooks/useAuth';
import {
  EVENT_ADMIN_ABRIR_CULTOS,
  EVENT_ADMIN_ABRIR_METRICAS,
  EVENT_ADMIN_ABRIR_PROCEDENCIAS
} from '../config/events';

const VISTA_RESUMEN = 'RESUMEN';
const VISTA_CULTOS = 'CULTOS';
const VISTA_METRICAS = 'METRICAS';
const VISTA_PROCEDENCIAS = 'PROCEDENCIAS';

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
      return 'Reducir procedencias a maximo 10';
    case 'metricas':
      return 'Habilitar al menos una metrica';
    case 'dependencias_metricas':
      return 'Corregir dependencias entre metricas';
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

  const cerrarPanelActivo = () => setVistaActiva(VISTA_RESUMEN);

  useEffect(() => {
    const manejarAbrirCultos = () => setVistaActiva(VISTA_CULTOS);
    const manejarAbrirMetricas = () => setVistaActiva(VISTA_METRICAS);
    const manejarAbrirProcedencias = () => setVistaActiva(VISTA_PROCEDENCIAS);

    window.addEventListener(EVENT_ADMIN_ABRIR_CULTOS, manejarAbrirCultos);
    window.addEventListener(EVENT_ADMIN_ABRIR_METRICAS, manejarAbrirMetricas);
    window.addEventListener(EVENT_ADMIN_ABRIR_PROCEDENCIAS, manejarAbrirProcedencias);

    return () => {
      window.removeEventListener(EVENT_ADMIN_ABRIR_CULTOS, manejarAbrirCultos);
      window.removeEventListener(EVENT_ADMIN_ABRIR_METRICAS, manejarAbrirMetricas);
      window.removeEventListener(EVENT_ADMIN_ABRIR_PROCEDENCIAS, manejarAbrirProcedencias);
    };
  }, []);

  const mostrarResumen = vistaActiva === VISTA_RESUMEN;
  const mostrarCultos = vistaActiva === VISTA_CULTOS;
  const mostrarMetricas = vistaActiva === VISTA_METRICAS;
  const mostrarProcedencias = vistaActiva === VISTA_PROCEDENCIAS;

  return (
    <div className="container-fluid py-4">
      {mostrarResumen && (
        <>
          <div className="card border-0 shadow-sm mb-4 admin-setup-hero">
            <div className="card-body">
              <div className="mb-3">
                <p className="text-muted mb-0">
                  Complete la configuracion inicial para habilitar registro, reportes, estadisticas y usuarios.
                </p>
              </div>

              <div className="row g-3 align-items-stretch">
                <div className="col-12 col-lg-8">
                  <div className="alert alert-iasd mb-0">
                    <strong>Estado actual:</strong> {resumen.estado_setup}
                    {resumen.setup_completado_en ? ` | completado en ${resumen.setup_completado_en}` : ''}
                    {resumen.ultima_revision_en ? ` | ultima revision ${resumen.ultima_revision_en}` : ''}
                  </div>
                </div>
                <div className="col-12 col-lg-4">
                  <div className="d-flex flex-column gap-2 h-100 admin-setup-side-actions">
                    <BadgeEstado completo={setupCompleto} />
                    <button
                      type="button"
                      className="btn btn-success w-100"
                      onClick={finalizarSetup}
                      disabled={finalizando}
                    >
                      {finalizando ? 'Finalizando...' : 'Finalizar setup inicial'}
                    </button>
                  </div>
                </div>
              </div>

              {esAdminTemporal && (
                <div className="alert alert-warning mt-3 mb-0">
                  <strong>Cuenta ADMIN temporal:</strong>{' '}
                  {Number.isInteger(diasRestantes)
                    ? `dispones de ${diasRestantes} dia(s) restantes para completar el setup inicial.`
                    : 'debe completarse el setup inicial dentro de los 5 dias posteriores a la creacion del usuario.'}
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
                titulo="Metricas del formulario"
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
            Use los botones de la esquina superior derecha para abrir cultos, metricas o procedencias. Solo se
            muestra un formulario a la vez para reducir scroll y mejorar uso en telefono.
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
              <BotonCerrarPanel onClick={cerrarPanelActivo} label="Cerrar panel de cultos" />
            </div>
          </div>
          <div className="card-body">
            {erroresCultos.general && <div className="alert alert-danger">{erroresCultos.general}</div>}

            <div className="table-responsive admin-setup-tabla-wrap">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Codigo</th>
                    <th>Nombre</th>
                    <th>Dia</th>
                    <th>Hora</th>
                    <th>Orden</th>
                    <th>Activo</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cultos.map((item, index) => {
                    const filaErrores = erroresCultos[`fila_${index}`] || {};
                    return (
                      <tr key={item.ui_id}>
                        <td>
                          <input
                            className={`form-control form-control-sm ${filaErrores.codigo ? 'is-invalid' : ''}`}
                            value={item.codigo}
                            onChange={(event) => cambiarCulto(index, 'codigo', event.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            className={`form-control form-control-sm ${filaErrores.nombre ? 'is-invalid' : ''}`}
                            value={item.nombre}
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
                        <td>
                          <input
                            type="number"
                            className={`form-control form-control-sm ${filaErrores.orden ? 'is-invalid' : ''}`}
                            value={item.orden}
                            min={1}
                            max={99}
                            onChange={(event) => cambiarCulto(index, 'orden', event.target.value)}
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
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => eliminarCulto(index)}
                            disabled={cultos.length <= 1}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

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
          </div>
        </div>
      )}

      {mostrarMetricas && (
        <div className="card shadow-sm mb-4 admin-setup-panel">
          <div className="card-header d-flex justify-content-between align-items-center gap-2">
            <div className="d-flex align-items-center gap-2">
              <h5 className="mb-0" style={{ color: '#FFFFFF' }}>Metricas del formulario</h5>
              <span className="badge text-bg-light">{metricas.length}</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button type="button" className="btn btn-light btn-sm" onClick={agregarMetrica}>
                Agregar metrica
              </button>
              <BotonCerrarPanel onClick={cerrarPanelActivo} label="Cerrar panel de metricas" />
            </div>
          </div>
          <div className="card-body">
            {erroresMetricas.general && <div className="alert alert-danger">{erroresMetricas.general}</div>}

            <div className="admin-metricas-regla mb-3">
              <i className="bi bi-info-circle-fill" aria-hidden="true"></i>
              <span>
                <strong>Regla de puntualidad:</strong> <code>llegaron_antes_hora</code> y{' '}
                <code>llegaron_despues_hora</code> deben mantenerse ambos habilitados/deshabilitados y ambos
                obligatorios/no obligatorios.
              </span>
            </div>

            <div className="table-responsive admin-setup-tabla-wrap admin-setup-tabla-wrap-metricas">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Clave</th>
                    <th>Etiqueta</th>
                    <th>Depende de</th>
                    <th>Regla</th>
                    <th>Orden</th>
                    <th>Habilitado</th>
                    <th>Obligatorio</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {metricas.map((item, index) => {
                    const filaErrores = erroresMetricas[`fila_${index}`] || {};
                    return (
                      <tr key={item.ui_id}>
                        <td>
                          <input
                            className={`form-control form-control-sm ${filaErrores.clave ? 'is-invalid' : ''}`}
                            value={item.clave}
                            onChange={(event) => cambiarMetrica(index, 'clave', event.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            className={`form-control form-control-sm ${filaErrores.etiqueta ? 'is-invalid' : ''}`}
                            value={item.etiqueta}
                            onChange={(event) => cambiarMetrica(index, 'etiqueta', event.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            className="form-control form-control-sm"
                            value={item.depende_de_clave || ''}
                            onChange={(event) => cambiarMetrica(index, 'depende_de_clave', event.target.value)}
                          />
                        </td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={item.regla_dependencia || ''}
                            onChange={(event) => cambiarMetrica(index, 'regla_dependencia', event.target.value)}
                          >
                            <option value="">Sin regla</option>
                            <option value="SI_MAYOR_CERO">SI_MAYOR_CERO</option>
                            <option value="AMBOS_O_NINGUNO">AMBOS_O_NINGUNO</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            className={`form-control form-control-sm ${filaErrores.orden ? 'is-invalid' : ''}`}
                            value={item.orden}
                            min={1}
                            max={999}
                            onChange={(event) => cambiarMetrica(index, 'orden', event.target.value)}
                          />
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
                          />
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => eliminarMetrica(index)}
                            disabled={metricas.length <= 1}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-end mt-3">
              <button
                type="button"
                className="btn btn-primary"
                onClick={guardarMetricas}
                disabled={guardandoMetricas}
              >
                {guardandoMetricas ? 'Guardando...' : 'Guardar metricas'}
              </button>
            </div>
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
              <BotonCerrarPanel onClick={cerrarPanelActivo} label="Cerrar panel de procedencias" />
            </div>
          </div>
          <div className="card-body">
            {erroresProcedencias.general && <div className="alert alert-danger">{erroresProcedencias.general}</div>}

            <div className="table-responsive admin-setup-tabla-wrap">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Orden</th>
                    <th>Activo</th>
                    <th></th>
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
                        <td>
                          <input
                            type="number"
                            className={`form-control form-control-sm ${filaErrores.orden ? 'is-invalid' : ''}`}
                            value={item.orden}
                            min={1}
                            max={99}
                            onChange={(event) => cambiarProcedencia(index, 'orden', event.target.value)}
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
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => eliminarProcedencia(index)}
                            disabled={procedencias.length <= 1}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

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
          </div>
        </div>
      )}
    </div>
  );
}
