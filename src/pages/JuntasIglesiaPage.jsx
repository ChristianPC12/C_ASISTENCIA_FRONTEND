import SearchInput from '../components/ui/SearchInput';
import { useJuntasIglesia } from '../hooks/useJuntasIglesia';

const TIPO_JUNTA_OPCIONES = [
  { valor: '', etiqueta: 'Todos los tipos' },
  { valor: 'ORDINARIA', etiqueta: 'Ordinaria' },
  { valor: 'EXTRAORDINARIA', etiqueta: 'Extraordinaria' },
  { valor: 'SEGUIMIENTO', etiqueta: 'Seguimiento' },
  { valor: 'WHATSAPP', etiqueta: 'WhatsApp' },
  { valor: 'CONTINUACION', etiqueta: 'Continuación' }
];

const ESTADO_JUNTA_OPCIONES = [
  { valor: '', etiqueta: 'Todos los estados' },
  { valor: 'BORRADOR', etiqueta: 'Borrador' },
  { valor: 'EN_PROCESO', etiqueta: 'En proceso' },
  { valor: 'CERRADA', etiqueta: 'Cerrada' },
  { valor: 'APROBADA', etiqueta: 'Aprobada' },
  { valor: 'ARCHIVADA', etiqueta: 'Archivada' }
];

const TIPO_PUNTO_OPCIONES = [
  { valor: 'NUEVO', etiqueta: 'Nuevo' },
  { valor: 'INFORMATIVO', etiqueta: 'Informativo' },
  { valor: 'VOTACION', etiqueta: 'Votación' },
  { valor: 'SEGUIMIENTO', etiqueta: 'Seguimiento' },
  { valor: 'PENDIENTE_ANTERIOR', etiqueta: 'Pendiente anterior' },
  { valor: 'APROBADO_WHATSAPP', etiqueta: 'Aprobado por WhatsApp' }
];

const ESTADO_PUNTO_OPCIONES = [
  { valor: 'PENDIENTE', etiqueta: 'Pendiente' },
  { valor: 'DISCUTIDO', etiqueta: 'Discutido' },
  { valor: 'VOTADO', etiqueta: 'Votado' },
  { valor: 'APROBADO', etiqueta: 'Aprobado' },
  { valor: 'RECHAZADO', etiqueta: 'Rechazado' },
  { valor: 'POSPUESTO', etiqueta: 'Pospuesto' },
  { valor: 'TRASLADADO', etiqueta: 'Trasladado' },
  { valor: 'EJECUTADO', etiqueta: 'Ejecutado' },
  { valor: 'RESUELTO_WHATSAPP', etiqueta: 'Resuelto por WhatsApp' }
];

const PRIORIDAD_OPCIONES = [
  { valor: 'BAJA', etiqueta: 'Baja' },
  { valor: 'MEDIA', etiqueta: 'Media' },
  { valor: 'ALTA', etiqueta: 'Alta' }
];

const TIPO_VOTO_OPCIONES = [
  { valor: 'UNANIME', etiqueta: 'Unánime' },
  { valor: 'MAYORIA', etiqueta: 'Mayoría' },
  { valor: 'CONSENSO', etiqueta: 'Consenso' },
  { valor: 'SOLO_INFORMADO', etiqueta: 'Solo informado' }
];

const REFERENCIA_MODULO_OPCIONES = [
  { valor: '', etiqueta: 'Sin vínculo' },
  { valor: 'CAMPANAS', etiqueta: 'Campañas' },
  { valor: 'ESTUDIOS_BIBLICOS', etiqueta: 'Estudios Bíblicos' },
  { valor: 'ASISTENCIA', etiqueta: 'Asistencia' },
  { valor: 'OTRO', etiqueta: 'Otro' }
];

const DETALLE_VISTAS = [
  { valor: 'RESUMEN', etiqueta: 'Resumen', icono: 'bi-card-text' },
  { valor: 'AGENDA', etiqueta: 'Agenda', icono: 'bi-list-check' },
  { valor: 'PENDIENTES', etiqueta: 'Pendientes', icono: 'bi-hourglass-split' },
  { valor: 'ACTA', etiqueta: 'Acta', icono: 'bi-journal-richtext' }
];

const VISTA_JUNTAS = 'JUNTAS';
const VISTA_MODERADORES = 'MODERADORES';
const VISTA_SECRETARIAS = 'SECRETARIAS';

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

function formatearHora(valor) {
  if (!valor) return '-';
  return String(valor).slice(0, 5);
}

function claseEstado(estado) {
  switch (estado) {
    case 'APROBADA':
    case 'APROBADO':
    case 'EJECUTADO':
      return 'bg-success-subtle text-success-emphasis border-success-subtle';
    case 'BORRADOR':
    case 'PENDIENTE':
    case 'POSPUESTO':
      return 'bg-warning-subtle text-warning-emphasis border-warning-subtle';
    case 'EN_PROCESO':
    case 'DISCUTIDO':
    case 'VOTADO':
    case 'TRASLADADO':
      return 'bg-primary-subtle text-primary-emphasis border-primary-subtle';
    case 'RECHAZADO':
    case 'ARCHIVADA':
      return 'bg-secondary-subtle text-secondary-emphasis border-secondary-subtle';
    case 'RESUELTO_WHATSAPP':
      return 'bg-info-subtle text-info-emphasis border-info-subtle';
    default:
      return 'bg-light text-dark border';
  }
}

function KpiCard({ label, value, icon }) {
  return (
    <div className="col-6 col-lg-3">
      <div className="card shadow-sm juntas-kpi-card h-100">
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

function BotonAccion({ icono, label, onClick, outline = false, disabled = false }) {
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

function TablaShell({ className, children }) {
  return (
    <div className="juntas-table-shell">
      <div className="table-responsive">
        <div className="juntas-table-scroll">
          <table className={`table table-sm align-middle mb-0 ${className}`}>{children}</table>
        </div>
      </div>
    </div>
  );
}

function DetalleVacio() {
  return (
    <div className="d-flex align-items-center justify-content-center text-center text-muted py-5">
      Seleccione una junta para revisar su resumen, agenda, pendientes y acta.
    </div>
  );
}

function ResumenJunta({ detalle }) {
  if (!detalle) return null;
  const resumen = detalle.resumen || {};
  const timeline = detalle.timeline || [];

  return (
    <div className="d-flex flex-column gap-3">
      <div className="row g-3">
        <KpiCard label="Puntos" value={resumen.total_puntos} icon="bi-list-check" />
        <KpiCard label="Aprobados" value={resumen.total_aprobados} icon="bi-check2-circle" />
        <KpiCard label="Pendientes" value={resumen.total_pendientes} icon="bi-hourglass-split" />
        <KpiCard label="WhatsApp" value={resumen.total_resueltos_whatsapp} icon="bi-whatsapp" />
      </div>

      <div className="card border-0 bg-light">
        <div className="card-body">
          <div className="juntas-section-title">Ficha general</div>
          <div className="juntas-resumen-grid">
            <div>
              <span className="juntas-meta-label">Fecha</span>
              <div>{formatearFecha(detalle.fecha)}</div>
            </div>
            <div>
              <span className="juntas-meta-label">Tipo</span>
              <div>{detalle.tipo || '-'}</div>
            </div>
            <div>
              <span className="juntas-meta-label">Moderador</span>
              <div>{detalle.moderador || 'Sin definir'}</div>
            </div>
            <div>
              <span className="juntas-meta-label">Secretaría</span>
              <div>{detalle.secretario || 'Sin definir'}</div>
            </div>
            <div>
              <span className="juntas-meta-label">Horario</span>
              <div>{formatearHora(detalle.hora_inicio)} - {formatearHora(detalle.hora_fin)}</div>
            </div>
            <div>
              <span className="juntas-meta-label">Quórum</span>
              <div>{detalle.quorum_texto || 'No indicado'}</div>
            </div>
          </div>
          {detalle.resumen_general ? <p className="mb-0 mt-3"><strong>Resumen:</strong> {detalle.resumen_general}</p> : null}
          {detalle.observaciones_generales ? <p className="mb-0 mt-2"><strong>Observaciones:</strong> {detalle.observaciones_generales}</p> : null}
        </div>
      </div>

      <div className="card border-0 bg-light">
        <div className="card-body">
          <div className="juntas-section-title">Movimiento reciente</div>
          <div className="d-flex flex-column gap-2">
            {timeline.length ? timeline.map((item, index) => (
              <div key={`${item.fecha ?? 'tl'}-${index}`} className="border rounded-3 p-2 bg-white">
                <div className="small text-muted">{formatearFechaHora(item.fecha || item.creado_en)}</div>
                <div className="fw-semibold">{item.titulo || item.evento || 'Movimiento registrado'}</div>
                {item.descripcion ? <div>{item.descripcion}</div> : null}
              </div>
            )) : (
              <div className="text-muted small">Todavía no hay movimientos registrados para esta junta.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AgendaJunta({
  detalle,
  usuarios,
  referenciasPorModulo,
  puntoForm,
  setPuntoForm,
  votacionForm,
  setVotacionForm,
  guardarPunto,
  guardarVotacion,
  editandoPuntoId,
  editandoVotacionId,
  resetPuntoForm,
  resetVotacionForm,
  editarPunto,
  prepararVotacion,
  editarVotacion,
  guardando
}) {
  if (!detalle) return null;

  const referencias = referenciasPorModulo?.[puntoForm.referencia_modulo] || [];

  return (
    <div className="d-flex flex-column gap-3">
      <div className="card border-0 bg-light">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
            <div className="juntas-section-title mb-0">{editandoPuntoId ? 'Editar punto' : 'Nuevo punto de agenda'}</div>
            <div className="d-flex gap-2">
              <BotonAccion icono="bi-arrow-counterclockwise" label="Limpiar" outline onClick={resetPuntoForm} disabled={guardando} />
              <BotonAccion icono="bi-plus-lg" label={editandoPuntoId ? 'Actualizar' : 'Agregar'} onClick={guardarPunto} disabled={guardando} />
            </div>
          </div>

          <div className="row g-3">
            <div className="col-6 col-md-2">
              <label className="form-label small">Orden</label>
              <input type="number" min="1" className="form-control form-control-sm" value={puntoForm.numero_orden} onChange={(e) => setPuntoForm((prev) => ({ ...prev, numero_orden: e.target.value }))} />
            </div>
            <div className="col-12 col-md-5">
              <label className="form-label small">Título</label>
              <input type="text" className="form-control form-control-sm" value={puntoForm.titulo} onChange={(e) => setPuntoForm((prev) => ({ ...prev, titulo: e.target.value }))} />
            </div>
            <div className="col-12 col-md-5">
              <label className="form-label small">Departamento</label>
              <input type="text" className="form-control form-control-sm" value={puntoForm.departamento_origen} onChange={(e) => setPuntoForm((prev) => ({ ...prev, departamento_origen: e.target.value }))} />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label small">Presentado por</label>
              <input type="text" className="form-control form-control-sm" value={puntoForm.presentado_por} onChange={(e) => setPuntoForm((prev) => ({ ...prev, presentado_por: e.target.value }))} />
            </div>
            <div className="col-6 col-md-4">
              <label className="form-label small">Tipo</label>
              <select className="form-select form-select-sm" value={puntoForm.tipo_punto} onChange={(e) => setPuntoForm((prev) => ({ ...prev, tipo_punto: e.target.value }))}>
                {TIPO_PUNTO_OPCIONES.map((item) => <option key={item.valor} value={item.valor}>{item.etiqueta}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-4">
              <label className="form-label small">Estado</label>
              <select className="form-select form-select-sm" value={puntoForm.estado} onChange={(e) => setPuntoForm((prev) => ({ ...prev, estado: e.target.value }))}>
                {ESTADO_PUNTO_OPCIONES.map((item) => <option key={item.valor} value={item.valor}>{item.etiqueta}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label small">Prioridad</label>
              <select className="form-select form-select-sm" value={puntoForm.prioridad} onChange={(e) => setPuntoForm((prev) => ({ ...prev, prioridad: e.target.value }))}>
                {PRIORIDAD_OPCIONES.map((item) => <option key={item.valor} value={item.valor}>{item.etiqueta}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label small">Responsable</label>
              <select className="form-select form-select-sm" value={puntoForm.responsable_seguimiento_usuario_id} onChange={(e) => setPuntoForm((prev) => ({ ...prev, responsable_seguimiento_usuario_id: e.target.value }))}>
                <option value="">Sin responsable</option>
                {usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nombre_usuario}</option>)}
              </select>
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label small">Fecha límite</label>
              <input type="date" className="form-control form-control-sm" value={puntoForm.fecha_limite} onChange={(e) => setPuntoForm((prev) => ({ ...prev, fecha_limite: e.target.value }))} />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label small">Punto anterior</label>
              <select className="form-select form-select-sm" value={puntoForm.punto_anterior_id} onChange={(e) => setPuntoForm((prev) => ({ ...prev, punto_anterior_id: e.target.value }))}>
                <option value="">Sin referencia</option>
                {(detalle.puntos || []).map((item) => <option key={item.id} value={item.id}>{item.numero_orden}. {item.titulo}</option>)}
              </select>
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label small">Vínculo</label>
              <select className="form-select form-select-sm" value={puntoForm.referencia_modulo} onChange={(e) => setPuntoForm((prev) => ({ ...prev, referencia_modulo: e.target.value, referencia_entidad_id: '' }))}>
                {REFERENCIA_MODULO_OPCIONES.map((item) => <option key={item.valor || 'none'} value={item.valor}>{item.etiqueta}</option>)}
              </select>
            </div>
            <div className="col-12 col-md-8">
              <label className="form-label small">Registro vinculado</label>
              <select className="form-select form-select-sm" value={puntoForm.referencia_entidad_id} onChange={(e) => setPuntoForm((prev) => ({ ...prev, referencia_entidad_id: e.target.value }))}>
                <option value="">Sin vínculo específico</option>
                {referencias.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
              </select>
            </div>
            <div className="col-12">
              <label className="form-label small">Descripción base</label>
              <textarea className="form-control form-control-sm" rows="2" value={puntoForm.descripcion_base} onChange={(e) => setPuntoForm((prev) => ({ ...prev, descripcion_base: e.target.value }))}></textarea>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label small">Discusión</label>
              <textarea className="form-control form-control-sm" rows="2" value={puntoForm.discusion_resumen} onChange={(e) => setPuntoForm((prev) => ({ ...prev, discusion_resumen: e.target.value }))}></textarea>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label small">Decisión final</label>
              <textarea className="form-control form-control-sm" rows="2" value={puntoForm.decision_final} onChange={(e) => setPuntoForm((prev) => ({ ...prev, decision_final: e.target.value }))}></textarea>
            </div>
            <div className="col-12">
              <div className="d-flex flex-wrap gap-3">
                <div className="form-check">
                  <input id="junta-confidencial" className="form-check-input" type="checkbox" checked={Boolean(puntoForm.confidencial)} onChange={(e) => setPuntoForm((prev) => ({ ...prev, confidencial: e.target.checked }))} />
                  <label htmlFor="junta-confidencial" className="form-check-label">Confidencial</label>
                </div>
                <div className="form-check">
                  <input id="junta-pasar-proxima" className="form-check-input" type="checkbox" checked={Boolean(puntoForm.pasar_proxima_junta)} onChange={(e) => setPuntoForm((prev) => ({ ...prev, pasar_proxima_junta: e.target.checked }))} />
                  <label htmlFor="junta-pasar-proxima" className="form-check-label">Pasar a próxima junta</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 bg-light">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
            <div className="juntas-section-title mb-0">{editandoVotacionId ? 'Editar votación' : 'Registrar votación'}</div>
            <div className="d-flex gap-2">
              <BotonAccion icono="bi-arrow-counterclockwise" label="Limpiar" outline onClick={resetVotacionForm} disabled={guardando} />
              <BotonAccion icono="bi-check2-square" label={editandoVotacionId ? 'Actualizar' : 'Guardar'} onClick={guardarVotacion} disabled={guardando} />
            </div>
          </div>
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <label className="form-label small">Punto</label>
              <select className="form-select form-select-sm" value={votacionForm.punto_agenda_id} onChange={(e) => setVotacionForm((prev) => ({ ...prev, punto_agenda_id: e.target.value }))}>
                <option value="">Seleccione</option>
                {(detalle.puntos || []).map((item) => <option key={item.id} value={item.id}>{item.numero_orden}. {item.titulo}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label small">Tipo de voto</label>
              <select className="form-select form-select-sm" value={votacionForm.tipo_voto} onChange={(e) => setVotacionForm((prev) => ({ ...prev, tipo_voto: e.target.value }))}>
                {TIPO_VOTO_OPCIONES.map((item) => <option key={item.valor} value={item.valor}>{item.etiqueta}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label small">Estado resultante</label>
              <select className="form-select form-select-sm" value={votacionForm.estado_resultante} onChange={(e) => setVotacionForm((prev) => ({ ...prev, estado_resultante: e.target.value }))}>
                {ESTADO_PUNTO_OPCIONES.map((item) => <option key={item.valor} value={item.valor}>{item.etiqueta}</option>)}
              </select>
            </div>
            <div className="col-12 col-md-2">
              <label className="form-label small">Fecha</label>
              <input type="datetime-local" className="form-control form-control-sm" value={votacionForm.fecha_voto} onChange={(e) => setVotacionForm((prev) => ({ ...prev, fecha_voto: e.target.value }))} />
            </div>
            <div className="col-12">
              <label className="form-label small">Texto del voto o acuerdo</label>
              <textarea className="form-control form-control-sm" rows="2" value={votacionForm.texto_voto} onChange={(e) => setVotacionForm((prev) => ({ ...prev, texto_voto: e.target.value }))}></textarea>
            </div>
            <div className="col-4 col-md-2">
              <label className="form-label small">A favor</label>
              <input type="number" min="0" className="form-control form-control-sm" value={votacionForm.votos_favor} onChange={(e) => setVotacionForm((prev) => ({ ...prev, votos_favor: e.target.value }))} />
            </div>
            <div className="col-4 col-md-2">
              <label className="form-label small">En contra</label>
              <input type="number" min="0" className="form-control form-control-sm" value={votacionForm.votos_contra} onChange={(e) => setVotacionForm((prev) => ({ ...prev, votos_contra: e.target.value }))} />
            </div>
            <div className="col-4 col-md-2">
              <label className="form-label small">Abst.</label>
              <input type="number" min="0" className="form-control form-control-sm" value={votacionForm.abstenciones} onChange={(e) => setVotacionForm((prev) => ({ ...prev, abstenciones: e.target.value }))} />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label small">Observación</label>
              <input type="text" className="form-control form-control-sm" value={votacionForm.observacion} onChange={(e) => setVotacionForm((prev) => ({ ...prev, observacion: e.target.value }))} />
            </div>
          </div>
        </div>
      </div>

      <div className="card juntas-section-card">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
            <div className="juntas-section-title mb-0">Agenda de la junta</div>
            <span className="badge text-bg-light border">{detalle.puntos?.length || 0}</span>
          </div>
          <TablaShell className="juntas-puntos-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Punto</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Responsable</th>
                <th>Límite</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(detalle.puntos || []).map((item) => (
                <tr key={item.id}>
                  <td>{item.numero_orden}</td>
                  <td>
                    <div className="fw-semibold">{item.titulo}</div>
                    <div className="small text-muted">{item.departamento_origen || 'Sin departamento'}</div>
                  </td>
                  <td>{item.tipo_punto}</td>
                  <td><span className={`badge border ${claseEstado(item.estado)}`}>{item.estado}</span></td>
                  <td>{item.responsable_nombre || 'Sin responsable'}</td>
                  <td>{formatearFecha(item.fecha_limite)}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <BotonAccion icono="bi-pencil-square" label="Editar" outline onClick={() => editarPunto(item)} />
                      <BotonAccion icono="bi-check2-square" label="Votar" onClick={() => prepararVotacion(item)} />
                    </div>
                  </td>
                </tr>
              ))}
              {!detalle.puntos?.length ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">Todavía no hay puntos cargados.</td>
                </tr>
              ) : null}
            </tbody>
          </TablaShell>

          {detalle.votaciones?.length ? (
            <>
              <div className="juntas-section-title mt-4">Votaciones registradas</div>
              <TablaShell className="juntas-votaciones-table">
                <thead>
                  <tr>
                    <th>Punto</th>
                    <th>Tipo</th>
                    <th>Fecha</th>
                    <th>Acuerdo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {detalle.votaciones.map((item) => (
                    <tr key={item.id}>
                      <td>{item.numero_orden}. {item.punto_titulo}</td>
                      <td>{item.tipo_voto}</td>
                      <td>{formatearFechaHora(item.fecha_voto || item.creado_en)}</td>
                      <td>{item.texto_voto || 'Sin texto'}</td>
                      <td>
                        <BotonAccion icono="bi-pencil-square" label="Editar" outline onClick={() => editarVotacion(item)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TablaShell>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PendientesJunta({ detalle, pendientes, prepararVotacion, editarPunto }) {
  if (!detalle) return null;
  return (
    <div className="d-flex flex-column gap-3">
      <div className="card border-0 bg-light">
        <div className="card-body">
          <div className="juntas-section-title">Pendientes del sistema</div>
          <TablaShell className="juntas-pendientes-table">
            <thead>
              <tr>
                <th>Fecha junta</th>
                <th>Punto</th>
                <th>Estado</th>
                <th>Responsable</th>
                <th>Límite</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pendientes.map((item) => (
                <tr key={item.id}>
                  <td>{formatearFecha(item.junta_fecha)}</td>
                  <td>
                    <div className="fw-semibold">{item.numero_orden}. {item.titulo}</div>
                    <div className="small text-muted">{item.departamento_origen || 'Sin departamento'}</div>
                  </td>
                  <td><span className={`badge border ${claseEstado(item.estado)}`}>{item.estado}</span></td>
                  <td>{item.responsable_nombre || 'Sin responsable'}</td>
                  <td>{formatearFecha(item.fecha_limite)}</td>
                  <td>
                    <div className="d-flex gap-2">
                      {Number(item.junta_id) === Number(detalle.id) ? (
                        <>
                          <BotonAccion icono="bi-pencil-square" label="Editar" outline onClick={() => editarPunto(item)} />
                          <BotonAccion icono="bi-check2-square" label="Votar" onClick={() => prepararVotacion(item)} />
                        </>
                      ) : (
                        <span className="small text-muted">Disponible en otra junta</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!pendientes.length ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">No hay pendientes acumulados con los filtros actuales.</td>
                </tr>
              ) : null}
            </tbody>
          </TablaShell>
        </div>
      </div>
    </div>
  );
}

function ActaJunta({ detalle }) {
  if (!detalle) return null;
  const encabezado = detalle.acta?.encabezado || {};
  const items = detalle.acta?.items || [];
  return (
    <div className="card border-0 bg-light">
      <div className="card-body">
        <div className="juntas-section-title">Acta resumida</div>
        <div className="juntas-resumen-grid mb-3">
          <div>
            <span className="juntas-meta-label">Fecha</span>
            <div>{formatearFecha(encabezado.fecha)}</div>
          </div>
          <div>
            <span className="juntas-meta-label">Tipo</span>
            <div>{encabezado.tipo || '-'}</div>
          </div>
          <div>
            <span className="juntas-meta-label">Moderador</span>
            <div>{encabezado.moderador || 'Sin definir'}</div>
          </div>
          <div>
            <span className="juntas-meta-label">Secretaría</span>
            <div>{encabezado.secretario || 'Sin definir'}</div>
          </div>
        </div>
        {encabezado.quorum_texto ? (
          <p className="mb-2"><strong>Quórum:</strong> {encabezado.quorum_texto}</p>
        ) : null}
        {encabezado.resumen_general ? (
          <p className="mb-3"><strong>Resumen:</strong> {encabezado.resumen_general}</p>
        ) : null}
        <div className="juntas-acta-list">
          {items.map((item) => (
            <div key={`${item.numero_orden}-${item.titulo}`} className="juntas-acta-item">
              <div className="d-flex justify-content-between align-items-start gap-3 mb-1">
                <div className="fw-semibold">{item.numero_orden}. {item.titulo}</div>
                <span className={`badge border ${claseEstado(item.estado)}`}>{item.estado}</span>
              </div>
              <div className="small text-muted mb-2">{item.tipo_punto}</div>
              {item.discusion_resumen ? <p className="mb-2">{item.discusion_resumen}</p> : null}
              {item.decision_final ? <p className="mb-0"><strong>Acuerdo:</strong> {item.decision_final}</p> : null}
            </div>
          ))}
          {!items.length ? <div className="text-muted small">Todavía no hay puntos para construir el acta.</div> : null}
        </div>
      </div>
    </div>
  );
}

export default function JuntasIglesiaPage() {
  const {
    filtros,
    dashboard,
    juntas,
    pendientes,
    usuarios,
    referenciasPorModulo,
    seleccionadaId,
    detalle,
    cargando,
    cargandoDetalle,
    guardando,
    detalleVista,
    setDetalleVista,
    editandoJuntaId,
    editandoPuntoId,
    editandoVotacionId,
    juntaForm,
    setJuntaForm,
    puntoForm,
    setPuntoForm,
    votacionForm,
    setVotacionForm,
    cambiarFiltro,
    setSeleccionadaId,
    guardarJunta,
    editarJunta,
    resetJuntaForm,
    archivarJunta,
    guardarPunto,
    editarPunto,
    resetPuntoForm,
    prepararVotacion,
    guardarVotacion,
    editarVotacion,
    resetVotacionForm,
    inicializarJuntaNueva
  } = useJuntasIglesia();

  const [vistaActiva, setVistaActiva] = useState(VISTA_JUNTAS);

  const abrirVistaJuntas = useCallback(() => setVistaActiva(VISTA_JUNTAS), []);
  const abrirVistaModeradores = useCallback(() => setVistaActiva(VISTA_MODERADORES), []);
  const abrirVistaSecretarias = useCallback(() => setVistaActiva(VISTA_SECRETARIAS), []);
  const abrirNuevaJunta = useCallback(() => {
    inicializarJuntaNueva();
    setVistaActiva(VISTA_MODERADORES);
  }, [inicializarJuntaNueva]);
  const editarDesdeJuntas = useCallback((item) => {
    editarJunta(item);
    setVistaActiva(VISTA_MODERADORES);
  }, [editarJunta]);
  const irASecretariasConJunta = useCallback((item) => {
    setSeleccionadaId(item.id);
    setDetalleVista('RESUMEN');
    setVistaActiva(VISTA_SECRETARIAS);
  }, [setSeleccionadaId, setDetalleVista]);

  return (
    <div className="container-fluid py-3 juntas-page" data-vista={vistaActiva}>
      <div className="d-flex flex-wrap gap-2 mb-3 juntas-vista-switcher">
        <button type="button" className={`btn btn-sm ${vistaActiva === VISTA_JUNTAS ? 'btn-primary' : 'btn-outline-primary'}`} onClick={abrirVistaJuntas}>
          <i className="bi bi-list-ul me-1" aria-hidden="true"></i>
          Juntas
        </button>
        <button type="button" className={`btn btn-sm ${vistaActiva === VISTA_MODERADORES ? 'btn-primary' : 'btn-outline-primary'}`} onClick={abrirVistaModeradores}>
          <i className="bi bi-people-fill me-1" aria-hidden="true"></i>
          Moderadores
        </button>
        <button type="button" className={`btn btn-sm ${vistaActiva === VISTA_SECRETARIAS ? 'btn-primary' : 'btn-outline-primary'}`} onClick={abrirVistaSecretarias}>
          <i className="bi bi-journal-richtext me-1" aria-hidden="true"></i>
          Secretarías
        </button>
        <button type="button" className="btn btn-sm btn-success ms-auto" onClick={abrirNuevaJunta}>
          <i className="bi bi-plus-circle me-1" aria-hidden="true"></i>
          Nueva junta
        </button>
      </div>
      <div className="card shadow-sm juntas-filtros-card mb-3">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-lg-4">
              <SearchInput
                id="juntas_busqueda"
                value={filtros.q}
                onChange={(value) => cambiarFiltro('q', value)}
                placeholder="Buscar por junta, punto o departamento"
              />
            </div>
            <div className="col-6 col-md-3 col-lg-2">
              <label className="form-label small">Estado</label>
              <select className="form-select form-select-sm" value={filtros.estado} onChange={(e) => cambiarFiltro('estado', e.target.value)}>
                {ESTADO_JUNTA_OPCIONES.map((item) => <option key={item.valor} value={item.valor}>{item.etiqueta}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-3 col-lg-2">
              <label className="form-label small">Tipo</label>
              <select className="form-select form-select-sm" value={filtros.tipo} onChange={(e) => cambiarFiltro('tipo', e.target.value)}>
                {TIPO_JUNTA_OPCIONES.map((item) => <option key={item.valor} value={item.valor}>{item.etiqueta}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-3 col-lg-2">
              <label className="form-label small">Responsable</label>
              <select className="form-select form-select-sm" value={filtros.responsable_usuario_id} onChange={(e) => cambiarFiltro('responsable_usuario_id', e.target.value)}>
                <option value="">Todos</option>
                {usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nombre_usuario}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-3 col-lg-2">
              <label className="form-label small">Departamento</label>
              <input type="text" className="form-control form-control-sm" value={filtros.departamento_origen} onChange={(e) => cambiarFiltro('departamento_origen', e.target.value)} />
            </div>
            <div className="col-6 col-md-3 col-lg-2">
              <label className="form-label small">Desde</label>
              <input type="date" className="form-control form-control-sm" value={filtros.fecha_desde} onChange={(e) => cambiarFiltro('fecha_desde', e.target.value)} />
            </div>
            <div className="col-6 col-md-3 col-lg-2">
              <label className="form-label small">Hasta</label>
              <input type="date" className="form-control form-control-sm" value={filtros.fecha_hasta} onChange={(e) => cambiarFiltro('fecha_hasta', e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-3 juntas-top-row">
        <KpiCard label="Juntas" value={dashboard.total_juntas} icon="bi-people-fill" />
        <KpiCard label="Puntos tratados" value={dashboard.total_puntos_tratados} icon="bi-list-check" />
        <KpiCard label="Pendientes" value={dashboard.total_puntos_pendientes} icon="bi-hourglass-split" />
        <KpiCard label="Vencidos" value={dashboard.total_puntos_vencidos} icon="bi-exclamation-triangle" />
      </div>

      <div className="row g-3 juntas-main-row">
        <div className="col-12 col-xl-4 d-flex flex-column gap-3">
          <div className="card shadow-sm juntas-form-card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                <div className="juntas-section-title mb-0">{editandoJuntaId ? 'Editar junta' : 'Nueva junta'}</div>
                <div className="d-flex gap-2">
                  <BotonAccion icono="bi-arrow-counterclockwise" label="Limpiar" outline onClick={resetJuntaForm} disabled={guardando} />
                  <BotonAccion icono="bi-floppy" label={editandoJuntaId ? 'Actualizar' : 'Guardar'} onClick={guardarJunta} disabled={guardando} />
                </div>
              </div>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label small">Fecha</label>
                  <input type="date" className="form-control form-control-sm" value={juntaForm.fecha} onChange={(e) => setJuntaForm((prev) => ({ ...prev, fecha: e.target.value }))} />
                </div>
                <div className="col-12 col-md-3">
                  <label className="form-label small">Inicio</label>
                  <input type="time" className="form-control form-control-sm" value={juntaForm.hora_inicio} onChange={(e) => setJuntaForm((prev) => ({ ...prev, hora_inicio: e.target.value }))} />
                </div>
                <div className="col-12 col-md-3">
                  <label className="form-label small">Final</label>
                  <input type="time" className="form-control form-control-sm" value={juntaForm.hora_fin} onChange={(e) => setJuntaForm((prev) => ({ ...prev, hora_fin: e.target.value }))} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label small">Moderador</label>
                  <select className="form-select form-select-sm" value={juntaForm.moderador} onChange={(e) => setJuntaForm((prev) => ({ ...prev, moderador: e.target.value }))}>
                    <option value="">Seleccione</option>
                    {usuarios.map((usuario) => <option key={`mod-${usuario.id}`} value={usuario.nombre_usuario}>{usuario.nombre_usuario}</option>)}
                  </select>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label small">Secretaría</label>
                  <select className="form-select form-select-sm" value={juntaForm.secretario} onChange={(e) => setJuntaForm((prev) => ({ ...prev, secretario: e.target.value }))}>
                    <option value="">Seleccione</option>
                    {usuarios.map((usuario) => <option key={`sec-${usuario.id}`} value={usuario.nombre_usuario}>{usuario.nombre_usuario}</option>)}
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label small">Quórum</label>
                  <input type="text" className="form-control form-control-sm" value={juntaForm.quorum_texto} onChange={(e) => setJuntaForm((prev) => ({ ...prev, quorum_texto: e.target.value }))} />
                </div>
                <div className="col-12">
                  <label className="form-label small">Resumen general</label>
                  <textarea className="form-control form-control-sm" rows="3" value={juntaForm.resumen_general} onChange={(e) => setJuntaForm((prev) => ({ ...prev, resumen_general: e.target.value }))}></textarea>
                </div>
                <div className="col-12">
                  <div className="alert alert-light border mb-0 py-2 small juntas-junta-anterior-info">
                    <strong>Junta anterior:</strong>{' '}
                    {juntaForm.junta_anterior_id
                      ? `${formatearFecha(juntas.find((item) => String(item.id) === String(juntaForm.junta_anterior_id))?.fecha)} · ${juntas.find((item) => String(item.id) === String(juntaForm.junta_anterior_id))?.tipo || '-'}`
                      : 'Se asignará automáticamente'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm juntas-lista-card flex-grow-1">
            <div className="card-body d-flex flex-column">
              <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                <div className="juntas-section-title mb-0">Juntas registradas</div>
                <span className="badge text-bg-light border">{juntas.length}</span>
              </div>
              <div className="juntas-lista-scroll">
                <TablaShell className="juntas-lista-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Estado</th>
                      <th>Puntos</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {juntas.map((item) => (
                      <tr key={item.id} className={item.id === seleccionadaId ? 'table-active' : ''}>
                        <td>
                          <button type="button" className="btn btn-link btn-sm text-decoration-none px-0 juntas-link-btn" onClick={() => irASecretariasConJunta(item)}>
                            {formatearFecha(item.fecha)}
                          </button>
                        </td>
                        <td>{item.tipo}</td>
                        <td><span className={`badge border ${claseEstado(item.estado)}`}>{item.estado}</span></td>
                        <td>{Number(item.total_puntos || 0).toLocaleString('es-CR')}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <BotonAccion icono="bi-pencil-square" label="Editar" outline onClick={() => editarDesdeJuntas(item)} />
                            <BotonAccion icono="bi-archive" label="Archivar" onClick={() => archivarJunta(item)} />
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!juntas.length && !cargando ? (
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-4">No hay juntas registradas con los filtros actuales.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </TablaShell>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-8">
          <div className="card shadow-sm juntas-detalle-card h-100">
            <div className="card-body">
              {!detalle || cargandoDetalle ? (
                <DetalleVacio />
              ) : (
                <>
                  <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
                    <div>
                      <div className="small text-muted text-uppercase">Detalle de junta</div>
                      <h4 className="mb-1">{formatearFecha(detalle.fecha)}</h4>
                      <div className="d-flex flex-wrap gap-2">
                        <span className={`badge border ${claseEstado(detalle.estado)}`}>{detalle.estado}</span>
                        <span className="badge text-bg-light border">{detalle.tipo}</span>
                        <span className="badge text-bg-light border">{Number(detalle?.resumen?.total_puntos || 0).toLocaleString('es-CR')} puntos</span>
                      </div>
                    </div>
                    <div className="juntas-vista-tabs">
                      {DETALLE_VISTAS.map((vista) => (
                        <button
                          key={vista.valor}
                          type="button"
                          className={`btn btn-sm ${detalleVista === vista.valor ? 'btn-primary' : 'btn-outline-secondary'}`}
                          onClick={() => setDetalleVista(vista.valor)}
                        >
                          <i className={`bi ${vista.icono} me-1`} aria-hidden="true"></i>
                          {vista.etiqueta}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="juntas-detalle-scroll">
                    {detalleVista === 'RESUMEN' ? <ResumenJunta detalle={detalle} /> : null}
                    {detalleVista === 'AGENDA' ? (
                      <AgendaJunta
                        detalle={detalle}
                        usuarios={usuarios}
                        pendientes={pendientes}
                        referenciasPorModulo={referenciasPorModulo}
                        puntoForm={puntoForm}
                        setPuntoForm={setPuntoForm}
                        votacionForm={votacionForm}
                        setVotacionForm={setVotacionForm}
                        guardarPunto={guardarPunto}
                        guardarVotacion={guardarVotacion}
                        editandoPuntoId={editandoPuntoId}
                        editandoVotacionId={editandoVotacionId}
                        resetPuntoForm={resetPuntoForm}
                        resetVotacionForm={resetVotacionForm}
                        editarPunto={editarPunto}
                        prepararVotacion={prepararVotacion}
                        editarVotacion={editarVotacion}
                        guardando={guardando}
                      />
                    ) : null}
                    {detalleVista === 'PENDIENTES' ? <PendientesJunta detalle={detalle} pendientes={pendientes} prepararVotacion={prepararVotacion} editarPunto={editarPunto} /> : null}
                    {detalleVista === 'ACTA' ? <ActaJunta detalle={detalle} /> : null}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

