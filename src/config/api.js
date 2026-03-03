import axios from 'axios';

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
  return config;
});

// Interceptor: extraer data automaticamente y manejar errores
ApiCliente.interceptors.response.use(
  (res) => res.data,
  (error) => {
    if (error.response) {
      // Si el backend responde con 401, limpiar sesion y redirigir al login
      // (excepto si es la propia peticion de login, para mostrar el mensaje de error)
      if (error.response.status === 401 && !error.config.url?.includes('/auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = '/';
      }
      return Promise.reject(error.response.data);
    }
    return Promise.reject({ exito: false, mensaje: 'Error de conexion con el servidor.' });
  }
);

export default ApiCliente;
