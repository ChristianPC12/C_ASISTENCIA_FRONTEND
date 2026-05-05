import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import SearchInput from '../components/ui/SearchInput';
import { useCampanas } from '../hooks/useCampanas';
import CampanaFormModal from '../components/campanas/CampanaFormModal';
import CampanaSelectorModal from '../components/campanas/CampanaSelectorModal';
import CampanaDetalleModal from '../components/campanas/CampanaDetalleModal';
import VisitasGeneralView from '../components/campanas/VisitasGeneralView';
import {
  EVENT_CAMPANAS_ABRIR_NUEVA,
  EVENT_CAMPANAS_ABRIR_LISTA,
  EVENT_CAMPANAS_ABRIR_SELECTOR,
  EVENT_CAMPANAS_ABRIR_VISITAS,
  EVENT_CAMPANAS_VISTA_ACTIVA
} from '../config/events';
import { notificarError } from '../utils/notify';

const TIPO_OPCIONES = [
  { valor: 'SEMANA_EVANGELISTICA', etiqueta: 'Semana evangelística' },
  { valor: 'CAMPANA_2_SEMANAS', etiqueta: 'Campaña 2 semanas' },
  { valor: 'OTRO', etiqueta: 'Otro' }
];

const ESTADO_CAMPANA_OPCIONES = [
  { valor: '', etiqueta: 'Todos los estados' },
  { valor: 'POR_INICIAR', etiqueta: 'Por iniciar' },
  { valor: 'ACTIVA', etiqueta: 'Activa' },
  { valor: 'FINALIZADA', etiqueta: 'Finalizada' }
];

const TRIMESTRE_OPCIONES = [
  { valor: '', etiqueta: 'Todos' },
  { valor: '1', etiqueta: 'T1 (Ene-Mar)' },
  { valor: '2', etiqueta: 'T2 (Abr-Jun)' },
  { valor: '3', etiqueta: 'T3 (Jul-Sep)' },
  { valor: '4', etiqueta: 'T4 (Oct-Dic)' }
];

function generarOpcionesAnio() {
  const actual = new Date().getFullYear();
  const opciones = [{ valor: '', etiqueta: 'Todos' }];
  for (let a = actual + 1; a >= actual - 5; a--) {
    opciones.push({ valor: String(a), etiqueta: String(a) });
  }
  return opciones;
}

function calcularFechasDeFiltro(anio, trimestre) {
  if (!anio) return { fecha_desde: '', fecha_hasta: '' };
  const a = Number(anio);
  if (!trimestre) return { fecha_desde: `${a}-01-01`, fecha_hasta: `${a}-12-31` };
  const t = Number(trimestre);
  const mesInicio = (t - 1) * 3 + 1;
  const mesFin = t * 3;
  const ultimoDia = new Date(a, mesFin, 0).getDate();
  return {
    fecha_desde: `${a}-${String(mesInicio).padStart(2, '0')}-01`,
    fecha_hasta: `${a}-${String(mesFin).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`
  };
}

const ANIO_OPCIONES = generarOpcionesAnio();

const ESTADO_SESION_OPCIONES = [
  { valor: 'PROGRAMADA', etiqueta: 'Programada' },
  { valor: 'REALIZADA', etiqueta: 'Realizada' },
  { valor: 'CANCELADA', etiqueta: 'Cancelada' }
];

const TIPO_ASISTENTE_OPCIONES = [
  { valor: 'VISITA', etiqueta: 'Visita' },
  { valor: 'INTERESADO', etiqueta: 'Interesado' }
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
  { valor: 'OTROS', etiqueta: 'Otros' }
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
  { valor: 'SESIONES', etiqueta: 'Días', icono: 'bi-calendar-event' },
  { valor: 'REG_ASISTENCIA', etiqueta: 'Asistencia', icono: 'bi-person-check' },
  { valor: 'ASISTENTES', etiqueta: 'Visitas', icono: 'bi-people' },
  { valor: 'REG_DECISION', etiqueta: 'Reg. decisión', icono: 'bi-journal-plus' },
  { valor: 'DECISIONES', etiqueta: 'Decisiones', icono: 'bi-check2-circle' }
];

function SelectorVisita({ opciones, value, onChange }) {
  const [modoBusqueda, setModoBusqueda] = useState(false);
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [mostrarLista, setMostrarLista] = useState(false);
  const contenedorRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const cerrar = (e) => {
      if (
        contenedorRef.current && !contenedorRef.current.contains(e.target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(e.target))
      ) {
        setMostrarLista(false);
      }
    };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, []);

  const filtrados = opciones.filter(a =>
    a.nombre_snapshot.toLowerCase().includes(textoBusqueda.toLowerCase())
  );

  const seleccionarItem = (id) => {
    onChange(String(id));
    setTextoBusqueda(opciones.find(a => a.id === id)?.nombre_snapshot || '');
    setMostrarLista(false);
  };

  const volverASelect = () => {
    setModoBusqueda(false);
    setTextoBusqueda('');
    setMostrarLista(false);
  };

  const getDropdownPos = () => {
    if (!inputRef.current) return { top: 0, left: 0, width: 0 };
    const rect = inputRef.current.getBoundingClientRect();
    return { top: rect.bottom + 2, left: rect.left, width: rect.width };
  };

  if (!modoBusqueda) {
    return (
      <div className="d-flex gap-1 align-items-end">
        <div className="flex-grow-1">
          <select className="form-select form-select-sm" value={value} onChange={(e) => onChange(e.target.value)}>
            <option value="">Seleccione</option>
            {opciones.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre_snapshot}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="btn btn-outline-primary btn-sm rounded-circle d-inline-flex align-items-center justify-content-center"
          style={{ width: '31px', height: '31px', flexShrink: 0 }}
          onClick={() => { setModoBusqueda(true); setTextoBusqueda(''); onChange(''); }}
          title="Buscar por nombre"
          aria-label="Cambiar a búsqueda por nombre"
        >
          <i className="bi bi-search" style={{ fontSize: '0.75rem' }} aria-hidden="true"></i>
        </button>
      </div>
    );
  }

  const pos = getDropdownPos();

  return (
    <div className="d-flex gap-1 align-items-end" ref={contenedorRef}>
      <div className="flex-grow-1">
        <input
          ref={inputRef}
          type="text"
          className="form-control form-control-sm"
          placeholder="Buscar por nombre..."
          value={textoBusqueda}
          onChange={(e) => { setTextoBusqueda(e.target.value); setMostrarLista(true); if (!e.target.value) onChange(''); }}
          onFocus={() => setMostrarLista(true)}
          autoFocus
        />
        {mostrarLista && textoBusqueda && createPortal(
          <div
            ref={dropdownRef}
            className="bg-white border rounded shadow-sm"
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999, maxHeight: '200px', overflowY: 'auto' }}
          >
            {filtrados.length === 0 ? (
              <div className="px-3 py-2 text-muted small">Sin resultados</div>
            ) : (
              filtrados.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={`dropdown-item px-3 py-1 small ${String(a.id) === String(value) ? 'active' : ''}`}
                  onClick={() => seleccionarItem(a.id)}
                >
                  {a.nombre_snapshot}
                </button>
              ))
            )}
          </div>,
          document.body
        )}
      </div>
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm rounded-circle d-inline-flex align-items-center justify-content-center"
        style={{ width: '31px', height: '31px', flexShrink: 0 }}
        onClick={volverASelect}
        title="Volver al selector"
        aria-label="Volver al selector"
      >
        <i className="bi bi-x-lg" style={{ fontSize: '0.75rem' }} aria-hidden="true"></i>
      </button>
    </div>
  );
}

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
    case 'EN CURSO':
      return 'bg-success-subtle text-success-emphasis border-success-subtle';
    case 'POR_INICIAR':
    case 'PROGRAMADA':
    case 'PENDIENTE':
      return 'bg-warning-subtle text-warning-emphasis border-warning-subtle';
    case 'FINALIZADA':
    case 'CERRADO':
    case 'TERMINADO':
      return 'bg-primary-subtle text-primary-emphasis border-primary-subtle';
    case 'CANCELADA':
    case 'NO_LOCALIZABLE':
      return 'bg-secondary-subtle text-secondary-emphasis border-secondary-subtle';
    default:
      return 'bg-light text-dark border';
  }
}

function etiquetaEstado(estado) {
  const etiquetas = {
    POR_INICIAR: 'Por iniciar',
    ACTIVA: 'Activa',
    FINALIZADA: 'Finalizada'
  };
  return etiquetas[estado] || estado || '-';
}

function KpiCard({ label, value, icon }) {
  return (
    <div className="card shadow-sm campanas-kpi-card h-100">
      <div className="card-body py-3">
        <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
          <span className="small text-muted text-uppercase">{label}</span>
          <i className={`bi ${icon} text-primary`} aria-hidden="true"></i>
        </div>
        <div className="h4 mb-0">{Number(value || 0).toLocaleString('es-CR')}</div>
      </div>
    </div>
  );
}

function DetalleVacio() {
  return (
    <div className="card shadow-sm h-100 campanas-detalle-card">
      <div className="card-body d-flex align-items-center justify-content-center text-center text-muted py-5">
        Seleccione una campaña para ver su resumen, las noches registradas, las visitas y las decisiones.
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

function ResumenCampana({ detalle, setDetalleVista, setAsistenteResaltadoId }) {
  const [mostrarFrecuentes, setMostrarFrecuentes] = useState(false);
  const [mostrarDecisionesDetalle, setMostrarDecisionesDetalle] = useState(false);
  const [mostrarFichaPastoral, setMostrarFichaPastoral] = useState(false);
  const [mostrarLecturaRapida, setMostrarLecturaRapida] = useState(false);
  const resumen = detalle?.resumen || {};
  const visitasFrecuentes = (detalle?.asistentes || [])
    .filter(a => a.tipo_asistente !== 'MIEMBRO' && (a.total_noches || 0) >= 1)
    .sort((a, b) => (b.total_noches || 0) - (a.total_noches || 0));

  const decisionesPorTipo = useMemo(() => {
    const lista = detalle?.decisiones || [];
    const map = new Map();
    DECISION_OPCIONES.forEach((op) => {
      map.set(op.clave, { clave: op.clave, etiqueta: op.etiqueta, registros: [] });
    });
    lista.forEach((d) => {
      const grupo = map.get(d.decision_clave);
      if (grupo) grupo.registros.push(d);
      else map.set(d.decision_clave, { clave: d.decision_clave, etiqueta: d.decision_etiqueta || d.decision_clave, registros: [d] });
    });
    return Array.from(map.values());
  }, [detalle?.decisiones]);

  return (
    <>
      <div className="row g-2 g-md-3 mb-3">
        <div className="col-4"><KpiCard label="Sesiones" value={resumen.total_sesiones} icon="bi-calendar-event" /></div>
        <div className="col-4"><KpiCard label="Visitas" value={resumen.total_visitas} icon="bi-person-plus" /></div>
        <div className="col-4"><KpiCard label="Decisiones" value={resumen.total_decisiones} icon="bi-heart" /></div>
      </div>

      <div className="row g-2 mb-3 d-xl-none">
        <div className="col-6">
          <button type="button" className="btn btn-outline-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-1" onClick={() => setMostrarFichaPastoral(true)}>
            <i className="bi bi-clipboard-data" aria-hidden="true"></i>
            <span>Ficha pastoral</span>
          </button>
        </div>
        <div className="col-6">
          <button type="button" className="btn btn-outline-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-1" onClick={() => setMostrarLecturaRapida(true)}>
            <i className="bi bi-speedometer2" aria-hidden="true"></i>
            <span>Lectura rápida</span>
          </button>
        </div>
      </div>

      <div className="row g-3 d-none d-xl-flex">
        <div className="col-12 col-xl-7">
          <div className="card shadow-sm campanas-section-card h-100">
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
                  <span className="campanas-meta-label">Decisiones espirituales</span>
                  <div className="d-flex align-items-center gap-2">
                    <strong>{Number(resumen.total_decisiones || 0).toLocaleString('es-CR')}</strong>
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm rounded-circle d-inline-flex align-items-center justify-content-center registro-row-action-btn"
                      style={{ width: '30px', height: '30px' }}
                      onClick={() => setMostrarDecisionesDetalle(true)}
                      title="Ver detalle de decisiones"
                      aria-label="Ver detalle de decisiones espirituales"
                    >
                      <i className="bi bi-search" style={{ fontSize: '0.75rem' }} aria-hidden="true"></i>
                    </button>
                  </div>
                </div>
                <div className="campanas-chip-row">
                  <span className="campanas-meta-label">Visitas frecuentes</span>
                  <div className="d-flex align-items-center gap-2">
                    <strong>{visitasFrecuentes.length}</strong>
                    {visitasFrecuentes.length > 0 && (
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm rounded-circle d-inline-flex align-items-center justify-content-center registro-row-action-btn"
                        style={{ width: '30px', height: '30px' }}
                        onClick={() => setMostrarFrecuentes(true)}
                        title="Ver visitas frecuentes"
                        aria-label="Ver visitas frecuentes"
                      >
                        <i className="bi bi-search" style={{ fontSize: '0.75rem' }} aria-hidden="true"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {mostrarFrecuentes && (
        <div className="prompt-overlay-iasd" onClick={() => setMostrarFrecuentes(false)}>
          <div className="prompt-modal-iasd" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', height: '450px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ paddingBottom: '1rem', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h5 className="mb-0">Visitas frecuentes</h5>
              <button type="button" className="btn-close" onClick={() => setMostrarFrecuentes(false)} aria-label="Cerrar"></button>
            </div>
            <div style={{ padding: '1rem 0', flex: 1, minHeight: 0, overflowY: 'auto' }}>
              <table className="table table-striped table-hover align-middle mb-0" style={{ fontSize: '0.875rem' }}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th className="text-center">Noches</th>
                  </tr>
                </thead>
                <tbody>
                  {visitasFrecuentes.map(v => (
                    <tr
                      key={v.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setMostrarFrecuentes(false);
                        if (setAsistenteResaltadoId) setAsistenteResaltadoId(v.id);
                        if (setDetalleVista) setDetalleVista('ASISTENTES');
                      }}
                    >
                      <td>{v.nombre_snapshot}</td>
                      <td className="text-center">
                        <span className="badge bg-primary-subtle text-primary-emphasis">{v.total_noches}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ paddingTop: '1rem', borderTop: '1px solid #e0e0e0', textAlign: 'right' }}>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setMostrarFrecuentes(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {mostrarDecisionesDetalle && (
        <div className="prompt-overlay-iasd" onClick={() => setMostrarDecisionesDetalle(false)}>
          <div className="prompt-modal-iasd" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', height: '500px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ paddingBottom: '1rem', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h5 className="mb-0">Decisiones espirituales</h5>
              <button type="button" className="btn-close" onClick={() => setMostrarDecisionesDetalle(false)} aria-label="Cerrar"></button>
            </div>
            <div style={{ padding: '1rem 0', flex: 1, minHeight: 0, overflowY: 'auto' }}>
              <p className="small text-muted mb-3">
                Estos son los tipos de decisiones que se pueden registrar y, si las hay, las personas que las tomaron en esta campaña.
              </p>
              {decisionesPorTipo.map((grupo) => (
                <div key={grupo.clave} className="mb-3">
                  <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                    <span className="fw-semibold">{grupo.etiqueta}</span>
                    <span className={`badge ${grupo.registros.length > 0 ? 'bg-primary-subtle text-primary-emphasis' : 'bg-light text-muted border'}`}>
                      {grupo.registros.length}
                    </span>
                  </div>
                  {grupo.registros.length > 0 && (
                    <ul className="list-unstyled small mb-0 ps-3" style={{ borderLeft: '2px solid #e0e0e0' }}>
                      {grupo.registros.map((r) => (
                        <li key={r.id} className="d-flex justify-content-between gap-2 py-1">
                          <span>{r.nombre_snapshot || '—'}</span>
                          <span className="text-muted">{formatearFechaHora(r.fecha_decision)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            <div style={{ paddingTop: '1rem', borderTop: '1px solid #e0e0e0', textAlign: 'right' }}>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setMostrarDecisionesDetalle(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {mostrarFichaPastoral && (
        <div className="prompt-overlay-iasd" onClick={() => setMostrarFichaPastoral(false)}>
          <div className="prompt-modal-iasd" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px', width: '95%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h5 className="mb-0" style={{ color: 'var(--iasd-azul)' }}>
                <i className="bi bi-clipboard-data me-2" aria-hidden="true"></i>
                Ficha pastoral
              </h5>
              <button type="button" className="btn-close" onClick={() => setMostrarFichaPastoral(false)} aria-label="Cerrar"></button>
            </div>
            <div style={{ padding: '1rem 0', flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
              <div className="campanas-resumen-grid">
                <div><span className="campanas-meta-label">Tipo</span><strong>{etiquetaTipoCampana(detalle.tipo)}</strong></div>
                <div><span className="campanas-meta-label">Período</span><strong>{formatearFecha(detalle.fecha_inicio)} al {formatearFecha(detalle.fecha_fin)}</strong></div>
                <div><span className="campanas-meta-label">Lugar</span><strong>{detalle.lugar || '-'}</strong></div>
                <div><span className="campanas-meta-label">Predicador</span><strong>{detalle.predicador || '-'}</strong></div>
                <div><span className="campanas-meta-label">Responsable</span><strong>{detalle.responsable_usuario_nombre || 'Sin responsable'}</strong></div>
              </div>
              {detalle.descripcion && (
                <div className="mt-3"><span className="campanas-meta-label">Descripción</span><p className="mb-0" style={{ wordBreak: 'break-word' }}>{detalle.descripcion}</p></div>
              )}
              {detalle.observaciones && (
                <div className="mt-3"><span className="campanas-meta-label">Observaciones</span><p className="mb-0" style={{ wordBreak: 'break-word' }}>{detalle.observaciones}</p></div>
              )}
            </div>
            <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #e0e0e0', textAlign: 'right' }}>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setMostrarFichaPastoral(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {mostrarLecturaRapida && (
        <div className="prompt-overlay-iasd" onClick={() => setMostrarLecturaRapida(false)}>
          <div className="prompt-modal-iasd" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '95%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h5 className="mb-0" style={{ color: 'var(--iasd-azul)' }}>
                <i className="bi bi-speedometer2 me-2" aria-hidden="true"></i>
                Lectura rápida
              </h5>
              <button type="button" className="btn-close" onClick={() => setMostrarLecturaRapida(false)} aria-label="Cerrar"></button>
            </div>
            <div style={{ padding: '1rem 0', flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
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
                  <span className="campanas-meta-label">Decisiones espirituales</span>
                  <div className="d-flex align-items-center gap-2">
                    <strong>{Number(resumen.total_decisiones || 0).toLocaleString('es-CR')}</strong>
                    <button type="button" className="btn btn-outline-primary btn-sm rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px' }} onClick={() => { setMostrarLecturaRapida(false); setMostrarDecisionesDetalle(true); }} title="Ver detalle de decisiones">
                      <i className="bi bi-search" style={{ fontSize: '0.75rem' }} aria-hidden="true"></i>
                    </button>
                  </div>
                </div>
                <div className="campanas-chip-row">
                  <span className="campanas-meta-label">Visitas frecuentes</span>
                  <div className="d-flex align-items-center gap-2">
                    <strong>{visitasFrecuentes.length}</strong>
                    {visitasFrecuentes.length > 0 && (
                      <button type="button" className="btn btn-outline-primary btn-sm rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px' }} onClick={() => { setMostrarLecturaRapida(false); setMostrarFrecuentes(true); }} title="Ver visitas frecuentes">
                        <i className="bi bi-search" style={{ fontSize: '0.75rem' }} aria-hidden="true"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #e0e0e0', textAlign: 'right' }}>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setMostrarLecturaRapida(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function calcularDiasCampana(fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) return [];
  const inicio = new Date(fechaInicio + 'T00:00:00');
  const fin = new Date(fechaFin + 'T00:00:00');
  const dias = [];
  let current = new Date(inicio);
  let num = 1;
  while (current <= fin) {
    dias.push({ numero: num, fecha: current.toISOString().split('T')[0] });
    current.setDate(current.getDate() + 1);
    num++;
  }
  return dias;
}

function SesionesCampana({ detalle, sesionForm, setSesionForm, guardarSesion, editandoSesionId, editarSesion, resetSesionForm }) {
  const [mostrarObservacionesModal, setMostrarObservacionesModal] = useState(false);
  const [observacionesSeleccionadas, setObservacionesSeleccionadas] = useState('');
  const formEditarRef = useRef(null);

  useEffect(() => {
    if (editandoSesionId && formEditarRef.current) {
      formEditarRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [editandoSesionId]);
  const sesiones = detalle?.sesiones || [];
  const diasCampana = calcularDiasCampana(detalle?.fecha_inicio, detalle?.fecha_fin);

  const hoy = new Date().toLocaleDateString('en-CA');
  const estado = detalle?.estado;
  let puedeManejar = false;
  if (estado === 'ACTIVA') {
    puedeManejar = true;
  } else if (estado === 'FINALIZADA' && detalle?.fecha_fin) {
    const fechaLimite = new Date(detalle.fecha_fin + 'T00:00:00');
    fechaLimite.setDate(fechaLimite.getDate() + 7);
    puedeManejar = fechaLimite >= new Date(hoy + 'T00:00:00');
  }

  return (
    <>
      {!puedeManejar && (
        <div className="alert alert-info py-2 small mb-3" role="alert">
          <i className="bi bi-info-circle me-2" aria-hidden="true"></i>
          {estado === 'POR_INICIAR'
            ? 'Las funciones de registro estarán disponibles cuando la campaña esté activa.'
            : 'Esta campaña ha finalizado. Solo se puede consultar su información.'}
        </div>
      )}
      {puedeManejar && (
        <div className="card shadow-sm campanas-section-card mb-3" ref={formEditarRef}>
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-3">
            <h6 className="campanas-section-title mb-0">{editandoSesionId ? 'Editar noche o sesión' : 'Registrar noche o sesión'}</h6>
            <div className="d-flex gap-2">
              {editandoSesionId && (
                <BotonAccion icono="bi-x-lg" label="Cancelar" onClick={resetSesionForm} outline />
              )}
              <BotonAccion icono={editandoSesionId ? 'bi-floppy' : 'bi-plus-lg'} label={editandoSesionId ? 'Actualizar sesión' : 'Agregar sesión'} onClick={guardarSesion} />
            </div>
          </div>

          <div className="row g-3">
            <div className="col-12 col-lg-3">
              <label className="form-label form-label-sm">Día</label>
              <select className="form-select form-select-sm" value={sesionForm.fecha} onChange={(e) => setSesionForm((prev) => ({ ...prev, fecha: e.target.value }))}>
                <option value="">Seleccione un día</option>
                {diasCampana.map((dia) => {
                  const yaRegistrado = sesiones.some(s => s.fecha === dia.fecha);
                  return (
                    <option key={dia.fecha} value={dia.fecha} disabled={yaRegistrado}>
                      Día {dia.numero} · {formatearFecha(dia.fecha)} {yaRegistrado ? '(ya registrado)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="col-12 col-lg-9">
              <label className="form-label form-label-sm">Tema</label>
              <input className="form-control form-control-sm" value={sesionForm.tema_titulo} onChange={(e) => setSesionForm((prev) => ({ ...prev, tema_titulo: e.target.value }))} maxLength={45} />
            </div>
            <div className="col-12">
              <label className="form-label form-label-sm">Observaciones</label>
              <input className="form-control form-control-sm" value={sesionForm.observaciones} onChange={(e) => setSesionForm((prev) => ({ ...prev, observaciones: e.target.value }))} maxLength={60} />
            </div>
          </div>
        </div>
      </div>
      )}

      <div className="card shadow-sm campanas-section-card">
        <div className="card-body p-0">
          <div className="tabla-registros-scroll campanas-detalle-table-scroll" style={{ overflowX: 'auto' }}>
            <table className="table table-striped table-hover align-middle mb-0 tabla-registros campanas-sesiones-table">
                <thead className="tabla-registros-thead">
                  <tr>
                    <th>Día</th>
                    <th>Tema</th>
                    <th>Estado</th>
                    <th className="text-center">Visitas</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sesiones.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-4">
                        Todavía no hay noches registradas para esta campaña.
                      </td>
                    </tr>
                  )}
                  {sesiones.map((item) => {
                    const diaNum = diasCampana.find(d => d.fecha === item.fecha)?.numero || '-';
                    const estadoCalculado = item.fecha < hoy ? 'TERMINADO' : item.fecha === hoy ? 'EN CURSO' : 'PROGRAMADA';
                    return (
                    <tr key={item.id}>
                      <td>Día {diaNum} · {formatearFecha(item.fecha)}</td>
                      <td>
                        <div className="fw-semibold">{item.tema_titulo}</div>
                        <small className="text-muted">{item.predicador_noche || 'Sin predicador'}</small>
                      </td>
                      <td><span className={`badge ${claseEstado(estadoCalculado)}`}>{estadoCalculado}</span></td>
                      <td className="text-center">
                        <strong>{Number(item.total_registros || 0).toLocaleString('es-CR')}</strong>
                      </td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-2">
                          {item.observaciones && (
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm rounded-circle d-inline-flex align-items-center justify-content-center registro-row-action-btn"
                              style={{ width: '34px', height: '34px' }}
                              onClick={() => {
                                setObservacionesSeleccionadas(item.observaciones);
                                setMostrarObservacionesModal(true);
                              }}
                              title="Ver observaciones"
                              aria-label="Ver observaciones"
                            >
                              <i className="bi bi-search" aria-hidden="true"></i>
                            </button>
                          )}
                          {item.fecha >= hoy && (
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm rounded-circle d-inline-flex align-items-center justify-content-center registro-row-action-btn"
                            style={{ width: '34px', height: '34px' }}
                            onClick={() => editarSesion(item)}
                            title="Editar noche o sesión"
                            aria-label="Editar noche o sesión"
                          >
                            <i className="bi bi-pencil-square" aria-hidden="true"></i>
                          </button>
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

      {mostrarObservacionesModal && (
        <div className="prompt-overlay-iasd" onClick={() => setMostrarObservacionesModal(false)}>
          <div className="prompt-modal-iasd" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ paddingBottom: '1rem', borderBottom: '1px solid #e0e0e0' }}>
              <h5 className="mb-0">Observaciones</h5>
            </div>
            <div style={{ padding: '1rem 0', minHeight: '100px', maxHeight: '300px', overflowY: 'auto' }}>
              <p className="mb-0" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{observacionesSeleccionadas}</p>
            </div>
            <div style={{ paddingTop: '1rem', borderTop: '1px solid #e0e0e0', textAlign: 'right' }}>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setMostrarObservacionesModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
  convirtiendoAsistenteId,
  entregarPremios
}) {
  const [mostrarMasAsistente, setMostrarMasAsistente] = useState(false);
  const [seguimientoPersonalizado, setSeguimientoPersonalizado] = useState('');
  const [asistenteResaltadoId, setAsistenteResaltadoId] = useState(null);
  const asistentes = detalle?.asistentes || [];
  const totalSesiones = detalle?.sesiones?.length || 0;

  const resaltadoCallbackRef = useCallback((node) => {
    if (node) {
      const celdas = node.querySelectorAll('td');
      celdas.forEach(td => { td.style.transition = 'background-color 0.4s ease-in'; td.style.backgroundColor = '#fff3cd'; });
      requestAnimationFrame(() => { node.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
      setTimeout(() => { celdas.forEach(td => { td.style.backgroundColor = '#ffecb5'; }); }, 800);
      setTimeout(() => { celdas.forEach(td => { td.style.backgroundColor = '#fff3cd'; }); }, 1400);
      setTimeout(() => { celdas.forEach(td => { td.style.transition = 'background-color 1.2s ease-out'; td.style.backgroundColor = ''; }); }, 2200);
      setTimeout(() => { celdas.forEach(td => { td.style.transition = ''; }); setAsistenteResaltadoId(null); }, 3500);
    }
  }, []);

  const guardarAsistenciaConResaltado = useCallback(async () => {
    const resultado = await guardarAsistencia();
    if (resultado?.teniaPremio && resultado?.asistenteId) {
      setAsistenteResaltadoId(Number(resultado.asistenteId));
    }
  }, [guardarAsistencia]);

  const sesionActiva = useMemo(() => {
    const hoy = new Date().toLocaleDateString('en-CA');
    return sesionesOpciones.find(s => s.fecha === hoy) || null;
  }, [sesionesOpciones]);

  useEffect(() => {
    if (!asistenciaForm.sesion_id && sesionActiva) {
      setAsistenciaForm(prev => ({ ...prev, sesion_id: String(sesionActiva.id) }));
    }
  }, [sesionActiva, asistenciaForm.sesion_id, setAsistenciaForm]);

  const hoy = new Date().toLocaleDateString('en-CA');
  const estado = detalle?.estado;
  let puedeManejar = false;
  if (estado === 'ACTIVA') {
    puedeManejar = true;
  } else if (estado === 'FINALIZADA' && detalle?.fecha_fin) {
    const fechaLimite = new Date(detalle.fecha_fin + 'T00:00:00');
    fechaLimite.setDate(fechaLimite.getDate() + 7);
    puedeManejar = fechaLimite >= new Date(hoy + 'T00:00:00');
  }

  return (
    <>
      {!puedeManejar && (
        <div className="alert alert-info py-2 small mb-3" role="alert">
          <i className="bi bi-info-circle me-2" aria-hidden="true"></i>
          {estado === 'POR_INICIAR'
            ? 'Las funciones de registro estarán disponibles cuando la campaña esté activa.'
            : 'Esta campaña ha finalizado. Solo se puede consultar su información.'}
        </div>
      )}
      {puedeManejar && !sesionActiva && (
        <div className="alert alert-warning py-2 small mb-3" role="alert">
          <i className="bi bi-exclamation-triangle me-2" aria-hidden="true"></i>
          No hay una sesión registrada para hoy. Solo se puede registrar asistencia el mismo día de la sesión.
        </div>
      )}
      {puedeManejar && sesionActiva && (
        <>
        <div className="card shadow-sm campanas-section-card mb-3">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-3">
            <h6 className="campanas-section-title mb-0">Asistencia rápida</h6>
            <BotonAccion icono="bi-check2-square" label="Guardar asistencia" onClick={guardarAsistenciaConResaltado} disabled={!asistenciaForm.sesion_id || !asistenciaForm.campana_asistente_id || !asistenciaForm.hora_llegada} />
          </div>

          <div className="row g-2 align-items-end">
            <div className="col-12 col-md">
              <label className="form-label form-label-sm">Sesión</label>
              <div className="d-flex gap-1">
                <input
                  type="text"
                  className="form-control form-control-sm text-center"
                  value={(() => {
                    if (!asistenciaForm.sesion_id) return '';
                    const sesionSel = sesionesOpciones.find(s => String(s.id) === String(asistenciaForm.sesion_id));
                    if (!sesionSel) return '';
                    const diasCampanaAux = calcularDiasCampana(detalle?.fecha_inicio, detalle?.fecha_fin);
                    const diaNum = diasCampanaAux.find(d => d.fecha === sesionSel.fecha)?.numero || '-';
                    return `Día ${diaNum}`;
                  })()}
                  readOnly
                  style={{ width: '65px', flexShrink: 0 }}
                />
                <select className="form-select form-select-sm" value={asistenciaForm.sesion_id} onChange={(e) => setAsistenciaForm((prev) => ({ ...prev, sesion_id: e.target.value }))}>
                  <option value="">Seleccione</option>
                  {sesionesOpciones.map((sesion) => {
                    const esHoy = sesion.fecha === hoy;
                    return (
                      <option key={sesion.id} value={sesion.id} disabled={!esHoy}>
                        {formatearFecha(sesion.fecha)} - {sesion.tema_titulo}{!esHoy ? ' (bloqueado)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label form-label-sm">Visita</label>
              <SelectorVisita
                opciones={asistentesOpciones}
                value={asistenciaForm.campana_asistente_id}
                onChange={(val) => setAsistenciaForm((prev) => ({ ...prev, campana_asistente_id: val }))}
              />
            </div>
            <div className="col-12 col-md-2">
              <label className="form-label form-label-sm">Hora</label>
              <input type="time" className="form-control form-control-sm" value={asistenciaForm.hora_llegada} onChange={(e) => setAsistenciaForm((prev) => ({ ...prev, hora_llegada: e.target.value }))} />
            </div>
            <div className="col-6 col-md-1">
              <div className="form-check mt-3">
                <input className="form-check-input" type="checkbox" id="campana-puntual-quick" checked={Boolean(asistenciaForm.puntual)} onChange={(e) => setAsistenciaForm((prev) => ({ ...prev, puntual: e.target.checked }))} />
                <label className="form-check-label small" htmlFor="campana-puntual-quick">Puntual</label>
              </div>
            </div>
            <div className="col-6 col-md-1">
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
            <h6 className="campanas-section-title mb-0">Registrar visita</h6>
            <BotonAccion icono="bi-plus-lg" label="Agregar visita" onClick={guardarAsistenteConValidacion} />
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label form-label-sm">Nombre</label>
              <input className="form-control form-control-sm" value={asistenteForm.nombre_completo} onChange={(e) => setAsistenteForm((prev) => ({ ...prev, nombre_completo: e.target.value }))} maxLength={45} />
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
              <input className="form-control form-control-sm" value={asistenteForm.telefono} onChange={(e) => setAsistenteForm((prev) => ({ ...prev, telefono: e.target.value }))} maxLength={20} />
            </div>

            {mostrarMasAsistente && (
              <>
                <div className="col-12 col-md-6">
                  <label className="form-label form-label-sm">Correo</label>
                  <input className="form-control form-control-sm" value={asistenteForm.correo} onChange={(e) => setAsistenteForm((prev) => ({ ...prev, correo: e.target.value }))} maxLength={80} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label form-label-sm">Procedencia</label>
                  <input className="form-control form-control-sm" value={asistenteForm.procedencia} onChange={(e) => setAsistenteForm((prev) => ({ ...prev, procedencia: e.target.value }))} maxLength={60} />
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
                  {asistenteForm.estado_seguimiento === 'OTROS' ? (
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={seguimientoPersonalizado}
                      onChange={(e) => setSeguimientoPersonalizado(e.target.value)}
                      placeholder="Especifique el estado de seguimiento"
                      maxLength={30}
                    />
                  ) : (
                    <select className="form-select form-select-sm" value={asistenteForm.estado_seguimiento} onChange={(e) => {
                      setAsistenteForm((prev) => ({ ...prev, estado_seguimiento: e.target.value }));
                      setSeguimientoPersonalizado('');
                    }}>
                      {ESTADO_SEGUIMIENTO_OPCIONES.map((opcion) => (
                        <option key={opcion.valor} value={opcion.valor}>{opcion.etiqueta}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label form-label-sm">Dirección</label>
                  <input className="form-control form-control-sm" value={asistenteForm.direccion} onChange={(e) => setAsistenteForm((prev) => ({ ...prev, direccion: e.target.value }))} maxLength={120} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label form-label-sm">Barrio / comunidad</label>
                  <input className="form-control form-control-sm" value={asistenteForm.barrio_comunidad} onChange={(e) => setAsistenteForm((prev) => ({ ...prev, barrio_comunidad: e.target.value }))} maxLength={60} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label form-label-sm">Observaciones</label>
                  <input className="form-control form-control-sm" value={asistenteForm.observaciones} onChange={(e) => setAsistenteForm((prev) => ({ ...prev, observaciones: e.target.value }))} maxLength={150} />
                </div>
              </>
            )}

            <div className="col-12">
              <button type="button" className="btn btn-link btn-sm p-0 d-inline-flex align-items-center gap-1 text-muted" onClick={() => setMostrarMasAsistente(!mostrarMasAsistente)}>
                <i className={`bi ${mostrarMasAsistente ? 'bi-chevron-up' : 'bi-chevron-down'}`} aria-hidden="true"></i>
                <span>{mostrarMasAsistente ? 'Menos datos de la visita' : 'Más datos de la visita'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      </>
      )}

      <div className="card shadow-sm campanas-section-card">
        <div className="card-body p-0">
          <div className="campanas-table-shell">
            <div className="campanas-table-scroll">
              <table className="table table-sm align-middle mb-0 campanas-asistentes-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th className="text-center">Noches</th>
                    <th className="text-center">Puntualidad</th>
                    <th className="text-center">Premios</th>
                    <th>Seguimiento</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {asistentes.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center text-muted py-4">
                        No hay visitas registradas todavía.
                      </td>
                    </tr>
                  )}
                  {asistentes.map((item) => {
                    const pendientes = Number(item.total_premios_pendientes || 0);
                    const totalPremios = Number(item.total_premios || 0);
                    return (
                    <tr key={item.id} ref={item.id === asistenteResaltadoId ? resaltadoCallbackRef : null}>
                      <td>
                        <div className="fw-semibold">{item.nombre_snapshot}</div>
                        <small className="text-muted">{item.telefono_snapshot || item.contacto_telefono || '-'}</small>
                      </td>
                      <td><span className="badge text-bg-light border">{item.tipo_asistente}</span></td>
                      <td className="text-center">
                        <small>{Number(item.total_noches || 0)}</small>
                      </td>
                      <td className="text-center">
                        <small>{Number(item.total_puntuales || 0)} de {totalSesiones}</small>
                      </td>
                      <td className="text-center">
                        {pendientes > 0 ? (
                          <button
                            type="button"
                            className="btn btn-warning btn-sm py-0 px-2 d-inline-flex align-items-center gap-1"
                            onClick={() => entregarPremios(item.id)}
                            title="Marcar premio como entregado"
                          >
                            <i className="bi bi-gift" aria-hidden="true"></i>
                            <small>{pendientes}</small>
                          </button>
                        ) : totalPremios > 0 ? (
                          <span className="text-success small" title="Todos los premios entregados"><i className="bi bi-check-circle-fill" aria-hidden="true"></i></span>
                        ) : (
                          <span className="text-muted small">-</span>
                        )}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function DecisionesCampana({ detalle, asistentesOpciones, decisionForm, setDecisionForm, guardarDecision }) {
  const decisiones = detalle?.decisiones || [];

  const hoy = new Date().toLocaleDateString('en-CA');
  const estado = detalle?.estado;
  let puedeManejar = false;
  if (estado === 'ACTIVA') {
    puedeManejar = true;
  } else if (estado === 'FINALIZADA' && detalle?.fecha_fin) {
    const fechaLimite = new Date(detalle.fecha_fin + 'T00:00:00');
    fechaLimite.setDate(fechaLimite.getDate() + 7);
    puedeManejar = fechaLimite >= new Date(hoy + 'T00:00:00');
  }

  return (
    <>
      {!puedeManejar && (
        <div className="alert alert-info py-2 small mb-3" role="alert">
          <i className="bi bi-info-circle me-2" aria-hidden="true"></i>
          {estado === 'POR_INICIAR'
            ? 'Las funciones de registro estarán disponibles cuando la campaña esté activa.'
            : 'Esta campaña ha finalizado. Solo se puede consultar su información.'}
        </div>
      )}
      {puedeManejar && (
        <div className="card shadow-sm campanas-section-card mb-3">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-3">
            <h6 className="campanas-section-title mb-0">Registrar decisión o seguimiento</h6>
            <BotonAccion icono="bi-plus-lg" label="Agregar decisión" onClick={guardarDecision} />
          </div>

          <div className="row g-3">
            <div className="col-12 col-lg-4">
              <label className="form-label form-label-sm">Visita</label>
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
              <input className="form-control form-control-sm" value={decisionForm.observaciones} onChange={(e) => setDecisionForm((prev) => ({ ...prev, observaciones: e.target.value }))} maxLength={60} />
            </div>
          </div>
        </div>
      </div>
      )}

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
    </>
  );
}

function RegistrarAsistenciaTab({
  detalle,
  detalleVista,
  asistentesOpciones,
  sesionesOpciones,
  asistenteForm,
  setAsistenteForm,
  asistenciaForm,
  setAsistenciaForm,
  guardarAsistencia,
  guardarAsistenteConValidacion
}) {
  const [mostrarMasAsistente, setMostrarMasAsistente] = useState(false);
  const [seguimientoPersonalizado, setSeguimientoPersonalizado] = useState('');

  useEffect(() => {
    if (detalleVista === 'REG_ASISTENCIA') {
      setAsistenteForm((prev) => ({
        ...prev,
        nombre_completo: '',
        tipo_asistente: 'VISITA',
        telefono: '',
        correo: '',
        procedencia: '',
        clasificacion_etaria: '',
        estado_seguimiento: 'PENDIENTE',
        direccion: '',
        barrio_comunidad: '',
        observaciones: ''
      }));
      setMostrarMasAsistente(false);
      setSeguimientoPersonalizado('');
      setPanelAsistenciaMovil('ASISTENCIA');
    }
  }, [detalleVista, setAsistenteForm]);

  const hoy = new Date().toLocaleDateString('en-CA');
  const estado = detalle?.estado;
  let puedeManejar = false;
  if (estado === 'ACTIVA') {
    puedeManejar = true;
  } else if (estado === 'FINALIZADA' && detalle?.fecha_fin) {
    const fechaLimite = new Date(detalle.fecha_fin + 'T00:00:00');
    fechaLimite.setDate(fechaLimite.getDate() + 7);
    puedeManejar = fechaLimite >= new Date(hoy + 'T00:00:00');
  }

  if (!puedeManejar) {
    return (
      <div className="alert alert-info py-2 small mb-3" role="alert">
        <i className="bi bi-info-circle me-2" aria-hidden="true"></i>
        {estado === 'POR_INICIAR'
          ? 'Las funciones de registro estarán disponibles cuando la campaña esté activa.'
          : 'Esta campaña ha finalizado. Solo se puede consultar su información.'}
      </div>
    );
  }

  const diasCampana = calcularDiasCampana(detalle?.fecha_inicio, detalle?.fecha_fin);
  const haySesionHoy = sesionesOpciones.some(s => s.fecha === hoy);

  if (!haySesionHoy) {
    return (
      <div className="alert alert-warning py-2 small mb-3" role="alert">
        <i className="bi bi-exclamation-triangle me-2" aria-hidden="true"></i>
        No hay una sesión registrada para hoy. Solo se puede registrar asistencia el mismo día de la sesión.
      </div>
    );
  }

  return (
    <>
      <div className={`card shadow-sm campanas-section-card mb-3 campanas-asistencia-panel ${panelAsistenciaMovil === 'ASISTENCIA' ? 'is-mobile-open' : 'is-mobile-closed'}`}>
        <div className="card-body">
          <button
            type="button"
            className="campanas-asistencia-toggle d-md-none"
            onClick={() => setPanelAsistenciaMovil('ASISTENCIA')}
            aria-expanded={panelAsistenciaMovil === 'ASISTENCIA'}
            aria-controls="campanas-panel-asistencia-rapida"
          >
            <span><i className="bi bi-check2-square" aria-hidden="true"></i>Asistencia rápida</span>
            <i className={`bi ${panelAsistenciaMovil === 'ASISTENCIA' ? 'bi-chevron-up' : 'bi-chevron-down'}`} aria-hidden="true"></i>
          </button>
          <div className="d-none d-md-flex align-items-center justify-content-between gap-2 flex-wrap mb-3">
            <h6 className="campanas-section-title mb-0">Asistencia rápida</h6>
            <BotonAccion icono="bi-check2-square" label="Guardar asistencia" onClick={guardarAsistencia} disabled={!asistenciaForm.sesion_id || !asistenciaForm.campana_asistente_id || !asistenciaForm.hora_llegada} />
          </div>

          <div id="campanas-panel-asistencia-rapida" className="campanas-asistencia-panel-body">
            <div className="campanas-panel-mobile-action d-md-none mb-3">
              <BotonAccion icono="bi-check2-square" label="Guardar asistencia" onClick={guardarAsistencia} disabled={!asistenciaForm.sesion_id || !asistenciaForm.campana_asistente_id || !asistenciaForm.hora_llegada} />
            </div>

            <div className="row g-2 align-items-end">
              <div className="col-12 col-md">
                <label className="form-label form-label-sm">Sesión</label>
                <div className="d-flex gap-1">
                  <input
                    type="text"
                    className="form-control form-control-sm text-center"
                    value={(() => {
                      if (!asistenciaForm.sesion_id) return '';
                      const sesionSel = sesionesOpciones.find(s => String(s.id) === String(asistenciaForm.sesion_id));
                      if (!sesionSel) return '';
                      const diaNum = diasCampana.find(d => d.fecha === sesionSel.fecha)?.numero || '-';
                      return `Día ${diaNum}`;
                    })()}
                    readOnly
                    style={{ width: '65px', flexShrink: 0 }}
                  />
                  <select className="form-select form-select-sm" value={asistenciaForm.sesion_id} onChange={(e) => setAsistenciaForm((prev) => ({ ...prev, sesion_id: e.target.value }))}>
                    <option value="">Seleccione</option>
                    {sesionesOpciones.map((sesion) => {
                      const esHoy = sesion.fecha === hoy;
                      return (
                        <option key={sesion.id} value={sesion.id} disabled={!esHoy}>
                          {formatearFecha(sesion.fecha)} - {sesion.tema_titulo}{!esHoy ? ' (bloqueado)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label form-label-sm">Visita</label>
                <SelectorVisita
                  opciones={asistentesOpciones}
                  value={asistenciaForm.campana_asistente_id}
                  onChange={(val) => setAsistenciaForm((prev) => ({ ...prev, campana_asistente_id: val }))}
                />
              </div>
              <div className="col-12 col-md-2">
                <label className="form-label form-label-sm">Hora</label>
                <input type="time" className="form-control form-control-sm" value={asistenciaForm.hora_llegada} onChange={(e) => setAsistenciaForm((prev) => ({ ...prev, hora_llegada: e.target.value }))} />
              </div>
              <div className="col-6 col-md-1">
                <div className="form-check mt-3">
                  <input className="form-check-input" type="checkbox" id="campana-puntual-quick" checked={Boolean(asistenciaForm.puntual)} onChange={(e) => setAsistenciaForm((prev) => ({ ...prev, puntual: e.target.checked }))} />
                  <label className="form-check-label small" htmlFor="campana-puntual-quick">Puntual</label>
                </div>
              </div>
              <div className="col-6 col-md-1">
                <div className="form-check mt-3">
                  <input className="form-check-input" type="checkbox" id="campana-premio-quick" checked={Boolean(asistenciaForm.elegible_premio)} onChange={(e) => setAsistenciaForm((prev) => ({ ...prev, elegible_premio: e.target.checked }))} />
                  <label className="form-check-label small" htmlFor="campana-premio-quick">Premio</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`card shadow-sm campanas-section-card campanas-asistencia-panel ${panelAsistenciaMovil === 'VISITA' ? 'is-mobile-open' : 'is-mobile-closed'}`}>
        <div className="card-body">
          <button
            type="button"
            className="campanas-asistencia-toggle d-md-none"
            onClick={() => setPanelAsistenciaMovil('VISITA')}
            aria-expanded={panelAsistenciaMovil === 'VISITA'}
            aria-controls="campanas-panel-registrar-visita"
          >
            <span><i className="bi bi-person-plus" aria-hidden="true"></i>Registrar visita</span>
            <i className={`bi ${panelAsistenciaMovil === 'VISITA' ? 'bi-chevron-up' : 'bi-chevron-down'}`} aria-hidden="true"></i>
          </button>
          <div className="d-none d-md-flex align-items-center justify-content-between gap-2 flex-wrap mb-3">
            <h6 className="campanas-section-title mb-0">Registrar visita</h6>
            <BotonAccion icono="bi-plus-lg" label="Agregar visita" onClick={guardarAsistenteConValidacion} />
          </div>

          <div id="campanas-panel-registrar-visita" className="campanas-asistencia-panel-body">
            <div className="campanas-panel-mobile-action d-md-none mb-3">
              <BotonAccion icono="bi-plus-lg" label="Agregar visita" onClick={guardarAsistenteConValidacion} />
            </div>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label form-label-sm">Nombre</label>
              <input className="form-control form-control-sm" value={asistenteForm.nombre_completo} onChange={(e) => setAsistenteForm((prev) => ({ ...prev, nombre_completo: e.target.value }))} maxLength={45} />
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
              <input className="form-control form-control-sm" value={asistenteForm.telefono} onChange={(e) => setAsistenteForm((prev) => ({ ...prev, telefono: e.target.value }))} maxLength={20} />
            </div>

            {mostrarMasAsistente && (
              <>
                <div className="col-12 col-md-6">
                  <label className="form-label form-label-sm">Correo</label>
                  <input className="form-control form-control-sm" value={asistenteForm.correo} onChange={(e) => setAsistenteForm((prev) => ({ ...prev, correo: e.target.value }))} maxLength={80} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label form-label-sm">Procedencia</label>
                  <input className="form-control form-control-sm" value={asistenteForm.procedencia} onChange={(e) => setAsistenteForm((prev) => ({ ...prev, procedencia: e.target.value }))} maxLength={60} />
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
                  {asistenteForm.estado_seguimiento === 'OTROS' ? (
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={seguimientoPersonalizado}
                      onChange={(e) => setSeguimientoPersonalizado(e.target.value)}
                      placeholder="Especifique el estado"
                      maxLength={30}
                    />
                  ) : (
                    <select className="form-select form-select-sm" value={asistenteForm.estado_seguimiento} onChange={(e) => {
                      setAsistenteForm((prev) => ({ ...prev, estado_seguimiento: e.target.value }));
                      setSeguimientoPersonalizado('');
                    }}>
                      {ESTADO_SEGUIMIENTO_OPCIONES.map((opcion) => (
                        <option key={opcion.valor} value={opcion.valor}>{opcion.etiqueta}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label form-label-sm">Dirección</label>
                  <input className="form-control form-control-sm" value={asistenteForm.direccion} onChange={(e) => setAsistenteForm((prev) => ({ ...prev, direccion: e.target.value }))} maxLength={120} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label form-label-sm">Barrio / comunidad</label>
                  <input className="form-control form-control-sm" value={asistenteForm.barrio_comunidad} onChange={(e) => setAsistenteForm((prev) => ({ ...prev, barrio_comunidad: e.target.value }))} maxLength={60} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label form-label-sm">Observaciones</label>
                  <input className="form-control form-control-sm" value={asistenteForm.observaciones} onChange={(e) => setAsistenteForm((prev) => ({ ...prev, observaciones: e.target.value }))} maxLength={150} />
                </div>
              </>
            )}

            <div className="col-12">
              <button type="button" className="btn btn-link btn-sm p-0 d-inline-flex align-items-center gap-1 text-muted" onClick={() => setMostrarMasAsistente(!mostrarMasAsistente)}>
                <i className={`bi ${mostrarMasAsistente ? 'bi-chevron-up' : 'bi-chevron-down'}`} aria-hidden="true"></i>
                <span>{mostrarMasAsistente ? 'Menos datos de la visita' : 'Más datos de la visita'}</span>
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ListaAsistentesTab({
  detalle,
  convertirAsistenteAEstudio,
  convirtiendoAsistenteId,
  onEliminar,
  entregarPremios,
  asistenteResaltadoId,
  setAsistenteResaltadoId
}) {
  const [busqueda, setBusqueda] = useState('');
  const [asistenteDetalle, setAsistenteDetalle] = useState(null);
  const [mostrarPremiosPendientes, setMostrarPremiosPendientes] = useState(false);
  const asistentes = detalle?.asistentes || [];
  const totalSesiones = detalle?.sesiones?.length || 0;

  const premiosPendientesLista = useMemo(() =>
    asistentes.filter(a => Number(a.total_premios_pendientes || 0) > 0),
    [asistentes]
  );
  const resaltadoCallbackRef = useCallback((node) => {
    if (node) {
      const celdas = node.querySelectorAll('td');
      // Fase 1: aparece suave
      celdas.forEach(td => {
        td.style.transition = 'background-color 0.4s ease-in';
        td.style.backgroundColor = '#fff3cd';
      });
      requestAnimationFrame(() => {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      // Fase 2: pulso sutil
      setTimeout(() => {
        celdas.forEach(td => {
          td.style.backgroundColor = '#ffecb5';
        });
      }, 800);
      setTimeout(() => {
        celdas.forEach(td => {
          td.style.backgroundColor = '#fff3cd';
        });
      }, 1400);
      // Fase 3: desvanece
      setTimeout(() => {
        celdas.forEach(td => {
          td.style.transition = 'background-color 1.2s ease-out';
          td.style.backgroundColor = '';
        });
      }, 2200);
      setTimeout(() => {
        celdas.forEach(td => {
          td.style.transition = '';
        });
        if (setAsistenteResaltadoId) setAsistenteResaltadoId(null);
      }, 3500);
    }
  }, [setAsistenteResaltadoId]);

  const asistentesFiltrados = asistentes.filter(a =>
    a.nombre_snapshot.toLowerCase().includes(busqueda.toLowerCase())
  );

  const tieneInfoAdicional = (item) => {
    return item.telefono_snapshot || item.contacto_telefono || item.contacto_correo
      || item.procedencia || item.clasificacion_etaria || item.contacto_direccion
      || item.contacto_barrio_comunidad || item.observaciones;
  };

  return (
    <>
      <div className="card shadow-sm campanas-section-card mb-3">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
            <label className="form-label form-label-sm mb-0">Buscar visita</label>
            <div className="d-flex align-items-center gap-2 campanas-visitas-toolbar-actions">
              {premiosPendientesLista.length > 0 && (
                <>
                  <button
                    type="button"
                    className="btn btn-outline-warning btn-sm d-inline-flex align-items-center gap-1 campanas-visitas-toolbar-btn"
                    onClick={() => setMostrarPremiosPendientes(true)}
                    title="Ver premios pendientes por dar"
                  >
                    <i className="bi bi-gift" aria-hidden="true"></i>
                    <span>{premiosPendientesLista.length}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1 campanas-visitas-toolbar-btn"
                    onClick={async () => {
                      const { jsPDF } = await import('jspdf');
                      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
                      const pw = doc.internal.pageSize.getWidth();
                      const m = 40;
                      let y = m;

                      doc.setFont('helvetica', 'bold');
                      doc.setFontSize(16);
                      doc.text('Premios pendientes por dar', m, y);
                      y += 20;

                      doc.setFont('helvetica', 'normal');
                      doc.setFontSize(11);
                      doc.setTextColor(100);
                      doc.text(`${detalle?.lema || 'Campaña'} — ${new Date().toLocaleDateString('es-CR')}`, m, y);
                      doc.setTextColor(0);
                      y += 24;

                      const colVisita = m;
                      const colPremios = pw - m - 60;
                      const rowH = 22;

                      doc.setFillColor(248, 249, 250);
                      doc.rect(m, y - 14, pw - m * 2, rowH, 'F');
                      doc.setFont('helvetica', 'bold');
                      doc.setFontSize(10);
                      doc.text('Visita', colVisita + 4, y);
                      doc.text('Premios', colPremios, y, { align: 'center' });
                      y += rowH - 4;

                      doc.setFont('helvetica', 'normal');
                      premiosPendientesLista.forEach((a) => {
                        if (y > doc.internal.pageSize.getHeight() - m) {
                          doc.addPage();
                          y = m;
                        }
                        doc.setDrawColor(220);
                        doc.line(m, y - 2, pw - m, y - 2);
                        doc.text(a.nombre_snapshot || '', colVisita + 4, y + 10);
                        doc.text(String(Number(a.total_premios_pendientes || 0)), colPremios, y + 10, { align: 'center' });
                        y += rowH;
                      });

                      doc.save(`premios_pendientes_${(detalle?.lema || 'campana').replace(/\s+/g, '_')}.pdf`);
                    }}
                    title="Exportar premios pendientes a PDF"
                  >
                    <i className="bi bi-file-earmark-pdf" aria-hidden="true"></i>
                  </button>
                </>
              )}
              <span className="badge bg-secondary campanas-visitas-total-badge">{asistentes.length} total</span>
            </div>
          </div>
          <SearchInput
            id="asistentes-busqueda"
            value={busqueda}
            onChange={setBusqueda}
            placeholder="Buscar por nombre"
          />
        </div>
      </div>

      <div className="card shadow-sm campanas-section-card">
        <div className="card-body p-0">
          <div className="tabla-registros-scroll campanas-detalle-table-scroll" style={{ overflowX: 'auto' }}>
            <table className="table table-striped table-hover align-middle mb-0 tabla-registros campanas-asistentes-table">
              <thead className="tabla-registros-thead">
                <tr>
                  <th>Nombre</th>
                  <th className="text-center">Puntualidad</th>
                  <th className="text-center">Premios</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {asistentesFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center text-muted py-4">
                      {asistentes.length === 0 ? 'No hay visitas registradas.' : 'No se encontraron resultados.'}
                    </td>
                  </tr>
                )}
                {asistentesFiltrados.map((item) => {
                  const pendientes = Number(item.total_premios_pendientes || 0);
                  const totalPremios = Number(item.total_premios || 0);
                  return (
                  <tr
                    key={item.id}
                    ref={item.id === asistenteResaltadoId ? resaltadoCallbackRef : null}
                  >
                    <td>
                      <div className="fw-semibold">{item.nombre_snapshot}</div>
                    </td>
                    <td className="text-center">
                      <small>{Number(item.total_puntuales || 0)} de {totalSesiones}</small>
                    </td>
                    <td className="text-center">
                      {pendientes > 0 ? (
                        <button
                          type="button"
                          className="btn btn-warning btn-sm py-0 px-2 d-inline-flex align-items-center gap-1"
                          onClick={() => entregarPremios(item.id)}
                          title="Marcar premio como entregado"
                        >
                          <i className="bi bi-gift" aria-hidden="true"></i>
                          <small>{pendientes}</small>
                        </button>
                      ) : totalPremios > 0 ? (
                        <span className="text-success small" title="Todos los premios entregados"><i className="bi bi-check-circle-fill" aria-hidden="true"></i></span>
                      ) : (
                        <span className="text-muted small">-</span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-1">
                        {tieneInfoAdicional(item) && (
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm rounded-circle d-inline-flex align-items-center justify-content-center registro-row-action-btn"
                            style={{ width: '34px', height: '34px' }}
                            onClick={() => setAsistenteDetalle(item)}
                            title="Ver detalle"
                            aria-label="Ver detalle de la visita"
                          >
                            <i className="bi bi-search" aria-hidden="true"></i>
                          </button>
                        )}
                        {item.tipo_asistente !== 'MIEMBRO' && item.estado_seguimiento !== 'ESTUDIO_BIBLICO' && (
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm rounded-circle d-inline-flex align-items-center justify-content-center registro-row-action-btn"
                            style={{ width: '34px', height: '34px' }}
                            onClick={() => convertirAsistenteAEstudio(item)}
                            disabled={convirtiendoAsistenteId === item.id}
                            title="Convertir a estudio bíblico"
                            aria-label="Convertir a estudio bíblico"
                          >
                            <i className="bi bi-journal-plus" aria-hidden="true"></i>
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm rounded-circle d-inline-flex align-items-center justify-content-center registro-row-action-btn"
                          style={{ width: '34px', height: '34px' }}
                          onClick={() => {
                            if (window.confirm(`¿Está seguro de eliminar a "${item.nombre_snapshot || item.nombre_completo || 'esta visita'}"?`)) {
                              onEliminar(item.id);
                            }
                          }}
                          title="Eliminar"
                          aria-label="Eliminar visita"
                        >
                          <i className="bi bi-trash" aria-hidden="true"></i>
                        </button>
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

      {mostrarPremiosPendientes && premiosPendientesLista.length > 0 && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }} onClick={() => setMostrarPremiosPendientes(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title"><i className="bi bi-gift me-2" aria-hidden="true"></i>Premios pendientes por dar</h6>
                <button type="button" className="btn-close" onClick={() => setMostrarPremiosPendientes(false)} aria-label="Cerrar"></button>
              </div>
              <div className="modal-body p-0">
                <table className="table table-sm align-middle mb-0">
                  <thead>
                    <tr>
                      <th className="ps-3">Visita</th>
                      <th className="text-center">Pendientes</th>
                      <th className="text-center pe-3">Entregar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {premiosPendientesLista.map((a) => (
                      <tr key={a.id}>
                        <td className="ps-3">{a.nombre_snapshot}</td>
                        <td className="text-center">{Number(a.total_premios_pendientes || 0)}</td>
                        <td className="text-center pe-3">
                          <button
                            type="button"
                            className="btn btn-warning btn-sm py-0 px-2 d-inline-flex align-items-center gap-1"
                            onClick={() => entregarPremios(a.id)}
                            title="Marcar como entregado"
                          >
                            <i className="bi bi-check-lg" aria-hidden="true"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setMostrarPremiosPendientes(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {asistenteDetalle && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }} onClick={() => setAsistenteDetalle(null)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">Detalle de la visita</h6>
                <button type="button" className="btn-close" onClick={() => setAsistenteDetalle(null)} aria-label="Cerrar"></button>
              </div>
              <div className="modal-body">
                <dl className="row mb-0">
                  <dt className="col-sm-5">Nombre</dt>
                  <dd className="col-sm-7">{asistenteDetalle.nombre_snapshot}</dd>

                  <dt className="col-sm-5">Tipo</dt>
                  <dd className="col-sm-7"><span className="badge text-bg-light border">{asistenteDetalle.tipo_asistente}</span></dd>

                  {(asistenteDetalle.telefono_snapshot || asistenteDetalle.contacto_telefono) && (<>
                    <dt className="col-sm-5">Teléfono</dt>
                    <dd className="col-sm-7">{asistenteDetalle.telefono_snapshot || asistenteDetalle.contacto_telefono}</dd>
                  </>)}

                  {asistenteDetalle.contacto_correo && (<>
                    <dt className="col-sm-5">Correo</dt>
                    <dd className="col-sm-7">{asistenteDetalle.contacto_correo}</dd>
                  </>)}

                  {asistenteDetalle.procedencia && (<>
                    <dt className="col-sm-5">Procedencia</dt>
                    <dd className="col-sm-7">{asistenteDetalle.procedencia}</dd>
                  </>)}

                  {asistenteDetalle.clasificacion_etaria && (<>
                    <dt className="col-sm-5">Clasificación etaria</dt>
                    <dd className="col-sm-7">{asistenteDetalle.clasificacion_etaria}</dd>
                  </>)}

                  {asistenteDetalle.contacto_direccion && (<>
                    <dt className="col-sm-5">Dirección</dt>
                    <dd className="col-sm-7">{asistenteDetalle.contacto_direccion}</dd>
                  </>)}

                  {asistenteDetalle.contacto_barrio_comunidad && (<>
                    <dt className="col-sm-5">Barrio / Comunidad</dt>
                    <dd className="col-sm-7">{asistenteDetalle.contacto_barrio_comunidad}</dd>
                  </>)}

                  {asistenteDetalle.estado_seguimiento && (<>
                    <dt className="col-sm-5">Seguimiento</dt>
                    <dd className="col-sm-7"><span className={`badge ${claseEstado(asistenteDetalle.estado_seguimiento)}`}>{asistenteDetalle.estado_seguimiento}</span></dd>
                  </>)}

                  <dt className="col-sm-5">Asistencia</dt>
                  <dd className="col-sm-7">{Number(asistenteDetalle.total_noches || 0).toLocaleString('es-CR')} noches · {Number(asistenteDetalle.total_puntuales || 0).toLocaleString('es-CR')} puntuales</dd>

                  {asistenteDetalle.observaciones && (<>
                    <dt className="col-sm-5">Observaciones</dt>
                    <dd className="col-sm-7">{asistenteDetalle.observaciones}</dd>
                  </>)}
                </dl>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setAsistenteDetalle(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function RegistrarDecisionTab({
  detalle,
  asistentesOpciones,
  decisionForm,
  setDecisionForm,
  guardarDecision
}) {
  const hoy = new Date().toLocaleDateString('en-CA');
  const estado = detalle?.estado;
  let puedeManejar = false;
  if (estado === 'ACTIVA') {
    puedeManejar = true;
  } else if (estado === 'FINALIZADA' && detalle?.fecha_fin) {
    const fechaLimite = new Date(detalle.fecha_fin + 'T00:00:00');
    fechaLimite.setDate(fechaLimite.getDate() + 7);
    puedeManejar = fechaLimite >= new Date(hoy + 'T00:00:00');
  }

  const clavesYaRegistradas = useMemo(() => {
    if (!decisionForm.campana_asistente_id) return new Set();
    const idSel = String(decisionForm.campana_asistente_id);
    return new Set(
      (detalle?.decisiones || [])
        .filter(d => String(d.campana_asistente_id) === idSel)
        .map(d => d.decision_clave)
    );
  }, [detalle?.decisiones, decisionForm.campana_asistente_id]);

  if (!puedeManejar) {
    return (
      <div className="alert alert-info py-2 small mb-3" role="alert">
        <i className="bi bi-info-circle me-2" aria-hidden="true"></i>
        {estado === 'POR_INICIAR'
          ? 'Las funciones de registro estarán disponibles cuando la campaña esté activa.'
          : 'Esta campaña ha finalizado. Solo se puede consultar su información.'}
      </div>
    );
  }

  return (
    <div className="card shadow-sm campanas-section-card">
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
              {DECISION_OPCIONES.map((opcion) => {
                const yaUsada = clavesYaRegistradas.has(opcion.clave);
                return (
                  <option key={opcion.clave} value={opcion.clave} disabled={yaUsada}>
                    {opcion.etiqueta}{yaUsada ? ' (ya registrada)' : ''}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="col-12 col-lg-4">
            <label className="form-label form-label-sm">Fecha y hora</label>
            <input type="datetime-local" className="form-control form-control-sm" value={decisionForm.fecha_decision} onChange={(e) => setDecisionForm((prev) => ({ ...prev, fecha_decision: e.target.value }))} />
          </div>
          <div className="col-12 col-lg-12">
            <label className="form-label form-label-sm">Observaciones</label>
            <input className="form-control form-control-sm" value={decisionForm.observaciones} onChange={(e) => setDecisionForm((prev) => ({ ...prev, observaciones: e.target.value }))} maxLength={60} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ListaDecisionesTab({
  detalle,
  onEliminar
}) {
  const [busqueda, setBusqueda] = useState('');
  const [obsModal, setObsModal] = useState(null);
  const decisiones = detalle?.decisiones || [];

  const decisionesFiltradas = decisiones.filter(d =>
    d.nombre_snapshot.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <>
      <div className="card shadow-sm campanas-section-card mb-3">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
            <label className="form-label form-label-sm mb-0">Buscar decisión</label>
            <span className="badge bg-secondary">{decisiones.length} total</span>
          </div>
          <SearchInput
            id="decisiones-busqueda"
            value={busqueda}
            onChange={setBusqueda}
            placeholder="Buscar por nombre"
          />
        </div>
      </div>

      <div className="card shadow-sm campanas-section-card">
        <div className="card-body p-0">
          <div className="tabla-registros-scroll campanas-detalle-table-scroll" style={{ overflowX: 'auto' }}>
            <table className="table table-striped table-hover align-middle mb-0 tabla-registros campanas-decisiones-table">
              <thead className="tabla-registros-thead">
                <tr>
                  <th>Persona</th>
                  <th>Decisión</th>
                  <th>Fecha</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {decisionesFiltradas.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center text-muted py-4">
                      {decisiones.length === 0 ? 'No hay decisiones registradas.' : 'No se encontraron resultados.'}
                    </td>
                  </tr>
                )}
                {decisionesFiltradas.map((item) => (
                  <tr key={item.id}>
                    <td>{item.nombre_snapshot}</td>
                    <td>
                      <div className="fw-semibold">{item.decision_etiqueta}</div>
                    </td>
                    <td><small>{formatearFechaHora(item.fecha_decision)}</small></td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-1">
                        {item.observaciones && (
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm rounded-circle d-inline-flex align-items-center justify-content-center registro-row-action-btn"
                            style={{ width: '34px', height: '34px' }}
                            onClick={() => setObsModal(item.observaciones)}
                            title="Ver observaciones"
                            aria-label="Ver observaciones"
                          >
                            <i className="bi bi-search" aria-hidden="true"></i>
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm rounded-circle d-inline-flex align-items-center justify-content-center registro-row-action-btn"
                          style={{ width: '34px', height: '34px' }}
                          onClick={() => onEliminar(item.id)}
                          title="Eliminar"
                          aria-label="Eliminar decisión"
                        >
                          <i className="bi bi-trash" aria-hidden="true"></i>
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

      {obsModal && (
        <div className="prompt-overlay-iasd" onClick={() => setObsModal(null)}>
          <div className="prompt-modal-iasd" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ paddingBottom: '1rem', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h5 className="mb-0">Observaciones</h5>
              <button type="button" className="btn-close" onClick={() => setObsModal(null)} aria-label="Cerrar"></button>
            </div>
            <div style={{ padding: '1rem 0', minHeight: '100px', maxHeight: '300px', overflowY: 'auto' }}>
              <p className="mb-0" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{obsModal}</p>
            </div>
            <div style={{ paddingTop: '1rem', borderTop: '1px solid #e0e0e0', textAlign: 'right' }}>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => setObsModal(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </>
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
            {detalleVista === 'RESUMEN' && <ResumenCampana detalle={detalle} setDetalleVista={setDetalleVista} setAsistenteResaltadoId={props.setAsistenteResaltadoId} />}
            {detalleVista === 'SESIONES' && <SesionesCampana {...props} />}
            {detalleVista === 'REG_ASISTENCIA' && <RegistrarAsistenciaTab {...props} />}
            {detalleVista === 'ASISTENTES' && <ListaAsistentesTab detalle={detalle} convertirAsistenteAEstudio={props.convertirAsistenteAEstudio} convirtiendoAsistenteId={props.convirtiendoAsistenteId} onEliminar={props.eliminarAsistente} entregarPremios={props.entregarPremios} asistenteResaltadoId={props.asistenteResaltadoId} setAsistenteResaltadoId={props.setAsistenteResaltadoId} />}
            {detalleVista === 'REG_DECISION' && <RegistrarDecisionTab {...props} />}
            {detalleVista === 'DECISIONES' && <ListaDecisionesTab detalle={detalle} onEliminar={props.eliminarDecision} />}
          </>
        )}
      </div>
    </div>
  );
}

export default function CampanasPage() {
  const [mostrarExtraCampana, setMostrarExtraCampana] = useState(false);
  const [mostrarModalCampana, setMostrarModalCampana] = useState(false);
  const [mostrarDetalleModal, setMostrarDetalleModal] = useState(false);
  const [mostrarSelectorModal, setMostrarSelectorModal] = useState(false);
  const [seccionActiva, setSeccionActiva] = useState('CAMPANAS');
  const [campanaResaltadaId, setCampanaResaltadaId] = useState(null);
  const [asistenteResaltadoId, setAsistenteResaltadoId] = useState(null);
  const [filtroAnio, setFiltroAnio] = useState('');
  const [filtroTrimestre, setFiltroTrimestre] = useState('');
  const [campanaInfoModal, setCampanaInfoModal] = useState(null);

  const notificarVistaActiva = useCallback((vista) => {
    window.dispatchEvent(new CustomEvent(EVENT_CAMPANAS_VISTA_ACTIVA, {
      detail: { vista }
    }));
  }, []);

  useEffect(() => {
    const vistaTopbar = mostrarModalCampana
      ? 'NUEVA'
      : (mostrarSelectorModal || mostrarDetalleModal ? 'VER_CAMPANA' : seccionActiva);
    notificarVistaActiva(vistaTopbar);
  }, [mostrarModalCampana, mostrarSelectorModal, mostrarDetalleModal, seccionActiva, notificarVistaActiva]);

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
    editandoSesionId,
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
    editarSesion,
    resetSesionForm,
    guardarCampana,
    eliminarCampana,
    guardarSesion,
    guardarAsistente,
    eliminarAsistente,
    entregarPremios,
    guardarAsistencia,
    guardarDecision,
    eliminarDecision,
    convertirAsistenteAEstudio,
    recargar
  } = useCampanas();

  useEffect(() => {
    const manejarAbrirNuevaCampana = () => {
      setSeccionActiva('CAMPANAS');
      setMostrarSelectorModal(false);
      setMostrarDetalleModal(false);
      setMostrarModalCampana(true);
      resetCampanaForm();
    };

    window.addEventListener(EVENT_CAMPANAS_ABRIR_NUEVA, manejarAbrirNuevaCampana);
    return () => {
      window.removeEventListener(EVENT_CAMPANAS_ABRIR_NUEVA, manejarAbrirNuevaCampana);
    };
  }, [resetCampanaForm]);

  useEffect(() => {
    const manejarAbrirLista = () => {
      setSeccionActiva('CAMPANAS');
      setMostrarModalCampana(false);
      setMostrarSelectorModal(false);
      setMostrarDetalleModal(false);
      setMostrarExtraCampana(false);
    };

    window.addEventListener(EVENT_CAMPANAS_ABRIR_LISTA, manejarAbrirLista);
    return () => {
      window.removeEventListener(EVENT_CAMPANAS_ABRIR_LISTA, manejarAbrirLista);
    };
  }, []);

  useEffect(() => {
    const manejarAbrirSelector = () => {
      setSeccionActiva('CAMPANAS');
      setMostrarModalCampana(false);
      setMostrarSelectorModal(true);
    };

    window.addEventListener(EVENT_CAMPANAS_ABRIR_SELECTOR, manejarAbrirSelector);
    return () => {
      window.removeEventListener(EVENT_CAMPANAS_ABRIR_SELECTOR, manejarAbrirSelector);
    };
  }, []);

  useEffect(() => {
    const manejarAbrirVisitas = () => {
      setSeccionActiva('VISITAS');
      setMostrarModalCampana(false);
      setMostrarSelectorModal(false);
      setMostrarDetalleModal(false);
    };

    window.addEventListener(EVENT_CAMPANAS_ABRIR_VISITAS, manejarAbrirVisitas);
    return () => {
      window.removeEventListener(EVENT_CAMPANAS_ABRIR_VISITAS, manejarAbrirVisitas);
    };
  }, []);

  const guardarAsistenciaConResaltado = useCallback(async () => {
    const resultado = await guardarAsistencia();
    if (resultado?.teniaPremio && resultado?.asistenteId) {
      setAsistenteResaltadoId(Number(resultado.asistenteId));
      setDetalleVista('ASISTENTES');
    }
  }, [guardarAsistencia, setDetalleVista]);

  const cerrarModalCampana = () => {
    setMostrarModalCampana(false);
    resetCampanaForm();
    setMostrarExtraCampana(false);
  };

  const cerrarDetalleConLimpieza = () => {
    setMostrarDetalleModal(false);
    resetSesionForm();
    resetCampanaForm();
    setAsistenteForm((prev) => ({
      ...prev,
      nombre_completo: '',
      tipo_asistente: 'VISITA',
      telefono: '',
      correo: '',
      procedencia: '',
      clasificacion_etaria: '',
      estado_seguimiento: 'PENDIENTE',
      direccion: '',
      barrio_comunidad: '',
      observaciones: ''
    }));
    setAsistenciaForm((prev) => ({
      ...prev,
      sesion_id: '',
      campana_asistente_id: '',
      hora_llegada: '',
      puntual: false,
      elegible_premio: false
    }));
    setDecisionForm((prev) => ({
      ...prev,
      campana_asistente_id: '',
      tipo_decision: '',
      observaciones: ''
    }));
    setDetalleVista('RESUMEN');
  };

  const guardarAsistenteConValidacion = async () => {
    if (!asistenteForm?.nombre_completo?.trim?.()) {
      notificarError('El nombre de la visita es obligatorio.');
      return;
    }
    if (!asistenteForm?.tipo_asistente?.trim?.()) {
      notificarError('El tipo de visita es obligatorio.');
      return;
    }
    // Si el seguimiento es OTROS, agregar el valor personalizado a las observaciones
    if (asistenteForm.estado_seguimiento === 'OTROS' && seguimientoPersonalizado.trim()) {
      setAsistenteForm((prev) => ({
        ...prev,
        observaciones: prev.observaciones
          ? `${prev.observaciones} | Seguimiento: ${seguimientoPersonalizado}`
          : `Seguimiento: ${seguimientoPersonalizado}`
      }));
    }
    await guardarAsistente();
  };

  const guardarYCerrarCampana = async () => {
    const idGuardado = await guardarCampana();
    setMostrarModalCampana(false);
    if (idGuardado) {
      setCampanaResaltadaId(idGuardado);
      setTimeout(() => setCampanaResaltadaId(null), 2500);
    }
  };

  return (
    <div className="container-fluid py-3 py-lg-4">
      {seccionActiva === 'VISITAS' && (
        <VisitasGeneralView
          campanas={campanas}
        />
      )}
      {seccionActiva === 'CAMPANAS' && (
      <>
      <div className="row g-3 mb-3 campanas-top-row">
        <div className="col-12">
          <div className="card shadow-sm h-100 campanas-filtros-card">
            <div className="card-body" style={{ overflow: 'visible' }}>
              <div className="row g-2 align-items-end">
                <div className="col-12 col-lg-5">
                  <SearchInput
                    id="campanas-busqueda"
                    value={filtros.q}
                    onChange={(valor) => cambiarFiltro('q', valor)}
                    placeholder="Buscar por nombre, lema o predicador"
                  />
                </div>
                <div className="col-12 col-sm-6 col-lg-3">
                  <label className="form-label form-label-sm">Estado</label>
                  <select className="form-select form-select-sm" style={{ minHeight: 38 }} value={filtros.estado} onChange={(e) => cambiarFiltro('estado', e.target.value)}>
                    {ESTADO_CAMPANA_OPCIONES.map((opcion) => (
                      <option key={opcion.valor || 'todos'} value={opcion.valor}>{opcion.etiqueta}</option>
                    ))}
                  </select>
                </div>
                <div className="col-6 col-sm-3 col-lg-2">
                  <label className="form-label form-label-sm">Año</label>
                  <select className="form-select form-select-sm" style={{ minHeight: 38 }} value={filtroAnio} onChange={(e) => {
                    const nuevoAnio = e.target.value;
                    setFiltroAnio(nuevoAnio);
                    if (!nuevoAnio) setFiltroTrimestre('');
                    const { fecha_desde, fecha_hasta } = calcularFechasDeFiltro(nuevoAnio, nuevoAnio ? filtroTrimestre : '');
                    cambiarFiltro('fecha_desde', fecha_desde);
                    cambiarFiltro('fecha_hasta', fecha_hasta);
                  }}>
                    {ANIO_OPCIONES.map((opcion) => (
                      <option key={opcion.valor || 'todos'} value={opcion.valor}>{opcion.etiqueta}</option>
                    ))}
                  </select>
                </div>
                <div className="col-6 col-sm-3 col-lg-2">
                  <label className="form-label form-label-sm">Trimestre</label>
                  <select className="form-select form-select-sm" style={{ minHeight: 38 }} value={filtroTrimestre} disabled={!filtroAnio} onChange={(e) => {
                    const nuevoTrimestre = e.target.value;
                    setFiltroTrimestre(nuevoTrimestre);
                    const { fecha_desde, fecha_hasta } = calcularFechasDeFiltro(filtroAnio, nuevoTrimestre);
                    cambiarFiltro('fecha_desde', fecha_desde);
                    cambiarFiltro('fecha_hasta', fecha_hasta);
                  }}>
                    {TRIMESTRE_OPCIONES.map((opcion) => (
                      <option key={opcion.valor || 'todos'} value={opcion.valor}>{opcion.etiqueta}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card shadow-sm campanas-lista-card">
            <div className="card-body p-0">
              <div className="tabla-registros-scroll" style={{ maxHeight: 'clamp(300px, 44vh, 390px)', overflowX: 'auto' }}>
                  <table className="table table-striped table-hover align-middle mb-0 tabla-registros">
                    <thead className="tabla-registros-thead">
                      <tr>
                        <th>Campaña</th>
                        <th>Estado</th>
                        <th>Predicador</th>
                        <th>Responsable</th>
                        <th>Hora</th>
                        <th>Días</th>
                        <th className="text-center">Visitas</th>
                        <th className="text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!cargando && campanas.length === 0 && (
                        <tr>
                          <td colSpan="8" className="text-center text-muted py-4">No hay campañas registradas todavía.</td>
                        </tr>
                      )}
                      {campanas.map((item) => {
                        const tieneInfo = item.tipo || item.descripcion || item.observaciones;
                        return (
                        <tr key={item.id} className={`${seleccionadaId === item.id ? 'table-active' : ''} ${campanaResaltadaId === item.id ? 'campana-resaltada' : ''}`} style={{ cursor: 'pointer' }} onClick={() => { setSeleccionadaId(item.id); setMostrarDetalleModal(true); }}>
                          <td>
                            <div className="fw-semibold">{item.lema}</div>
                            <div className="small text-muted">{formatearFecha(item.fecha_inicio)} al {formatearFecha(item.fecha_fin)}</div>
                          </td>
                          <td><span className={`badge ${claseEstado(item.estado)}`}>{etiquetaEstado(item.estado)}</span></td>
                          <td><span className="small">{item.predicador || '-'}</span></td>
                          <td><span className="small">{item.responsable || '-'}</span></td>
                          <td><span className="small">{formatearHora(item.hora)}</span></td>
                          <td>{Number(item.total_sesiones || 0).toLocaleString('es-CR')}</td>
                          <td className="text-center">{Number(item.total_asistentes || 0).toLocaleString('es-CR')}</td>
                          <td className="text-end">
                            <div className="d-inline-flex gap-2">
                              {tieneInfo && (
                                <button type="button" className="btn btn-outline-secondary btn-sm rounded-circle d-inline-flex align-items-center justify-content-center registro-row-action-btn" style={{ width: '34px', height: '34px' }} onClick={(e) => { e.stopPropagation(); setCampanaInfoModal(item); }} title="Ver detalles" aria-label="Ver detalles de campaña">
                                  <i className="bi bi-search" aria-hidden="true"></i>
                                </button>
                              )}
                              {(() => {
                                const hoy = new Date().toLocaleDateString('en-CA');
                                if (item.fecha_fin && hoy > item.fecha_fin) return null;
                                return (
                                  <button type="button" className="btn btn-outline-primary btn-sm rounded-circle d-inline-flex align-items-center justify-content-center registro-row-action-btn" style={{ width: '34px', height: '34px' }} onClick={(e) => { e.stopPropagation(); editarCampana(item); setMostrarModalCampana(true); }} title="Editar" aria-label="Editar campaña">
                                    <i className="bi bi-pencil-square" aria-hidden="true"></i>
                                  </button>
                                );
                              })()}
                              <button type="button" className="btn btn-outline-danger btn-sm rounded-circle d-inline-flex align-items-center justify-content-center registro-row-action-btn" style={{ width: '34px', height: '34px' }} onClick={(e) => { e.stopPropagation(); eliminarCampana(item.id); }} title="Eliminar" aria-label="Eliminar campaña">
                                <i className="bi bi-trash" aria-hidden="true"></i>
                              </button>
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
        </div>
      </div>

      <div className="row g-3 mt-1">
        <div className="col"><KpiCard label="Campañas" value={dashboard.total_campanas} icon="bi-megaphone" /></div>
        <div className="col"><KpiCard label="Visitas" value={dashboard.total_visitas_unicas} icon="bi-person-plus" /></div>
        <div className="col"><KpiCard label="Bautismos" value={dashboard.total_bautismos_relacionados} icon="bi-droplet" /></div>
        <div className="col"><KpiCard label="Estudios Bíblicos" value={dashboard.total_estudios_derivados} icon="bi-book" /></div>
      </div>

      {campanaInfoModal && (
        <div className="prompt-overlay-iasd" onClick={() => setCampanaInfoModal(null)}>
          <div className="prompt-modal-iasd" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ paddingBottom: '1rem', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h5 className="mb-0">Detalles de la campaña</h5>
              <button type="button" className="btn-close" onClick={() => setCampanaInfoModal(null)} aria-label="Cerrar"></button>
            </div>
            <div style={{ padding: '1rem 0', minHeight: '100px', maxHeight: '350px', overflowY: 'auto' }}>
              {campanaInfoModal.tipo && (
                <div className="mb-3">
                  <div className="small text-muted">Tipo</div>
                  <div>{etiquetaTipoCampana(campanaInfoModal.tipo)}</div>
                </div>
              )}
              {campanaInfoModal.descripcion && (
                <div className="mb-3">
                  <div className="small text-muted">Descripción</div>
                  <div style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{campanaInfoModal.descripcion}</div>
                </div>
              )}
              {campanaInfoModal.observaciones && (
                <div className="mb-0">
                  <div className="small text-muted">Observaciones</div>
                  <div style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{campanaInfoModal.observaciones}</div>
                </div>
              )}
            </div>
            <div style={{ paddingTop: '1rem', borderTop: '1px solid #e0e0e0', textAlign: 'right' }}>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => setCampanaInfoModal(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
      </>
      )}

      <CampanaFormModal
        mostrar={mostrarModalCampana}
        onCerrar={cerrarModalCampana}
        editandoId={editandoCampanaId}
        form={campanaForm}
        setForm={setCampanaForm}
        onGuardar={guardarYCerrarCampana}
        guardando={guardando}
        mostrarExtra={mostrarExtraCampana}
        setMostrarExtra={setMostrarExtraCampana}
      />

      <CampanaSelectorModal
        mostrar={mostrarSelectorModal}
        campanas={campanas}
        onCerrar={() => setMostrarSelectorModal(false)}
        onSeleccionar={(id) => {
          setSeleccionadaId(id);
          setMostrarSelectorModal(false);
          setMostrarDetalleModal(true);
        }}
      />

      <CampanaDetalleModal
        mostrar={mostrarDetalleModal}
        onCerrar={() => setMostrarDetalleModal(false)}
        onCerrarConLimpieza={cerrarDetalleConLimpieza}
        detalle={detalle}
        cargandoDetalle={cargandoDetalle}
        detalleVista={detalleVista}
        setDetalleVista={setDetalleVista}
        resumenComponent={
          <ResumenCampana detalle={detalle} setDetalleVista={setDetalleVista} setAsistenteResaltadoId={setAsistenteResaltadoId} />
        }
        sesionesComponent={
          <SesionesCampana
            detalle={detalle}
            sesionForm={sesionForm}
            setSesionForm={setSesionForm}
            guardarSesion={guardarSesion}
            editandoSesionId={editandoSesionId}
            editarSesion={editarSesion}
            resetSesionForm={resetSesionForm}
          />
        }
        regAsistenciaComponent={
          <RegistrarAsistenciaTab
            detalle={detalle}
            detalleVista={detalleVista}
            asistentesOpciones={asistentesOpciones}
            sesionesOpciones={sesionesOpciones}
            asistenteForm={asistenteForm}
            setAsistenteForm={setAsistenteForm}
            asistenciaForm={asistenciaForm}
            setAsistenciaForm={setAsistenciaForm}
            guardarAsistencia={guardarAsistenciaConResaltado}
            guardarAsistenteConValidacion={guardarAsistenteConValidacion}
          />
        }
        asistentesComponent={
          <ListaAsistentesTab
            detalle={detalle}
            convertirAsistenteAEstudio={convertirAsistenteAEstudio}
            convirtiendoAsistenteId={convirtiendoAsistenteId}
            onEliminar={eliminarAsistente}
            entregarPremios={entregarPremios}
            asistenteResaltadoId={asistenteResaltadoId}
            setAsistenteResaltadoId={setAsistenteResaltadoId}
          />
        }
        regDecisionComponent={
          <RegistrarDecisionTab
            detalle={detalle}
            asistentesOpciones={asistentesOpciones}
            decisionForm={decisionForm}
            setDecisionForm={setDecisionForm}
            guardarDecision={guardarDecision}
          />
        }
        decisionesComponent={
          <ListaDecisionesTab detalle={detalle} onEliminar={eliminarDecision} />
        }
      />
    </div>
  );
}
