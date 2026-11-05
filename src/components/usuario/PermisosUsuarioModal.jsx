import { useEffect, useRef, useState } from 'react';
import { ETIQUETA_NIVEL, NIVELES_PERMISO, SECCIONES_PERMISO } from '../../config/constants';

/**
 * Ventana para elegir el acceso de un usuario: administrador o secciones con su nivel.
 * Trabaja sobre una copia local; solo aplica al pulsar "Aplicar".
 */
export default function PermisosUsuarioModal({ esAdmin, permisos, onAplicar, onCerrar }) {
  const [adminLocal, setAdminLocal] = useState(!!esAdmin);
  const [permisosLocal, setPermisosLocal] = useState(() => ({ ...(permisos || {}) }));
  const cuerpoRef = useRef(null);

  useEffect(() => {
    if (cuerpoRef.current) cuerpoRef.current.scrollTop = 0;

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const manejarTecla = (event) => {
      if (event.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', manejarTecla);
    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener('keydown', manejarTecla);
    };
  }, [onCerrar]);

  // Clic en el nivel activo lo quita (sin acceso).
  const elegirNivel = (clave, nivel) => {
    setPermisosLocal((prev) => {
      const siguiente = { ...prev };
      if (siguiente[clave] === nivel) {
        delete siguiente[clave];
      } else {
        siguiente[clave] = nivel;
      }
      return siguiente;
    });
  };

  const totalSecciones = Object.keys(permisosLocal).length;

  return (
    <>
      <div className="modal d-block" tabIndex="-1" role="dialog" aria-modal="true" aria-labelledby="permisos-usuario-titulo">
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable permisos-modal">
          <div className="modal-content">
            <div className="modal-header py-2">
              <h6 className="modal-title" id="permisos-usuario-titulo">
                <i className="bi bi-shield-check me-2" aria-hidden="true"></i>
                Secciones y permisos
              </h6>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={onCerrar}></button>
            </div>

            <div className="modal-body p-2" ref={cuerpoRef}>
              <div className="permisos-fila permisos-fila-admin">
                <label className="permisos-nombre fw-semibold mb-0" htmlFor="permisos-es-admin">
                  <i className="bi bi-sliders2 me-2" aria-hidden="true"></i>
                  Administrador
                </label>
                <div className="form-check form-switch mb-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="permisos-es-admin"
                    checked={adminLocal}
                    onChange={(event) => setAdminLocal(event.target.checked)}
                  />
                </div>
              </div>

              {adminLocal ? (
                <p className="small text-muted text-center my-3">Acceso total a todo el sistema.</p>
              ) : (
                SECCIONES_PERMISO.map((seccion) => {
                  const nivel = permisosLocal[seccion.clave] || '';
                  const esInstructor = nivel === NIVELES_PERMISO.INSTRUCTOR;
                  return (
                    <div key={seccion.clave} className={`permisos-fila ${nivel ? 'is-activo' : ''}`}>
                      <div className="permisos-nombre">
                        <span className="fw-semibold">{seccion.etiqueta}</span>
                        {seccion.nota && <small className="permisos-nota">{seccion.nota}</small>}
                        {esInstructor && <small className="permisos-nota">Instructor: se gestiona en Estudios Bíblicos.</small>}
                      </div>
                      {esInstructor ? (
                        <span className="badge text-bg-secondary">{ETIQUETA_NIVEL.INSTRUCTOR}</span>
                      ) : (
                        <div className="btn-group btn-group-sm permisos-niveles" role="group" aria-label={`Nivel en ${seccion.etiqueta}`}>
                          {seccion.niveles.map((opcion) => (
                            <button
                              key={opcion}
                              type="button"
                              className={`btn ${nivel === opcion ? 'btn-primary' : 'btn-outline-secondary'}`}
                              aria-pressed={nivel === opcion}
                              onClick={() => elegirNivel(seccion.clave, opcion)}
                            >
                              {ETIQUETA_NIVEL[opcion]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="modal-footer py-2">
              {!adminLocal && (
                <span className="me-auto small text-muted">
                  {totalSecciones === 0 ? 'Toque Lector o Editor' : `${totalSecciones} sección(es)`}
                </span>
              )}
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onCerrar}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => onAplicar({ esAdmin: adminLocal, permisos: adminLocal ? {} : permisosLocal })}
                disabled={!adminLocal && totalSecciones === 0}
              >
                <i className="bi bi-check2 me-1" aria-hidden="true"></i>
                Aplicar
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show"></div>
    </>
  );
}
