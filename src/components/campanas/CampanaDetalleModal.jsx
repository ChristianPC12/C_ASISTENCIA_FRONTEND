import { Modal } from 'bootstrap';
import { useEffect, useRef } from 'react';

export default function CampanaDetalleModal({
  mostrar,
  onCerrar,
  detalle,
  cargandoDetalle,
  detalleVista,
  setDetalleVista,
  onEditarCampana,
  resumenComponent,
  sesionesComponent,
  asistentesComponent,
  decisionesComponent
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

  if (!detalle) return null;

  const DETALLE_VISTAS = [
    { valor: 'RESUMEN', etiqueta: 'Resumen', icono: 'bi-card-text' },
    { valor: 'SESIONES', etiqueta: 'Días', icono: 'bi-calendar-event' },
    { valor: 'ASISTENTES', etiqueta: 'Asistentes', icono: 'bi-people' },
    { valor: 'DECISIONES', etiqueta: 'Decisiones', icono: 'bi-check2-circle' }
  ];

  return (
    <div
      ref={modalRef}
      className="modal fade"
      tabIndex="-1"
      aria-labelledby="campanaDetalleModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header">
            <div style={{ flex: 1 }}>
              <h5 className="modal-title" id="campanaDetalleModalLabel">
                {detalle?.lema}
              </h5>
              <small className="text-muted">
                {detalle?.fecha_inicio} - {detalle?.fecha_fin}
              </small>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={onCerrar}
              aria-label="Cerrar"
            ></button>
          </div>

          {/* Body con tabs */}
          <div className="modal-body">
            {/* Tab bar */}
            <div className="campanas-vista-tabs mb-3">
              {DETALLE_VISTAS.map((vista) => (
                <button
                  key={vista.valor}
                  type="button"
                  className={`btn btn-sm ${detalleVista === vista.valor ? 'btn-primary' : 'btn-outline-primary'} admin-responsive-action-btn`}
                  onClick={() => setDetalleVista(vista.valor)}
                >
                  <i className={`bi ${vista.icono}`} aria-hidden="true"></i>
                  <span className="admin-responsive-btn-label">{vista.etiqueta}</span>
                </button>
              ))}
            </div>

            {/* Contenido de la tab actual */}
            <div className="campanas-detalle-scroll">
              {cargandoDetalle && (
                <div className="d-flex justify-content-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                </div>
              )}

              {!cargandoDetalle && detalleVista === 'RESUMEN' && resumenComponent}
              {!cargandoDetalle && detalleVista === 'SESIONES' && sesionesComponent}
              {!cargandoDetalle && detalleVista === 'ASISTENTES' && asistentesComponent}
              {!cargandoDetalle && detalleVista === 'DECISIONES' && decisionesComponent}
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm admin-responsive-action-btn"
              onClick={onCerrar}
            >
              <i className="bi bi-x-lg" aria-hidden="true"></i>
              <span className="admin-responsive-btn-label">Cerrar</span>
            </button>
            {onEditarCampana && (
              <button
                type="button"
                className="btn btn-primary btn-sm admin-responsive-action-btn"
                onClick={() => onEditarCampana(detalle)}
              >
                <i className="bi bi-pencil-square" aria-hidden="true"></i>
                <span className="admin-responsive-btn-label">Editar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
