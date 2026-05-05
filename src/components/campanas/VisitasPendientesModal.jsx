const formatearFecha = (valor) => {
  if (!valor) return '';
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-CR', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

export default function VisitasPendientesModal({ mostrar, items = [], onCerrar, onMarcarContactado, marcandoId }) {
  if (!mostrar) return null;

  return (
    <div className="prompt-overlay-iasd" onClick={onCerrar}>
      <div className="prompt-modal-iasd" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', width: '95%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h5 className="mb-0" style={{ color: 'var(--iasd-azul)' }}>
            <i className="bi bi-telephone me-2" aria-hidden="true"></i>
            Visitas pendientes de contactar
          </h5>
          <button type="button" className="btn-close" onClick={onCerrar} aria-label="Cerrar"></button>
        </div>

        <div style={{ padding: '1rem 0', flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {items.length === 0 ? (
            <div className="text-center text-muted py-3">
              No hay visitas pendientes de contactar.
            </div>
          ) : (
            <ul className="list-group">
              {items.map((v) => (
                <li key={v.id} className="list-group-item d-flex justify-content-between align-items-start gap-2 flex-wrap">
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="fw-semibold">{v.nombre_snapshot}</div>
                    <div className="small text-muted">
                      {v.telefono_snapshot ? (
                        <span><i className="bi bi-telephone-fill me-1" aria-hidden="true"></i>{v.telefono_snapshot}</span>
                      ) : (
                        <span className="fst-italic">Sin teléfono</span>
                      )}
                    </div>
                    <div className="small text-muted mt-1">
                      <i className="bi bi-calendar-event me-1" aria-hidden="true"></i>
                      Registrada: {formatearFecha(v.creado_en) || 'sin fecha'}
                    </div>
                    {v.campana_lema && (
                      <div className="small text-muted mt-1">
                        <i className="bi bi-megaphone me-1" aria-hidden="true"></i>{v.campana_lema}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-success btn-sm d-inline-flex align-items-center gap-1"
                    onClick={() => onMarcarContactado(v)}
                    disabled={marcandoId === v.id}
                    title="Marcar como contactado"
                  >
                    <i className="bi bi-check2-circle" aria-hidden="true"></i>
                    <span>{marcandoId === v.id ? 'Guardando...' : 'Contactado'}</span>
                  </button>
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
