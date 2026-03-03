import { useState } from 'react';

/**
 * Formulario de inicio de sesion
 * Props:
 *  - onSubmit: funcion que recibe { usuario, password }
 *  - cargando: boolean para deshabilitar el boton
 *  - errores: objeto con errores por campo
 */
export default function LoginForm({ onSubmit, cargando, errores }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');

  const manejarEnvio = (e) => {
    e.preventDefault();
    onSubmit({ usuario, password });
  };

  return (
    <div className="login-container">
      <div className="card login-card">
        <div className="card-header">
          <h4 className="mb-1" style={{ color: '#FFFFFF' }}>IASD</h4>
          <p className="mb-0" style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            Control de Asistencia
          </p>
        </div>
        <div className="card-body">
          <h5 className="text-center mb-4" style={{ color: '#2D3436' }}>
            Iniciar Sesion
          </h5>

          <form onSubmit={manejarEnvio}>
            {/* Usuario */}
            <div className="mb-3">
              <label htmlFor="usuario" className="form-label">Usuario</label>
              <input
                type="text"
                id="usuario"
                className={`form-control ${errores.usuario ? 'is-invalid' : ''}`}
                placeholder="Ingrese su usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                autoComplete="username"
                autoFocus
                disabled={cargando}
              />
              {errores.usuario && (
                <div className="invalid-feedback">{errores.usuario}</div>
              )}
            </div>

            {/* Contrasena */}
            <div className="mb-4">
              <label htmlFor="password" className="form-label">Contrasena</label>
              <input
                type="password"
                id="password"
                className={`form-control ${errores.password ? 'is-invalid' : ''}`}
                placeholder="Ingrese su contrasena"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={cargando}
              />
              {errores.password && (
                <div className="invalid-feedback">{errores.password}</div>
              )}
            </div>

            {/* Boton de envio */}
            <button
              type="submit"
              className="btn btn-primary w-100 py-2"
              disabled={cargando}
            >
              {cargando ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Ingresando...
                </>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
