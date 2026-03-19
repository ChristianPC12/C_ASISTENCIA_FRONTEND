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
const CAMPO_CODIGO_REGEX = /^[A-Z0-9]{2,10}$/;
const DISTRITO_CODIGO_REGEX = /^[A-Z0-9_]{2,24}$/;

const FORMULARIO_INICIAL = {
  campo: '',
  distrito: '',
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
  distrito: '',
  tipo_organizacion: 'IGLESIA',
  nombre_organizacion: '',
  correo_contacto: '',
  activa: true
};

const FILTROS_TABLA_INICIALES = {
  campo: 'TODOS',
  distrito: 'TODOS',
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

function normalizarTextoCorto(valor, maximo = 60) {
  return String(valor || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maximo);
}

function normalizarCodigoCampo(valor) {
  const codigo = String(valor || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10);

  if (!CAMPO_CODIGO_REGEX.test(codigo)) {
    return '';
  }

  return codigo;
}

function normalizarCodigoDistrito(valor) {
  const codigo = String(valor || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_{2,}/g, '_')
    .slice(0, 24);

  if (!DISTRITO_CODIGO_REGEX.test(codigo)) {
    return '';
  }

  return codigo;
}

function normalizarOpcionesCatalogo(lista, tipo) {
  const mapa = new Map();
  const items = Array.isArray(lista) ? lista : [];

  items.forEach((item) => {
    const valorRaw = item?.valor ?? item?.codigo ?? item?.id ?? '';
    const etiquetaRaw = item?.etiqueta ?? item?.nombre ?? item?.label ?? '';

    const valor = tipo === 'campo'
      ? normalizarCodigoCampo(valorRaw)
      : normalizarCodigoDistrito(valorRaw || etiquetaRaw);
    const etiqueta = normalizarTextoCorto(etiquetaRaw || valor, 80);

    if (!valor || !etiqueta) {
      return;
    }

    mapa.set(valor, {
      valor,
      etiqueta,
      activo: item?.activo !== false && item?.activo !== 0 && item?.activo !== '0'
    });
  });

  return Array.from(mapa.values()).sort((a, b) => (
    a.etiqueta.localeCompare(b.etiqueta, 'es', { sensitivity: 'base' })
  ));
}

function sonOpcionesIguales(actual, siguiente) {
  if (actual === siguiente) {
    return true;
  }

  if (!Array.isArray(actual) || !Array.isArray(siguiente) || actual.length !== siguiente.length) {
    return false;
  }

  for (let i = 0; i < actual.length; i += 1) {
    if (
      actual[i]?.valor !== siguiente[i]?.valor
      || actual[i]?.etiqueta !== siguiente[i]?.etiqueta
      || !!actual[i]?.activo !== !!siguiente[i]?.activo
    ) {
      return false;
    }
  }

  return true;
}

function fusionarOpcionesCatalogo(base, extra, tipo) {
  return normalizarOpcionesCatalogo([
    ...(Array.isArray(base) ? base : []),
    ...(Array.isArray(extra) ? extra : [])
  ], tipo);
}

function obtenerCodigoDistritoOrganizacion(organizacion) {
  if (!organizacion || typeof organizacion !== 'object') {
    return '';
  }

  const distritoApi = normalizarCodigoDistrito(
    organizacion?.distrito
    || organizacion?.distrito_codigo
    || organizacion?.distrito_id
  );

  if (distritoApi) {
    return distritoApi;
  }

  return '';
}

function extraerOpcionesCampoDesdeOrganizaciones(organizaciones) {
  return (Array.isArray(organizaciones) ? organizaciones : [])
    .map((item) => ({
      valor: item?.campo || '',
      etiqueta: item?.campo_nombre || item?.campo || ''
    }))
    .filter((item) => normalizarCodigoCampo(item.valor) && normalizarTextoCorto(item.etiqueta));
}

function extraerOpcionesDistritoDesdeOrganizaciones(organizaciones) {
  return (Array.isArray(organizaciones) ? organizaciones : [])
    .map((item) => {
      const valor = obtenerCodigoDistritoOrganizacion(item);
      return {
        valor,
        etiqueta: item?.distrito_nombre || valor
      };
    })
    .filter((item) => item.valor);
}

function enriquecerOrganizacion(organizacion, mapaCampos, mapaDistritos) {
  const campoCodigo = normalizarCodigoCampo(organizacion?.campo || '');
  const distritoCodigo = obtenerCodigoDistritoOrganizacion(organizacion);

  return {
    ...organizacion,
    campo: campoCodigo || String(organizacion?.campo || ''),
    campo_nombre: mapaCampos.get(campoCodigo) || organizacion?.campo_nombre || organizacion?.campo || '',
    distrito: distritoCodigo,
    distrito_nombre: mapaDistritos.get(distritoCodigo)
      || normalizarTextoCorto(organizacion?.distrito_nombre || '', 80)
      || distritoCodigo
  };
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

  const fechaDesdeOrganizacion = String(
    organizacion?.admin_temporal_expira_en
    || organizacion?.admin_password_expira_en
    || ''
  ).trim();
  return fechaDesdeOrganizacion || null;
}

function obtenerUsuarioAdminTemporal(organizacion, detalleCache = null) {
  const usuarioCache = String(detalleCache?.admin_temporal?.usuario || '').trim();
  if (usuarioCache) {
    return usuarioCache;
  }

  const usuarioDesdeOrganizacion = String(
    organizacion?.admin_usuario_temporal
    || organizacion?.admin_usuario_activo
    || ''
  ).trim();

  return usuarioDesdeOrganizacion || null;
}

function tieneRegistroAdminTemporal(organizacion, detalleCache = null) {
  if (!organizacion) {
    return false;
  }

  const usuarioTemporal = obtenerUsuarioAdminTemporal(organizacion, detalleCache);
  const fechaExpiracion = obtenerFechaExpiracionAdmin(organizacion, detalleCache);

  return !!usuarioTemporal
    || esValorBooleanoVerdadero(organizacion?.tiene_admin_temporal_registrado)
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

  const adminTemporalActivo = esValorBooleanoVerdadero(organizacion?.admin_temporal_activo)
    && !adminTemporalExpirado(organizacion, detalleCache);

  if (adminTemporalActivo) {
    return 'ADMIN_ACTIVO';
  }

  if (tieneRegistroAdminTemporal(organizacion, detalleCache)) {
    return 'ADMIN_EXPIRADO';
  }

  return 'SIN_ADMIN';
}

function construirDetalleAdminDesdeOrganizacion(organizacion, detalleCache = null) {
  if (!organizacion || !tieneRegistroAdminTemporal(organizacion, detalleCache)) {
    return null;
  }

  return {
    admin_temporal: {
      usuario: obtenerUsuarioAdminTemporal(organizacion, detalleCache),
      password_temporal: null,
      expira_en: obtenerFechaExpiracionAdmin(organizacion, detalleCache)
    },
    correo: null
  };
}

function coincideFiltrosTablaBase(organizacion, filtrosTabla, detalleCache = null) {
  const campoOk = filtrosTabla.campo === 'TODOS'
    || String(organizacion?.campo || '') === filtrosTabla.campo;
  const distritoOk = filtrosTabla.distrito === 'TODOS'
    || String(organizacion?.distrito || '') === filtrosTabla.distrito;
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

  return campoOk && distritoOk && tipoOk && anioOk && estadoOk;
}

function validarFormulario(formulario) {
  const errores = {};

  if (!formulario.campo) {
    errores.campo = 'Seleccione el campo.';
  }

  if (!formulario.distrito) {
    errores.distrito = 'Seleccione el distrito.';
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

  if (!formulario.distrito) {
    errores.distrito = 'Seleccione el distrito.';
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
  const [camposOpciones, setCamposOpciones] = useState([]);
  const [distritosOpciones, setDistritosOpciones] = useState([]);

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

  const cargarCatalogos = useCallback(async ({ mostrarError = true } = {}) => {
    try {
      const [resCampos, resDistritos] = await Promise.all([
        superadminApi.listarCampos(),
        superadminApi.listarDistritos()
      ]);

      const itemsCampos = Array.isArray(resCampos?.datos?.items) ? resCampos.datos.items : [];
      const itemsDistritos = Array.isArray(resDistritos?.datos?.items) ? resDistritos.datos.items : [];

      setCamposOpciones(normalizarOpcionesCatalogo(itemsCampos, 'campo'));
      setDistritosOpciones(normalizarOpcionesCatalogo(itemsDistritos, 'distrito'));
    } catch (error) {
      if (mostrarError) {
        notificarError(error?.mensaje || 'No se pudo cargar el catalogo de campos y distritos.');
      }
    }
  }, []);

  useEffect(() => {
    cargarCatalogos({ mostrarError: false });
    cargarOrganizaciones();
  }, [cargarCatalogos, cargarOrganizaciones]);

  useEffect(() => {
    const camposDesdeOrganizaciones = extraerOpcionesCampoDesdeOrganizaciones(organizaciones);
    if (camposDesdeOrganizaciones.length > 0) {
      setCamposOpciones((prev) => {
        const next = fusionarOpcionesCatalogo(camposDesdeOrganizaciones, prev, 'campo');
        return sonOpcionesIguales(prev, next) ? prev : next;
      });
    }

    const distritosDesdeOrganizaciones = extraerOpcionesDistritoDesdeOrganizaciones(organizaciones);
    if (distritosDesdeOrganizaciones.length > 0) {
      setDistritosOpciones((prev) => {
        const next = fusionarOpcionesCatalogo(distritosDesdeOrganizaciones, prev, 'distrito');
        return sonOpcionesIguales(prev, next) ? prev : next;
      });
    }
  }, [organizaciones]);

  const mapaCampos = useMemo(() => {
    return new Map(camposOpciones.map((item) => [item.valor, item.etiqueta]));
  }, [camposOpciones]);

  const mapaDistritos = useMemo(() => {
    return new Map(distritosOpciones.map((item) => [item.valor, item.etiqueta]));
  }, [distritosOpciones]);

  const organizacionesEnriquecidas = useMemo(() => {
    return organizaciones.map((item) => (
      enriquecerOrganizacion(item, mapaCampos, mapaDistritos)
    ));
  }, [organizaciones, mapaCampos, mapaDistritos]);

  const camposBackendValidos = useMemo(() => {
    return new Set(
      camposOpciones
        .filter((item) => item?.activo !== false)
        .map((item) => normalizarCodigoCampo(item?.valor))
        .filter(Boolean)
    );
  }, [camposOpciones]);

  const camposOpcionesRegistrables = useMemo(() => {
    return camposOpciones.filter((item) => item?.activo !== false && camposBackendValidos.has(item.valor));
  }, [camposOpciones, camposBackendValidos]);

  const distritosBackendValidos = useMemo(() => {
    return new Set(
      distritosOpciones
        .filter((item) => item?.activo !== false)
        .map((item) => normalizarCodigoDistrito(item?.valor))
        .filter(Boolean)
    );
  }, [distritosOpciones]);

  const distritosOpcionesRegistrables = useMemo(() => {
    return distritosOpciones.filter((item) => (
      item?.activo !== false && distritosBackendValidos.has(item.valor)
    ));
  }, [distritosOpciones, distritosBackendValidos]);

  const opcionesAnioFiltro = useMemo(() => {
    const years = new Set();
    organizacionesEnriquecidas.forEach((item) => {
      const anio = obtenerAnioCreacion(item?.creado_en);
      if (anio !== null) {
        years.add(anio);
      }
    });

    return Array.from(years).sort((a, b) => b - a);
  }, [organizacionesEnriquecidas]);

  const organizacionesAdminFiltradas = useMemo(() => {
    return filtrarOrganizacionesPorCampoTipo(
      organizacionesEnriquecidas,
      filtrosAdminTemporal.campo,
      filtrosAdminTemporal.tipo_organizacion
    );
  }, [organizacionesEnriquecidas, filtrosAdminTemporal]);

  const organizacionesTablaOpciones = useMemo(() => {
    const filtradas = organizacionesEnriquecidas.filter((item) => {
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
  }, [organizacionesEnriquecidas, filtrosTabla, detallesAdminTemporalPorOrganizacion]);

  const organizacionesFiltradas = useMemo(() => {
    return organizacionesEnriquecidas.filter((item) => {
      const organizacionId = Number(item?.id);
      const detalleCache = Number.isInteger(organizacionId) && organizacionId > 0
        ? detallesAdminTemporalPorOrganizacion[organizacionId]
        : null;
      const baseOk = coincideFiltrosTablaBase(item, filtrosTabla, detalleCache);

      const organizacionOk = filtrosTabla.organizacion_id === 'TODOS'
        || Number(item?.id) === Number(filtrosTabla.organizacion_id);

      return baseOk && organizacionOk;
    });
  }, [organizacionesEnriquecidas, filtrosTabla, detallesAdminTemporalPorOrganizacion]);

  const organizacionSeleccionadaTabla = useMemo(
    () => buscarOrganizacionPorId(organizacionesEnriquecidas, organizacionTablaSeleccionadaId),
    [organizacionesEnriquecidas, organizacionTablaSeleccionadaId]
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
    () => buscarOrganizacionPorId(organizacionesEnriquecidas, formularioAdminTemporal.organizacion_id),
    [organizacionesEnriquecidas, formularioAdminTemporal.organizacion_id]
  );

  useEffect(() => {
    if (organizacionTablaSeleccionadaId === null) {
      return;
    }

    const seleccionada = buscarOrganizacionPorId(organizacionesEnriquecidas, organizacionTablaSeleccionadaId);
    if (!seleccionada) {
      setOrganizacionTablaSeleccionadaId(null);
    }
  }, [organizacionesEnriquecidas, organizacionTablaSeleccionadaId]);

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

    if (campo === 'campo') {
      valorNormalizado = normalizarCodigoCampo(valor);
    } else if (campo === 'distrito') {
      valorNormalizado = normalizarCodigoDistrito(valor);
    } else if (campo === 'nombre_organizacion') {
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
          organizacionesEnriquecidas,
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
  }, [organizacionesEnriquecidas]);

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
      distrito: normalizarCodigoDistrito(organizacion?.distrito || ''),
      tipo_organizacion: organizacion.tipo_organizacion || 'IGLESIA',
      nombre_organizacion: organizacion.nombre_organizacion || '',
      correo_contacto: organizacion.correo_contacto || '',
      activa: !!organizacion.activa
    });
    setErroresEdicion({});
  }, []);

  const cambiarCampoEdicion = useCallback((campo, valor) => {
    let valorNormalizado = valor;

    if (campo === 'distrito') {
      valorNormalizado = normalizarCodigoDistrito(valor);
    } else if (campo === 'nombre_organizacion') {
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

      const opciones = organizacionesEnriquecidas.filter((item) => {
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
  }, [organizacionesEnriquecidas, detallesAdminTemporalPorOrganizacion]);

  const limpiarFiltrosTabla = useCallback(() => {
    setFiltrosTabla(FILTROS_TABLA_INICIALES);
  }, []);

  const crearOrganizacion = useCallback(async () => {
    const validacion = validarFormulario(formulario);
    if (!validacion.valido) {
      setErrores(validacion.errores);
      return false;
    }

    if (!camposBackendValidos.has(normalizarCodigoCampo(formulario.campo))) {
      const mensaje = 'El campo seleccionado no existe o está inactivo en el servidor.';
      setErrores((prev) => ({ ...prev, campo: mensaje }));
      notificarError(mensaje);
      return false;
    }

    if (!distritosBackendValidos.has(normalizarCodigoDistrito(formulario.distrito))) {
      const mensaje = 'El distrito seleccionado no existe o está inactivo en el servidor.';
      setErrores((prev) => ({ ...prev, distrito: mensaje }));
      notificarError(mensaje);
      return false;
    }

    if (existeDuplicadoNombreEnCampoTipo(organizacionesEnriquecidas, {
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
        distrito: sanitizado.distrito,
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
  }, [
    formulario,
    organizacionesEnriquecidas,
    camposBackendValidos,
    distritosBackendValidos,
    limpiarFormulario,
    cargarOrganizaciones
  ]);

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
            tiene_admin_temporal_registrado: true,
            admin_temporal_activo: true,
            admin_usuario_activo: adminTemporal.usuario || item.admin_usuario_activo || null,
            admin_password_expira_en: adminTemporal.expira_en || item.admin_password_expira_en || null,
            admin_usuario_temporal: adminTemporal.usuario || item.admin_usuario_temporal || null,
            admin_temporal_expira_en: adminTemporal.expira_en || item.admin_temporal_expira_en || null
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

    if (!distritosBackendValidos.has(normalizarCodigoDistrito(formularioEdicion.distrito))) {
      const mensaje = 'El distrito seleccionado no existe o está inactivo en el servidor.';
      setErroresEdicion((prev) => ({ ...prev, distrito: mensaje }));
      notificarError(mensaje);
      return false;
    }

    const organizacionActual = buscarOrganizacionPorId(organizacionesEnriquecidas, organizacionId);
    if (organizacionActual && existeDuplicadoNombreEnCampoTipo(organizacionesEnriquecidas, {
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
        distrito: sanitizado.distrito,
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
  }, [
    formularioEdicion,
    organizacionesEnriquecidas,
    distritosBackendValidos,
    cancelarEdicion,
    cargarOrganizaciones
  ]);

  const crearCampoCatalogo = useCallback(async (codigoRaw, nombreRaw) => {
    const codigo = normalizarCodigoCampo(codigoRaw);
    const etiqueta = normalizarTextoCorto(nombreRaw, 80);

    if (!codigo || !CAMPO_CODIGO_REGEX.test(codigo)) {
      notificarError('El código del campo debe tener 2 a 10 caracteres alfanuméricos.');
      return false;
    }

    if (etiqueta.length < 3) {
      notificarError('El nombre del campo debe tener al menos 3 caracteres.');
      return false;
    }

    if (camposOpciones.some((item) => item.valor === codigo)) {
      notificarError('Ese código de campo ya existe.');
      return false;
    }

    try {
      const res = await superadminApi.crearCampo({
        codigo,
        nombre: etiqueta,
        activo: true
      });

      if (res?.exito) {
        await Promise.all([cargarCatalogos(), cargarOrganizaciones()]);
        notificarExito(res?.mensaje || 'Campo agregado correctamente.');
        return true;
      }

      notificarError(res?.mensaje || 'No se pudo agregar el campo.');
      return false;
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo agregar el campo.');
      return false;
    }
  }, [camposOpciones, cargarCatalogos, cargarOrganizaciones]);

  const actualizarCampoCatalogo = useCallback(async (codigoRaw, nombreRaw) => {
    const codigo = normalizarCodigoCampo(codigoRaw);
    const etiqueta = normalizarTextoCorto(nombreRaw, 80);

    if (!codigo) {
      notificarError('Campo inválido.');
      return false;
    }

    if (etiqueta.length < 3) {
      notificarError('El nombre del campo debe tener al menos 3 caracteres.');
      return false;
    }

    const existe = camposOpciones.some((item) => item.valor === codigo);
    if (!existe) {
      notificarError('No se encontró el campo a editar.');
      return false;
    }

    try {
      const res = await superadminApi.actualizarCampo(codigo, { nombre: etiqueta });
      if (res?.exito) {
        await Promise.all([cargarCatalogos(), cargarOrganizaciones()]);
        notificarExito(res?.mensaje || 'Nombre de campo actualizado.');
        return true;
      }

      notificarError(res?.mensaje || 'No se pudo actualizar el campo.');
      return false;
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo actualizar el campo.');
      return false;
    }
  }, [camposOpciones, cargarCatalogos, cargarOrganizaciones]);

  const eliminarCampoCatalogo = useCallback(async (codigoRaw) => {
    const codigo = normalizarCodigoCampo(codigoRaw);
    if (!codigo) {
      notificarError('Campo inválido.');
      return false;
    }

    const existe = camposOpciones.some((item) => item.valor === codigo);
    if (!existe) {
      notificarError('No se encontró el campo a eliminar.');
      return false;
    }

    try {
      const res = await superadminApi.eliminarCampo(codigo);
      if (res?.exito) {
        await Promise.all([cargarCatalogos(), cargarOrganizaciones()]);
        setFormulario((prev) => (prev.campo === codigo ? { ...prev, campo: '' } : prev));
        setFiltrosTabla((prev) => (prev.campo === codigo ? { ...prev, campo: 'TODOS' } : prev));
        setFiltrosAdminTemporal((prev) => (prev.campo === codigo ? { ...prev, campo: 'TODOS' } : prev));
        notificarExito(res?.mensaje || 'Campo eliminado correctamente.');
        return true;
      }

      notificarError(res?.mensaje || 'No se pudo eliminar el campo.');
      return false;
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo eliminar el campo.');
      return false;
    }
  }, [camposOpciones, cargarCatalogos, cargarOrganizaciones]);

  const crearDistritoCatalogo = useCallback(async (nombreRaw) => {
    const etiqueta = normalizarTextoCorto(nombreRaw, 80);
    if (etiqueta.length < 3) {
      notificarError('El nombre del distrito debe tener al menos 3 caracteres.');
      return null;
    }

    try {
      const res = await superadminApi.crearDistrito({
        nombre: etiqueta,
        activo: true
      });

      if (!res?.exito) {
        notificarError(res?.mensaje || 'No se pudo crear el distrito.');
        return null;
      }

      await Promise.all([cargarCatalogos(), cargarOrganizaciones()]);
      const codigoCreado = normalizarCodigoDistrito(res?.datos?.item?.codigo || '');
      notificarExito(res?.mensaje || 'Distrito agregado correctamente.');
      return codigoCreado || null;
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo crear el distrito.');
      return null;
    }
  }, [cargarCatalogos, cargarOrganizaciones]);

  const actualizarDistritoCatalogo = useCallback(async (codigoRaw, nombreRaw) => {
    const codigo = normalizarCodigoDistrito(codigoRaw);
    const etiqueta = normalizarTextoCorto(nombreRaw, 80);

    if (!codigo) {
      notificarError('Distrito inválido.');
      return false;
    }

    if (etiqueta.length < 3) {
      notificarError('El nombre del distrito debe tener al menos 3 caracteres.');
      return false;
    }

    const existe = distritosOpciones.some((item) => item.valor === codigo);
    if (!existe) {
      notificarError('No se encontró el distrito a editar.');
      return false;
    }

    try {
      const res = await superadminApi.actualizarDistrito(codigo, { nombre: etiqueta });
      if (res?.exito) {
        await Promise.all([cargarCatalogos(), cargarOrganizaciones()]);
        notificarExito(res?.mensaje || 'Nombre de distrito actualizado.');
        return true;
      }

      notificarError(res?.mensaje || 'No se pudo actualizar el distrito.');
      return false;
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo actualizar el distrito.');
      return false;
    }
  }, [distritosOpciones, cargarCatalogos, cargarOrganizaciones]);

  const eliminarDistritoCatalogo = useCallback(async (codigoRaw) => {
    const codigo = normalizarCodigoDistrito(codigoRaw);
    if (!codigo) {
      notificarError('Distrito inválido.');
      return false;
    }

    const existe = distritosOpciones.some((item) => item.valor === codigo);
    if (!existe) {
      notificarError('No se encontró el distrito a eliminar.');
      return false;
    }

    try {
      const res = await superadminApi.eliminarDistrito(codigo);
      if (res?.exito) {
        await Promise.all([cargarCatalogos(), cargarOrganizaciones()]);
        setFormulario((prev) => (prev.distrito === codigo ? { ...prev, distrito: '' } : prev));
        setFormularioEdicion((prev) => (prev.distrito === codigo ? { ...prev, distrito: '' } : prev));
        setFiltrosTabla((prev) => (prev.distrito === codigo ? { ...prev, distrito: 'TODOS' } : prev));
        notificarExito(res?.mensaje || 'Distrito eliminado correctamente.');
        return true;
      }

      notificarError(res?.mensaje || 'No se pudo eliminar el distrito.');
      return false;
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo eliminar el distrito.');
      return false;
    }
  }, [distritosOpciones, cargarCatalogos, cargarOrganizaciones]);

  return {
    formulario,
    errores,
    formularioAdminTemporal,
    erroresAdminTemporal,
    adminTemporalVisible,
    filtrosAdminTemporal,
    formularioEdicion,
    erroresEdicion,
    organizaciones: organizacionesEnriquecidas,
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
    camposOpciones,
    camposOpcionesRegistrables,
    distritosOpciones,
    distritosOpcionesRegistrables,
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
    crearCampoCatalogo,
    actualizarCampoCatalogo,
    eliminarCampoCatalogo,
    crearDistritoCatalogo,
    actualizarDistritoCatalogo,
    eliminarDistritoCatalogo,
    limpiarFormulario,
    limpiarFormularioAdminTemporal,
    cancelarEdicion,
    recargarOrganizaciones: cargarOrganizaciones
  };
}
