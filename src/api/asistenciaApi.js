import ApiCliente from '../config/api';

const asistenciaApi = {
  listar:       (params) => ApiCliente.get('/asistencias', { params }),
  obtenerPorId: (id)     => ApiCliente.get(`/asistencias/${id}`),
  crear:        (data)   => ApiCliente.post('/asistencias', data),
  actualizar:   (id, data) => ApiCliente.put(`/asistencias/${id}`, data),
  eliminar:     (id)     => ApiCliente.delete(`/asistencias/${id}`),
  exportarExcel: (id)    => ApiCliente.get(`/asistencias/${id}/exportar/excel`, { responseType: 'blob' }),
  exportarPdf:   (id)    => ApiCliente.get(`/asistencias/${id}/exportar/pdf`, { responseType: 'blob' })
};

export default asistenciaApi;
