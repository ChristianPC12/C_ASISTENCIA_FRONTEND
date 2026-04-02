import { useCallback, useEffect, useMemo, useState } from 'react';
import asistenciaApi from '../api/asistenciaApi';
import cultoApi from '../api/cultoApi';
import { ANIO_ACTUAL, ANIO_OPCIONES, TRIMESTRE_OPCIONES, MES_OPCIONES } from '../config/constants';
import { notificarError } from '../utils/notify';
import { useSetupStatus } from '../hooks/useSetupStatus';

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
  metricas_dinamicas: [],
  resumen_condensado: ''
};

function formatearNombreCulto(nombre = '', codigo = '') {
  const valor = nombre || codigo || '';
  return valor
    .replace(/Sábado/gi, 'Sábado')
    .replace(/Miércoles/gi, 'Miércoles');
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
            />
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function EstadisticasFiltrosCard({
  filtros,
  cultos,
  onCambiarFiltro,
  resumenCondensado,
  resumenGeneral,
  onAbrirDetalle
}) {
  return (
    <div className="card shadow-sm mb-3 estad-filtros-card">
      <div className="card-body">
        <div className="estad-toolbar mb-3">
          <div className="estad-toolbar-note" title={resumenCondensado || 'Seleccione filtros para visualizar estadísticas.'}>
            <i className="bi bi-lightbulb" aria-hidden="true"></i>
            <span>{resumenCondensado || 'Seleccione filtros para visualizar estadísticas.'}</span>
          </div>
          <div className="estad-toolbar-actions">
            <button
              type="button"
              className="btn btn-outline-primary btn-sm estad-toolbar-btn"
              onClick={onAbrirDetalle}
              title="Ver detalle estadístico"
              aria-label="Ver detalle estadístico"
            >
              <i className="bi bi-layout-text-sidebar-reverse" aria-hidden="true"></i>
              <span className="estad-toolbar-btn-label">Detalle</span>
            </button>
          </div>
        </div>

        <div className="estad-toolbar-kpis mb-3" role="group" aria-label="Resumen del período">
          <div className="estad-toolbar-kpi">
            <span className="estad-toolbar-kpi-label">Cultos</span>
            <strong className="estad-toolbar-kpi-value">{resumenGeneral.total_cultos_registrados}</strong>
          </div>
          <div className="estad-toolbar-kpi">
            <span className="estad-toolbar-kpi-label">Asistentes</span>
            <strong className="estad-toolbar-kpi-value">{resumenGeneral.total_asistentes}</strong>
          </div>
          <div className="estad-toolbar-kpi">
            <span className="estad-toolbar-kpi-label">Promedio</span>
            <strong className="estad-toolbar-kpi-value">{resumenGeneral.promedio_por_culto}</strong>
          </div>
          <div className="estad-toolbar-kpi">
            <span className="estad-toolbar-kpi-label">Máx. / Mín.</span>
            <strong className="estad-toolbar-kpi-value">
              {resumenGeneral.maximo_asistentes} / {resumenGeneral.minimo_asistentes}
            </strong>
          </div>
        </div>

        <div className="row g-3 align-items-end">
          <div className="col-4 col-md-2">
            <label htmlFor="estad-anio" className="form-label fw-semibold">Año</label>
            <select
              id="estad-anio"
              className="form-select"
              value={filtros.anio}
              onChange={(event) => onCambiarFiltro('anio', event.target.value)}
            >
              {ANIO_OPCIONES.map((anio) => (
                <option key={anio} value={anio}>{anio}</option>
              ))}
            </select>
          </div>

          <div className="col-8 col-md-4">
            <label htmlFor="estad-trimestre" className="form-label fw-semibold">Trimestre</label>
            <select
              id="estad-trimestre"
              className="form-select"
              value={filtros.trimestre}
              onChange={(event) => onCambiarFiltro('trimestre', event.target.value)}
            >
              <option value="">Todos</option>
              {TRIMESTRE_OPCIONES.map((trimestre) => (
                <option key={trimestre.valor} value={trimestre.valor}>{trimestre.etiqueta}</option>
              ))}
            </select>
          </div>

          <div className="col-4 col-md-2">
            <label htmlFor="estad-mes" className="form-label fw-semibold">Mes</label>
            <select
              id="estad-mes"
              className="form-select"
              value={filtros.mes}
              onChange={(event) => onCambiarFiltro('mes', event.target.value)}
            >
              <option value="">Todos</option>
              {MES_OPCIONES.map((mes) => (
                <option key={mes.valor} value={mes.valor}>{mes.etiqueta}</option>
              ))}
            </select>
          </div>

          <div className="col-8 col-md-4">
            <label htmlFor="estad-culto" className="form-label fw-semibold">Culto</label>
            <select
              id="estad-culto"
              className="form-select"
              value={filtros.culto}
              onChange={(event) => onCambiarFiltro('culto', event.target.value)}
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
  );
}

function EstadisticasKpisRow({ resumenGeneral }) {
  return (
    <div className="row g-2 mb-3 estad-kpi-grid">
      <div className="col-12 col-md-6 col-xl-3">
        <div className="card shadow-sm h-100 estad-kpi-card estad-kpi-card-compact">
          <div className="card-body">
            <span className="estad-kpi-label">Total de cultos registrados</span>
            <div className="estad-kpi-valor">{resumenGeneral.total_cultos_registrados}</div>
          </div>
        </div>
      </div>
      <div className="col-12 col-md-6 col-xl-3">
        <div className="card shadow-sm h-100 estad-kpi-card estad-kpi-card-compact">
          <div className="card-body">
            <span className="estad-kpi-label">Total de asistentes</span>
            <div className="estad-kpi-valor">{resumenGeneral.total_asistentes}</div>
          </div>
        </div>
      </div>
      <div className="col-12 col-md-6 col-xl-3">
        <div className="card shadow-sm h-100 estad-kpi-card estad-kpi-card-compact">
          <div className="card-body">
            <span className="estad-kpi-label">Promedio por culto</span>
            <div className="estad-kpi-valor">{resumenGeneral.promedio_por_culto}</div>
          </div>
        </div>
      </div>
      <div className="col-12 col-md-6 col-xl-3">
        <div className="card shadow-sm h-100 estad-kpi-card estad-kpi-card-compact">
          <div className="card-body">
            <span className="estad-kpi-label">Máximo y mínimo</span>
            <div className="estad-kpi-split mt-2">
              <div><strong>Máx.</strong> {resumenGeneral.maximo_asistentes}</div>
              <div><strong>Mín.</strong> {resumenGeneral.minimo_asistentes}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EstadisticasComparativasRow({ estadisticas }) {
  return (
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
  );
}

function EstadisticasSerieCard({ serieAsistencia, maxSerie }) {
  return (
    <div className="card shadow-sm h-100">
      <div className="card-body d-flex flex-column">
        <h6 className="estad-card-titulo">Tendencia por fecha (asistentes)</h6>
        {serieAsistencia.length === 0 && (
          <p className="text-muted mb-0">Sin datos para el período seleccionado.</p>
        )}
        {serieAsistencia.length > 0 && (
          <div className="estad-serie-scroll mt-auto">
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
                  />
                  <span className="estad-serie-label">{formatearEtiquetaSerie(item.fecha)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EstadisticasVisitasCard({ visitas }) {
  return (
    <div className="card shadow-sm h-100">
      <div className="card-body">
        <h6 className="estad-card-titulo">Visitas del período</h6>
        <div className="estad-visitas-resumen mb-3">
          <div className="estad-visitas-chip">
            <span className="estad-visitas-chip-label">Total</span>
            <strong className="estad-visitas-chip-value">{visitas.total_visitas}</strong>
          </div>
          <div className="estad-visitas-chip">
            <span className="estad-visitas-chip-label">Barrio</span>
            <strong className="estad-visitas-chip-value">
              {visitas.barrio.cantidad} <small>({formatearPorcentaje(visitas.barrio.porcentaje)})</small>
            </strong>
          </div>
          <div className="estad-visitas-chip">
            <span className="estad-visitas-chip-label">Guayabo</span>
            <strong className="estad-visitas-chip-value">
              {visitas.guayabo.cantidad} <small>({formatearPorcentaje(visitas.guayabo.porcentaje)})</small>
            </strong>
          </div>
        </div>

        <h6 className="estad-card-titulo mb-2">Top de nombres más repetidos</h6>
        {visitas.top_nombres.length === 0 && (
          <p className="text-muted mb-0">No hay nombres de visitas en este período.</p>
        )}
        {visitas.top_nombres.length > 0 && (
          <div className="table-responsive estad-visitas-table-scroll-x">
            <div className="estad-visitas-table-wrap">
              <table className="table table-sm align-middle mb-0 estad-visitas-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th className="text-end">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {visitas.top_nombres.map((item) => (
                    <tr key={item.nombre}>
                      <td>{item.nombre}</td>
                      <td className="text-end fw-semibold">{item.cantidad}</td>
                    </tr>
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

function EstadisticasDetalleModal({
  visible,
  onClose,
  estadisticas,
  serieAsistencia,
  maxSerie,
  cultoNombre
}) {
  useEffect(() => {
    if (!visible) return undefined;

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
  }, [visible, onClose]);

  if (!visible) {
    return null;
  }

  return (
    <div className="estad-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="estad-detalle-title">
      <button
        type="button"
        className="estad-modal-dismiss"
        onClick={onClose}
        aria-label="Cerrar detalle estadístico"
      />
      <div className="estad-modal-iasd">
        <div className="estad-modal-head">
          <div className="estad-modal-head-main">
            <h5 id="estad-detalle-title" className="mb-0">Detalle estadístico</h5>
            <div className="estad-modal-head-tags">
              <span className="estad-modal-head-chip">{cultoNombre || 'Culto seleccionado'}</span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={onClose}
            aria-label="Cerrar detalle estadístico"
          >
            <i className="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </div>

        <div className="estad-modal-body">
          <div className="row g-3 mb-3">
            <div className="col-12 col-xl-4">
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
            <div className="col-12 col-xl-4">
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
            <div className="col-12 col-xl-4">
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

          <div className="row g-3">
            <div className="col-12 col-xl-7">
              <EstadisticasSerieCard
                serieAsistencia={serieAsistencia}
                maxSerie={maxSerie}
              />
            </div>
            <div className="col-12 col-xl-5">
              <EstadisticasVisitasCard visitas={estadisticas.visitas} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EstadisticasMetricasDinamicasCard({ metricasDinamicas, mapaEtiquetasMetricas }) {
  return (
    <div className="card shadow-sm estad-metricas-card">
      <div className="card-body p-0">
        {metricasDinamicas.length === 0 && (
          <div className="p-3 text-muted">
            No hay métricas dinámicas numéricas para este período.
          </div>
        )}
        {metricasDinamicas.length > 0 && (
          <div className="table-responsive estad-metricas-table-scroll-x">
            <div className="estad-metricas-table-wrap">
              <table className="table table-sm align-middle mb-0 estad-metricas-table">
                <thead>
                  <tr>
                    <th>Métrica</th>
                    <th className="text-end">Suma</th>
                    <th className="text-end">Promedio</th>
                    <th className="text-end">Máximo</th>
                    <th className="text-end">Mínimo</th>
                    <th className="text-end">Registros</th>
                  </tr>
                </thead>
                <tbody>
                  {metricasDinamicas.map((item) => (
                    <tr key={item.clave}>
                      <td className="fw-semibold">{mapaEtiquetasMetricas[item.clave] || item.clave}</td>
                      <td className="text-end">{Number(item.suma || 0).toLocaleString('es-CR')}</td>
                      <td className="text-end">{Number(item.promedio || 0).toLocaleString('es-CR')}</td>
                      <td className="text-end">{Number(item.maximo || 0).toLocaleString('es-CR')}</td>
                      <td className="text-end">{Number(item.minimo || 0).toLocaleString('es-CR')}</td>
                      <td className="text-end">{Number(item.registros || 0).toLocaleString('es-CR')}</td>
                    </tr>
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

export default function EstadisticasPage() {
  const { metricasActivas } = useSetupStatus();

  const [cultos, setCultos] = useState([]);
  const [estadisticas, setEstadisticas] = useState(ESTADISTICAS_VACIAS);
  const [cargando, setCargando] = useState(false);
  const [detalleVisible, setDetalleVisible] = useState(false);
  const [filtros, setFiltros] = useState({
    anio: ANIO_ACTUAL,
    trimestre: TRIMESTRE_ACTUAL,
    mes: '',
    culto: ''
  });

  const cargarCultos = useCallback(async () => {
    try {
      const res = await cultoApi.listar();
      if (!res.exito) return;

      const lista = res.datos || [];
      setCultos(lista);
      setFiltros((prev) => {
        if (prev.culto || lista.length === 0) return prev;
        return { ...prev, culto: lista[0].codigo };
      });
    } catch {
      notificarError('No se pudieron cargar los cultos.');
    }
  }, []);

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
  }, [cargarCultos]);

  useEffect(() => {
    cargarEstadisticas();
  }, [cargarEstadisticas]);

  const cambiarFiltro = useCallback((campo, valor) => {
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
  }, []);

  const serieAsistencia = estadisticas?.series?.asistencia_por_fecha || [];
  const metricasDinamicas = estadisticas?.metricas_dinamicas || [];
  const cultoSeleccionado = cultos.find((item) => item.codigo === filtros.culto);

  const mapaEtiquetasMetricas = useMemo(() => {
    return metricasActivas.reduce((acc, item) => {
      acc[item.clave] = item.etiqueta || item.clave;
      return acc;
    }, {});
  }, [metricasActivas]);

  const maxSerie = useMemo(() => {
    if (serieAsistencia.length === 0) return 1;
    return Math.max(...serieAsistencia.map((item) => Number(item.total_asistentes || 0)), 1);
  }, [serieAsistencia]);

  return (
    <div className="container-fluid py-4">
      <EstadisticasFiltrosCard
        filtros={filtros}
        cultos={cultos}
        onCambiarFiltro={cambiarFiltro}
        resumenCondensado={estadisticas.resumen_condensado}
        resumenGeneral={estadisticas.resumen_general}
        onAbrirDetalle={() => setDetalleVisible(true)}
      />

      {cargando && (
        <div className="text-center py-4">
          <div className="spinner-border spinner-iasd" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      )}

      {!cargando && (
        <>
          <EstadisticasMetricasDinamicasCard
            metricasDinamicas={metricasDinamicas}
            mapaEtiquetasMetricas={mapaEtiquetasMetricas}
          />

          <EstadisticasDetalleModal
            visible={detalleVisible}
            onClose={() => setDetalleVisible(false)}
            estadisticas={estadisticas}
            serieAsistencia={serieAsistencia}
            maxSerie={maxSerie}
            cultoNombre={formatearNombreCulto(cultoSeleccionado?.nombre, cultoSeleccionado?.codigo)}
          />
        </>
      )}
    </div>
  );
}



