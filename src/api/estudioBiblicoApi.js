import ApiCliente from '../config/api';

const estudioBiblicoApi = {
  listar: (params = {}) => ApiCliente.get('/estudios-biblicos', { params }),
  dashboard: (params = {}) => ApiCliente.get('/estudios-biblicos/dashboard', { params }),
  obtenerPorId: (id) => ApiCliente.get(`/estudios-biblicos/${id}`),
  crear: (payload) => ApiCliente.post('/estudios-biblicos', payload),
  asignarDesdeVisita: (payload) => ApiCliente.post('/estudios-biblicos/asignar', payload),
  actualizar: (id, payload) => ApiCliente.put(`/estudios-biblicos/${id}`, payload),
  eliminar: (id) => ApiCliente.delete(`/estudios-biblicos/${id}`),
  cambiarEstado: (id, payload) => ApiCliente.patch(`/estudios-biblicos/${id}/estado`, payload),
  crearSesion: (estudioId, payload) => ApiCliente.post(`/estudios-biblicos/${estudioId}/sesiones`, payload),
  crearDecision: (estudioId, payload) => ApiCliente.post(`/estudios-biblicos/${estudioId}/decisiones`, payload),
  crearAsignacion: (estudioId, payload) => ApiCliente.post(`/estudios-biblicos/${estudioId}/asignaciones`, payload),
  listarInstructores: (params = {}) => ApiCliente.get('/estudios-biblicos/instructores', { params }),
  crearInstructor: (payload) => ApiCliente.post('/estudios-biblicos/instructores', payload),
  actualizarInstructor: (id, payload) => ApiCliente.put(`/estudios-biblicos/instructores/${id}`, payload),
  eliminarInstructor: (id) => ApiCliente.delete(`/estudios-biblicos/instructores/${id}`)
};

export default estudioBiblicoApi;
