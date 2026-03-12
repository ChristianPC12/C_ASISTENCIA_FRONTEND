export default function InfoCategoriasMetricas({
  categorias = [],
  descripciones = {}
}) {
  return (
    <>
      <p className="text-muted small mb-3">
        Estas categorías organizan el formulario de Nuevo registro y ayudan a ubicar cada métrica en su sección correcta.
      </p>
      <div className="row g-3">
        {categorias.map((opcion) => (
          <div className="col-12 col-md-6 col-xl-4" key={opcion.valor}>
            <div className="card h-100 admin-categoria-card">
              <div className="card-body">
                <h6 className="mb-2">{opcion.etiqueta}</h6>
                <p className="small text-muted mb-0">
                  {descripciones[opcion.valor]}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
