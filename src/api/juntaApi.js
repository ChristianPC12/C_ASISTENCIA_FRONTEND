import ApiCliente from '../config/api';

const juntaApi = {
  listar: (params = {}) => ApiCliente.get('/juntas-iglesia', { params }),
  dashboard: (params = {}) => ApiCliente.get('/juntas-iglesia/dashboard', { params }),
  listarPendientes: (params = {}) => ApiCliente.get('/juntas-iglesia/pendientes', { params }),
  obtenerPorId: (id) => ApiCliente.get(`/juntas-iglesia/${id}`),
  crear: (payload) => ApiCliente.post('/juntas-iglesia', payload),
  actualizar: (id, payload) => ApiCliente.put(`/juntas-iglesia/${id}`, payload),
  eliminar: (id) => ApiCliente.delete(`/juntas-iglesia/${id}`),
  crearPunto: (juntaId, payload) => ApiCliente.post(`/juntas-iglesia/${juntaId}/puntos`, payload),
  actualizarPunto: (puntoId, payload) => ApiCliente.put(`/juntas-iglesia/puntos/${puntoId}`, payload),
  crearVotacion: (puntoId, payload) => ApiCliente.post(`/juntas-iglesia/puntos/${puntoId}/votaciones`, payload),
  actualizarVotacion: (votacionId, payload) => ApiCliente.put(`/juntas-iglesia/votaciones/${votacionId}`, payload)
};

export default juntaApi;
