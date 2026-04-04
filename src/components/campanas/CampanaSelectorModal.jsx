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

const claseEstado = (estado) => {
  const clases = {
    'ACTIVA': 'bg-success-subtle text-success-emphasis border-success-subtle',
    'BORRADOR': 'bg-warning-subtle text-warning-emphasis border-warning-subtle',
    'FINALIZADA': 'bg-primary-subtle text-primary-emphasis border-primary-subtle',
    'ARCHIVADA': 'bg-secondary-subtle text-secondary-emphasis border-secondary-subtle'
  };
  return clases[estado] || 'bg-light text-dark border';
};

export default function CampanaSelectorModal({ mostrar, campanas, onCerrar, onSeleccionar }) {
  const [filtroAnio, setFiltroAnio] = useState('');

  const anios = useMemo(() => {
    const unique = new Set(campanas.map(c => c.fecha_inicio?.substring(0, 4)).filter(Boolean));
    return Array.from(unique).sort((a, b) => b - a);
  }, [campanas]);

  const campanasFiltradasPorAnio = useMemo(() => {
    if (!filtroAnio) return campanas;
    return campanas.filter(c => c.fecha_inicio?.startsWith(filtroAnio));
  }, [campanas, filtroAnio]);

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
    if (mostrar && anios.length > 0 && !filtroAnio) {
      setFiltroAnio(anios[0]);
    }
  }, [mostrar, anios, filtroAnio]);

  if (!mostrar) return null;

  return (
    <div className="prompt-overlay-iasd">
      <div className="prompt-modal-iasd" style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ paddingBottom: '1rem', borderBottom: '1px solid #e0e0e0' }}>
          <h5 className="mb-3">Seleccionar campaña</h5>
          <label className="form-label form-label-sm">Año</label>
          <select
            className="form-select form-select-sm"
            value={filtroAnio}
            onChange={(e) => setFiltroAnio(e.target.value)}
          >
            <option value="">-- Todos los años --</option>
            {anios.map((anio) => (
              <option key={anio} value={anio}>
                {anio}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', marginTop: '1rem' }}>
          {campanasFiltradasPorAnio.length === 0 ? (
            <div className="text-center text-muted py-4">
              <p>No hay campañas para el año seleccionado</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {campanasFiltradasPorAnio.map((campana) => (
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
                        {campana.estado}
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
            className="btn btn-secondary btn-sm"
            onClick={onCerrar}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
