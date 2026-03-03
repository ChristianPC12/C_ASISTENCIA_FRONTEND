import { useState, useEffect, useRef } from 'react';
import WAVES from 'vanta/dist/vanta.waves.min';
import * as THREE from 'three';

/**
 * Formulario de inicio de sesión con fondo animado Vanta.js
 * Props:
 *  - onSubmit: función que recibe { usuario, password }
 *  - cargando: boolean para deshabilitar el botón
 *  - errores: objeto con errores por campo
 */
export default function LoginForm({ onSubmit, cargando, errores }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const vantaRef = useRef(null);
  const vantaEffect = useRef(null);

  // Inicializar y destruir Vanta.js
  useEffect(() => {
    if (!vantaEffect.current) {
      vantaEffect.current = WAVES({
        el: vantaRef.current,
        THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        color: 0x003366,
        shininess: 35,
        waveHeight: 15,
        waveSpeed: 0.7,
        zoom: 0.85
      });
    }
    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, []);

  const manejarEnvio = (e) => {
    e.preventDefault();
    onSubmit({ usuario, password });
  };

  return (
    <>
      {/* Fondo animado Vanta */}
      <div ref={vantaRef} className="login-vanta-bg" />

      <div className="login-container">
        <div className="login-card">

          {/* Encabezado con logo */}
          <div className="login-header">
            <img
              src="/imgs/logo_IASD.jpg"
              alt="Logo IASD"
              className="login-logo"
            />
            <div className="login-brand">IASD</div>
            <div className="login-brand-sub">Control de Asistencia</div>
          </div>

          {/* Cuerpo del formulario */}
          <div className="login-body">
            <p className="login-form-title">Iniciar Sesión</p>

            <form onSubmit={manejarEnvio} noValidate>
              {/* Usuario */}
              <div className="login-field">
                <label htmlFor="usuario">Usuario</label>
                <input
                  type="text"
                  id="usuario"
                  placeholder="Ingrese su usuario"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  disabled={cargando}
                  className={errores.usuario ? 'login-input-error' : ''}
                />
                {errores.usuario && (
                  <span className="login-error-text">{errores.usuario}</span>
                )}
              </div>

              {/* Contraseña */}
              <div className="login-field">
                <label htmlFor="password">Contraseña</label>
                <input
                  type="password"
                  id="password"
                  placeholder="Ingrese su contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={cargando}
                  className={errores.password ? 'login-input-error' : ''}
                />
                {errores.password && (
                  <span className="login-error-text">{errores.password}</span>
                )}
              </div>

              {/* Botón */}
              <button
                type="submit"
                className={`login-btn-submit ${cargando ? 'loading' : ''}`}
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

          {/* Footer */}
          <div className="login-footer">
            © {new Date().getFullYear()} IASD · Sistema de Control de Asistencia
          </div>

        </div>
      </div>
    </>
  );
}
