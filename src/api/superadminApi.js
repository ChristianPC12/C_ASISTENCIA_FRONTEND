import ApiCliente from '../config/api';

const superadminApi = {
  listarOrganizaciones: (params = {}) => ApiCliente.get('/v2/superadmin/organizaciones', { params }),
  crearOrganizacion: (payload) => ApiCliente.post('/v2/superadmin/organizaciones', payload),
  actualizarOrganizacion: (organizacionId, payload) => (
    ApiCliente.put(`/v2/superadmin/organizaciones/${organizacionId}`, payload)
  ),
  crearAdminTemporal: (organizacionId, payload) => (
    ApiCliente.post(`/v2/superadmin/organizaciones/${organizacionId}/admin-temporal`, payload)
  ),
  listarCampos: () => ApiCliente.get('/v2/superadmin/campos'),
  crearCampo: (payload) => ApiCliente.post('/v2/superadmin/campos', payload),
  actualizarCampo: (codigo, payload) => ApiCliente.put(`/v2/superadmin/campos/${encodeURIComponent(codigo)}`, payload),
  eliminarCampo: (codigo) => ApiCliente.delete(`/v2/superadmin/campos/${encodeURIComponent(codigo)}`),
  listarDistritos: () => ApiCliente.get('/v2/superadmin/distritos'),
  crearDistrito: (payload) => ApiCliente.post('/v2/superadmin/distritos', payload),
  actualizarDistrito: (codigo, payload) => (
    ApiCliente.put(`/v2/superadmin/distritos/${encodeURIComponent(codigo)}`, payload)
  ),
  eliminarDistrito: (codigo) => ApiCliente.delete(`/v2/superadmin/distritos/${encodeURIComponent(codigo)}`)
};

export default superadminApi;
