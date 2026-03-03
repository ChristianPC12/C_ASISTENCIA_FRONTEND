import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../hooks/useAuth';

/**
 * Pagina de inicio de sesion
 * La redireccion post-login la maneja AppContent al detectar estaAutenticado=true
 */
export default function LoginPage() {
  const { iniciarSesion, cargando, errores } = useAuth();

  const manejarLogin = async (datos) => {
    await iniciarSesion(datos);
    // No se necesita navigate: AppContent re-renderiza automaticamente
    // al cambiar estaAutenticado y muestra las rutas autenticadas
  };

  return (
    <LoginForm
      onSubmit={manejarLogin}
      cargando={cargando}
      errores={errores}
    />
  );
}
