import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SearchInput from '../components/ui/SearchInput';
import VisitasGeneralView from '../components/campanas/VisitasGeneralView';
import { useEstudiosBiblicos } from '../hooks/useEstudiosBiblicos';
import campanaApi from '../api/campanaApi';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../config/constants';
import { notificarError } from '../utils/notify';
import {
  EVENT_ESTUDIOS_ABRIR_ASIGNAR,
  EVENT_ESTUDIOS_ABRIR_INSTRUCTORES,
  EVENT_ESTUDIOS_ABRIR_LISTA,
  EVENT_ESTUDIOS_ABRIR_REGISTRO,
  EVENT_ESTUDIOS_ABRIR_VISITAS,
  EVENT_ESTUDIOS_VISTA_ACTIVA
} from '../config/events';

const VISTA_VISITAS = 'VISITAS';
const VISTA_ESTUDIOS = 'ESTUDIOS';
const VISTA_INSTRUCTORES = 'INSTRUCTORES';
const VISTA_ASIGNAR = 'ASIGNAR';
const VISTA_REGISTRO = 'REGISTRO';
const INSTRUCTORES_LISTA = 'INSTRUCTORES_LISTA';
const INSTRUCTORES_FORMULARIO = 'INSTRUCTORES_FORMULARIO';

const ESTADO_FINALIZADO = 'CERRADO';
const ESTADOS_CERRADOS = ['NO_CONTINUA', 'BAUTIZADO', ESTADO_FINALIZADO];

const ESTADO_OPCIONES = [
  { valor: '', etiqueta: 'Todos' },
  { valor: 'ASIGNADO', etiqueta: 'Asignado' },
  { valor: 'EN_PROCESO', etiqueta: 'En proceso' },
  { valor: 'PAUSADO', etiqueta: 'Pausado' },
  { valor: ESTADO_FINALIZADO, etiqueta: 'Finalizado' }
];

const ESTADO_ETIQUETAS = {
  ASIGNADO: 'Asignado',
  EN_PROCESO: 'En proceso',
  PAUSADO: 'Pausado',
  [ESTADO_FINALIZADO]: 'Finalizado'
};

const FRECUENCIA_OPCIONES = [
  { valor: 'SEMANA', etiqueta: 'Semana' },
  { valor: 'MES', etiqueta: 'Mes' },
  { valor: 'TRIMESTRE', etiqueta: 'Trimestre' }
];

function hoyFechaHoraLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function formatearFecha(valor) {
  if (!valor) return '-';
  const fecha = new Date(`${String(valor).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleDateString('es-CR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatearFechaHora(valor) {
  if (!valor) return '-';
  const fecha = new Date(String(valor).replace(' ', 'T'));
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleString('es-CR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function normalizarEstadoEstudio(estado) {
  const valor = String(estado || '').toUpperCase();
  if (ESTADOS_CERRADOS.includes(valor)) return ESTADO_FINALIZADO;
  if (valor === 'PAUSADO') return 'PAUSADO';
  if (['CONTACTADO', 'EN_PROCESO', 'LISTO_DECISION', 'CANDIDATO_BAUTISMAL'].includes(valor)) return 'EN_PROCESO';
  return 'ASIGNADO';
}

function etiquetaEstado(estado) {
  return ESTADO_ETIQUETAS[normalizarEstadoEstudio(estado)] || ESTADO_ETIQUETAS.ASIGNADO;
}

function claseEstado(estado) {
  const estadoVista = normalizarEstadoEstudio(estado);
  if (estadoVista === ESTADO_FINALIZADO) {
    return 'bg-secondary-subtle text-secondary-emphasis border-secondary-subtle';
  }
  if (estadoVista === 'PAUSADO') {
    return 'bg-warning-subtle text-warning-emphasis border-warning-subtle';
  }
  if (estadoVista === 'ASIGNADO') {
    return 'bg-info-subtle text-info-emphasis border-info-subtle';
  }
  return 'bg-success-subtle text-success-emphasis border-success-subtle';
}

function etiquetaFrecuencia(estudio) {
  const periodo = FRECUENCIA_OPCIONES.find((op) => op.valor === estudio?.frecuencia_periodo)?.etiqueta || 'Semana';
  const cantidad = Number(estudio?.frecuencia_cantidad || 1);
  return `${cantidad} por ${periodo.toLowerCase()}`;
}

function KpiCard({ label, value, icon }) {
  return (
    <div className="col-6 col-lg-3">
      <div className="card shadow-sm estudios-kpi-card h-100">
        <div className="card-body py-3">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
            <span className="estudios-kpi-label">{label}</span>
            <i className={`bi ${icon} text-primary`} aria-hidden="true"></i>
          </div>
          <div className="estudios-kpi-value">{Number(value || 0).toLocaleString('es-CR')}</div>
        </div>
      </div>
    </div>
  );
}

function DetalleVisitaModal({ estudio, onCerrar }) {
  if (!estudio) return null;

  const filas = [
    ['Nombre', estudio.contacto_nombre],
    ['Teléfono', estudio.contacto_telefono],
    ['Correo', estudio.contacto_correo],
    ['Dirección', estudio.contacto_direccion],
    ['Barrio / comunidad', estudio.contacto_barrio_comunidad],
    ['Instructor', estudio.responsable_usuario_nombre],
    ['Cargo', estudio.responsable_usuario_cargo],
    ['Frecuencia', etiquetaFrecuencia(estudio)],
    ['Inicio', formatearFecha(estudio.fecha_inicio)]
  ].filter(([, valor]) => String(valor || '').trim() !== '');

  return (
    <div
      className="prompt-overlay-iasd"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') onCerrar();
      }}
      role="button"
      tabIndex={0}
      aria-label="Cerrar detalle de la visita"
    >
      <div className="prompt-modal-iasd" role="dialog" aria-modal="true" style={{ maxWidth: '560px', width: '95%' }}>
        <div className="d-flex align-items-center justify-content-between gap-2 pb-3 border-bottom">
          <h5 className="mb-0">Detalle de la visita</h5>
          <button type="button" className="btn-close" onClick={onCerrar} aria-label="Cerrar"></button>
        </div>
        <div className="py-3 d-flex flex-column gap-2">
          {filas.map(([label, value]) => (
            <div key={label} className="estudios-detalle-row">
              <span className="text-muted">{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <div className="pt-3 border-top text-end">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onCerrar}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

function EstudiosMainView({
  filtros,
  cambiarFiltro,
  dashboard,
  estudios,
  cargando,
  seleccionadoId,
  setSeleccionadoId,
  cambiarEstadoEstudio
}) {
  const [detalleVisita, setDetalleVisita] = useState(null);

  return (
    <>
      <div className="row g-3 mb-3 estudios-top-row">
        <KpiCard label="Total" value={dashboard.total_estudios ?? estudios.length} icon="bi-journals" />
        <KpiCard label="Activos trimestre" value={dashboard.total_activos_trimestre} icon="bi-calendar3" />
        <KpiCard label="Pausados" value={dashboard.total_pausados} icon="bi-pause-circle" />
        <KpiCard label="Finalizados" value={dashboard.total_concluidos} icon="bi-check2-circle" />
      </div>

      <div className="card shadow-sm mb-3 estudios-filtros-card">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-lg-5">
              <label htmlFor="estudios-busqueda" className="form-label form-label-sm">Buscar</label>
              <SearchInput
                id="estudios-busqueda"
                value={filtros.q}
                onChange={(valor) => cambiarFiltro('q', valor)}
                placeholder="Visita, instructor, teléfono o material"
              />
            </div>
            <div className="col-6 col-lg-3">
              <label htmlFor="estudios-filtro-estado" className="form-label form-label-sm">Estado</label>
              <select id="estudios-filtro-estado" className="form-select form-select-sm" value={filtros.estado_general} onChange={(e) => cambiarFiltro('estado_general', e.target.value)}>
                {ESTADO_OPCIONES.map((opcion) => (
                  <option key={opcion.valor || 'todos'} value={opcion.valor}>{opcion.etiqueta}</option>
                ))}
              </select>
            </div>
            <div className="col-6 col-lg-2">
              <label htmlFor="estudios-filtro-desde" className="form-label form-label-sm">Desde</label>
              <input id="estudios-filtro-desde" type="date" className="form-control form-control-sm" value={filtros.fecha_desde} onChange={(e) => cambiarFiltro('fecha_desde', e.target.value)} />
            </div>
            <div className="col-6 col-lg-2">
              <label htmlFor="estudios-filtro-hasta" className="form-label form-label-sm">Hasta</label>
              <input id="estudios-filtro-hasta" type="date" className="form-control form-control-sm" value={filtros.fecha_hasta} onChange={(e) => cambiarFiltro('fecha_hasta', e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm estudios-lista-card">
        <div className="card-body p-0">
          <div className="tabla-registros-scroll estudios-tabla-scroll">
              <table className="table table-striped table-hover align-middle mb-0 tabla-registros estudios-lista-table">
                <thead className="tabla-registros-thead">
                  <tr>
                    <th>Visita</th>
                    <th>Instructor</th>
                    <th>Frecuencia</th>
                    <th>Inicio</th>
                    <th>Última sesión</th>
                    <th>Estado</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cargando && (
                    <tr><td colSpan="7" className="text-center text-muted py-4">Cargando...</td></tr>
                  )}
                  {!cargando && estudios.length === 0 && (
                    <tr><td colSpan="7" className="text-center text-muted py-4">No hay estudios con esos filtros.</td></tr>
                  )}
                  {!cargando && estudios.map((item) => {
                    const estadoVista = normalizarEstadoEstudio(item.estado_general);
                    const cerrado = estadoVista === ESTADO_FINALIZADO;
                    const pausado = estadoVista === 'PAUSADO';
                    return (
                      <tr key={item.id} className={seleccionadoId === item.id ? 'table-active' : ''}>
                        <td>
                          <button type="button" className="estudios-visita-link" onClick={() => setSeleccionadoId(item.id)}>
                            {item.contacto_nombre}
                          </button>
                          <div className="small text-muted">{item.contacto_telefono || 'Sin teléfono'}</div>
                        </td>
                        <td>
                          <div className="fw-semibold">{item.responsable_usuario_nombre || 'Sin instructor'}</div>
                          {item.responsable_usuario_cargo && <div className="small text-muted">{item.responsable_usuario_cargo}</div>}
                        </td>
                        <td>{etiquetaFrecuencia(item)}</td>
                        <td>{formatearFecha(item.fecha_inicio)}</td>
                        <td>{formatearFecha(item.fecha_ultima_sesion)}</td>
                        <td><span className={`badge ${claseEstado(item.estado_general)}`}>{etiquetaEstado(item.estado_general)}</span></td>
                        <td className="text-end">
                          <div className="d-inline-flex gap-2">
                            <button type="button" className="btn btn-outline-secondary btn-sm rounded-circle estudios-icon-btn" onClick={() => setDetalleVisita(item)} title="Ver visita" aria-label="Ver visita">
                              <i className="bi bi-search" aria-hidden="true"></i>
                            </button>
                            {cerrado ? (
                              <button type="button" className="btn btn-outline-success btn-sm rounded-circle estudios-icon-btn" onClick={() => cambiarEstadoEstudio(item.id, 'EN_PROCESO', 'Reactivado desde estudios bíblicos.')} title="Reactivar" aria-label="Reactivar estudio">
                                <i className="bi bi-arrow-clockwise" aria-hidden="true"></i>
                              </button>
                            ) : (
                              <>
                                {pausado ? (
                                  <button type="button" className="btn btn-outline-success btn-sm rounded-circle estudios-icon-btn" onClick={() => cambiarEstadoEstudio(item.id, 'EN_PROCESO', 'Reanudado desde estudios bíblicos.')} title="Reanudar" aria-label="Reanudar estudio">
                                    <i className="bi bi-play-fill" aria-hidden="true"></i>
                                  </button>
                                ) : (
                                  <button type="button" className="btn btn-outline-warning btn-sm rounded-circle estudios-icon-btn" onClick={() => cambiarEstadoEstudio(item.id, 'PAUSADO', 'Pausado desde estudios bíblicos.')} title="Pausar" aria-label="Pausar estudio">
                                    <i className="bi bi-pause-fill" aria-hidden="true"></i>
                                  </button>
                                )}
                                <button type="button" className="btn btn-outline-danger btn-sm rounded-circle estudios-icon-btn" onClick={() => cambiarEstadoEstudio(item.id, ESTADO_FINALIZADO, 'Finalizado desde estudios bíblicos.')} title="Finalizar" aria-label="Finalizar estudio">
                                  <i className="bi bi-flag" aria-hidden="true"></i>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
          </div>
        </div>
      </div>

      <DetalleVisitaModal estudio={detalleVisita} onCerrar={() => setDetalleVisita(null)} />
    </>
  );
}

function InstructorPanelHeader({ seccionActiva, editandoInstructorId, onMostrarLista, onMostrarFormulario }) {
  return (
    <div className="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap">
      <div className="admin-panel-header-top">
        <h5 className="mb-0" style={{ color: '#FFFFFF' }}>Instructores bíblicos</h5>
        <div className="admin-panel-header-actions">
          <button
            type="button"
            className={`admin-usuarios-switch-btn ${seccionActiva === INSTRUCTORES_LISTA ? 'is-active' : ''}`}
            onClick={onMostrarLista}
            title="Instructores"
            aria-label="Instructores"
          >
            <i className="bi bi-people" aria-hidden="true"></i>
            <span className="admin-usuarios-switch-btn-label">Instructores</span>
          </button>
          <button
            type="button"
            className={`admin-usuarios-switch-btn ${seccionActiva === INSTRUCTORES_FORMULARIO ? 'is-active' : ''}`}
            onClick={onMostrarFormulario}
            title={editandoInstructorId ? 'Editar instructor' : 'Agregar instructor'}
            aria-label={editandoInstructorId ? 'Editar instructor' : 'Agregar instructor'}
          >
            <i className="bi bi-person-plus" aria-hidden="true"></i>
            <span className="admin-usuarios-switch-btn-label">{editandoInstructorId ? 'Editar instructor' : 'Agregar instructor'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function InstructoresLista({ instructores, resumen, onEditar, onEliminar }) {
  return (
    <>
      <div className="admin-usuarios-resumen estudios-instructores-resumen mb-3">
        <div className="admin-usuarios-resumen-item">
          <span className="admin-usuarios-resumen-label">Total</span>
          <strong className="admin-usuarios-resumen-value">{resumen.total}</strong>
        </div>
        <div className="admin-usuarios-resumen-item">
          <span className="admin-usuarios-resumen-label">Activos</span>
          <strong className="admin-usuarios-resumen-value">{resumen.activos}</strong>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0" style={{ color: '#FFFFFF' }}>Usuarios instructores</h5>
          <span className="badge bg-light text-dark">{instructores.length} instructores</span>
        </div>
        <div className="card-body">
          {instructores.length === 0 ? (
            <div className="alert alert-iasd text-center">No hay instructores registrados.</div>
          ) : (
            <div className="table-responsive admin-tabla-scroll-x admin-usuarios-table-scroll-x">
              <div className="admin-usuarios-table-wrap estudios-instructores-table-wrap">
                <table className="table table-striped table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Usuario</th>
                      <th>Cargo</th>
                      <th className="text-center">Estado</th>
                      <th>Creado</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instructores.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td className="fw-semibold">{item.nombre_completo}</td>
                        <td>{item.usuario}</td>
                        <td>{item.cargo || '-'}</td>
                        <td className="text-center">
                          <span className={`badge ${item.activo ? 'bg-success' : 'bg-danger'}`}>
                            {item.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>{formatearFechaHora(item.creado_en)}</td>
                        <td className="text-center">
                          <div className="d-flex gap-1 justify-content-center">
                            <button type="button" className="btn btn-outline-primary btn-sm admin-table-icon-btn" onClick={() => onEditar(item)} title="Editar" aria-label="Editar instructor">
                              <i className="bi bi-pencil-square" aria-hidden="true"></i>
                            </button>
                            {item.activo && (
                              <button type="button" className="btn btn-outline-danger btn-sm admin-table-icon-btn" onClick={() => onEliminar(item.id)} title="Desactivar" aria-label="Desactivar instructor">
                                <i className="bi bi-person-x" aria-hidden="true"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function InstructorFormPanel({
  instructorForm,
  errores,
  refs,
  editandoInstructorId,
  requeridoPassword,
  guardando,
  cambiar,
  intentarGuardarInstructor,
  limpiarInstructor
}) {
  return (
    <div className="card shadow-sm mb-4 usuario-form-card">
      <div className="card-body usuario-form-body">
        <div className="usuario-form">
          <div className="row g-3 usuario-form-grid">
            <div className="col-md-6">
              <label htmlFor="instructor-nombre" className="form-label">Nombre completo <span className="text-danger" aria-hidden="true">*</span></label>
              <input ref={refs.nombre_completo} id="instructor-nombre" className={`form-control ${errores.nombre_completo ? 'is-invalid' : ''}`} value={instructorForm.nombre_completo} onChange={(e) => cambiar('nombre_completo', e.target.value)} placeholder="Nombre completo del instructor" maxLength={120} disabled={guardando} />
              {errores.nombre_completo && <div className="invalid-feedback">{errores.nombre_completo}</div>}
            </div>
            <div className="col-md-6">
              <label htmlFor="instructor-usuario" className="form-label">Usuario <span className="text-danger" aria-hidden="true">*</span></label>
              <input ref={refs.usuario} id="instructor-usuario" className={`form-control ${errores.usuario ? 'is-invalid' : ''}`} value={instructorForm.usuario} onChange={(e) => cambiar('usuario', e.target.value)} placeholder="Nombre de usuario" maxLength={50} autoComplete="off" disabled={guardando} />
              {errores.usuario && <div className="invalid-feedback">{errores.usuario}</div>}
            </div>
            <div className="col-md-6">
              <label htmlFor="instructor-cargo" className="form-label">Cargo <span className="text-danger" aria-hidden="true">*</span></label>
              <input ref={refs.cargo} id="instructor-cargo" className={`form-control ${errores.cargo ? 'is-invalid' : ''}`} value={instructorForm.cargo} onChange={(e) => cambiar('cargo', e.target.value)} placeholder="Pastor, laico, director..." maxLength={120} disabled={guardando} />
              {errores.cargo && <div className="invalid-feedback">{errores.cargo}</div>}
            </div>
            <div className="col-md-6">
              <label htmlFor="instructor-password" className="form-label">
                {editandoInstructorId ? 'Nueva contraseña ' : 'Contraseña '}
                {requeridoPassword && <span className="text-danger" aria-hidden="true">*</span>}
                {editandoInstructorId && <small className="text-muted">(opcional)</small>}
              </label>
              <input ref={refs.password} id="instructor-password" type="password" className={`form-control ${errores.password ? 'is-invalid' : ''}`} value={instructorForm.password} onChange={(e) => cambiar('password', e.target.value)} placeholder={editandoInstructorId ? 'Nueva contraseña' : 'Contraseña'} minLength={12} maxLength={64} autoComplete="new-password" disabled={guardando} />
              {errores.password ? <div className="invalid-feedback">{errores.password}</div> : <div className="form-text">Debe contener 12-64 caracteres.</div>}
            </div>
            <div className="col-md-6">
              <label htmlFor="instructor-password-confirmacion" className="form-label">Confirmar contraseña {requeridoPassword && <span className="text-danger" aria-hidden="true">*</span>}</label>
              <input ref={refs.password_confirmacion} id="instructor-password-confirmacion" type="password" className={`form-control ${errores.password_confirmacion ? 'is-invalid' : ''}`} value={instructorForm.password_confirmacion} onChange={(e) => cambiar('password_confirmacion', e.target.value)} placeholder="Repita la contraseña" minLength={12} maxLength={64} autoComplete="new-password" disabled={guardando} />
              {errores.password_confirmacion && <div className="invalid-feedback">{errores.password_confirmacion}</div>}
            </div>
            <div className="col-12">
              <div className="usuario-form-toolbar">
                <div className="usuario-form-toolbar-top estudios-instructor-toolbar-top">
                  <div></div>
                  <div className="usuario-form-actions">
                    <button type="button" className="btn btn-primary usuario-form-action-btn admin-responsive-action-btn" onClick={() => { void intentarGuardarInstructor(); }} disabled={guardando} title={editandoInstructorId ? 'Actualizar instructor' : 'Crear instructor'} aria-label={editandoInstructorId ? 'Actualizar instructor' : 'Crear instructor'}>
                      <i className={`bi ${editandoInstructorId ? 'bi-floppy' : 'bi-person-plus'}`} aria-hidden="true"></i>
                      {guardando ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                          <span className="admin-responsive-btn-label">Guardando...</span>
                        </>
                      ) : <span className="admin-responsive-btn-label">{editandoInstructorId ? 'Actualizar' : 'Crear instructor'}</span>}
                    </button>
                    <button type="button" className="btn btn-outline-secondary usuario-form-action-btn admin-responsive-action-btn" onClick={limpiarInstructor} disabled={guardando} title={editandoInstructorId ? 'Cancelar' : 'Limpiar'} aria-label={editandoInstructorId ? 'Cancelar' : 'Limpiar'}>
                      <i className="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
                      <span className="admin-responsive-btn-label">{editandoInstructorId ? 'Cancelar' : 'Limpiar'}</span>
                    </button>
                  </div>
                </div>
                <div className="usuario-form-toolbar-meta">
                  {editandoInstructorId && (
                    <div className="form-check usuario-form-activo-check">
                      <input id="instructor-activo" type="checkbox" className="form-check-input" checked={Boolean(instructorForm.activo)} onChange={(e) => cambiar('activo', e.target.checked)} disabled={guardando} />
                      <label className="form-check-label" htmlFor="instructor-activo">Usuario activo</label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InstructoresView({
  instructores,
  instructorForm,
  setInstructorForm,
  editandoInstructorId,
  editarInstructor,
  resetInstructorForm,
  guardarInstructor,
  eliminarInstructor,
  guardando
}) {
  const [seccionActiva, setSeccionActiva] = useState(INSTRUCTORES_LISTA);
  const [errores, setErrores] = useState({});
  const nombreRef = useRef(null);
  const usuarioRef = useRef(null);
  const cargoRef = useRef(null);
  const passwordRef = useRef(null);
  const passwordConfirmacionRef = useRef(null);
  const refs = useMemo(() => ({
    nombre_completo: nombreRef,
    usuario: usuarioRef,
    cargo: cargoRef,
    password: passwordRef,
    password_confirmacion: passwordConfirmacionRef
  }), []);
  const resumen = useMemo(() => ({
    total: instructores.length,
    activos: instructores.filter((item) => item.activo).length
  }), [instructores]);
  const requeridoPassword = !editandoInstructorId;

  const cambiar = (campo, valor) => {
    setInstructorForm((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => {
      if (!prev[campo]) return prev;
      const siguiente = { ...prev };
      delete siguiente[campo];
      return siguiente;
    });
  };

  const enfocarPrimerError = (nuevosErrores) => {
    const primerCampo = ['nombre_completo', 'usuario', 'cargo', 'password', 'password_confirmacion'].find((campo) => nuevosErrores[campo]);
    if (!primerCampo) return;
    setTimeout(() => refs[primerCampo]?.current?.focus({ preventScroll: false }), 0);
  };

  const validarInstructor = () => {
    const nuevosErrores = {};
    const password = instructorForm.password || '';
    const confirmacion = instructorForm.password_confirmacion || '';

    if (!String(instructorForm.nombre_completo || '').trim()) nuevosErrores.nombre_completo = 'El nombre es obligatorio.';
    if (!String(instructorForm.usuario || '').trim()) nuevosErrores.usuario = 'El usuario es obligatorio.';
    if (!String(instructorForm.cargo || '').trim()) nuevosErrores.cargo = 'El cargo es obligatorio.';
    if (requeridoPassword && !password) nuevosErrores.password = 'La contraseña es obligatoria.';
    if (requeridoPassword && !confirmacion) nuevosErrores.password_confirmacion = 'Confirme la contraseña.';
    if (password && password.length < 12) nuevosErrores.password = 'Use al menos 12 caracteres.';
    if ((password || confirmacion) && password !== confirmacion) nuevosErrores.password_confirmacion = 'Las contraseñas no coinciden.';

    return nuevosErrores;
  };

  const intentarGuardarInstructor = async () => {
    const nuevosErrores = validarInstructor();
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      enfocarPrimerError(nuevosErrores);
      notificarError('Complete los campos obligatorios del instructor.');
      return;
    }

    setErrores({});
    const ok = await guardarInstructor();
    if (ok) setSeccionActiva(INSTRUCTORES_LISTA);
  };

  const limpiarInstructor = () => {
    setErrores({});
    resetInstructorForm();
    setSeccionActiva(INSTRUCTORES_LISTA);
  };

  const mostrarFormulario = () => {
    if (!editandoInstructorId) setErrores({});
    setSeccionActiva(INSTRUCTORES_FORMULARIO);
  };

  const editarInstructorDesdeTabla = (item) => {
    setErrores({});
    editarInstructor(item);
    setSeccionActiva(INSTRUCTORES_FORMULARIO);
  };

  return (
    <div className="card shadow-sm mb-4 admin-setup-panel estudios-instructores-panel">
      <InstructorPanelHeader
        seccionActiva={seccionActiva}
        editandoInstructorId={editandoInstructorId}
        onMostrarLista={() => setSeccionActiva(INSTRUCTORES_LISTA)}
        onMostrarFormulario={mostrarFormulario}
      />
      <div className="card-body">
        {seccionActiva === INSTRUCTORES_LISTA ? (
          <InstructoresLista
            instructores={instructores}
            resumen={resumen}
            onEditar={editarInstructorDesdeTabla}
            onEliminar={eliminarInstructor}
          />
        ) : (
          <InstructorFormPanel
            instructorForm={instructorForm}
            errores={errores}
            refs={refs}
            editandoInstructorId={editandoInstructorId}
            requeridoPassword={requeridoPassword}
            guardando={guardando}
            cambiar={cambiar}
            intentarGuardarInstructor={intentarGuardarInstructor}
            limpiarInstructor={limpiarInstructor}
          />
        )}
      </div>
    </div>
  );
}

function VisitaSelector({ seleccionadaId, onSeleccionar }) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await campanaApi.listarVisitas(q ? { q } : {});
      setItems(res?.exito ? (res?.datos?.items || []) : []);
    } catch {
      setItems([]);
    } finally {
      setCargando(false);
    }
  }, [q]);

  useEffect(() => {
    const t = setTimeout(() => { void cargar(); }, 250);
    return () => clearTimeout(t);
  }, [cargar]);

  return (
    <div className="card shadow-sm estudios-section-card h-100">
      <div className="card-header bg-white">
        <h5 className="mb-0">Seleccionar visita</h5>
      </div>
      <div className="card-body">
        <label htmlFor="estudios-visitas-selector" className="form-label form-label-sm">Buscar</label>
        <SearchInput id="estudios-visitas-selector" value={q} onChange={setQ} placeholder="Nombre, teléfono o procedencia" />
      </div>
      <div className="card-body p-0">
        <div className="estudios-table-shell">
          <div className="estudios-table-scroll estudios-selector-scroll">
            <table className="table table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>Visita</th>
                  <th>Seguimiento</th>
                  <th className="text-end">Elegir</th>
                </tr>
              </thead>
              <tbody>
                {cargando && <tr><td colSpan="3" className="text-center text-muted py-4">Cargando...</td></tr>}
                {!cargando && items.length === 0 && <tr><td colSpan="3" className="text-center text-muted py-4">No hay visitas.</td></tr>}
                {!cargando && items.map((item) => (
                  <tr key={item.id} className={String(seleccionadaId) === String(item.id) ? 'table-active' : ''}>
                    <td>
                      <div className="fw-semibold">{item.nombre_snapshot}</div>
                      <div className="small text-muted">{item.telefono_snapshot || item.procedencia || 'Sin teléfono'}</div>
                    </td>
                    <td><span className="badge text-bg-light border">{item.estado_seguimiento || '-'}</span></td>
                    <td className="text-end">
                      <button type="button" className="btn btn-outline-primary btn-sm rounded-circle estudios-icon-btn" onClick={() => onSeleccionar(item)} title="Seleccionar" aria-label="Seleccionar visita">
                        <i className="bi bi-check2" aria-hidden="true"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function AsignarEstudioView({ asignarForm, setAsignarForm, instructores, guardarAsignarEstudio, guardando }) {
  const cambiar = (campo, valor) => setAsignarForm((prev) => ({ ...prev, [campo]: valor }));
  const hoy = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const instructoresActivos = useMemo(() => instructores.filter((item) => item.activo), [instructores]);

  return (
    <div className="row g-3">
      <div className="col-12 col-xl-7">
        <VisitaSelector
          seleccionadaId={asignarForm.visita_id}
          onSeleccionar={(visita) => setAsignarForm((prev) => ({
            ...prev,
            visita_id: visita.id,
            visita_nombre: visita.nombre_snapshot || ''
          }))}
        />
      </div>
      <div className="col-12 col-xl-5">
        <div className="card shadow-sm estudios-form-card">
          <div className="card-header bg-white">
            <h5 className="mb-0">Asignar estudio</h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-12">
                <label htmlFor="asignar-visita" className="form-label form-label-sm">Visita</label>
                <input id="asignar-visita" className="form-control form-control-sm" value={asignarForm.visita_nombre || ''} readOnly />
              </div>
              <div className="col-12">
                <label htmlFor="asignar-instructor" className="form-label form-label-sm">Instructor responsable</label>
                <select id="asignar-instructor" className="form-select form-select-sm" value={asignarForm.responsable_usuario_id} onChange={(e) => cambiar('responsable_usuario_id', e.target.value)}>
                  <option value="">Seleccione</option>
                  {instructoresActivos.map((item) => (
                    <option key={item.id} value={item.id}>{item.nombre_completo}{item.cargo ? ` - ${item.cargo}` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-6">
                <label htmlFor="asignar-fecha-inicio" className="form-label form-label-sm">Fecha inicio</label>
                <input id="asignar-fecha-inicio" type="date" min={hoy} className="form-control form-control-sm" value={asignarForm.fecha_inicio} onChange={(e) => cambiar('fecha_inicio', e.target.value)} />
              </div>
              <div className="col-6 col-md-3">
                <label htmlFor="asignar-frecuencia-cantidad" className="form-label form-label-sm">Veces</label>
                <input id="asignar-frecuencia-cantidad" type="number" min="1" max="31" className="form-control form-control-sm" value={asignarForm.frecuencia_cantidad} onChange={(e) => cambiar('frecuencia_cantidad', e.target.value)} />
              </div>
              <div className="col-6 col-md-3">
                <label htmlFor="asignar-frecuencia-periodo" className="form-label form-label-sm">Periodo</label>
                <select id="asignar-frecuencia-periodo" className="form-select form-select-sm" value={asignarForm.frecuencia_periodo} onChange={(e) => cambiar('frecuencia_periodo', e.target.value)}>
                  {FRECUENCIA_OPCIONES.map((opcion) => (
                    <option key={opcion.valor} value={opcion.valor}>{opcion.etiqueta}</option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-6">
                <label htmlFor="asignar-material" className="form-label form-label-sm">Material</label>
                <input id="asignar-material" className="form-control form-control-sm" value={asignarForm.material_estudio} onChange={(e) => cambiar('material_estudio', e.target.value)} maxLength={160} />
              </div>
              <div className="col-12 col-md-6">
                <label htmlFor="asignar-leccion" className="form-label form-label-sm">Lección inicial</label>
                <input id="asignar-leccion" className="form-control form-control-sm" value={asignarForm.leccion_actual} onChange={(e) => cambiar('leccion_actual', e.target.value)} maxLength={80} />
              </div>
              <div className="col-12">
                <label htmlFor="asignar-observaciones" className="form-label form-label-sm">Observaciones</label>
                <textarea id="asignar-observaciones" className="form-control form-control-sm" rows="3" value={asignarForm.observaciones} onChange={(e) => cambiar('observaciones', e.target.value)} maxLength={800} />
              </div>
              <div className="col-12">
                <button type="button" className="btn btn-primary btn-sm w-100 d-inline-flex align-items-center justify-content-center gap-2" onClick={guardarAsignarEstudio} disabled={guardando}>
                  <i className="bi bi-diagram-3" aria-hidden="true"></i>
                  <span>Asignar estudio</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegistroSesionesView({ estudios, guardarSesionDirecta, cambiarEstadoEstudio, guardando }) {
  const activos = useMemo(() => estudios.filter((item) => !ESTADOS_CERRADOS.includes(item.estado_general)), [estudios]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [detalleVisita, setDetalleVisita] = useState(null);
  const [form, setForm] = useState({
    fecha: hoyFechaHoraLocal(),
    tema_leccion: 'Estudio bíblico',
    resumen_breve: '',
    dudas_surgidas: '',
    asistencia: 'SI',
    percepcion_avance: 'MEDIA',
    progreso_bautismo: 0,
    proxima_accion: '',
    proxima_fecha_sugerida: ''
  });

  useEffect(() => {
    if (!seleccionado && activos.length > 0) {
      setSeleccionado(activos[0]);
    }
    if (seleccionado && !activos.some((item) => item.id === seleccionado.id)) {
      setSeleccionado(activos[0] || null);
    }
  }, [activos, seleccionado]);

  const cambiar = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));
  const registrar = async () => {
    if (!seleccionado) return;
    const ok = await guardarSesionDirecta(seleccionado.id, form);
    if (ok) {
      setForm({
        fecha: hoyFechaHoraLocal(),
        tema_leccion: 'Estudio bíblico',
        resumen_breve: '',
        dudas_surgidas: '',
        asistencia: 'SI',
        percepcion_avance: 'MEDIA',
        progreso_bautismo: form.progreso_bautismo,
        proxima_accion: '',
        proxima_fecha_sugerida: ''
      });
    }
  };

  return (
    <div className="row g-3">
      <div className="col-12 col-xl-5">
        <div className="card shadow-sm estudios-lista-card">
          <div className="card-header bg-white d-flex align-items-center justify-content-between gap-2">
            <h5 className="mb-0">Mis estudios</h5>
            <span className="badge text-bg-light border">{activos.length}</span>
          </div>
          <div className="card-body p-0">
            <div className="estudios-registro-list">
              {activos.length === 0 && (
                <div className="text-center text-muted py-4 px-3">No hay estudios activos asignados.</div>
              )}
              {activos.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`estudios-registro-item ${seleccionado?.id === item.id ? 'is-active' : ''}`}
                  onClick={() => setSeleccionado(item)}
                >
                  <span>
                    <strong>{item.contacto_nombre}</strong>
                    <small>{etiquetaFrecuencia(item)} · última sesión {formatearFecha(item.fecha_ultima_sesion)}</small>
                  </span>
                  <i className="bi bi-chevron-right" aria-hidden="true"></i>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="col-12 col-xl-7">
        <div className="card shadow-sm estudios-form-card">
          <div className="card-header bg-white d-flex align-items-start justify-content-between gap-2">
            <div>
              <h5 className="mb-1">{seleccionado?.contacto_nombre || 'Registrar sesión'}</h5>
              <div className="small text-muted">{seleccionado ? etiquetaFrecuencia(seleccionado) : '-'}</div>
            </div>
            {seleccionado && (
              <button type="button" className="btn btn-outline-secondary btn-sm rounded-circle estudios-icon-btn" onClick={() => setDetalleVisita(seleccionado)} title="Ver visita" aria-label="Ver visita">
                <i className="bi bi-search" aria-hidden="true"></i>
              </button>
            )}
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label htmlFor="registro-fecha" className="form-label form-label-sm">Fecha y hora</label>
                <input id="registro-fecha" type="datetime-local" className="form-control form-control-sm" value={form.fecha} onChange={(e) => cambiar('fecha', e.target.value)} />
              </div>
              <div className="col-12 col-md-6">
                <label htmlFor="registro-tema" className="form-label form-label-sm">Tema / lección</label>
                <input id="registro-tema" className="form-control form-control-sm" value={form.tema_leccion} onChange={(e) => cambiar('tema_leccion', e.target.value)} maxLength={180} />
              </div>
              <div className="col-6 col-md-4">
                <label htmlFor="registro-asistencia" className="form-label form-label-sm">Asistencia</label>
                <select id="registro-asistencia" className="form-select form-select-sm" value={form.asistencia} onChange={(e) => cambiar('asistencia', e.target.value)}>
                  <option value="SI">Sí</option>
                  <option value="PARCIAL">Parcial</option>
                  <option value="NO">No</option>
                </select>
              </div>
              <div className="col-6 col-md-4">
                <label htmlFor="registro-avance" className="form-label form-label-sm">Avance</label>
                <select id="registro-avance" className="form-select form-select-sm" value={form.percepcion_avance} onChange={(e) => cambiar('percepcion_avance', e.target.value)}>
                  <option value="BAJA">Baja</option>
                  <option value="MEDIA">Media</option>
                  <option value="ALTA">Alta</option>
                </select>
              </div>
              <div className="col-12 col-md-4">
                <label htmlFor="registro-progreso" className="form-label form-label-sm">Cerca del bautismo</label>
                <div className="d-flex align-items-center gap-2">
                  <input id="registro-progreso" type="range" className="form-range flex-grow-1" min="0" max="100" value={form.progreso_bautismo} onChange={(e) => cambiar('progreso_bautismo', e.target.value)} />
                  <span className="badge text-bg-light border estudios-progress-badge">{form.progreso_bautismo}%</span>
                </div>
              </div>
              <div className="col-12">
                <label htmlFor="registro-observaciones" className="form-label form-label-sm">Observaciones</label>
                <textarea id="registro-observaciones" className="form-control form-control-sm" rows="3" value={form.resumen_breve} onChange={(e) => cambiar('resumen_breve', e.target.value)} maxLength={1200} />
              </div>
              <div className="col-12 col-md-6">
                <label htmlFor="registro-dudas" className="form-label form-label-sm">Dudas surgidas</label>
                <input id="registro-dudas" className="form-control form-control-sm" value={form.dudas_surgidas} onChange={(e) => cambiar('dudas_surgidas', e.target.value)} maxLength={1200} />
              </div>
              <div className="col-12 col-md-6">
                <label htmlFor="registro-proxima-accion" className="form-label form-label-sm">Próxima acción</label>
                <input id="registro-proxima-accion" className="form-control form-control-sm" value={form.proxima_accion} onChange={(e) => cambiar('proxima_accion', e.target.value)} maxLength={1200} />
              </div>
              <div className="col-12 col-md-6">
                <label htmlFor="registro-proxima-fecha" className="form-label form-label-sm">Próxima fecha</label>
                <input id="registro-proxima-fecha" type="datetime-local" className="form-control form-control-sm" value={form.proxima_fecha_sugerida} onChange={(e) => cambiar('proxima_fecha_sugerida', e.target.value)} />
              </div>
              <div className="col-12 col-md-6 d-flex align-items-end gap-2">
                <button type="button" className="btn btn-primary btn-sm flex-grow-1 d-inline-flex align-items-center justify-content-center gap-2" onClick={registrar} disabled={!seleccionado || guardando}>
                  <i className="bi bi-journal-check" aria-hidden="true"></i>
                  <span>Registrar sesión</span>
                </button>
                {seleccionado && (
                  <button type="button" className="btn btn-outline-danger btn-sm rounded-circle estudios-icon-btn" onClick={() => cambiarEstadoEstudio(seleccionado.id, 'CERRADO', 'Finalizado por instructor.')} title="Finalizar estudio" aria-label="Finalizar estudio">
                    <i className="bi bi-flag" aria-hidden="true"></i>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DetalleVisitaModal estudio={detalleVisita} onCerrar={() => setDetalleVisita(null)} />
    </div>
  );
}

export default function EstudiosBiblicosPage() {
  const { usuario } = useAuth();
  const esInstructor = usuario?.rol === ROLES.INSTRUCTOR_BIBLICO;
  const vistaInicial = esInstructor ? VISTA_REGISTRO : VISTA_ESTUDIOS;
  const [vistaActiva, setVistaActiva] = useState(vistaInicial);

  const {
    filtros,
    dashboard,
    estudios,
    instructores,
    campanas,
    seleccionadoId,
    setSeleccionadoId,
    cargando,
    guardando,
    instructorForm,
    setInstructorForm,
    editandoInstructorId,
    asignarForm,
    setAsignarForm,
    cambiarFiltro,
    cargarInstructores,
    editarInstructor,
    resetInstructorForm,
    guardarInstructor,
    eliminarInstructor,
    guardarAsignarEstudio,
    guardarSesionDirecta,
    cambiarEstadoEstudio,
    recargar
  } = useEstudiosBiblicos();

  useEffect(() => {
    setVistaActiva(esInstructor ? VISTA_REGISTRO : VISTA_ESTUDIOS);
  }, [esInstructor]);

  useEffect(() => {
    const irA = (vista) => {
      setVistaActiva(esInstructor ? VISTA_REGISTRO : vista);
    };
    const abrirVisitas = () => irA(VISTA_VISITAS);
    const abrirLista = () => irA(VISTA_ESTUDIOS);
    const abrirInstructores = () => irA(VISTA_INSTRUCTORES);
    const abrirAsignar = () => irA(VISTA_ASIGNAR);
    const abrirRegistro = () => setVistaActiva(VISTA_REGISTRO);

    window.addEventListener(EVENT_ESTUDIOS_ABRIR_VISITAS, abrirVisitas);
    window.addEventListener(EVENT_ESTUDIOS_ABRIR_LISTA, abrirLista);
    window.addEventListener(EVENT_ESTUDIOS_ABRIR_INSTRUCTORES, abrirInstructores);
    window.addEventListener(EVENT_ESTUDIOS_ABRIR_ASIGNAR, abrirAsignar);
    window.addEventListener(EVENT_ESTUDIOS_ABRIR_REGISTRO, abrirRegistro);
    return () => {
      window.removeEventListener(EVENT_ESTUDIOS_ABRIR_VISITAS, abrirVisitas);
      window.removeEventListener(EVENT_ESTUDIOS_ABRIR_LISTA, abrirLista);
      window.removeEventListener(EVENT_ESTUDIOS_ABRIR_INSTRUCTORES, abrirInstructores);
      window.removeEventListener(EVENT_ESTUDIOS_ABRIR_ASIGNAR, abrirAsignar);
      window.removeEventListener(EVENT_ESTUDIOS_ABRIR_REGISTRO, abrirRegistro);
    };
  }, [esInstructor]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent(EVENT_ESTUDIOS_VISTA_ACTIVA, { detail: { vista: vistaActiva } }));
    if ([VISTA_INSTRUCTORES, VISTA_ASIGNAR].includes(vistaActiva)) {
      void cargarInstructores();
    }
    if (vistaActiva === VISTA_ESTUDIOS || vistaActiva === VISTA_REGISTRO) {
      void recargar();
    }
  }, [vistaActiva, cargarInstructores, recargar]);

  const contenido = (() => {
    if (!esInstructor && vistaActiva === VISTA_VISITAS) {
      return <VisitasGeneralView campanas={campanas} />;
    }
    if (!esInstructor && vistaActiva === VISTA_INSTRUCTORES) {
      return (
        <InstructoresView
          instructores={instructores}
          instructorForm={instructorForm}
          setInstructorForm={setInstructorForm}
          editandoInstructorId={editandoInstructorId}
          editarInstructor={editarInstructor}
          resetInstructorForm={resetInstructorForm}
          guardarInstructor={guardarInstructor}
          eliminarInstructor={eliminarInstructor}
          guardando={guardando}
        />
      );
    }
    if (!esInstructor && vistaActiva === VISTA_ASIGNAR) {
      return (
        <AsignarEstudioView
          asignarForm={asignarForm}
          setAsignarForm={setAsignarForm}
          instructores={instructores}
          guardarAsignarEstudio={guardarAsignarEstudio}
          guardando={guardando}
        />
      );
    }
    if (esInstructor || vistaActiva === VISTA_REGISTRO) {
      return (
        <RegistroSesionesView
          estudios={estudios}
          guardarSesionDirecta={guardarSesionDirecta}
          cambiarEstadoEstudio={cambiarEstadoEstudio}
          guardando={guardando}
        />
      );
    }
    return (
      <EstudiosMainView
        filtros={filtros}
        cambiarFiltro={cambiarFiltro}
        dashboard={dashboard}
        estudios={estudios}
        cargando={cargando}
        seleccionadoId={seleccionadoId}
        setSeleccionadoId={setSeleccionadoId}
        cambiarEstadoEstudio={cambiarEstadoEstudio}
      />
    );
  })();

  return (
    <div className="container-fluid py-3 py-lg-4 estudios-page" data-vista={vistaActiva}>
      {contenido}
    </div>
  );
}
