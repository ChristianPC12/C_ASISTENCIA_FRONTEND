import { useMemo, useState } from 'react';

const ESTADO_OPCIONES = [
  { valor: '', etiqueta: 'Todos los estados' },
  { valor: 'POR_INICIAR', etiqueta: 'Por iniciar' },
  { valor: 'ACTIVA', etiqueta: 'Activa' },
  { valor: 'FINALIZADA', etiqueta: 'Finalizada' }
];

const TRIMESTRE_OPCIONES = [
  { valor: '', etiqueta: 'Todos los trimestres' },
  { valor: 'T1', etiqueta: 'T1 (Ene–Mar)' },
  { valor: 'T2', etiqueta: 'T2 (Abr–Jun)' },
  { valor: 'T3', etiqueta: 'T3 (Jul–Sep)' },
  { valor: 'T4', etiqueta: 'T4 (Oct–Dic)' }
];

const trimestreDeFecha = (fechaStr) => {
  if (!fechaStr) return '';
  const m = parseInt(fechaStr.substring(5, 7), 10);
  if (m <= 3) return 'T1';
  if (m <= 6) return 'T2';
  if (m <= 9) return 'T3';
  return 'T4';
};

export default function CampanaFiltroModal({ mostrar, campanas = [], campanaIdSeleccionada, onCerrar, onSeleccionar, onLimpiar, onSeleccionarSueltas }) {
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('');
  const [anio, setAnio] = useState('');
  const [trimestre, setTrimestre] = useState('');

  const anios = useMemo(() => {
    const set = new Set(campanas.map(c => c.fecha_inicio?.substring(0, 4)).filter(Boolean));
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [campanas]);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return campanas.filter(c => {
      if (estado && c.estado !== estado) return false;
      if (anio && !c.fecha_inicio?.startsWith(anio)) return false;
      if (trimestre && trimestreDeFecha(c.fecha_inicio) !== trimestre) return false;
      if (q) {
        const enLema = c.lema?.toLowerCase().includes(q);
        const enPredicador = c.predicador?.toLowerCase().includes(q);
        if (!enLema && !enPredicador) return false;
      }
      return true;
    });
  }, [campanas, busqueda, estado, anio, trimestre]);

  if (!mostrar) return null;

  return (
    <div className="prompt-overlay-iasd" onClick={onCerrar}>
      <div className="prompt-modal-iasd" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px', width: '95%', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h5 className="mb-0" style={{ color: 'var(--iasd-azul)' }}>
            <i className="bi bi-funnel me-2" aria-hidden="true"></i>
            Filtrar por campaña
          </h5>
          <button type="button" className="btn-close" onClick={onCerrar} aria-label="Cerrar"></button>
        </div>

        <div style={{ padding: '0.75rem 0 0.5rem 0', borderBottom: '1px solid #f0f0f0' }}>
          <div className="row g-2">
            <div className="col-12">
              <label className="form-label form-label-sm">Buscar por nombre, lema o predicador</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Escriba para filtrar..."
              />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label form-label-sm">Estado</label>
              <select className="form-select form-select-sm" value={estado} onChange={(e) => setEstado(e.target.value)}>
                {ESTADO_OPCIONES.map(o => <option key={o.valor || 'todos'} value={o.valor}>{o.etiqueta}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-4">
              <label className="form-label form-label-sm">Año</label>
              <select className="form-select form-select-sm" value={anio} onChange={(e) => { setAnio(e.target.value); if (!e.target.value) setTrimestre(''); }}>
                <option value="">Todos los años</option>
                {anios.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-4">
              <label className="form-label form-label-sm">Trimestre</label>
              <select className="form-select form-select-sm" value={trimestre} onChange={(e) => setTrimestre(e.target.value)} disabled={!anio}>
                {TRIMESTRE_OPCIONES.map(o => <option key={o.valor || 'todos'} value={o.valor}>{o.etiqueta}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={{ padding: '0.75rem 0', flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="small text-muted">{filtradas.length} campaña{filtradas.length === 1 ? '' : 's'} coinciden</span>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onSeleccionarSueltas}>
                Solo visitas sin campaña
              </button>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onLimpiar}>
                Quitar filtro
              </button>
            </div>
          </div>
          {filtradas.length === 0 ? (
            <div className="text-center text-muted py-3">No hay campañas con esos filtros.</div>
          ) : (
            <ul className="list-group">
              {filtradas.map(c => (
                <li
                  key={c.id}
                  className={`list-group-item list-group-item-action ${String(campanaIdSeleccionada) === String(c.id) ? 'active' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSeleccionar(c)}
                >
                  <div className="d-flex justify-content-between gap-2 flex-wrap">
                    <div>
                      <div className="fw-semibold">{c.lema}</div>
                      <div className="small text-muted">
                        {c.fecha_inicio} a {c.fecha_fin}
                        {c.predicador ? ` · ${c.predicador}` : ''}
                      </div>
                    </div>
                    <span className="badge bg-light text-dark border align-self-start">{c.estado}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #e0e0e0', textAlign: 'right' }}>
          <button className="btn btn-outline-secondary btn-sm" onClick={onCerrar}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
