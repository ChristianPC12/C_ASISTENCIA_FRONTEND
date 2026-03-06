import { ANIO_OPCIONES, MES_OPCIONES } from '../config/constants';
import { useComparaciones } from '../hooks/useComparaciones';

function formatearValor(valor, unidad) {
  const numero = Number(valor || 0);

  if (unidad === 'porcentaje') {
    return `${numero.toFixed(1)}%`;
  }

  if (unidad === 'decimal') {
    return numero.toLocaleString('es-CR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });
  }

  return numero.toLocaleString('es-CR');
}

function formatearDiferencia(valor, unidad) {
  const numero = Number(valor || 0);
  const signo = numero > 0 ? '+' : '';

  if (unidad === 'porcentaje') {
    return `${signo}${numero.toFixed(1)} pp`;
  }

  if (unidad === 'decimal') {
    return `${signo}${numero.toLocaleString('es-CR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    })}`;
  }

  return `${signo}${numero.toLocaleString('es-CR')}`;
}

function formatearVariacion(valor) {
  if (valor === null || valor === undefined) return 'N/A';
  const numero = Number(valor);
  const signo = numero > 0 ? '+' : '';
  return `${signo}${numero.toFixed(1)}%`;
}

function obtenerClaseCambio(valor) {
  if (valor > 0) return 'comparacion-cambio-sube';
  if (valor < 0) return 'comparacion-cambio-baja';
  return 'comparacion-cambio-igual';
}

function ResumenPeriodo({ titulo, estadisticas }) {
  return (
    <div className="card shadow-sm h-100 comparacion-resumen-card">
      <div className="card-body">
        <h6 className="comparacion-resumen-titulo">{titulo}</h6>
        <div className="row g-3">
          <div className="col-6">
            <span className="estad-kpi-label">Total asistentes</span>
            <div className="comparacion-resumen-valor">
              {Number(estadisticas?.resumen_general?.total_asistentes || 0).toLocaleString('es-CR')}
            </div>
          </div>
          <div className="col-6">
            <span className="estad-kpi-label">Promedio</span>
            <div className="comparacion-resumen-valor">
              {Number(estadisticas?.resumen_general?.promedio_por_culto || 0).toLocaleString('es-CR', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
              })}
            </div>
          </div>
          <div className="col-6">
            <span className="estad-kpi-label">Total cultos</span>
            <div className="comparacion-resumen-valor">
              {Number(estadisticas?.resumen_general?.total_cultos_registrados || 0).toLocaleString('es-CR')}
            </div>
          </div>
          <div className="col-6">
            <span className="estad-kpi-label">Visitas</span>
            <div className="comparacion-resumen-valor">
              {Number(estadisticas?.visitas?.total_visitas || 0).toLocaleString('es-CR')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ComparacionesPage() {
  const {
    cultos,
    cargando,
    filtros,
    periodoA,
    periodoB,
    indicadores,
    topNombresComparados,
    etiquetaPeriodoA,
    etiquetaPeriodoB,
    cultoSeleccionado,
    cambiarFiltro
  } = useComparaciones();

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-3">Comparaciones Mensuales</h2>

      <div className="card shadow-sm mb-4">
        <div className="card-header">
          <h5 className="mb-0" style={{ color: '#FFFFFF' }}>Filtros de comparacion</h5>
        </div>
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-lg-4">
              <label htmlFor="comp-culto" className="form-label fw-semibold">Culto</label>
              <select
                id="comp-culto"
                className="form-select"
                value={filtros.culto}
                onChange={(e) => cambiarFiltro('culto', e.target.value)}
              >
                <option value="" disabled>Seleccione un culto</option>
                {cultos.map((culto) => (
                  <option key={culto.codigo} value={culto.codigo}>
                    {culto.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-6 col-lg-2">
              <label htmlFor="comp-anio-a" className="form-label fw-semibold">Ano A</label>
              <select
                id="comp-anio-a"
                className="form-select"
                value={filtros.anioA}
                onChange={(e) => cambiarFiltro('anioA', e.target.value)}
              >
                {ANIO_OPCIONES.map((anio) => (
                  <option key={anio} value={anio}>{anio}</option>
                ))}
              </select>
            </div>
            <div className="col-6 col-lg-2">
              <label htmlFor="comp-mes-a" className="form-label fw-semibold">Mes A</label>
              <select
                id="comp-mes-a"
                className="form-select"
                value={filtros.mesA}
                onChange={(e) => cambiarFiltro('mesA', e.target.value)}
              >
                {MES_OPCIONES.map((mes) => (
                  <option key={`mes-a-${mes.valor}`} value={mes.valor}>{mes.etiqueta}</option>
                ))}
              </select>
            </div>

            <div className="col-6 col-lg-2">
              <label htmlFor="comp-anio-b" className="form-label fw-semibold">Ano B</label>
              <select
                id="comp-anio-b"
                className="form-select"
                value={filtros.anioB}
                onChange={(e) => cambiarFiltro('anioB', e.target.value)}
              >
                {ANIO_OPCIONES.map((anio) => (
                  <option key={`anio-b-${anio}`} value={anio}>{anio}</option>
                ))}
              </select>
            </div>
            <div className="col-6 col-lg-2">
              <label htmlFor="comp-mes-b" className="form-label fw-semibold">Mes B</label>
              <select
                id="comp-mes-b"
                className="form-select"
                value={filtros.mesB}
                onChange={(e) => cambiarFiltro('mesB', e.target.value)}
              >
                {MES_OPCIONES.map((mes) => (
                  <option key={`mes-b-${mes.valor}`} value={mes.valor}>{mes.etiqueta}</option>
                ))}
              </select>
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

      {!cargando && (
        <>
          <div className="alert alert-iasd mb-4">
            <i className="bi bi-arrow-left-right me-2"></i>
            Comparando <strong>{etiquetaPeriodoA}</strong> vs <strong>{etiquetaPeriodoB}</strong>
            {cultoSeleccionado ? (
              <>
                {' '}para <strong>{cultoSeleccionado}</strong>.
              </>
            ) : (
              '.'
            )}
          </div>

          <div className="row g-3 mb-4">
            <div className="col-12 col-xl-6">
              <ResumenPeriodo titulo={etiquetaPeriodoA} estadisticas={periodoA} />
            </div>
            <div className="col-12 col-xl-6">
              <ResumenPeriodo titulo={etiquetaPeriodoB} estadisticas={periodoB} />
            </div>
          </div>

          <div className="card shadow-sm mb-4">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="mb-0" style={{ color: '#FFFFFF' }}>Indicadores comparados</h5>
              <small className="text-white-50">Diferencia calculada como B - A</small>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive comparacion-table-wrap">
                <table className="table table-hover align-middle mb-0 comparacion-tabla">
                  <thead>
                    <tr>
                      <th>Indicador</th>
                      <th className="text-end">{etiquetaPeriodoA}</th>
                      <th className="text-end">{etiquetaPeriodoB}</th>
                      <th className="text-end">Diferencia</th>
                      <th className="text-end">Variacion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indicadores.map((item) => (
                      <tr key={item.id}>
                        <td className="fw-semibold">{item.etiqueta}</td>
                        <td className="text-end">{formatearValor(item.valorA, item.unidad)}</td>
                        <td className="text-end">{formatearValor(item.valorB, item.unidad)}</td>
                        <td className={`text-end fw-semibold ${obtenerClaseCambio(item.diferencia)}`}>
                          {formatearDiferencia(item.diferencia, item.unidad)}
                        </td>
                        <td className={`text-end fw-semibold ${obtenerClaseCambio(item.variacion || 0)}`}>
                          {formatearVariacion(item.variacion)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-header">
              <h5 className="mb-0" style={{ color: '#FFFFFF' }}>Top nombres de visitas</h5>
            </div>
            <div className="card-body p-0">
              {topNombresComparados.length === 0 && (
                <div className="p-3 text-muted">
                  No hay nombres de visitas para los periodos seleccionados.
                </div>
              )}
              {topNombresComparados.length > 0 && (
                <div className="table-responsive comparacion-table-wrap">
                  <table className="table table-sm align-middle mb-0 comparacion-tabla">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th className="text-end">{etiquetaPeriodoA}</th>
                        <th className="text-end">{etiquetaPeriodoB}</th>
                        <th className="text-end">Diferencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topNombresComparados.map((item) => (
                        <tr key={item.nombre}>
                          <td>{item.nombre}</td>
                          <td className="text-end">{item.cantidadA}</td>
                          <td className="text-end">{item.cantidadB}</td>
                          <td className={`text-end fw-semibold ${obtenerClaseCambio(item.diferencia)}`}>
                            {item.diferencia > 0 ? '+' : ''}{item.diferencia}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
