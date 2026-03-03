import ApiCliente from '../config/api';

const cultoApi = {
  listar: () => ApiCliente.get('/cultos')
};

export default cultoApi;
