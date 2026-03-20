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

function campoTexto({
  metrica,
  formulario,
  errores,
  cargando,
  onCambiarCampo
}) {
  const esNombresVisitas = metrica.clave.startsWith('nombres_visitas_');

  if (metrica.clave === 'observaciones') {
    return (
      <div className="col-12" key={metrica.clave}>
        <label htmlFor={metrica.clave} className="form-label">
          {metrica.etiqueta}
          {metrica.obligatorio && <span className="text-danger ms-1">*</span>}
        </label>
        <textarea
          id={metrica.clave}
          name={metrica.clave}
          rows={4}
          className={`form-control asistencia-observaciones-textarea ${errores[metrica.clave] ? 'is-invalid' : ''}`}
          value={formulario.metricas?.[metrica.clave] ?? ''}
          onChange={(event) => onCambiarCampo(metrica.clave, limitarSaltosObservaciones(event.target.value))}
          disabled={cargando}
          placeholder={metrica.etiqueta}
          maxLength={OBSERVACIONES_MAX}
        />
        {errores[metrica.clave] && (
          <div className="invalid-feedback d-block">{errores[metrica.clave]}</div>
        )}
      </div>
    );
  }

  return (
    <div className="col-md-6 col-lg-4" key={metrica.clave}>
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
      />
      {errores[metrica.clave] && (
        <div className="invalid-feedback">{errores[metrica.clave]}</div>
      )}
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
    <div className={esTotal ? 'col-md-6' : 'col-md-6 col-lg-4'} key={metrica.clave}>
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
      />
      {soloLectura && (
        <small className="text-muted">
          {esTotal
            ? 'Se calcula automáticamente desde Información del culto.'
            : 'Se calcula automáticamente para completar Permanencia.'}
        </small>
      )}
      {errores[metrica.clave] && (
        <div className="invalid-feedback">{errores[metrica.clave]}</div>
      )}
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
  const grupos = agruparMetricasPorSeccion(metricasActivas);
  const metricasInfoCulto = obtenerMetricasNumericasPorSeccion(metricasActivas, 'informacion_culto');
  const totalAutoCalculado = metricasInfoCulto.length > 0;
  const permanenciaAuto = {
    clave: clavePermanenciaAuto,
    bloqueada: permanenciaAutoBloqueada
  };

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

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header">
        <h5 className="mb-0" style={{ color: '#FFFFFF' }}>
          {editandoId ? 'Editar Registro de Asistencia' : 'Nuevo Registro de Asistencia'}
        </h5>
      </div>
      <div className="card-body">
        <form onSubmit={manejarEnvio}>
          <div className="seccion-form">
            <div className="row g-3">
              <div className="col-md-6">
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
                >
                  <option value="">-- Seleccionar culto --</option>
                  {cultos.map((culto) => (
                    <option key={culto.id} value={culto.id}>
                      {formatearNombreCulto(culto.nombre, culto.codigo)} - {culto.hora_inicio?.substring(0, 5)}
                    </option>
                  ))}
                </select>
                {errores.culto_id && <div className="invalid-feedback">{errores.culto_id}</div>}
              </div>

              <div className="col-md-6">
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
                  placeholder={!formulario.culto_id ? 'Seleccione un culto primero' : 'Seleccionar fecha'}
                  nombreDia={NOMBRES_DIA[diaPermitido] || ''}
                />
                {errores.fecha && (
                  <div className="invalid-feedback d-block">{errores.fecha}</div>
                )}
              </div>
            </div>
          </div>

          {SECCIONES_ORDEN.map((seccion) => {
            const metricas = grupos[seccion] || [];
            if (metricas.length === 0) return null;

            return (
              <div className="seccion-form" key={seccion}>
                <h6>{ETIQUETAS_SECCION[seccion] || seccion}</h6>
                <div className="row g-3">
                  {metricas.map((metrica) => (
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
            );
          })}

          <div className="d-flex gap-2 mt-3">
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
        </form>
      </div>
    </div>
  );
}
