import ApiCliente from '../config/api';

const asistenciaApi = {
  listar:       (params) => ApiCliente.get('/asistencias', { params }),
  obtenerPorId: (id)     => ApiCliente.get(`/asistencias/${id}`),
  crear:        (data)   => ApiCliente.post('/asistencias', data),
  actualizar:   (id, data) => ApiCliente.put(`/asistencias/${id}`, data),
  eliminar:     (id)     => ApiCliente.delete(`/asistencias/${id}`)
};

export default asistenciaApi;
