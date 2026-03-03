import { useState, useEffect, useCallback } from 'react';

/**
 * Modal de confirmacion reutilizable.
 * Se monta una sola vez en App.jsx y se controla desde notify.js
 */

let mostrarConfirmExterno = null;

export function registrarDispatchConfirm(fn) {
  mostrarConfirmExterno = fn;
}

export function lanzarConfirm(mensaje) {
  if (mostrarConfirmExterno) {
    return mostrarConfirmExterno(mensaje);
  }
  // Fallback si el componente no esta montado
  return Promise.resolve(window.confirm(mensaje));
}

export default function ConfirmModal() {
  const [visible, setVisible] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [resolver, setResolver] = useState(null);
  const [saliendo, setSaliendo] = useState(false);

  const mostrar = useCallback((msg) => {
    return new Promise((resolve) => {
      setMensaje(msg);
      setVisible(true);
      setSaliendo(false);
      setResolver(() => resolve);
    });
  }, []);

  useEffect(() => {
    registrarDispatchConfirm(mostrar);
    return () => { mostrarConfirmExterno = null; };
  }, [mostrar]);

  const cerrarConAnimacion = (resultado) => {
    setSaliendo(true);
    setTimeout(() => {
      setVisible(false);
      setSaliendo(false);
      if (resolver) resolver(resultado);
      setResolver(null);
    }, 200);
  };

  const aceptar = () => cerrarConAnimacion(true);
  const cancelar = () => cerrarConAnimacion(false);

  // Cerrar con Escape
  useEffect(() => {
    if (!visible) return;
    const handler = (e) => {
      if (e.key === 'Escape') cancelar();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  });

  if (!visible) return null;

  return (
    <div className={`confirm-overlay-iasd${saliendo ? ' confirm-saliendo' : ''}`}>
      <div className="confirm-modal-iasd">
        <div className="confirm-icono-wrapper">
          <i className="bi bi-question-circle confirm-icono"></i>
        </div>
        <p className="confirm-mensaje">{mensaje}</p>
        <div className="confirm-acciones">
          <button className="confirm-btn confirm-btn-cancelar" onClick={cancelar}>
            Cancelar
          </button>
          <button className="confirm-btn confirm-btn-aceptar" onClick={aceptar} autoFocus>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
