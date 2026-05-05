import { useEffect, useMemo, useState } from 'react';

const formatearFecha = (valor) => {
  if (!valor) return '';
  const date = new Date(valor + 'T00:00:00');
  return date.toLocaleDateString('es-CR', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const etiquetaTipoCampana = (tipo) => {
  const tipos = {
    SEMANA_EVANGELISTICA: 'Semana evangelística',
    CAMPANA_2_SEMANAS: 'Campaña 2 semanas',
    OTRO: 'Otro'
  };
  return tipos[tipo] || tipo;
};

const etiquetaEstado = (estado) => {
  const etiquetas = {
    'ACTIVA': 'Activa',
    'POR_INICIAR': 'Por iniciar',
    'FINALIZADA': 'Finalizada'
  };
  return etiquetas[estado] || estado;
};

const claseEstado = (estado) => {
  const clases = {
    'ACTIVA': 'bg-success-subtle text-success-emphasis border-success-subtle',
    'POR_INICIAR': 'bg-warning-subtle text-warning-emphasis border-warning-subtle',
    'FINALIZADA': 'bg-primary-subtle text-primary-emphasis border-primary-subtle'
  };
  return clases[estado] || 'bg-light text-dark border';
};

export default function CampanaSelectorModal({ mostrar, campanas, onCerrar, onSeleccionar }) {
  const [busqueda, setBusqueda] = useState('');
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const [filtroAnio, setFiltroAnio] = useState('');
  const [filtroMes, setFiltroMes] = useState('');
  const [filtroDesdeFecha, setFiltroDesdeFecha] = useState('');
  const [filtroHastaFecha, setFiltroHastaFecha] = useState('');

  const anios = useMemo(() => {
    const unique = new Set(campanas.map(c => c.fecha_inicio?.substring(0, 4)).filter(Boolean));
    return Array.from(unique).sort((a, b) => b - a);
  }, [campanas]);

  const campanasFiltradasPorBusqueda = useMemo(() => {
    if (!busqueda.trim()) return campanas;
    const q = busqueda.toLowerCase();
    return campanas.filter(c => c.lema?.toLowerCase().includes(q));
  }, [campanas, busqueda]);

  const campanasFinal = useMemo(() => {
    let resultado = campanasFiltradasPorBusqueda;

    if (filtroAnio) {
      resultado = resultado.filter(c => c.fecha_inicio?.startsWith(filtroAnio));
    }

    if (filtroMes) {
      resultado = resultado.filter(c => c.fecha_inicio?.startsWith(filtroAnio + '-' + filtroMes));
    }

    if (filtroDesdeFecha) {
      resultado = resultado.filter(c => c.fecha_inicio >= filtroDesdeFecha);
    }

    if (filtroHastaFecha) {
      resultado = resultado.filter(c => c.fecha_fin <= filtroHastaFecha);
    }

    return resultado;
  }, [campanasFiltradasPorBusqueda, filtroAnio, filtroMes, filtroDesdeFecha, filtroHastaFecha]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && mostrar) {
        onCerrar();
      }
    };

    if (mostrar) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [mostrar, onCerrar]);

  useEffect(() => {
    if (!mostrar) {
      setBusqueda('');
      setMostrarOpciones(false);
      setFiltroAnio('');
      setFiltroMes('');
      setFiltroDesdeFecha('');
      setFiltroHastaFecha('');
    }
  }, [mostrar]);

  if (!mostrar) return null;

  return (
    <div className="prompt-overlay-iasd">
      <div className="prompt-modal-iasd" style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ paddingBottom: '1rem', borderBottom: '1px solid #e0e0e0' }}>
          <h5 className="mb-3" style={{ color: 'var(--iasd-azul)' }}>Seleccionar campaña</h5>
          <label className="form-label form-label-sm">Buscar por lema</label>
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Escribe el lema o tema..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          {mostrarOpciones && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label form-label-sm">Año</label>
                  <select
                    className="form-select form-select-sm"
                    value={filtroAnio}
                    onChange={(e) => { setFiltroAnio(e.target.value); setFiltroMes(''); }}
                  >
                    <option value="">Todos</option>
                    {anios.map((anio) => (
                      <option key={anio} value={anio}>
                        {anio}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label form-label-sm">Mes</label>
                  <select
                    className="form-select form-select-sm"
                    value={filtroMes}
                    disabled={!filtroAnio}
                    onChange={(e) => setFiltroMes(e.target.value)}
                  >
                    <option value="">Todos</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((mes) => (
                      <option key={mes} value={String(mes).padStart(2, '0')}>
                        {String(mes).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label form-label-sm">Desde</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={filtroDesdeFecha}
                    onChange={(e) => setFiltroDesdeFecha(e.target.value)}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label form-label-sm">Hasta</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={filtroHastaFecha}
                    onChange={(e) => setFiltroHastaFecha(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            className="btn btn-link btn-sm p-0 d-inline-flex align-items-center gap-1 text-muted mt-2"
            onClick={() => setMostrarOpciones(!mostrarOpciones)}
          >
            <i
              className={`bi ${mostrarOpciones ? 'bi-chevron-up' : 'bi-chevron-down'}`}
              aria-hidden="true"
            ></i>
            <span>{mostrarOpciones ? 'Ocultar' : 'Opciones adicionales'}</span>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', marginTop: '1rem' }}>
          {campanasFinal.length === 0 ? (
            <div className="text-center text-muted py-4">
              <p>No hay campañas que coincidan con los filtros</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {campanasFinal.map((campana) => (
                <div
                  key={campana.id}
                  onClick={() => {
                    onSeleccionar(campana.id);
                  }}
                  style={{
                    padding: '0.75rem 1rem',
                    border: '1px solid #ddd',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backgroundColor: '#fff'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                    e.currentTarget.style.borderColor = '#999';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff';
                    e.currentTarget.style.borderColor = '#ddd';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                        {campana.lema}
                      </p>
                      <small style={{ color: '#666', display: 'block' }}>
                        {formatearFecha(campana.fecha_inicio)} - {formatearFecha(campana.fecha_fin)}
                      </small>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <span
                        className={`badge ${claseEstado(campana.estado)}`}
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                      >
                        {etiquetaEstado(campana.estado)}
                      </span>
                      <span
                        className="badge bg-secondary-subtle text-secondary-emphasis border-secondary-subtle"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                      >
                        {etiquetaTipoCampana(campana.tipo)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ paddingTop: '1rem', borderTop: '1px solid #e0e0e0', textAlign: 'right' }}>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={onCerrar}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
