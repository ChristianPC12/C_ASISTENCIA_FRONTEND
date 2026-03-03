// Capa de notificaciones usando alert/confirm nativos del navegador

/**
 * Muestra un mensaje de exito al usuario
 * @param {string} mensaje
 */
export function notificarExito(mensaje) {
  window.alert(mensaje);
}

/**
 * Muestra un mensaje de error al usuario
 * @param {string} mensaje
 */
export function notificarError(mensaje) {
  window.alert(mensaje);
}

/**
 * Muestra un dialogo de confirmacion
 * @param {string} mensaje
 * @returns {boolean}
 */
export function confirmar(mensaje) {
  return window.confirm(mensaje);
}
