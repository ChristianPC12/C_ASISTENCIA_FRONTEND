import { recortar } from '../utils/sanitizer';

/**
 * Valida el formulario de login
 * @param {{ usuario: string, password: string }} datos
 * @returns {{ valido: boolean, errores: Object }}
 */
export function validarLogin(datos) {
  const errores = {};

  const usuario = recortar(datos.usuario || '');
  if (!usuario) {
    errores.usuario = 'El usuario es obligatorio.';
  } else if (usuario.length < 3 || usuario.length > 50) {
    errores.usuario = 'El usuario debe tener entre 3 y 50 caracteres.';
  }

  const password = datos.password || '';
  if (!password) {
    errores.password = 'La contraseña es obligatoria.';
  }

  return {
    valido: Object.keys(errores).length === 0,
    errores
  };
}
