import { useEffect } from 'react';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../hooks/useAuth';

/**
 * Pagina de inicio de sesion
 * La redireccion post-login la maneja AppContent al detectar estaAutenticado=true
 */
export default function LoginPage() {
  const { iniciarSesion, cargando, errores } = useAuth();

  /* Bloquea el scroll del body mientras el login está montado */
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
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