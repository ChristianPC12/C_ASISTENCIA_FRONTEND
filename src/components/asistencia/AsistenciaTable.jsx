import { Fragment, useState } from 'react';
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
  if (valor === null || valor === undefined || valor === '') return '-';
  if (typeof valor === 'number') return String(valor);
  return String(valor);
}

function obtenerResumenMetricas(registro, mapaEtiquetasMetricas) {
  const metricas = registro?.metricas || {};
  const entradas = Object.entries(metricas)
    .filter(([, valor]) => typeof valor === 'number' && valor > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 3);

  if (entradas.length === 0) {
    return 'Sin metricas numericas destacadas';
  }

  return entradas
    .map(([clave, valor]) => `${mapaEtiquetasMetricas?.[clave] || clave}: ${valor}`)
    .join(' | ');
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
  const [filaExpandida, setFilaExpandida] = useState(null);

  const toggleFila = (id) => {
    setFilaExpandida((prev) => (prev === id ? null : id));
  };

  const manejarCambioTrimestre = (valor) => {
    onCambiarFiltro('trimestre', valor);
    if (valor) onCambiarFiltro('mes', '');
  };

  const manejarCambioMes = (valor) => {
    onCambiarFiltro('mes', valor);
    if (valor) onCambiarFiltro('trimestre', '');
  };

  return (
    <div className="card shadow-sm">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0" style={{ color: '#FFFFFF' }}>Registros de Asistencia</h5>
        <span className="badge bg-light text-dark">{registros.length} registros</span>
      </div>
      <div className="card-body">
        <div className="filtros-container">
          <div className="row g-3 align-items-end">
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
              <label htmlFor="filtro-anio" className="form-label fw-semibold">Ano</label>
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
                placeholder="Ej: 28/02/2026"
                inputMode="numeric"
                maxLength={10}
                value={filtros.fecha_exacta || ''}
                onChange={(e) => onCambiarFiltro('fecha_exacta', e.target.value.replace(/[^\d/]/g, ''))}
              />
            </div>

            <div className="col-12 d-flex flex-wrap gap-2 justify-content-end">
              <button
                className="btn btn-outline-secondary btn-sm"
                type="button"
                onClick={() => onExportarInforme()}
                title="Generar informe Excel"
              >
                <i className="bi bi-filetype-xls me-1" aria-hidden="true"></i>
                Informe Excel
              </button>
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
                <thead className="tabla-registros-thead">
                  <tr>
                    <th>Fecha</th>
                    <th>Culto</th>
                    <th className="text-center">Total</th>
                    <th>Resumen de metricas</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((reg) => (
                    <Fragment key={reg.id}>
                      <tr
                        className={`fila-registro ${filaExpandida === reg.id ? 'fila-activa' : ''}`}
                        onClick={() => toggleFila(reg.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            toggleFila(reg.id);
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
                        <td className="small text-muted">
                          {obtenerResumenMetricas(reg, mapaEtiquetasMetricas)}
                        </td>
                        <td className="text-center">
                          <div className="d-flex flex-wrap gap-1 justify-content-center">
                            <button
                              className="btn btn-outline-primary btn-sm rounded-circle d-inline-flex align-items-center justify-content-center"
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
                              className="btn btn-outline-danger btn-sm rounded-circle d-inline-flex align-items-center justify-content-center"
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
                            <button
                              className="btn btn-outline-success btn-sm rounded-circle d-inline-flex align-items-center justify-content-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                onExportar(reg);
                              }}
                              title="Exportar a Excel"
                              aria-label="Exportar registro a Excel"
                              style={{ width: '34px', height: '34px' }}
                            >
                              <i className="bi bi-file-earmark-excel" aria-hidden="true"></i>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {filaExpandida === reg.id && (
                        <tr className="fila-detalle">
                          <td colSpan={5} className="p-0">
                            <div className="registro-detalle">
                              <div className="detalle-seccion">
                                <h6 className="detalle-titulo mb-3">
                                  <i className="bi bi-bar-chart-line me-2"></i>
                                  Detalle completo de metricas
                                </h6>

                                <div className="table-responsive">
                                  <table className="table table-sm mb-2">
                                    <thead>
                                      <tr>
                                        <th>Metrica</th>
                                        <th>Valor</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {Object.entries(reg.metricas || {}).map(([clave, valor]) => (
                                        <tr key={`${reg.id}-${clave}`}>
                                          <td className="fw-semibold">{mapaEtiquetasMetricas?.[clave] || clave}</td>
                                          <td>{formatearValorMetrica(valor)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>

                                <p className="mb-0 text-muted">
                                  Registrado por: <strong>{reg.registrado_por_nombre || '-'}</strong>
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
