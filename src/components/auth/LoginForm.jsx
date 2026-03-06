import { useState, useEffect, useRef } from 'react';
import WAVES from 'vanta/dist/vanta.waves.min';
import * as THREE from 'three';

const ERRORES_VACIOS = {};

/**
 * LoginForm
 * Props:
 *  - onSubmit  : ({ usuario, password }) => void
 *  - cargando  : boolean
 *  - errores   : { usuario?: string, password?: string }
 */
export default function LoginForm({ onSubmit, cargando, errores = ERRORES_VACIOS }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');

  const vantaRef = useRef(null);
  const vantaEffect = useRef(null);

  // Inicializar / destruir Vanta
  useEffect(() => {
    if (!vantaEffect.current) {
      vantaEffect.current = WAVES({
        el: vantaRef.current,
        THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        color: 0x0a4d7a,
        shininess: 45,
        waveHeight: 12,
        waveSpeed: 0.6,
        zoom: 0.8,
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
      <div ref={vantaRef} className="login-vanta-bg" />
      <div className="login-split-bg" />

      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo-wrapper">
              <img
                src="/imgs/logo_IASD.jpg"
                alt="Logo IASD"
                className="login-logo"
              />
            </div>
            <div className="login-ornament">&diams;</div>
            <div className="login-brand">Iglesia Adventista</div>
            <div className="login-brand-sub">del S&eacute;ptimo D&iacute;a</div>
          </div>

          <div className="login-body">
            <p className="login-form-title">Control de Asistencia</p>

            <form onSubmit={manejarEnvio} noValidate>
              <div className="login-field">
                <label htmlFor="usuario">Usuario</label>
                <input
                  type="text"
                  id="usuario"
                  placeholder="Ingrese su usuario"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  autoComplete="username"
                  disabled={cargando}
                  className={errores.usuario ? 'login-input-error' : ''}
                />
                {errores.usuario && (
                  <span className="login-error-text">{errores.usuario}</span>
                )}
              </div>

              <div className="login-field">
                <label htmlFor="password">{'Contrase\u00f1a'}</label>
                <input
                  type="password"
                  id="password"
                  placeholder={'Ingrese su contrase\u00f1a'}
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

              <button
                type="submit"
                className={`login-btn-submit${cargando ? ' loading' : ''}`}
                disabled={cargando}
              >
                {cargando ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    />
                    Ingresando...
                  </>
                ) : (
                  'Ingresar'
                )}
              </button>
            </form>
          </div>

          <div className="login-footer">
            &copy; {new Date().getFullYear()} IASD - Sistema de Control de Asistencia
          </div>
        </div>
      </div>
    </>
  );
}
