import axios from 'axios';
import { EVENT_SETUP_REQUIRED } from './events';

const AUTH_REDIRECT_MESSAGE_KEY = 'auth_redirect_message';
const DEVICE_ID_STORAGE_KEY = 'auth_device_id';
const DEVICE_ID_REGEX = /^[A-Za-z0-9._:-]{8,120}$/;

function generarDeviceId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function obtenerDeviceId() {
  try {
    const actual = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (actual && DEVICE_ID_REGEX.test(actual)) {
      return actual;
    }

    const nuevo = generarDeviceId();
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, nuevo);
    return nuevo;
  } catch {
    return '';
  }
}

const ApiCliente = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000
});

// Interceptor: inyectar token en cada peticion
ApiCliente.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const deviceId = obtenerDeviceId();
  if (deviceId) {
    config.headers['X-Device-Id'] = deviceId;
  }

  return config;
});

// Interceptor: extraer data automaticamente y manejar errores
ApiCliente.interceptors.response.use(
  (res) => res.data,
  (error) => {
    if (error.response) {
      if (
        error.response.status === 403
        && String(error.response?.data?.codigo || '').toUpperCase() === 'SETUP_REQUIRED'
      ) {
        try {
          window.dispatchEvent(new CustomEvent(EVENT_SETUP_REQUIRED));
        } catch {
          // Ignorar si el entorno no soporta CustomEvent
        }
      }

      // Si el backend responde con 401, limpiar sesion y redirigir al login
      // (excepto si es la propia peticion de login, para mostrar el mensaje de error)
      if (error.response.status === 401 && !error.config.url?.includes('/auth/login')) {
        const mensajeServidor = error.response.data?.mensaje;
        const mensajeSesion = (typeof mensajeServidor === 'string' && mensajeServidor.trim() !== '')
          ? mensajeServidor
          : 'Tu sesion expiro o ya no es valida. Inicia sesion nuevamente.';

        // Evitar cascada de toasts en rojo cuando varias peticiones fallan en paralelo.
        window.__suppressErrorToasts = true;

        if (!window.__authRedirectInProgress) {
          window.__authRedirectInProgress = true;
          sessionStorage.setItem(AUTH_REDIRECT_MESSAGE_KEY, mensajeSesion);
        }

        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        localStorage.removeItem('tenant');
        localStorage.removeItem('session');
        if (window.location.pathname !== '/') {
          window.location.replace('/');
        }

        return Promise.reject({
          ...error.response.data,
          silenciarNotificacion: true,
          codigo: 'AUTH_SESSION_EXPIRED'
        });
      }
      return Promise.reject(error.response.data);
    }
    return Promise.reject({ exito: false, mensaje: 'Error de conexion con el servidor.' });
  }
);

export default ApiCliente;
