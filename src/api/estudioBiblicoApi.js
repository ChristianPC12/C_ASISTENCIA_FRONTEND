import ApiCliente from '../config/api';

const estudioBiblicoApi = {
  listar: (params = {}) => ApiCliente.get('/estudios-biblicos', { params }),
  dashboard: (params = {}) => ApiCliente.get('/estudios-biblicos/dashboard', { params }),
  obtenerPorId: (id) => ApiCliente.get(`/estudios-biblicos/${id}`),
  crear: (payload) => ApiCliente.post('/estudios-biblicos', payload),
  actualizar: (id, payload) => ApiCliente.put(`/estudios-biblicos/${id}`, payload),
  eliminar: (id) => ApiCliente.delete(`/estudios-biblicos/${id}`),
  crearSesion: (estudioId, payload) => ApiCliente.post(`/estudios-biblicos/${estudioId}/sesiones`, payload),
  crearDecision: (estudioId, payload) => ApiCliente.post(`/estudios-biblicos/${estudioId}/decisiones`, payload),
  crearAsignacion: (estudioId, payload) => ApiCliente.post(`/estudios-biblicos/${estudioId}/asignaciones`, payload)
};

export default estudioBiblicoApi;
