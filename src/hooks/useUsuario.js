import { useState, useEffect, useCallback } from 'react';
import usuarioApi from '../api/usuarioApi';
import { validarUsuario } from '../validators/usuarioValidator';
import { sanitizarObjeto } from '../utils/sanitizer';
import { notificarExito, notificarError, confirmar } from '../utils/notify';
import { USUARIO_FORM_INICIAL } from '../config/constants';

/**
 * Hook para CRUD de usuarios (solo ADMIN)
 */
export function useUsuario() {
  const [usuarios, setUsuarios] = useState([]);
  const [formulario, setFormulario] = useState({ ...USUARIO_FORM_INICIAL });
  const [editandoId, setEditandoId] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState({});

  // Cargar usuarios al montar
  useEffect(() => {
    cargarUsuarios();
  }, []);

  // Cargar lista de usuarios
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

  // Cambiar un campo del formulario
  const cambiarCampo = useCallback((campo, valor) => {
    setFormulario(prev => ({ ...prev, [campo]: valor }));
    setErrores(prev => {
      const nuevos = { ...prev };
      delete nuevos[campo];
      return nuevos;
    });
  }, []);

  // Guardar (crear o actualizar)
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
        await cargarUsuarios();
        return true;
      }

      notificarError(res.mensaje || 'Error al guardar.');
      return false;
    } catch (error) {
      const mensaje = error?.mensaje || 'Error al guardar el usuario.';
      notificarError(mensaje);
      return false;
    } finally {
      setCargando(false);
    }
  }, [formulario, editandoId, cargarUsuarios]);

  // Cargar usuario para edicion
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

  // Desactivar usuario (soft delete)
  const eliminar = useCallback(async (id) => {
    if (!confirmar('¿Esta seguro de que desea desactivar este usuario?')) {
      return false;
    }

    setCargando(true);
    try {
      const res = await usuarioApi.eliminar(id);
      if (res.exito) {
        notificarExito(res.mensaje);
        await cargarUsuarios();
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
  }, [cargarUsuarios]);

  // Limpiar formulario
  const limpiarFormulario = useCallback(() => {
    setFormulario({ ...USUARIO_FORM_INICIAL });
    setEditandoId(null);
    setErrores({});
  }, []);

  return {
    usuarios,
    formulario,
    editandoId,
    cargando,
    errores,
    cambiarCampo,
    guardar,
    editar,
    eliminar,
    limpiarFormulario
  };
}
