import { useCallback, useEffect, useMemo, useState } from 'react';
import superadminApi from '../api/superadminApi';
import { sanitizarObjeto } from '../utils/sanitizer';
import { notificarError, notificarExito } from '../utils/notify';
import { useAuth } from './useAuth';

const NOMBRE_MIN = 5;
const NOMBRE_MAX = 40;
const USUARIO_MIN = 3;
const USUARIO_MAX = 20;
const PASSWORD_MIN = 12;
const PASSWORD_MAX = 64;
const NOMBRE_REGEX = /^[\p{L}.,'()\- ]+$/u;
const USUARIO_REGEX = /^[a-z0-9._-]+$/;

const FORMULARIO_SUPERADMIN_INICIAL = {
  id: null,
  nombre_completo: '',
  usuario: '',
  password: '',
  password_confirmacion: '',
  activo: true
};

function normalizarNombre(valor) {
  return String(valor || '')
    .replace(/[0-9]/g, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, NOMBRE_MAX);
}

function normalizarUsuario(valor) {
  return String(valor || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .slice(0, USUARIO_MAX);
}

function validarPasswordFuerte(password) {
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    return `La contraseña debe tener entre ${PASSWORD_MIN} y ${PASSWORD_MAX} caracteres.`;
  }

  if (/\s/.test(password)) {
    return 'La contraseña no puede contener espacios.';
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

  return '';
}

function validarFormulario(formulario, esEdicion) {
  const errores = {};
  const nombre = String(formulario.nombre_completo || '').trim();
  const usuario = String(formulario.usuario || '').trim();
  const password = String(formulario.password || '');
  const passwordConfirmacion = String(formulario.password_confirmacion || '');

  if (nombre.length < NOMBRE_MIN || nombre.length > NOMBRE_MAX) {
    errores.nombre_completo = 'El nombre completo debe tener entre 5 y 40 caracteres.';
  } else if (NOMBRE_REGEX.test(nombre) !== true) {
    errores.nombre_completo = 'Use solo letras y signos básicos válidos en el nombre.';
  }

  if (usuario.length < USUARIO_MIN || usuario.length > USUARIO_MAX) {
    errores.usuario = 'El usuario debe tener entre 3 y 20 caracteres.';
  } else if (USUARIO_REGEX.test(usuario) !== true) {
    errores.usuario = 'Use solo letras, números, punto, guion y guion bajo.';
  }

  if (!esEdicion && password.length === 0) {
    errores.password = 'La contraseña es obligatoria.';
  }

  if (password) {
    const errorPassword = validarPasswordFuerte(password);
    if (errorPassword) {
      errores.password = errorPassword;
    }
  }

  if (!password && passwordConfirmacion) {
    errores.password_confirmacion = 'Primero escriba la contraseña.';
  } else if (password && !passwordConfirmacion) {
    errores.password_confirmacion = 'Repita la contraseña para confirmarla.';
  } else if (password && passwordConfirmacion && password !== passwordConfirmacion) {
    errores.password_confirmacion = 'Las contraseñas no coinciden.';
  }

  return {
    valido: Object.keys(errores).length === 0,
    errores
  };
}

function ordenarSuperadmins(items) {
  return [...(Array.isArray(items) ? items : [])].sort((a, b) => {
    if (!!a?.activo !== !!b?.activo) {
      return a?.activo ? -1 : 1;
    }
    return String(a?.nombre_completo || '').localeCompare(String(b?.nombre_completo || ''), 'es', {
      sensitivity: 'base'
    });
  });
}

export function useSuperadminUsuarios({ enabled = true } = {}) {
  const { usuario, refrescarSesion, cerrarSesion } = useAuth();
  const [superadmins, setSuperadmins] = useState([]);
  const [formularioSuperadmin, setFormularioSuperadmin] = useState(FORMULARIO_SUPERADMIN_INICIAL);
  const [erroresSuperadmin, setErroresSuperadmin] = useState({});
  const [cargandoSuperadmins, setCargandoSuperadmins] = useState(false);
  const [guardandoSuperadmin, setGuardandoSuperadmin] = useState(false);

  const cargarSuperadmins = useCallback(async () => {
    setCargandoSuperadmins(true);
    try {
      const res = await superadminApi.listarSuperadmins();
      const items = ordenarSuperadmins(res?.datos?.items || []);
      setSuperadmins(items);
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo cargar el mantenimiento de superadministradores.');
    } finally {
      setCargandoSuperadmins(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    void cargarSuperadmins();
  }, [cargarSuperadmins, enabled]);

  const cambiarCampoSuperadmin = useCallback((campo, valor) => {
    setFormularioSuperadmin((prev) => {
      switch (campo) {
        case 'nombre_completo':
          return { ...prev, nombre_completo: normalizarNombre(valor) };
        case 'usuario':
          return { ...prev, usuario: normalizarUsuario(valor) };
        case 'activo':
          return { ...prev, activo: !!valor };
        case 'password':
        case 'password_confirmacion':
          return { ...prev, [campo]: String(valor || '').slice(0, PASSWORD_MAX) };
        default:
          return { ...prev, [campo]: valor };
      }
    });

    setErroresSuperadmin((prev) => {
      if (!prev[campo]) {
        return prev;
      }
      const copia = { ...prev };
      delete copia[campo];
      return copia;
    });
  }, []);

  const limpiarFormularioSuperadmin = useCallback(() => {
    setFormularioSuperadmin(FORMULARIO_SUPERADMIN_INICIAL);
    setErroresSuperadmin({});
  }, []);

  const iniciarEdicionSuperadmin = useCallback((item) => {
    setFormularioSuperadmin({
      id: Number(item?.id) || null,
      nombre_completo: String(item?.nombre_completo || ''),
      usuario: String(item?.usuario || ''),
      password: '',
      password_confirmacion: '',
      activo: item?.activo !== false
    });
    setErroresSuperadmin({});
  }, []);

  const cancelarEdicionSuperadmin = useCallback(() => {
    limpiarFormularioSuperadmin();
  }, [limpiarFormularioSuperadmin]);

  const guardarSuperadmin = useCallback(async () => {
    const esEdicion = Number.isInteger(formularioSuperadmin.id) && formularioSuperadmin.id > 0;
    const validacion = validarFormulario(formularioSuperadmin, esEdicion);
    if (!validacion.valido) {
      setErroresSuperadmin(validacion.errores);
      return false;
    }

    setGuardandoSuperadmin(true);
    setErroresSuperadmin({});

    try {
      const sanitizado = sanitizarObjeto(formularioSuperadmin);

      if (!esEdicion) {
        const res = await superadminApi.crearSuperadmin({
          nombre_completo: sanitizado.nombre_completo,
          usuario: sanitizado.usuario,
          password: formularioSuperadmin.password
        });

        if (!res?.exito) {
          notificarError(res?.mensaje || 'No se pudo crear el superadministrador.');
          return false;
        }

        notificarExito(res?.mensaje || 'Superadministrador creado correctamente.');
        limpiarFormularioSuperadmin();
        await cargarSuperadmins();
        return true;
      }

      const usuarioId = Number(formularioSuperadmin.id);
      const resActualizacion = await superadminApi.actualizarSuperadmin(usuarioId, {
        nombre_completo: sanitizado.nombre_completo,
        usuario: sanitizado.usuario,
        activo: !!formularioSuperadmin.activo
      });

      if (!resActualizacion?.exito) {
        notificarError(resActualizacion?.mensaje || 'No se pudo actualizar el superadministrador.');
        return false;
      }

      let cambioPasswordPropio = false;
      if (formularioSuperadmin.password) {
        const resPassword = await superadminApi.actualizarPasswordSuperadmin(usuarioId, {
          password: formularioSuperadmin.password
        });

        if (!resPassword?.exito) {
          notificarError(resPassword?.mensaje || 'No se pudo actualizar la contraseña.');
          return false;
        }

        cambioPasswordPropio = Number(usuario?.id) === usuarioId;
      }

      notificarExito('Superadministrador actualizado correctamente.');
      limpiarFormularioSuperadmin();
      await cargarSuperadmins();

      if (Number(usuario?.id) === usuarioId) {
        if (cambioPasswordPropio) {
          notificarExito('Su contraseña cambió. Inicie sesión nuevamente con la nueva clave.');
          await cerrarSesion();
          return true;
        }

        await refrescarSesion();
      }

      return true;
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo guardar el superadministrador.');
      return false;
    } finally {
      setGuardandoSuperadmin(false);
    }
  }, [
    formularioSuperadmin,
    usuario?.id,
    cargarSuperadmins,
    limpiarFormularioSuperadmin,
    refrescarSesion,
    cerrarSesion
  ]);

  const superadminActual = useMemo(
    () => superadmins.find((item) => Number(item?.id) === Number(usuario?.id)) || null,
    [superadmins, usuario?.id]
  );

  return {
    superadmins,
    superadminActual,
    formularioSuperadmin,
    erroresSuperadmin,
    cargandoSuperadmins,
    guardandoSuperadmin,
    cambiarCampoSuperadmin,
    iniciarEdicionSuperadmin,
    cancelarEdicionSuperadmin,
    limpiarFormularioSuperadmin,
    guardarSuperadmin,
    recargarSuperadmins: cargarSuperadmins
  };
}
