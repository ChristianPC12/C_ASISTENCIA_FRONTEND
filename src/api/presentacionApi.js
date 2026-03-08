import ApiCliente from '../config/api';

const presentacionApi = {
  generar: (payload) => ApiCliente.post('/presentaciones/generar', payload),
  listar: (params) => ApiCliente.get('/presentaciones', { params }),
  obtenerPorId: (id) => ApiCliente.get(`/presentaciones/${id}`)
};

export default presentacionApi;
