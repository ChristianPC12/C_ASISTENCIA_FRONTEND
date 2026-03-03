// Capa de notificaciones — toasts y modal de confirmacion
import { lanzarToast } from '../components/ui/ToastContainer';
import { lanzarConfirm } from '../components/ui/ConfirmModal';

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
  lanzarToast(mensaje, 'error');
}

/**
 * Muestra un modal de confirmacion
 * @param {string} mensaje
 * @returns {Promise<boolean>}
 */
export function confirmar(mensaje) {
  return lanzarConfirm(mensaje);
}
