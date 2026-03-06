// Capa de notificaciones — toasts y modal de confirmacion
import { lanzarToast } from '../components/ui/ToastContainer';
import { lanzarConfirm } from '../components/ui/ConfirmModal';

function toastsErrorSilenciados() {
  return typeof window !== 'undefined' && window.__suppressErrorToasts === true;
}

/**
 * Muestra un toast de exito
 * @param {string} mensaje
 */
export function notificarExito(mensaje) {
  lanzarToast(mensaje, 'exito');
}

/**
 * Muestra un toast de error
 * @param {string} mensaje
 */
export function notificarError(mensaje) {
  if (toastsErrorSilenciados()) {
    return;
  }

  lanzarToast(mensaje, 'error');
}

/**
 * Muestra un toast informativo
 * @param {string} mensaje
 */
export function notificarInfo(mensaje) {
  lanzarToast(mensaje, 'info');
}

/**
 * Muestra un modal de confirmacion
 * @param {string} mensaje
 * @returns {Promise<boolean>}
 */
export function confirmar(mensaje) {
  return lanzarConfirm(mensaje);
}
