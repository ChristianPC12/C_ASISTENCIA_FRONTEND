import { useEffect } from 'react';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../hooks/useAuth';

/**
 * Pagina de inicio de sesion
 * La redireccion post-login la maneja AppContent al detectar estaAutenticado=true
 */
export default function LoginPage() {
  const { iniciarSesion, cargando, errores } = useAuth();

  /* Marca login activo para estilos responsivos del viewport */
  useEffect(() => {
    document.body.classList.add('login-screen-active');
    return () => {
      document.body.classList.remove('login-screen-active');
    };
  }, []);

  const manejarLogin = async (datos) => {
    await iniciarSesion(datos);
  };

  return (
    <LoginForm
      onSubmit={manejarLogin}
      cargando={cargando}
      errores={errores}
    />
  );
}
