import { useCallback, useState } from 'react';
import { ETIQUETA_NIVEL, SECCIONES_PERMISO, VIGENCIAS_PASSWORD } from '../../config/constants';
import PermisosUsuarioModal from './PermisosUsuarioModal';

function esSoloInstructor(formulario) {
  if (formulario.es_admin) return false;
  const secciones = Object.keys(formulario.permisos || {}).filter((clave) => formulario.permisos[clave]);
  return secciones.length === 1 && formulario.permisos.estudios_biblicos === 'INSTRUCTOR';
}

/** El vencimiento cuenta desde el ultimo cambio de contrasena: hoy si se esta asignando una. */
function textoVencimiento(formulario) {
  const base = !formulario.password && formulario.password_actualizada_en
    ? new Date(formulario.password_actualizada_en.replace(' ', 'T'))
    : new Date();
  if (Number.isNaN(base.getTime())) return '';
  base.setDate(base.getDate() + Number(formulario.password_vigencia_dias));
  return `Vence el ${base.toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' })}.`;
}

function resumenAcceso(formulario) {
  if (formulario.es_admin) return 'Administrador general (acceso total)';
  const asignadas = SECCIONES_PERMISO.filter((seccion) => formulario.permisos?.[seccion.clave]);
  if (asignadas.length === 0) return 'Sin secciones asignadas';
  return asignadas
    .map((seccion) => `${seccion.etiqueta} (${ETIQUETA_NIVEL[formulario.permisos[seccion.clave]]})`)
    .join(', ');
}

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
  const [permisosAbierto, setPermisosAbierto] = useState(false);
  const cerrarPermisos = useCallback(() => setPermisosAbierto(false), []);
  const aplicarPermisos = useCallback(({ esAdmin, permisos }) => {
    onCambiarCampo('es_admin', esAdmin);
    onCambiarCampo('permisos', permisos);
    setPermisosAbierto(false);
  }, [onCambiarCampo]);

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

            {/* Contrasena */}
            <div className="col-md-4">
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

            <div className="col-md-4">
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

            {/* Vigencia de la contrasena */}
            <div className="col-md-4">
              <label htmlFor="password_vigencia_campo" className="form-label">La contraseña expira en</label>
              {esSoloInstructor(formulario) ? (
                <>
                  <input
                    type="text"
                    id="password_vigencia_campo"
                    className="form-control"
                    value="No vence"
                    disabled
                  />
                  <div className="form-text">Los instructores no tienen vencimiento.</div>
                </>
              ) : (
                <>
                  <select
                    id="password_vigencia_campo"
                    name="password_vigencia_dias"
                    className="form-select"
                    value={formulario.password_vigencia_dias}
                    onChange={manejarCambio}
                    disabled={cargando}
                  >
                    {VIGENCIAS_PASSWORD.map((dias) => (
                      <option key={dias} value={dias}>{dias} días</option>
                    ))}
                  </select>
                  <div className="form-text">{textoVencimiento(formulario)}</div>
                </>
              )}
            </div>

            <div className="col-12">
              <div className="usuario-form-toolbar">
                <div className="usuario-form-toolbar-top">
                  <div className="usuario-form-rol-block">
                    <span className="form-label d-block">Acceso</span>
                    <button
                      type="button"
                      className={`btn usuario-form-permisos-btn ${errores.permisos ? 'btn-outline-danger' : 'btn-outline-primary'}`}
                      onClick={() => setPermisosAbierto(true)}
                      disabled={cargando}
                    >
                      <i className="bi bi-shield-check" aria-hidden="true"></i>
                      <span>Secciones y permisos</span>
                    </button>
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

                {errores.permisos && (
                  <div className="invalid-feedback d-block">{errores.permisos}</div>
                )}

                <div className="usuario-form-toolbar-meta">
                  <div className="form-text usuario-form-cupo-text">
                    <strong>Acceso:</strong> {resumenAcceso(formulario)}
                  </div>
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
      {permisosAbierto && (
        <PermisosUsuarioModal
          esAdmin={formulario.es_admin}
          permisos={formulario.permisos}
          onAplicar={aplicarPermisos}
          onCerrar={cerrarPermisos}
        />
      )}
    </div>
  );
}

