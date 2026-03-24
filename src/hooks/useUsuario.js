import { useState, useEffect, useCallback, useMemo } from 'react';
import usuarioApi from '../api/usuarioApi';
import { validarUsuario } from '../validators/usuarioValidator';
import { sanitizarObjeto } from '../utils/sanitizer';
import { notificarExito, notificarError, confirmar } from '../utils/notify';
import { USUARIO_FORM_INICIAL } from '../config/constants';
import { useAuth } from './useAuth';

const ROL_ID_TO_NOMBRE = {
  1: 'ADMIN',
  2: 'SECRETARIO'
};

const NORMALIZE_REGEX = /[\u0300-\u036f]/g;
const CUPOS_FIJOS_SISTEMA = {
  ADMIN: 4,
  SECRETARIO: 2,
  MINISTERIO_PERSONAL: 2,
  MINISTERIO_PERSONALES: 2,
  MINISTERIOS_PERSONALES: 2
};

function normalizarRolNombre(rolNombre) {
  return String(rolNombre || '')
    .normalize('NFD')
    .replace(NORMALIZE_REGEX, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function resolverCupoMaximoSistema(rolNombre, fallback = 0) {
  const rolNormalizado = normalizarRolNombre(rolNombre);
  if (Object.prototype.hasOwnProperty.call(CUPOS_FIJOS_SISTEMA, rolNormalizado)) {
    return CUPOS_FIJOS_SISTEMA[rolNormalizado];
  }
  const numero = Number(fallback);
  return Number.isFinite(numero) ? Math.max(0, Math.trunc(numero)) : 0;
}

function normalizarMensajeServidor(mensaje) {
  const texto = String(mensaje || '').trim();
  if (!texto) return '';

  const normalizado = texto
    .normalize('NFD')
    .replace(NORMALIZE_REGEX, '')
    .toLowerCase();

  if (normalizado.includes('reactivar un usuario inactivo') && normalizado.includes('contrasena')) {
    return 'Para reactivar un usuario inactivo se requiere cambiar su contrase\u00f1a.';
  }

  return texto.replace(/contrasena/gi, 'contrase\u00f1a');
}

function mensajeCupoHumano(mensajeBackend) {
  const detalle = normalizarMensajeServidor(mensajeBackend);
  if (!detalle) {
    return 'No hay cupo disponible para ese rol en esta organizaci\u00f3n.';
  }
  return `No se pudo completar la acci\u00f3n por pol\u00edtica de cupos: ${detalle}`;
}

function esErrorDeCupo(errorOrMessage) {
  const codigo = String(errorOrMessage?.codigo || '').toUpperCase();
  const mensaje = typeof errorOrMessage === 'string'
    ? errorOrMessage.toLowerCase()
    : String(errorOrMessage?.mensaje || '').toLowerCase();

  return codigo === 'CUPOS_EXCEEDED' || mensaje.includes('cupo');
}

function aplicarPoliticaCupos(roles = []) {
  return (Array.isArray(roles) ? roles : []).map((item) => {
    const cupoMaximo = resolverCupoMaximoSistema(item?.rol_nombre, item?.cupo_maximo);
    const consumoActual = Number(item?.consumo_actual || 0);
    const consumo = Number.isFinite(consumoActual) ? Math.max(0, Math.trunc(consumoActual)) : 0;

    return {
      ...item,
      cupo_maximo: cupoMaximo,
      consumo_actual: consumo,
      disponibles: Math.max(cupoMaximo - consumo, 0),
      excedido: consumo > cupoMaximo
    };
  });
}

function construirResumenCupos(resumenBackend, roles) {
  const lista = Array.isArray(roles) ? roles : [];
  const usuariosContabilizados = lista.reduce((acc, item) => acc + Number(item?.consumo_actual || 0), 0);
  const cuposTotales = lista.reduce((acc, item) => {
    if (item?.activo === false) return acc;
    return acc + Number(item?.cupo_maximo || 0);
  }, 0);

  return {
    ...(resumenBackend && typeof resumenBackend === 'object' ? resumenBackend : {}),
    usuarios_contabilizados: usuariosContabilizados,
    cupos_totales: cuposTotales
  };
}

function requiereSincronizarCupos(rolesBackend, rolesSistema) {
  const backend = Array.isArray(rolesBackend) ? rolesBackend : [];
  const sistema = Array.isArray(rolesSistema) ? rolesSistema : [];
  const backendPorRol = new Map(
    backend.map((item) => [normalizarRolNombre(item?.rol_nombre), Number(item?.cupo_maximo || 0)])
  );

  return sistema.some((item) => {
    const clave = normalizarRolNombre(item?.rol_nombre);
    const cupoSistema = Number(item?.cupo_maximo || 0);
    const cupoBackend = backendPorRol.get(clave);
    return cupoBackend !== cupoSistema;
  });
}

function construirPayloadCupos(roles) {
  return {
    cupos: (Array.isArray(roles) ? roles : []).map((item) => ({
      rol_nombre: item.rol_nombre,
      cupo_maximo: Number(item.cupo_maximo || 0),
      activo: !!item.activo
    }))
  };
}

/**
 * Hook para CRUD de usuarios y politica de cupos por rol (solo ADMIN).
 */
export function useUsuario() {
  const { cerrarSesion, usuario, refrescarSesion } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [formulario, setFormulario] = useState({ ...USUARIO_FORM_INICIAL });
  const [editandoId, setEditandoId] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState({});
  const [cuposRoles, setCuposRoles] = useState([]);
  const [resumenCupos, setResumenCupos] = useState(null);
  const [cargandoCupos, setCargandoCupos] = useState(false);

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
        const rolesBackend = res?.datos?.roles || [];
        const rolesSistema = aplicarPoliticaCupos(rolesBackend);
        const resumenSistema = construirResumenCupos(res?.datos?.resumen, rolesSistema);

        setCuposRoles(rolesSistema);
        setResumenCupos(resumenSistema);

        if (requiereSincronizarCupos(rolesBackend, rolesSistema)) {
          try {
            const sync = await usuarioApi.actualizarCupos(construirPayloadCupos(rolesSistema));
            if (sync?.exito) {
              const rolesSync = aplicarPoliticaCupos(sync?.datos?.roles || rolesSistema);
              setCuposRoles(rolesSync);
              setResumenCupos(construirResumenCupos(sync?.datos?.resumen, rolesSync));
            }
          } catch {
            // Silencioso: la UI sigue mostrando politica del sistema.
          }
        }
      }
    } catch (error) {
      setCuposRoles([]);
      setResumenCupos(null);
      const mensaje = normalizarMensajeServidor(error?.mensaje);
      notificarError(mensaje || 'No se pudieron cargar los cupos por rol.');
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
      if (campo === 'password' || campo === 'password_confirmacion') {
        delete nuevos.password;
        delete nuevos.password_confirmacion;
      }
      return nuevos;
    });
  }, []);

  const limpiarFormulario = useCallback(() => {
    setFormulario({ ...USUARIO_FORM_INICIAL });
    setEditandoId(null);
    setErrores({});
  }, []);

  const manejarErrorGuardarUsuario = useCallback((error) => {
    const mensajeServidor = normalizarMensajeServidor(error?.mensaje);
    if (esErrorDeCupo(error)) {
      notificarError(mensajeCupoHumano(mensajeServidor));
      return;
    }
    notificarError(mensajeServidor || 'Error al guardar el usuario.');
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
        if (res?.datos?.forzar_reautenticacion) {
          await cerrarSesion();
          return true;
        }

        const edicionPropia = esEdicion && Number(editandoId) === Number(usuario?.id);
        if (edicionPropia) {
          const cambioSesionCritico = (
            Boolean(formulario.password)
            || String(formulario.usuario || '') !== String(usuario?.usuario || '')
            || formulario.activo === false
            || (
              Number.isInteger(Number(formulario.rol_id))
              && Number.isInteger(Number(usuario?.rol_id))
              && Number(formulario.rol_id) !== Number(usuario?.rol_id)
            )
          );

          if (cambioSesionCritico) {
            await cerrarSesion();
            return true;
          }

          await refrescarSesion();
        }

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
  }, [
    formulario,
    editandoId,
    usuario,
    refrescarSesion,
    manejarErrorGuardarUsuario,
    cargarUsuarios,
    cargarCupos,
    limpiarFormulario,
    cerrarSesion
  ]);

  const editar = useCallback((usuario) => {
    setFormulario({
      id: usuario.id,
      nombre_completo: usuario.nombre_completo,
      usuario: usuario.usuario,
      password: '',
      password_confirmacion: '',
      rol_id: usuario.rol_id,
      activo: usuario.activo
    });
    setEditandoId(usuario.id);
    setErrores({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const eliminar = useCallback(async (id) => {
    if (!await confirmar('\u00bfEst\u00e1 seguro de que desea desactivar este usuario?')) {
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
      notificarError(normalizarMensajeServidor(res.mensaje) || 'Error al desactivar.');
      return false;
    } catch (error) {
      const mensaje = normalizarMensajeServidor(error?.mensaje);
      notificarError(mensaje || 'Error al desactivar el usuario.');
      return false;
    } finally {
      setCargando(false);
    }
  }, [cargarUsuarios, cargarCupos]);

  const cupoRolSeleccionado = useMemo(() => {
    const rolNombre = ROL_ID_TO_NOMBRE[Number(formulario.rol_id)];
    if (!rolNombre) return null;

    const clave = normalizarRolNombre(rolNombre);
    return cuposRoles.find((item) => normalizarRolNombre(item?.rol_nombre) === clave) || null;
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
    cupoRolSeleccionado,
    cambiarCampo,
    guardar,
    editar,
    eliminar,
    limpiarFormulario,
    recargarCupos: cargarCupos
  };
}
