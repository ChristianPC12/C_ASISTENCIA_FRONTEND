export default function UsuarioCuposCard({
  cuposRoles,
  resumen,
  cargando
}) {
  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0" style={{ color: '#FFFFFF' }}>Roles y cupos del sistema</h5>
        <span className="badge bg-light text-dark">
          {resumen?.usuarios_contabilizados || 0}/{resumen?.cupos_totales || 0}
        </span>
      </div>
      <div className="card-body">
        <div className="alert alert-iasd py-2 small mb-3">
          Los cupos máximos por rol están definidos por el sistema y no son editables por usuarios.
        </div>

        {cargando && (
          <div className="text-muted">Cargando cupos...</div>
        )}

        {!cargando && cuposRoles.length === 0 && (
          <div className="text-muted">No hay configuración de cupos disponible.</div>
        )}

        {!cargando && cuposRoles.length > 0 && (
          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>Rol</th>
                  <th className="text-center">Consumo actual</th>
                  <th className="text-center">Cupo máximo</th>
                  <th className="text-center">Disponibles</th>
                  <th className="text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {cuposRoles.map((item) => (
                  <tr key={item.rol_nombre}>
                    <td className="fw-semibold">
                      {item.rol_nombre}
                      {item.excedido && (
                        <span className="badge text-bg-danger ms-2">Excedido</span>
                      )}
                    </td>
                    <td className="text-center">{item.consumo_actual}</td>
                    <td className="text-center">
                      <span className="badge text-bg-primary">{item.cupo_maximo}</span>
                    </td>
                    <td className="text-center">{item.disponibles}</td>
                    <td className="text-center">
                      <span className={`badge ${item.activo ? 'text-bg-success' : 'text-bg-secondary'}`}>
                        {item.activo ? 'Activo' : 'Inactivo'}
                      </span>
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
