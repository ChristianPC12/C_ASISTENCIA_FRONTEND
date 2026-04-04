import { Modal } from 'bootstrap';
import { useEffect, useRef } from 'react';

const TIPO_OPCIONES = [
  { valor: 'SEMANA_EVANGELISTICA', etiqueta: 'Semana evangelística' },
  { valor: 'CAMPANA_2_SEMANAS', etiqueta: 'Campaña 2 semanas' },
  { valor: 'CAMPANA_ESPECIAL', etiqueta: 'Campaña especial' },
  { valor: 'SERIE_CORTA', etiqueta: 'Serie corta' }
];

const ESTADO_CAMPANA_OPCIONES = [
  { valor: '', etiqueta: 'Todos los estados' },
  { valor: 'BORRADOR', etiqueta: 'Borrador' },
  { valor: 'ACTIVA', etiqueta: 'Activa' },
  { valor: 'FINALIZADA', etiqueta: 'Finalizada' },
  { valor: 'ARCHIVADA', etiqueta: 'Archivada' }
];

export default function CampanaFormModal({
  mostrar,
  onCerrar,
  editandoId,
  form,
  setForm,
  onGuardar,
  guardando,
  usuarios,
  mostrarExtra,
  setMostrarExtra
}) {
  const modalRef = useRef(null);
  const modalInstance = useRef(null);

  useEffect(() => {
    if (!modalRef.current) return;

    if (!modalInstance.current) {
      modalInstance.current = new Modal(modalRef.current);
    }

    if (mostrar) {
      modalInstance.current.show();
    } else {
      modalInstance.current.hide();
    }
  }, [mostrar]);

  return (
    <div
      ref={modalRef}
      className="modal fade"
      id="campanaFormModal"
      tabIndex="-1"
      aria-labelledby="campanaFormModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="campanaFormModalLabel">
              {editandoId ? 'Editar campaña' : 'Nueva campaña'}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onCerrar}
              aria-label="Cerrar"
            ></button>
          </div>

          <div className="modal-body">
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label form-label-sm">Nombre</label>
                <input
                  className="form-control form-control-sm"
                  value={form.nombre}
                  onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Nombre de la campaña"
                />
              </div>

              <div className="col-12">
                <label className="form-label form-label-sm">Lema</label>
                <input
                  className="form-control form-control-sm"
                  value={form.lema}
                  onChange={(e) => setForm((prev) => ({ ...prev, lema: e.target.value }))}
                  placeholder="Lema o tema principal"
                />
              </div>

              <div className="col-6">
                <label className="form-label form-label-sm">Tipo</label>
                <select
                  className="form-select form-select-sm"
                  value={form.tipo}
                  onChange={(e) => setForm((prev) => ({ ...prev, tipo: e.target.value }))}
                >
                  {TIPO_OPCIONES.map((opcion) => (
                    <option key={opcion.valor} value={opcion.valor}>
                      {opcion.etiqueta}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-6">
                <label className="form-label form-label-sm">Estado</label>
                <select
                  className="form-select form-select-sm"
                  value={form.estado}
                  onChange={(e) => setForm((prev) => ({ ...prev, estado: e.target.value }))}
                >
                  {ESTADO_CAMPANA_OPCIONES.filter((opcion) => opcion.valor).map((opcion) => (
                    <option key={opcion.valor} value={opcion.valor}>
                      {opcion.etiqueta}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-6">
                <label className="form-label form-label-sm">Fecha inicio</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={form.fecha_inicio}
                  onChange={(e) => setForm((prev) => ({ ...prev, fecha_inicio: e.target.value }))}
                />
              </div>

              <div className="col-6">
                <label className="form-label form-label-sm">Fecha fin</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={form.fecha_fin}
                  onChange={(e) => setForm((prev) => ({ ...prev, fecha_fin: e.target.value }))}
                />
              </div>

              <div className="col-6">
                <label className="form-label form-label-sm">Lugar</label>
                <input
                  className="form-control form-control-sm"
                  value={form.lugar}
                  onChange={(e) => setForm((prev) => ({ ...prev, lugar: e.target.value }))}
                  placeholder="Lugar de la campaña"
                />
              </div>

              <div className="col-6">
                <label className="form-label form-label-sm">Predicador</label>
                <input
                  className="form-control form-control-sm"
                  value={form.predicador}
                  onChange={(e) => setForm((prev) => ({ ...prev, predicador: e.target.value }))}
                  placeholder="Predicador principal"
                />
              </div>

              {mostrarExtra && (
                <>
                  <div className="col-12">
                    <label className="form-label form-label-sm">Responsable</label>
                    <select
                      className="form-select form-select-sm"
                      value={form.responsable_usuario_id}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, responsable_usuario_id: e.target.value }))
                      }
                    >
                      <option value="">Sin responsable</option>
                      {usuarios.map((usuario) => (
                        <option key={usuario.id} value={usuario.id}>
                          {usuario.nombre_completo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label form-label-sm">Descripción</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="2"
                      value={form.descripcion}
                      onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                      placeholder="Descripción detallada de la campaña"
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label form-label-sm">Observaciones</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="2"
                      value={form.observaciones}
                      onChange={(e) => setForm((prev) => ({ ...prev, observaciones: e.target.value }))}
                      placeholder="Notas adicionales"
                    />
                  </div>
                </>
              )}

              <div className="col-12">
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 d-inline-flex align-items-center gap-1 text-muted"
                  onClick={() => setMostrarExtra(!mostrarExtra)}
                >
                  <i
                    className={`bi ${mostrarExtra ? 'bi-chevron-up' : 'bi-chevron-down'}`}
                    aria-hidden="true"
                  ></i>
                  <span>{mostrarExtra ? 'Menos detalles' : 'Más detalles'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onCerrar}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm d-flex align-items-center gap-1"
              onClick={onGuardar}
              disabled={guardando}
            >
              <i className={`bi ${editandoId ? 'bi-floppy' : 'bi-plus-lg'}`} aria-hidden="true"></i>
              {editandoId ? 'Actualizar' : 'Agregar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
