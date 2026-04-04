import { Modal } from 'bootstrap';
import { useEffect, useRef, useState } from 'react';

const TIPO_OPCIONES = [
  { valor: 'SEMANA_EVANGELISTICA', etiqueta: 'Semana evangelística' },
  { valor: 'CAMPANA_2_SEMANAS', etiqueta: 'Campaña 2 semanas' },
  { valor: 'OTRO', etiqueta: 'Otro' }
];

function calcularFechaFin(tipo, fechaInicio) {
  if (!fechaInicio) return '';
  const dias = tipo === 'SEMANA_EVANGELISTICA' ? 6 : tipo === 'CAMPANA_2_SEMANAS' ? 13 : null;
  if (dias === null) return '';
  const d = new Date(fechaInicio + 'T00:00:00');
  d.setDate(d.getDate() + dias);
  return d.toISOString().split('T')[0];
}

export default function CampanaFormModal({
  mostrar,
  onCerrar,
  editandoId,
  form,
  setForm,
  onGuardar,
  guardando,
  mostrarExtra,
  setMostrarExtra
}) {
  const modalRef = useRef(null);
  const modalInstance = useRef(null);
  const [errorFecha, setErrorFecha] = useState('');

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

  // Auto-calcular fecha_fin basado en tipo y fecha_inicio
  useEffect(() => {
    if (!form.fecha_inicio) {
      if (form.tipo !== 'OTRO') {
        setForm((prev) => ({ ...prev, fecha_fin: '' }));
      }
      return;
    }

    if (form.tipo === 'OTRO') {
      // Para OTRO, no auto-calcular, dejar editable
      return;
    }

    const fechaCalculada = calcularFechaFin(form.tipo, form.fecha_inicio);
    setForm((prev) => ({ ...prev, fecha_fin: fechaCalculada }));
  }, [form.tipo, form.fecha_inicio, setForm]);

  // Limpiar error de fecha al cambiar fecha_inicio o tipo
  useEffect(() => {
    setErrorFecha('');
  }, [form.fecha_inicio, form.tipo]);

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
                <label className="form-label form-label-sm">Lema <span className="text-danger">*</span></label>
                <input
                  className="form-control form-control-sm"
                  value={form.lema}
                  onChange={(e) => setForm((prev) => ({ ...prev, lema: e.target.value }))}
                  placeholder="Lema o tema principal"
                  maxLength={60}
                  required
                />
              </div>

              <div className="col-6">
                <label className="form-label form-label-sm">Tipo <span className="text-danger">*</span></label>
                <select
                  className="form-select form-select-sm"
                  value={form.tipo}
                  onChange={(e) => setForm((prev) => ({ ...prev, tipo: e.target.value }))}
                  required
                >
                  {TIPO_OPCIONES.map((opcion) => (
                    <option key={opcion.valor} value={opcion.valor}>
                      {opcion.etiqueta}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-6">
                <label className="form-label form-label-sm">Fecha inicio <span className="text-danger">*</span></label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={form.fecha_inicio}
                  onChange={(e) => setForm((prev) => ({ ...prev, fecha_inicio: e.target.value }))}
                  required
                />
              </div>

              <div className="col-6">
                <label className="form-label form-label-sm">Fecha fin</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={form.fecha_fin}
                  onChange={(e) => {
                    const nuevaFecha = e.target.value;
                    if (form.tipo === 'OTRO' && form.fecha_inicio && nuevaFecha < form.fecha_inicio) {
                      setErrorFecha('La fecha de fin no puede ser anterior a la de inicio');
                    } else {
                      setErrorFecha('');
                    }
                    setForm((prev) => ({ ...prev, fecha_fin: nuevaFecha }));
                  }}
                  disabled={form.tipo !== 'OTRO'}
                  readOnly={form.tipo !== 'OTRO'}
                />
                {errorFecha && <div className="text-danger small mt-1">{errorFecha}</div>}
              </div>

              <div className="col-6">
                <label className="form-label form-label-sm">Lugar <span className="text-danger">*</span></label>
                <input
                  className="form-control form-control-sm"
                  value={form.lugar}
                  onChange={(e) => setForm((prev) => ({ ...prev, lugar: e.target.value }))}
                  placeholder="Lugar de la campaña"
                  maxLength={45}
                  required
                />
              </div>

              <div className="col-6">
                <label className="form-label form-label-sm">Hora <span className="text-danger">*</span></label>
                <input
                  type="time"
                  className="form-control form-control-sm"
                  value={form.hora}
                  onChange={(e) => setForm((prev) => ({ ...prev, hora: e.target.value }))}
                  required
                />
              </div>

              <div className="col-6">
                <label className="form-label form-label-sm">Predicador <span className="text-danger">*</span></label>
                <input
                  className="form-control form-control-sm"
                  value={form.predicador}
                  onChange={(e) => setForm((prev) => ({ ...prev, predicador: e.target.value }))}
                  placeholder="Predicador principal"
                  maxLength={40}
                  required
                />
              </div>

              <div className="col-12">
                <label className="form-label form-label-sm">Responsable <span className="text-danger">*</span></label>
                <input
                  className="form-control form-control-sm"
                  value={form.responsable}
                  onChange={(e) => setForm((prev) => ({ ...prev, responsable: e.target.value }))}
                  placeholder="Nombre de la persona responsable"
                  maxLength={40}
                  required
                />
              </div>

              {mostrarExtra && (
                <>
                  <div className="col-12">
                    <label className="form-label form-label-sm">Descripción</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="2"
                      value={form.descripcion}
                      onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                      placeholder="Descripción detallada de la campaña"
                      maxLength={500}
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
                      maxLength={60}
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
              className="btn btn-outline-secondary btn-sm admin-responsive-action-btn"
              onClick={onCerrar}
            >
              <i className="bi bi-x-lg" aria-hidden="true"></i>
              <span className="admin-responsive-btn-label">Cancelar</span>
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm admin-responsive-action-btn"
              onClick={() => {
                if (form.tipo === 'OTRO' && form.fecha_fin && form.fecha_inicio && form.fecha_fin < form.fecha_inicio) {
                  setErrorFecha('La fecha de fin no puede ser anterior a la de inicio');
                  return;
                }
                onGuardar();
              }}
              disabled={guardando || !!errorFecha}
            >
              <i className={`bi ${editandoId ? 'bi-floppy' : 'bi-plus-lg'}`} aria-hidden="true"></i>
              <span className="admin-responsive-btn-label">{editandoId ? 'Guardar' : 'Agregar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
