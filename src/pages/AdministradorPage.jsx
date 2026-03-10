import { useSetupAdministrador } from '../hooks/useSetupAdministrador';

function BadgeEstado({ completo }) {
  return (
    <span className={`badge ${completo ? 'text-bg-success' : 'text-bg-warning'}`}>
      {completo ? 'Setup completo' : 'Setup pendiente'}
    </span>
  );
}

export default function AdministradorPage() {
  const {
    cultos,
    procedencias,
    metricas,
    erroresCultos,
    erroresProcedencias,
    erroresMetricas,
    guardandoCultos,
    guardandoProcedencias,
    guardandoMetricas,
    finalizando,
    resumen,
    DIA_OPCIONES,
    cambiarCulto,
    agregarCulto,
    eliminarCulto,
    cambiarProcedencia,
    agregarProcedencia,
    eliminarProcedencia,
    cambiarMetrica,
    agregarMetrica,
    eliminarMetrica,
    guardarCultos,
    guardarProcedencias,
    guardarMetricas,
    finalizarSetup
  } = useSetupAdministrador();

  const setupCompleto = resumen.estado_setup === 'COMPLETO' && !resumen.bloqueada_operacion;

  return (
    <div className="container-fluid py-4">
      <div className="d-flex flex-column flex-lg-row align-items-start justify-content-between gap-3 mb-4">
        <div>
          <h2 className="mb-1">Administrador de instancia</h2>
          <p className="text-muted mb-0">
            Complete la configuracion inicial para habilitar registro, reportes, estadisticas y usuarios.
          </p>
        </div>
        <BadgeEstado completo={setupCompleto} />
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-8">
          <div className="alert alert-iasd mb-0">
            <strong>Estado actual:</strong> {resumen.estado_setup}
            {resumen.setup_completado_en ? ` | completado en ${resumen.setup_completado_en}` : ''}
            {resumen.ultima_revision_en ? ` | ultima revision ${resumen.ultima_revision_en}` : ''}
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <button
            type="button"
            className="btn btn-success w-100"
            onClick={finalizarSetup}
            disabled={finalizando}
          >
            {finalizando ? 'Finalizando...' : 'Finalizar setup inicial'}
          </button>
        </div>
      </div>

      {Array.isArray(resumen.faltantes) && resumen.faltantes.length > 0 && (
        <div className="alert alert-warning">
          <strong>Faltantes:</strong> {resumen.faltantes.join(', ')}
        </div>
      )}

      <div className="card shadow-sm mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0" style={{ color: '#FFFFFF' }}>Cultos de la instancia</h5>
          <button type="button" className="btn btn-light btn-sm" onClick={agregarCulto}>
            Agregar culto
          </button>
        </div>
        <div className="card-body">
          {erroresCultos.general && <div className="alert alert-danger">{erroresCultos.general}</div>}

          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Codigo</th>
                  <th>Nombre</th>
                  <th>Dia</th>
                  <th>Hora</th>
                  <th>Orden</th>
                  <th>Activo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cultos.map((item, index) => {
                  const filaErrores = erroresCultos[`fila_${index}`] || {};
                  return (
                    <tr key={item.ui_id}>
                      <td>
                        <input
                          className={`form-control form-control-sm ${filaErrores.codigo ? 'is-invalid' : ''}`}
                          value={item.codigo}
                          onChange={(event) => cambiarCulto(index, 'codigo', event.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className={`form-control form-control-sm ${filaErrores.nombre ? 'is-invalid' : ''}`}
                          value={item.nombre}
                          onChange={(event) => cambiarCulto(index, 'nombre', event.target.value)}
                        />
                      </td>
                      <td>
                        <select
                          className={`form-select form-select-sm ${filaErrores.dia_semana ? 'is-invalid' : ''}`}
                          value={item.dia_semana}
                          onChange={(event) => cambiarCulto(index, 'dia_semana', event.target.value)}
                        >
                          {DIA_OPCIONES.map((dia) => (
                            <option key={dia.valor} value={dia.valor}>{dia.etiqueta}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="time"
                          className={`form-control form-control-sm ${filaErrores.hora_inicio ? 'is-invalid' : ''}`}
                          value={item.hora_inicio}
                          onChange={(event) => cambiarCulto(index, 'hora_inicio', event.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className={`form-control form-control-sm ${filaErrores.orden ? 'is-invalid' : ''}`}
                          value={item.orden}
                          min={1}
                          max={99}
                          onChange={(event) => cambiarCulto(index, 'orden', event.target.value)}
                        />
                      </td>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={!!item.activo}
                          onChange={(event) => cambiarCulto(index, 'activo', event.target.checked)}
                        />
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => eliminarCulto(index)}
                          disabled={cultos.length <= 1}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-end">
            <button
              type="button"
              className="btn btn-primary"
              onClick={guardarCultos}
              disabled={guardandoCultos}
            >
              {guardandoCultos ? 'Guardando...' : 'Guardar cultos'}
            </button>
          </div>
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0" style={{ color: '#FFFFFF' }}>Metricas del formulario</h5>
          <button type="button" className="btn btn-light btn-sm" onClick={agregarMetrica}>
            Agregar metrica
          </button>
        </div>
        <div className="card-body">
          {erroresMetricas.general && <div className="alert alert-danger">{erroresMetricas.general}</div>}
          <div className="alert alert-info">
            Regla obligatoria: <strong>llegaron_antes_hora</strong> y <strong>llegaron_despues_hora</strong> deben quedar ambos habilitados/deshabilitados y ambos obligatorios/no obligatorios.
          </div>

          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Clave</th>
                  <th>Etiqueta</th>
                  <th>Depende de</th>
                  <th>Regla</th>
                  <th>Orden</th>
                  <th>Habilitado</th>
                  <th>Obligatorio</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {metricas.map((item, index) => {
                  const filaErrores = erroresMetricas[`fila_${index}`] || {};
                  return (
                    <tr key={item.ui_id}>
                      <td>
                        <input
                          className={`form-control form-control-sm ${filaErrores.clave ? 'is-invalid' : ''}`}
                          value={item.clave}
                          onChange={(event) => cambiarMetrica(index, 'clave', event.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className={`form-control form-control-sm ${filaErrores.etiqueta ? 'is-invalid' : ''}`}
                          value={item.etiqueta}
                          onChange={(event) => cambiarMetrica(index, 'etiqueta', event.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="form-control form-control-sm"
                          value={item.depende_de_clave || ''}
                          onChange={(event) => cambiarMetrica(index, 'depende_de_clave', event.target.value)}
                        />
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={item.regla_dependencia || ''}
                          onChange={(event) => cambiarMetrica(index, 'regla_dependencia', event.target.value)}
                        >
                          <option value="">Sin regla</option>
                          <option value="SI_MAYOR_CERO">SI_MAYOR_CERO</option>
                          <option value="AMBOS_O_NINGUNO">AMBOS_O_NINGUNO</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          className={`form-control form-control-sm ${filaErrores.orden ? 'is-invalid' : ''}`}
                          value={item.orden}
                          min={1}
                          max={999}
                          onChange={(event) => cambiarMetrica(index, 'orden', event.target.value)}
                        />
                      </td>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={!!item.habilitado}
                          onChange={(event) => cambiarMetrica(index, 'habilitado', event.target.checked)}
                        />
                      </td>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={!!item.obligatorio}
                          onChange={(event) => cambiarMetrica(index, 'obligatorio', event.target.checked)}
                        />
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => eliminarMetrica(index)}
                          disabled={metricas.length <= 1}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-end">
            <button
              type="button"
              className="btn btn-primary"
              onClick={guardarMetricas}
              disabled={guardandoMetricas}
            >
              {guardandoMetricas ? 'Guardando...' : 'Guardar metricas'}
            </button>
          </div>
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0" style={{ color: '#FFFFFF' }}>Procedencias (1 a 10)</h5>
          <button
            type="button"
            className="btn btn-light btn-sm"
            onClick={agregarProcedencia}
            disabled={procedencias.length >= 10}
          >
            Agregar procedencia
          </button>
        </div>
        <div className="card-body">
          {erroresProcedencias.general && <div className="alert alert-danger">{erroresProcedencias.general}</div>}

          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Orden</th>
                  <th>Activo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {procedencias.map((item, index) => {
                  const filaErrores = erroresProcedencias[`fila_${index}`] || {};
                  return (
                    <tr key={item.ui_id}>
                      <td>
                        <input
                          className={`form-control form-control-sm ${filaErrores.nombre ? 'is-invalid' : ''}`}
                          value={item.nombre}
                          onChange={(event) => cambiarProcedencia(index, 'nombre', event.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className={`form-control form-control-sm ${filaErrores.orden ? 'is-invalid' : ''}`}
                          value={item.orden}
                          min={1}
                          max={99}
                          onChange={(event) => cambiarProcedencia(index, 'orden', event.target.value)}
                        />
                      </td>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={!!item.activo}
                          onChange={(event) => cambiarProcedencia(index, 'activo', event.target.checked)}
                        />
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => eliminarProcedencia(index)}
                          disabled={procedencias.length <= 1}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-end">
            <button
              type="button"
              className="btn btn-primary"
              onClick={guardarProcedencias}
              disabled={guardandoProcedencias}
            >
              {guardandoProcedencias ? 'Guardando...' : 'Guardar procedencias'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
