import SearchInput from '../components/ui/SearchInput';
import { useEstudiosBiblicos } from '../hooks/useEstudiosBiblicos';

const ORIGEN_OPCIONES = [
  { valor: '', etiqueta: 'Todos los origenes' },
  { valor: 'CAMPANA', etiqueta: 'Campana' },
  { valor: 'PC', etiqueta: 'PC' },
  { valor: 'VISITA_IGLESIA', etiqueta: 'Visita a iglesia' },
  { valor: 'REFERENCIA_MIEMBRO', etiqueta: 'Referencia de miembro' },
  { valor: 'PAREJA_MISIONERA', etiqueta: 'Pareja misionera' },
  { valor: 'CLASE_BIBLICA', etiqueta: 'Clase biblica' },
  { valor: 'WHATSAPP', etiqueta: 'WhatsApp' },
  { valor: 'OTRO', etiqueta: 'Otro' }
];

const ESTADO_OPCIONES = [
  { valor: '', etiqueta: 'Todos los estados' },
  { valor: 'NUEVO', etiqueta: 'Nuevo' },
  { valor: 'ASIGNADO', etiqueta: 'Asignado' },
  { valor: 'CONTACTADO', etiqueta: 'Contactado' },
  { valor: 'EN_PROCESO', etiqueta: 'En proceso' },
  { valor: 'PAUSADO', etiqueta: 'Pausado' },
  { valor: 'NO_CONTINUA', etiqueta: 'No continua' },
  { valor: 'LISTO_DECISION', etiqueta: 'Listo para decision' },
  { valor: 'CANDIDATO_BAUTISMAL', etiqueta: 'Candidato bautismal' },
  { valor: 'BAUTIZADO', etiqueta: 'Bautizado' },
  { valor: 'CERRADO', etiqueta: 'Cerrado' }
];

const MODALIDAD_OPCIONES = [
  { valor: 'INDIVIDUAL', etiqueta: 'Individual' },
  { valor: 'CLASE_BIBLICA', etiqueta: 'Clase biblica' },
  { valor: 'HOGAR', etiqueta: 'Hogar' },
  { valor: 'TEMPLO', etiqueta: 'Templo' },
  { valor: 'VIRTUAL', etiqueta: 'Virtual' },
  { valor: 'OTRO', etiqueta: 'Otro' }
];

const PERCEPCION_OPCIONES = [
  { valor: 'BAJA', etiqueta: 'Baja' },
  { valor: 'MEDIA', etiqueta: 'Media' },
  { valor: 'ALTA', etiqueta: 'Alta' }
];

const DECISION_OPCIONES = [
  { clave: 'ACEPTO_ORACION', etiqueta: 'Acepto oracion' },
  { clave: 'ACEPTO_CONTINUAR_ESTUDIANDO', etiqueta: 'Acepto continuar estudiando' },
  { clave: 'ACEPTO_ASISTIR_IGLESIA', etiqueta: 'Acepto asistir a la iglesia' },
  { clave: 'ACEPTO_CLASE_BIBLICA', etiqueta: 'Acepto clase biblica' },
  { clave: 'ACEPTO_LLAMADO', etiqueta: 'Acepto llamado' },
  { clave: 'ACEPTO_PREPARACION_BAUTISMAL', etiqueta: 'Acepto preparacion bautismal' },
  { clave: 'DECISION_BAUTISMO', etiqueta: 'Decision para bautismo' },
  { clave: 'BAUTIZADO', etiqueta: 'Bautizado' },
  { clave: 'NO_CONTINUA', etiqueta: 'No continua' },
  { clave: 'REQUIERE_NUEVA_VISITA', etiqueta: 'Requiere nueva visita' }
];

const DETALLE_VISTAS = [
  { valor: 'RESUMEN', etiqueta: 'Resumen', icono: 'bi-card-text' },
  { valor: 'SESIONES', etiqueta: 'Sesiones', icono: 'bi-journal-check' },
  { valor: 'DECISIONES', etiqueta: 'Decisiones', icono: 'bi-check2-circle' },
  { valor: 'ASIGNACIONES', etiqueta: 'Asignacion', icono: 'bi-person-workspace' }
];

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

function claseEstado(estado) {
  switch (estado) {
    case 'BAUTIZADO':
      return 'bg-success-subtle text-success-emphasis border-success-subtle';
    case 'CANDIDATO_BAUTISMAL':
    case 'LISTO_DECISION':
      return 'bg-primary-subtle text-primary-emphasis border-primary-subtle';
    case 'PAUSADO':
    case 'NUEVO':
    case 'ASIGNADO':
      return 'bg-warning-subtle text-warning-emphasis border-warning-subtle';
    case 'NO_CONTINUA':
    case 'CERRADO':
      return 'bg-secondary-subtle text-secondary-emphasis border-secondary-subtle';
    default:
      return 'bg-light text-dark border';
  }
}

function etiquetaDecision(clave) {
  return DECISION_OPCIONES.find((item) => item.clave === clave)?.etiqueta || clave || '-';
}

function KpiCard({ label, value, icon }) {
  return (
    <div className="col-6 col-lg-3">
      <div className="card shadow-sm estudios-kpi-card h-100">
        <div className="card-body py-3">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
            <span className="small text-muted text-uppercase">{label}</span>
            <i className={`bi ${icon} text-primary`} aria-hidden="true"></i>
          </div>
          <div className="h4 mb-0">{Number(value || 0).toLocaleString('es-CR')}</div>
        </div>
      </div>
    </div>
  );
}

function BotonAccion({ icono, label, onClick, disabled = false, outline = false }) {
  return (
    <button
      type="button"
      className={`btn ${outline ? 'btn-outline-secondary' : 'btn-primary'} btn-sm admin-responsive-action-btn`}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
    >
      <i className={`bi ${icono}`} aria-hidden="true"></i>
      <span className="admin-responsive-btn-label">{label}</span>
    </button>
  );
}

function DetalleVacio() {
  return (
    <div className="card shadow-sm h-100 estudios-detalle-card">
      <div className="card-body d-flex align-items-center justify-content-center text-center text-muted py-5">
        Seleccione un estudio biblico para ver su avance, sesiones, decisiones y asignacion.
      </div>
    </div>
  );
}

function ResumenEstudio({ detalle }) {
  const resumen = detalle?.resumen || {};

  return (
    <div className="estudios-detalle-scroll">
      <div className="row g-3 mb-3">
        <KpiCard label="Sesiones" value={resumen.total_sesiones} icon="bi-journal-check" />
        <KpiCard label="Decisiones" value={resumen.total_decisiones} icon="bi-check2-circle" />
        <KpiCard label="Lecciones" value={detalle.total_lecciones_completadas} icon="bi-book" />
        <KpiCard label="Bautizado" value={detalle.estado_general === 'BAUTIZADO' ? 1 : 0} icon="bi-droplet" />
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-7">
          <div className="card shadow-sm estudios-section-card">
            <div className="card-body">
              <h6 className="estudios-section-title">Ficha del estudio</h6>
              <div className="estudios-resumen-grid">
                <div>
                  <span className="estudios-meta-label">Persona</span>
                  <strong>{detalle.contacto_nombre}</strong>
                </div>
                <div>
                  <span className="estudios-meta-label">Telefono</span>
                  <strong>{detalle.contacto_telefono || '-'}</strong>
                </div>
                <div>
                  <span className="estudios-meta-label">Origen</span>
                  <strong>{detalle.origen_clave || '-'}</strong>
                </div>
                <div>
                  <span className="estudios-meta-label">Campana de origen</span>
                  <strong>{detalle.campana_origen_nombre || '-'}</strong>
                </div>
                <div>
                  <span className="estudios-meta-label">Modalidad</span>
                  <strong>{detalle.modalidad}</strong>
                </div>
                <div>
                  <span className="estudios-meta-label">Material</span>
                  <strong>{detalle.material_estudio || '-'}</strong>
                </div>
                <div>
                  <span className="estudios-meta-label">Leccion actual</span>
                  <strong>{detalle.leccion_actual || '-'}</strong>
                </div>
                <div>
                  <span className="estudios-meta-label">Inicio</span>
                  <strong>{formatearFecha(detalle.fecha_inicio)}</strong>
                </div>
                <div>
                  <span className="estudios-meta-label">Ultima sesion</span>
                  <strong>{formatearFecha(detalle.fecha_ultima_sesion)}</strong>
                </div>
                <div>
                  <span className="estudios-meta-label">Proxima sesion</span>
                  <strong>{formatearFechaHora(detalle.proxima_sesion)}</strong>
                </div>
                <div>
                  <span className="estudios-meta-label">Instructor principal</span>
                  <strong>{detalle.instructor_principal_nombre || '-'}</strong>
                </div>
                <div>
                  <span className="estudios-meta-label">Instructor secundario</span>
                  <strong>{detalle.instructor_secundario_nombre || '-'}</strong>
                </div>
              </div>

              {detalle.observaciones ? (
                <div className="mt-3">
                  <span className="estudios-meta-label">Observaciones</span>
                  <p className="mb-0">{detalle.observaciones}</p>
                </div>
              ) : null}

              {detalle.motivo_cierre_pausa ? (
                <div className="mt-3">
                  <span className="estudios-meta-label">Motivo de pausa o cierre</span>
                  <p className="mb-0">{detalle.motivo_cierre_pausa}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="card shadow-sm estudios-section-card h-100">
            <div className="card-body">
              <h6 className="estudios-section-title">Lectura rapida</h6>
              <div className="estudios-resumen-stack">
                <div className="estudios-chip-row">
                  <span className="estudios-meta-label">Estado</span>
                  <span className={`badge ${claseEstado(detalle.estado_general)}`}>{detalle.estado_general}</span>
                </div>
                <div className="estudios-chip-row">
                  <span className="estudios-meta-label">Responsable</span>
                  <strong>{detalle.responsable_usuario_nombre || 'Sin responsable'}</strong>
                </div>
                <div className="estudios-chip-row">
                  <span className="estudios-meta-label">Ultima decision</span>
                  <strong>{formatearFechaHora(resumen.ultima_decision)}</strong>
                </div>
                <div className="estudios-chip-row">
                  <span className="estudios-meta-label">Ultima sesion</span>
                  <strong>{formatearFechaHora(resumen.ultima_sesion)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SesionesEstudio({ sesiones, sesionForm, setSesionForm, usuarios, guardarSesion }) {
  return (
    <div className="estudios-detalle-scroll">
      <div className="card shadow-sm estudios-section-card mb-3">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-3">
            <h6 className="estudios-section-title mb-0">Registrar sesion</h6>
            <BotonAccion icono="bi-plus-lg" label="Agregar sesion" onClick={guardarSesion} />
          </div>

          <div className="row g-3">
            <div className="col-12 col-lg-4">
              <label className="form-label form-label-sm">Fecha y hora</label>
              <input type="datetime-local" className="form-control form-control-sm" value={sesionForm.fecha} onChange={(e) => setSesionForm((prev) => ({ ...prev, fecha: e.target.value }))} />
            </div>
            <div className="col-12 col-lg-8">
              <label className="form-label form-label-sm">Tema o leccion</label>
              <input className="form-control form-control-sm" value={sesionForm.tema_leccion} onChange={(e) => setSesionForm((prev) => ({ ...prev, tema_leccion: e.target.value }))} />
            </div>
            <div className="col-12 col-lg-6">
              <label className="form-label form-label-sm">Resumen breve</label>
              <input className="form-control form-control-sm" value={sesionForm.resumen_breve} onChange={(e) => setSesionForm((prev) => ({ ...prev, resumen_breve: e.target.value }))} />
            </div>
            <div className="col-12 col-lg-6">
              <label className="form-label form-label-sm">Dudas surgidas</label>
              <input className="form-control form-control-sm" value={sesionForm.dudas_surgidas} onChange={(e) => setSesionForm((prev) => ({ ...prev, dudas_surgidas: e.target.value }))} />
            </div>
            <div className="col-6 col-lg-3">
              <label className="form-label form-label-sm">Asistencia</label>
              <select className="form-select form-select-sm" value={sesionForm.asistencia} onChange={(e) => setSesionForm((prev) => ({ ...prev, asistencia: e.target.value }))}>
                <option value="SI">Si</option>
                <option value="PARCIAL">Parcial</option>
                <option value="NO">No</option>
              </select>
            </div>
            <div className="col-6 col-lg-3">
              <label className="form-label form-label-sm">Percepcion</label>
              <select className="form-select form-select-sm" value={sesionForm.percepcion_avance} onChange={(e) => setSesionForm((prev) => ({ ...prev, percepcion_avance: e.target.value }))}>
                {PERCEPCION_OPCIONES.map((opcion) => (
                  <option key={opcion.valor} value={opcion.valor}>{opcion.etiqueta}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-lg-6">
              <label className="form-label form-label-sm">Responsable</label>
              <select className="form-select form-select-sm" value={sesionForm.responsable_usuario_id} onChange={(e) => setSesionForm((prev) => ({ ...prev, responsable_usuario_id: e.target.value }))}>
                <option value="">Sin responsable</option>
                {usuarios.map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>{usuario.nombre_completo}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-lg-6">
              <label className="form-label form-label-sm">Proxima accion</label>
              <input className="form-control form-control-sm" value={sesionForm.proxima_accion} onChange={(e) => setSesionForm((prev) => ({ ...prev, proxima_accion: e.target.value }))} />
            </div>
            <div className="col-12 col-lg-6">
              <label className="form-label form-label-sm">Proxima fecha sugerida</label>
              <input type="datetime-local" className="form-control form-control-sm" value={sesionForm.proxima_fecha_sugerida} onChange={(e) => setSesionForm((prev) => ({ ...prev, proxima_fecha_sugerida: e.target.value }))} />
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm estudios-section-card">
        <div className="card-body p-0">
          <div className="estudios-table-shell">
            <div className="estudios-table-scroll">
              <table className="table table-sm align-middle mb-0 estudios-sesiones-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Leccion</th>
                    <th>Asistencia</th>
                    <th>Avance</th>
                    <th>Proximo paso</th>
                  </tr>
                </thead>
                <tbody>
                  {sesiones.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-4">No hay sesiones registradas todavia.</td>
                    </tr>
                  )}
                  {sesiones.map((item) => (
                    <tr key={item.id}>
                      <td>{formatearFechaHora(item.fecha)}</td>
                      <td>{item.tema_leccion}</td>
                      <td>{item.asistencia || '-'}</td>
                      <td>{item.percepcion_avance || '-'}</td>
                      <td>{item.proxima_accion || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DecisionesEstudio({ decisiones, decisionForm, setDecisionForm, usuarios, guardarDecision }) {
  return (
    <div className="estudios-detalle-scroll">
      <div className="card shadow-sm estudios-section-card mb-3">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-3">
            <h6 className="estudios-section-title mb-0">Registrar decision</h6>
            <BotonAccion icono="bi-plus-lg" label="Agregar decision" onClick={guardarDecision} />
          </div>

          <div className="row g-3">
            <div className="col-12 col-lg-4">
              <label className="form-label form-label-sm">Tipo</label>
              <select
                className="form-select form-select-sm"
                value={decisionForm.decision_clave}
                onChange={(e) => {
                  const opcion = DECISION_OPCIONES.find((item) => item.clave === e.target.value);
                  setDecisionForm((prev) => ({ ...prev, decision_clave: e.target.value, decision_etiqueta: opcion?.etiqueta || '' }));
                }}
              >
                <option value="">Seleccione</option>
                {DECISION_OPCIONES.map((opcion) => (
                  <option key={opcion.clave} value={opcion.clave}>{opcion.etiqueta}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-lg-4">
              <label className="form-label form-label-sm">Etiqueta</label>
              <input className="form-control form-control-sm" value={decisionForm.decision_etiqueta} onChange={(e) => setDecisionForm((prev) => ({ ...prev, decision_etiqueta: e.target.value }))} />
            </div>
            <div className="col-12 col-lg-4">
              <label className="form-label form-label-sm">Fecha y hora</label>
              <input type="datetime-local" className="form-control form-control-sm" value={decisionForm.fecha_decision} onChange={(e) => setDecisionForm((prev) => ({ ...prev, fecha_decision: e.target.value }))} />
            </div>
            <div className="col-12">
              <label className="form-label form-label-sm">Observaciones</label>
              <input className="form-control form-control-sm" value={decisionForm.observaciones} onChange={(e) => setDecisionForm((prev) => ({ ...prev, observaciones: e.target.value }))} />
            </div>
            <div className="col-12">
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="estudio-requiere-seguimiento" checked={Boolean(decisionForm.requiere_seguimiento)} onChange={(e) => setDecisionForm((prev) => ({ ...prev, requiere_seguimiento: e.target.checked }))} />
                <label className="form-check-label" htmlFor="estudio-requiere-seguimiento">Requiere seguimiento</label>
              </div>
            </div>
            {decisionForm.requiere_seguimiento && (
              <>
                <div className="col-12 col-lg-4">
                  <label className="form-label form-label-sm">Fecha limite</label>
                  <input type="datetime-local" className="form-control form-control-sm" value={decisionForm.seguimiento_fecha_limite} onChange={(e) => setDecisionForm((prev) => ({ ...prev, seguimiento_fecha_limite: e.target.value }))} />
                </div>
                <div className="col-12 col-lg-4">
                  <label className="form-label form-label-sm">Responsable</label>
                  <select className="form-select form-select-sm" value={decisionForm.seguimiento_responsable_usuario_id} onChange={(e) => setDecisionForm((prev) => ({ ...prev, seguimiento_responsable_usuario_id: e.target.value }))}>
                    <option value="">Sin responsable</option>
                    {usuarios.map((usuario) => (
                      <option key={usuario.id} value={usuario.id}>{usuario.nombre_completo}</option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-lg-4">
                  <label className="form-label form-label-sm">Prioridad</label>
                  <select className="form-select form-select-sm" value={decisionForm.prioridad} onChange={(e) => setDecisionForm((prev) => ({ ...prev, prioridad: e.target.value }))}>
                    <option value="BAJA">Baja</option>
                    <option value="MEDIA">Media</option>
                    <option value="ALTA">Alta</option>
                    <option value="URGENTE">Urgente</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="card shadow-sm estudios-section-card">
        <div className="card-body p-0">
          <div className="estudios-table-shell">
            <div className="estudios-table-scroll">
              <table className="table table-sm align-middle mb-0 estudios-decisiones-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Decision</th>
                    <th>Seguimiento</th>
                    <th>Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {decisiones.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center text-muted py-4">No hay decisiones registradas todavia.</td>
                    </tr>
                  )}
                  {decisiones.map((item) => (
                    <tr key={item.id}>
                      <td>{formatearFechaHora(item.fecha_decision)}</td>
                      <td>
                        <div className="fw-semibold">{item.decision_etiqueta}</div>
                        <small className="text-muted">{etiquetaDecision(item.decision_clave)}</small>
                      </td>
                      <td>{item.requiere_seguimiento ? 'Si' : 'No'}</td>
                      <td>{item.observaciones || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AsignacionesEstudio({ asignaciones, asignacionForm, setAsignacionForm, usuarios, guardarAsignacion }) {
  return (
    <div className="estudios-detalle-scroll">
      <div className="card shadow-sm estudios-section-card mb-3">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-3">
            <h6 className="estudios-section-title mb-0">Reasignar estudio</h6>
            <BotonAccion icono="bi-arrow-left-right" label="Actualizar asignacion" onClick={guardarAsignacion} />
          </div>

          <div className="row g-3">
            <div className="col-12 col-lg-6">
              <label className="form-label form-label-sm">Instructor principal</label>
              <input className="form-control form-control-sm" value={asignacionForm.instructor_principal_nombre} onChange={(e) => setAsignacionForm((prev) => ({ ...prev, instructor_principal_nombre: e.target.value }))} />
            </div>
            <div className="col-12 col-lg-6">
              <label className="form-label form-label-sm">Telefono instructor principal</label>
              <input className="form-control form-control-sm" value={asignacionForm.instructor_principal_telefono} onChange={(e) => setAsignacionForm((prev) => ({ ...prev, instructor_principal_telefono: e.target.value }))} />
            </div>
            <div className="col-12 col-lg-6">
              <label className="form-label form-label-sm">Instructor secundario</label>
              <input className="form-control form-control-sm" value={asignacionForm.instructor_secundario_nombre} onChange={(e) => setAsignacionForm((prev) => ({ ...prev, instructor_secundario_nombre: e.target.value }))} />
            </div>
            <div className="col-12 col-lg-6">
              <label className="form-label form-label-sm">Telefono instructor secundario</label>
              <input className="form-control form-control-sm" value={asignacionForm.instructor_secundario_telefono} onChange={(e) => setAsignacionForm((prev) => ({ ...prev, instructor_secundario_telefono: e.target.value }))} />
            </div>
            <div className="col-12 col-lg-6">
              <label className="form-label form-label-sm">Responsable</label>
              <select className="form-select form-select-sm" value={asignacionForm.responsable_usuario_id} onChange={(e) => setAsignacionForm((prev) => ({ ...prev, responsable_usuario_id: e.target.value }))}>
                <option value="">Sin responsable</option>
                {usuarios.map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>{usuario.nombre_completo}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-lg-6">
              <label className="form-label form-label-sm">Motivo</label>
              <input className="form-control form-control-sm" value={asignacionForm.motivo_cambio} onChange={(e) => setAsignacionForm((prev) => ({ ...prev, motivo_cambio: e.target.value }))} />
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm estudios-section-card">
        <div className="card-body p-0">
          <div className="estudios-table-shell">
            <div className="estudios-table-scroll">
              <table className="table table-sm align-middle mb-0 estudios-asignaciones-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Principal</th>
                    <th>Secundario</th>
                    <th>Responsable</th>
                    <th>Vigente</th>
                  </tr>
                </thead>
                <tbody>
                  {asignaciones.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-4">No hay asignaciones registradas todavia.</td>
                    </tr>
                  )}
                  {asignaciones.map((item) => (
                    <tr key={item.id}>
                      <td>{formatearFechaHora(item.fecha_asignacion)}</td>
                      <td>{item.instructor_principal_nombre || '-'}</td>
                      <td>{item.instructor_secundario_nombre || '-'}</td>
                      <td>{item.responsable_usuario_nombre || '-'}</td>
                      <td>{item.vigente ? 'Si' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetalleEstudio(props) {
  const { detalle, cargandoDetalle, detalleVista, setDetalleVista, recargar } = props;

  return (
    <div className="card shadow-sm h-100 estudios-detalle-card">
      <div className="card-header bg-white d-flex align-items-start justify-content-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
            <h5 className="mb-0">{detalle.contacto_nombre}</h5>
            <span className={`badge ${claseEstado(detalle.estado_general)}`}>{detalle.estado_general}</span>
            <span className="badge text-bg-light border">{detalle.modalidad}</span>
          </div>
          <div className="small text-muted d-flex flex-wrap gap-3">
            <span>Inicio: {formatearFecha(detalle.fecha_inicio)}</span>
            <span>Origen: {detalle.origen_clave || '-'}</span>
            <span>Material: {detalle.material_estudio || '-'}</span>
          </div>
        </div>
        <BotonAccion icono="bi-arrow-clockwise" label="Actualizar" onClick={recargar} outline />
      </div>

      <div className="card-body">
        <div className="estudios-vista-tabs mb-3">
          {DETALLE_VISTAS.map((vista) => (
            <button
              key={vista.valor}
              type="button"
              className={`btn btn-sm ${detalleVista === vista.valor ? 'btn-primary' : 'btn-outline-primary'} admin-responsive-action-btn`}
              onClick={() => setDetalleVista(vista.valor)}
              aria-pressed={detalleVista === vista.valor}
            >
              <i className={`bi ${vista.icono}`} aria-hidden="true"></i>
              <span className="admin-responsive-btn-label">{vista.etiqueta}</span>
            </button>
          ))}
        </div>

        {cargandoDetalle ? (
          <div className="d-flex align-items-center justify-content-center text-center text-muted py-5 estudios-detalle-scroll">
            <div>
              <div className="spinner-border spinner-iasd mb-3" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <div>Cargando detalle del estudio biblico...</div>
            </div>
          </div>
        ) : (
          <>
            {detalleVista === 'RESUMEN' && <ResumenEstudio detalle={detalle} />}
            {detalleVista === 'SESIONES' && <SesionesEstudio sesiones={props.sesiones} sesionForm={props.sesionForm} setSesionForm={props.setSesionForm} usuarios={props.usuarios} guardarSesion={props.guardarSesion} />}
            {detalleVista === 'DECISIONES' && <DecisionesEstudio decisiones={props.decisiones} decisionForm={props.decisionForm} setDecisionForm={props.setDecisionForm} usuarios={props.usuarios} guardarDecision={props.guardarDecision} />}
            {detalleVista === 'ASIGNACIONES' && <AsignacionesEstudio asignaciones={props.asignaciones} asignacionForm={props.asignacionForm} setAsignacionForm={props.setAsignacionForm} usuarios={props.usuarios} guardarAsignacion={props.guardarAsignacion} />}
          </>
        )}
      </div>
    </div>
  );
}

export default function EstudiosBiblicosPage() {
  const {
    filtros,
    dashboard,
    estudios,
    usuarios,
    campanas,
    seleccionadoId,
    setSeleccionadoId,
    detalle,
    cargando,
    cargandoDetalle,
    guardando,
    editandoId,
    detalleVista,
    setDetalleVista,
    estudioForm,
    setEstudioForm,
    sesionForm,
    setSesionForm,
    decisionForm,
    setDecisionForm,
    asignacionForm,
    setAsignacionForm,
    asignaciones,
    sesiones,
    decisiones,
    cambiarFiltro,
    editarEstudio,
    resetEstudioForm,
    guardarEstudio,
    archivarEstudio,
    guardarSesion,
    guardarDecision,
    guardarAsignacion,
    recargar
  } = useEstudiosBiblicos();

  const mostrarCampanaOrigen = estudioForm.origen_clave === 'CAMPANA';
  const mostrarMotivoCierre = ['PAUSADO', 'NO_CONTINUA', 'CERRADO'].includes(estudioForm.estado_general);

  return (
    <div className="container-fluid py-3 py-lg-4">
      <div className="row g-3 mb-3 estudios-top-row">
        <div className="col-12 col-xxl-7">
          <div className="card shadow-sm h-100 estudios-filtros-card">
            <div className="card-body">
              <div className="row g-2 align-items-end">
                <div className="col-12 col-lg-4">
                  <SearchInput
                    id="estudios-busqueda"
                    value={filtros.q}
                    onChange={(valor) => cambiarFiltro('q', valor)}
                    placeholder="Buscar por persona, telefono o material"
                  />
                </div>
                <div className="col-6 col-lg-2">
                  <label className="form-label form-label-sm">Estado</label>
                  <select className="form-select form-select-sm" value={filtros.estado_general} onChange={(e) => cambiarFiltro('estado_general', e.target.value)}>
                    {ESTADO_OPCIONES.map((opcion) => (
                      <option key={opcion.valor || 'todos'} value={opcion.valor}>{opcion.etiqueta}</option>
                    ))}
                  </select>
                </div>
                <div className="col-6 col-lg-2">
                  <label className="form-label form-label-sm">Origen</label>
                  <select className="form-select form-select-sm" value={filtros.origen_clave} onChange={(e) => cambiarFiltro('origen_clave', e.target.value)}>
                    {ORIGEN_OPCIONES.map((opcion) => (
                      <option key={opcion.valor || 'todos'} value={opcion.valor}>{opcion.etiqueta}</option>
                    ))}
                  </select>
                </div>
                <div className="col-6 col-lg-2">
                  <label className="form-label form-label-sm">Responsable</label>
                  <select className="form-select form-select-sm" value={filtros.responsable_usuario_id} onChange={(e) => cambiarFiltro('responsable_usuario_id', e.target.value)}>
                    <option value="">Todos</option>
                    {usuarios.map((usuario) => (
                      <option key={usuario.id} value={usuario.id}>{usuario.nombre_completo}</option>
                    ))}
                  </select>
                </div>
                <div className="col-6 col-lg-1">
                  <label className="form-label form-label-sm">Desde</label>
                  <input type="date" className="form-control form-control-sm" value={filtros.fecha_desde} onChange={(e) => cambiarFiltro('fecha_desde', e.target.value)} />
                </div>
                <div className="col-6 col-lg-1">
                  <label className="form-label form-label-sm">Hasta</label>
                  <input type="date" className="form-control form-control-sm" value={filtros.fecha_hasta} onChange={(e) => cambiarFiltro('fecha_hasta', e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xxl-5">
          <div className="row g-3">
            <KpiCard label="Estudios" value={dashboard.total_estudios} icon="bi-journal-bookmark" />
            <KpiCard label="Activos" value={dashboard.total_activos} icon="bi-activity" />
            <KpiCard label="Decision" value={dashboard.total_listos_decision} icon="bi-lightbulb" />
            <KpiCard label="Bautizados" value={dashboard.total_bautizados} icon="bi-droplet" />
          </div>
        </div>
      </div>
      <div className="row g-3">
        <div className="col-12 col-xxl-4">
          <div className="card shadow-sm mb-3 estudios-form-card">
            <div className="card-header bg-white d-flex align-items-center justify-content-between gap-2 flex-wrap">
              <div>
                <h5 className="mb-0">{editandoId ? 'Editar estudio' : 'Nuevo estudio'}</h5>
                <small className="text-muted">Seguimiento pastoral con trazabilidad de sesiones y decisiones</small>
              </div>
              <div className="d-flex gap-2">
                <BotonAccion icono={editandoId ? 'bi-floppy' : 'bi-plus-lg'} label={editandoId ? 'Actualizar' : 'Agregar'} onClick={guardarEstudio} disabled={guardando} />
                <BotonAccion icono="bi-arrow-counterclockwise" label="Limpiar" onClick={resetEstudioForm} outline />
              </div>
            </div>

            <div className="card-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label form-label-sm">Persona</label>
                  <input className="form-control form-control-sm" value={estudioForm.persona_nombre} onChange={(e) => setEstudioForm((prev) => ({ ...prev, persona_nombre: e.target.value }))} />
                </div>
                <div className="col-6">
                  <label className="form-label form-label-sm">Telefono</label>
                  <input className="form-control form-control-sm" value={estudioForm.telefono} onChange={(e) => setEstudioForm((prev) => ({ ...prev, telefono: e.target.value }))} />
                </div>
                <div className="col-6">
                  <label className="form-label form-label-sm">Correo</label>
                  <input className="form-control form-control-sm" value={estudioForm.correo} onChange={(e) => setEstudioForm((prev) => ({ ...prev, correo: e.target.value }))} />
                </div>
                <div className="col-12">
                  <label className="form-label form-label-sm">Direccion</label>
                  <input className="form-control form-control-sm" value={estudioForm.direccion} onChange={(e) => setEstudioForm((prev) => ({ ...prev, direccion: e.target.value }))} />
                </div>
                <div className="col-12">
                  <label className="form-label form-label-sm">Barrio o comunidad</label>
                  <input className="form-control form-control-sm" value={estudioForm.barrio_comunidad} onChange={(e) => setEstudioForm((prev) => ({ ...prev, barrio_comunidad: e.target.value }))} />
                </div>
                <div className="col-6">
                  <label className="form-label form-label-sm">Origen</label>
                  <select className="form-select form-select-sm" value={estudioForm.origen_clave} onChange={(e) => setEstudioForm((prev) => ({ ...prev, origen_clave: e.target.value, campana_origen_id: e.target.value === 'CAMPANA' ? prev.campana_origen_id : '' }))}>
                    {ORIGEN_OPCIONES.filter((opcion) => opcion.valor).map((opcion) => (
                      <option key={opcion.valor} value={opcion.valor}>{opcion.etiqueta}</option>
                    ))}
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label form-label-sm">Modalidad</label>
                  <select className="form-select form-select-sm" value={estudioForm.modalidad} onChange={(e) => setEstudioForm((prev) => ({ ...prev, modalidad: e.target.value }))}>
                    {MODALIDAD_OPCIONES.map((opcion) => (
                      <option key={opcion.valor} value={opcion.valor}>{opcion.etiqueta}</option>
                    ))}
                  </select>
                </div>
                {mostrarCampanaOrigen && (
                  <div className="col-12">
                    <label className="form-label form-label-sm">Campana de origen</label>
                    <select className="form-select form-select-sm" value={estudioForm.campana_origen_id} onChange={(e) => setEstudioForm((prev) => ({ ...prev, campana_origen_id: e.target.value }))}>
                      <option value="">Seleccione</option>
                      {campanas.map((campana) => (
                        <option key={campana.id} value={campana.id}>{campana.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="col-12 col-lg-6">
                  <label className="form-label form-label-sm">Instructor principal</label>
                  <input className="form-control form-control-sm" value={estudioForm.instructor_principal_nombre} onChange={(e) => setEstudioForm((prev) => ({ ...prev, instructor_principal_nombre: e.target.value }))} />
                </div>
                <div className="col-12 col-lg-6">
                  <label className="form-label form-label-sm">Telefono instructor principal</label>
                  <input className="form-control form-control-sm" value={estudioForm.instructor_principal_telefono} onChange={(e) => setEstudioForm((prev) => ({ ...prev, instructor_principal_telefono: e.target.value }))} />
                </div>
                <div className="col-12 col-lg-6">
                  <label className="form-label form-label-sm">Instructor secundario</label>
                  <input className="form-control form-control-sm" value={estudioForm.instructor_secundario_nombre} onChange={(e) => setEstudioForm((prev) => ({ ...prev, instructor_secundario_nombre: e.target.value }))} />
                </div>
                <div className="col-12 col-lg-6">
                  <label className="form-label form-label-sm">Telefono instructor secundario</label>
                  <input className="form-control form-control-sm" value={estudioForm.instructor_secundario_telefono} onChange={(e) => setEstudioForm((prev) => ({ ...prev, instructor_secundario_telefono: e.target.value }))} />
                </div>
                <div className="col-12">
                  <label className="form-label form-label-sm">Responsable</label>
                  <select className="form-select form-select-sm" value={estudioForm.responsable_usuario_id} onChange={(e) => setEstudioForm((prev) => ({ ...prev, responsable_usuario_id: e.target.value }))}>
                    <option value="">Sin responsable</option>
                    {usuarios.map((usuario) => (
                      <option key={usuario.id} value={usuario.id}>{usuario.nombre_completo}</option>
                    ))}
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label form-label-sm">Fecha inicio</label>
                  <input type="date" className="form-control form-control-sm" value={estudioForm.fecha_inicio} onChange={(e) => setEstudioForm((prev) => ({ ...prev, fecha_inicio: e.target.value }))} />
                </div>
                <div className="col-6">
                  <label className="form-label form-label-sm">Proxima sesion</label>
                  <input type="datetime-local" className="form-control form-control-sm" value={estudioForm.proxima_sesion} onChange={(e) => setEstudioForm((prev) => ({ ...prev, proxima_sesion: e.target.value }))} />
                </div>
                <div className="col-12 col-lg-6">
                  <label className="form-label form-label-sm">Material</label>
                  <input className="form-control form-control-sm" value={estudioForm.material_estudio} onChange={(e) => setEstudioForm((prev) => ({ ...prev, material_estudio: e.target.value }))} />
                </div>
                <div className="col-12 col-lg-6">
                  <label className="form-label form-label-sm">Leccion actual</label>
                  <input className="form-control form-control-sm" value={estudioForm.leccion_actual} onChange={(e) => setEstudioForm((prev) => ({ ...prev, leccion_actual: e.target.value }))} />
                </div>
                <div className="col-6">
                  <label className="form-label form-label-sm">Lecciones completadas</label>
                  <input type="number" min="0" className="form-control form-control-sm" value={estudioForm.total_lecciones_completadas} onChange={(e) => setEstudioForm((prev) => ({ ...prev, total_lecciones_completadas: e.target.value }))} />
                </div>
                <div className="col-6">
                  <label className="form-label form-label-sm">Estado</label>
                  <select className="form-select form-select-sm" value={estudioForm.estado_general} onChange={(e) => setEstudioForm((prev) => ({ ...prev, estado_general: e.target.value }))}>
                    {ESTADO_OPCIONES.filter((opcion) => opcion.valor).map((opcion) => (
                      <option key={opcion.valor} value={opcion.valor}>{opcion.etiqueta}</option>
                    ))}
                  </select>
                </div>
                {editandoId && (
                  <div className="col-12">
                    <label className="form-label form-label-sm">Motivo de reasignacion</label>
                    <input className="form-control form-control-sm" value={estudioForm.motivo_reasignacion} onChange={(e) => setEstudioForm((prev) => ({ ...prev, motivo_reasignacion: e.target.value }))} />
                  </div>
                )}
                {mostrarMotivoCierre && (
                  <div className="col-12">
                    <label className="form-label form-label-sm">Motivo de pausa o cierre</label>
                    <input className="form-control form-control-sm" value={estudioForm.motivo_cierre_pausa} onChange={(e) => setEstudioForm((prev) => ({ ...prev, motivo_cierre_pausa: e.target.value }))} />
                  </div>
                )}
                <div className="col-12">
                  <label className="form-label form-label-sm">Observaciones</label>
                  <textarea className="form-control form-control-sm" rows="2" value={estudioForm.observaciones} onChange={(e) => setEstudioForm((prev) => ({ ...prev, observaciones: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm estudios-lista-card">
            <div className="card-header bg-white d-flex align-items-center justify-content-between gap-2">
              <h5 className="mb-0">Estudios registrados</h5>
              <span className="badge text-bg-light border">{estudios.length}</span>
            </div>
            <div className="card-body p-0">
              <div className="estudios-table-shell">
                <div className="estudios-table-scroll">
                  <table className="table table-sm align-middle mb-0 estudios-lista-table">
                    <thead>
                      <tr>
                        <th>Persona</th>
                        <th>Estado</th>
                        <th>Origen</th>
                        <th>Proxima</th>
                        <th className="text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!cargando && estudios.length === 0 && (
                        <tr>
                          <td colSpan="5" className="text-center text-muted py-4">No hay estudios biblicos registrados todavia.</td>
                        </tr>
                      )}
                      {estudios.map((item) => (
                        <tr key={item.id} className={seleccionadoId === item.id ? 'table-active' : ''}>
                          <td>
                            <button type="button" className="btn btn-link p-0 text-start text-decoration-none fw-semibold" onClick={() => setSeleccionadoId(item.id)}>
                              {item.contacto_nombre}
                            </button>
                            <div className="small text-muted">{item.contacto_telefono || 'Sin telefono'}</div>
                          </td>
                          <td><span className={`badge ${claseEstado(item.estado_general)}`}>{item.estado_general}</span></td>
                          <td>{item.origen_clave || '-'}</td>
                          <td>{formatearFechaHora(item.proxima_sesion)}</td>
                          <td className="text-end">
                            <div className="d-inline-flex gap-2">
                              <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => editarEstudio(item)} title="Editar">
                                <i className="bi bi-pencil" aria-hidden="true"></i>
                              </button>
                              <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => archivarEstudio(item.id)} title="Archivar">
                                <i className="bi bi-archive" aria-hidden="true"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xxl-8">
          {!detalle ? (
            <DetalleVacio />
          ) : (
            <DetalleEstudio
              detalle={detalle}
              cargandoDetalle={cargandoDetalle}
              detalleVista={detalleVista}
              setDetalleVista={setDetalleVista}
              recargar={recargar}
              usuarios={usuarios}
              sesiones={sesiones}
              decisiones={decisiones}
              asignaciones={asignaciones}
              sesionForm={sesionForm}
              setSesionForm={setSesionForm}
              decisionForm={decisionForm}
              setDecisionForm={setDecisionForm}
              asignacionForm={asignacionForm}
              setAsignacionForm={setAsignacionForm}
              guardarSesion={guardarSesion}
              guardarDecision={guardarDecision}
              guardarAsignacion={guardarAsignacion}
            />
          )}
        </div>
      </div>
    </div>
  );
}
