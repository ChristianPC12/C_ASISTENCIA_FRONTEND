import { useEffect } from 'react';
import { ANIO_OPCIONES, MES_OPCIONES } from '../../config/constants';

export default function PromptModal({
  visible,
  enviando,
  filtros,
  opcionesCulto,
  cargandoCultos,
  onClose,
  onCambiarFiltro,
  onEnviar
}) {
  useEffect(() => {
    if (!visible) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !enviando) {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [visible, enviando, onClose]);

  if (!visible) {
    return null;
  }

  const opcionElegida = opcionesCulto.find((opcion) => opcion.valor === filtros.culto);
  const puedeEnviar = Boolean(filtros.anio)
    && Boolean(filtros.mes)
    && Boolean(opcionElegida)
    && !opcionElegida.bloqueado
    && !enviando;

  return (
    <div className="prompt-overlay-iasd" role="dialog" aria-modal="true" aria-labelledby="prompt-modal-title">
      <div className="prompt-modal-iasd" style={{ maxWidth: '520px' }}>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h5 id="prompt-modal-title" className="mb-1">Generar presentación</h5>
            <p className="text-muted mb-0">Elija el período y luego el culto de esa presentación mensual.</p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary iasd-icon-btn-round"
            onClick={onClose}
            disabled={enviando}
            aria-label="Cerrar modal"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-6">
            <label htmlFor="prompt-anio" className="form-label fw-semibold">Año</label>
            <select
              id="prompt-anio"
              className="form-select"
              value={filtros.anio}
              onChange={(e) => onCambiarFiltro('anio', e.target.value)}
              disabled={enviando}
            >
              {ANIO_OPCIONES.map((anio) => (
                <option key={anio} value={anio}>{anio}</option>
              ))}
            </select>
          </div>

          <div className="col-6">
            <label htmlFor="prompt-mes" className="form-label fw-semibold">Mes</label>
            <select
              id="prompt-mes"
              className="form-select"
              value={filtros.mes}
              onChange={(e) => onCambiarFiltro('mes', e.target.value)}
              disabled={enviando}
            >
              <option value="">Seleccione</option>
              {MES_OPCIONES.map((mes) => (
                <option key={mes.valor} value={mes.valor}>{mes.etiqueta}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-3">
          <span className="form-label fw-semibold d-block">Culto</span>
          {!filtros.mes ? (
            <div className="prompt-cultos-vacio">Seleccione un mes para ver los cultos disponibles.</div>
          ) : cargandoCultos ? (
            <div className="prompt-cultos-vacio">Buscando cultos de este período...</div>
          ) : (
            <div className="prompt-cultos-lista" role="radiogroup" aria-label="Culto de la presentación">
              {opcionesCulto.map((opcion) => {
                const activa = opcion.valor === filtros.culto;
                return (
                  <button
                    key={opcion.valor || 'todos'}
                    type="button"
                    role="radio"
                    aria-checked={activa}
                    className={`prompt-culto-opcion ${activa ? 'is-activa' : ''}`.trim()}
                    onClick={() => onCambiarFiltro('culto', opcion.valor)}
                    disabled={enviando || opcion.bloqueado}
                  >
                    <span className="prompt-culto-radio" aria-hidden="true"></span>
                    <span className="prompt-culto-texto">
                      <span className="prompt-culto-nombre">{opcion.etiqueta}</span>
                      <span className="prompt-culto-detalle">
                        {opcion.bloqueado
                          ? opcion.motivo
                          : `${opcion.total} ${opcion.total === 1 ? 'registro' : 'registros'}`}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={enviando}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onEnviar}
            disabled={!puedeEnviar}
          >
            {enviando ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
}
