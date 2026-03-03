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
    <div className="card shadow-sm mb-4">
      <div className="card-header">
        <h5 className="mb-0" style={{ color: '#FFFFFF' }}>
          {editandoId ? 'Editar Usuario' : 'Nuevo Usuario'}
        </h5>
      </div>
      <div className="card-body">
        <form onSubmit={manejarEnvio}>
          <div className="row g-3">
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

            {/* Contrasena */}
            <div className="col-md-6">
              <label htmlFor="password_campo" className="form-label">
                Contraseña {editandoId && <small className="text-muted">(dejar vacío para no cambiar)</small>}
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
                disabled={cargando}
              />
              {errores.password && (
                <div className="invalid-feedback">{errores.password}</div>
              )}
            </div>

            {/* Rol */}
            <div className="col-md-6">
              <label htmlFor="rol_id" className="form-label">Rol</label>
              <select
                id="rol_id"
                name="rol_id"
                className={`form-select ${errores.rol_id ? 'is-invalid' : ''}`}
                value={formulario.rol_id}
                onChange={manejarCambio}
                disabled={cargando}
              >
                {ROL_OPCIONES.map((rol) => (
                  <option key={rol.valor} value={rol.valor}>{rol.etiqueta}</option>
                ))}
              </select>
              {errores.rol_id && (
                <div className="invalid-feedback">{errores.rol_id}</div>
              )}
            </div>

            {/* Activo (solo en edicion) */}
            {editandoId && (
              <div className="col-md-6">
                <div className="form-check mt-4">
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
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="d-flex gap-2 mt-4">
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
              ) : editandoId ? 'Actualizar' : 'Crear usuario'}
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
