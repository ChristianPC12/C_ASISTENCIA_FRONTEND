import { useState } from 'react';

const TIPO_OPCIONES = [
  { valor: 'VISITA', etiqueta: 'Visita' },
  { valor: 'INTERESADO', etiqueta: 'Interesado' },
  { valor: 'MIEMBRO', etiqueta: 'Miembro' }
];

const SEGUIMIENTO_OPCIONES = [
  { valor: 'PENDIENTE', etiqueta: 'Pendiente' },
  { valor: 'CONTACTADO', etiqueta: 'Contactado' },
  { valor: 'ESTUDIO_BIBLICO', etiqueta: 'Estudio bíblico' },
  { valor: 'NO_LOCALIZABLE', etiqueta: 'No localizable' },
  { valor: 'CERRADO', etiqueta: 'Cerrado' }
];

const esBautizado = (visita) => (
  visita?.tipo_asistente === 'BAUTIZADO' || visita?.estado_seguimiento === 'BAUTIZADO'
);

/**
 * Cambio rapido de estado de una visita: tipo, seguimiento y "ya se bautizó".
 * Al marcar bautizado, tipo y seguimiento pasan a BAUTIZADO y deja de contarse como visita.
 */
export default function VisitaEstadoModal({ visita, onCerrar, onGuardar, guardando }) {
  const yaBautizado = esBautizado(visita);
  const [bautizado, setBautizado] = useState(yaBautizado);
  const [tipo, setTipo] = useState(yaBautizado ? 'VISITA' : (visita.tipo_asistente || 'VISITA'));
  const [seguimiento, setSeguimiento] = useState(yaBautizado ? 'CONTACTADO' : (visita.estado_seguimiento || 'PENDIENTE'));

  const guardar = () => {
    onGuardar(
      bautizado
        ? { tipo_asistente: 'BAUTIZADO', estado_seguimiento: 'BAUTIZADO' }
        : { tipo_asistente: tipo, estado_seguimiento: seguimiento }
    );
  };

  return (
    <div className="prompt-overlay-iasd" onClick={onCerrar}>
      <div className="prompt-modal-iasd" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px', width: '95%' }}>
        <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h5 className="mb-0" style={{ color: 'var(--iasd-azul)' }}>Cambiar estado</h5>
            <small className="text-muted">{visita.nombre_snapshot}</small>
          </div>
          <button type="button" className="btn-close" onClick={onCerrar} aria-label="Cerrar"></button>
        </div>

        <div className="row g-3" style={{ padding: '1rem 0' }}>
          <div className="col-6">
            <label className="form-label form-label-sm" htmlFor="estado-visita-tipo">Tipo</label>
            <select
              id="estado-visita-tipo"
              className="form-select form-select-sm"
              value={bautizado ? 'BAUTIZADO' : tipo}
              onChange={(e) => setTipo(e.target.value)}
              disabled={bautizado}
            >
              {bautizado && <option value="BAUTIZADO">Bautizado</option>}
              {TIPO_OPCIONES.map((o) => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
            </select>
          </div>
          <div className="col-6">
            <label className="form-label form-label-sm" htmlFor="estado-visita-seguimiento">Seguimiento</label>
            <select
              id="estado-visita-seguimiento"
              className="form-select form-select-sm"
              value={bautizado ? 'BAUTIZADO' : seguimiento}
              onChange={(e) => setSeguimiento(e.target.value)}
              disabled={bautizado}
            >
              {bautizado && <option value="BAUTIZADO">Bautizado</option>}
              {SEGUIMIENTO_OPCIONES.map((o) => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
            </select>
          </div>
          <div className="col-12">
            <div className="form-check form-switch">
              <input
                id="estado-visita-bautizado"
                className="form-check-input"
                type="checkbox"
                role="switch"
                checked={bautizado}
                onChange={(e) => setBautizado(e.target.checked)}
              />
              <label className="form-check-label fw-semibold" htmlFor="estado-visita-bautizado">Ya se bautizó</label>
            </div>
            <small className="text-muted d-block mt-1">
              Dejará de contarse como visita y pasará a Bautizados.
            </small>
          </div>
        </div>

        <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onCerrar} disabled={guardando}>Cancelar</button>
          <button type="button" className="btn btn-primary btn-sm" onClick={guardar} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
