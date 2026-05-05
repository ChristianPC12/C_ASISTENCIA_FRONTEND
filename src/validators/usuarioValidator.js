import { recortar } from '../utils/sanitizer';
import { LIMITES } from '../config/constants';

function validarPasswordFuerte(password) {
  if (password.length < LIMITES.PASSWORD_MIN || password.length > LIMITES.PASSWORD_MAX) {
    return `La contrase\u00f1a debe tener entre ${LIMITES.PASSWORD_MIN} y ${LIMITES.PASSWORD_MAX} caracteres.`;
  }

  if (!/[a-z]/.test(password)) {
    return 'La contrase\u00f1a debe incluir al menos una letra min\u00fascula.';
  }

  if (!/[A-Z]/.test(password)) {
    return 'La contrase\u00f1a debe incluir al menos una letra may\u00fascula.';
  }

  if (!/\d/.test(password)) {
    return 'La contrase\u00f1a debe incluir al menos un n\u00famero.';
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'La contrase\u00f1a debe incluir al menos un car\u00e1cter especial.';
  }

  if (/\s/.test(password)) {
    return 'La contrase\u00f1a no puede contener espacios.';
  }

  return '';
}

/**
 * Valida el formulario de usuario
 * @param {Object} datos - Datos del formulario
 * @param {boolean} esEdicion - Si es edicion, el password es opcional
 * @returns {{ valido: boolean, errores: Object }}
 */
export function validarUsuario(datos, esEdicion = false) {
  const errores = {};

  const nombre = recortar(datos.nombre_completo || '');
  if (!nombre) {
    errores.nombre_completo = 'El nombre completo es obligatorio.';
  } else if (nombre.length < LIMITES.NOMBRE_COMPLETO_MIN) {
    errores.nombre_completo = `El nombre debe tener al menos ${LIMITES.NOMBRE_COMPLETO_MIN} caracteres.`;
  } else if (nombre.length > LIMITES.NOMBRE_COMPLETO_MAX) {
    errores.nombre_completo = `El nombre no puede superar los ${LIMITES.NOMBRE_COMPLETO_MAX} caracteres.`;
  }

  const usuario = recortar(datos.usuario || '');
  if (!usuario) {
    errores.usuario = 'El nombre de usuario es obligatorio.';
  } else if (usuario.length < LIMITES.USUARIO_MIN) {
    errores.usuario = `El usuario debe tener al menos ${LIMITES.USUARIO_MIN} caracteres.`;
  } else if (usuario.length > LIMITES.USUARIO_MAX) {
    errores.usuario = `El usuario no puede superar los ${LIMITES.USUARIO_MAX} caracteres.`;
  }

  const cargo = recortar(datos.cargo || '');
  if (cargo.length > 120) {
    errores.cargo = 'El cargo no puede superar los 120 caracteres.';
  }

  const password = datos.password || '';
  const passwordConfirmacion = datos.password_confirmacion || '';

  if (!esEdicion && !password) {
    errores.password = 'La contrase\u00f1a es obligatoria.';
  } else if (password) {
    const errorPassword = validarPasswordFuerte(password);
    if (errorPassword) {
      errores.password = errorPassword;
    }
  }

  if (!password && passwordConfirmacion) {
    errores.password_confirmacion = 'Escriba la contrase\u00f1a antes de confirmarla.';
  } else if (password && !passwordConfirmacion) {
    errores.password_confirmacion = 'Debe repetir la contrase\u00f1a.';
  } else if (password && passwordConfirmacion && password !== passwordConfirmacion) {
    errores.password_confirmacion = 'Las contrase\u00f1as no coinciden.';
  }

  if (!datos.rol_id || ![1, 2, 4, 5].includes(Number(datos.rol_id))) {
    errores.rol_id = 'Debe seleccionar un rol v\u00e1lido.';
  }

  return {
    valido: Object.keys(errores).length === 0,
    errores
  };
}
