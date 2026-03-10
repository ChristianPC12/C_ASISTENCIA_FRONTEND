import ApiCliente from '../config/api';

const setupApi = {
  obtenerEstado: () => ApiCliente.get('/v2/setup/estado'),
  guardarCultos: (data) => ApiCliente.put('/v2/setup/cultos', data),
  guardarMetricas: (data) => ApiCliente.put('/v2/setup/metricas', data),
  guardarProcedencias: (data) => ApiCliente.put('/v2/setup/procedencias', data),
  finalizar: () => ApiCliente.post('/v2/setup/finalizar')
};

export default setupApi;
