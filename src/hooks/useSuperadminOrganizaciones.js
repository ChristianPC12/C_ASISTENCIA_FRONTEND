import { useCallback, useEffect, useState } from 'react';
import superadminApi from '../api/superadminApi';
import { sanitizarObjeto } from '../utils/sanitizer';
import { notificarExito, notificarError } from '../utils/notify';

const FORMULARIO_INICIAL = {
  campo: '',
  tipo_organizacion: 'IGLESIA',
  nombre_organizacion: '',
  correo_contacto: ''
};

const FORMULARIO_ADMIN_TEMPORAL_INICIAL = {
  organizacion_id: '',
  nombre_completo: '',
  usuario: '',
  correo_destino: '',
  enviar_correo: true
};

const FORMULARIO_EDICION_INICIAL = {
  id: null,
  tipo_organizacion: 'IGLESIA',
  nombre_organizacion: '',
  correo_contacto: ''
};

const PAGINACION_INICIAL = {
  page: 1,
  limit: 20,
  total: 0,
  total_pages: 0
};

export const CAMPOS_IA_OPCIONES = [
  { valor: 'AN', etiqueta: 'Asociacion Norte' },
  { valor: 'ACS', etiqueta: 'Asociacion Central Sur' },
  { valor: 'MC', etiqueta: 'Mision Caribe' }
];

export const TIPO_ORGANIZACION_OPCIONES = [
  { valor: 'IGLESIA', etiqueta: 'Iglesia' },
  { valor: 'GRUPO', etiqueta: 'Grupo' }
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USUARIO_REGEX = /^[a-z0-9._-]+$/;

function validarFormulario(formulario) {
  const errores = {};

  if (!formulario.campo) {
    errores.campo = 'Seleccione el campo.';
  }

  if (!formulario.tipo_organizacion) {
    errores.tipo_organizacion = 'Seleccione el tipo de organizacion.';
  }

  const nombre = (formulario.nombre_organizacion || '').trim();
  if (nombre.length < 3 || nombre.length > 160) {
    errores.nombre_organizacion = 'El nombre debe tener entre 3 y 160 caracteres.';
  }

  const correo = (formulario.correo_contacto || '').trim();
  if (correo && !EMAIL_REGEX.test(correo)) {
    errores.correo_contacto = 'El correo no tiene un formato valido.';
  }

  return {
    valido: Object.keys(errores).length === 0,
    errores
  };
}

function validarFormularioEdicion(formulario) {
  const errores = {};

  if (!formulario.tipo_organizacion) {
    errores.tipo_organizacion = 'Seleccione el tipo de organizacion.';
  }

  const nombre = (formulario.nombre_organizacion || '').trim();
  if (nombre.length < 3 || nombre.length > 160) {
    errores.nombre_organizacion = 'El nombre debe tener entre 3 y 160 caracteres.';
  }

  const correo = (formulario.correo_contacto || '').trim();
  if (correo && !EMAIL_REGEX.test(correo)) {
    errores.correo_contacto = 'El correo no tiene un formato valido.';
  }

  return {
    valido: Object.keys(errores).length === 0,
    errores
  };
}

function validarFormularioAdminTemporal(formulario) {
  const errores = {};

  const organizacionId = Number(formulario.organizacion_id);
  if (!Number.isInteger(organizacionId) || organizacionId <= 0) {
    errores.organizacion_id = 'Seleccione la organizacion.';
  }

  const nombreCompleto = (formulario.nombre_completo || '').trim();
  if (nombreCompleto.length < 3 || nombreCompleto.length > 120) {
    errores.nombre_completo = 'El nombre debe tener entre 3 y 120 caracteres.';
  }

  const usuario = (formulario.usuario || '').trim().toLowerCase();
  if (usuario.length < 3 || usuario.length > 50 || !USUARIO_REGEX.test(usuario)) {
    errores.usuario = 'El usuario debe tener 3-50 caracteres validos (a-z, 0-9, . _ -).';
  }

  const correoDestino = (formulario.correo_destino || '').trim();
  if (correoDestino && !EMAIL_REGEX.test(correoDestino)) {
    errores.correo_destino = 'El correo destino no tiene formato valido.';
  }

  return {
    valido: Object.keys(errores).length === 0,
    errores
  };
}

export function useSuperadminOrganizaciones() {
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [errores, setErrores] = useState({});
  const [formularioAdminTemporal, setFormularioAdminTemporal] = useState(FORMULARIO_ADMIN_TEMPORAL_INICIAL);
  const [erroresAdminTemporal, setErroresAdminTemporal] = useState({});
  const [formularioEdicion, setFormularioEdicion] = useState(FORMULARIO_EDICION_INICIAL);
  const [erroresEdicion, setErroresEdicion] = useState({});
  const [organizaciones, setOrganizaciones] = useState([]);
  const [paginacion, setPaginacion] = useState(PAGINACION_INICIAL);
  const [cargandoLista, setCargandoLista] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardandoAdminTemporal, setGuardandoAdminTemporal] = useState(false);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [ultimaCreada, setUltimaCreada] = useState(null);
  const [ultimoAdminTemporal, setUltimoAdminTemporal] = useState(null);
  const [ultimaEditada, setUltimaEditada] = useState(null);

  const cargarOrganizaciones = useCallback(async () => {
    setCargandoLista(true);
    try {
      const res = await superadminApi.listarOrganizaciones({
        page: 1,
        limit: PAGINACION_INICIAL.limit,
        estado: 'TODAS'
      });

      if (res?.exito) {
        const datos = res.datos || {};
        setOrganizaciones(Array.isArray(datos.items) ? datos.items : []);
        setPaginacion(datos.paginacion || PAGINACION_INICIAL);
      }
    } catch (error) {
      setOrganizaciones([]);
      setPaginacion(PAGINACION_INICIAL);
      notificarError(error?.mensaje || 'No se pudo cargar la lista de organizaciones.');
    } finally {
      setCargandoLista(false);
    }
  }, []);

  useEffect(() => {
    cargarOrganizaciones();
  }, [cargarOrganizaciones]);

  const cambiarCampo = useCallback((campo, valor) => {
    setFormulario((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => {
      if (!prev[campo]) {
        return prev;
      }
      const copia = { ...prev };
      delete copia[campo];
      return copia;
    });
  }, []);

  const limpiarFormulario = useCallback(() => {
    setFormulario(FORMULARIO_INICIAL);
    setErrores({});
  }, []);

  const cambiarCampoAdminTemporal = useCallback((campo, valor) => {
    setFormularioAdminTemporal((prev) => ({ ...prev, [campo]: valor }));
    setErroresAdminTemporal((prev) => {
      if (!prev[campo]) {
        return prev;
      }
      const copia = { ...prev };
      delete copia[campo];
      return copia;
    });
  }, []);

  const limpiarFormularioAdminTemporal = useCallback(() => {
    setFormularioAdminTemporal(FORMULARIO_ADMIN_TEMPORAL_INICIAL);
    setErroresAdminTemporal({});
  }, []);

  const iniciarEdicion = useCallback((organizacion) => {
    setFormularioEdicion({
      id: organizacion.id,
      tipo_organizacion: organizacion.tipo_organizacion || 'IGLESIA',
      nombre_organizacion: organizacion.nombre_organizacion || '',
      correo_contacto: organizacion.correo_contacto || ''
    });
    setErroresEdicion({});
  }, []);

  const cambiarCampoEdicion = useCallback((campo, valor) => {
    setFormularioEdicion((prev) => ({ ...prev, [campo]: valor }));
    setErroresEdicion((prev) => {
      if (!prev[campo]) {
        return prev;
      }
      const copia = { ...prev };
      delete copia[campo];
      return copia;
    });
  }, []);

  const cancelarEdicion = useCallback(() => {
    setFormularioEdicion(FORMULARIO_EDICION_INICIAL);
    setErroresEdicion({});
  }, []);

  const crearOrganizacion = useCallback(async () => {
    const validacion = validarFormulario(formulario);
    if (!validacion.valido) {
      setErrores(validacion.errores);
      return false;
    }

    setGuardando(true);
    setErrores({});

    try {
      const sanitizado = sanitizarObjeto(formulario);
      const payload = {
        campo: sanitizado.campo,
        tipo_organizacion: sanitizado.tipo_organizacion,
        nombre_organizacion: sanitizado.nombre_organizacion,
        correo_contacto: sanitizado.correo_contacto || null
      };

      const res = await superadminApi.crearOrganizacion(payload);

      if (res?.exito) {
        const organizacionCreada = res?.datos?.organizacion || null;
        setUltimaCreada(organizacionCreada);
        notificarExito(res.mensaje || 'Organizacion creada correctamente.');
        limpiarFormulario();
        await cargarOrganizaciones();
        return true;
      }

      notificarError(res?.mensaje || 'No se pudo crear la organizacion.');
      return false;
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo crear la organizacion.');
      return false;
    } finally {
      setGuardando(false);
    }
  }, [formulario, limpiarFormulario, cargarOrganizaciones]);

  const crearAdminTemporal = useCallback(async () => {
    const validacion = validarFormularioAdminTemporal(formularioAdminTemporal);
    if (!validacion.valido) {
      setErroresAdminTemporal(validacion.errores);
      return false;
    }

    setGuardandoAdminTemporal(true);
    setErroresAdminTemporal({});

    try {
      const sanitizado = sanitizarObjeto(formularioAdminTemporal);
      const organizacionId = Number(sanitizado.organizacion_id);

      const payload = {
        nombre_completo: sanitizado.nombre_completo,
        usuario: (sanitizado.usuario || '').toLowerCase(),
        correo_destino: sanitizado.correo_destino || null,
        enviar_correo: !!sanitizado.enviar_correo
      };

      const res = await superadminApi.crearAdminTemporal(organizacionId, payload);

      if (res?.exito) {
        setUltimoAdminTemporal(res?.datos || null);
        notificarExito(res.mensaje || 'ADMIN temporal creado correctamente.');
        limpiarFormularioAdminTemporal();
        return true;
      }

      notificarError(res?.mensaje || 'No se pudo crear el ADMIN temporal.');
      return false;
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo crear el ADMIN temporal.');
      return false;
    } finally {
      setGuardandoAdminTemporal(false);
    }
  }, [formularioAdminTemporal, limpiarFormularioAdminTemporal]);

  const actualizarOrganizacion = useCallback(async () => {
    const organizacionId = Number(formularioEdicion.id);
    if (!Number.isInteger(organizacionId) || organizacionId <= 0) {
      notificarError('No hay una organizacion seleccionada para editar.');
      return false;
    }

    const validacion = validarFormularioEdicion(formularioEdicion);
    if (!validacion.valido) {
      setErroresEdicion(validacion.errores);
      return false;
    }

    setGuardandoEdicion(true);
    setErroresEdicion({});

    try {
      const sanitizado = sanitizarObjeto(formularioEdicion);
      const payload = {
        tipo_organizacion: sanitizado.tipo_organizacion,
        nombre_organizacion: sanitizado.nombre_organizacion,
        correo_contacto: sanitizado.correo_contacto || null
      };

      const res = await superadminApi.actualizarOrganizacion(organizacionId, payload);
      if (res?.exito) {
        const organizacionActualizada = res?.datos?.organizacion || null;
        setUltimaEditada(organizacionActualizada);
        notificarExito(res.mensaje || 'Organizacion actualizada correctamente.');
        cancelarEdicion();
        await cargarOrganizaciones();
        return true;
      }

      notificarError(res?.mensaje || 'No se pudo actualizar la organizacion.');
      return false;
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo actualizar la organizacion.');
      return false;
    } finally {
      setGuardandoEdicion(false);
    }
  }, [formularioEdicion, cancelarEdicion, cargarOrganizaciones]);

  return {
    formulario,
    errores,
    formularioAdminTemporal,
    erroresAdminTemporal,
    formularioEdicion,
    erroresEdicion,
    organizaciones,
    paginacion,
    cargandoLista,
    guardando,
    guardandoAdminTemporal,
    guardandoEdicion,
    ultimaCreada,
    ultimoAdminTemporal,
    ultimaEditada,
    cambiarCampo,
    cambiarCampoAdminTemporal,
    iniciarEdicion,
    cambiarCampoEdicion,
    crearOrganizacion,
    crearAdminTemporal,
    actualizarOrganizacion,
    limpiarFormulario,
    limpiarFormularioAdminTemporal,
    cancelarEdicion,
    recargarOrganizaciones: cargarOrganizaciones
  };
}
