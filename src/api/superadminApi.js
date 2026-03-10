import ApiCliente from '../config/api';

const superadminApi = {
  listarOrganizaciones: (params = {}) => ApiCliente.get('/v2/superadmin/organizaciones', { params }),
  crearOrganizacion: (payload) => ApiCliente.post('/v2/superadmin/organizaciones', payload),
  actualizarOrganizacion: (organizacionId, payload) => (
    ApiCliente.put(`/v2/superadmin/organizaciones/${organizacionId}`, payload)
  ),
  crearAdminTemporal: (organizacionId, payload) => (
    ApiCliente.post(`/v2/superadmin/organizaciones/${organizacionId}/admin-temporal`, payload)
  )
};

export default superadminApi;
