const EMPTY_CATEGORIAS = [];
const EMPTY_DESCRIPCIONES = {};

export default function InfoCategoriasMetricas({
  categorias = EMPTY_CATEGORIAS,
  descripciones = EMPTY_DESCRIPCIONES
}) {
  return (
    <div className="admin-info-card-stack">
      {categorias.map((opcion) => (
        <div className="card admin-categoria-card" key={opcion.valor}>
          <div className="card-body">
            <h6 className="mb-2">{opcion.etiqueta}</h6>
            <p className="small text-muted mb-0">
              {descripciones[opcion.valor]}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
