import { useState, useEffect, useCallback } from 'react';
import authApi from '../api/authApi';
import { validarLogin } from '../validators/authValidator';
import { sanitizarObjeto } from '../utils/sanitizer';
import { notificarExito, notificarError } from '../utils/notify';
import { ROLES } from '../config/constants';

/**
 * Hook de autenticacion
 * Maneja login, logout, verificacion de token y datos del usuario
 */
export function useAuth() {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('usuario');
    return guardado ? JSON.parse(guardado) : null;
  });
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState({});

  // Verificar si el token sigue valido al montar
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !usuario) {
      verificarSesion();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Verificar sesion con el backend
  const verificarSesion = useCallback(async () => {
    try {
      const res = await authApi.me();
      if (res.exito) {
        setUsuario(res.datos);
        localStorage.setItem('usuario', JSON.stringify(res.datos));
      }
    } catch {
      // Token invalido, limpiar sesion
      cerrarSesionLocal();
    }
  }, []);

  // Login
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

  // Logout
  const cerrarSesion = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignorar errores de logout
    } finally {
      cerrarSesionLocal();
    }
  }, []);

  // Limpiar sesion en localStorage y estado
  const cerrarSesionLocal = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  }, []);

  // Helpers
  const estaAutenticado = !!usuario && !!localStorage.getItem('token');
  const esAdmin = usuario?.rol === ROLES.ADMIN;

  return {
    usuario,
    cargando,
    errores,
    setErrores,
    estaAutenticado,
    esAdmin,
    iniciarSesion,
    cerrarSesion
  };
}
