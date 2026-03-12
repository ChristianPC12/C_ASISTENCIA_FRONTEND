export default function InfoRolesUsuarios({ roles = [] }) {
  return (
    <>
      <div className="alert alert-iasd py-2 small mb-3">
        Espacio reservado para definir accesos por rol cuando se completen los módulos pendientes.
      </div>
      <div className="row g-3">
        {roles.map((item) => (
          <div className="col-12 col-md-6 col-xl-4" key={item.rol}>
            <div className="card h-100 admin-categoria-card">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                  <h6 className="mb-0">{item.rol}</h6>
                  <span className="badge text-bg-warning">{item.estado}</span>
                </div>
                <p className="small text-muted mb-0">{item.detalle}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
