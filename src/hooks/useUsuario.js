import { useState, useEffect, useCallback } from 'react';
import usuarioApi from '../api/usuarioApi';
import { validarUsuario } from '../validators/usuarioValidator';
import { sanitizarObjeto } from '../utils/sanitizer';
import { notificarExito, notificarError, confirmar } from '../utils/notify';
import { MAX_USUARIOS_POR_CUENTA, USUARIO_FORM_INICIAL, VIGENCIAS_PASSWORD } from '../config/constants';
import { useAuth } from './useAuth';

const NORMALIZE_REGEX = /[̀-ͯ]/g;

function normalizarMensajeServidor(mensaje) {
  const texto = String(mensaje || '').trim();
  if (!texto) return '';

  const normalizado = texto
    .normalize('NFD')
    .replace(NORMALIZE_REGEX, '')
    .toLowerCase();

  if (normalizado.includes('reactivar un usuario inactivo') && normalizado.includes('contrasena')) {
    return 'Para reactivar un usuario inactivo se requiere cambiar su contraseña.';
  }

  return texto.replace(/contrasena/gi, 'contraseña');
}

function limpiarPermisos(permisos) {
  return Object.fromEntries(
    Object.entries(permisos && typeof permisos === 'object' ? permisos : {}).filter(([, nivel]) => Boolean(nivel))
  );
}

/**
 * Hook para CRUD de usuarios con permisos por sección (solo ADMIN).
 */
export function useUsuario() {
  const { cerrarSesion, usuario, refrescarSesion } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [formulario, setFormulario] = useState({ ...USUARIO_FORM_INICIAL });
  const [editandoId, setEditandoId] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState({});
  const [limite, setLimite] = useState({ maximo: MAX_USUARIOS_POR_CUENTA, activos: 0, disponibles: MAX_USUARIOS_POR_CUENTA });

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    try {
      const [res, resLimite] = await Promise.all([usuarioApi.listar(), usuarioApi.obtenerLimite()]);
      if (res.exito) {
        setUsuarios(res.datos || []);
      }
      if (resLimite?.exito && resLimite.datos) {
        setLimite(resLimite.datos);
      }
    } catch {
      notificarError('Error al cargar los usuarios.');
      setUsuarios([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  const cambiarCampo = useCallback((campo, valor) => {
    setFormulario((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => {
      const nuevos = { ...prev };
      delete nuevos[campo];
      if (campo === 'password' || campo === 'password_confirmacion') {
        delete nuevos.password;
        delete nuevos.password_confirmacion;
      }
      if (campo === 'es_admin') {
        delete nuevos.permisos;
      }
      return nuevos;
    });
  }, []);

  const limpiarFormulario = useCallback(() => {
    setFormulario({ ...USUARIO_FORM_INICIAL });
    setEditandoId(null);
    setErrores({});
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
      const datos = {
        ...sanitizarObjeto({
          nombre_completo: formulario.nombre_completo,
          usuario: formulario.usuario,
          ...(formulario.password ? { password: formulario.password } : {}),
          ...(esEdicion ? { activo: formulario.activo } : {})
        }),
        password_vigencia_dias: Number(formulario.password_vigencia_dias),
        es_admin: !!formulario.es_admin,
        permisos: formulario.es_admin ? {} : limpiarPermisos(formulario.permisos)
      };

      const res = esEdicion
        ? await usuarioApi.actualizar(editandoId, datos)
        : await usuarioApi.crear(datos);

      if (res.exito) {
        notificarExito(res.mensaje);
        limpiarFormulario();
        if (res?.datos?.forzar_reautenticacion) {
          await cerrarSesion();
          return true;
        }

        const edicionPropia = esEdicion && Number(editandoId) === Number(usuario?.id);
        if (edicionPropia) {
          const cambioSesionCritico = Boolean(formulario.password)
            || String(formulario.usuario || '') !== String(usuario?.usuario || '');
          if (cambioSesionCritico) {
            await cerrarSesion();
            return true;
          }
          await refrescarSesion();
        }

        await cargarUsuarios();
        return true;
      }

      notificarError(normalizarMensajeServidor(res?.mensaje) || 'Error al guardar el usuario.');
      return false;
    } catch (error) {
      notificarError(normalizarMensajeServidor(error?.mensaje) || 'Error al guardar el usuario.');
      return false;
    } finally {
      setCargando(false);
    }
  }, [formulario, editandoId, usuario, refrescarSesion, cargarUsuarios, limpiarFormulario, cerrarSesion]);

  const editar = useCallback((item) => {
    setFormulario({
      id: item.id,
      nombre_completo: item.nombre_completo,
      usuario: item.usuario,
      password: '',
      password_confirmacion: '',
      password_vigencia_dias: VIGENCIAS_PASSWORD.includes(item.password_vigencia_dias)
        ? item.password_vigencia_dias
        : VIGENCIAS_PASSWORD[0],
      password_actualizada_en: item.password_actualizada_en || '',
      es_admin: !!item.es_admin,
      permisos: limpiarPermisos(item.permisos),
      activo: item.activo
    });
    setEditandoId(item.id);
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
        await cargarUsuarios();
        return true;
      }
      notificarError(normalizarMensajeServidor(res.mensaje) || 'Error al desactivar.');
      return false;
    } catch (error) {
      notificarError(normalizarMensajeServidor(error?.mensaje) || 'Error al desactivar el usuario.');
      return false;
    } finally {
      setCargando(false);
    }
  }, [cargarUsuarios]);

  return {
    usuarios,
    formulario,
    editandoId,
    cargando,
    errores,
    limite,
    cambiarCampo,
    guardar,
    editar,
    eliminar,
    limpiarFormulario
  };
}
