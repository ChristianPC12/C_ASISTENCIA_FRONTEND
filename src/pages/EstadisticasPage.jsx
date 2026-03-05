import { useCallback, useEffect, useMemo, useState } from 'react';
import asistenciaApi from '../api/asistenciaApi';
import cultoApi from '../api/cultoApi';
import { ANIO_ACTUAL, ANIO_OPCIONES, TRIMESTRE_OPCIONES, MES_OPCIONES } from '../config/constants';
import { notificarError } from '../utils/notify';

const TRIMESTRE_ACTUAL = Math.floor(new Date().getMonth() / 3) + 1;

const ESTADISTICAS_VACIAS = {
  filtros_aplicados: {
    anio: ANIO_ACTUAL,
    trimestre: null,
    mes: null,
    culto: '',
    culto_nombre: ''
  },
  resumen_general: {
    total_cultos_registrados: 0,
    total_asistentes: 0,
    promedio_por_culto: 0,
    maximo_asistentes: 0,
    minimo_asistentes: 0
  },
  composicion_asistentes: {
    ninos: { cantidad: 0, porcentaje: 0 },
    jovenes: { cantidad: 0, porcentaje: 0 }
  },
  puntualidad: {
    antes: { cantidad: 0, porcentaje: 0 },
    despues: { cantidad: 0, porcentaje: 0 }
  },
  procedencia: {
    barrio: { cantidad: 0, porcentaje: 0 },
    guayabo: { cantidad: 0, porcentaje: 0 }
  },
  visitas: {
    total_visitas: 0,
    barrio: { cantidad: 0, porcentaje: 0 },
    guayabo: { cantidad: 0, porcentaje: 0 },
    top_nombres: []
  },
  series: {
    asistencia_por_fecha: []
  },
  resumen_condensado: ''
};

function formatearNombreCulto(nombre = '', codigo = '') {
  const valor = nombre || codigo || '';
  return valor
    .replace(/Sabado/gi, 'Sábado')
    .replace(/Miercoles/gi, 'Miércoles');
}

function formatearPorcentaje(valor) {
  return `${Number(valor || 0).toFixed(1)}%`;
}

function formatearFechaSerie(fecha) {
  if (!fecha) return '';
  const partes = String(fecha).split('-');
  if (partes.length !== 3) return fecha;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatearEtiquetaSerie(fecha) {
  if (!fecha) return '';
  const partes = String(fecha).split('-');
  if (partes.length !== 3) return fecha;
  return `${partes[2]}/${partes[1]}`;
}

function CardComparativa({ titulo, izquierda, derecha, colorIzquierda, colorDerecha }) {
  return (
    <div className="card shadow-sm h-100">
      <div className="card-body">
        <h6 className="estad-card-titulo">{titulo}</h6>

        <div className="mb-3">
          <div className="d-flex justify-content-between small fw-semibold mb-1">
            <span>{izquierda.etiqueta}</span>
            <span>{izquierda.cantidad} ({formatearPorcentaje(izquierda.porcentaje)})</span>
          </div>
          <div className="progress estad-progress">
            <div
              className={`progress-bar ${colorIzquierda}`}
              role="progressbar"
              style={{ width: `${Math.max(Number(izquierda.porcentaje || 0), 2)}%` }}
              aria-valuenow={Number(izquierda.porcentaje || 0)}
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
        </div>

        <div>
          <div className="d-flex justify-content-between small fw-semibold mb-1">
            <span>{derecha.etiqueta}</span>
            <span>{derecha.cantidad} ({formatearPorcentaje(derecha.porcentaje)})</span>
          </div>
          <div className="progress estad-progress">
            <div
              className={`progress-bar ${colorDerecha}`}
              role="progressbar"
              style={{ width: `${Math.max(Number(derecha.porcentaje || 0), 2)}%` }}
              aria-valuenow={Number(derecha.porcentaje || 0)}
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EstadisticasPage() {
  const [cultos, setCultos] = useState([]);
  const [estadisticas, setEstadisticas] = useState(ESTADISTICAS_VACIAS);
  const [cargando, setCargando] = useState(false);

  const [filtros, setFiltros] = useState({
    anio: ANIO_ACTUAL,
    trimestre: TRIMESTRE_ACTUAL,
    mes: '',
    culto: ''
  });

  const cargarCultos = useCallback(async () => {
    try {
      const res = await cultoApi.listar();
      if (res.exito) {
        const lista = res.datos || [];
        setCultos(lista);
        if (!filtros.culto && lista.length > 0) {
          setFiltros((prev) => ({ ...prev, culto: lista[0].codigo }));
        }
      }
    } catch {
      notificarError('No se pudieron cargar los cultos.');
    }
  }, [filtros.culto]);

  const cargarEstadisticas = useCallback(async () => {
    if (!filtros.anio || !filtros.culto) return;

    setCargando(true);
    try {
      const params = {
        anio: filtros.anio,
        culto: filtros.culto
      };

      if (filtros.mes) {
        params.mes = filtros.mes;
      } else if (filtros.trimestre) {
        params.trimestre = filtros.trimestre;
      }

      const res = await asistenciaApi.obtenerEstadisticas(params);
      if (res.exito) {
        setEstadisticas(res.datos || ESTADISTICAS_VACIAS);
      } else {
        setEstadisticas(ESTADISTICAS_VACIAS);
      }
    } catch (error) {
      setEstadisticas(ESTADISTICAS_VACIAS);
      notificarError(error?.mensaje || 'No se pudieron cargar las estadísticas.');
    } finally {
      setCargando(false);
    }
  }, [filtros.anio, filtros.culto, filtros.mes, filtros.trimestre]);

  useEffect(() => {
    cargarCultos();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    cargarEstadisticas();
  }, [cargarEstadisticas]);

  const cambiarFiltro = (campo, valor) => {
    setFiltros((prev) => {
      if (campo === 'mes') {
        return {
          ...prev,
          mes: valor,
          trimestre: valor ? '' : prev.trimestre
        };
      }

      if (campo === 'trimestre') {
        return {
          ...prev,
          trimestre: valor,
          mes: valor ? '' : prev.mes
        };
      }

      return { ...prev, [campo]: valor };
    });
  };

  const serieAsistencia = estadisticas?.series?.asistencia_por_fecha || [];
  const maxSerie = useMemo(() => {
    if (serieAsistencia.length === 0) return 1;
    return Math.max(...serieAsistencia.map((item) => Number(item.total_asistentes || 0)), 1);
  }, [serieAsistencia]);

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-3">Estadísticas de Asistencia</h2>

      <div className="card shadow-sm mb-4">
        <div className="card-header">
          <h5 className="mb-0" style={{ color: '#FFFFFF' }}>Filtros del período</h5>
        </div>
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-3">
              <label htmlFor="estad-anio" className="form-label fw-semibold">Año</label>
              <select
                id="estad-anio"
                className="form-select"
                value={filtros.anio}
                onChange={(e) => cambiarFiltro('anio', e.target.value)}
              >
                {ANIO_OPCIONES.map((anio) => (
                  <option key={anio} value={anio}>{anio}</option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-3">
              <label htmlFor="estad-trimestre" className="form-label fw-semibold">Trimestre</label>
              <select
                id="estad-trimestre"
                className="form-select"
                value={filtros.trimestre}
                onChange={(e) => cambiarFiltro('trimestre', e.target.value)}
              >
                <option value="">Todos</option>
                {TRIMESTRE_OPCIONES.map((t) => (
                  <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-3">
              <label htmlFor="estad-mes" className="form-label fw-semibold">Mes</label>
              <select
                id="estad-mes"
                className="form-select"
                value={filtros.mes}
                onChange={(e) => cambiarFiltro('mes', e.target.value)}
              >
                <option value="">Todos</option>
                {MES_OPCIONES.map((m) => (
                  <option key={m.valor} value={m.valor}>{m.etiqueta}</option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-3">
              <label htmlFor="estad-culto" className="form-label fw-semibold">Culto (obligatorio)</label>
              <select
                id="estad-culto"
                className="form-select"
                value={filtros.culto}
                onChange={(e) => cambiarFiltro('culto', e.target.value)}
                required
              >
                <option value="" disabled>Seleccione un culto</option>
                {cultos.map((culto) => (
                  <option key={culto.codigo} value={culto.codigo}>
                    {formatearNombreCulto(culto.nombre, culto.codigo)}
                  </option>
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
            <i className="bi bi-lightbulb me-2"></i>
            {estadisticas.resumen_condensado || 'Seleccione filtros para visualizar estadísticas.'}
          </div>

          <div className="row g-3 mb-4">
            <div className="col-12 col-md-6 col-xl-3">
              <div className="card shadow-sm h-100 estad-kpi-card">
                <div className="card-body">
                  <span className="estad-kpi-label">Total de cultos registrados</span>
                  <div className="estad-kpi-valor">{estadisticas.resumen_general.total_cultos_registrados}</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <div className="card shadow-sm h-100 estad-kpi-card">
                <div className="card-body">
                  <span className="estad-kpi-label">Total de asistentes</span>
                  <div className="estad-kpi-valor">{estadisticas.resumen_general.total_asistentes}</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <div className="card shadow-sm h-100 estad-kpi-card">
                <div className="card-body">
                  <span className="estad-kpi-label">Promedio por culto</span>
                  <div className="estad-kpi-valor">{estadisticas.resumen_general.promedio_por_culto}</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <div className="card shadow-sm h-100 estad-kpi-card">
                <div className="card-body">
                  <span className="estad-kpi-label">Máximo y mínimo</span>
                  <div className="small mt-2">
                    <div><strong>Máximo:</strong> {estadisticas.resumen_general.maximo_asistentes}</div>
                    <div><strong>Mínimo:</strong> {estadisticas.resumen_general.minimo_asistentes}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-12 col-lg-4">
              <CardComparativa
                titulo="Composición de asistentes"
                izquierda={{
                  etiqueta: 'Niños',
                  cantidad: estadisticas.composicion_asistentes.ninos.cantidad,
                  porcentaje: estadisticas.composicion_asistentes.ninos.porcentaje
                }}
                derecha={{
                  etiqueta: 'Jóvenes',
                  cantidad: estadisticas.composicion_asistentes.jovenes.cantidad,
                  porcentaje: estadisticas.composicion_asistentes.jovenes.porcentaje
                }}
                colorIzquierda="bg-primary"
                colorDerecha="bg-secondary"
              />
            </div>
            <div className="col-12 col-lg-4">
              <CardComparativa
                titulo="Puntualidad"
                izquierda={{
                  etiqueta: 'Temprano',
                  cantidad: estadisticas.puntualidad.antes.cantidad,
                  porcentaje: estadisticas.puntualidad.antes.porcentaje
                }}
                derecha={{
                  etiqueta: 'Tarde',
                  cantidad: estadisticas.puntualidad.despues.cantidad,
                  porcentaje: estadisticas.puntualidad.despues.porcentaje
                }}
                colorIzquierda="bg-success"
                colorDerecha="bg-warning"
              />
            </div>
            <div className="col-12 col-lg-4">
              <CardComparativa
                titulo="Procedencia"
                izquierda={{
                  etiqueta: 'Barrio',
                  cantidad: estadisticas.procedencia.barrio.cantidad,
                  porcentaje: estadisticas.procedencia.barrio.porcentaje
                }}
                derecha={{
                  etiqueta: 'Guayabo',
                  cantidad: estadisticas.procedencia.guayabo.cantidad,
                  porcentaje: estadisticas.procedencia.guayabo.porcentaje
                }}
                colorIzquierda="bg-info"
                colorDerecha="bg-dark"
              />
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-12 col-xl-7">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h6 className="estad-card-titulo">Tendencia por fecha (asistentes)</h6>
                  {serieAsistencia.length === 0 && (
                    <p className="text-muted mb-0">Sin datos para el período seleccionado.</p>
                  )}
                  {serieAsistencia.length > 0 && (
                    <div className="estad-serie-scroll">
                      <div className="estad-serie">
                        {serieAsistencia.map((item) => (
                          <div
                            className="estad-serie-item"
                            key={item.fecha}
                            title={`${formatearFechaSerie(item.fecha)}: ${item.total_asistentes} asistentes`}
                          >
                            <div
                              className="estad-serie-barra"
                              style={{
                                height: `${Math.max((Number(item.total_asistentes || 0) / maxSerie) * 100, 6)}%`
                              }}
                            ></div>
                            <span className="estad-serie-label">{formatearEtiquetaSerie(item.fecha)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-12 col-xl-5">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h6 className="estad-card-titulo">Visitas del período</h6>
                  <div className="mb-3">
                    <span className="estad-kpi-label">Total de visitas</span>
                    <div className="estad-kpi-valor">{estadisticas.visitas.total_visitas}</div>
                  </div>

                  <div className="small fw-semibold mb-2">
                    Barrio: {estadisticas.visitas.barrio.cantidad} ({formatearPorcentaje(estadisticas.visitas.barrio.porcentaje)})
                  </div>
                  <div className="small fw-semibold mb-3">
                    Guayabo: {estadisticas.visitas.guayabo.cantidad} ({formatearPorcentaje(estadisticas.visitas.guayabo.porcentaje)})
                  </div>

                  <h6 className="estad-card-titulo mb-2">Top de nombres más repetidos</h6>
                  {estadisticas.visitas.top_nombres.length === 0 && (
                    <p className="text-muted mb-0">No hay nombres de visitas en este período.</p>
                  )}
                  {estadisticas.visitas.top_nombres.length > 0 && (
                    <div className="table-responsive">
                      <table className="table table-sm align-middle mb-0">
                        <thead>
                          <tr>
                            <th>Nombre</th>
                            <th className="text-end">Cantidad</th>
                          </tr>
                        </thead>
                        <tbody>
                          {estadisticas.visitas.top_nombres.map((item) => (
                            <tr key={item.nombre}>
                              <td>{item.nombre}</td>
                              <td className="text-end fw-semibold">{item.cantidad}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
