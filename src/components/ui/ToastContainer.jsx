import { useState, useEffect, useCallback } from 'react';

/**
 * Contenedor de toasts flotantes.
 * Se monta una sola vez en App.jsx y se controla desde notify.js
 */

// Referencia global al dispatch para poder lanzar toasts desde fuera de React
let agregarToastExterno = null;

export function registrarDispatchToast(fn) {
  agregarToastExterno = fn;
}

export function lanzarToast(mensaje, tipo = 'exito') {
  if (agregarToastExterno) {
    agregarToastExterno({ mensaje, tipo, id: Date.now() });
  }
}

const ICONOS = {
  exito: 'bi-check-circle-fill',
  error: 'bi-exclamation-circle-fill',
  info: 'bi-info-circle-fill',
  advertencia: 'bi-exclamation-triangle-fill'
};

const DURACION = 3500;

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const agregar = useCallback((toast) => {
    setToasts((prev) => [...prev, { ...toast, saliendo: false }]);
  }, []);

  const removerToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const iniciarSalidaToast = useCallback((id) => {
    setToasts((prev) =>
      prev.map((toast) => (toast.id === id ? { ...toast, saliendo: true } : toast))
    );

    setTimeout(() => {
      removerToast(id);
    }, 300);
  }, [removerToast]);

  useEffect(() => {
    registrarDispatchToast(agregar);
    return () => { agregarToastExterno = null; };
  }, [agregar]);

  useEffect(() => {
    if (toasts.length === 0) return;

    const ultimo = toasts[toasts.length - 1];
    const timer = setTimeout(() => {
      iniciarSalidaToast(ultimo.id);
    }, DURACION);

    return () => clearTimeout(timer);
  }, [toasts, iniciarSalidaToast]);

  const cerrar = useCallback((id) => {
    iniciarSalidaToast(id);
  }, [iniciarSalidaToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container-iasd">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-iasd toast-iasd-${toast.tipo}${toast.saliendo ? ' toast-iasd-saliendo' : ''}`}
        >
          <i className={`bi ${ICONOS[toast.tipo] || ICONOS.info} toast-iasd-icono`}></i>
          <span className="toast-iasd-mensaje">{toast.mensaje}</span>
          <button
            className="toast-iasd-cerrar"
            onClick={() => cerrar(toast.id)}
            aria-label="Cerrar"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
