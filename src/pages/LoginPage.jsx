import { useEffect } from 'react';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../hooks/useAuth';
import { notificarInfo } from '../utils/notify';

const AUTH_REDIRECT_MESSAGE_KEY = 'auth_redirect_message';

/**
 * Pagina de inicio de sesion
 * La redireccion post-login la maneja AppContent al detectar estaAutenticado=true
 */
export default function LoginPage() {
  const { iniciarSesion, cargando, errores } = useAuth();

  /* Marca login activo para estilos responsivos del viewport */
  useEffect(() => {
    // Al volver al login, restaurar notificaciones y mostrar motivo de expiracion una sola vez.
    window.__suppressErrorToasts = false;
    window.__authRedirectInProgress = false;

    const mensajeSesion = sessionStorage.getItem(AUTH_REDIRECT_MESSAGE_KEY);
    if (mensajeSesion) {
      sessionStorage.removeItem(AUTH_REDIRECT_MESSAGE_KEY);
      notificarInfo(mensajeSesion);
    }

    document.body.classList.add('login-screen-active');
    return () => {
      document.body.classList.remove('login-screen-active');
    };
  }, []);

  const manejarLogin = async (datos) => {
    return await iniciarSesion(datos);
  };

  return (
    <LoginForm
      onSubmit={manejarLogin}
      cargando={cargando}
      errores={errores}
    />
  );
}
