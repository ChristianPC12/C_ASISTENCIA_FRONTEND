import { useState, useEffect, useCallback, useMemo } from 'react';
import usuarioApi from '../api/usuarioApi';
import { validarUsuario } from '../validators/usuarioValidator';
import { sanitizarObjeto } from '../utils/sanitizer';
import { notificarExito, notificarError, confirmar } from '../utils/notify';
import { USUARIO_FORM_INICIAL } from '../config/constants';

const ROL_ID_TO_NOMBRE = {
  1: 'ADMIN',
  2: 'SECRETARIO'
};

function mensajeCupoHumano(mensajeBackend) {
  if (!mensajeBackend) {
    return 'No hay cupo disponible para ese rol en esta organización.';
  }
  return `No se pudo completar la acción por política de cupos: ${mensajeBackend}`;
}

function esErrorDeCupo(errorOrMessage) {
  const codigo = String(errorOrMessage?.codigo || '').toUpperCase();
  const mensaje = typeof errorOrMessage === 'string'
    ? errorOrMessage.toLowerCase()
    : String(errorOrMessage?.mensaje || '').toLowerCase();

  return codigo === 'CUPOS_EXCEEDED' || mensaje.includes('cupo');
}

/**
 * Hook para CRUD de usuarios y politica de cupos por rol (solo ADMIN)
 */
export function useUsuario() {
  const [usuarios, setUsuarios] = useState([]);
  const [formulario, setFormulario] = useState({ ...USUARIO_FORM_INICIAL });
  const [editandoId, setEditandoId] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState({});
  const [cuposRoles, setCuposRoles] = useState([]);
  const [resumenCupos, setResumenCupos] = useState(null);
  const [cargandoCupos, setCargandoCupos] = useState(false);
  const [guardandoCupos, setGuardandoCupos] = useState(false);

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    try {
      const res = await usuarioApi.listar();
      if (res.exito) {
        setUsuarios(res.datos || []);
      }
    } catch (error) {
      notificarError('Error al cargar los usuarios.');
      setUsuarios([]);
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarCupos = useCallback(async () => {
    setCargandoCupos(true);
    try {
      const res = await usuarioApi.obtenerCupos();
      if (res?.exito) {
        setCuposRoles(res?.datos?.roles || []);
        setResumenCupos(res?.datos?.resumen || null);
      }
    } catch (error) {
      setCuposRoles([]);
      setResumenCupos(null);
      notificarError(error?.mensaje || 'No se pudieron cargar los cupos por rol.');
    } finally {
      setCargandoCupos(false);
    }
  }, []);

  useEffect(() => {
    cargarUsuarios();
    cargarCupos();
  }, [cargarUsuarios, cargarCupos]);

  const cambiarCampo = useCallback((campo, valor) => {
    setFormulario((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => {
      const nuevos = { ...prev };
      delete nuevos[campo];
      return nuevos;
    });
  }, []);

  const limpiarFormulario = useCallback(() => {
    setFormulario({ ...USUARIO_FORM_INICIAL });
    setEditandoId(null);
    setErrores({});
  }, []);

  const manejarErrorGuardarUsuario = useCallback((error) => {
    if (esErrorDeCupo(error)) {
      notificarError(mensajeCupoHumano(error?.mensaje));
      return;
    }
    notificarError(error?.mensaje || 'Error al guardar el usuario.');
  }, []);

  const guardar = useCallback(async () => {
    const esEdicion = !!editandoId;
    const validacion = validarUsuario(formulario, esEdicion);

    if (!validacion.valido) {
      setErrores(validacion.errores);
      return false;
    }

    setCargando(true);
    setErrores({});

    try {
      const datos = sanitizarObjeto({
        nombre_completo: formulario.nombre_completo,
        usuario: formulario.usuario,
        rol_id: Number(formulario.rol_id),
        ...(formulario.password ? { password: formulario.password } : {}),
        ...(esEdicion ? { activo: formulario.activo } : {})
      });

      let res;
      if (esEdicion) {
        res = await usuarioApi.actualizar(editandoId, datos);
      } else {
        res = await usuarioApi.crear(datos);
      }

      if (res.exito) {
        notificarExito(res.mensaje);
        limpiarFormulario();
        await Promise.all([cargarUsuarios(), cargarCupos()]);
        return true;
      }

      manejarErrorGuardarUsuario(res);
      return false;
    } catch (error) {
      manejarErrorGuardarUsuario(error);
      return false;
    } finally {
      setCargando(false);
    }
  }, [formulario, editandoId, manejarErrorGuardarUsuario, cargarUsuarios, cargarCupos, limpiarFormulario]);

  const editar = useCallback((usuario) => {
    setFormulario({
      id: usuario.id,
      nombre_completo: usuario.nombre_completo,
      usuario: usuario.usuario,
      password: '',
      rol_id: usuario.rol_id,
      activo: usuario.activo
    });
    setEditandoId(usuario.id);
    setErrores({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const eliminar = useCallback(async (id) => {
    if (!await confirmar('¿Está seguro de que desea desactivar este usuario?')) {
      return false;
    }

    setCargando(true);
    try {
      const res = await usuarioApi.eliminar(id);
      if (res.exito) {
        notificarExito(res.mensaje);
        await Promise.all([cargarUsuarios(), cargarCupos()]);
        return true;
      }
      notificarError(res.mensaje || 'Error al desactivar.');
      return false;
    } catch (error) {
      const mensaje = error?.mensaje || 'Error al desactivar el usuario.';
      notificarError(mensaje);
      return false;
    } finally {
      setCargando(false);
    }
  }, [cargarUsuarios, cargarCupos]);

  const cambiarCupoRol = useCallback((rolNombre, campo, valor) => {
    setCuposRoles((prev) => prev.map((item) => {
      if (item.rol_nombre !== rolNombre) return item;
      if (campo === 'activo') {
        return { ...item, activo: !!valor };
      }
      if (campo === 'cupo_maximo') {
        const numero = Number(valor);
        return { ...item, cupo_maximo: Number.isFinite(numero) ? Math.max(0, Math.trunc(numero)) : item.cupo_maximo };
      }
      return { ...item, [campo]: valor };
    }));
  }, []);

  const guardarCupos = useCallback(async () => {
    setGuardandoCupos(true);
    try {
      const payload = {
        cupos: cuposRoles.map((item) => ({
          rol_nombre: item.rol_nombre,
          cupo_maximo: Number(item.cupo_maximo || 0),
          activo: !!item.activo
        }))
      };

      const res = await usuarioApi.actualizarCupos(payload);
      if (res?.exito) {
        setCuposRoles(res?.datos?.roles || []);
        setResumenCupos(res?.datos?.resumen || null);
        notificarExito(res.mensaje || 'Cupos actualizados correctamente.');
        return true;
      }

      if (esErrorDeCupo(res)) {
        notificarError(mensajeCupoHumano(res?.mensaje));
      } else {
        notificarError(res?.mensaje || 'No se pudieron actualizar los cupos.');
      }
      return false;
    } catch (error) {
      if (esErrorDeCupo(error)) {
        notificarError(mensajeCupoHumano(error?.mensaje));
      } else {
        notificarError(error?.mensaje || 'No se pudieron actualizar los cupos.');
      }
      return false;
    } finally {
      setGuardandoCupos(false);
    }
  }, [cuposRoles]);

  const cupoRolSeleccionado = useMemo(() => {
    const rolNombre = ROL_ID_TO_NOMBRE[Number(formulario.rol_id)];
    if (!rolNombre) return null;
    return cuposRoles.find((item) => item.rol_nombre === rolNombre) || null;
  }, [formulario.rol_id, cuposRoles]);

  return {
    usuarios,
    formulario,
    editandoId,
    cargando,
    errores,
    cuposRoles,
    resumenCupos,
    cargandoCupos,
    guardandoCupos,
    cupoRolSeleccionado,
    cambiarCampo,
    guardar,
    editar,
    eliminar,
    limpiarFormulario,
    cambiarCupoRol,
    guardarCupos,
    recargarCupos: cargarCupos
  };
}

