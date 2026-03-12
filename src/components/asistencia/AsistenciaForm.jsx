import { CULTO_DIA_SEMANA } from '../../config/constants';
import SelectorFecha from './SelectorFecha';
import { ETIQUETAS_SECCION, agruparMetricasPorSeccion, obtenerParPuntualidad } from '../../utils/metricasConfig';

const FECHAS_REGISTRADAS_VACIAS = [];
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

function campoTexto({
  metrica,
  formulario,
  errores,
  cargando,
  onCambiarCampo
}) {
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
          rows={3}
          className={`form-control ${errores[metrica.clave] ? 'is-invalid' : ''}`}
          value={formulario.metricas?.[metrica.clave] ?? ''}
          onChange={(event) => onCambiarCampo(metrica.clave, event.target.value)}
          disabled={cargando}
          placeholder={metrica.etiqueta}
          maxLength={1000}
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
        placeholder={metrica.etiqueta}
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
  totalAutoCalculado
}) {
  const esTotal = metrica.clave === 'total_asistentes';
  const soloLectura = esTotal && totalAutoCalculado;

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
        <small className="text-muted">Se calcula automaticamente desde puntualidad.</small>
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
  onCambiarCampo,
  onGuardar,
  onLimpiar
}) {
  const grupos = agruparMetricasPorSeccion(metricasActivas);
  const parPuntualidad = obtenerParPuntualidad(metricasActivas);
  const totalAutoCalculado = !!(parPuntualidad.antes && parPuntualidad.despues);

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
  const diaPermitido = cultoSeleccionado ? CULTO_DIA_SEMANA[cultoSeleccionado.codigo] : null;
  const NOMBRES_DIA = { 0: 'domingo', 3: 'miercoles', 6: 'sabado' };

  const manejarCambioCulto = (e) => {
    const nuevoCultoId = e.target.value;
    onCambiarCampo('culto_id', nuevoCultoId);
    if (formulario.fecha && nuevoCultoId) {
      const nuevoCulto = cultos.find((c) => String(c.id) === String(nuevoCultoId));
      if (nuevoCulto) {
        const diaReq = CULTO_DIA_SEMANA[nuevoCulto.codigo];
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
            <h6>Información del culto</h6>
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
                        totalAutoCalculado
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
