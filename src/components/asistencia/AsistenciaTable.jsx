import { useState, Fragment } from 'react';
import { TRIMESTRE_OPCIONES, ANIO_OPCIONES, MES_OPCIONES } from '../../config/constants';

/**
 * Tabla de registros de asistencia con filtros y filas expandibles
 */
export default function AsistenciaTable({
  registros,
  cultos,
  filtros,
  cargando,
  onCambiarFiltro,
  onEditar,
  onEliminar,
  onExportar,
  onExportarInforme
}) {
  const [filaExpandida, setFilaExpandida] = useState(null);

  const formatearNombreCulto = (nombre = '', codigo = '') => {
    const valor = nombre || codigo || '';
    if (!valor) return '';

    return valor
      .replace(/Sabado/gi, 'Sábado')
      .replace(/Miercoles/gi, 'Miércoles');
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const partes = fecha.split('-');
    if (partes.length !== 3) return fecha;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  const toggleFila = (id) => {
    setFilaExpandida((prev) => (prev === id ? null : id));
  };

  // Al cambiar trimestre, limpiar mes y viceversa
  const manejarCambioTrimestre = (valor) => {
    onCambiarFiltro('trimestre', valor);
    if (valor) onCambiarFiltro('mes', '');
  };

  const manejarCambioMes = (valor) => {
    onCambiarFiltro('mes', valor);
    if (valor) onCambiarFiltro('trimestre', '');
  };

  const totalColumnas = 14;

  return (
    <div className="card shadow-sm">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0" style={{ color: '#FFFFFF' }}>Registros de Asistencia</h5>
        <span className="badge bg-light text-dark">{registros.length} registros</span>
      </div>
      <div className="card-body">

        {/* Filtros */}
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
                placeholder="Ej: 2026-03-14"
                value={filtros.fecha_exacta || ''}
                onChange={(e) => onCambiarFiltro('fecha_exacta', e.target.value)}
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
            <table className="table table-striped table-hover align-middle mb-0 tabla-registros">
              <thead className="tabla-registros-thead">
                <tr>
                  <th>Fecha</th>
                  <th>Culto</th>
                  <th className="text-center">Total</th>
                  <th className="text-center">Niños</th>
                  <th className="text-center">Jóvenes</th>
                  <th className="text-center">Antes</th>
                  <th className="text-center">Después</th>
                  <th className="text-center">Barrio</th>
                  <th className="text-center">Guayabo</th>
                  <th className="text-center">Visitas B.</th>
                  <th className="text-center">Visitas G.</th>
                  <th className="text-center">Retiros</th>
                  <th className="text-center">Quedaron</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((reg) => (
                  <Fragment key={reg.id}>
                    <tr
                      className={`fila-registro ${filaExpandida === reg.id ? 'fila-activa' : ''}`}
                      onClick={() => toggleFila(reg.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="fw-semibold text-nowrap">{formatearFecha(reg.fecha)}</td>
                      <td>
                        <span className="badge bg-primary">
                          {formatearNombreCulto(reg.culto_nombre, reg.culto_codigo)}
                        </span>
                      </td>
                      <td className="text-center fw-bold">{reg.total_asistentes}</td>
                      <td className="text-center">{reg.ninos}</td>
                      <td className="text-center">{reg.jovenes}</td>
                      <td className="text-center">{reg.llegaron_antes_hora}</td>
                      <td className="text-center">{reg.llegaron_despues_hora}</td>
                      <td className="text-center">{reg.proc_barrio}</td>
                      <td className="text-center">{reg.proc_guayabo}</td>
                      <td className="text-center">{reg.visitas_barrio}</td>
                      <td className="text-center">{reg.visitas_guayabo}</td>
                      <td className="text-center">{reg.retiros_antes_terminar}</td>
                      <td className="text-center">{reg.se_quedaron_todo}</td>
                      <td className="text-center">
                        <div className="d-flex flex-wrap gap-1 justify-content-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn btn-outline-primary btn-sm rounded-circle d-inline-flex align-items-center justify-content-center"
                            onClick={() => onEditar(reg)}
                            title="Editar"
                            aria-label="Editar registro"
                            style={{ width: '34px', height: '34px' }}
                          >
                            <i className="bi bi-pencil-square" aria-hidden="true"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm rounded-circle d-inline-flex align-items-center justify-content-center"
                            onClick={() => onEliminar(reg.id)}
                            title="Eliminar"
                            aria-label="Eliminar registro"
                            style={{ width: '34px', height: '34px' }}
                          >
                            <i className="bi bi-trash" aria-hidden="true"></i>
                          </button>
                          <button
                            className="btn btn-outline-success btn-sm rounded-circle d-inline-flex align-items-center justify-content-center"
                            onClick={() => onExportar(reg)}
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
                        <td colSpan={totalColumnas} className="p-0">
                          <div className="registro-detalle">
                            <div className="row g-3">
                              <div className="col-md-6">
                                <div className="detalle-seccion">
                                  <h6 className="detalle-titulo">
                                    <i className="bi bi-people-fill me-2"></i>
                                    Visitas del Barrio
                                    {reg.visitas_barrio > 0 && (
                                      <span className="badge bg-primary ms-2">{reg.visitas_barrio}</span>
                                    )}
                                  </h6>
                                  <p className="detalle-texto">
                                    {reg.nombres_visitas_barrio || <span className="text-muted fst-italic">Sin visitas registradas</span>}
                                  </p>
                                </div>
                              </div>

                              <div className="col-md-6">
                                <div className="detalle-seccion">
                                  <h6 className="detalle-titulo">
                                    <i className="bi bi-people-fill me-2"></i>
                                    Visitas de Guayabo
                                    {reg.visitas_guayabo > 0 && (
                                      <span className="badge bg-primary ms-2">{reg.visitas_guayabo}</span>
                                    )}
                                  </h6>
                                  <p className="detalle-texto">
                                    {reg.nombres_visitas_guayabo || <span className="text-muted fst-italic">Sin visitas registradas</span>}
                                  </p>
                                </div>
                              </div>

                              <div className="col-12">
                                <div className="detalle-seccion">
                                  <h6 className="detalle-titulo">
                                    <i className="bi bi-chat-left-text-fill me-2"></i>
                                    Observaciones
                                  </h6>
                                  <p className="detalle-texto mb-0">
                                    {reg.observaciones || <span className="text-muted fst-italic">Sin observaciones</span>}
                                  </p>
                                </div>
                              </div>
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
        )}
      </div>
    </div>
  );
}
