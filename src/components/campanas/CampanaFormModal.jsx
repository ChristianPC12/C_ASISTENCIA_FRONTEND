import { Modal } from 'bootstrap';
import { useEffect, useRef, useState } from 'react';
import SelectorFecha from '../asistencia/SelectorFecha';

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
  const lemaRef = useRef(null);
  const modalBodyRef = useRef(null);
  const observacionesRef = useRef(null);
  const [errorFecha, setErrorFecha] = useState('');
  const [errorFechaInicio, setErrorFechaInicio] = useState('');
  const [errorLema, setErrorLema] = useState('');
  const [errorLugar, setErrorLugar] = useState('');
  const [errorHora, setErrorHora] = useState('');
  const [errorPredicador, setErrorPredicador] = useState('');
  const [errorResponsable, setErrorResponsable] = useState('');

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

  // Limpiar errores al abrir/cerrar modal
  useEffect(() => {
    if (!mostrar) {
      setErrorFecha('');
      setErrorFechaInicio('');
      setErrorLema('');
      setErrorLugar('');
      setErrorHora('');
      setErrorPredicador('');
      setErrorResponsable('');
    }
  }, [mostrar]);

  // Scroll/focus al mostrar/ocultar detalles extra
  useEffect(() => {
    if (!modalBodyRef.current) return;

    if (mostrarExtra) {
      // Scroll a Observaciones cuando se expanden detalles
      setTimeout(() => {
        if (observacionesRef.current) {
          const offsetTop = observacionesRef.current.offsetTop;
          modalBodyRef.current.scrollTop = offsetTop - 50;
        }
      }, 50);
    } else {
      // Scroll al inicio
      setTimeout(() => {
        modalBodyRef.current.scrollTop = 0;
      }, 50);
    }
  }, [mostrarExtra]);

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

          <div ref={modalBodyRef} className="modal-body">
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label form-label-sm">Nombre de la campaña <span className="text-danger">*</span></label>
                <input
                  ref={lemaRef}
                  className={`form-control form-control-sm ${errorLema ? 'is-invalid' : ''}`}
                  value={form.lema}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, lema: e.target.value }));
                    if (e.target.value.trim()) {
                      setErrorLema('');
                    }
                  }}
                  placeholder="Nombre o tema principal de la campaña"
                  maxLength={60}
                  required
                />
                {errorLema && <div className="text-danger small mt-1">{errorLema}</div>}
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
                <SelectorFecha
                  id="campana-fecha-inicio"
                  value={form.fecha_inicio}
                  onChange={(val) => {
                    const hoy = new Date().toLocaleDateString('en-CA');
                    if (!editandoId && val && val < hoy) {
                      setErrorFechaInicio('No se pueden registrar campañas con fecha de inicio en el pasado.');
                    } else {
                      setErrorFechaInicio('');
                    }
                    setForm((prev) => ({ ...prev, fecha_inicio: val }));
                  }}
                  placeholder="dd/mm/aaaa"
                  permitirFuturo={true}
                  zIndexPopover={1060}
                  className={errorFechaInicio ? 'is-invalid' : ''}
                />
                {errorFechaInicio && <div className="text-danger small mt-1">{errorFechaInicio}</div>}
              </div>

              <div className="col-6">
                <label className="form-label form-label-sm">Fecha fin</label>
                <SelectorFecha
                  id="campana-fecha-fin"
                  value={form.fecha_fin}
                  onChange={(nuevaFecha) => {
                    if (form.tipo === 'OTRO' && form.fecha_inicio && nuevaFecha < form.fecha_inicio) {
                      setErrorFecha('La fecha de fin no puede ser anterior a la de inicio');
                    } else {
                      setErrorFecha('');
                    }
                    setForm((prev) => ({ ...prev, fecha_fin: nuevaFecha }));
                  }}
                  disabled={form.tipo !== 'OTRO'}
                  placeholder="dd/mm/aaaa"
                  permitirFuturo={true}
                  zIndexPopover={1060}
                  className={errorFecha ? 'is-invalid' : ''}
                />
                {errorFecha && <div className="text-danger small mt-1">{errorFecha}</div>}
              </div>

              <div className="col-6">
                <label className="form-label form-label-sm">Lugar <span className="text-danger">*</span></label>
                <input
                  className={`form-control form-control-sm ${errorLugar ? 'is-invalid' : ''}`}
                  value={form.lugar}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, lugar: e.target.value }));
                    if (e.target.value.trim()) {
                      setErrorLugar('');
                    }
                  }}
                  placeholder="Lugar de la campaña"
                  maxLength={45}
                  required
                />
                {errorLugar && <div className="text-danger small mt-1">{errorLugar}</div>}
              </div>

              <div className="col-6">
                <label className="form-label form-label-sm">Hora <span className="text-danger">*</span></label>
                <input
                  type="time"
                  className={`form-control form-control-sm ${errorHora ? 'is-invalid' : ''}`}
                  value={form.hora}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, hora: e.target.value }));
                    e.target.blur();
                    if (e.target.value) {
                      setErrorHora('');
                    }
                  }}
                  required
                />
                {errorHora && <div className="text-danger small mt-1">{errorHora}</div>}
              </div>

              <div className="col-6">
                <label className="form-label form-label-sm">Predicador <span className="text-danger">*</span></label>
                <input
                  className={`form-control form-control-sm ${errorPredicador ? 'is-invalid' : ''}`}
                  value={form.predicador}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, predicador: e.target.value }));
                    if (e.target.value.trim()) {
                      setErrorPredicador('');
                    }
                  }}
                  placeholder="Predicador principal"
                  maxLength={40}
                  required
                />
                {errorPredicador && <div className="text-danger small mt-1">{errorPredicador}</div>}
              </div>

              <div className="col-12">
                <label className="form-label form-label-sm">Responsable <span className="text-danger">*</span></label>
                <input
                  className={`form-control form-control-sm ${errorResponsable ? 'is-invalid' : ''}`}
                  value={form.responsable}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, responsable: e.target.value }));
                    if (e.target.value.trim()) {
                      setErrorResponsable('');
                    }
                  }}
                  placeholder="Nombre de la persona responsable"
                  maxLength={40}
                  required
                />
                {errorResponsable && <div className="text-danger small mt-1">{errorResponsable}</div>}
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
                      maxLength={60}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label form-label-sm">Observaciones</label>
                    <textarea
                      ref={observacionesRef}
                      className="form-control form-control-sm"
                      rows="2"
                      value={form.observaciones}
                      onChange={(e) => setForm((prev) => ({ ...prev, observaciones: e.target.value }))}
                      placeholder="Notas adicionales"
                      maxLength={50}
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
                if (!form.lema || !form.lema.trim()) {
                  setErrorLema('El nombre de la campaña es obligatorio.');
                  lemaRef.current?.focus();
                  return;
                }
                if (!form.fecha_inicio) {
                  setErrorFechaInicio('La fecha de inicio es obligatoria.');
                  return;
                }
                if (!form.lugar || !form.lugar.trim()) {
                  setErrorLugar('El lugar es obligatorio.');
                  return;
                }
                if (!form.hora) {
                  setErrorHora('La hora es obligatoria.');
                  return;
                }
                if (!form.predicador || !form.predicador.trim()) {
                  setErrorPredicador('El predicador es obligatorio.');
                  return;
                }
                if (!form.responsable || !form.responsable.trim()) {
                  setErrorResponsable('El responsable es obligatorio.');
                  return;
                }
                if (form.tipo === 'OTRO' && form.fecha_fin && form.fecha_inicio && form.fecha_fin < form.fecha_inicio) {
                  setErrorFecha('La fecha de fin no puede ser anterior a la de inicio');
                  return;
                }
                onGuardar();
              }}
              disabled={guardando || !!errorFecha || !!errorFechaInicio || !!errorLema || !!errorLugar || !!errorHora || !!errorPredicador || !!errorResponsable}
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
