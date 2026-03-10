import { useEffect, useRef } from 'react';
import {
  useSuperadminOrganizaciones,
  CAMPOS_IA_OPCIONES,
  TIPO_ORGANIZACION_OPCIONES
} from '../hooks/useSuperadminOrganizaciones';

function obtenerAnioRegistro(organizacion) {
  const raw = String(organizacion?.creado_en || '');
  if (raw.length >= 4 && /^[0-9]{4}/.test(raw)) {
    return raw.slice(0, 4);
  }
  return '-';
}

export default function SuperadminPage() {
  const {
    formulario,
    errores,
    formularioAdminTemporal,
    erroresAdminTemporal,
    adminTemporalVisible,
    formularioEdicion,
    erroresEdicion,
    organizaciones,
    organizacionesFiltradas,
    organizacionesTablaOpciones,
    organizacionSeleccionadaAdmin,
    paginacion,
    cargandoLista,
    guardando,
    guardandoAdminTemporal,
    guardandoEdicion,
    ultimaCreada,
    ultimoAdminTemporal,
    ultimaEditada,
    filtrosTabla,
    opcionesAnioFiltro,
    cambiarCampo,
    cambiarCampoAdminTemporal,
    abrirFormularioAdminTemporal,
    cerrarFormularioAdminTemporal,
    iniciarEdicion,
    cambiarCampoEdicion,
    cambiarFiltroTabla,
    limpiarFiltrosTabla,
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

  const estaEditando = !!formularioEdicion.id;
  const totalRegistros = paginacion.total || organizaciones.length;
  const totalFiltrados = organizacionesFiltradas.length;
  const adminTemporalTituloRef = useRef(null);
  const edicionTituloRef = useRef(null);
  const campoOrganizacionAdmin = organizacionSeleccionadaAdmin?.campo_nombre
    || organizacionSeleccionadaAdmin?.campo
    || '-';
  const tipoOrganizacionAdmin = organizacionSeleccionadaAdmin?.tipo_organizacion || '-';
  const nombreOrganizacionAdmin = organizacionSeleccionadaAdmin?.nombre_organizacion || '-';

  useEffect(() => {
    if (!adminTemporalVisible || estaEditando) {
      return undefined;
    }

    const timer = setTimeout(() => {
      adminTemporalTituloRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      adminTemporalTituloRef.current?.focus({ preventScroll: true });
    }, 60);

    return () => clearTimeout(timer);
  }, [adminTemporalVisible, estaEditando, formularioAdminTemporal.organizacion_id]);

  useEffect(() => {
    if (!formularioEdicion.id) {
      return undefined;
    }

    const timer = setTimeout(() => {
      edicionTituloRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      edicionTituloRef.current?.focus({ preventScroll: true });
    }, 60);

    return () => clearTimeout(timer);
  }, [formularioEdicion.id]);

  return (
    <div className="container-fluid py-4">
      {!estaEditando && (
        <>
          {!adminTemporalVisible && (
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
                    <label htmlFor="tipo" className="form-label">Tipo de organización</label>
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
                    <label htmlFor="nombre_organizacion" className="form-label">Nombre de organización</label>
                    <input
                      id="nombre_organizacion"
                      type="text"
                      maxLength={30}
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
                      maxLength={30}
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
          )}

          {ultimaCreada && (
            <div className="alert alert-success border-0 shadow-sm" role="alert">
              Instancia creada: <strong>{ultimaCreada.nombre_organizacion}</strong>
            </div>
          )}

          {adminTemporalVisible && (
            <div id="admin-temporal-form" className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
                  <h3
                    ref={adminTemporalTituloRef}
                    tabIndex={-1}
                    className="h5 mb-0"
                    style={{ scrollMarginTop: '5.5rem' }}
                  >
                    Crear ADMIN temporal
                  </h3>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={cerrarFormularioAdminTemporal}
                    disabled={guardandoAdminTemporal}
                  >
                    Cerrar
                  </button>
                </div>

                <div className="alert alert-warning py-2">
                  El ADMIN temporal se crea con vigencia máxima de <strong>5 días</strong>.
                </div>

                <form onSubmit={manejarSubmitAdminTemporal} noValidate>
                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <label htmlFor="admin_campo" className="form-label">Campo</label>
                      <input
                        id="admin_campo"
                        type="text"
                        className="form-control bg-light"
                        value={campoOrganizacionAdmin}
                        readOnly
                        disabled
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label htmlFor="admin_tipo" className="form-label">Tipo</label>
                      <input
                        id="admin_tipo"
                        type="text"
                        className="form-control bg-light"
                        value={tipoOrganizacionAdmin}
                        readOnly
                        disabled
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label htmlFor="organizacion_id" className="form-label">Organización</label>
                      <input
                        id="organizacion_id"
                        type="text"
                        className={`form-control bg-light ${erroresAdminTemporal.organizacion_id ? 'is-invalid' : ''}`}
                        value={nombreOrganizacionAdmin}
                        readOnly
                        disabled
                      />
                      {erroresAdminTemporal.organizacion_id && (
                        <div className="invalid-feedback">{erroresAdminTemporal.organizacion_id}</div>
                      )}
                    </div>

                    <div className="col-12 col-md-6">
                      <label htmlFor="nombre_completo" className="form-label">Nombre completo</label>
                      <input
                        id="nombre_completo"
                        type="text"
                        maxLength={30}
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
                        maxLength={50}
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
                      <label htmlFor="correo_destino" className="form-label">Correo destino (automático)</label>
                      <input
                        id="correo_destino"
                        type="email"
                        maxLength={30}
                        className={`form-control bg-light ${erroresAdminTemporal.correo_destino ? 'is-invalid' : ''}`}
                        placeholder="correo@dominio.com"
                        value={formularioAdminTemporal.correo_destino}
                        readOnly
                        disabled={guardandoAdminTemporal}
                      />
                      {erroresAdminTemporal.correo_destino && (
                        <div className="invalid-feedback">{erroresAdminTemporal.correo_destino}</div>
                      )}
                      {!erroresAdminTemporal.correo_destino && organizacionSeleccionadaAdmin && !formularioAdminTemporal.correo_destino && (
                        <div className="form-text text-warning">
                          La organización seleccionada no tiene correo de contacto registrado.
                        </div>
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
                      disabled={guardandoAdminTemporal || !formularioAdminTemporal.correo_destino}
                    />
                    <label htmlFor="enviar_correo" className="form-check-label">
                      Enviar credenciales por correo
                    </label>
                  </div>

                  <div className="d-flex flex-wrap gap-2 mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={guardandoAdminTemporal || !formularioAdminTemporal.organizacion_id}
                    >
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
          )}

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
        </>
      )}

      {ultimaEditada && (
        <div className="alert alert-success border-0 shadow-sm" role="alert">
          Organización actualizada: <strong>{ultimaEditada.nombre_organizacion}</strong>
        </div>
      )}

      {formularioEdicion.id && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h3
              ref={edicionTituloRef}
              tabIndex={-1}
              className="h5 mb-3"
              style={{ scrollMarginTop: '5.5rem' }}
            >
              Editar organización
            </h3>

            <form onSubmit={manejarSubmitEdicion} noValidate>
              <div className="row g-3">
                <div className="col-12 col-md-3">
                  <label htmlFor="edicion_tipo" className="form-label">Tipo de organización</label>
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

                <div className="col-12 col-md-4">
                  <label htmlFor="edicion_nombre" className="form-label">Nombre de organización</label>
                  <input
                    id="edicion_nombre"
                    type="text"
                    maxLength={30}
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
                    maxLength={30}
                    className={`form-control ${erroresEdicion.correo_contacto ? 'is-invalid' : ''}`}
                    value={formularioEdicion.correo_contacto}
                    onChange={(event) => cambiarCampoEdicion('correo_contacto', event.target.value)}
                    disabled={guardandoEdicion}
                  />
                  {erroresEdicion.correo_contacto && (
                    <div className="invalid-feedback">{erroresEdicion.correo_contacto}</div>
                  )}
                </div>

                <div className="col-12 col-md-2">
                  <label htmlFor="edicion_activa" className="form-label">Estado</label>
                  <select
                    id="edicion_activa"
                    className="form-select"
                    value={formularioEdicion.activa ? 'ACTIVA' : 'INACTIVA'}
                    onChange={(event) => cambiarCampoEdicion('activa', event.target.value === 'ACTIVA')}
                    disabled={guardandoEdicion}
                  >
                    <option value="ACTIVA">Activa</option>
                    <option value="INACTIVA">Inactiva</option>
                  </select>
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
            <div className="d-flex flex-wrap align-items-center gap-2">
              <button
                className="btn btn-outline-primary btn-sm"
                type="button"
                onClick={recargarOrganizaciones}
                disabled={cargandoLista}
              >
                {cargandoLista ? 'Actualizando...' : 'Actualizar lista'}
              </button>
              <span className="badge text-bg-light border">
                Mostrando: {totalFiltrados} de {totalRegistros}
              </span>
            </div>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-12 col-md-3">
              <label htmlFor="filtro_campo_tabla" className="form-label mb-1">Campo</label>
              <select
                id="filtro_campo_tabla"
                className="form-select form-select-sm"
                value={filtrosTabla.campo}
                onChange={(event) => cambiarFiltroTabla('campo', event.target.value)}
              >
                <option value="TODOS">Todos</option>
                {CAMPOS_IA_OPCIONES.map((campo) => (
                  <option key={campo.valor} value={campo.valor}>
                    {campo.etiqueta}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-3">
              <label htmlFor="filtro_tipo_tabla" className="form-label mb-1">Tipo</label>
              <select
                id="filtro_tipo_tabla"
                className="form-select form-select-sm"
                value={filtrosTabla.tipo}
                onChange={(event) => cambiarFiltroTabla('tipo', event.target.value)}
              >
                <option value="TODOS">Todos</option>
                {TIPO_ORGANIZACION_OPCIONES.map((tipo) => (
                  <option key={tipo.valor} value={tipo.valor}>
                    {tipo.etiqueta}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-2">
              <label htmlFor="filtro_anio_tabla" className="form-label mb-1">Año</label>
              <select
                id="filtro_anio_tabla"
                className="form-select form-select-sm"
                value={filtrosTabla.anio}
                onChange={(event) => cambiarFiltroTabla('anio', event.target.value)}
              >
                <option value="TODOS">Todos</option>
                {opcionesAnioFiltro.map((anio) => (
                  <option key={anio} value={String(anio)}>
                    {anio}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-4">
              <label htmlFor="filtro_organizacion_tabla" className="form-label mb-1">Organización</label>
              <select
                id="filtro_organizacion_tabla"
                className="form-select form-select-sm"
                value={filtrosTabla.organizacion_id}
                onChange={(event) => cambiarFiltroTabla('organizacion_id', event.target.value)}
              >
                <option value="TODOS">Todas</option>
                {organizacionesTablaOpciones.map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {item.nombre_organizacion}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 d-flex align-items-end">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={limpiarFiltrosTabla}
              >
                Limpiar filtros
              </button>
            </div>
          </div>

          {cargandoLista ? (
            <div className="text-muted">Cargando organizaciones...</div>
          ) : organizacionesFiltradas.length === 0 ? (
            <div className="text-muted">Aún no hay organizaciones registradas.</div>
          ) : (
            <div className="superadmin-tabla-scroll">
              <div className="table-responsive">
                <table className="table table-sm table-striped align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Campo</th>
                      <th>Tipo</th>
                      <th>Nombre</th>
                      <th>Año de alta</th>
                      <th>Correo</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {organizacionesFiltradas.map((item) => (
                      <tr key={item.id}>
                        <td>{item.campo_nombre || item.campo}</td>
                        <td>{item.tipo_organizacion}</td>
                        <td>{item.nombre_organizacion}</td>
                        <td>{obtenerAnioRegistro(item)}</td>
                        <td>{item.correo_contacto || '-'}</td>
                        <td>
                          <span className={`badge ${item.activa ? 'text-bg-success' : 'text-bg-secondary'}`}>
                            {item.activa ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm" role="group" aria-label="Acciones organización">
                            <button
                              type="button"
                              className="btn btn-outline-success"
                              title="Crear ADMIN temporal"
                              aria-label="Crear ADMIN temporal"
                              onClick={() => abrirFormularioAdminTemporal(item)}
                              disabled={!item.activa || guardandoAdminTemporal}
                            >
                              <i className="bi bi-person-plus-fill"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-primary"
                              title="Editar organización"
                              aria-label="Editar organización"
                              onClick={() => iniciarEdicion(item)}
                              disabled={guardandoEdicion}
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
