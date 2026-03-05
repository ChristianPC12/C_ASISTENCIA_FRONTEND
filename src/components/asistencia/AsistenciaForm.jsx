/**
 * Formulario de registro de asistencia
 * Props:
 *  - formulario: objeto con los datos del formulario
 *  - cultos: array de cultos disponibles
 *  - editandoId: ID del registro en edicion (null si es nuevo)
 *  - errores: objeto con errores por campo
 *  - cargando: boolean
 *  - onCambiarCampo: funcion (campo, valor)
 *  - onGuardar: funcion para guardar
 *  - onLimpiar: funcion para limpiar el formulario
 */
import { CULTO_DIA_SEMANA } from '../../config/constants';
import { OBSERVACIONES_MAX } from '../../validators/asistenciaValidator';
import SelectorFecha from './SelectorFecha';

/** Valor por defecto estable para evitar nueva referencia en cada render */
const FECHAS_REGISTRADAS_VACIAS = [];

export default function AsistenciaForm({
  formulario,
  cultos,
  editandoId,
  errores,
  cargando,
  fechasRegistradas = FECHAS_REGISTRADAS_VACIAS,
  onCambiarCampo,
  onGuardar,
  onLimpiar
}) {
  const formatearNombreCulto = (nombre = '', codigo = '') => {
    const valor = nombre || codigo || '';
    if (!valor) return '';

    return valor
      .replace(/Sabado/gi, 'Sábado')
      .replace(/Miercoles/gi, 'Miércoles');
  };

  const manejarEnvio = (e) => {
    e.preventDefault();
    onGuardar();
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    onCambiarCampo(name, value);
  };

  // Obtener el culto seleccionado y su dia de la semana permitido
  const cultoSeleccionado = cultos.find(c => String(c.id) === String(formulario.culto_id));
  const diaPermitido = cultoSeleccionado ? CULTO_DIA_SEMANA[cultoSeleccionado.codigo] : null;

  // Nombres de dias para el mensaje de error
  const NOMBRES_DIA = { 0: 'domingo', 3: 'miércoles', 6: 'sábado' };

  // Al cambiar culto, limpiar la fecha si ya no corresponde al dia
  const manejarCambioCulto = (e) => {
    const nuevoCultoId = e.target.value;
    onCambiarCampo('culto_id', nuevoCultoId);
    // Si hay fecha seleccionada, validar que siga siendo correcta
    if (formulario.fecha && nuevoCultoId) {
      const nuevoCulto = cultos.find(c => String(c.id) === String(nuevoCultoId));
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

  // Campos obligatorios (se muestran con asterisco)
  const camposObligatorios = new Set([
    'culto_id', 'fecha',
    'llegaron_antes_hora', 'llegaron_despues_hora',
    'proc_barrio', 'proc_guayabo'
  ]);

  // Renderizar un campo numérico
  const campoNumerico = (nombre, etiqueta, colClase = 'col-md-6 col-lg-4') => (
    <div className={colClase}>
      <label htmlFor={nombre} className="form-label">
        {etiqueta}
        {camposObligatorios.has(nombre) && <span className="text-danger ms-1">*</span>}
      </label>
      <input
        type="number"
        id={nombre}
        name={nombre}
        className={`form-control ${errores[nombre] ? 'is-invalid' : ''}`}
        value={formulario[nombre]}
        onChange={manejarCambio}
        min="0"
        placeholder="Cantidad"
        disabled={cargando}
      />
      {errores[nombre] && (
        <div className="invalid-feedback">{errores[nombre]}</div>
      )}
    </div>
  );

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header">
        <h5 className="mb-0" style={{ color: '#FFFFFF' }}>
          {editandoId ? 'Editar Registro de Asistencia' : 'Nuevo Registro de Asistencia'}
        </h5>
      </div>
      <div className="card-body">
        <form onSubmit={manejarEnvio}>

          {/* Sección: Información del culto */}
          <div className="seccion-form">
            <h6>Información del Culto</h6>
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="culto_id" className="form-label">Culto <span className="text-danger">*</span></label>
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
                {errores.culto_id && (
                  <div className="invalid-feedback">{errores.culto_id}</div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="fecha" className="form-label">Fecha <span className="text-danger">*</span></label>
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

          {/* Sección: Puntualidad */}
          <div className="seccion-form">
            <h6>Puntualidad</h6>
            <div className="row g-3">
              {campoNumerico('llegaron_antes_hora', 'Llegaron antes de la hora', 'col-md-6')}
              {campoNumerico('llegaron_despues_hora', 'Llegaron después de la hora', 'col-md-6')}
            </div>
          </div>

          {/* Sección: Composición */}
          <div className="seccion-form">
            <h6>Composición de Asistentes</h6>
            <div className="row g-3">
              {campoNumerico('ninos', 'Niños', 'col-md-6')}
              {campoNumerico('jovenes', 'Jóvenes', 'col-md-6')}
            </div>
          </div>

          {/* Sección: Procedencia */}
          <div className="seccion-form">
            <h6>Procedencia</h6>
            <div className="row g-3">
              {campoNumerico('proc_barrio', 'Procedentes del barrio', 'col-md-6')}
              {campoNumerico('proc_guayabo', 'Procedentes de Guayabo', 'col-md-6')}
            </div>
          </div>

          {/* Sección: Visitas */}
          <div className="seccion-form">
            <h6>Visitas</h6>
            <div className="row g-3">
              {campoNumerico('visitas_barrio', 'Visitas del barrio', 'col-md-6 col-lg-3')}
              <div className="col-md-6 col-lg-9">
                <label htmlFor="nombres_visitas_barrio" className="form-label">
                  Nombres de visitas del barrio
                </label>
                <input
                  type="text"
                  id="nombres_visitas_barrio"
                  name="nombres_visitas_barrio"
                  className="form-control"
                  value={formulario.nombres_visitas_barrio}
                  onChange={manejarCambio}
                  placeholder="Nombres separados por coma"
                  disabled={cargando}
                />
              </div>

              {campoNumerico('visitas_guayabo', 'Visitas de Guayabo', 'col-md-6 col-lg-3')}
              <div className="col-md-6 col-lg-9">
                <label htmlFor="nombres_visitas_guayabo" className="form-label">
                  Nombres de visitas de Guayabo
                </label>
                <input
                  type="text"
                  id="nombres_visitas_guayabo"
                  name="nombres_visitas_guayabo"
                  className="form-control"
                  value={formulario.nombres_visitas_guayabo}
                  onChange={manejarCambio}
                  placeholder="Nombres separados por coma"
                  disabled={cargando}
                />
              </div>
            </div>
          </div>

          {/* Sección: Permanencia */}
          <div className="seccion-form">
            <h6>Permanencia</h6>
            <div className="row g-3">
              {campoNumerico('retiros_antes_terminar', 'Se retiraron antes de terminar', 'col-md-6')}
              <div className="col-md-6">
                <label htmlFor="se_quedaron_todo" className="form-label">Se quedaron todo el culto</label>
                <input
                  type="number"
                  id="se_quedaron_todo"
                  name="se_quedaron_todo"
                  className={`form-control ${errores.se_quedaron_todo ? 'is-invalid' : ''}`}
                  value={formulario.se_quedaron_todo}
                  onChange={manejarCambio}
                  min="0"
                  placeholder="Cantidad"
                  disabled={cargando}
                />
                {errores.se_quedaron_todo && (
                  <div className="invalid-feedback">{errores.se_quedaron_todo}</div>
                )}
              </div>
            </div>
          </div>

          {/* Sección: Total de asistentes (auto-calculado) */}
          <div className="seccion-form">
            <h6>Total de Asistentes</h6>
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="total_asistentes" className="form-label">Total (calculado automáticamente)</label>
                <input
                  type="number"
                  id="total_asistentes"
                  name="total_asistentes"
                  className={`form-control bg-light fw-bold fs-5 ${errores.total_asistentes ? 'is-invalid' : ''}`}
                  value={formulario.total_asistentes}
                  readOnly
                  disabled
                />
                <small className="text-muted">Llegaron antes + Llegaron después</small>
                {errores.total_asistentes && (
                  <div className="invalid-feedback">{errores.total_asistentes}</div>
                )}
              </div>
            </div>
          </div>

          {/* Sección: Observaciones */}
          <div className="seccion-form">
            <h6>Observaciones</h6>
            <textarea
              id="observaciones"
              name="observaciones"
              className={`form-control ${errores.observaciones ? 'is-invalid' : ''}`}
              rows="3"
              value={formulario.observaciones}
              onChange={manejarCambio}
              placeholder="Observaciones adicionales (opcional)"
              disabled={cargando}
              maxLength={OBSERVACIONES_MAX}
            ></textarea>
            <div className="d-flex justify-content-between mt-1">
              {errores.observaciones
                ? <small className="text-danger">{errores.observaciones}</small>
                : <span></span>}
              <small className={`${(formulario.observaciones?.length || 0) >= OBSERVACIONES_MAX ? 'text-danger fw-bold' : 'text-muted'}`}>
                {formulario.observaciones?.length || 0}/{OBSERVACIONES_MAX}
              </small>
            </div>
          </div>

          {/* Botones */}
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
