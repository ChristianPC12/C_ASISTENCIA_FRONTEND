const EMPTY_ROLES = [];

export default function InfoRolesUsuarios({ roles = EMPTY_ROLES }) {
  return (
    <div className="admin-info-card-stack">
      {roles.map((item) => (
        <div className="card admin-categoria-card" key={item.rol}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
              <h6 className="mb-0">{item.rol}</h6>
              <span className="badge text-bg-warning">{item.estado}</span>
            </div>
            <p className="small text-muted mb-0">{item.detalle}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
