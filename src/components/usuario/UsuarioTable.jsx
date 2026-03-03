/**
 * Tabla de listado de usuarios
 * Props:
 *  - usuarios: array de usuarios
 *  - cargando: boolean
 *  - onEditar: funcion (usuario)
 *  - onEliminar: funcion (id)
 */
export default function UsuarioTable({ usuarios, cargando, onEditar, onEliminar }) {
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-CR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="card shadow-sm">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0" style={{ color: '#FFFFFF' }}>Usuarios del Sistema</h5>
        <span className="badge bg-light text-dark">{usuarios.length} usuarios</span>
      </div>
      <div className="card-body">

        {/* Spinner de carga */}
        {cargando && (
          <div className="text-center py-4">
            <div className="spinner-border spinner-iasd" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        )}

        {/* Mensaje si no hay usuarios */}
        {!cargando && usuarios.length === 0 && (
          <div className="alert alert-iasd text-center">
            No hay usuarios registrados.
          </div>
        )}

        {/* Tabla de usuarios */}
        {!cargando && usuarios.length > 0 && (
          <div className="table-responsive">
            <table className="table table-striped table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre Completo</th>
                  <th>Usuario</th>
                  <th className="text-center">Rol</th>
                  <th className="text-center">Estado</th>
                  <th>Creado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usr) => (
                  <tr key={usr.id}>
                    <td>{usr.id}</td>
                    <td className="fw-semibold">{usr.nombre_completo}</td>
                    <td>{usr.usuario}</td>
                    <td className="text-center">
                      <span className={`badge ${usr.rol === 'ADMIN' ? 'bg-primary' : 'bg-secondary'}`}>
                        {usr.rol}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`badge ${usr.activo ? 'bg-success' : 'bg-danger'}`}>
                        {usr.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{formatearFecha(usr.creado_en)}</td>
                    <td className="text-center">
                      <div className="d-flex gap-1 justify-content-center">
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => onEditar(usr)}
                          title="Editar"
                        >
                          Editar
                        </button>
                        {usr.activo && (
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => onEliminar(usr.id)}
                            title="Desactivar"
                          >
                            Desactivar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
