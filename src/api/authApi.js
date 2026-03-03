import ApiCliente from '../config/api';

const authApi = {
  login:  (payload) => ApiCliente.post('/auth/login', payload),
  logout: ()        => ApiCliente.post('/auth/logout'),
  me:     ()        => ApiCliente.get('/auth/me')
};

export default authApi;
