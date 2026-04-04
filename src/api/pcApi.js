import ApiCliente from '../config/api';

const pcApi = {
  listar: (params = {}) => ApiCliente.get('/pequenas-congregaciones', { params }),
  dashboard: (params = {}) => ApiCliente.get('/pequenas-congregaciones/dashboard', { params }),
  obtenerPorId: (id) => ApiCliente.get(`/pequenas-congregaciones/${id}`),
  crear: (payload) => ApiCliente.post('/pequenas-congregaciones', payload),
  actualizar: (id, payload) => ApiCliente.put(`/pequenas-congregaciones/${id}`, payload),
  eliminar: (id) => ApiCliente.delete(`/pequenas-congregaciones/${id}`),
  crearParticipante: (pcId, payload) => ApiCliente.post(`/pequenas-congregaciones/${pcId}/participantes`, payload),
  actualizarParticipante: (participanteId, payload) => ApiCliente.put(`/pequenas-congregaciones/participantes/${participanteId}`, payload),
  convertirParticipanteAEstudio: (participanteId, payload = {}) => ApiCliente.post(`/pequenas-congregaciones/participantes/${participanteId}/convertir-estudio`, payload),
  crearReunion: (pcId, payload) => ApiCliente.post(`/pequenas-congregaciones/${pcId}/reuniones`, payload),
  actualizarReunion: (reunionId, payload) => ApiCliente.put(`/pequenas-congregaciones/reuniones/${reunionId}`, payload),
  registrarAsistenciaReunion: (reunionId, payload) => ApiCliente.post(`/pequenas-congregaciones/reuniones/${reunionId}/asistencia`, payload),
  crearResultado: (pcId, payload) => ApiCliente.post(`/pequenas-congregaciones/${pcId}/resultados`, payload),
  actualizarResultado: (resultadoId, payload) => ApiCliente.put(`/pequenas-congregaciones/resultados/${resultadoId}`, payload),
  crearLiderazgo: (pcId, payload) => ApiCliente.post(`/pequenas-congregaciones/${pcId}/liderazgo`, payload),
  actualizarLiderazgo: (liderazgoId, payload) => ApiCliente.put(`/pequenas-congregaciones/liderazgo/${liderazgoId}`, payload)
};

export default pcApi;
