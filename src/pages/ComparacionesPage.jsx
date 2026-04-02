import { useEffect, useMemo, useState } from 'react';
import { ANIO_OPCIONES, MES_OPCIONES } from '../config/constants';
import { EVENT_COMPARACIONES_ABRIR_DETALLE, EVENT_COMPARACIONES_ABRIR_TABLA, EVENT_COMPARACIONES_ABRIR_VISITAS } from '../config/events';
import { useComparaciones } from '../hooks/useComparaciones';

const COMPARACION_MODAL_ETIQUETAS_VACIAS = [];

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

function ComparacionToolbar({ resumen, onAbrirDetalle, onAbrirTabla, onAbrirVisitas }) {
  return (
    <div className="comparacion-toolbar mb-3">
      <div className="comparacion-toolbar-note" title={resumen}>
        <i className="bi bi-arrow-left-right" aria-hidden="true"></i>
        <span>{resumen}</span>
      </div>
      <div className="comparacion-toolbar-actions">
        <button
          type="button"
          className="btn btn-outline-primary btn-sm comparacion-toolbar-btn"
          onClick={onAbrirTabla}
          title="Ver tabla comparativa"
          aria-label="Ver tabla comparativa"
        >
          <i className="bi bi-table" aria-hidden="true"></i>
          <span className="comparacion-toolbar-btn-label">Tabla</span>
        </button>
        <button
          type="button"
          className="btn btn-outline-primary btn-sm comparacion-toolbar-btn"
          onClick={onAbrirDetalle}
          title="Ver detalles generales"
          aria-label="Ver detalles generales"
        >
          <i className="bi bi-grid-1x2" aria-hidden="true"></i>
          <span className="comparacion-toolbar-btn-label">Generales</span>
        </button>
        <button
          type="button"
          className="btn btn-outline-primary btn-sm comparacion-toolbar-btn"
          onClick={onAbrirVisitas}
          title="Ver top nombres de visitas"
          aria-label="Ver top nombres de visitas"
        >
          <i className="bi bi-people" aria-hidden="true"></i>
          <span className="comparacion-toolbar-btn-label">Visitas</span>
        </button>
      </div>
    </div>
  );
}

function ComparacionModalBase({ visible, onClose, titulo, etiquetas = COMPARACION_MODAL_ETIQUETAS_VACIAS, children, anchoClase = '' }) {
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
    <div className="estad-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="comparacion-modal-title">
      <button
        type="button"
        className="estad-modal-dismiss"
        onClick={onClose}
        aria-label={`Cerrar ${titulo.toLowerCase()}`}
      />
      <div className={`estad-modal-iasd comparacion-modal ${anchoClase}`.trim()}>
        <div className="estad-modal-head">
          <div className="estad-modal-head-main">
            <h5 id="comparacion-modal-title" className="mb-0">{titulo}</h5>
            {etiquetas.length > 0 && (
              <div className="estad-modal-head-tags">
                {etiquetas.map((etiqueta) => (
                  <span key={etiqueta} className="estad-modal-head-chip">{etiqueta}</span>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm comparacion-modal-close"
            onClick={onClose}
            aria-label={`Cerrar ${titulo.toLowerCase()}`}
          >
            <i className="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </div>

        <div className="estad-modal-body comparacion-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

function ComparacionDetalleModal({
  visible,
  onClose,
  etiquetaPeriodoA,
  etiquetaPeriodoB,
  cultoSeleccionado,
  periodoA,
  periodoB
}) {
  return (
    <ComparacionModalBase
      visible={visible}
      onClose={onClose}
      titulo="Detalles generales"
      etiquetas={[etiquetaPeriodoA, etiquetaPeriodoB, cultoSeleccionado || 'Culto seleccionado']}
    >
      <div className="row g-3">
        <div className="col-12 col-xl-6">
          <ResumenPeriodo titulo={etiquetaPeriodoA} estadisticas={periodoA} />
        </div>
        <div className="col-12 col-xl-6">
          <ResumenPeriodo titulo={etiquetaPeriodoB} estadisticas={periodoB} />
        </div>
      </div>
    </ComparacionModalBase>
  );
}

function ComparacionTopNombresModal({
  visible,
  onClose,
  etiquetaPeriodoA,
  etiquetaPeriodoB,
  cultoSeleccionado,
  topNombresComparados
}) {
  return (
    <ComparacionModalBase
      visible={visible}
      onClose={onClose}
      titulo="Top nombres de visitas"
      etiquetas={[etiquetaPeriodoA, etiquetaPeriodoB, cultoSeleccionado || 'Culto seleccionado']}
      anchoClase="comparacion-modal-narrow"
    >
      {topNombresComparados.length === 0 && (
        <div className="comparacion-empty-state">
          No hay nombres de visitas para los períodos seleccionados.
        </div>
      )}

      {topNombresComparados.length > 0 && (
        <div className="table-responsive comparacion-table-scroll-x">
          <div className="comparacion-table-scroll-y comparacion-topnombres-scroll">
            <table className="table table-sm align-middle mb-0 comparacion-tabla comparacion-topnombres-tabla">
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
        </div>
      )}
    </ComparacionModalBase>
  );
}

function ComparacionTablaModal({
  visible,
  onClose,
  etiquetaPeriodoA,
  etiquetaPeriodoB,
  indicadores
}) {
  return (
    <ComparacionModalBase
      visible={visible}
      onClose={onClose}
      titulo="Tabla comparativa"
      etiquetas={[etiquetaPeriodoA, etiquetaPeriodoB]}
    >
      <div className="table-responsive comparacion-table-scroll-x">
        <div className="comparacion-table-scroll-y comparacion-table-scroll-y-expanded">
          <table className="table table-hover align-middle mb-0 comparacion-tabla comparacion-indicadores-tabla">
            <thead>
              <tr>
                <th>Indicador</th>
                <th className="text-end">{etiquetaPeriodoA}</th>
                <th className="text-end">{etiquetaPeriodoB}</th>
                <th className="text-end">Diferencia</th>
                <th className="text-end">Variación</th>
              </tr>
            </thead>
            <tbody>
              {indicadores.map((item) => (
                <tr key={`modal-${item.id}`}>
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
    </ComparacionModalBase>
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
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [mostrarVisitas, setMostrarVisitas] = useState(false);
  const [mostrarTabla, setMostrarTabla] = useState(false);

  const resumenComparacion = useMemo(() => {
    const base = `${etiquetaPeriodoA} vs ${etiquetaPeriodoB}`;
    return cultoSeleccionado ? `${base} para ${cultoSeleccionado}` : base;
  }, [cultoSeleccionado, etiquetaPeriodoA, etiquetaPeriodoB]);

  useEffect(() => {
    const manejarAbrirDetalle = () => setMostrarDetalle(true);
    const manejarAbrirTabla = () => setMostrarTabla(true);
    const manejarAbrirVisitas = () => setMostrarVisitas(true);

    window.addEventListener(EVENT_COMPARACIONES_ABRIR_DETALLE, manejarAbrirDetalle);
    window.addEventListener(EVENT_COMPARACIONES_ABRIR_TABLA, manejarAbrirTabla);
    window.addEventListener(EVENT_COMPARACIONES_ABRIR_VISITAS, manejarAbrirVisitas);

    return () => {
      window.removeEventListener(EVENT_COMPARACIONES_ABRIR_DETALLE, manejarAbrirDetalle);
      window.removeEventListener(EVENT_COMPARACIONES_ABRIR_TABLA, manejarAbrirTabla);
      window.removeEventListener(EVENT_COMPARACIONES_ABRIR_VISITAS, manejarAbrirVisitas);
    };
  }, []);

  return (
    <div className="container-fluid py-4">
      <div className="card shadow-sm mb-4 comparacion-filtros-card">
        <div className="card-body">
          <ComparacionToolbar
            resumen={resumenComparacion}
            onAbrirDetalle={() => setMostrarDetalle(true)}
            onAbrirTabla={() => setMostrarTabla(true)}
            onAbrirVisitas={() => setMostrarVisitas(true)}
          />

          <div className="row g-3 align-items-end">
            <div className="col-12 col-xl-4">
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

            <div className="col-4 col-md-2 col-xl-2">
              <label htmlFor="comp-anio-a" className="form-label fw-semibold">Año A</label>
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
            <div className="col-8 col-md-4 col-xl-2">
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

            <div className="col-4 col-md-2 col-xl-2">
              <label htmlFor="comp-anio-b" className="form-label fw-semibold">Año B</label>
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
            <div className="col-8 col-md-4 col-xl-2">
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
          <ComparacionDetalleModal
            visible={mostrarDetalle}
            onClose={() => setMostrarDetalle(false)}
            etiquetaPeriodoA={etiquetaPeriodoA}
            etiquetaPeriodoB={etiquetaPeriodoB}
            cultoSeleccionado={cultoSeleccionado}
            periodoA={periodoA}
            periodoB={periodoB}
          />

          <ComparacionTopNombresModal
            visible={mostrarVisitas}
            onClose={() => setMostrarVisitas(false)}
            etiquetaPeriodoA={etiquetaPeriodoA}
            etiquetaPeriodoB={etiquetaPeriodoB}
            cultoSeleccionado={cultoSeleccionado}
            topNombresComparados={topNombresComparados}
          />

          <ComparacionTablaModal
            visible={mostrarTabla}
            onClose={() => setMostrarTabla(false)}
            etiquetaPeriodoA={etiquetaPeriodoA}
            etiquetaPeriodoB={etiquetaPeriodoB}
            indicadores={indicadores}
          />
        </>
      )}
    </div>
  );
}


