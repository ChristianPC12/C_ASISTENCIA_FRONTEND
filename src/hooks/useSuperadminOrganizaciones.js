import { useCallback, useEffect, useMemo, useState } from 'react';
import superadminApi from '../api/superadminApi';
import { sanitizarObjeto } from '../utils/sanitizer';
import { notificarExito, notificarError } from '../utils/notify';

const NOMBRE_ORGANIZACION_MIN = 5;
const NOMBRE_ORGANIZACION_MAX = 30;
const NOMBRE_ADMIN_MIN = 5;
const NOMBRE_ADMIN_MAX = 30;
const USUARIO_MAX = 50;
const CORREO_MAX = 30;
const ANIO_MIN = 2000;
const ANIO_MAX = 2100;

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

const FILTROS_ADMIN_TEMPORAL_INICIALES = {
  campo: 'TODOS',
  tipo_organizacion: 'TODOS'
};

const FORMULARIO_EDICION_INICIAL = {
  id: null,
  tipo_organizacion: 'IGLESIA',
  nombre_organizacion: '',
  correo_contacto: '',
  activa: true
};

const FILTROS_TABLA_INICIALES = {
  campo: 'TODOS',
  tipo: 'TODOS',
  anio: 'TODOS',
  estado_admin: 'TODOS',
  organizacion_id: 'TODOS'
};

const PAGINACION_INICIAL = {
  page: 1,
  limit: 100,
  total: 0,
  total_pages: 0
};

export const CAMPOS_IA_OPCIONES = [
  { valor: 'AN', etiqueta: 'Asociación Norte' },
  { valor: 'ACS', etiqueta: 'Asociación Central Sur' },
  { valor: 'MC', etiqueta: 'Misión Caribe' }
];

export const TIPO_ORGANIZACION_OPCIONES = [
  { valor: 'IGLESIA', etiqueta: 'Iglesia' },
  { valor: 'GRUPO', etiqueta: 'Grupo' }
];

export const ESTADO_ADMIN_OPCIONES = [
  { valor: 'TODOS', etiqueta: 'Todos' },
  { valor: 'SIN_ADMIN', etiqueta: 'Sin ADMIN' },
  { valor: 'ADMIN_ACTIVO', etiqueta: 'ADMIN activo' },
  { valor: 'ADMIN_EXPIRADO', etiqueta: 'ADMIN expirado' }
];

const EMAIL_REGEX = /^(?=.{1,30}$)[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9]))+$/;
const NOMBRE_REGEX = /^[\p{L}.,'()\- ]+$/u;
const USUARIO_REGEX = /^[a-z0-9._-]+$/;

function normalizarNombreSinNumeros(valor, maximo) {
  return String(valor || '')
    .replace(/[0-9]/g, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, maximo);
}

function normalizarCorreo(valor) {
  return String(valor || '')
    .replace(/\s+/g, '')
    .toLowerCase()
    .slice(0, CORREO_MAX);
}

function normalizarUsuario(valor) {
  return String(valor || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .slice(0, USUARIO_MAX);
}

function normalizarNombreClave(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function esNombreValidoSinNumeros(nombre, min, max) {
  const limpio = String(nombre || '').trim();
  if (limpio.length < min || limpio.length > max) {
    return false;
  }

  if (/\d/.test(limpio)) {
    return false;
  }

  return NOMBRE_REGEX.test(limpio);
}

function esCorreoValidoEstricto(correo) {
  const valor = String(correo || '').trim().toLowerCase();
  if (!valor) {
    return true;
  }

  if (valor.length > CORREO_MAX || valor.includes('..')) {
    return false;
  }

  return EMAIL_REGEX.test(valor);
}

function obtenerAnioCreacion(fecha) {
  const raw = String(fecha || '');
  if (!raw || raw.length < 4) {
    return null;
  }

  const anio = Number(raw.slice(0, 4));
  if (!Number.isInteger(anio) || anio < ANIO_MIN || anio > ANIO_MAX) {
    return null;
  }

  return anio;
}

function buscarOrganizacionPorId(organizaciones, organizacionId) {
  const idBuscado = Number(organizacionId);
  if (!Number.isInteger(idBuscado) || idBuscado <= 0) {
    return null;
  }

  return organizaciones.find((item) => Number(item.id) === idBuscado) || null;
}

function filtrarOrganizacionesPorCampoTipo(organizaciones, campo, tipo) {
  return organizaciones.filter((item) => {
    const campoOk = campo === 'TODOS' || String(item?.campo || '') === campo;
    const tipoOk = tipo === 'TODOS' || String(item?.tipo_organizacion || '') === tipo;
    return campoOk && tipoOk;
  });
}

function existeDuplicadoNombreEnCampoTipo(organizaciones, { campo, tipo, nombre, excludeId = null }) {
  const claveNombre = normalizarNombreClave(nombre);
  if (!campo || !tipo || !claveNombre) {
    return false;
  }

  return organizaciones.some((item) => {
    const mismoId = excludeId !== null && Number(item.id) === Number(excludeId);
    if (mismoId) {
      return false;
    }

    const campoItem = String(item?.campo || '');
    const tipoItem = String(item?.tipo_organizacion || '');
    const nombreItem = normalizarNombreClave(item?.nombre_organizacion || '');

    return campoItem === campo && tipoItem === tipo && nombreItem === claveNombre;
  });
}

function esValorBooleanoVerdadero(valor) {
  return valor === true || valor === 1 || valor === '1' || valor === 'true';
}

function parsearFechaValida(valor) {
  if (!valor) {
    return null;
  }

  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) {
    return null;
  }

  return fecha;
}

function obtenerFechaExpiracionAdmin(organizacion, detalleCache = null) {
  const fechaDesdeCache = String(detalleCache?.admin_temporal?.expira_en || '').trim();
  if (fechaDesdeCache) {
    return fechaDesdeCache;
  }

  const fechaDesdeOrganizacion = String(organizacion?.admin_password_expira_en || '').trim();
  return fechaDesdeOrganizacion || null;
}

function tieneRegistroAdminTemporal(organizacion, detalleCache = null) {
  if (!organizacion) {
    return false;
  }

  const usuarioCache = String(detalleCache?.admin_temporal?.usuario || '').trim();
  const usuarioActivo = String(organizacion?.admin_usuario_activo || '').trim();
  const fechaExpiracion = obtenerFechaExpiracionAdmin(organizacion, detalleCache);

  return usuarioCache.length > 0
    || usuarioActivo.length > 0
    || esValorBooleanoVerdadero(organizacion?.tiene_admin_activo)
    || !!fechaExpiracion;
}

function adminTemporalExpirado(organizacion, detalleCache = null) {
  const fechaExpiracion = parsearFechaValida(obtenerFechaExpiracionAdmin(organizacion, detalleCache));
  if (!fechaExpiracion) {
    return false;
  }

  return fechaExpiracion.getTime() < Date.now();
}

function resolverEstadoAdminOrganizacion(organizacion, detalleCache = null) {
  if (!organizacion) {
    return 'SIN_ADMIN';
  }

  if (adminTemporalExpirado(organizacion, detalleCache)) {
    return 'ADMIN_EXPIRADO';
  }

  if (tieneRegistroAdminTemporal(organizacion, detalleCache)) {
    return 'ADMIN_ACTIVO';
  }

  return 'SIN_ADMIN';
}

function construirDetalleAdminDesdeOrganizacion(organizacion, detalleCache = null) {
  if (!organizacion || !tieneRegistroAdminTemporal(organizacion, detalleCache)) {
    return null;
  }

  const usuarioCache = String(detalleCache?.admin_temporal?.usuario || '').trim();
  const usuarioOrganizacion = String(organizacion.admin_usuario_activo || '').trim();

  return {
    admin_temporal: {
      usuario: usuarioCache || usuarioOrganizacion || null,
      password_temporal: null,
      expira_en: obtenerFechaExpiracionAdmin(organizacion, detalleCache)
    },
    correo: null
  };
}

function coincideFiltrosTablaBase(organizacion, filtrosTabla, detalleCache = null) {
  const campoOk = filtrosTabla.campo === 'TODOS'
    || String(organizacion?.campo || '') === filtrosTabla.campo;
  const tipoOk = filtrosTabla.tipo === 'TODOS'
    || String(organizacion?.tipo_organizacion || '') === filtrosTabla.tipo;

  let anioOk = true;
  if (filtrosTabla.anio !== 'TODOS') {
    const anioItem = obtenerAnioCreacion(organizacion?.creado_en);
    anioOk = String(anioItem || '') === filtrosTabla.anio;
  }

  const estadoAdminItem = resolverEstadoAdminOrganizacion(organizacion, detalleCache);
  const estadoFiltro = filtrosTabla.estado_admin || 'TODOS';
  const estadoOk = estadoFiltro === 'TODOS' || estadoAdminItem === estadoFiltro;

  return campoOk && tipoOk && anioOk && estadoOk;
}

function validarFormulario(formulario) {
  const errores = {};

  if (!formulario.campo) {
    errores.campo = 'Seleccione el campo.';
  }

  if (!formulario.tipo_organizacion) {
    errores.tipo_organizacion = 'Seleccione el tipo de organización.';
  }

  const nombre = (formulario.nombre_organizacion || '').trim();
  if (!esNombreValidoSinNumeros(nombre, NOMBRE_ORGANIZACION_MIN, NOMBRE_ORGANIZACION_MAX)) {
    errores.nombre_organizacion = 'El nombre debe tener 5-30 caracteres válidos y no puede incluir números.';
  }

  const correo = (formulario.correo_contacto || '').trim();
  if (correo && !esCorreoValidoEstricto(correo)) {
    errores.correo_contacto = 'El correo debe ser válido y no superar 30 caracteres.';
  }

  return {
    valido: Object.keys(errores).length === 0,
    errores
  };
}

function validarFormularioEdicion(formulario) {
  const errores = {};

  if (!formulario.tipo_organizacion) {
    errores.tipo_organizacion = 'Seleccione el tipo de organización.';
  }

  const nombre = (formulario.nombre_organizacion || '').trim();
  if (!esNombreValidoSinNumeros(nombre, NOMBRE_ORGANIZACION_MIN, NOMBRE_ORGANIZACION_MAX)) {
    errores.nombre_organizacion = 'El nombre debe tener 5-30 caracteres válidos y no puede incluir números.';
  }

  const correo = (formulario.correo_contacto || '').trim();
  if (correo && !esCorreoValidoEstricto(correo)) {
    errores.correo_contacto = 'El correo debe ser válido y no superar 30 caracteres.';
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
    errores.organizacion_id = 'Seleccione la organización.';
  }

  const nombreCompleto = (formulario.nombre_completo || '').trim();
  if (!esNombreValidoSinNumeros(nombreCompleto, NOMBRE_ADMIN_MIN, NOMBRE_ADMIN_MAX)) {
    errores.nombre_completo = 'El nombre debe tener 5-30 caracteres válidos y no puede incluir números.';
  }

  const usuario = (formulario.usuario || '').trim().toLowerCase();
  if (usuario.length < 3 || usuario.length > USUARIO_MAX || !USUARIO_REGEX.test(usuario)) {
    errores.usuario = 'El usuario debe tener 3-50 caracteres válidos (a-z, 0-9, . _ -).';
  }

  const correoDestino = (formulario.correo_destino || '').trim();
  if (correoDestino && !esCorreoValidoEstricto(correoDestino)) {
    errores.correo_destino = 'El correo destino debe ser válido y no superar 30 caracteres.';
  }

  if (formulario.enviar_correo && !correoDestino) {
    errores.correo_destino = 'La organización seleccionada no tiene correo válido para envío.';
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
  const [adminTemporalVisible, setAdminTemporalVisible] = useState(false);
  const [filtrosAdminTemporal, setFiltrosAdminTemporal] = useState(FILTROS_ADMIN_TEMPORAL_INICIALES);
  const [formularioEdicion, setFormularioEdicion] = useState(FORMULARIO_EDICION_INICIAL);
  const [erroresEdicion, setErroresEdicion] = useState({});
  const [organizaciones, setOrganizaciones] = useState([]);
  const [paginacion, setPaginacion] = useState(PAGINACION_INICIAL);
  const [cargandoLista, setCargandoLista] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardandoAdminTemporal, setGuardandoAdminTemporal] = useState(false);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [ultimaCreada, setUltimaCreada] = useState(null);
  const [detallesAdminTemporalPorOrganizacion, setDetallesAdminTemporalPorOrganizacion] = useState({});
  const [organizacionTablaSeleccionadaId, setOrganizacionTablaSeleccionadaId] = useState(null);
  const [ultimaEditada, setUltimaEditada] = useState(null);
  const [filtrosTabla, setFiltrosTabla] = useState(FILTROS_TABLA_INICIALES);

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

  const opcionesAnioFiltro = useMemo(() => {
    const years = new Set();
    organizaciones.forEach((item) => {
      const anio = obtenerAnioCreacion(item?.creado_en);
      if (anio !== null) {
        years.add(anio);
      }
    });

    return Array.from(years).sort((a, b) => b - a);
  }, [organizaciones]);

  const organizacionesAdminFiltradas = useMemo(() => {
    return filtrarOrganizacionesPorCampoTipo(
      organizaciones,
      filtrosAdminTemporal.campo,
      filtrosAdminTemporal.tipo_organizacion
    );
  }, [organizaciones, filtrosAdminTemporal]);

  const organizacionesTablaOpciones = useMemo(() => {
    const filtradas = organizaciones.filter((item) => {
      const organizacionId = Number(item?.id);
      const detalleCache = Number.isInteger(organizacionId) && organizacionId > 0
        ? detallesAdminTemporalPorOrganizacion[organizacionId]
        : null;
      return coincideFiltrosTablaBase(item, filtrosTabla, detalleCache);
    });

    return [...filtradas].sort((a, b) => {
      const nombreA = String(a?.nombre_organizacion || '').toLowerCase();
      const nombreB = String(b?.nombre_organizacion || '').toLowerCase();
      return nombreA.localeCompare(nombreB);
    });
  }, [organizaciones, filtrosTabla, detallesAdminTemporalPorOrganizacion]);

  const organizacionesFiltradas = useMemo(() => {
    return organizaciones.filter((item) => {
      const organizacionId = Number(item?.id);
      const detalleCache = Number.isInteger(organizacionId) && organizacionId > 0
        ? detallesAdminTemporalPorOrganizacion[organizacionId]
        : null;
      const baseOk = coincideFiltrosTablaBase(item, filtrosTabla, detalleCache);

      const organizacionOk = filtrosTabla.organizacion_id === 'TODOS'
        || Number(item?.id) === Number(filtrosTabla.organizacion_id);

      return baseOk && organizacionOk;
    });
  }, [organizaciones, filtrosTabla, detallesAdminTemporalPorOrganizacion]);

  const organizacionSeleccionadaTabla = useMemo(
    () => buscarOrganizacionPorId(organizaciones, organizacionTablaSeleccionadaId),
    [organizaciones, organizacionTablaSeleccionadaId]
  );

  const detalleAdminTemporalSeleccionado = useMemo(() => {
    if (!organizacionSeleccionadaTabla) {
      return null;
    }

    const organizacionId = Number(organizacionSeleccionadaTabla.id);
    if (!Number.isInteger(organizacionId) || organizacionId <= 0) {
      return null;
    }

    const detalleCache = detallesAdminTemporalPorOrganizacion[organizacionId];
    if (detalleCache?.admin_temporal) {
      return detalleCache;
    }

    return construirDetalleAdminDesdeOrganizacion(organizacionSeleccionadaTabla, detalleCache);
  }, [organizacionSeleccionadaTabla, detallesAdminTemporalPorOrganizacion]);

  const organizacionSeleccionadaAdmin = useMemo(
    () => buscarOrganizacionPorId(organizaciones, formularioAdminTemporal.organizacion_id),
    [organizaciones, formularioAdminTemporal.organizacion_id]
  );

  useEffect(() => {
    if (organizacionTablaSeleccionadaId === null) {
      return;
    }

    const seleccionada = buscarOrganizacionPorId(organizaciones, organizacionTablaSeleccionadaId);
    if (!seleccionada) {
      setOrganizacionTablaSeleccionadaId(null);
    }
  }, [organizaciones, organizacionTablaSeleccionadaId]);

  const seleccionarOrganizacionTabla = useCallback((organizacionId) => {
    const idNormalizado = Number(organizacionId);
    if (!Number.isInteger(idNormalizado) || idNormalizado <= 0) {
      setOrganizacionTablaSeleccionadaId(null);
      return;
    }

    setOrganizacionTablaSeleccionadaId((prev) => (
      Number(prev) === idNormalizado ? null : idNormalizado
    ));
  }, []);

  const obtenerEstadoAdminOrganizacion = useCallback((organizacion) => {
    const organizacionId = Number(organizacion?.id);
    const detalleCache = Number.isInteger(organizacionId) && organizacionId > 0
      ? detallesAdminTemporalPorOrganizacion[organizacionId]
      : null;

    return resolverEstadoAdminOrganizacion(organizacion, detalleCache);
  }, [detallesAdminTemporalPorOrganizacion]);

  const tieneAdminActivoOrganizacion = useCallback((organizacion) => {
    return obtenerEstadoAdminOrganizacion(organizacion) === 'ADMIN_ACTIVO';
  }, [obtenerEstadoAdminOrganizacion]);

  const cambiarCampo = useCallback((campo, valor) => {
    let valorNormalizado = valor;

    if (campo === 'nombre_organizacion') {
      valorNormalizado = normalizarNombreSinNumeros(valor, NOMBRE_ORGANIZACION_MAX);
    } else if (campo === 'correo_contacto') {
      valorNormalizado = normalizarCorreo(valor);
    }

    setFormulario((prev) => ({ ...prev, [campo]: valorNormalizado }));
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

  const abrirFormularioAdminTemporal = useCallback((organizacion = null) => {
    // Si venimos desde "Editar organizacion", forzar salida de ese modo
    // para mostrar el formulario de ADMIN temporal y permitir su foco.
    setFormularioEdicion(FORMULARIO_EDICION_INICIAL);
    setErroresEdicion({});

    if (organizacion && organizacion.id) {
      setOrganizacionTablaSeleccionadaId(Number(organizacion.id));
      const correoDestino = normalizarCorreo(organizacion.correo_contacto || '');
      const campo = String(organizacion.campo || 'TODOS');
      const tipo = String(organizacion.tipo_organizacion || 'TODOS');

      setFiltrosAdminTemporal({
        campo: campo || 'TODOS',
        tipo_organizacion: tipo || 'TODOS'
      });

      setFormularioAdminTemporal({
        ...FORMULARIO_ADMIN_TEMPORAL_INICIAL,
        organizacion_id: String(organizacion.id),
        correo_destino: correoDestino,
        enviar_correo: !!correoDestino
      });
    } else {
      setFiltrosAdminTemporal(FILTROS_ADMIN_TEMPORAL_INICIALES);
      setFormularioAdminTemporal(FORMULARIO_ADMIN_TEMPORAL_INICIAL);
    }

    setErroresAdminTemporal({});
    setAdminTemporalVisible(true);
  }, []);

  const cerrarFormularioAdminTemporal = useCallback(() => {
    setAdminTemporalVisible(false);
    setFiltrosAdminTemporal(FILTROS_ADMIN_TEMPORAL_INICIALES);
    setFormularioAdminTemporal(FORMULARIO_ADMIN_TEMPORAL_INICIAL);
    setErroresAdminTemporal({});
  }, []);

  const cambiarFiltroAdminTemporal = useCallback((campo, valor) => {
    setFiltrosAdminTemporal((prev) => {
      const next = {
        ...prev,
        [campo]: valor || 'TODOS'
      };

      setFormularioAdminTemporal((prevForm) => {
        const disponibles = filtrarOrganizacionesPorCampoTipo(
          organizaciones,
          next.campo,
          next.tipo_organizacion
        );

        const seleccionada = buscarOrganizacionPorId(disponibles, prevForm.organizacion_id);
        if (seleccionada) {
          return prevForm;
        }

        return {
          ...prevForm,
          organizacion_id: '',
          correo_destino: '',
          enviar_correo: false
        };
      });

      setErroresAdminTemporal((prevErr) => {
        const copia = { ...prevErr };
        delete copia.organizacion_id;
        delete copia.correo_destino;
        return copia;
      });

      return next;
    });
  }, [organizaciones]);

  const cambiarCampoAdminTemporal = useCallback((campo, valor) => {
    if (campo === 'organizacion_id') {
      const idSeleccionado = String(valor || '');
      const seleccionada = buscarOrganizacionPorId(organizacionesAdminFiltradas, idSeleccionado);
      const correoDestino = normalizarCorreo(seleccionada?.correo_contacto || '');

      setFormularioAdminTemporal((prev) => ({
        ...prev,
        organizacion_id: idSeleccionado,
        correo_destino: correoDestino,
        enviar_correo: correoDestino ? prev.enviar_correo : false
      }));

      setErroresAdminTemporal((prev) => {
        const copia = { ...prev };
        delete copia.organizacion_id;
        delete copia.correo_destino;
        return copia;
      });
      return;
    }

    if (campo === 'correo_destino') {
      return;
    }

    if (campo === 'enviar_correo') {
      setFormularioAdminTemporal((prev) => ({
        ...prev,
        enviar_correo: prev.correo_destino ? !!valor : false
      }));
      setErroresAdminTemporal((prev) => {
        if (!prev.enviar_correo && !prev.correo_destino) {
          return prev;
        }
        const copia = { ...prev };
        delete copia.enviar_correo;
        delete copia.correo_destino;
        return copia;
      });
      return;
    }

    let valorNormalizado = valor;
    if (campo === 'nombre_completo') {
      valorNormalizado = normalizarNombreSinNumeros(valor, NOMBRE_ADMIN_MAX);
    } else if (campo === 'usuario') {
      valorNormalizado = normalizarUsuario(valor);
    }

    setFormularioAdminTemporal((prev) => ({ ...prev, [campo]: valorNormalizado }));
    setErroresAdminTemporal((prev) => {
      if (!prev[campo]) {
        return prev;
      }
      const copia = { ...prev };
      delete copia[campo];
      return copia;
    });
  }, [organizacionesAdminFiltradas]);

  const limpiarFormularioAdminTemporal = useCallback(() => {
    setFormularioAdminTemporal((prev) => ({
      ...FORMULARIO_ADMIN_TEMPORAL_INICIAL,
      organizacion_id: prev.organizacion_id,
      correo_destino: prev.correo_destino,
      enviar_correo: prev.correo_destino ? prev.enviar_correo : false
    }));
    setErroresAdminTemporal({});
  }, []);

  const iniciarEdicion = useCallback((organizacion) => {
    setAdminTemporalVisible(false);
    setOrganizacionTablaSeleccionadaId(Number(organizacion?.id) || null);
    setFormularioEdicion({
      id: organizacion.id,
      tipo_organizacion: organizacion.tipo_organizacion || 'IGLESIA',
      nombre_organizacion: organizacion.nombre_organizacion || '',
      correo_contacto: organizacion.correo_contacto || '',
      activa: !!organizacion.activa
    });
    setErroresEdicion({});
  }, []);

  const cambiarCampoEdicion = useCallback((campo, valor) => {
    let valorNormalizado = valor;

    if (campo === 'nombre_organizacion') {
      valorNormalizado = normalizarNombreSinNumeros(valor, NOMBRE_ORGANIZACION_MAX);
    } else if (campo === 'correo_contacto') {
      valorNormalizado = normalizarCorreo(valor);
    } else if (campo === 'activa') {
      valorNormalizado = !!valor;
    }

    setFormularioEdicion((prev) => ({ ...prev, [campo]: valorNormalizado }));
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

  const cambiarFiltroTabla = useCallback((campo, valor) => {
    setFiltrosTabla((prev) => {
      const next = {
        ...prev,
        [campo]: valor || 'TODOS'
      };

      const opciones = organizaciones.filter((item) => {
        const organizacionId = Number(item?.id);
        const detalleCache = Number.isInteger(organizacionId) && organizacionId > 0
          ? detallesAdminTemporalPorOrganizacion[organizacionId]
          : null;
        return coincideFiltrosTablaBase(item, next, detalleCache);
      });

      const seleccionada = buscarOrganizacionPorId(opciones, next.organizacion_id);
      if (!seleccionada) {
        next.organizacion_id = 'TODOS';
      }

      return next;
    });
  }, [organizaciones, detallesAdminTemporalPorOrganizacion]);

  const limpiarFiltrosTabla = useCallback(() => {
    setFiltrosTabla(FILTROS_TABLA_INICIALES);
  }, []);

  const crearOrganizacion = useCallback(async () => {
    const validacion = validarFormulario(formulario);
    if (!validacion.valido) {
      setErrores(validacion.errores);
      return false;
    }

    if (existeDuplicadoNombreEnCampoTipo(organizaciones, {
      campo: formulario.campo,
      tipo: formulario.tipo_organizacion,
      nombre: formulario.nombre_organizacion
    })) {
      const mensaje = 'Ya existe una organización con ese nombre para el campo y tipo seleccionados.';
      setErrores((prev) => ({ ...prev, nombre_organizacion: mensaje }));
      notificarError(mensaje);
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
        notificarExito(res.mensaje || 'Organización creada correctamente.');
        limpiarFormulario();
        await cargarOrganizaciones();
        return true;
      }

      notificarError(res?.mensaje || 'No se pudo crear la organización.');
      return false;
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo crear la organización.');
      return false;
    } finally {
      setGuardando(false);
    }
  }, [formulario, organizaciones, limpiarFormulario, cargarOrganizaciones]);

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
        const detalleAdmin = res?.datos || {};
        const adminTemporal = detalleAdmin?.admin_temporal || {};

        setDetallesAdminTemporalPorOrganizacion((prev) => ({
          ...prev,
          [organizacionId]: detalleAdmin
        }));

        setOrganizaciones((prev) => prev.map((item) => {
          if (Number(item.id) !== organizacionId) {
            return item;
          }

          return {
            ...item,
            tiene_admin_activo: true,
            admin_temporal_activo: true,
            admin_usuario_activo: adminTemporal.usuario || item.admin_usuario_activo || null,
            admin_password_expira_en: adminTemporal.expira_en || item.admin_password_expira_en || null
          };
        }));
        setOrganizacionTablaSeleccionadaId(organizacionId);
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
      notificarError('No hay una organización seleccionada para editar.');
      return false;
    }

    const validacion = validarFormularioEdicion(formularioEdicion);
    if (!validacion.valido) {
      setErroresEdicion(validacion.errores);
      return false;
    }

    const organizacionActual = buscarOrganizacionPorId(organizaciones, organizacionId);
    if (organizacionActual && existeDuplicadoNombreEnCampoTipo(organizaciones, {
      campo: String(organizacionActual.campo || ''),
      tipo: formularioEdicion.tipo_organizacion,
      nombre: formularioEdicion.nombre_organizacion,
      excludeId: organizacionId
    })) {
      const mensaje = 'Ya existe una organización con ese nombre para el campo y tipo seleccionados.';
      setErroresEdicion((prev) => ({ ...prev, nombre_organizacion: mensaje }));
      notificarError(mensaje);
      return false;
    }

    setGuardandoEdicion(true);
    setErroresEdicion({});

    try {
      const sanitizado = sanitizarObjeto(formularioEdicion);
      const payload = {
        tipo_organizacion: sanitizado.tipo_organizacion,
        nombre_organizacion: sanitizado.nombre_organizacion,
        correo_contacto: sanitizado.correo_contacto || null,
        activa: !!sanitizado.activa
      };

      const res = await superadminApi.actualizarOrganizacion(organizacionId, payload);
      if (res?.exito) {
        const organizacionActualizada = res?.datos?.organizacion || null;
        setUltimaEditada(organizacionActualizada);
        notificarExito(res.mensaje || 'Organización actualizada correctamente.');
        cancelarEdicion();
        await cargarOrganizaciones();
        return true;
      }

      notificarError(res?.mensaje || 'No se pudo actualizar la organización.');
      return false;
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo actualizar la organización.');
      return false;
    } finally {
      setGuardandoEdicion(false);
    }
  }, [formularioEdicion, organizaciones, cancelarEdicion, cargarOrganizaciones]);

  return {
    formulario,
    errores,
    formularioAdminTemporal,
    erroresAdminTemporal,
    adminTemporalVisible,
    filtrosAdminTemporal,
    formularioEdicion,
    erroresEdicion,
    organizaciones,
    organizacionesFiltradas,
    organizacionesAdminFiltradas,
    organizacionesTablaOpciones,
    organizacionSeleccionadaTabla,
    organizacionSeleccionadaAdmin,
    detalleAdminTemporalSeleccionado,
    paginacion,
    cargandoLista,
    guardando,
    guardandoAdminTemporal,
    guardandoEdicion,
    ultimaCreada,
    ultimaEditada,
    filtrosTabla,
    opcionesAnioFiltro,
    cambiarCampo,
    cambiarCampoAdminTemporal,
    abrirFormularioAdminTemporal,
    cerrarFormularioAdminTemporal,
    cambiarFiltroAdminTemporal,
    iniciarEdicion,
    cambiarCampoEdicion,
    seleccionarOrganizacionTabla,
    obtenerEstadoAdminOrganizacion,
    tieneAdminActivoOrganizacion,
    cambiarFiltroTabla,
    limpiarFiltrosTabla,
    crearOrganizacion,
    crearAdminTemporal,
    actualizarOrganizacion,
    limpiarFormulario,
    limpiarFormularioAdminTemporal,
    cancelarEdicion,
    recargarOrganizaciones: cargarOrganizaciones
  };
}
