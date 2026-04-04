import { useState, useMemo, useEffect } from 'react';
import SearchInput from '../components/ui/SearchInput';
import { useCampanas } from '../hooks/useCampanas';

const TIPO_OPCIONES = [
  { valor: 'SEMANA_EVANGELISTICA', etiqueta: 'Semana evangelística' },
  { valor: 'CAMPANA_2_SEMANAS', etiqueta: 'Campaña 2 semanas' },
  { valor: 'CAMPANA_ESPECIAL', etiqueta: 'Campaña especial' },
  { valor: 'SERIE_CORTA', etiqueta: 'Serie corta' }
];

const ESTADO_CAMPANA_OPCIONES = [
  { valor: '', etiqueta: 'Todos los estados' },
  { valor: 'BORRADOR', etiqueta: 'Borrador' },
  { valor: 'ACTIVA', etiqueta: 'Activa' },
  { valor: 'FINALIZADA', etiqueta: 'Finalizada' },
  { valor: 'ARCHIVADA', etiqueta: 'Archivada' }
];

const ESTADO_SESION_OPCIONES = [
  { valor: 'PROGRAMADA', etiqueta: 'Programada' },
  { valor: 'REALIZADA', etiqueta: 'Realizada' },
  { valor: 'CANCELADA', etiqueta: 'Cancelada' }
];

const TIPO_ASISTENTE_OPCIONES = [
  { valor: 'VISITA', etiqueta: 'Visita' },
  { valor: 'INTERESADO', etiqueta: 'Interesado' },
  { valor: 'MIEMBRO', etiqueta: 'Miembro' }
];

const ETARIA_OPCIONES = [
  { valor: '', etiqueta: 'Sin clasificar' },
  { valor: 'NINO', etiqueta: 'Niño' },
  { valor: 'JOVEN', etiqueta: 'Joven' },
  { valor: 'ADULTO', etiqueta: 'Adulto' }
];

const ESTADO_SEGUIMIENTO_OPCIONES = [
  { valor: 'PENDIENTE', etiqueta: 'Pendiente' },
  { valor: 'CONTACTADO', etiqueta: 'Contactado' },
  { valor: 'ESTUDIO_BIBLICO', etiqueta: 'Estudio bíblico' },
  { valor: 'NO_LOCALIZABLE', etiqueta: 'No localizable' },
  { valor: 'CERRADO', etiqueta: 'Cerrado' }
];

const DECISION_OPCIONES = [
  { clave: 'PIDIO_ORACION', etiqueta: 'Pidió oración' },
  { clave: 'ACEPTO_VISITA', etiqueta: 'Aceptó visita' },
  { clave: 'ACEPTO_ESTUDIO_BIBLICO', etiqueta: 'Aceptó estudio bíblico' },
  { clave: 'ACEPTO_ASISTIR_IGLESIA', etiqueta: 'Aceptó asistir a la iglesia' },
  { clave: 'ACEPTO_LLAMADO', etiqueta: 'Aceptó llamado' },
  { clave: 'CANDIDATO_BAUTISMAL', etiqueta: 'Candidato bautismal' },
  { clave: 'BAUTIZADO', etiqueta: 'Bautizado' },
  { clave: 'NO_LOCALIZABLE', etiqueta: 'No localizable' }
];

const DETALLE_VISTAS = [
  { valor: 'RESUMEN', etiqueta: 'Resumen', icono: 'bi-card-text' },
  { valor: 'SESIONES', etiqueta: 'Sesiones', icono: 'bi-calendar-event' },
  { valor: 'ASISTENTES', etiqueta: 'Asistentes', icono: 'bi-people' },
  { valor: 'DECISIONES', etiqueta: 'Decisiones', icono: 'bi-check2-circle' }
];

function formatearFecha(valor) {
  if (!valor) return '-';
  const fecha = new Date(`${valor}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) return valor;

  return fecha.toLocaleDateString('es-CR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
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

function etiquetaTipoCampana(valor) {
  return TIPO_OPCIONES.find((item) => item.valor === valor)?.etiqueta || valor || '-';
}

function etiquetaEtaria(valor) {
  return ETARIA_OPCIONES.find((item) => item.valor === valor)?.etiqueta || 'Sin clasificar';
}

function puedeConvertirAsistente(item) {
  return item?.tipo_asistente !== 'MIEMBRO' && item?.estado_seguimiento !== 'ESTUDIO_BIBLICO';
}

function claseEstado(estado) {
  switch (estado) {
    case 'ACTIVA':
    case 'REALIZADA':
    case 'CONTACTADO':
    case 'ESTUDIO_BIBLICO':
      return 'bg-success-subtle text-success-emphasis border-success-subtle';
    case 'BORRADOR':
    case 'PROGRAMADA':
    case 'PENDIENTE':
      return 'bg-warning-subtle text-warning-emphasis border-warning-subtle';
    case 'FINALIZADA':
    case 'CERRADO':
      return 'bg-primary-subtle text-primary-emphasis border-primary-subtle';
    case 'ARCHIVADA':
    case 'CANCELADA':
    case 'NO_LOCALIZABLE':
      return 'bg-secondary-subtle text-secondary-emphasis border-secondary-subtle';
    default:
      return 'bg-light text-dark border';
  }
}

function KpiCard({ label, value, icon }) {
  return (
    <div className="col-6 col-lg-3">
      <div className="card shadow-sm campanas-kpi-card h-100">
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

function DetalleVacio() {
  return (
    <div className="card shadow-sm h-100 campanas-detalle-card">
      <div className="card-body d-flex align-items-center justify-content-center text-center text-muted py-5">
        Seleccione una campaña para ver su resumen, las noches registradas, los asistentes y las decisiones.
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

function ResumenCampana({ detalle }) {
  const resumen = detalle?.resumen || {};

  return (
    <div className="campanas-detalle-scroll">
      <div className="row g-3 mb-3">
        <KpiCard label="Sesiones" value={resumen.total_sesiones} icon="bi-calendar-event" />
        <KpiCard label="Asistentes" value={resumen.total_asistentes} icon="bi-people" />
        <KpiCard label="Visitas" value={resumen.total_visitas} icon="bi-person-plus" />
        <KpiCard label="Decisiones" value={resumen.total_decisiones} icon="bi-heart" />
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-7">
          <div className="card shadow-sm campanas-section-card">
            <div className="card-body">
              <h6 className="campanas-section-title">Ficha pastoral</h6>
              <div className="campanas-resumen-grid">
                <div>
                  <span className="campanas-meta-label">Tipo</span>
                  <strong>{etiquetaTipoCampana(detalle.tipo)}</strong>
                </div>
                <div>
                  <span className="campanas-meta-label">Período</span>
                  <strong>{formatearFecha(detalle.fecha_inicio)} al {formatearFecha(detalle.fecha_fin)}</strong>
                </div>
                <div>
                  <span className="campanas-meta-label">Lugar</span>
                  <strong>{detalle.lugar || '-'}</strong>
                </div>
                <div>
                  <span className="campanas-meta-label">Predicador</span>
                  <strong>{detalle.predicador || '-'}</strong>
                </div>
                <div>
                  <span className="campanas-meta-label">Responsable</span>
                  <strong>{detalle.responsable_usuario_nombre || 'Sin responsable'}</strong>
                </div>
                <div>
                  <span className="campanas-meta-label">Miembros</span>
                  <strong>{Number(resumen.total_miembros || 0).toLocaleString('es-CR')}</strong>
                </div>
              </div>

              {detalle.descripcion ? (
                <div className="mt-3">
                  <span className="campanas-meta-label">Descripción</span>
                  <p className="mb-0">{detalle.descripcion}</p>
                </div>
              ) : null}

              {detalle.observaciones ? (
                <div className="mt-3">
                  <span className="campanas-meta-label">Observaciones</span>
                  <p className="mb-0">{detalle.observaciones}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="card shadow-sm campanas-section-card h-100">
            <div className="card-body">
              <h6 className="campanas-section-title">Lectura rápida</h6>
              <div className="campanas-resumen-stack">
                <div className="campanas-chip-row">
                  <span className="campanas-meta-label">Estado</span>
                  <span className={`badge ${claseEstado(detalle.estado)}`}>{detalle.estado}</span>
                </div>
                <div className="campanas-chip-row">
                  <span className="campanas-meta-label">Última actualización</span>
                  <strong>{formatearFechaHora(detalle.actualizado_en)}</strong>
                </div>
                <div className="campanas-chip-row">
                  <span className="campanas-meta-label">Visitas únicas</span>
                  <strong>{Number(resumen.total_visitas || 0).toLocaleString('es-CR')}</strong>
                </div>
                <div className="campanas-chip-row">
                  <span className="campanas-meta-label">Miembros registrados</span>
                  <strong>{Number(resumen.total_miembros || 0).toLocaleString('es-CR')}</strong>
                </div>
                <div className="campanas-chip-row">
                  <span className="campanas-meta-label">Decisiones espirituales</span>
                  <strong>{Number(resumen.total_decisiones || 0).toLocaleString('es-CR')}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SesionesCampana({ detalle, sesionForm, setSesionForm, guardarSesion }) {
  const sesiones = detalle?.sesiones || [];

  return (
    <div className="campanas-detalle-scroll">
      <div className="card shadow-sm campanas-section-card mb-3">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-3">
            <h6 className="campanas-section-title mb-0">Registrar noche o sesión</h6>
            <BotonAccion icono="bi-plus-lg" label="Agregar sesión" onClick={guardarSesion} />
          </div>

          <div className="row g-3">
            <div className="col-6 col-lg-3">
              <label className="form-label form-label-sm">Fecha</label>
              <input type="date" className="form-control form-control-sm" value={sesionForm.fecha} onChange={(e) => setSesionForm((prev) => ({ ...prev, fecha: e.target.value }))} />
            </div>
            <div className="col-6 col-lg-3">
              <label className="form-label form-label-sm">Hora</label>
              <input type="time" className="form-control form-control-sm" value={sesionForm.hora_inicio} onChange={(e) => setSesionForm((prev) => ({ ...prev, hora_inicio: e.target.value }))} />
            </div>
            <div className="col-12 col-lg-6">
              <label className="form-label form-label-sm">Tema</label>
              <input className="form-control form-control-sm" value={sesionForm.tema_titulo} onChange={(e) => setSesionForm((prev) => ({ ...prev, tema_titulo: e.target.value }))} />
            </div>
            <div className="col-12 col-lg-6">
              <label className="form-label form-label-sm">Predicador de la noche</label>
              <input className="form-control form-control-sm" value={sesionForm.predicador_noche} onChange={(e) => setSesionForm((prev) => ({ ...prev, predicador_noche: e.target.value }))} />
            </div>
            <div className="col-12 col-lg-3">
              <label className="form-label form-label-sm">Estado</label>
              <select className="form-select form-select-sm" value={sesionForm.estado_sesion} onChange={(e) => setSesionForm((prev) => ({ ...prev, estado_sesion: e.target.value }))}>
                {ESTADO_SESION_OPCIONES.map((opcion) => (
                  <option key={opcion.valor} value={opcion.valor}>{opcion.etiqueta}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-lg-9">
              <label className="form-label form-label-sm">Observaciones</label>
              <input className="form-control form-control-sm" value={sesionForm.observaciones} onChange={(e) => setSesionForm((prev) => ({ ...prev, observaciones: e.target.value }))} />
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm campanas-section-card">
        <div className="card-body p-0">
          <div className="campanas-table-shell">
            <div className="campanas-table-scroll">
              <table className="table table-sm align-middle mb-0 campanas-sesiones-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tema</th>
                    <th>Estado</th>
                    <th className="text-center">Asistencia</th>
                  </tr>
                </thead>
                <tbody>
                  {sesiones.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center text-muted py-4">
                        Todavía no hay noches registradas para esta campaña.
                      </td>
                    </tr>
                  )}
                  {sesiones.map((item) => (
                    <tr key={item.id}>
                      <td>{formatearFecha(item.fecha)}</td>
                      <td>
                        <div className="fw-semibold">{item.tema_titulo}</div>
                        <small className="text-muted">{item.predicador_noche || 'Sin predicador'}</small>
                      </td>
                      <td><span className={`badge ${claseEstado(item.estado_sesion)}`}>{item.estado_sesion}</span></td>
                      <td className="text-center">
                        <div className="small">
                          <strong>{Number(item.total_registros || 0).toLocaleString('es-CR')}</strong>
                          <span className="text-muted"> / {Number(item.total_puntuales || 0).toLocaleString('es-CR')}</span>
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
  );
}

function AsistentesCampana({
  detalle,
  asistentesOpciones,
  sesionesOpciones,
  asistenteForm,
  setAsistenteForm,
  asistenciaForm,
  setAsistenciaForm,
  guardarAsistente,
  guardarAsistencia,
  convertirAsistenteAEstudio,
  convirtiendoAsistenteId
}) {
  const [mostrarMasAsistente, setMostrarMasAsistente] = useState(false);
  const asistentes = detalle?.asistentes || [];

  const sesionActiva = useMemo(() => {
    const hoy = new Date().toISOString().slice(0, 10);
    return sesionesOpciones.find(s => s.fecha === hoy && s.estado_sesion !== 'CANCELADA')
      || sesionesOpciones.find(s => s.estado_sesion === 'PROGRAMADA')
      || sesionesOpciones[0]
      || null;
  }, [sesionesOpciones]);

  useEffect(() => {
    if (!asistenciaForm.sesion_id && sesionActiva) {
      setAsistenciaForm(prev => ({ ...prev, sesion_id: String(sesionActiva.id) }));
    }
  }, [sesionActiva, asistenciaForm.sesion_id, setAsistenciaForm]);

  return (
    <div className="campanas-detalle-scroll">
      <div className="card shadow-sm campanas-section-card mb-3">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-3">
            <h6 className="campanas-section-title mb-0">Asistencia rápida</h6>
            <BotonAccion icono="bi-check2-square" label="Guardar asistencia" onClick={guardarAsistencia} />
          </div>

          <div className="row g-2 align-items-end">
            <div className="col-12 col-md-3">
              <label className="form-label form-label-sm">Sesión</label>
              <select className="form-select form-select-sm" value={asistenciaForm.sesion_id} onChange={(e) => setAsistenciaForm((prev) => ({ ...prev, sesion_id: e.target.value }))}>
                <option value="">Seleccione</option>
                {sesionesOpciones.map((sesion) => (
                  <option key={sesion.id} value={sesion.id}>{formatearFecha(sesion.fecha)} - {sesion.tema_titulo}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label form-label-sm">Asistente</label>
              <select className="form-select form-select-sm" value={asistenciaForm.campana_asistente_id} onChange={(e) => setAsistenciaForm((prev) => ({ ...prev, campana_asistente_id: e.target.value }))}>
                <option value="">Seleccione</option>
                {asistentesOpciones.map((asistente) => (
                  <option key={asistente.id} value={asistente.id}>{asistente.nombre_snapshot}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-2">
              <label className="form-label form-label-sm">Hora</label>
              <input type="time" className="form-control form-control-sm" value={asistenciaForm.hora_llegada} onChange={(e) => setAsistenciaForm((prev) => ({ ...prev, hora_llegada: e.target.value }))} />
            </div>
            <div className="col-6 col-md-2">
              <div className="form-check mt-3">
                <input className="form-check-input" type="checkbox" id="campana-puntual-quick" checked={Boolean(asistenciaForm.puntual)} onChange={(e) => setAsistenciaForm((prev) => ({ ...prev, puntual: e.target.checked }))} />
                <label className="form-check-label small" htmlFor="campana-puntual-quick">Puntual</label>
              </div>
            </div>
            <div className="col-6 col-md-2">
              <div className="form-check mt-3">
                <input className="form-check-input" type="checkbox" id="campana-premio-quick" checked={Boolean(asistenciaForm.elegible_premio)} onChange={(e) => setAsistenciaForm((prev) => ({ ...prev, elegible_premio: e.target.checked }))} />
                <label className="form-check-label small" htmlFor="campana-premio-quick">Premio</label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm campanas-section-card mb-3">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-3">
            <h6 className="campanas-section-title mb-0">Registrar asistente</h6>
            <BotonAccion icono="bi-plus-lg" label="Agregar asistente" onClick={guardarAsistente} />
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label form-label-sm">Nombre</label>
              <input className="form-control form-control-sm" value={asistenteForm.nombre_completo} onChange={(e) => setAsistenteForm((prev) => ({ ...prev, nombre_completo: e.target.value }))} />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label form-label-sm">Tipo</label>
              <select className="form-select form-select-sm" value={asistenteForm.tipo_asistente} onChange={(e) => setAsistenteForm((prev) => ({ ...prev, tipo_asistente: e.target.value }))}>
                {TIPO_ASISTENTE_OPCIONES.map((opcion) => (
                  <option key={opcion.valor} value={opcion.valor}>{opcion.etiqueta}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label form-label-sm">Teléfono</label>
              <input className="form-control form-control-sm" value={asistenteForm.telefono} onChange={(e) => setAsistenteForm((prev) => ({ ...prev, telefono: e.target.value }))} />
            </div>

            {mostrarMasAsistente && (
              <>
                <div className="col-12 col-md-6">
                  <label className="form-label form-label-sm">Correo</label>
                  <input className="form-control form-control-sm" value={asistenteForm.correo} onChange={(e) => setAsistenteForm((prev) => ({ ...prev, correo: e.target.value }))} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label form-label-sm">Procedencia</label>
                  <input className="form-control form-control-sm" value={asistenteForm.procedencia} onChange={(e) => setAsistenteForm((prev) => ({ ...prev, procedencia: e.target.value }))} />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label form-label-sm">Clasificación</label>
                  <select className="form-select form-select-sm" value={asistenteForm.clasificacion_etaria} onChange={(e) => setAsistenteForm((prev) => ({ ...prev, clasificacion_etaria: e.target.value }))}>
                    {ETARIA_OPCIONES.map((opcion) => (
                      <option key={opcion.valor || 'ninguna'} value={opcion.valor}>{opcion.etiqueta}</option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label form-label-sm">Seguimiento</label>
                  <select className="form-select form-select-sm" value={asistenteForm.estado_seguimiento} onChange={(e) => setAsistenteForm((prev) => ({ ...prev, estado_seguimiento: e.target.value }))}>
                    {ESTADO_SEGUIMIENTO_OPCIONES.map((opcion) => (
                      <option key={opcion.valor} value={opcion.valor}>{opcion.etiqueta}</option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label form-label-sm">Dirección</label>
                  <input className="form-control form-control-sm" value={asistenteForm.direccion} onChange={(e) => setAsistenteForm((prev) => ({ ...prev, direccion: e.target.value }))} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label form-label-sm">Barrio / comunidad</label>
                  <input className="form-control form-control-sm" value={asistenteForm.barrio_comunidad} onChange={(e) => setAsistenteForm((prev) => ({ ...prev, barrio_comunidad: e.target.value }))} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label form-label-sm">Observaciones</label>
                  <input className="form-control form-control-sm" value={asistenteForm.observaciones} onChange={(e) => setAsistenteForm((prev) => ({ ...prev, observaciones: e.target.value }))} />
                </div>
              </>
            )}

            <div className="col-12">
              <button type="button" className="btn btn-link btn-sm p-0 d-inline-flex align-items-center gap-1 text-muted" onClick={() => setMostrarMasAsistente(!mostrarMasAsistente)}>
                <i className={`bi ${mostrarMasAsistente ? 'bi-chevron-up' : 'bi-chevron-down'}`} aria-hidden="true"></i>
                <span>{mostrarMasAsistente ? 'Menos datos del asistente' : 'Más datos del asistente'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm campanas-section-card">
        <div className="card-body p-0">
          <div className="campanas-table-shell">
            <div className="campanas-table-scroll">
              <table className="table table-sm align-middle mb-0 campanas-asistentes-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th className="text-center">Asistencia</th>
                    <th>Seguimiento</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {asistentes.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-4">
                        No hay asistentes registrados todavía.
                      </td>
                    </tr>
                  )}
                  {asistentes.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="fw-semibold">{item.nombre_snapshot}</div>
                        <small className="text-muted">{item.telefono_snapshot || item.contacto_telefono || '-'}</small>
                      </td>
                      <td><span className="badge text-bg-light border">{item.tipo_asistente}</span></td>
                      <td className="text-center">
                        <small>{Number(item.total_noches || 0).toLocaleString('es-CR')} · {Number(item.total_puntuales || 0).toLocaleString('es-CR')}</small>
                      </td>
                      <td><span className={`badge ${claseEstado(item.estado_seguimiento)}`}>{item.estado_seguimiento}</span></td>
                      <td className="text-end">
                        {puedeConvertirAsistente(item) ? (
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 d-inline-flex align-items-center gap-1"
                            onClick={() => convertirAsistenteAEstudio(item)}
                            disabled={convirtiendoAsistenteId === item.id}
                          >
                            <i className="bi bi-journal-plus" aria-hidden="true"></i>
                            <span>A estudio</span>
                          </button>
                        ) : (
                          <span className="text-muted small">-</span>
                        )}
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
  );
}

function DecisionesCampana({ detalle, asistentesOpciones, decisionForm, setDecisionForm, guardarDecision }) {
  const decisiones = detalle?.decisiones || [];

  return (
    <div className="campanas-detalle-scroll">
      <div className="card shadow-sm campanas-section-card mb-3">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-3">
            <h6 className="campanas-section-title mb-0">Registrar decisión o seguimiento</h6>
            <BotonAccion icono="bi-plus-lg" label="Agregar decisión" onClick={guardarDecision} />
          </div>

          <div className="row g-3">
            <div className="col-12 col-lg-4">
              <label className="form-label form-label-sm">Asistente</label>
              <select className="form-select form-select-sm" value={decisionForm.campana_asistente_id} onChange={(e) => setDecisionForm((prev) => ({ ...prev, campana_asistente_id: e.target.value }))}>
                <option value="">Seleccione</option>
                {asistentesOpciones.map((asistente) => (
                  <option key={asistente.id} value={asistente.id}>{asistente.nombre_snapshot}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-lg-4">
              <label className="form-label form-label-sm">Tipo de decisión</label>
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
              <label className="form-label form-label-sm">Fecha y hora</label>
              <input type="datetime-local" className="form-control form-control-sm" value={decisionForm.fecha_decision} onChange={(e) => setDecisionForm((prev) => ({ ...prev, fecha_decision: e.target.value }))} />
            </div>
            <div className="col-12 col-lg-12">
              <label className="form-label form-label-sm">Observaciones</label>
              <input className="form-control form-control-sm" value={decisionForm.observaciones} onChange={(e) => setDecisionForm((prev) => ({ ...prev, observaciones: e.target.value }))} />
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm campanas-section-card">
        <div className="card-body p-0">
          <div className="campanas-table-shell">
            <div className="campanas-table-scroll">
              <table className="table table-sm align-middle mb-0 campanas-decisiones-table">
                <thead>
                  <tr>
                    <th>Persona</th>
                    <th>Decisión</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {decisiones.length === 0 && (
                    <tr>
                      <td colSpan="3" className="text-center text-muted py-4">
                        Todavía no hay decisiones registradas para esta campaña.
                      </td>
                    </tr>
                  )}
                  {decisiones.map((item) => (
                    <tr key={item.id}>
                      <td>{item.nombre_snapshot}</td>
                      <td>
                        <div className="fw-semibold">{item.decision_etiqueta}</div>
                        <small className="text-muted">{item.decision_clave}</small>
                      </td>
                      <td><small>{formatearFechaHora(item.fecha_decision)}</small></td>
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

function DetalleCampana(props) {
  const { detalle, cargandoDetalle, detalleVista, setDetalleVista, recargar } = props;

  return (
    <div className="card shadow-sm h-100 campanas-detalle-card">
      <div className="card-header bg-white d-flex align-items-start justify-content-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
            <h5 className="mb-0">{detalle.nombre}</h5>
            <span className={`badge ${claseEstado(detalle.estado)}`}>{detalle.estado}</span>
            <span className="badge text-bg-light border">{etiquetaTipoCampana(detalle.tipo)}</span>
          </div>
          <div className="small text-muted d-flex flex-wrap gap-3">
            <span>Período: {formatearFecha(detalle.fecha_inicio)} al {formatearFecha(detalle.fecha_fin)}</span>
            <span>Lugar: {detalle.lugar || '-'}</span>
            <span>Predicador: {detalle.predicador || '-'}</span>
          </div>
        </div>

        <BotonAccion icono="bi-arrow-clockwise" label="Actualizar" onClick={recargar} outline />
      </div>

      <div className="card-body">
        <div className="campanas-vista-tabs mb-3">
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
          <div className="d-flex align-items-center justify-content-center text-center text-muted py-5 campanas-detalle-scroll">
            <div>
              <div className="spinner-border spinner-iasd mb-3" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <div>Cargando detalle de la campaña...</div>
            </div>
          </div>
        ) : (
          <>
            {detalleVista === 'RESUMEN' && <ResumenCampana detalle={detalle} />}
            {detalleVista === 'SESIONES' && <SesionesCampana {...props} />}
            {detalleVista === 'ASISTENTES' && <AsistentesCampana {...props} />}
            {detalleVista === 'DECISIONES' && <DecisionesCampana {...props} />}
          </>
        )}
      </div>
    </div>
  );
}

export default function CampanasPage() {
  const [mostrarExtraCampana, setMostrarExtraCampana] = useState(false);

  const {
    filtros,
    dashboard,
    campanas,
    usuarios,
    seleccionadaId,
    setSeleccionadaId,
    detalle,
    cargando,
    cargandoDetalle,
    guardando,
    editandoCampanaId,
    campanaForm,
    setCampanaForm,
    sesionForm,
    setSesionForm,
    asistenteForm,
    setAsistenteForm,
    asistenciaForm,
    setAsistenciaForm,
    decisionForm,
    setDecisionForm,
    detalleVista,
    setDetalleVista,
    convirtiendoAsistenteId,
    asistentesOpciones,
    sesionesOpciones,
    cambiarFiltro,
    editarCampana,
    resetCampanaForm,
    guardarCampana,
    archivarCampana,
    guardarSesion,
    guardarAsistente,
    guardarAsistencia,
    guardarDecision,
    convertirAsistenteAEstudio,
    recargar
  } = useCampanas();

  return (
    <div className="container-fluid py-3 py-lg-4">
      <div className="row g-3 mb-3 campanas-top-row">
        <div className="col-12 col-xxl-7">
          <div className="card shadow-sm h-100 campanas-filtros-card">
            <div className="card-body">
              <div className="row g-2 align-items-end">
                <div className="col-12 col-lg-4">
                  <SearchInput
                    id="campanas-busqueda"
                    value={filtros.q}
                    onChange={(valor) => cambiarFiltro('q', valor)}
                    placeholder="Buscar por nombre, lema o predicador"
                  />
                </div>
                <div className="col-6 col-lg-2">
                  <label className="form-label form-label-sm">Estado</label>
                  <select className="form-select form-select-sm" value={filtros.estado} onChange={(e) => cambiarFiltro('estado', e.target.value)}>
                    {ESTADO_CAMPANA_OPCIONES.map((opcion) => (
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
                <div className="col-6 col-lg-2">
                  <label className="form-label form-label-sm">Desde</label>
                  <input type="date" className="form-control form-control-sm" value={filtros.fecha_desde} onChange={(e) => cambiarFiltro('fecha_desde', e.target.value)} />
                </div>
                <div className="col-6 col-lg-2">
                  <label className="form-label form-label-sm">Hasta</label>
                  <input type="date" className="form-control form-control-sm" value={filtros.fecha_hasta} onChange={(e) => cambiarFiltro('fecha_hasta', e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xxl-5">
          <div className="row g-3">
            <KpiCard label="Campañas" value={dashboard.total_campanas} icon="bi-megaphone" />
            <KpiCard label="Activas" value={dashboard.total_activas} icon="bi-broadcast-pin" />
            <KpiCard label="Visitas" value={dashboard.total_visitas_unicas} icon="bi-person-plus" />
            <KpiCard label="Decisiones" value={dashboard.total_decisiones} icon="bi-heart" />
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xxl-4">
          <div className="card shadow-sm mb-3 campanas-form-card">
            <div className="card-header bg-white d-flex align-items-center justify-content-between gap-2 flex-wrap">
              <div>
                <h5 className="mb-0">{editandoCampanaId ? 'Editar campaña' : 'Nueva campaña'}</h5>
                <small className="text-muted">Registro operativo para campaña evangelística</small>
              </div>
              <div className="d-flex gap-2">
                <BotonAccion icono={editandoCampanaId ? 'bi-floppy' : 'bi-plus-lg'} label={editandoCampanaId ? 'Actualizar' : 'Agregar'} onClick={guardarCampana} disabled={guardando} />
                <BotonAccion icono="bi-arrow-counterclockwise" label="Limpiar" onClick={resetCampanaForm} outline />
              </div>
            </div>

            <div className="card-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label form-label-sm">Nombre</label>
                  <input className="form-control form-control-sm" value={campanaForm.nombre} onChange={(e) => setCampanaForm((prev) => ({ ...prev, nombre: e.target.value }))} />
                </div>
                <div className="col-12">
                  <label className="form-label form-label-sm">Lema</label>
                  <input className="form-control form-control-sm" value={campanaForm.lema} onChange={(e) => setCampanaForm((prev) => ({ ...prev, lema: e.target.value }))} />
                </div>
                <div className="col-6">
                  <label className="form-label form-label-sm">Tipo</label>
                  <select className="form-select form-select-sm" value={campanaForm.tipo} onChange={(e) => setCampanaForm((prev) => ({ ...prev, tipo: e.target.value }))}>
                    {TIPO_OPCIONES.map((opcion) => (
                      <option key={opcion.valor} value={opcion.valor}>{opcion.etiqueta}</option>
                    ))}
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label form-label-sm">Estado</label>
                  <select className="form-select form-select-sm" value={campanaForm.estado} onChange={(e) => setCampanaForm((prev) => ({ ...prev, estado: e.target.value }))}>
                    {ESTADO_CAMPANA_OPCIONES.filter((opcion) => opcion.valor).map((opcion) => (
                      <option key={opcion.valor} value={opcion.valor}>{opcion.etiqueta}</option>
                    ))}
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label form-label-sm">Fecha inicio</label>
                  <input type="date" className="form-control form-control-sm" value={campanaForm.fecha_inicio} onChange={(e) => setCampanaForm((prev) => ({ ...prev, fecha_inicio: e.target.value }))} />
                </div>
                <div className="col-6">
                  <label className="form-label form-label-sm">Fecha fin</label>
                  <input type="date" className="form-control form-control-sm" value={campanaForm.fecha_fin} onChange={(e) => setCampanaForm((prev) => ({ ...prev, fecha_fin: e.target.value }))} />
                </div>
                <div className="col-6">
                  <label className="form-label form-label-sm">Lugar</label>
                  <input className="form-control form-control-sm" value={campanaForm.lugar} onChange={(e) => setCampanaForm((prev) => ({ ...prev, lugar: e.target.value }))} />
                </div>
                <div className="col-6">
                  <label className="form-label form-label-sm">Predicador</label>
                  <input className="form-control form-control-sm" value={campanaForm.predicador} onChange={(e) => setCampanaForm((prev) => ({ ...prev, predicador: e.target.value }))} />
                </div>

                {mostrarExtraCampana && (
                  <>
                    <div className="col-12">
                      <label className="form-label form-label-sm">Responsable</label>
                      <select className="form-select form-select-sm" value={campanaForm.responsable_usuario_id} onChange={(e) => setCampanaForm((prev) => ({ ...prev, responsable_usuario_id: e.target.value }))}>
                        <option value="">Sin responsable</option>
                        {usuarios.map((usuario) => (
                          <option key={usuario.id} value={usuario.id}>{usuario.nombre_completo}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label form-label-sm">Descripción</label>
                      <textarea className="form-control form-control-sm" rows="2" value={campanaForm.descripcion} onChange={(e) => setCampanaForm((prev) => ({ ...prev, descripcion: e.target.value }))} />
                    </div>
                    <div className="col-12">
                      <label className="form-label form-label-sm">Observaciones</label>
                      <textarea className="form-control form-control-sm" rows="2" value={campanaForm.observaciones} onChange={(e) => setCampanaForm((prev) => ({ ...prev, observaciones: e.target.value }))} />
                    </div>
                  </>
                )}

                <div className="col-12">
                  <button type="button" className="btn btn-link btn-sm p-0 d-inline-flex align-items-center gap-1 text-muted" onClick={() => setMostrarExtraCampana(!mostrarExtraCampana)}>
                    <i className={`bi ${mostrarExtraCampana ? 'bi-chevron-up' : 'bi-chevron-down'}`} aria-hidden="true"></i>
                    <span>{mostrarExtraCampana ? 'Menos detalles' : 'Más detalles'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm campanas-lista-card">
            <div className="card-header bg-white d-flex align-items-center justify-content-between gap-2">
              <h5 className="mb-0">Campañas registradas</h5>
              <span className="badge text-bg-light border">{campanas.length}</span>
            </div>
            <div className="card-body p-0">
              <div className="campanas-table-shell">
                <div className="campanas-table-scroll">
                  <table className="table table-sm align-middle mb-0 campanas-lista-table">
                    <thead>
                      <tr>
                        <th>Campaña</th>
                        <th>Estado</th>
                        <th>Sesiones</th>
                        <th className="text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!cargando && campanas.length === 0 && (
                        <tr>
                          <td colSpan="4" className="text-center text-muted py-4">No hay campañas registradas todavía.</td>
                        </tr>
                      )}
                      {campanas.map((item) => (
                        <tr key={item.id} className={seleccionadaId === item.id ? 'table-active' : ''}>
                          <td>
                            <button type="button" className="btn btn-link p-0 text-start text-decoration-none fw-semibold" onClick={() => setSeleccionadaId(item.id)}>
                              {item.nombre}
                            </button>
                            <div className="small text-muted">{formatearFecha(item.fecha_inicio)} al {formatearFecha(item.fecha_fin)}</div>
                          </td>
                          <td><span className={`badge ${claseEstado(item.estado)}`}>{item.estado}</span></td>
                          <td>{Number(item.total_sesiones || 0).toLocaleString('es-CR')}</td>
                          <td className="text-end">
                            <div className="d-inline-flex gap-2">
                              <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => editarCampana(item)} title="Editar">
                                <i className="bi bi-pencil" aria-hidden="true"></i>
                              </button>
                              <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => archivarCampana(item.id)} title="Archivar">
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
            <DetalleCampana
              detalle={detalle}
              cargandoDetalle={cargandoDetalle}
              detalleVista={detalleVista}
              setDetalleVista={setDetalleVista}
              recargar={recargar}
              sesionForm={sesionForm}
              setSesionForm={setSesionForm}
              asistenteForm={asistenteForm}
              setAsistenteForm={setAsistenteForm}
              asistenciaForm={asistenciaForm}
              setAsistenciaForm={setAsistenciaForm}
              decisionForm={decisionForm}
              setDecisionForm={setDecisionForm}
              asistentesOpciones={asistentesOpciones}
              sesionesOpciones={sesionesOpciones}
              guardarSesion={guardarSesion}
              guardarAsistente={guardarAsistente}
              guardarAsistencia={guardarAsistencia}
              convertirAsistenteAEstudio={convertirAsistenteAEstudio}
              convirtiendoAsistenteId={convirtiendoAsistenteId}
              guardarDecision={guardarDecision}
            />
          )}
        </div>
      </div>
    </div>
  );
}
