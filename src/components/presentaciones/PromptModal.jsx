import { useEffect } from 'react';
import { ANIO_OPCIONES, MES_OPCIONES } from '../../config/constants';

export default function PromptModal({
  visible,
  enviando,
  filtros,
  cultos,
  mesesBloqueados,
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

  const puedeEnviar = Boolean(filtros.anio) && Boolean(filtros.mes) && !enviando;

  return (
    <div className="prompt-overlay-iasd" role="dialog" aria-modal="true" aria-labelledby="prompt-modal-title">
      <div className="prompt-modal-iasd">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h5 id="prompt-modal-title" className="mb-1">Generar presentación</h5>
            <p className="text-muted mb-0">Seleccione período y culto para generar la presentación mensual.</p>
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
          <div className="col-12 col-md-4">
            <label htmlFor="prompt-culto" className="form-label fw-semibold">Culto</label>
            <select
              id="prompt-culto"
              className="form-select"
              value={filtros.culto}
              onChange={(e) => onCambiarFiltro('culto', e.target.value)}
              disabled={enviando}
            >
              <option value="">Todos</option>
              {cultos.map((culto) => (
                <option key={culto.codigo} value={culto.codigo}>
                  {culto.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-4">
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

          <div className="col-6 col-md-4">
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
                <option
                  key={mes.valor}
                  value={mes.valor}
                  disabled={mesesBloqueados?.has?.(String(mes.valor))}
                >
                  {mes.etiqueta}
                </option>
              ))}
            </select>
          </div>
        </div>

        {mesesBloqueados?.size > 0 && (
          <div className="alert alert-warning py-2 px-3 mb-3">
            Algunos meses ya tienen presentación para esta combinación y quedan bloqueados.
          </div>
        )}

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

