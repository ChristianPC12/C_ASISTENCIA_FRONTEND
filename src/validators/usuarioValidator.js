import { recortar } from '../utils/sanitizer';
import { LIMITES } from '../config/constants';

function validarPasswordFuerte(password) {
  if (password.length < LIMITES.PASSWORD_MIN || password.length > LIMITES.PASSWORD_MAX) {
    return `La contraseña debe tener entre ${LIMITES.PASSWORD_MIN} y ${LIMITES.PASSWORD_MAX} caracteres.`;
  }

  if (!/[a-z]/.test(password)) {
    return 'La contraseña debe incluir al menos una letra minúscula.';
  }

  if (!/[A-Z]/.test(password)) {
    return 'La contraseña debe incluir al menos una letra mayúscula.';
  }

  if (!/\d/.test(password)) {
    return 'La contraseña debe incluir al menos un número.';
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'La contraseña debe incluir al menos un carácter especial.';
  }

  if (/\s/.test(password)) {
    return 'La contraseña no puede contener espacios.';
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

  // Nombre completo
  const nombre = recortar(datos.nombre_completo || '');
  if (!nombre) {
    errores.nombre_completo = 'El nombre completo es obligatorio.';
  } else if (nombre.length < LIMITES.NOMBRE_COMPLETO_MIN) {
    errores.nombre_completo = `El nombre debe tener al menos ${LIMITES.NOMBRE_COMPLETO_MIN} caracteres.`;
  } else if (nombre.length > LIMITES.NOMBRE_COMPLETO_MAX) {
    errores.nombre_completo = `El nombre no puede superar los ${LIMITES.NOMBRE_COMPLETO_MAX} caracteres.`;
  }

  // Usuario
  const usuario = recortar(datos.usuario || '');
  if (!usuario) {
    errores.usuario = 'El nombre de usuario es obligatorio.';
  } else if (usuario.length < LIMITES.USUARIO_MIN) {
    errores.usuario = `El usuario debe tener al menos ${LIMITES.USUARIO_MIN} caracteres.`;
  } else if (usuario.length > LIMITES.USUARIO_MAX) {
    errores.usuario = `El usuario no puede superar los ${LIMITES.USUARIO_MAX} caracteres.`;
  }

  // Password
  const password = datos.password || '';
  if (!esEdicion && !password) {
    errores.password = 'La contraseña es obligatoria.';
  } else if (password) {
    const errorPassword = validarPasswordFuerte(password);
    if (errorPassword) {
      errores.password = errorPassword;
    }
  }

  // Rol
  if (!datos.rol_id || ![1, 2].includes(Number(datos.rol_id))) {
    errores.rol_id = 'Debe seleccionar un rol válido.';
  }

  return {
    valido: Object.keys(errores).length === 0,
    errores
  };
}
