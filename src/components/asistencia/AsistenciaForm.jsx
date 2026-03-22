import { useEffect, useMemo, useState } from 'react';
import SelectorFecha from './SelectorFecha';
import {
  ETIQUETAS_SECCION,
  agruparMetricasPorSeccion,
  obtenerMetricasNumericasPorSeccion
} from '../../utils/metricasConfig';
import { OBSERVACIONES_MAX } from '../../validators/asistenciaValidator';

const FECHAS_REGISTRADAS_VACIAS = [];
const OBSERVACIONES_MAX_SALTOS = 3;
const SECCIONES_ORDEN = [
  'informacion_culto',
  'composicion_asistentes',
  'procedencia',
  'visitas',
  'permanencia',
  'total_asistentes',
  'adicionales',
  'observaciones'
];

function limitarSaltosObservaciones(valor) {
  const texto = String(valor ?? '').replace(/\r\n/g, '\n');
  const lineas = texto.split('\n');

  if (lineas.length <= OBSERVACIONES_MAX_SALTOS + 1) {
    return texto;
  }

  return lineas.slice(0, OBSERVACIONES_MAX_SALTOS + 1).join('\n');
}

function obtenerClaseCampo(metrica) {
  if (metrica.clave === 'observaciones') return 'col-12';
  if (metrica.clave.startsWith('nombres_visitas_')) return 'col-12';
  if (metrica.tipo === 'texto') return 'col-12 col-lg-6';
  if (metrica.clave === 'total_asistentes') return 'col-6 col-md-4';
  return 'col-6 col-md-4';
}

function campoTexto({ metrica, formulario, errores, cargando, onCambiarCampo }) {
  const esNombresVisitas = metrica.clave.startsWith('nombres_visitas_');
  const claseColumna = obtenerClaseCampo(metrica);

  if (metrica.clave === 'observaciones') {
    return (
      <div className={claseColumna} key={metrica.clave}>
        <label htmlFor={metrica.clave} className="form-label">
          {metrica.etiqueta}
          {metrica.obligatorio && <span className="text-danger ms-1">*</span>}
        </label>
        <textarea
          id={metrica.clave}
          name={metrica.clave}
          rows={3}
          className={`form-control asistencia-observaciones-textarea ${errores[metrica.clave] ? 'is-invalid' : ''}`}
          value={formulario.metricas?.[metrica.clave] ?? ''}
          onChange={(event) => onCambiarCampo(metrica.clave, limitarSaltosObservaciones(event.target.value))}
          disabled={cargando}
          placeholder={metrica.etiqueta}
          maxLength={OBSERVACIONES_MAX}
          aria-invalid={errores[metrica.clave] ? 'true' : 'false'}
        />
      </div>
    );
  }

  return (
    <div className={claseColumna} key={metrica.clave}>
      <label htmlFor={metrica.clave} className="form-label">
        {metrica.etiqueta}
        {metrica.obligatorio && <span className="text-danger ms-1">*</span>}
      </label>
      <input
        type="text"
        id={metrica.clave}
        name={metrica.clave}
        className={`form-control ${errores[metrica.clave] ? 'is-invalid' : ''}`}
        value={formulario.metricas?.[metrica.clave] ?? ''}
        onChange={(event) => onCambiarCampo(metrica.clave, event.target.value)}
        placeholder={esNombresVisitas ? 'Nombre 1, Nombre 2, Nombre 3' : metrica.etiqueta}
        disabled={cargando}
        aria-invalid={errores[metrica.clave] ? 'true' : 'false'}
      />
    </div>
  );
}

function campoNumero({
  metrica,
  formulario,
  errores,
  cargando,
  onCambiarCampo,
  totalAutoCalculado,
  permanenciaAuto
}) {
  const esTotal = metrica.clave === 'total_asistentes';
  const esPermanenciaAuto = Boolean(permanenciaAuto?.bloqueada)
    && permanenciaAuto?.clave === metrica.clave;
  const soloLectura = (esTotal && totalAutoCalculado) || esPermanenciaAuto;

  return (
    <div className={obtenerClaseCampo(metrica)} key={metrica.clave}>
      <label htmlFor={metrica.clave} className="form-label">
        {metrica.etiqueta}
        {metrica.obligatorio && <span className="text-danger ms-1">*</span>}
      </label>
      <input
        type="number"
        id={metrica.clave}
        name={metrica.clave}
        className={`form-control ${errores[metrica.clave] ? 'is-invalid' : ''} ${soloLectura ? 'bg-light fw-bold' : ''}`}
        value={formulario.metricas?.[metrica.clave] ?? ''}
        onChange={(event) => onCambiarCampo(metrica.clave, event.target.value)}
        min="0"
        placeholder="Cantidad"
        disabled={cargando || soloLectura}
        readOnly={soloLectura}
        aria-invalid={errores[metrica.clave] ? 'true' : 'false'}
      />
    </div>
  );
}

export default function AsistenciaForm({
  formulario,
  cultos,
  editandoId,
  errores,
  cargando,
  metricasActivas,
  fechasRegistradas = FECHAS_REGISTRADAS_VACIAS,
  clavePermanenciaAuto = null,
  permanenciaAutoBloqueada = false,
  onCambiarCampo,
  onGuardar,
  onLimpiar
}) {
  const grupos = useMemo(() => agruparMetricasPorSeccion(metricasActivas), [metricasActivas]);
  const metricasInfoCulto = useMemo(
    () => obtenerMetricasNumericasPorSeccion(metricasActivas, 'informacion_culto'),
    [metricasActivas]
  );
  const totalAutoCalculado = metricasInfoCulto.length > 0;
  const permanenciaAuto = {
    clave: clavePermanenciaAuto,
    bloqueada: permanenciaAutoBloqueada
  };
  const seccionesVisibles = useMemo(
    () => SECCIONES_ORDEN.filter((seccion) => (grupos[seccion] || []).length > 0),
    [grupos]
  );
  const [seccionActiva, setSeccionActiva] = useState(seccionesVisibles[0] || null);

  useEffect(() => {
    if (!formulario.culto_id) {
      setSeccionActiva(seccionesVisibles[0] || null);
      return;
    }

    if (!seccionesVisibles.length) {
      setSeccionActiva(null);
      return;
    }

    if (!seccionesVisibles.includes(seccionActiva)) {
      setSeccionActiva(seccionesVisibles[0]);
    }
  }, [formulario.culto_id, seccionActiva, seccionesVisibles]);

  const formatearNombreCulto = (nombre = '', codigo = '') => {
    const valor = nombre || codigo || '';
    if (!valor) return '';

    return valor
      .replace(/Sabado/gi, 'Sabado')
      .replace(/Miercoles/gi, 'Miercoles');
  };

  const manejarEnvio = (e) => {
    e.preventDefault();
    onGuardar();
  };

  const cultoSeleccionado = cultos.find((c) => String(c.id) === String(formulario.culto_id));
  const aDiaJs = (diaMysql) => {
    const dia = Number(diaMysql);
    if (!Number.isInteger(dia) || dia < 1 || dia > 7) return null;
    return dia === 1 ? 0 : dia - 1;
  };
  const diaPermitido = cultoSeleccionado ? aDiaJs(cultoSeleccionado.dia_semana) : null;
  const NOMBRES_DIA = {
    0: 'domingo',
    1: 'lunes',
    2: 'martes',
    3: 'miercoles',
    4: 'jueves',
    5: 'viernes',
    6: 'sabado'
  };

  const manejarCambioCulto = (e) => {
    const nuevoCultoId = e.target.value;
    onCambiarCampo('culto_id', nuevoCultoId);
    if (formulario.fecha && nuevoCultoId) {
      const nuevoCulto = cultos.find((c) => String(c.id) === String(nuevoCultoId));
      if (nuevoCulto) {
        const diaReq = aDiaJs(nuevoCulto.dia_semana);
        const [anio, mes, dia] = formulario.fecha.split('-').map(Number);
        const fecha = new Date(anio, mes - 1, dia);
        if (diaReq !== null && diaReq !== undefined && fecha.getDay() !== diaReq) {
          onCambiarCampo('fecha', '');
        }
      }
    }
  };

  const mostrarFormularioDetalle = Boolean(formulario.culto_id);
  const indiceSeccionActiva = seccionActiva ? seccionesVisibles.findIndex((item) => item === seccionActiva) : -1;
  const metricasSeccionActiva = seccionActiva ? grupos[seccionActiva] || [] : [];

  const cambiarSeccion = (direccion) => {
    if (!seccionesVisibles.length) return;
    const indiceActual = indiceSeccionActiva >= 0 ? indiceSeccionActiva : 0;
    const siguiente = (indiceActual + direccion + seccionesVisibles.length) % seccionesVisibles.length;
    setSeccionActiva(seccionesVisibles[siguiente]);
  };

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header">
        <h5 className="mb-0" style={{ color: '#FFFFFF' }}>
          {editandoId ? 'Editar registro de asistencia' : 'Nuevo registro de asistencia'}
        </h5>
      </div>
      <div className="card-body">
        <form onSubmit={manejarEnvio}>
          <div className="asistencia-top-grid">
            <div className="asistencia-top-card">
              <label htmlFor="culto_id" className="form-label">
                Culto <span className="text-danger">*</span>
              </label>
              <select
                id="culto_id"
                name="culto_id"
                className={`form-select ${errores.culto_id ? 'is-invalid' : ''}`}
                value={formulario.culto_id}
                onChange={manejarCambioCulto}
                disabled={cargando}
                aria-invalid={errores.culto_id ? 'true' : 'false'}
              >
                <option value="">-- Seleccionar culto --</option>
                {cultos.map((culto) => (
                  <option key={culto.id} value={culto.id}>
                    {formatearNombreCulto(culto.nombre, culto.codigo)} - {culto.hora_inicio?.substring(0, 5)}
                  </option>
                ))}
              </select>
            </div>

            {mostrarFormularioDetalle && (
              <div className="asistencia-top-card">
                <label htmlFor="fecha" className="form-label">
                  Fecha <span className="text-danger">*</span>
                </label>
                <SelectorFecha
                  value={formulario.fecha}
                  onChange={(valor) => onCambiarCampo('fecha', valor)}
                  diaPermitido={diaPermitido}
                  fechasDeshabilitadas={editandoId ? [] : fechasRegistradas}
                  disabled={cargando || !formulario.culto_id}
                  className={errores.fecha ? 'is-invalid' : ''}
                  placeholder="Seleccionar fecha"
                  nombreDia={NOMBRES_DIA[diaPermitido] || ''}
                />
              </div>
            )}
          </div>

          {!mostrarFormularioDetalle && (
            <div className="asistencia-empty-hint">
              Seleccione un culto para habilitar la fecha y avanzar por categorías.
            </div>
          )}

          {mostrarFormularioDetalle && (
            <>
              {seccionActiva && (
                <div className="asistencia-categoria-shell">
                  <div className="admin-info-switch asistencia-categoria-switch mb-3">
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm admin-info-arrow-btn"
                      onClick={() => cambiarSeccion(-1)}
                      aria-label="Ir a la categoría anterior"
                      disabled={cargando || seccionesVisibles.length < 2}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>

                    <div className="admin-info-switch-title asistencia-categoria-title">
                      <span className="badge text-bg-light border">{indiceSeccionActiva + 1} / {seccionesVisibles.length}</span>
                      <span>{ETIQUETAS_SECCION[seccionActiva] || seccionActiva}</span>
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm admin-info-arrow-btn"
                      onClick={() => cambiarSeccion(1)}
                      aria-label="Ir a la categoría siguiente"
                      disabled={cargando || seccionesVisibles.length < 2}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </div>

                  <div className="seccion-form asistencia-seccion-card">
                    <div className="asistencia-seccion-header">
                      <h6>{ETIQUETAS_SECCION[seccionActiva] || seccionActiva}</h6>
                      <span className="asistencia-seccion-meta">
                        {metricasSeccionActiva.length} campo{metricasSeccionActiva.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="row g-3 asistencia-seccion-grid">
                      {metricasSeccionActiva.map((metrica) => (
                        metrica.tipo === 'texto'
                          ? campoTexto({
                            metrica,
                            formulario,
                            errores,
                            cargando,
                            onCambiarCampo
                          })
                          : campoNumero({
                            metrica,
                            formulario,
                            errores,
                            cargando,
                            onCambiarCampo,
                            totalAutoCalculado,
                            permanenciaAuto
                          })
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {!seccionActiva && (
                <div className="asistencia-empty-hint">
                  No hay categorías activas para este registro.
                </div>
              )}

              <div className="d-flex flex-wrap gap-2 mt-3">
                <button
                  type="submit"
                  className="btn btn-primary px-4"
                  disabled={cargando}
                >
                  {cargando ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Guardando...
                    </>
                  ) : editandoId ? 'Actualizar' : 'Guardar'}
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={onLimpiar}
                  disabled={cargando}
                >
                  {editandoId ? 'Cancelar' : 'Limpiar'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
