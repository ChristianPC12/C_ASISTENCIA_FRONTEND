import { Modal } from 'bootstrap';
import { useEffect, useRef } from 'react';

export default function CampanaDetalleModal({
  mostrar,
  onCerrar,
  detalle,
  cargandoDetalle,
  detalleVista,
  setDetalleVista,
  resumenComponent,
  sesionesComponent,
  regAsistenciaComponent,
  asistentesComponent,
  regDecisionComponent,
  decisionesComponent,
  onCerrarConLimpieza
}) {
  const modalRef = useRef(null);
  const modalInstance = useRef(null);
  const scrollRef = useRef(null);
  const modalBodyRef = useRef(null);
  const cerrarRef = useRef(onCerrarConLimpieza || onCerrar);
  cerrarRef.current = onCerrarConLimpieza || onCerrar;

  useEffect(() => {
    if (!modalRef.current) return;

    if (!modalInstance.current) {
      modalInstance.current = new Modal(modalRef.current);
      modalRef.current.addEventListener('hidden.bs.modal', () => {
        cerrarRef.current?.();
      });
    }

    if (mostrar) {
      modalInstance.current.show();
    } else {
      modalInstance.current.hide();
    }
  }, [mostrar]);

  useEffect(() => {
    if (mostrar && modalBodyRef.current) {
      modalBodyRef.current.scrollTop = 0;
    }
  }, [mostrar]);

  useEffect(() => {
    if (modalBodyRef.current) {
      modalBodyRef.current.scrollTop = 0;
    }
  }, [detalleVista]);

  if (!detalle) return null;

  const DETALLE_VISTAS = [
    { valor: 'RESUMEN', etiqueta: 'Resumen', icono: 'bi-card-text' },
    { valor: 'SESIONES', etiqueta: 'Días', icono: 'bi-calendar-event' },
    { valor: 'REG_ASISTENCIA', etiqueta: 'Asistencia', icono: 'bi-person-check' },
    { valor: 'ASISTENTES', etiqueta: 'Visitas', icono: 'bi-people' },
    { valor: 'REG_DECISION', etiqueta: 'Reg. decisión', icono: 'bi-journal-plus' },
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
      <div className="modal-dialog modal-xl" style={{ display: 'flex', flexDirection: 'column', height: '85vh' }}>
        <div className="modal-content" style={{ display: 'flex', flexDirection: 'column', maxHeight: '85vh', overflow: 'hidden' }}>
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
              onClick={onCerrarConLimpieza || onCerrar}
              aria-label="Cerrar"
            ></button>
          </div>

          {/* Body con tabs */}
          <div className="modal-body" ref={modalBodyRef} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
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
            <div className="campanas-detalle-scroll" ref={scrollRef}>
              {cargandoDetalle && (
                <div className="d-flex justify-content-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                </div>
              )}

              {!cargandoDetalle && detalleVista === 'RESUMEN' && resumenComponent}
              {!cargandoDetalle && detalleVista === 'SESIONES' && sesionesComponent}
              {!cargandoDetalle && detalleVista === 'REG_ASISTENCIA' && regAsistenciaComponent}
              {!cargandoDetalle && detalleVista === 'ASISTENTES' && asistentesComponent}
              {!cargandoDetalle && detalleVista === 'REG_DECISION' && regDecisionComponent}
              {!cargandoDetalle && detalleVista === 'DECISIONES' && decisionesComponent}
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm admin-responsive-action-btn"
              onClick={onCerrarConLimpieza || onCerrar}
            >
              <i className="bi bi-x-lg" aria-hidden="true"></i>
              <span className="admin-responsive-btn-label">Cerrar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
