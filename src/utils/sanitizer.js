/**
 * Elimina espacios al inicio y final de un string
 * @param {string} valor
 * @returns {string}
 */
export function recortar(valor) {
  if (typeof valor !== 'string') return '';
  return valor.trim();
}

/**
 * Elimina etiquetas HTML de un string
 * @param {string} valor
 * @returns {string}
 */
export function eliminarHtml(valor) {
  if (typeof valor !== 'string') return '';
  return valor.replace(/<[^>]*>/g, '');
}

/**
 * Sanitiza un valor de texto: recorta y elimina HTML
 * @param {string} valor
 * @returns {string}
 */
export function sanitizar(valor) {
  return eliminarHtml(recortar(valor));
}

/**
 * Sanitiza todos los campos de texto de un objeto
 * @param {Object} objeto
 * @returns {Object} Nuevo objeto con campos de texto sanitizados
 */
export function sanitizarObjeto(objeto) {
  const resultado = {};
  for (const [clave, valor] of Object.entries(objeto)) {
    resultado[clave] = typeof valor === 'string' ? sanitizar(valor) : valor;
  }
  return resultado;
}

/**
 * Convierte un valor a entero no negativo, retorna 0 si no es valido
 * @param {*} valor
 * @returns {number}
 */
export function aEnteroPositivo(valor) {
  const num = parseInt(valor, 10);
  return isNaN(num) || num < 0 ? 0 : num;
}
