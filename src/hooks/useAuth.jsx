import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authApi from '../api/authApi';
import { validarLogin } from '../validators/authValidator';
import { sanitizarObjeto } from '../utils/sanitizer';
import { notificarExito, notificarError } from '../utils/notify';
import { ROLES } from '../config/constants';

const AuthContext = createContext(null);
const NORMALIZE_REGEX = /[\u0300-\u036f]/g;

function esMensajeCredencialesInvalidas(mensaje) {
  if (typeof mensaje !== 'string' || mensaje.trim() === '') {
    return false;
  }

  const normalizado = mensaje
    .normalize('NFD')
    .replace(NORMALIZE_REGEX, '')
    .toLowerCase();

  return normalizado.includes('credenciales invalidas');
}

function parseFecha(valor) {
  if (typeof valor !== 'string' || !valor.trim()) {
    return null;
  }

  const dt = new Date(valor);
  if (Number.isNaN(dt.getTime())) {
    return null;
  }
  return dt;
}

function calcularDiasRestantes(fechaFin) {
  const fin = parseFecha(fechaFin);
  if (!fin) return null;
  const ahora = new Date();
  const diffMs = fin.getTime() - ahora.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function esCuentaAdminTemporal(usuario) {
  if (usuario?.rol !== ROLES.ADMIN) {
    return false;
  }

  const creado = parseFecha(usuario?.creado_en);
  const expira = parseFecha(usuario?.password_expira_en);
  if (!creado || !expira) {
    return false;
  }

  const diffDias = (expira.getTime() - creado.getTime()) / (1000 * 60 * 60 * 24);
  return diffDias > 0 && diffDias <= 5.1;
}

/**
 * Provider de autenticacion: envuelve toda la app para compartir un solo estado
 */
export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => {
    const guardadoUsuario = localStorage.getItem('usuario');
    const guardadoTenant = localStorage.getItem('tenant');
    const guardadoSession = localStorage.getItem('session');

    return {
      usuario: guardadoUsuario ? JSON.parse(guardadoUsuario) : null,
      tenant: guardadoTenant ? JSON.parse(guardadoTenant) : null,
      session: guardadoSession ? JSON.parse(guardadoSession) : null,
      token: localStorage.getItem('token')
    };
  });
  const [estadoUI, setEstadoUI] = useState({
    cargando: false,
    errores: {}
  });

  const { usuario, tenant, session, token } = authState;
  const cargando = estadoUI.cargando;
  const errores = estadoUI.errores;

  const setCargando = useCallback((valor) => {
    setEstadoUI((prev) => (
      prev.cargando === valor
        ? prev
        : { ...prev, cargando: valor }
    ));
  }, []);

  const setErrores = useCallback((valor) => {
    setEstadoUI((prev) => ({
      ...prev,
      errores: typeof valor === 'function' ? valor(prev.errores) : valor
    }));
  }, []);

  const actualizarAuth = useCallback((cambios) => {
    setAuthState((prev) => ({ ...prev, ...cambios }));
  }, []);

  const hidratarSesionDesdeRespuestaMe = useCallback((datosMe) => {
    if (!datosMe || typeof datosMe !== 'object') {
      return false;
    }

    const tenantSesion = datosMe?.tenant || null;
    localStorage.setItem('usuario', JSON.stringify(datosMe));
    if (tenantSesion) {
      localStorage.setItem('tenant', JSON.stringify(tenantSesion));
    } else {
      localStorage.removeItem('tenant');
    }

    actualizarAuth({
      usuario: datosMe,
      tenant: tenantSesion
    });

    return true;
  }, [actualizarAuth]);

  const cerrarSesionLocal = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('tenant');
    localStorage.removeItem('session');
    setAuthState({
      usuario: null,
      tenant: null,
      session: null,
      token: null
    });
  }, []);

  const verificarSesion = useCallback(async () => {
    try {
      const res = await authApi.me();
      if (res?.exito) {
        return hidratarSesionDesdeRespuestaMe(res?.datos);
      }
      cerrarSesionLocal();
      return false;
    } catch {
      cerrarSesionLocal();
      return false;
    }
  }, [hidratarSesionDesdeRespuestaMe, cerrarSesionLocal]);

  const refrescarSesion = useCallback(async () => {
    try {
      const res = await authApi.me();
      if (res?.exito) {
        return hidratarSesionDesdeRespuestaMe(res?.datos);
      }
      return false;
    } catch {
      return false;
    }
  }, [hidratarSesionDesdeRespuestaMe]);

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
      return { exito: false, limpiarCampos: false };
    }

    setCargando(true);
    setErrores({});

    try {
      const res = await authApi.login(datosSanitizados);
      if (res.exito) {
        const tenantSesion = res?.datos?.tenant || res?.datos?.usuario?.tenant || null;
        const sessionInfo = res?.datos?.session || null;

        localStorage.setItem('token', res.datos.token);
        localStorage.setItem('usuario', JSON.stringify(res.datos.usuario));
        if (tenantSesion) {
          localStorage.setItem('tenant', JSON.stringify(tenantSesion));
        } else {
          localStorage.removeItem('tenant');
        }
        if (sessionInfo) {
          localStorage.setItem('session', JSON.stringify(sessionInfo));
        } else {
          localStorage.removeItem('session');
        }
        actualizarAuth({
          token: res.datos.token,
          usuario: res.datos.usuario,
          tenant: tenantSesion,
          session: sessionInfo
        });
        notificarExito(res.mensaje);
        return { exito: true, limpiarCampos: false };
      }

      const mensaje = res.mensaje || 'Error al iniciar sesion.';
      notificarError(mensaje);
      return {
        exito: false,
        limpiarCampos: esMensajeCredencialesInvalidas(mensaje)
      };
    } catch (error) {
      const mensaje = error?.mensaje || 'Error al conectar con el servidor.';
      notificarError(mensaje);
      return {
        exito: false,
        limpiarCampos: esMensajeCredencialesInvalidas(mensaje)
      };
    } finally {
      setCargando(false);
    }
  }, [actualizarAuth, setCargando, setErrores]);

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
  const esSuperadmin = usuario?.rol === ROLES.SUPERADMIN;
  const diasRestantesPassword = calcularDiasRestantes(usuario?.password_expira_en);
  const esAdminTemporal = esCuentaAdminTemporal(usuario);

  const valor = {
    usuario,
    tenant,
    session,
    cargando,
    errores,
    setErrores,
    estaAutenticado,
    esAdmin,
    esSuperadmin,
    esAdminTemporal,
    diasRestantesPassword,
    iniciarSesion,
    cerrarSesion,
    refrescarSesion
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
