import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authApi from '../api/authApi';
import { validarLogin } from '../validators/authValidator';
import { sanitizarObjeto } from '../utils/sanitizer';
import { notificarExito, notificarError } from '../utils/notify';
import { ROLES } from '../config/constants';

const AuthContext = createContext(null);

/**
 * Provider de autenticacion: envuelve toda la app para compartir un solo estado
 */
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('usuario');
    return guardado ? JSON.parse(guardado) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState({});

  const cerrarSesionLocal = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setToken(null);
    setUsuario(null);
  }, []);

  const verificarSesion = useCallback(async () => {
    try {
      const res = await authApi.me();
      if (res.exito) {
        setUsuario(res.datos);
        localStorage.setItem('usuario', JSON.stringify(res.datos));
      }
    } catch {
      cerrarSesionLocal();
    }
  }, [cerrarSesionLocal]);

  // Verificar si el token sigue valido al montar
  useEffect(() => {
    if (token && !usuario) {
      verificarSesion();
    }
  }, [token, usuario, verificarSesion]);

  const iniciarSesion = useCallback(async (datos) => {
    const datosSanitizados = sanitizarObjeto(datos);
    const validacion = validarLogin(datosSanitizados);

    if (!validacion.valido) {
      setErrores(validacion.errores);
      return false;
    }

    setCargando(true);
    setErrores({});

    try {
      const res = await authApi.login(datosSanitizados);
      if (res.exito) {
        localStorage.setItem('token', res.datos.token);
        localStorage.setItem('usuario', JSON.stringify(res.datos.usuario));
        setToken(res.datos.token);
        setUsuario(res.datos.usuario);
        notificarExito(res.mensaje);
        return true;
      }
      notificarError(res.mensaje || 'Error al iniciar sesion.');
      return false;
    } catch (error) {
      const mensaje = error?.mensaje || 'Error al conectar con el servidor.';
      notificarError(mensaje);
      return false;
    } finally {
      setCargando(false);
    }
  }, []);

  const cerrarSesion = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignorar errores de logout
    } finally {
      cerrarSesionLocal();
    }
  }, [cerrarSesionLocal]);

  const estaAutenticado = !!usuario && !!token;
  const esAdmin = usuario?.rol === ROLES.ADMIN;

  const valor = {
    usuario,
    cargando,
    errores,
    setErrores,
    estaAutenticado,
    esAdmin,
    iniciarSesion,
    cerrarSesion
  };

  return (
    <AuthContext.Provider value={valor}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para acceder al contexto de auth (usa el mismo estado en toda la app)
 */
export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return contexto;
}
