import {
  useSuperadminOrganizaciones,
  CAMPOS_IA_OPCIONES,
  TIPO_ORGANIZACION_OPCIONES
} from '../hooks/useSuperadminOrganizaciones';

export default function SuperadminPage() {
  const {
    formulario,
    errores,
    formularioAdminTemporal,
    erroresAdminTemporal,
    formularioEdicion,
    erroresEdicion,
    organizaciones,
    paginacion,
    cargandoLista,
    guardando,
    guardandoAdminTemporal,
    guardandoEdicion,
    ultimaCreada,
    ultimoAdminTemporal,
    ultimaEditada,
    cambiarCampo,
    cambiarCampoAdminTemporal,
    iniciarEdicion,
    cambiarCampoEdicion,
    crearOrganizacion,
    crearAdminTemporal,
    actualizarOrganizacion,
    limpiarFormulario,
    limpiarFormularioAdminTemporal,
    cancelarEdicion,
    recargarOrganizaciones
  } = useSuperadminOrganizaciones();

  const manejarSubmitOrganizacion = async (event) => {
    event.preventDefault();
    await crearOrganizacion();
  };

  const manejarSubmitAdminTemporal = async (event) => {
    event.preventDefault();
    await crearAdminTemporal();
  };

  const manejarSubmitEdicion = async (event) => {
    event.preventDefault();
    await actualizarOrganizacion();
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start gap-2 mb-4">
        <div>
          <h2 className="mb-1">Superadministracion Nacional</h2>
          <p className="text-muted mb-0">
            Alta de instancias y admins temporales para iglesias y grupos.
          </p>
        </div>
        <button
          className="btn btn-outline-primary"
          type="button"
          onClick={recargarOrganizaciones}
          disabled={cargandoLista}
        >
          {cargandoLista ? 'Actualizando...' : 'Actualizar lista'}
        </button>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h3 className="h5 mb-3">Crear nueva instancia</h3>

          <form onSubmit={manejarSubmitOrganizacion} noValidate>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label htmlFor="campo" className="form-label">Campo</label>
                <select
                  id="campo"
                  className={`form-select ${errores.campo ? 'is-invalid' : ''}`}
                  value={formulario.campo}
                  onChange={(event) => cambiarCampo('campo', event.target.value)}
                  disabled={guardando}
                >
                  <option value="">Seleccione un campo</option>
                  {CAMPOS_IA_OPCIONES.map((campo) => (
                    <option key={campo.valor} value={campo.valor}>
                      {campo.etiqueta}
                    </option>
                  ))}
                </select>
                {errores.campo && <div className="invalid-feedback">{errores.campo}</div>}
              </div>

              <div className="col-12 col-md-6">
                <label htmlFor="tipo" className="form-label">Tipo de organizacion</label>
                <select
                  id="tipo"
                  className={`form-select ${errores.tipo_organizacion ? 'is-invalid' : ''}`}
                  value={formulario.tipo_organizacion}
                  onChange={(event) => cambiarCampo('tipo_organizacion', event.target.value)}
                  disabled={guardando}
                >
                  {TIPO_ORGANIZACION_OPCIONES.map((tipo) => (
                    <option key={tipo.valor} value={tipo.valor}>
                      {tipo.etiqueta}
                    </option>
                  ))}
                </select>
                {errores.tipo_organizacion && (
                  <div className="invalid-feedback">{errores.tipo_organizacion}</div>
                )}
              </div>

              <div className="col-12 col-md-8">
                <label htmlFor="nombre_organizacion" className="form-label">Nombre de organizacion</label>
                <input
                  id="nombre_organizacion"
                  type="text"
                  className={`form-control ${errores.nombre_organizacion ? 'is-invalid' : ''}`}
                  placeholder="Ejemplo: Iglesia Central Cartago"
                  value={formulario.nombre_organizacion}
                  onChange={(event) => cambiarCampo('nombre_organizacion', event.target.value)}
                  disabled={guardando}
                />
                {errores.nombre_organizacion && (
                  <div className="invalid-feedback">{errores.nombre_organizacion}</div>
                )}
              </div>

              <div className="col-12 col-md-4">
                <label htmlFor="correo_contacto" className="form-label">Correo de contacto (opcional)</label>
                <input
                  id="correo_contacto"
                  type="email"
                  className={`form-control ${errores.correo_contacto ? 'is-invalid' : ''}`}
                  placeholder="correo@dominio.com"
                  value={formulario.correo_contacto}
                  onChange={(event) => cambiarCampo('correo_contacto', event.target.value)}
                  disabled={guardando}
                />
                {errores.correo_contacto && (
                  <div className="invalid-feedback">{errores.correo_contacto}</div>
                )}
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2 mt-4">
              <button type="submit" className="btn btn-primary" disabled={guardando}>
                {guardando ? 'Creando...' : 'Crear instancia'}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={limpiarFormulario}
                disabled={guardando}
              >
                Limpiar
              </button>
            </div>
          </form>
        </div>
      </div>

      {ultimaCreada && (
        <div className="alert alert-success border-0 shadow-sm" role="alert">
          Instancia creada: <strong>{ultimaCreada.nombre_organizacion}</strong> (
          <strong>{ultimaCreada.codigo_instancia}</strong>)
        </div>
      )}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h3 className="h5 mb-3">Crear ADMIN temporal</h3>
          <div className="alert alert-warning py-2">
            El ADMIN temporal se crea con vigencia maxima de <strong>5 dias</strong>.
          </div>

          <form onSubmit={manejarSubmitAdminTemporal} noValidate>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label htmlFor="organizacion_id" className="form-label">Organizacion</label>
                <select
                  id="organizacion_id"
                  className={`form-select ${erroresAdminTemporal.organizacion_id ? 'is-invalid' : ''}`}
                  value={formularioAdminTemporal.organizacion_id}
                  onChange={(event) => cambiarCampoAdminTemporal('organizacion_id', event.target.value)}
                  disabled={guardandoAdminTemporal}
                >
                  <option value="">Seleccione una organizacion</option>
                  {organizaciones.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.codigo_instancia} - {item.nombre_organizacion}
                    </option>
                  ))}
                </select>
                {erroresAdminTemporal.organizacion_id && (
                  <div className="invalid-feedback">{erroresAdminTemporal.organizacion_id}</div>
                )}
              </div>

              <div className="col-12 col-md-6">
                <label htmlFor="nombre_completo" className="form-label">Nombre completo</label>
                <input
                  id="nombre_completo"
                  type="text"
                  className={`form-control ${erroresAdminTemporal.nombre_completo ? 'is-invalid' : ''}`}
                  placeholder="Nombre del administrador temporal"
                  value={formularioAdminTemporal.nombre_completo}
                  onChange={(event) => cambiarCampoAdminTemporal('nombre_completo', event.target.value)}
                  disabled={guardandoAdminTemporal}
                />
                {erroresAdminTemporal.nombre_completo && (
                  <div className="invalid-feedback">{erroresAdminTemporal.nombre_completo}</div>
                )}
              </div>

              <div className="col-12 col-md-6">
                <label htmlFor="usuario_admin_temp" className="form-label">Usuario</label>
                <input
                  id="usuario_admin_temp"
                  type="text"
                  className={`form-control ${erroresAdminTemporal.usuario ? 'is-invalid' : ''}`}
                  placeholder="usuario.temporal"
                  value={formularioAdminTemporal.usuario}
                  onChange={(event) => cambiarCampoAdminTemporal('usuario', event.target.value)}
                  disabled={guardandoAdminTemporal}
                />
                {erroresAdminTemporal.usuario && (
                  <div className="invalid-feedback">{erroresAdminTemporal.usuario}</div>
                )}
              </div>

              <div className="col-12 col-md-6">
                <label htmlFor="correo_destino" className="form-label">Correo destino (opcional)</label>
                <input
                  id="correo_destino"
                  type="email"
                  className={`form-control ${erroresAdminTemporal.correo_destino ? 'is-invalid' : ''}`}
                  placeholder="correo@dominio.com"
                  value={formularioAdminTemporal.correo_destino}
                  onChange={(event) => cambiarCampoAdminTemporal('correo_destino', event.target.value)}
                  disabled={guardandoAdminTemporal}
                />
                {erroresAdminTemporal.correo_destino && (
                  <div className="invalid-feedback">{erroresAdminTemporal.correo_destino}</div>
                )}
              </div>
            </div>

            <div className="form-check mt-3">
              <input
                id="enviar_correo"
                type="checkbox"
                className="form-check-input"
                checked={!!formularioAdminTemporal.enviar_correo}
                onChange={(event) => cambiarCampoAdminTemporal('enviar_correo', event.target.checked)}
                disabled={guardandoAdminTemporal}
              />
              <label htmlFor="enviar_correo" className="form-check-label">
                Enviar credenciales por correo (si hay destinatario/configuracion)
              </label>
            </div>

            <div className="d-flex flex-wrap gap-2 mt-4">
              <button type="submit" className="btn btn-primary" disabled={guardandoAdminTemporal}>
                {guardandoAdminTemporal ? 'Creando...' : 'Crear ADMIN temporal'}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={limpiarFormularioAdminTemporal}
                disabled={guardandoAdminTemporal}
              >
                Limpiar
              </button>
            </div>
          </form>
        </div>
      </div>

      {ultimoAdminTemporal?.admin_temporal && (
        <div className="alert alert-info border-0 shadow-sm" role="alert">
          <div>
            ADMIN temporal creado: <strong>{ultimoAdminTemporal.admin_temporal.usuario}</strong>
          </div>
          <div>
            Password temporal: <strong>{ultimoAdminTemporal.admin_temporal.password_temporal}</strong>
          </div>
          <div>
            Expira en: <strong>{ultimoAdminTemporal.admin_temporal.expira_en}</strong>
          </div>
          {ultimoAdminTemporal.correo && (
            <div>
              Correo: <strong>{ultimoAdminTemporal.correo.enviado ? 'Enviado' : 'No enviado'}</strong>
              {ultimoAdminTemporal.correo.destino ? ` (${ultimoAdminTemporal.correo.destino})` : ''}
            </div>
          )}
        </div>
      )}

      {ultimaEditada && (
        <div className="alert alert-success border-0 shadow-sm" role="alert">
          Organizacion actualizada: <strong>{ultimaEditada.nombre_organizacion}</strong> (
          <strong>{ultimaEditada.codigo_instancia}</strong>)
        </div>
      )}

      {formularioEdicion.id && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h3 className="h5 mb-3">Editar organizacion</h3>

            <form onSubmit={manejarSubmitEdicion} noValidate>
              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <label htmlFor="edicion_tipo" className="form-label">Tipo de organizacion</label>
                  <select
                    id="edicion_tipo"
                    className={`form-select ${erroresEdicion.tipo_organizacion ? 'is-invalid' : ''}`}
                    value={formularioEdicion.tipo_organizacion}
                    onChange={(event) => cambiarCampoEdicion('tipo_organizacion', event.target.value)}
                    disabled={guardandoEdicion}
                  >
                    {TIPO_ORGANIZACION_OPCIONES.map((tipo) => (
                      <option key={tipo.valor} value={tipo.valor}>
                        {tipo.etiqueta}
                      </option>
                    ))}
                  </select>
                  {erroresEdicion.tipo_organizacion && (
                    <div className="invalid-feedback">{erroresEdicion.tipo_organizacion}</div>
                  )}
                </div>

                <div className="col-12 col-md-5">
                  <label htmlFor="edicion_nombre" className="form-label">Nombre de organizacion</label>
                  <input
                    id="edicion_nombre"
                    type="text"
                    className={`form-control ${erroresEdicion.nombre_organizacion ? 'is-invalid' : ''}`}
                    value={formularioEdicion.nombre_organizacion}
                    onChange={(event) => cambiarCampoEdicion('nombre_organizacion', event.target.value)}
                    disabled={guardandoEdicion}
                  />
                  {erroresEdicion.nombre_organizacion && (
                    <div className="invalid-feedback">{erroresEdicion.nombre_organizacion}</div>
                  )}
                </div>

                <div className="col-12 col-md-3">
                  <label htmlFor="edicion_correo" className="form-label">Correo de contacto</label>
                  <input
                    id="edicion_correo"
                    type="email"
                    className={`form-control ${erroresEdicion.correo_contacto ? 'is-invalid' : ''}`}
                    value={formularioEdicion.correo_contacto}
                    onChange={(event) => cambiarCampoEdicion('correo_contacto', event.target.value)}
                    disabled={guardandoEdicion}
                  />
                  {erroresEdicion.correo_contacto && (
                    <div className="invalid-feedback">{erroresEdicion.correo_contacto}</div>
                  )}
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 mt-4">
                <button type="submit" className="btn btn-primary" disabled={guardandoEdicion}>
                  {guardandoEdicion ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={cancelarEdicion}
                  disabled={guardandoEdicion}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <h3 className="h5 mb-0">Organizaciones registradas</h3>
            <span className="badge text-bg-light border">
              Total: {paginacion.total || organizaciones.length}
            </span>
          </div>

          {cargandoLista ? (
            <div className="text-muted">Cargando organizaciones...</div>
          ) : organizaciones.length === 0 ? (
            <div className="text-muted">Aun no hay organizaciones registradas.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm table-striped align-middle mb-0">
                <thead>
                  <tr>
                    <th>Codigo</th>
                    <th>Campo</th>
                    <th>Tipo</th>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {organizaciones.map((item) => (
                    <tr key={item.id}>
                      <td>{item.codigo_instancia}</td>
                      <td>{item.campo_nombre || item.campo}</td>
                      <td>{item.tipo_organizacion}</td>
                      <td>{item.nombre_organizacion}</td>
                      <td>{item.correo_contacto || '-'}</td>
                      <td>
                        <span className={`badge ${item.activa ? 'text-bg-success' : 'text-bg-secondary'}`}>
                          {item.activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => iniciarEdicion(item)}
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
