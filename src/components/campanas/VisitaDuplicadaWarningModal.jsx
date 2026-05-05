import { useState } from 'react';

const formatearFecha = (valor) => {
  if (!valor) return '';
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-CR', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const SEGUIMIENTO_LABEL = {
  PENDIENTE: 'Pendiente',
  CONTACTADO: 'Contactado',
  ESTUDIO_BIBLICO: 'Estudio bíblico',
  NO_LOCALIZABLE: 'No localizable',
  CERRADO: 'Cerrado'
};

const valorDetalle = (item, ...campos) => {
  for (const campo of campos) {
    const valor = item?.[campo];
    if (valor !== null && valor !== undefined && String(valor).trim() !== '') {
      return String(valor).trim();
    }
  }
  return '';
};

const construirFilasDetalle = (visita) => [
  ['Tipo', valorDetalle(visita, 'tipo_asistente'), false, true],
  ['Teléfono', valorDetalle(visita, 'telefono_snapshot', 'contacto_telefono')],
  ['Correo', valorDetalle(visita, 'correo', 'contacto_correo')],
  ['Procedencia', valorDetalle(visita, 'procedencia')],
  ['Clasificación', valorDetalle(visita, 'clasificacion_etaria')],
  ['Dirección', valorDetalle(visita, 'direccion', 'contacto_direccion')],
  ['Barrio / comunidad', valorDetalle(visita, 'barrio_comunidad', 'contacto_barrio_comunidad')],
  ['Seguimiento', SEGUIMIENTO_LABEL[visita?.estado_seguimiento] || visita?.estado_seguimiento, false, true],
  ['Campaña', valorDetalle(visita, 'campana_lema') || 'Sin campaña', false, true],
  ['Observaciones', valorDetalle(visita, 'observaciones')],
  ['Registrada', formatearFecha(visita?.creado_en), false, true]
].filter(([, value, , siempre]) => siempre || String(value || '').trim() !== '');

export default function VisitaDuplicadaWarningModal({ mostrar, nombreIntentado, similares = [], onAgregarDeTodosModos, onCancelar, guardando }) {
  const [verDetalle, setVerDetalle] = useState(null);

  if (!mostrar) return null;

  return (
    <div className="prompt-overlay-iasd" onClick={onCancelar}>
      <div className="prompt-modal-iasd" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h5 className="mb-0 text-warning-emphasis">
            <i className="bi bi-exclamation-triangle-fill me-2" aria-hidden="true"></i>
            Posible visita duplicada
          </h5>
          <button type="button" className="btn-close" onClick={onCancelar} aria-label="Cerrar"></button>
        </div>

        <div style={{ padding: '1rem 0', flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <p className="mb-2">
            Está intentando registrar a <strong>"{nombreIntentado}"</strong>, pero el sistema encontró {similares.length === 1 ? 'una visita parecida' : `${similares.length} visitas parecidas`} ya registradas:
          </p>

          <ul className="list-group mb-3">
            {similares.map((s) => (
              <li key={s.id} className="list-group-item">
                <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="fw-semibold">{s.nombre_snapshot}</div>
                    <div className="small text-muted">
                      {s.telefono_snapshot ? <span><i className="bi bi-telephone me-1"></i>{s.telefono_snapshot} · </span> : ''}
                      <span>Registrada: {formatearFecha(s.creado_en) || '-'}</span>
                    </div>
                    <div className="small text-muted mt-1">
                      <i className="bi bi-megaphone me-1"></i>
                      {s.campana_lema || 'Sin campaña'}
                    </div>
                    <div className="mt-1">
                      <span className="badge bg-light text-dark border me-1">
                        {SEGUIMIENTO_LABEL[s.estado_seguimiento] || s.estado_seguimiento}
                      </span>
                      {typeof s.similarity === 'number' && (
                        <span className="badge bg-warning-subtle text-warning-emphasis">
                          Coincidencia {(s.similarity * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm rounded-circle d-inline-flex align-items-center justify-content-center"
                    style={{ width: '32px', height: '32px' }}
                    onClick={() => setVerDetalle(s)}
                    title="Ver detalle completo"
                    aria-label="Ver detalle"
                  >
                    <i className="bi bi-search" aria-hidden="true"></i>
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="alert alert-info py-2 small mb-0">
            <i className="bi bi-info-circle me-1"></i>
            Si es la misma persona, cancele para evitar duplicar el registro. Si está seguro de que es alguien diferente con un nombre parecido, puede agregarla de todos modos.
          </div>
        </div>

        <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onCancelar} disabled={guardando}>
            Cancelar
          </button>
          <button type="button" className="btn btn-warning btn-sm" onClick={onAgregarDeTodosModos} disabled={guardando}>
            <i className="bi bi-plus-lg me-1"></i>
            {guardando ? 'Guardando...' : 'Agregar de todos modos'}
          </button>
        </div>

        {verDetalle && (
          <div className="prompt-overlay-iasd" onClick={() => setVerDetalle(null)} style={{ zIndex: 1100 }}>
            <div className="prompt-modal-iasd" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '95%' }}>
              <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h6 className="mb-0">Detalle de "{verDetalle.nombre_snapshot}"</h6>
                <button type="button" className="btn-close" onClick={() => setVerDetalle(null)} aria-label="Cerrar"></button>
              </div>
              <div style={{ padding: '1rem 0', maxHeight: '50vh', overflowY: 'auto', overflowX: 'hidden' }}>
                <div className="d-flex flex-column gap-2 small">
                  {construirFilasDetalle(verDetalle).map(([label, value]) => (
                    <div key={label} className="d-flex flex-column flex-sm-row gap-1 gap-sm-3 pb-2" style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <div className="text-muted" style={{ minWidth: '140px' }}>{label}</div>
                      <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap', flex: 1 }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #e0e0e0', textAlign: 'right' }}>
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setVerDetalle(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
