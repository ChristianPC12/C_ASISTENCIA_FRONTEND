import SearchInput from '../components/ui/SearchInput';
import { usePequenasCongregaciones } from '../hooks/usePequenasCongregaciones';

const ESTADO_OPCIONES = [
  { valor: '', etiqueta: 'Todos los estados' },
  { valor: 'ACTIVA', etiqueta: 'Activa' },
  { valor: 'INACTIVA', etiqueta: 'Inactiva' },
  { valor: 'PAUSADA', etiqueta: 'Pausada' },
  { valor: 'MULTIPLICADA', etiqueta: 'Multiplicada' },
  { valor: 'CERRADA', etiqueta: 'Cerrada' }
];

const DIA_OPCIONES = [
  { valor: '', etiqueta: 'D\u00eda' },
  { valor: '1', etiqueta: 'Lunes' },
  { valor: '2', etiqueta: 'Martes' },
  { valor: '3', etiqueta: 'Mi\u00e9rcoles' },
  { valor: '4', etiqueta: 'Jueves' },
  { valor: '5', etiqueta: 'Viernes' },
  { valor: '6', etiqueta: 'S\u00e1bado' },
  { valor: '7', etiqueta: 'Domingo' }
];

const CLASIFICACION_OPCIONES = [
  { valor: 'AMIGO_INTERESADO', etiqueta: 'Amigo/interesado' },
  { valor: 'VISITA', etiqueta: 'Visita' },
  { valor: 'MIEMBRO_IGLESIA', etiqueta: 'Miembro de iglesia' },
  { valor: 'NINO', etiqueta: 'Ni\u00f1o' },
  { valor: 'JOVEN', etiqueta: 'Joven' },
  { valor: 'ADULTO', etiqueta: 'Adulto' },
  { valor: 'LIDER', etiqueta: 'L\u00edder' },
  { valor: 'ANFITRION', etiqueta: 'Anfitri\u00f3n' },
  { valor: 'INSTRUCTOR_BIBLICO', etiqueta: 'Instructor b\u00edblico' },
  { valor: 'OTRO', etiqueta: 'Otro' }
];

const ESTADO_PARTICIPACION_OPCIONES = [
  { valor: 'ACTIVO', etiqueta: 'Activo' },
  { valor: 'PAUSADO', etiqueta: 'Pausado' },
  { valor: 'RETIRADO', etiqueta: 'Retirado' }
];

const TIPO_RESULTADO_OPCIONES = [
  { valor: 'INTERESADO_NUEVO', etiqueta: 'Interesado nuevo' },
  { valor: 'ESTUDIO_BIBLICO_GENERADO', etiqueta: 'Estudio b\u00edblico generado' },
  { valor: 'DECISION_ESPIRITUAL', etiqueta: 'Decisi\u00f3n espiritual' },
  { valor: 'BAUTISMO_RELACIONADO', etiqueta: 'Bautismo relacionado' },
  { valor: 'MIEMBRO_REACTIVADO', etiqueta: 'Miembro reactivado' },
  { valor: 'MULTIPLICACION', etiqueta: 'Multiplicaci\u00f3n' },
  { valor: 'CIERRE', etiqueta: 'Cierre' },
  { valor: 'OTRO', etiqueta: 'Otro' }
];

const ROL_LIDERAZGO_OPCIONES = [
  { valor: 'LIDER_PRINCIPAL', etiqueta: 'L\u00edder principal' },
  { valor: 'COLIDER', etiqueta: 'Col\u00edder' },
  { valor: 'ANFITRION', etiqueta: 'Anfitri\u00f3n' },
  { valor: 'INSTRUCTOR_ASOCIADO', etiqueta: 'Instructor asociado' }
];

const DETALLE_VISTAS = [
  { valor: 'RESUMEN', etiqueta: 'Resumen', icono: 'bi-card-text' },
  { valor: 'PARTICIPANTES', etiqueta: 'Participantes', icono: 'bi-people' },
  { valor: 'REUNIONES', etiqueta: 'Reuniones', icono: 'bi-calendar-event' },
  { valor: 'RESULTADOS', etiqueta: 'Resultados', icono: 'bi-stars' },
  { valor: 'LIDERAZGO', etiqueta: 'Liderazgo', icono: 'bi-person-badge' }
];

function formatearFecha(valor) {
  if (!valor) return '-';
  const fecha = new Date(`${String(valor).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleDateString('es-CR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatearHora(valor) {
  if (!valor) return '-';
  return String(valor).slice(0, 5);
}

function etiquetaDia(valor) {
  return DIA_OPCIONES.find((item) => item.valor === String(valor))?.etiqueta || '-';
}

function puedeConvertirParticipante(item) {
  return !Boolean(item?.es_miembro) && item?.clasificacion !== 'MIEMBRO_IGLESIA';
}

function KpiCard({ label, value, icon }) {
  return (
    <div className="col-6 col-lg-3">
      <div className="card shadow-sm pcs-kpi-card h-100">
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
    <button type="button" className={`btn ${outline ? 'btn-outline-secondary' : 'btn-primary'} btn-sm admin-responsive-action-btn`} onClick={onClick} disabled={disabled} title={label} aria-label={label}>
      <i className={`bi ${icono}`} aria-hidden="true"></i>
      <span className="admin-responsive-btn-label">{label}</span>
    </button>
  );
}

function TablaShell({ className, children }) {
  return (
    <div className="pcs-table-shell">
      <div className="table-responsive">
        <div className="pcs-table-scroll">
          <table className={`table table-sm align-middle mb-0 ${className}`}>{children}</table>
        </div>
      </div>
    </div>
  );
}

function DetalleVacio() {
  return (
    <div className="card shadow-sm h-100 pcs-detalle-card">
      <div className="card-body d-flex align-items-center justify-content-center text-center text-muted py-5">
        Seleccione una PC para ver sus reuniones, participantes, resultados y liderazgo.
      </div>
    </div>
  );
}

function ResumenPc({ detalle }) {
  const resumen = detalle?.resumen || {};
  return (
    <div className="pcs-detalle-scroll">
      <div className="row g-3 mb-3">
        <KpiCard label="Activos" value={resumen.total_participantes_activos} icon="bi-people" />
        <KpiCard label="Visitas" value={resumen.total_visitas} icon="bi-person-plus" />
        <KpiCard label="Reuniones" value={resumen.total_reuniones} icon="bi-calendar-event" />
        <KpiCard label="Estudios" value={resumen.total_estudios} icon="bi-journal-bookmark" />
      </div>
      <div className="card shadow-sm pcs-section-card">
        <div className="card-body">
          <h6 className="pcs-section-title">Ficha de la PC</h6>
          <div className="pcs-resumen-grid">
            <div><span className="pcs-meta-label">Sector</span><strong>{detalle.sector || '-'}</strong></div>
            <div><span className="pcs-meta-label">Comunidad</span><strong>{detalle.comunidad || '-'}</strong></div>
            <div><span className="pcs-meta-label">L\u00edder principal</span><strong>{detalle.lider_principal_nombre || '-'}</strong></div>
            <div><span className="pcs-meta-label">Col\u00edder</span><strong>{detalle.lider_auxiliar_nombre || '-'}</strong></div>
            <div><span className="pcs-meta-label">Anfitri\u00f3n</span><strong>{detalle.anfitrion_nombre || '-'}</strong></div>
            <div><span className="pcs-meta-label">Reuni\u00f3n</span><strong>{etiquetaDia(detalle.dia_reunion)} {formatearHora(detalle.hora_reunion)}</strong></div>
            <div><span className="pcs-meta-label">Inicio</span><strong>{formatearFecha(detalle.fecha_inicio)}</strong></div>
            <div><span className="pcs-meta-label">Estado</span><strong>{detalle.estado || '-'}</strong></div>
            <div><span className="pcs-meta-label">PC madre</span><strong>{detalle.pc_madre_nombre || '-'}</strong></div>
            <div><span className="pcs-meta-label">\u00daltima reuni\u00f3n</span><strong>{formatearFecha(resumen.ultima_reunion)}</strong></div>
          </div>
          {detalle.direccion_reunion ? <p className="mb-0 mt-3"><span className="pcs-meta-label">Direcci\u00f3n</span>{detalle.direccion_reunion}</p> : null}
          {detalle.meta_trimestral ? <p className="mb-0 mt-3"><span className="pcs-meta-label">Meta trimestral</span>{detalle.meta_trimestral}</p> : null}
          {detalle.observaciones_generales ? <p className="mb-0 mt-3"><span className="pcs-meta-label">Observaciones</span>{detalle.observaciones_generales}</p> : null}
        </div>
      </div>
    </div>
  );
}

function ParticipantesPc({ detalle, form, setForm, guardar, preparando, preparandoEditar, setEditandoId, reset, convertirParticipanteAEstudio, convirtiendoParticipanteId }) {
  return (
    <div className="pcs-detalle-scroll">
      <div className="card shadow-sm pcs-section-card mb-3">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-md-6"><input className="form-control form-control-sm" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} placeholder="Nombre del participante" /></div>
            <div className="col-12 col-md-6"><input className="form-control form-control-sm" value={form.telefono} onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))} placeholder="Tel\u00e9fono" /></div>
            <div className="col-12 col-md-4"><select className="form-select form-select-sm" value={form.clasificacion} onChange={(e) => setForm((p) => ({ ...p, clasificacion: e.target.value }))}>{CLASIFICACION_OPCIONES.map((item) => <option key={item.valor} value={item.valor}>{item.etiqueta}</option>)}</select></div>
            <div className="col-12 col-md-4"><input className="form-control form-control-sm" value={form.rol_pc} onChange={(e) => setForm((p) => ({ ...p, rol_pc: e.target.value }))} placeholder="Rol dentro de la PC" /></div>
            <div className="col-6 col-md-2"><input type="date" className="form-control form-control-sm" value={form.fecha_ingreso} onChange={(e) => setForm((p) => ({ ...p, fecha_ingreso: e.target.value }))} /></div>
            <div className="col-6 col-md-2"><select className="form-select form-select-sm" value={form.estado_participacion} onChange={(e) => setForm((p) => ({ ...p, estado_participacion: e.target.value }))}>{ESTADO_PARTICIPACION_OPCIONES.map((item) => <option key={item.valor} value={item.valor}>{item.etiqueta}</option>)}</select></div>
            <div className="col-12 d-flex align-items-center gap-3">
              <div className="form-check form-switch mb-0"><input className="form-check-input" type="checkbox" checked={form.es_miembro} onChange={(e) => setForm((p) => ({ ...p, es_miembro: e.target.checked }))} /><label className="form-check-label">Es miembro</label></div>
              <div className="d-flex gap-2 ms-auto">
                <BotonAccion icono="bi-plus-lg" label="Agregar" onClick={guardar} />
                <BotonAccion icono="bi-arrow-counterclockwise" label="Limpiar" onClick={() => { setEditandoId(null); reset(); }} outline />
              </div>
            </div>
          </div>
        </div>
      </div>
      <TablaShell className="pcs-participantes-table">
        <thead><tr><th>Nombre</th><th>Clasificaci\u00f3n</th><th>Rol</th><th>Estado</th><th>Ingreso</th><th>Acciones</th></tr></thead>
        <tbody>
          {(detalle?.participantes || []).map((item) => (
            <tr key={item.id}>
              <td>{item.contacto_nombre}</td><td>{item.clasificacion}</td><td>{item.rol_pc || '-'}</td><td>{item.estado_participacion}</td><td>{formatearFecha(item.fecha_ingreso)}</td>
              <td>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <button type="button" className="btn btn-link btn-sm p-0" onClick={() => preparandoEditar(item)}>Editar</button>
                  {puedeConvertirParticipante(item) ? (
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 d-inline-flex align-items-center gap-1"
                      onClick={() => convertirParticipanteAEstudio(item)}
                      disabled={convirtiendoParticipanteId === item.id}
                    >
                      <i className="bi bi-journal-plus" aria-hidden="true"></i>
                      <span>A estudio</span>
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TablaShell>
    </div>
  );
}

function ReunionesPc({ detalle, form, setForm, asistenciaForm, setAsistenciaForm, guardar, registrarAsistencia, usuarios, preparandoEditar, setEditandoId, reset }) {
  return (
    <div className="pcs-detalle-scroll">
      <div className="card shadow-sm pcs-section-card mb-3">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-md-3"><input type="date" className="form-control form-control-sm" value={form.fecha} onChange={(e) => setForm((p) => ({ ...p, fecha: e.target.value }))} /></div>
            <div className="col-12 col-md-5"><input className="form-control form-control-sm" value={form.tema_titulo} onChange={(e) => setForm((p) => ({ ...p, tema_titulo: e.target.value }))} placeholder="Tema o t\u00edtulo" /></div>
            <div className="col-12 col-md-4"><input className="form-control form-control-sm" value={form.material_usado} onChange={(e) => setForm((p) => ({ ...p, material_usado: e.target.value }))} placeholder="Material usado" /></div>
            <div className="col-6 col-md-2"><input type="number" min="0" className="form-control form-control-sm" value={form.cantidad_asistentes} onChange={(e) => setForm((p) => ({ ...p, cantidad_asistentes: e.target.value }))} placeholder="Asist." /></div>
            <div className="col-6 col-md-2"><input type="number" min="0" className="form-control form-control-sm" value={form.total_visitas} onChange={(e) => setForm((p) => ({ ...p, total_visitas: e.target.value }))} placeholder="Visitas" /></div>
            <div className="col-6 col-md-2"><input type="number" min="0" className="form-control form-control-sm" value={form.total_ninos} onChange={(e) => setForm((p) => ({ ...p, total_ninos: e.target.value }))} placeholder="Ni\u00f1os" /></div>
            <div className="col-6 col-md-2"><input type="number" min="0" className="form-control form-control-sm" value={form.total_jovenes} onChange={(e) => setForm((p) => ({ ...p, total_jovenes: e.target.value }))} placeholder="J\u00f3venes" /></div>
            <div className="col-6 col-md-2"><input type="number" min="0" className="form-control form-control-sm" value={form.total_adultos} onChange={(e) => setForm((p) => ({ ...p, total_adultos: e.target.value }))} placeholder="Adultos" /></div>
            <div className="col-6 col-md-2"><input type="number" min="0" className="form-control form-control-sm" value={form.total_miembros} onChange={(e) => setForm((p) => ({ ...p, total_miembros: e.target.value }))} placeholder="Miembros" /></div>
            <div className="col-12 col-md-4"><select className="form-select form-select-sm" value={form.responsable_seguimiento_usuario_id} onChange={(e) => setForm((p) => ({ ...p, responsable_seguimiento_usuario_id: e.target.value }))}><option value="">Responsable de seguimiento</option>{usuarios.map((u) => <option key={u.id} value={u.id}>{u.nombre_completo}</option>)}</select></div>
            <div className="col-12 d-flex align-items-center gap-3"><div className="form-check form-switch mb-0"><input className="form-check-input" type="checkbox" checked={form.hubo_estudio_biblico} onChange={(e) => setForm((p) => ({ ...p, hubo_estudio_biblico: e.target.checked }))} /><label className="form-check-label">Hubo estudio</label></div><div className="form-check form-switch mb-0"><input className="form-check-input" type="checkbox" checked={form.hubo_visita} onChange={(e) => setForm((p) => ({ ...p, hubo_visita: e.target.checked }))} /><label className="form-check-label">Hubo visita</label></div><div className="d-flex gap-2 ms-auto"><BotonAccion icono="bi-plus-lg" label="Agregar" onClick={guardar} /><BotonAccion icono="bi-arrow-counterclockwise" label="Limpiar" onClick={() => { setEditandoId(null); reset(); }} outline /></div></div>
          </div>
        </div>
      </div>
      <div className="card shadow-sm pcs-section-card mb-3"><div className="card-body"><div className="row g-3 align-items-end"><div className="col-12 col-md-4"><select className="form-select form-select-sm" value={asistenciaForm.reunion_id} onChange={(e) => setAsistenciaForm((p) => ({ ...p, reunion_id: e.target.value }))}><option value="">Reuni\u00f3n para asistencia</option>{(detalle?.reuniones || []).map((item) => <option key={item.id} value={item.id}>{formatearFecha(item.fecha)} - {item.tema_titulo}</option>)}</select></div><div className="col-12 col-md-4"><select className="form-select form-select-sm" value={asistenciaForm.participante_id} onChange={(e) => setAsistenciaForm((p) => ({ ...p, participante_id: e.target.value }))}><option value="">Participante</option>{(detalle?.participantes || []).map((item) => <option key={item.id} value={item.id}>{item.contacto_nombre}</option>)}</select></div><div className="col-12 col-md-3"><input className="form-control form-control-sm" value={asistenciaForm.clasificacion_dia} onChange={(e) => setAsistenciaForm((p) => ({ ...p, clasificacion_dia: e.target.value }))} placeholder="Clasificaci\u00f3n del d\u00eda" /></div><div className="col-12 col-md-1"><BotonAccion icono="bi-check2" label="OK" onClick={registrarAsistencia} /></div></div></div></div>
      <TablaShell className="pcs-reuniones-table"><thead><tr><th>Fecha</th><th>Tema</th><th>Asist.</th><th>Visitas</th><th>Acciones</th></tr></thead><tbody>{(detalle?.reuniones || []).map((item) => <tr key={item.id}><td>{formatearFecha(item.fecha)}</td><td>{item.tema_titulo}</td><td>{item.cantidad_asistentes}</td><td>{item.total_visitas}</td><td><button type="button" className="btn btn-link btn-sm p-0" onClick={() => preparandoEditar(item)}>Editar</button></td></tr>)}</tbody></TablaShell>
    </div>
  );
}

function ResultadosPc({ detalle, form, setForm, guardar, estudios, preparandoEditar, setEditandoId, reset }) {
  return (
    <div className="pcs-detalle-scroll">
      <div className="card shadow-sm pcs-section-card mb-3"><div className="card-body"><div className="row g-3"><div className="col-12 col-md-3"><input type="date" className="form-control form-control-sm" value={form.fecha} onChange={(e) => setForm((p) => ({ ...p, fecha: e.target.value }))} /></div><div className="col-12 col-md-5"><select className="form-select form-select-sm" value={form.tipo_resultado} onChange={(e) => setForm((p) => ({ ...p, tipo_resultado: e.target.value }))}>{TIPO_RESULTADO_OPCIONES.map((item) => <option key={item.valor} value={item.valor}>{item.etiqueta}</option>)}</select></div><div className="col-12 col-md-4"><input type="number" min="1" className="form-control form-control-sm" value={form.cantidad} onChange={(e) => setForm((p) => ({ ...p, cantidad: e.target.value }))} placeholder="Cantidad" /></div><div className="col-12 col-md-4"><input className="form-control form-control-sm" value={form.contacto_nombre} onChange={(e) => setForm((p) => ({ ...p, contacto_nombre: e.target.value }))} placeholder="Contacto relacionado" /></div><div className="col-12 col-md-3"><input className="form-control form-control-sm" value={form.contacto_telefono} onChange={(e) => setForm((p) => ({ ...p, contacto_telefono: e.target.value }))} placeholder="Tel\u00e9fono" /></div><div className="col-12 col-md-5"><select className="form-select form-select-sm" value={form.estudio_biblico_id} onChange={(e) => setForm((p) => ({ ...p, estudio_biblico_id: e.target.value }))}><option value="">Estudio b\u00edblico vinculado</option>{estudios.map((item) => <option key={item.id} value={item.id}>{item.contacto_nombre}</option>)}</select></div><div className="col-12"><textarea className="form-control form-control-sm" rows="2" value={form.descripcion} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))} placeholder="Descripci\u00f3n o nota pastoral" /></div><div className="col-12 d-flex justify-content-end gap-2"><BotonAccion icono="bi-plus-lg" label="Agregar" onClick={guardar} /><BotonAccion icono="bi-arrow-counterclockwise" label="Limpiar" onClick={() => { setEditandoId(null); reset(); }} outline /></div></div></div></div>
      <TablaShell className="pcs-resultados-table"><thead><tr><th>Fecha</th><th>Resultado</th><th>Cant.</th><th>Contacto</th><th>Acciones</th></tr></thead><tbody>{(detalle?.resultados || []).map((item) => <tr key={item.id}><td>{formatearFecha(item.fecha)}</td><td>{item.tipo_resultado}</td><td>{item.cantidad}</td><td>{item.contacto_nombre || '-'}</td><td><button type="button" className="btn btn-link btn-sm p-0" onClick={() => preparandoEditar(item)}>Editar</button></td></tr>)}</tbody></TablaShell>
    </div>
  );
}

function LiderazgoPc({ detalle, form, setForm, guardar, preparandoEditar, setEditandoId, reset }) {
  return (
    <div className="pcs-detalle-scroll">
      <div className="card shadow-sm pcs-section-card mb-3"><div className="card-body"><div className="row g-3"><div className="col-12 col-md-4"><input className="form-control form-control-sm" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} placeholder="Nombre" /></div><div className="col-12 col-md-3"><input className="form-control form-control-sm" value={form.telefono} onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))} placeholder="Tel\u00e9fono" /></div><div className="col-12 col-md-3"><select className="form-select form-select-sm" value={form.rol_liderazgo} onChange={(e) => setForm((p) => ({ ...p, rol_liderazgo: e.target.value }))}>{ROL_LIDERAZGO_OPCIONES.map((item) => <option key={item.valor} value={item.valor}>{item.etiqueta}</option>)}</select></div><div className="col-6 col-md-1"><input type="date" className="form-control form-control-sm" value={form.fecha_inicio} onChange={(e) => setForm((p) => ({ ...p, fecha_inicio: e.target.value }))} /></div><div className="col-6 col-md-1"><input type="date" className="form-control form-control-sm" value={form.fecha_fin} onChange={(e) => setForm((p) => ({ ...p, fecha_fin: e.target.value }))} /></div><div className="col-12"><input className="form-control form-control-sm" value={form.motivo_cambio} onChange={(e) => setForm((p) => ({ ...p, motivo_cambio: e.target.value }))} placeholder="Motivo del cambio" /></div><div className="col-12 d-flex justify-content-end gap-2"><BotonAccion icono="bi-plus-lg" label="Agregar" onClick={guardar} /><BotonAccion icono="bi-arrow-counterclockwise" label="Limpiar" onClick={() => { setEditandoId(null); reset(); }} outline /></div></div></div></div>
      <TablaShell className="pcs-liderazgo-table"><thead><tr><th>Nombre</th><th>Rol</th><th>Inicio</th><th>Fin</th><th>Acciones</th></tr></thead><tbody>{(detalle?.liderazgo || []).map((item) => <tr key={item.id}><td>{item.contacto_nombre}</td><td>{item.rol_liderazgo}</td><td>{formatearFecha(item.fecha_inicio)}</td><td>{formatearFecha(item.fecha_fin)}</td><td><button type="button" className="btn btn-link btn-sm p-0" onClick={() => preparandoEditar(item)}>Editar</button></td></tr>)}</tbody></TablaShell>
    </div>
  );
}

export default function PequenasCongregacionesPage() {
  const hook = usePequenasCongregaciones();
  const prepararParticipante = (item) => hook.prepararEdicion(hook.setEditandoParticipanteId, hook.setParticipanteForm, item, (row) => ({
    nombre: row.contacto_nombre || '', telefono: row.contacto_telefono || '', clasificacion: row.clasificacion || 'AMIGO_INTERESADO', rol_pc: row.rol_pc || '', es_miembro: Boolean(row.es_miembro), fecha_ingreso: row.fecha_ingreso || '', fecha_salida: row.fecha_salida || '', motivo_salida: row.motivo_salida || '', estado_participacion: row.estado_participacion || 'ACTIVO', observaciones: row.observaciones || ''
  }));
  const prepararReunion = (item) => hook.prepararEdicion(hook.setEditandoReunionId, hook.setReunionForm, item, (row) => ({
    fecha: row.fecha || '', tema_titulo: row.tema_titulo || '', material_usado: row.material_usado || '', hubo_estudio_biblico: Boolean(row.hubo_estudio_biblico), hubo_visita: Boolean(row.hubo_visita), cantidad_asistentes: Number(row.cantidad_asistentes || 0), total_miembros: Number(row.total_miembros || 0), total_visitas: Number(row.total_visitas || 0), total_ninos: Number(row.total_ninos || 0), total_jovenes: Number(row.total_jovenes || 0), total_adultos: Number(row.total_adultos || 0), observacion_reunion: row.observacion_reunion || '', decisiones_tomadas: row.decisiones_tomadas || '', proximos_pasos: row.proximos_pasos || '', responsable_seguimiento_usuario_id: row.responsable_seguimiento_usuario_id ? String(row.responsable_seguimiento_usuario_id) : ''
  }));
  const prepararResultado = (item) => hook.prepararEdicion(hook.setEditandoResultadoId, hook.setResultadoForm, item, (row) => ({
    fecha: row.fecha || '', tipo_resultado: row.tipo_resultado || 'INTERESADO_NUEVO', contacto_nombre: row.contacto_nombre || '', contacto_telefono: '', estudio_biblico_id: row.estudio_biblico_id ? String(row.estudio_biblico_id) : '', cantidad: Number(row.cantidad || 1), descripcion: row.descripcion || '', observaciones: row.observaciones || ''
  }));
  const prepararLiderazgo = (item) => hook.prepararEdicion(hook.setEditandoLiderazgoId, hook.setLiderazgoForm, item, (row) => ({
    nombre: row.contacto_nombre || '', telefono: row.contacto_telefono || '', rol_liderazgo: row.rol_liderazgo || 'LIDER_PRINCIPAL', fecha_inicio: row.fecha_inicio || '', fecha_fin: row.fecha_fin || '', motivo_cambio: row.motivo_cambio || '', observaciones: row.observaciones || ''
  }));

  const vistaDetalle = () => {
    if (!hook.detalle) return <DetalleVacio />;
    switch (hook.detalleVista) {
      case 'PARTICIPANTES':
        return <ParticipantesPc detalle={hook.detalle} form={hook.participanteForm} setForm={hook.setParticipanteForm} guardar={hook.guardarParticipante} preparando={hook.prepararEdicion} preparandoEditar={prepararParticipante} setEditandoId={hook.setEditandoParticipanteId} reset={() => hook.setParticipanteForm({ nombre: '', telefono: '', clasificacion: 'AMIGO_INTERESADO', rol_pc: '', es_miembro: false, fecha_ingreso: '', fecha_salida: '', motivo_salida: '', estado_participacion: 'ACTIVO', observaciones: '' })} convertirParticipanteAEstudio={hook.convertirParticipanteAEstudio} convirtiendoParticipanteId={hook.convirtiendoParticipanteId} />;
      case 'REUNIONES':
        return <ReunionesPc detalle={hook.detalle} form={hook.reunionForm} setForm={hook.setReunionForm} asistenciaForm={hook.asistenciaForm} setAsistenciaForm={hook.setAsistenciaForm} guardar={hook.guardarReunion} registrarAsistencia={hook.registrarAsistencia} usuarios={hook.usuarios} preparandoEditar={prepararReunion} setEditandoId={hook.setEditandoReunionId} reset={() => hook.setReunionForm({ fecha: '', tema_titulo: '', material_usado: '', hubo_estudio_biblico: false, hubo_visita: false, cantidad_asistentes: 0, total_miembros: 0, total_visitas: 0, total_ninos: 0, total_jovenes: 0, total_adultos: 0, observacion_reunion: '', decisiones_tomadas: '', proximos_pasos: '', responsable_seguimiento_usuario_id: '' })} />;
      case 'RESULTADOS':
        return <ResultadosPc detalle={hook.detalle} form={hook.resultadoForm} setForm={hook.setResultadoForm} guardar={hook.guardarResultado} estudios={hook.estudios} preparandoEditar={prepararResultado} setEditandoId={hook.setEditandoResultadoId} reset={() => hook.setResultadoForm({ fecha: '', tipo_resultado: 'INTERESADO_NUEVO', contacto_nombre: '', contacto_telefono: '', estudio_biblico_id: '', cantidad: 1, descripcion: '', observaciones: '' })} />;
      case 'LIDERAZGO':
        return <LiderazgoPc detalle={hook.detalle} form={hook.liderazgoForm} setForm={hook.setLiderazgoForm} guardar={hook.guardarLiderazgo} preparandoEditar={prepararLiderazgo} setEditandoId={hook.setEditandoLiderazgoId} reset={() => hook.setLiderazgoForm({ nombre: '', telefono: '', rol_liderazgo: 'LIDER_PRINCIPAL', fecha_inicio: '', fecha_fin: '', motivo_cambio: '', observaciones: '' })} />;
      default:
        return <ResumenPc detalle={hook.detalle} />;
    }
  };

  return (
    <div className="container-fluid py-3 pequenas-congregaciones-page">
      <div className="row g-3 pcs-top-row mb-1">
        <div className="col-12 col-xxl-4">
          <div className="card shadow-sm pcs-filtros-card h-100">
            <div className="card-body">
              <div className="row g-2">
                <div className="col-12"><SearchInput id="pcs-q" value={hook.filtros.q} onChange={(value) => hook.cambiarFiltro('q', value)} placeholder="Buscar por PC, sector o l\u00edder" /></div>
                <div className="col-6"><select className="form-select form-select-sm" value={hook.filtros.estado} onChange={(e) => hook.cambiarFiltro('estado', e.target.value)}>{ESTADO_OPCIONES.map((item) => <option key={item.valor} value={item.valor}>{item.etiqueta}</option>)}</select></div>
                <div className="col-6"><input className="form-control form-control-sm" value={hook.filtros.sector} onChange={(e) => hook.cambiarFiltro('sector', e.target.value)} placeholder="Sector o comunidad" /></div>
                <div className="col-6"><input type="date" className="form-control form-control-sm" value={hook.filtros.fecha_desde} onChange={(e) => hook.cambiarFiltro('fecha_desde', e.target.value)} /></div>
                <div className="col-6"><input type="date" className="form-control form-control-sm" value={hook.filtros.fecha_hasta} onChange={(e) => hook.cambiarFiltro('fecha_hasta', e.target.value)} /></div>
              </div>
            </div>
          </div>
        </div>
        <KpiCard label="PC activas" value={hook.dashboard.total_pc_activas} icon="bi-house-heart" />
        <KpiCard label="Participantes" value={hook.dashboard.total_participantes_activos} icon="bi-people" />
        <KpiCard label="Estudios" value={hook.dashboard.total_estudios_originados} icon="bi-journal-bookmark" />
        <KpiCard label="Bautismos" value={hook.dashboard.total_bautismos} icon="bi-droplet" />
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-4">
          <div className="card shadow-sm pcs-form-card mb-3">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-12"><input className="form-control form-control-sm" value={hook.pcForm.nombre_pc} onChange={(e) => hook.setPcForm((p) => ({ ...p, nombre_pc: e.target.value }))} placeholder="Nombre de la PC" /></div>
                <div className="col-6"><input className="form-control form-control-sm" value={hook.pcForm.sector} onChange={(e) => hook.setPcForm((p) => ({ ...p, sector: e.target.value }))} placeholder="Sector" /></div>
                <div className="col-6"><input className="form-control form-control-sm" value={hook.pcForm.comunidad} onChange={(e) => hook.setPcForm((p) => ({ ...p, comunidad: e.target.value }))} placeholder="Comunidad" /></div>
                <div className="col-12"><input className="form-control form-control-sm" value={hook.pcForm.direccion_reunion} onChange={(e) => hook.setPcForm((p) => ({ ...p, direccion_reunion: e.target.value }))} placeholder="Direcci\u00f3n o punto de reuni\u00f3n" /></div>
                <div className="col-12 col-md-6"><input className="form-control form-control-sm" value={hook.pcForm.lider_principal_nombre} onChange={(e) => hook.setPcForm((p) => ({ ...p, lider_principal_nombre: e.target.value }))} placeholder="L\u00edder principal" /></div>
                <div className="col-12 col-md-6"><input className="form-control form-control-sm" value={hook.pcForm.lider_auxiliar_nombre} onChange={(e) => hook.setPcForm((p) => ({ ...p, lider_auxiliar_nombre: e.target.value }))} placeholder="Col\u00edder" /></div>
                <div className="col-12 col-md-6"><input className="form-control form-control-sm" value={hook.pcForm.anfitrion_nombre} onChange={(e) => hook.setPcForm((p) => ({ ...p, anfitrion_nombre: e.target.value }))} placeholder="Anfitri\u00f3n" /></div>
                <div className="col-6 col-md-3"><input type="date" className="form-control form-control-sm" value={hook.pcForm.fecha_inicio} onChange={(e) => hook.setPcForm((p) => ({ ...p, fecha_inicio: e.target.value }))} /></div>
                <div className="col-6 col-md-3"><input type="time" className="form-control form-control-sm" value={hook.pcForm.hora_reunion} onChange={(e) => hook.setPcForm((p) => ({ ...p, hora_reunion: e.target.value }))} /></div>
                <div className="col-6"><select className="form-select form-select-sm" value={hook.pcForm.dia_reunion} onChange={(e) => hook.setPcForm((p) => ({ ...p, dia_reunion: e.target.value }))}>{DIA_OPCIONES.map((item) => <option key={item.valor} value={item.valor}>{item.etiqueta}</option>)}</select></div>
                <div className="col-6"><select className="form-select form-select-sm" value={hook.pcForm.estado} onChange={(e) => hook.setPcForm((p) => ({ ...p, estado: e.target.value }))}>{ESTADO_OPCIONES.filter((i) => i.valor).map((item) => <option key={item.valor} value={item.valor}>{item.etiqueta}</option>)}</select></div>
                <div className="col-12"><select className="form-select form-select-sm" value={hook.pcForm.pc_madre_id} onChange={(e) => hook.setPcForm((p) => ({ ...p, pc_madre_id: e.target.value }))}><option value="">PC madre</option>{hook.pcsMadre.map((item) => <option key={item.id} value={item.id}>{item.nombre_pc}</option>)}</select></div>
                <div className="col-12"><textarea className="form-control form-control-sm" rows="2" value={hook.pcForm.meta_trimestral} onChange={(e) => hook.setPcForm((p) => ({ ...p, meta_trimestral: e.target.value }))} placeholder="Meta trimestral u observaci\u00f3n breve" /></div>
                <div className="col-12 d-flex justify-content-end gap-2"><BotonAccion icono="bi-plus-lg" label={hook.editandoPcId ? 'Actualizar' : 'Agregar'} onClick={hook.guardarPc} disabled={hook.guardando} /><BotonAccion icono="bi-arrow-counterclockwise" label="Limpiar" onClick={hook.resetPcForm} outline /></div>
              </div>
            </div>
          </div>
          <div className="card shadow-sm pcs-lista-card">
            <div className="card-body">
              <TablaShell className="pcs-lista-table">
                <thead><tr><th>PC</th><th>Estado</th><th>Activos</th><th>Acciones</th></tr></thead>
                <tbody>
                  {(hook.pcs || []).map((item) => (
                    <tr key={item.id} className={hook.seleccionadaId === item.id ? 'table-active' : ''}>
                      <td><button type="button" className="btn btn-link btn-sm p-0 text-start" onClick={() => hook.setSeleccionadaId(item.id)}>{item.nombre_pc}</button></td>
                      <td>{item.estado}</td><td>{item.total_participantes_activos}</td>
                      <td><div className="d-flex gap-2"><button type="button" className="btn btn-link btn-sm p-0" onClick={() => hook.editarPc(item)}>Editar</button><button type="button" className="btn btn-link btn-sm p-0 text-danger" onClick={() => hook.archivarPc(item.id)}>Archivar</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </TablaShell>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-8">
          {!hook.detalle ? <DetalleVacio /> : (
            <div className="card shadow-sm pcs-detalle-card h-100">
              <div className="card-body">
                <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                  <div>
                    <h5 className="mb-1">{hook.detalle.nombre_pc}</h5>
                    <div className="text-muted small">{hook.detalle.sector || hook.detalle.comunidad || 'Sin sector'}</div>
                  </div>
                  <span className="badge bg-light text-dark border">{hook.detalle.estado}</span>
                </div>
                <div className="pcs-vista-tabs mb-3">
                  {DETALLE_VISTAS.map((vista) => (
                    <button key={vista.valor} type="button" className={`btn btn-sm ${hook.detalleVista === vista.valor ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => hook.setDetalleVista(vista.valor)}>
                      <i className={`bi ${vista.icono}`} aria-hidden="true"></i><span className="ms-2">{vista.etiqueta}</span>
                    </button>
                  ))}
                </div>
                {vistaDetalle()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
