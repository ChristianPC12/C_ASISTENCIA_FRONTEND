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
  exito:  'bi-check-circle-fill',
  error:  'bi-exclamation-circle-fill',
  info:   'bi-info-circle-fill',
};

const DURACION = 3500;

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const agregar = useCallback((toast) => {
    setToasts((prev) => [...prev, { ...toast, saliendo: false }]);
  }, []);

  // Registrar dispatch al montar
  useEffect(() => {
    registrarDispatchToast(agregar);
    return () => { agregarToastExterno = null; };
  }, [agregar]);

  // Auto-remover tras la duración
  useEffect(() => {
    if (toasts.length === 0) return;

    const ultimo = toasts[toasts.length - 1];
    const timer = setTimeout(() => {
      // Iniciar animación de salida
      setToasts((prev) =>
        prev.map((t) => (t.id === ultimo.id ? { ...t, saliendo: true } : t))
      );
      // Remover del DOM tras la animación
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== ultimo.id));
      }, 300);
    }, DURACION);

    return () => clearTimeout(timer);
  }, [toasts]);

  const cerrar = (id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, saliendo: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  };

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
