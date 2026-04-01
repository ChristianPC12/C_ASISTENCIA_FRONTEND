import { useEffect, useState } from 'react';
import { TRIMESTRE_OPCIONES, ANIO_OPCIONES, MES_OPCIONES } from '../../config/constants';

function formatearNombreCulto(nombre = '', codigo = '') {
  const valor = nombre || codigo || '';
  if (!valor) return '';

  return valor
    .replace(/Sabado/gi, 'Sabado')
    .replace(/Miercoles/gi, 'Miercoles');
}

function formatearFecha(fecha) {
  if (!fecha) return '';
  const partes = fecha.split('-');
  if (partes.length !== 3) return fecha;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatearValorMetrica(valor) {
  if (valor === null || valor === undefined || valor === '') return '';
  if (typeof valor === 'number') return String(valor);
  return String(valor);
}

function esValorCeroRegistrado(valor) {
  if (valor === 0) return true;
  if (typeof valor !== 'string') return false;

  const texto = valor.trim();
  if (!texto) return false;

  return /^0+(?:[.,]0+)?$/.test(texto);
}

function tieneValorRegistrado(valor) {
  if (valor === null || valor === undefined) return false;
  if (typeof valor === 'string') return valor.trim() !== '' && !esValorCeroRegistrado(valor);
  if (typeof valor === 'number') return !esValorCeroRegistrado(valor);
  return true;
}

function obtenerMetricasRegistradas(registro, mapaEtiquetasMetricas) {
  return Object.entries(registro?.metricas || {})
    .filter(([clave, valor]) => clave !== 'total_asistentes' && tieneValorRegistrado(valor))
    .map(([clave, valor]) => ({
      clave,
      etiqueta: mapaEtiquetasMetricas?.[clave] || clave,
      valor: formatearValorMetrica(valor)
    }));
}

function esDetalleAmplio(item) {
  const texto = String(item?.valor ?? '').trim();
  return texto.length > 18 || texto.includes(',') || texto.includes('\n') || String(item?.etiqueta ?? '').length > 26;
}

function RegistroDetalleModal({ registro, mapaEtiquetasMetricas, onClose, onExportar }) {
  useEffect(() => {
    if (!registro) return undefined;

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const manejarTecla = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', manejarTecla);
    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener('keydown', manejarTecla);
    };
  }, [registro, onClose]);

  if (!registro) {
    return null;
  }

  const metricasRegistradas = obtenerMetricasRegistradas(registro, mapaEtiquetasMetricas);
  const detalleItems = [
    { clave: '__total__', etiqueta: 'Total', valor: String(registro.total_asistentes ?? '') },
    ...metricasRegistradas
  ];

  return (
    <div
      className="registro-overlay-iasd"
      role="dialog"
      aria-modal="true"
      aria-labelledby="registro-detalle-title"
    >
      <button
        type="button"
        className="registro-overlay-dismiss"
        onClick={onClose}
        aria-label="Cerrar detalle del registro"
      />
      <div className="registro-modal-iasd">
        <div className="registro-modal-head mb-3">
          <div className="registro-modal-head-main">
            <h5 id="registro-detalle-title" className="mb-0">Detalle del registro</h5>
            <div className="registro-modal-head-tags">
              <span className="registro-modal-head-chip registro-modal-head-chip-culto">
                {formatearNombreCulto(registro.culto_nombre, registro.culto_codigo)}
              </span>
              <span className="registro-modal-head-chip">
                {formatearFecha(registro.fecha)}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm registro-modal-close"
            onClick={onClose}
            aria-label="Cerrar detalle del registro"
          >
            <i className="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </div>

        {detalleItems.length > 0 ? (
          <div className="registro-modal-grid">
            {detalleItems.map((item) => (
              <div
                className={`registro-modal-item ${esDetalleAmplio(item) ? 'is-wide' : ''}`.trim()}
                key={`${registro.id}-${item.clave}`}
              >
                <span className="registro-modal-item-label">{item.etiqueta}</span>
                <strong className="registro-modal-item-value">{item.valor}</strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="registro-modal-empty">
            No hay datos adicionales registrados para este registro.
          </div>
        )}

        {(registro.registrado_por_nombre || typeof onExportar === 'function') && (
          <div className="registro-modal-footer mt-3">
            {registro.registrado_por_nombre ? (
              <span>Registrado por: <strong>{registro.registrado_por_nombre}</strong></span>
            ) : <span></span>}
            {typeof onExportar === 'function' && (
              <button
                type="button"
                className="btn btn-outline-success btn-sm registro-modal-export-btn"
                onClick={() => onExportar(registro)}
                title="Exportar registro a Excel"
                aria-label="Exportar registro a Excel"
              >
                <i className="bi bi-file-earmark-excel" aria-hidden="true"></i>
                <span className="registro-modal-export-label">Exportar Excel</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Tabla de registros de asistencia con filtros y detalle dinamico por metrica
 */
export default function AsistenciaTable({
  registros,
  cultos,
  filtros,
  cargando,
  mapaEtiquetasMetricas,
  onCambiarFiltro,
  onEditar,
  onEliminar,
  onExportar,
  onExportarInforme
}) {
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);

  const manejarCambioTrimestre = (valor) => {
    onCambiarFiltro('trimestre', valor);
    if (valor) onCambiarFiltro('mes', '');
  };

  const manejarCambioMes = (valor) => {
    onCambiarFiltro('mes', valor);
    if (valor) onCambiarFiltro('trimestre', '');
  };

  useEffect(() => {
    if (!registroSeleccionado) {
      return;
    }

    const sigueVisible = registros.some((item) => item.id === registroSeleccionado.id);
    if (!sigueVisible) {
      setRegistroSeleccionado(null);
    }
  }, [registros, registroSeleccionado]);

  return (
    <>
    <div className="card shadow-sm">
      <div className="card-body">
        <div className="filtros-container registros-filtros-panel">
          <div className="row g-3 align-items-end registros-filtros-grid">
            <div className="col-6 col-md-2">
              <label htmlFor="filtro-culto" className="form-label fw-semibold">Culto</label>
              <select
                id="filtro-culto"
                className="form-select"
                value={filtros.culto}
                onChange={(e) => onCambiarFiltro('culto', e.target.value)}
              >
                <option value="">Todos</option>
                {cultos.map((culto) => (
                  <option key={culto.codigo} value={culto.codigo}>
                    {formatearNombreCulto(culto.nombre, culto.codigo)}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-6 col-md-2">
              <label htmlFor="filtro-anio" className="form-label fw-semibold">Año</label>
              <select
                id="filtro-anio"
                className="form-select"
                value={filtros.anio}
                onChange={(e) => onCambiarFiltro('anio', e.target.value)}
              >
                <option value="">Todos</option>
                {ANIO_OPCIONES.map((anio) => (
                  <option key={anio} value={anio}>{anio}</option>
                ))}
              </select>
            </div>

            <div className="col-6 col-md-3">
              <label htmlFor="filtro-trimestre" className="form-label fw-semibold">Trimestre</label>
              <select
                id="filtro-trimestre"
                className="form-select"
                value={filtros.trimestre}
                onChange={(e) => manejarCambioTrimestre(e.target.value)}
              >
                <option value="">Todos</option>
                {TRIMESTRE_OPCIONES.map((t) => (
                  <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
                ))}
              </select>
            </div>

            <div className="col-6 col-md-2">
              <label htmlFor="filtro-mes" className="form-label fw-semibold">Mes</label>
              <select
                id="filtro-mes"
                className="form-select"
                value={filtros.mes}
                onChange={(e) => manejarCambioMes(e.target.value)}
              >
                <option value="">Todos</option>
                {MES_OPCIONES.map((m) => (
                  <option key={m.valor} value={m.valor}>{m.etiqueta}</option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-3">
              <label htmlFor="filtro-fecha-exacta" className="form-label fw-semibold">Fecha exacta</label>
              <input
                id="filtro-fecha-exacta"
                type="text"
                className="form-control"
                placeholder="28/02/2026"
                inputMode="numeric"
                maxLength={10}
                value={filtros.fecha_exacta || ''}
                onChange={(e) => onCambiarFiltro('fecha_exacta', e.target.value.replace(/[^\d/]/g, ''))}
              />
            </div>

            <div className="col-12 col-md-2 ms-md-auto">
              <div className="registros-toolbar-actions">
                <span className="badge text-bg-light registros-count-chip" title={`${registros.length} registros`}>
                  <i className="bi bi-collection me-1" aria-hidden="true"></i>
                  <span>{registros.length}</span>
                </span>
                {typeof onExportarInforme === 'function' && (
                  <button
                    className="btn btn-outline-success btn-sm registros-export-btn"
                    type="button"
                    onClick={() => onExportarInforme()}
                    title="Exportar Excel"
                    aria-label="Exportar Excel"
                  >
                    <i className="bi bi-filetype-xls" aria-hidden="true"></i>
                    <span className="registros-export-label">Excel</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {cargando && (
          <div className="text-center py-4">
            <div className="spinner-border spinner-iasd" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        )}

        {!cargando && registros.length === 0 && (
          <div className="alert alert-iasd text-center">
            No se encontraron registros de asistencia con los filtros seleccionados.
          </div>
        )}

        {!cargando && registros.length > 0 && (
          <div className="tabla-registros-scroll">
            <div className="tabla-registros-scroll-x">
              <table className="table table-striped table-hover align-middle mb-0 tabla-registros">
                <colgroup>
                  <col className="registro-col-fecha" />
                  <col className="registro-col-culto" />
                  <col className="registro-col-total" />
                  <col className="registro-col-acciones" />
                </colgroup>
                <thead className="tabla-registros-thead">
                  <tr>
                    <th>Fecha</th>
                    <th>Culto</th>
                    <th className="text-center">Total</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((reg) => (
                    <tr
                      key={reg.id}
                      className={`fila-registro ${registroSeleccionado?.id === reg.id ? 'fila-activa' : ''}`}
                      onClick={() => setRegistroSeleccionado(reg)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setRegistroSeleccionado(reg);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="fw-semibold text-nowrap">{formatearFecha(reg.fecha)}</td>
                      <td>
                        <span className="badge bg-primary">
                          {formatearNombreCulto(reg.culto_nombre, reg.culto_codigo)}
                        </span>
                      </td>
                      <td className="text-center fw-bold">{reg.total_asistentes}</td>
                      <td className="text-center">
                        <div className="registro-row-actions">
                          <button
                            className="btn btn-outline-primary btn-sm rounded-circle d-inline-flex align-items-center justify-content-center registro-row-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditar(reg);
                            }}
                            title="Editar"
                            aria-label="Editar registro"
                            style={{ width: '34px', height: '34px' }}
                          >
                            <i className="bi bi-pencil-square" aria-hidden="true"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm rounded-circle d-inline-flex align-items-center justify-content-center registro-row-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEliminar(reg.id);
                            }}
                            title="Eliminar"
                            aria-label="Eliminar registro"
                            style={{ width: '34px', height: '34px' }}
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
        )}
      </div>
    </div>
    <RegistroDetalleModal
      registro={registroSeleccionado}
      mapaEtiquetasMetricas={mapaEtiquetasMetricas}
      onClose={() => setRegistroSeleccionado(null)}
      onExportar={onExportar}
    />
    </>
  );
}

