export default function UsuarioCuposCard({
  cuposRoles,
  resumen,
  cargando,
  guardando,
  onCambiarCupo,
  onGuardar
}) {
  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0" style={{ color: '#FFFFFF' }}>Cupos por rol</h5>
        <span className="badge bg-light text-dark">
          {resumen?.usuarios_contabilizados || 0}/{resumen?.cupos_totales || 0}
        </span>
      </div>
      <div className="card-body">
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
                  <th className="text-center">Activo</th>
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
                    <td className="text-center" style={{ maxWidth: 120 }}>
                      <input
                        type="number"
                        min={0}
                        max={999}
                        className="form-control form-control-sm text-center"
                        value={item.cupo_maximo}
                        disabled={guardando}
                        onChange={(event) => onCambiarCupo(item.rol_nombre, 'cupo_maximo', event.target.value)}
                      />
                    </td>
                    <td className="text-center">{item.disponibles}</td>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={!!item.activo}
                        disabled={guardando}
                        onChange={(event) => onCambiarCupo(item.rol_nombre, 'activo', event.target.checked)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="d-flex justify-content-end mt-3">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onGuardar}
            disabled={guardando || cargando || cuposRoles.length === 0}
          >
            {guardando ? 'Guardando cupos...' : 'Guardar cupos'}
          </button>
        </div>
      </div>
    </div>
  );
}
