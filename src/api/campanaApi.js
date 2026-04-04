import ApiCliente from '../config/api';

const campanaApi = {
  listar: (params = {}) => ApiCliente.get('/campanas', { params }),
  dashboard: (params = {}) => ApiCliente.get('/campanas/dashboard', { params }),
  obtenerPorId: (id) => ApiCliente.get(`/campanas/${id}`),
  crear: (payload) => ApiCliente.post('/campanas', payload),
  actualizar: (id, payload) => ApiCliente.put(`/campanas/${id}`, payload),
  eliminar: (id) => ApiCliente.delete(`/campanas/${id}`),
  crearSesion: (campanaId, payload) => ApiCliente.post(`/campanas/${campanaId}/sesiones`, payload),
  actualizarSesion: (sesionId, payload) => ApiCliente.put(`/campanas/sesiones/${sesionId}`, payload),
  crearAsistente: (campanaId, payload) => ApiCliente.post(`/campanas/${campanaId}/asistentes`, payload),
  actualizarAsistente: (asistenteId, payload) => ApiCliente.put(`/campanas/asistentes/${asistenteId}`, payload),
  convertirAsistenteAEstudio: (asistenteId, payload = {}) => ApiCliente.post(`/campanas/asistentes/${asistenteId}/convertir-estudio`, payload),
  registrarAsistenciaSesion: (sesionId, payload) => ApiCliente.post(`/campanas/sesiones/${sesionId}/asistencia`, payload),
  crearDecision: (campanaId, payload) => ApiCliente.post(`/campanas/${campanaId}/decisiones`, payload)
};

export default campanaApi;
