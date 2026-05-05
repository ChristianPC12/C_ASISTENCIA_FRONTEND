import { ROL_OPCIONES } from '../../config/constants';

/**
 * Formulario de crear/editar usuario
 * Props:
 *  - formulario: objeto con los datos del formulario
 *  - editandoId: ID del usuario en edicion (null si es nuevo)
 *  - errores: objeto con errores por campo
 *  - cargando: boolean
 *  - onCambiarCampo: funcion (campo, valor)
 *  - onGuardar: funcion para guardar
 *  - onLimpiar: funcion para limpiar el formulario
 */
export default function UsuarioForm({
  formulario,
  editandoId,
  errores,
  cargando,
  cupoRolSeleccionado,
  onCambiarCampo,
  onGuardar,
  onLimpiar
}) {
  const manejarEnvio = (e) => {
    e.preventDefault();
    onGuardar();
  };

  const manejarCambio = (e) => {
    const { name, value, type, checked } = e.target;
    onCambiarCampo(name, type === 'checkbox' ? checked : value);
  };

  return (
    <div className="card shadow-sm mb-4 usuario-form-card">
      <div className="card-body usuario-form-body">
        <form onSubmit={manejarEnvio} noValidate className="usuario-form">
          <div className="row g-3 usuario-form-grid">
            {/* Nombre completo */}
            <div className="col-md-6">
              <label htmlFor="nombre_completo" className="form-label">Nombre completo</label>
              <input
                type="text"
                id="nombre_completo"
                name="nombre_completo"
                className={`form-control ${errores.nombre_completo ? 'is-invalid' : ''}`}
                value={formulario.nombre_completo}
                onChange={manejarCambio}
                placeholder="Nombre completo del usuario"
                maxLength={120}
                disabled={cargando}
              />
              {errores.nombre_completo && (
                <div className="invalid-feedback">{errores.nombre_completo}</div>
              )}
            </div>

            {/* Usuario */}
            <div className="col-md-6">
              <label htmlFor="usuario_campo" className="form-label">Usuario</label>
              <input
                type="text"
                id="usuario_campo"
                name="usuario"
                className={`form-control ${errores.usuario ? 'is-invalid' : ''}`}
                value={formulario.usuario}
                onChange={manejarCambio}
                placeholder="Nombre de usuario"
                maxLength={50}
                autoComplete="off"
                disabled={cargando}
              />
              {errores.usuario && (
                <div className="invalid-feedback">{errores.usuario}</div>
              )}
            </div>

            <div className="col-md-6">
              <label htmlFor="cargo_campo" className="form-label">Cargo</label>
              <input
                type="text"
                id="cargo_campo"
                name="cargo"
                className={`form-control ${errores.cargo ? 'is-invalid' : ''}`}
                value={formulario.cargo || ''}
                onChange={manejarCambio}
                placeholder="Pastor, laico, director..."
                maxLength={120}
                disabled={cargando}
              />
              {errores.cargo && (
                <div className="invalid-feedback">{errores.cargo}</div>
              )}
            </div>

            {/* Contrasena */}
            <div className="col-md-6">
              <label htmlFor="password_campo" className="form-label">
                {'Contraseña '}
                {editandoId && <small className="text-muted">{'(dejar vacío para no cambiar)'}</small>}
              </label>
              <input
                type="password"
                id="password_campo"
                name="password"
                className={`form-control ${errores.password ? 'is-invalid' : ''}`}
                value={formulario.password}
                onChange={manejarCambio}
                placeholder={editandoId ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                autoComplete="new-password"
                minLength={12}
                maxLength={64}
                disabled={cargando}
              />
              {errores.password && (
                <div className="invalid-feedback">{errores.password}</div>
              )}
              {!errores.password && (
                <div className="form-text">
                  Debe contener 12-64 caracteres, mayúscula, minúscula, número y carácter especial.
                </div>
              )}
            </div>

            <div className="col-md-6">
              <label htmlFor="password_confirmacion_campo" className="form-label">
                {'Confirmar contraseña'}
              </label>
              <input
                type="password"
                id="password_confirmacion_campo"
                name="password_confirmacion"
                className={`form-control ${errores.password_confirmacion ? 'is-invalid' : ''}`}
                value={formulario.password_confirmacion}
                onChange={manejarCambio}
                placeholder={editandoId ? 'Repita la nueva contraseña' : 'Repita la contraseña'}
                autoComplete="new-password"
                minLength={12}
                maxLength={64}
                disabled={cargando}
              />
              {errores.password_confirmacion && (
                <div className="invalid-feedback">{errores.password_confirmacion}</div>
              )}
            </div>

            <div className="col-12">
              <div className="usuario-form-toolbar">
                <div className="usuario-form-toolbar-top">
                  <div className="usuario-form-rol-block">
                    <label htmlFor="rol_id" className="form-label">Rol</label>
                    <select
                      id="rol_id"
                      name="rol_id"
                      className={`form-select usuario-form-rol-select ${errores.rol_id ? 'is-invalid' : ''}`}
                      value={formulario.rol_id}
                      onChange={manejarCambio}
                      disabled={cargando}
                    >
                      {ROL_OPCIONES.map((rol) => (
                        <option key={rol.valor} value={rol.valor}>{rol.etiqueta}</option>
                      ))}
                    </select>
                  </div>

                  <div className="usuario-form-actions">
                    <button
                      type="submit"
                      className="btn btn-primary usuario-form-action-btn admin-responsive-action-btn"
                      disabled={cargando}
                      title={editandoId ? 'Actualizar' : 'Crear Usuario'}
                      aria-label={editandoId ? 'Actualizar' : 'Crear Usuario'}
                    >
                      <i className={`bi ${editandoId ? 'bi-floppy' : 'bi-person-plus'}`} aria-hidden="true"></i>
                      {cargando ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                          <span className="admin-responsive-btn-label">Guardando...</span>
                        </>
                      ) : <span className="admin-responsive-btn-label">{editandoId ? 'Actualizar' : 'Crear Usuario'}</span>}
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-secondary usuario-form-action-btn admin-responsive-action-btn"
                      onClick={onLimpiar}
                      disabled={cargando}
                      title={editandoId ? 'Cancelar' : 'Limpiar'}
                      aria-label={editandoId ? 'Cancelar' : 'Limpiar'}
                    >
                      <i className="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
                      <span className="admin-responsive-btn-label">{editandoId ? 'Cancelar' : 'Limpiar'}</span>
                    </button>
                  </div>
                </div>

                {errores.rol_id && (
                  <div className="invalid-feedback d-block">{errores.rol_id}</div>
                )}

                <div className="usuario-form-toolbar-meta">
                  {cupoRolSeleccionado && (
                    <div className="form-text usuario-form-cupo-text">
                      Cupo {cupoRolSeleccionado.rol_nombre}: {cupoRolSeleccionado.consumo_actual}/{cupoRolSeleccionado.cupo_maximo}
                      {' '}({cupoRolSeleccionado.disponibles} disponibles).
                    </div>
                  )}
                  {editandoId && (
                    <div className="form-check usuario-form-activo-check">
                      <input
                        type="checkbox"
                        id="activo"
                        name="activo"
                        className="form-check-input"
                        checked={formulario.activo}
                        onChange={manejarCambio}
                        disabled={cargando}
                      />
                      <label htmlFor="activo" className="form-check-label">
                        Usuario activo
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

