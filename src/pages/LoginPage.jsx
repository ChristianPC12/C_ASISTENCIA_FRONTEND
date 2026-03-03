import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

/**
 * Pagina de inicio de sesion
 */
export default function LoginPage() {
  const { iniciarSesion, cargando, errores, estaAutenticado } = useAuth();
  const navigate = useNavigate();

  // Si ya esta autenticado, redirigir a registro
  useEffect(() => {
    if (estaAutenticado) {
      navigate('/registro', { replace: true });
    }
  }, [estaAutenticado, navigate]);

  const manejarLogin = async (datos) => {
    const exito = await iniciarSesion(datos);
    if (exito) {
      navigate('/registro', { replace: true });
    }
  };

  return (
    <LoginForm
      onSubmit={manejarLogin}
      cargando={cargando}
      errores={errores}
    />
  );
}
