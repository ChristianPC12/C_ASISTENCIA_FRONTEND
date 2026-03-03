import ApiCliente from '../config/api';

const usuarioApi = {
  listar:       ()           => ApiCliente.get('/usuarios'),
  obtenerPorId: (id)         => ApiCliente.get(`/usuarios/${id}`),
  crear:        (data)       => ApiCliente.post('/usuarios', data),
  actualizar:   (id, data)   => ApiCliente.put(`/usuarios/${id}`, data),
  eliminar:     (id)         => ApiCliente.delete(`/usuarios/${id}`)
};

export default usuarioApi;
