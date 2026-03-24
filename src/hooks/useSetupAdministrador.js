import { useCallback, useEffect, useMemo, useState } from 'react';
import setupApi from '../api/setupApi';
import { notificarError, notificarExito } from '../utils/notify';
import { useSetupStatus } from './useSetupStatus';
import {
  CATEGORIAS_METRICA_OPCIONES,
  inferirCategoriaPorClave,
  METRICAS_FALLBACK,
  normalizarMetricasConfig
} from '../utils/metricasConfig';

const CLAVES_PUNTUALIDAD = ['llegaron_antes_hora', 'llegaron_despues_hora'];
const CLAVES_PERMANENCIA_BASE = ['retiros_antes_terminar', 'se_quedaron_todo'];
const CLAVE_TOTAL_ASISTENTES = 'total_asistentes';
const MAX_METRICAS_ADICIONALES = 7;
const CATEGORIA_INFO_CULTO = 'informacion_culto';
const CATEGORIA_PERMANENCIA = 'permanencia';
const CATEGORIAS_VALIDAS = new Set(CATEGORIAS_METRICA_OPCIONES.map((item) => item.valor));
const CATEGORIAS_AUTOMATICAS = new Set(['procedencia', 'visitas']);
const METRICAS_FIJAS_MAP = new Map(
  METRICAS_FALLBACK.map((item) => [
    String(item?.clave || '').trim().toLowerCase(),
    {
      etiqueta: String(item?.etiqueta || '').trim(),
      categoria: String(item?.categoria || '').trim().toLowerCase()
    }
  ])
);
const ETIQUETA_METRICA_BASE = {
  llegaron_antes_hora: 'Llegaron antes de la hora',
  llegaron_despues_hora: 'Llegaron despuÃ©s de la hora',
  total_asistentes: 'Total de asistentes',
  ninos: 'NiÃ±os',
  jovenes: 'JÃ³venes'
};

const NORMALIZE_REGEX = /[\u0300-\u036f]/g;
const DIA_OPCIONES = [
  { valor: 1, etiqueta: 'Domingo' },
  { valor: 2, etiqueta: 'Lunes' },
  { valor: 3, etiqueta: 'Martes' },
  { valor: 4, etiqueta: 'MiÃ©rcoles' },
  { valor: 5, etiqueta: 'Jueves' },
  { valor: 6, etiqueta: 'Viernes' },
  { valor: 7, etiqueta: 'SÃ¡bado' }
];

const CULTOS_DEFAULT = [
  { codigo: 'SABADO', nombre: 'Culto SÃ¡bado', dia_semana: 7, hora_inicio: '09:00', activo: false, orden: 1 },
  { codigo: 'DOMINGO', nombre: 'Culto Domingo', dia_semana: 1, hora_inicio: '18:30', activo: false, orden: 2 },
  { codigo: 'MIERCOLES', nombre: 'Culto MiÃ©rcoles', dia_semana: 4, hora_inicio: '18:30', activo: false, orden: 3 }
];

const PROCEDENCIAS_DEFAULT = [
  { nombre: 'Barrio', activo: false, orden: 1 },
  { nombre: 'Guayabo', activo: false, orden: 2 }
];

let setupRowSeq = 0;

function generarUiId(prefijo) {
  setupRowSeq += 1;
  return `${prefijo}_${setupRowSeq}`;
}

function resolverUiId(item, prefijo, campos = []) {
  if (typeof item?.ui_id === 'string' && item.ui_id.trim()) {
    return item.ui_id;
  }

  for (const campo of campos) {
    const valor = item?.[campo];
    if (Number.isInteger(Number(valor)) && Number(valor) > 0) {
      return `${prefijo}_${Number(valor)}`;
    }
  }

  return generarUiId(prefijo);
}

function toBool(valor) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'number') return valor === 1;
  if (typeof valor === 'string') {
    return ['1', 'true', 'on', 'yes', 'si', 'sÃ­'].includes(valor.trim().toLowerCase());
  }
  return false;
}

function toInt(valor, fallback = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function formatearHora(hora) {
  const valor = String(hora || '').trim();
  if (!valor) return '';
  if (/^\d{2}:\d{2}:\d{2}$/.test(valor)) return valor.slice(0, 5);
  return valor;
}

function clonarLista(lista = []) {
  return (Array.isArray(lista) ? lista : []).map((item) => ({ ...item }));
}

function normalizarTextoCodigo(valor) {
  const limpio = String(valor || '')
    .normalize('NFD')
    .replace(NORMALIZE_REGEX, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_{2,}/g, '_');

  return limpio.slice(0, 30);
}

function normalizarMensajeMetricasUsuarioFinal(mensajeRaw) {
  const mensaje = String(mensajeRaw || '').trim();
  if (!mensaje) return '';

  const normalizado = mensaje
    .normalize('NFD')
    .replace(NORMALIZE_REGEX, '')
    .toLowerCase();

  const clavesFaltantes = [];
  const regex = /metrica_base_faltante:([a-z0-9_]+)/g;
  let match = regex.exec(normalizado);
  while (match) {
    clavesFaltantes.push(match[1]);
    match = regex.exec(normalizado);
  }

  if (clavesFaltantes.length > 0) {
    const etiquetas = Array.from(new Set(clavesFaltantes))
      .map((clave) => ETIQUETA_METRICA_BASE[clave] || clave.replace(/_/g, ' '));
    if (etiquetas.length > 0) {
      return 'La configuraciÃ³n de mÃ©tricas es invÃ¡lida. Revise las mÃ©tricas base y guarde nuevamente.';
    }
  }

  if (normalizado.includes('configuracion de metricas invalida')) {
    return 'La configuraciÃ³n de mÃ©tricas es invÃ¡lida. Revise el panel de MÃ©tricas y guarde nuevamente.';
  }

  return mensaje;
}

function normalizarClaveMetrica(valor) {
  return String(valor || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

function slugProcedenciaDesdeNombre(valor) {
  return String(valor || '')
    .trim()
    .normalize('NFD')
    .replace(NORMALIZE_REGEX, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

function slugProcedenciaDesdeClaveMetrica(claveRaw) {
  const clave = normalizarClaveMetrica(claveRaw);
  if (clave.startsWith('proc_')) return clave.slice(5);
  if (clave.startsWith('visitas_')) return clave.slice(8);
  if (clave.startsWith('nombres_visitas_')) return clave.slice(16);
  return '';
}

function sincronizarGrupoMetricasProcedencia(listaMetricas, slugProcedencia, habilitado) {
  if (!slugProcedencia) return listaMetricas;

  const clavesObjetivo = new Set([
    `proc_${slugProcedencia}`,
    `visitas_${slugProcedencia}`,
    `nombres_visitas_${slugProcedencia}`
  ]);

  const actualizada = listaMetricas.map((item) => {
    const clave = normalizarClaveMetrica(item?.clave);
    if (!clavesObjetivo.has(clave)) {
      return item;
    }

    return {
      ...item,
      habilitado,
      obligatorio: false
    };
  });

  if (!habilitado) {
    return actualizada;
  }

  return actualizada.map((item) => {
    if (normalizarClaveMetrica(item?.clave) !== CLAVE_TOTAL_ASISTENTES) {
      return item;
    }

    if (item.habilitado) {
      return item;
    }

    return {
      ...item,
      habilitado: true,
      obligatorio: false
    };
  });
}

function sincronizarProcedenciasPorSlug(listaProcedencias, slugProcedencia, activo) {
  if (!slugProcedencia) return listaProcedencias;

  return reordenarProcedencias(listaProcedencias.map((item) => {
    const slugItem = slugProcedenciaDesdeNombre(item?.nombre);
    if (slugItem !== slugProcedencia) {
      return item;
    }
    return {
      ...item,
      activo: !!activo
    };
  }));
}

function normalizarCategoriaMetrica(categoria, clave = '') {
  const valor = String(categoria || '').trim().toLowerCase();
  if (CATEGORIAS_VALIDAS.has(valor)) {
    return valor;
  }
  return inferirCategoriaPorClave(clave);
}

function esCategoriaAutomaticaMetrica(categoria, clave = '') {
  return CATEGORIAS_AUTOMATICAS.has(normalizarCategoriaMetrica(categoria, clave));
}

function esMetricaAdicionalUsuario(item) {
  if (!item || item.es_fija) {
    return false;
  }

  const clave = normalizarClaveMetrica(item?.clave);
  if (
    clave.startsWith('proc_')
    || clave.startsWith('visitas_')
    || clave.startsWith('nombres_visitas_')
  ) {
    return false;
  }

  const categoria = normalizarCategoriaMetrica(item?.categoria, item?.clave);
  return !CATEGORIAS_AUTOMATICAS.has(categoria);
}

function contarMetricasAdicionales(metricas = []) {
  return (Array.isArray(metricas) ? metricas : []).reduce((acumulado, item) => (
    acumulado + (esMetricaAdicionalUsuario(item) ? 1 : 0)
  ), 0);
}

function construirClaveMetricaUnica(base, clavesUsadas, fallback = 'metrica') {
  let candidata = normalizarClaveMetrica(base) || normalizarClaveMetrica(fallback) || 'metrica';
  if (!clavesUsadas.has(candidata)) {
    clavesUsadas.add(candidata);
    return candidata;
  }

  let secuencia = 2;
  while (clavesUsadas.has(`${candidata}_${secuencia}`)) {
    secuencia += 1;
  }
  const unica = `${candidata}_${secuencia}`.slice(0, 80);
  clavesUsadas.add(unica);
  return unica;
}

function obtenerDefinicionMetricaFija(clave) {
  return METRICAS_FIJAS_MAP.get(normalizarClaveMetrica(clave)) || null;
}

function obtenerSiguienteClaveMetrica(metricas = []) {
  const usadas = new Set((Array.isArray(metricas) ? metricas : [])
    .map((item) => normalizarClaveMetrica(item?.clave))
    .filter(Boolean));

  let intento = (Array.isArray(metricas) ? metricas.length : 0) + 1;
  let candidata = `metrica_nueva_${intento}`;
  while (usadas.has(candidata)) {
    intento += 1;
    candidata = `metrica_nueva_${intento}`;
  }
  return candidata;
}

function generarCodigoCulto(item, index, codigosUsados) {
  const codigoExistente = normalizarTextoCodigo(item?.codigo);
  const baseNombre = normalizarTextoCodigo(item?.nombre);
  const dia = toInt(item?.dia_semana, 0);
  const diaToken = dia >= 1 && dia <= 7 ? `D${dia}` : '';

  let candidato = codigoExistente;
  if (!candidato) {
    const base = baseNombre || `CULTO_${index + 1}`;
    candidato = diaToken ? `${base}_${diaToken}` : base;
    candidato = candidato.slice(0, 30);
  }

  if (!candidato || candidato.length < 2) {
    candidato = `C${index + 1}`;
  }

  let unico = candidato;
  let secuencia = 2;
  while (codigosUsados.has(unico)) {
    const sufijo = `_${secuencia}`;
    const maxBase = Math.max(1, 30 - sufijo.length);
    unico = `${candidato.slice(0, maxBase)}${sufijo}`;
    secuencia += 1;
  }
  codigosUsados.add(unico);
  return unico;
}

function prepararCultosParaGuardar(cultos) {
  const codigosUsados = new Set();
  return (Array.isArray(cultos) ? cultos : []).map((item, index) => ({
    ...item,
    codigo: generarCodigoCulto(item, index, codigosUsados),
    nombre: String(item?.nombre || '').trim(),
    dia_semana: toInt(item?.dia_semana, 1),
    hora_inicio: formatearHora(item?.hora_inicio),
    activo: !!item?.activo,
    orden: index + 1
  }));
}

function firmarCultos(cultos) {
  return JSON.stringify(
    prepararCultosParaGuardar(cultos).map((item) => ({
      codigo: item.codigo,
      nombre: item.nombre,
      dia_semana: item.dia_semana,
      hora_inicio: item.hora_inicio,
      activo: item.activo,
      orden: item.orden
    }))
  );
}

function reordenarProcedencias(procedencias) {
  return (Array.isArray(procedencias) ? procedencias : []).map((item, index) => ({
    ...item,
    orden: index + 1
  }));
}

function prepararProcedenciasParaGuardar(procedencias) {
  return reordenarProcedencias(procedencias).map((item) => ({
    ...item,
    nombre: String(item?.nombre || '').trim(),
    activo: !!item?.activo,
    orden: toInt(item?.orden, 0)
  }));
}

function firmarProcedencias(procedencias) {
  return JSON.stringify(
    prepararProcedenciasParaGuardar(procedencias).map((item) => ({
      nombre: String(item?.nombre || '').trim(),
      activo: !!item?.activo,
      orden: toInt(item?.orden, 0)
    }))
  );
}

function prepararMetricasParaGuardar(metricas) {
  const clavesUsadas = new Set();

  return (Array.isArray(metricas) ? metricas : []).map((item, index) => {
    const claveBase = normalizarClaveMetrica(item?.clave);
    const etiquetaIngresada = String(item?.etiqueta || '').trim();
    const clave =
      construirClaveMetricaUnica(claveBase || etiquetaIngresada, clavesUsadas, `metrica_${index + 1}`);
    const fija = obtenerDefinicionMetricaFija(clave);

    const habilitado = !!item?.habilitado;
    const categoria = fija
      ? normalizarCategoriaMetrica(fija.categoria, clave)
      : normalizarCategoriaMetrica(item?.categoria, clave);

    return {
      ...item,
      clave,
      etiqueta: fija ? fija.etiqueta : etiquetaIngresada,
      categoria,
      habilitado,
      obligatorio: false,
      es_fija: Boolean(fija || item?.es_fija)
    };
  });
}

function firmarMetricas(metricas) {
  return JSON.stringify(
    prepararMetricasParaGuardar(metricas).map((item) => ({
      clave: String(item?.clave || ''),
      etiqueta: String(item?.etiqueta || '').trim(),
      categoria: normalizarCategoriaMetrica(item?.categoria, item?.clave),
      habilitado: !!item?.habilitado,
      es_fija: !!item?.es_fija
    }))
  );
}

function normalizarCultos(cultosRaw) {
  const lista = Array.isArray(cultosRaw) && cultosRaw.length > 0 ? cultosRaw : CULTOS_DEFAULT;
  return lista
    .map((item, idx) => ({
      ui_id: resolverUiId(item, 'culto', ['culto_id', 'id']),
      codigo: String(item?.codigo || '').trim().toUpperCase(),
      nombre: String(item?.nombre || '').trim(),
      dia_semana: toInt(item?.dia_semana, 1),
      hora_inicio: formatearHora(item?.hora_inicio),
      activo: toBool(item?.activo ?? false),
      orden: toInt(item?.orden, idx + 1)
    }))
    .filter((item) => item.codigo || item.nombre);
}

function normalizarProcedencias(procedenciasRaw) {
  const lista = Array.isArray(procedenciasRaw) && procedenciasRaw.length > 0
    ? procedenciasRaw
    : PROCEDENCIAS_DEFAULT;
  return reordenarProcedencias(lista.map((item, idx) => ({
    ui_id: resolverUiId(item, 'procedencia', ['procedencia_id', 'id']),
    nombre: String(item?.nombre || '').trim(),
    activo: toBool(item?.activo ?? false),
    orden: toInt(item?.orden, idx + 1)
  })));
}

function normalizarMetricas(metricasRaw) {
  const base = normalizarMetricasConfig(metricasRaw?.length ? metricasRaw : METRICAS_FALLBACK);
  return base.map((item) => {
    const definicionFija = obtenerDefinicionMetricaFija(item.clave);
    const esFija = Boolean(definicionFija);
    const categoriaBase = normalizarCategoriaMetrica(
      definicionFija?.categoria || item.categoria,
      item.clave
    );

    return {
      ...item,
      ui_id: resolverUiId(item, 'metrica', ['metrica_id', 'id']),
      clave: normalizarClaveMetrica(item.clave),
      etiqueta: definicionFija?.etiqueta || item.etiqueta,
      categoria: categoriaBase,
      habilitado: item.habilitado,
      obligatorio: false,
      es_fija: esFija
    };
  });
}

function validarCultos(cultos) {
  const errores = {};
  const codigos = new Set();
  const ordenes = new Set();

  if (!Array.isArray(cultos) || cultos.length < 1) {
    return { general: 'Debe configurar al menos un culto.' };
  }

  cultos.forEach((culto, idx) => {
    const key = `fila_${idx}`;
    const filaErrores = {};

    if (!/^[A-Z0-9_]{2,30}$/.test(culto.codigo || '')) {
      filaErrores.codigo = 'CÃ³digo invÃ¡lido (A-Z, 0-9 y guion bajo).';
    } else if (codigos.has(culto.codigo)) {
      filaErrores.codigo = 'CÃ³digo duplicado.';
    } else {
      codigos.add(culto.codigo);
    }

    const largoNombreCulto = String(culto.nombre || '').trim().length;
    if (largoNombreCulto < 3 || largoNombreCulto > 20) {
      filaErrores.nombre = 'El nombre debe tener entre 3 y 20 caracteres.';
    }

    if (!Number.isInteger(culto.dia_semana) || culto.dia_semana < 1 || culto.dia_semana > 7) {
      filaErrores.dia_semana = 'DÃ­a invÃ¡lido.';
    }

    if (!/^\d{2}:\d{2}$/.test(culto.hora_inicio || '')) {
      filaErrores.hora_inicio = 'Formato de hora invÃ¡lido (HH:MM).';
    }

    if (!Number.isInteger(culto.orden) || culto.orden < 1 || culto.orden > 99) {
      filaErrores.orden = 'Orden invÃ¡lido (1-99).';
    } else if (ordenes.has(culto.orden)) {
      filaErrores.orden = 'Orden duplicado.';
    } else {
      ordenes.add(culto.orden);
    }

    if (Object.keys(filaErrores).length > 0) {
      errores[key] = filaErrores;
    }
  });

  return errores;
}

function validarProcedencias(procedencias) {
  const errores = {};
  const nombres = new Set();
  const ordenes = new Set();

  if (!Array.isArray(procedencias) || procedencias.length < 1) {
    return { general: 'Debe configurar al menos una procedencia.' };
  }

  if (procedencias.length > 10) {
    return { general: 'Solo se permiten hasta 10 procedencias.' };
  }

  procedencias.forEach((item, idx) => {
    const key = `fila_${idx}`;
    const filaErrores = {};
    const nombre = String(item.nombre || '').trim();
    const nombreClave = nombre.toLowerCase();

    if (nombre.length < 2 || nombre.length > 80) {
      filaErrores.nombre = 'Nombre invÃ¡lido (2-80).';
    } else if (nombres.has(nombreClave)) {
      filaErrores.nombre = 'Nombre duplicado.';
    } else {
      nombres.add(nombreClave);
    }

    if (!Number.isInteger(item.orden) || item.orden < 1 || item.orden > 99) {
      filaErrores.orden = 'Orden invÃ¡lido (1-99).';
    } else if (ordenes.has(item.orden)) {
      filaErrores.orden = 'Orden duplicado.';
    } else {
      ordenes.add(item.orden);
    }

    if (Object.keys(filaErrores).length > 0) {
      errores[key] = filaErrores;
    }
  });

  return errores;
}

function validarMetricasConfiguracion(metricas) {
  const errores = {};
  const claves = new Set();
  const metricasAdicionales = contarMetricasAdicionales(metricas);
  let habilitadas = 0;
  let antes = null;
  let despues = null;
  let retiroAntesTerminar = null;
  let seQuedaronTodo = null;
  let total = null;
  let infoCultoHabilitadas = 0;
  let permanenciaHabilitadas = 0;
  let composicionHabilitadas = 0;
  let procedenciaHabilitadas = 0;
  let visitasHabilitadas = 0;

  if (!Array.isArray(metricas) || metricas.length < 1) {
    return { general: 'Debe configurar al menos una mÃ©trica.' };
  }

  if (metricasAdicionales > MAX_METRICAS_ADICIONALES) {
    return { general: `Solo se permiten hasta ${MAX_METRICAS_ADICIONALES} mÃ©tricas adicionales.` };
  }

  metricas.forEach((item, idx) => {
    const key = `fila_${idx}`;
    const filaErrores = {};
    const claveNormalizada = normalizarClaveMetrica(item?.clave);
    const categoria = normalizarCategoriaMetrica(item?.categoria, claveNormalizada);

    if (!/^[a-z0-9_]{2,80}$/.test(claveNormalizada)) {
      filaErrores.clave = 'Clave invÃ¡lida (a-z, 0-9 y guion bajo).';
    } else if (claves.has(claveNormalizada)) {
      filaErrores.clave = 'Clave duplicada.';
    } else {
      claves.add(claveNormalizada);
    }

    if ((item.etiqueta || '').trim().length < 2) {
      filaErrores.etiqueta = 'Etiqueta muy corta.';
    }

    if (!CATEGORIAS_VALIDAS.has(categoria)) {
      filaErrores.categoria = 'Seleccione una categorÃ­a vÃ¡lida.';
    }

    if (item.habilitado) {
      habilitadas += 1;
      if (categoria === CATEGORIA_INFO_CULTO) infoCultoHabilitadas += 1;
      if (categoria === CATEGORIA_PERMANENCIA) permanenciaHabilitadas += 1;
      if (categoria === 'composicion_asistentes') composicionHabilitadas += 1;
      if (categoria === 'procedencia') procedenciaHabilitadas += 1;
      if (categoria === 'visitas') visitasHabilitadas += 1;
    }

    if (claveNormalizada === CLAVES_PUNTUALIDAD[0]) antes = item;
    if (claveNormalizada === CLAVES_PUNTUALIDAD[1]) despues = item;
    if (claveNormalizada === CLAVES_PERMANENCIA_BASE[0]) retiroAntesTerminar = item;
    if (claveNormalizada === CLAVES_PERMANENCIA_BASE[1]) seQuedaronTodo = item;
    if (claveNormalizada === CLAVE_TOTAL_ASISTENTES) total = item;

    if (Object.keys(filaErrores).length > 0) {
      errores[key] = filaErrores;
    }
  });

  if (habilitadas < 1) {
    errores.general = 'Debe dejar al menos una mÃ©trica habilitada.';
  }

  if ((antes && !despues) || (!antes && despues)) {
    errores.general = 'Puntualidad requiere ambas mÃ©tricas: antes y despuÃ©s.';
  }

  if (antes && despues) {
    if (antes.habilitado !== despues.habilitado) {
      errores.general = 'Puntualidad (antes/despuÃ©s) debe mantenerse ambos o ninguno.';
    }
  }

  if ((retiroAntesTerminar && !seQuedaronTodo) || (!retiroAntesTerminar && seQuedaronTodo)) {
    errores.general = 'Permanencia base requiere ambas mÃ©tricas: retiros y se quedaron hasta el final.';
  }

  if (retiroAntesTerminar && seQuedaronTodo) {
    if (
      retiroAntesTerminar.habilitado !== seQuedaronTodo.habilitado
    ) {
      errores.general = 'Permanencia base (retiros/se quedaron) debe mantenerse ambos o ninguno.';
    }
  }

  if ((
    infoCultoHabilitadas > 0
    || permanenciaHabilitadas > 0
    || composicionHabilitadas > 0
    || procedenciaHabilitadas > 0
    || visitasHabilitadas > 0
  ) && (!total || !total.habilitado)) {
    errores.general = 'Total de asistentes debe estar habilitado cuando hay mÃ©tricas que dependen del total.';
  }

  return errores;
}

export function useSetupAdministrador() {
  const {
    detalle,
    faltantes,
    recargarEstadoSetup,
    aplicarDetalleSetup
  } = useSetupStatus();

  const [cultos, setCultos] = useState(() => normalizarCultos(CULTOS_DEFAULT));
  const [procedencias, setProcedencias] = useState(() => normalizarProcedencias(PROCEDENCIAS_DEFAULT));
  const [metricas, setMetricas] = useState(() => normalizarMetricas(METRICAS_FALLBACK));

  const [erroresCultos, setErroresCultos] = useState({});
  const [erroresProcedencias, setErroresProcedencias] = useState({});
  const [erroresMetricas, setErroresMetricas] = useState({});

  const [guardandoCultos, setGuardandoCultos] = useState(false);
  const [guardandoProcedencias, setGuardandoProcedencias] = useState(false);
  const [guardandoMetricas, setGuardandoMetricas] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [cultosBase, setCultosBase] = useState(() => normalizarCultos(CULTOS_DEFAULT));
  const [procedenciasBase, setProcedenciasBase] = useState(
    () => normalizarProcedencias(PROCEDENCIAS_DEFAULT)
  );
  const [metricasBase, setMetricasBase] = useState(() => normalizarMetricas(METRICAS_FALLBACK));
  const [firmaCultosBase, setFirmaCultosBase] = useState(() => firmarCultos(CULTOS_DEFAULT));
  const [firmaProcedenciasBase, setFirmaProcedenciasBase] = useState(
    () => firmarProcedencias(PROCEDENCIAS_DEFAULT)
  );
  const [firmaMetricasBase, setFirmaMetricasBase] = useState(() => firmarMetricas(METRICAS_FALLBACK));

  useEffect(() => {
    const cultosNormalizados = normalizarCultos(detalle?.configuracion?.cultos);
    const procedenciasNormalizadas = normalizarProcedencias(detalle?.configuracion?.procedencias);
    const metricasNormalizadas = normalizarMetricas(detalle?.configuracion?.metricas);

    setCultosBase(cultosNormalizados);
    setProcedenciasBase(procedenciasNormalizadas);
    setMetricasBase(metricasNormalizadas);
    setCultos(clonarLista(cultosNormalizados));
    setProcedencias(clonarLista(procedenciasNormalizadas));
    setMetricas(clonarLista(metricasNormalizadas));
    setFirmaCultosBase(firmarCultos(cultosNormalizados));
    setFirmaProcedenciasBase(firmarProcedencias(procedenciasNormalizadas));
    setFirmaMetricasBase(firmarMetricas(metricasNormalizadas));
  }, [detalle]);

  const cambiarCulto = useCallback((index, campo, valor) => {
    setCultos((prev) => prev.map((item, idx) => {
      if (idx !== index) return item;
      if (campo === 'activo') return { ...item, activo: !!valor };
      if (campo === 'dia_semana' || campo === 'orden') return { ...item, [campo]: toInt(valor, item[campo]) };
      if (campo === 'codigo') return { ...item, codigo: String(valor || '').toUpperCase().replace(/\s+/g, '_') };
      return { ...item, [campo]: valor };
    }));
  }, []);

  const agregarCulto = useCallback(() => {
    setCultos((prev) => ([
      ...prev,
      {
        ui_id: generarUiId('culto'),
        codigo: '',
        nombre: '',
        dia_semana: 1,
        hora_inicio: '09:00',
        activo: true,
        orden: prev.length + 1
      }
    ]));
  }, []);

  const eliminarCulto = useCallback((index) => {
    setCultos((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const cambiarProcedencia = useCallback((index, campo, valor) => {
    setProcedencias((prev) => {
      const actualizado = reordenarProcedencias(prev.map((item, idx) => {
        if (idx !== index) return item;
        if (campo === 'activo') return { ...item, activo: !!valor };
        return { ...item, [campo]: valor };
      }));

      if (campo === 'activo') {
        const procedenciaActual = actualizado[index];
        const slug = slugProcedenciaDesdeNombre(procedenciaActual?.nombre);
        if (slug) {
          setMetricas((prevMetricas) => sincronizarGrupoMetricasProcedencia(prevMetricas, slug, !!valor));
        }
      }

      return actualizado;
    });
  }, []);

  const agregarProcedencia = useCallback(() => {
    setProcedencias((prev) => reordenarProcedencias([
      ...prev,
      {
        ui_id: generarUiId('procedencia'),
        nombre: '',
        activo: true,
        orden: prev.length + 1
      }
    ]));
  }, []);

  const eliminarProcedencia = useCallback((index) => {
    setProcedencias((prev) => reordenarProcedencias(prev.filter((_, idx) => idx !== index)));
  }, []);

  const cambiarMetrica = useCallback((index, campo, valor) => {
    setMetricas((prev) => {
      let actualizado = prev.map((item, idx) => {
        if (idx !== index) return item;
        const esFija = !!item.es_fija;

        if (campo === 'habilitado') {
          const habilitado = !!valor;
          return {
            ...item,
            habilitado,
            obligatorio: false
          };
        }

        if (campo === 'obligatorio') {
          return item;
        }

        if (esFija) {
          return item;
        }

        if (campo === 'etiqueta') {
          return { ...item, etiqueta: String(valor || '') };
        }

        if (campo === 'categoria') {
          if (esCategoriaAutomaticaMetrica(item?.categoria, item?.clave)) {
            return item;
          }

          const categoriaNormalizada = normalizarCategoriaMetrica(valor, item.clave);
          if (esCategoriaAutomaticaMetrica(categoriaNormalizada, item?.clave)) {
            return item;
          }

          return {
            ...item,
            categoria: categoriaNormalizada
          };
        }

        return item;
      });

      const metricaEditada = actualizado[index];
      if (metricaEditada && CLAVES_PUNTUALIDAD.includes(metricaEditada.clave)) {
        actualizado = actualizado.map((item, idx) => {
          if (idx === index || !CLAVES_PUNTUALIDAD.includes(item.clave)) return item;
          if (campo === 'habilitado') {
            return {
              ...item,
              habilitado: metricaEditada.habilitado,
              obligatorio: false
            };
          }
          if (campo === 'obligatorio') {
            return item;
          }
          return item;
        });
      }

      if (metricaEditada && CLAVES_PERMANENCIA_BASE.includes(metricaEditada.clave)) {
        actualizado = actualizado.map((item, idx) => {
          if (idx === index || !CLAVES_PERMANENCIA_BASE.includes(item.clave)) return item;
          if (campo === 'habilitado') {
            return {
              ...item,
              habilitado: metricaEditada.habilitado,
              obligatorio: false
            };
          }
          if (campo === 'obligatorio') {
            return item;
          }
          return item;
        });
      }

      if (metricaEditada && (campo === 'habilitado' || campo === 'categoria')) {
        const categoriaMetrica = normalizarCategoriaMetrica(
          metricaEditada?.categoria,
          metricaEditada?.clave
        );
        const requiereTotal =
          metricaEditada.habilitado
          && [
            CATEGORIA_INFO_CULTO,
            CATEGORIA_PERMANENCIA,
            'composicion_asistentes',
            'procedencia',
            'visitas'
          ].includes(categoriaMetrica);

        if (requiereTotal) {
          actualizado = actualizado.map((item) => {
            if (normalizarClaveMetrica(item?.clave) !== CLAVE_TOTAL_ASISTENTES) {
              return item;
            }

            if (item.habilitado) {
              return item;
            }

            return {
              ...item,
              habilitado: true,
              obligatorio: false
            };
          });
        }
      }

      if (metricaEditada && campo === 'habilitado') {
        const slugProcedencia = slugProcedenciaDesdeClaveMetrica(metricaEditada.clave);
        if (slugProcedencia) {
          actualizado = sincronizarGrupoMetricasProcedencia(
            actualizado,
            slugProcedencia,
            !!metricaEditada.habilitado
          );
          setProcedencias((prevProcedencias) => sincronizarProcedenciasPorSlug(
            prevProcedencias,
            slugProcedencia,
            !!metricaEditada.habilitado
          ));
        }
      }

      return actualizado;
    });
  }, []);

  const agregarMetrica = useCallback(() => {
    const uiId = generarUiId('metrica');
    let limiteAlcanzado = false;
    setMetricas((prev) => {
      const adicionalesActuales = contarMetricasAdicionales(prev);
      if (adicionalesActuales >= MAX_METRICAS_ADICIONALES) {
        limiteAlcanzado = true;
        return prev;
      }

      return [
        ...prev,
        {
          ui_id: uiId,
          clave: obtenerSiguienteClaveMetrica(prev),
          etiqueta: '',
          categoria: 'adicionales',
          habilitado: true,
          obligatorio: false,
          es_fija: false
        }
      ];
    });

    if (limiteAlcanzado) {
      notificarError(`Solo se permiten hasta ${MAX_METRICAS_ADICIONALES} mÃ©tricas adicionales.`);
      return null;
    }

    return uiId;
  }, []);

  const eliminarMetrica = useCallback((index) => {
    setMetricas((prev) => {
      if (prev[index]?.es_fija) {
        return prev;
      }
      return prev.filter((_, idx) => idx !== index);
    });
  }, []);

  const guardarCultos = useCallback(async () => {
    const cultosPreparados = prepararCultosParaGuardar(cultos);
    const validacion = validarCultos(cultosPreparados);
    setErroresCultos(validacion);
    if (Object.keys(validacion).length > 0) {
      notificarError(validacion.general || 'Revise la configuraciÃ³n de cultos.');
      return false;
    }

    setGuardandoCultos(true);
    try {
      const payload = {
        cultos: cultosPreparados.map((item) => ({
          codigo: item.codigo,
          nombre: item.nombre.trim(),
          dia_semana: item.dia_semana,
          hora_inicio: `${item.hora_inicio}:00`,
          activo: !!item.activo,
          orden: item.orden
        }))
      };
      const res = await setupApi.guardarCultos(payload);
      if (res?.exito && res?.datos) {
        setCultos(cultosPreparados);
        setCultosBase(clonarLista(cultosPreparados));
        setFirmaCultosBase(firmarCultos(cultosPreparados));
        aplicarDetalleSetup(res.datos);
        setErroresCultos({});
        notificarExito(res.mensaje || 'Cultos guardados correctamente.');
        return true;
      }
      notificarError(res?.mensaje || 'No se pudieron guardar los cultos.');
      return false;
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudieron guardar los cultos.');
      return false;
    } finally {
      setGuardandoCultos(false);
    }
  }, [cultos, aplicarDetalleSetup]);

  const guardarProcedencias = useCallback(async () => {
    const procedenciasPreparadas = prepararProcedenciasParaGuardar(procedencias);
    const validacion = validarProcedencias(procedenciasPreparadas);
    setErroresProcedencias(validacion);
    if (Object.keys(validacion).length > 0) {
      notificarError(validacion.general || 'Revise la configuraciÃ³n de procedencias.');
      return false;
    }

    setGuardandoProcedencias(true);
    try {
      const payload = {
        procedencias: procedenciasPreparadas.map((item) => ({
          nombre: item.nombre.trim(),
          activo: !!item.activo,
          orden: item.orden
        }))
      };
      const res = await setupApi.guardarProcedencias(payload);
      if (res?.exito && res?.datos) {
        setProcedencias(clonarLista(procedenciasPreparadas));
        setProcedenciasBase(clonarLista(procedenciasPreparadas));
        setFirmaProcedenciasBase(firmarProcedencias(procedenciasPreparadas));
        aplicarDetalleSetup(res.datos);
        setErroresProcedencias({});
        notificarExito(res.mensaje || 'Procedencias guardadas correctamente.');
        return true;
      }
      notificarError(res?.mensaje || 'No se pudieron guardar las procedencias.');
      return false;
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudieron guardar las procedencias.');
      return false;
    } finally {
      setGuardandoProcedencias(false);
    }
  }, [procedencias, aplicarDetalleSetup]);

  const guardarMetricas = useCallback(async () => {
    const metricasPreparadas = prepararMetricasParaGuardar(metricas);
    const procedenciasPreparadas = prepararProcedenciasParaGuardar(procedencias);
    const requiereSincronizarProcedencias =
      firmarProcedencias(procedenciasPreparadas) !== firmaProcedenciasBase;
    const validacion = validarMetricasConfiguracion(metricasPreparadas);
    setErroresMetricas(validacion);
    if (Object.keys(validacion).length > 0) {
      notificarError(validacion.general || 'Revise la configuraciÃ³n de mÃ©tricas.');
      return false;
    }

    setGuardandoMetricas(true);
    try {
      const payload = {
        metricas: metricasPreparadas.map((item) => ({
          clave: item.clave,
          etiqueta: item.etiqueta.trim(),
          categoria: normalizarCategoriaMetrica(item.categoria, item.clave),
          habilitado: !!item.habilitado,
          obligatorio: false
        }))
      };
      const res = await setupApi.guardarMetricas(payload);
      if (res?.exito && res?.datos) {
        let detalleActualizado = res.datos;

        if (requiereSincronizarProcedencias) {
          const payloadProcedencias = {
            procedencias: procedenciasPreparadas.map((item) => ({
              nombre: item.nombre.trim(),
              activo: !!item.activo,
              orden: item.orden
            }))
          };

          const resProcedencias = await setupApi.guardarProcedencias(payloadProcedencias);
          if (!(resProcedencias?.exito && resProcedencias?.datos)) {
            notificarError(resProcedencias?.mensaje || 'No se pudieron sincronizar las procedencias.');
            return false;
          }

          detalleActualizado = resProcedencias.datos;
          setProcedencias(clonarLista(procedenciasPreparadas));
          setProcedenciasBase(clonarLista(procedenciasPreparadas));
          setFirmaProcedenciasBase(firmarProcedencias(procedenciasPreparadas));
        }

        setMetricas(clonarLista(metricasPreparadas));
        setMetricasBase(clonarLista(metricasPreparadas));
        setFirmaMetricasBase(firmarMetricas(metricasPreparadas));
        aplicarDetalleSetup(detalleActualizado);
        setErroresMetricas({});
        notificarExito(res.mensaje || 'MÃ©tricas guardadas correctamente.');
        return true;
      }
      notificarError(
        normalizarMensajeMetricasUsuarioFinal(res?.mensaje) || 'No se pudieron guardar las mÃ©tricas.'
      );
      return false;
    } catch (error) {
      notificarError(
        normalizarMensajeMetricasUsuarioFinal(error?.mensaje) || 'No se pudieron guardar las mÃ©tricas.'
      );
      return false;
    } finally {
      setGuardandoMetricas(false);
    }
  }, [metricas, procedencias, firmaProcedenciasBase, aplicarDetalleSetup]);

  const finalizarSetup = useCallback(async () => {
    setFinalizando(true);
    try {
      const res = await setupApi.finalizar();
      if (res?.exito && res?.datos) {
        aplicarDetalleSetup(res.datos);
        await recargarEstadoSetup({ silencioso: true });
        notificarExito(res.mensaje || 'Setup completado correctamente.');
        return true;
      }
      notificarError(res?.mensaje || 'No se pudo finalizar el setup.');
      return false;
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo finalizar el setup.');
      return false;
    } finally {
      setFinalizando(false);
    }
  }, [aplicarDetalleSetup, recargarEstadoSetup]);

  const resumen = useMemo(() => ({
    estado_setup: detalle?.estado_setup || 'PENDIENTE',
    bloqueada_operacion: toBool(detalle?.bloqueada_operacion),
    setup_completado_en: detalle?.setup_completado_en || null,
    ultima_revision_en: detalle?.ultima_revision_en || null,
    admins_definitivos_activos: Number(detalle?.resumen?.admins_definitivos_activos || 0),
    faltantes: Array.isArray(faltantes) ? faltantes : []
  }), [detalle, faltantes]);

  const tieneCambiosCultos = useMemo(
    () => firmarCultos(cultos) !== firmaCultosBase,
    [cultos, firmaCultosBase]
  );
  const tieneCambiosProcedencias = useMemo(
    () => firmarProcedencias(procedencias) !== firmaProcedenciasBase,
    [procedencias, firmaProcedenciasBase]
  );
  const tieneCambiosMetricas = useMemo(
    () => firmarMetricas(metricas) !== firmaMetricasBase,
    [metricas, firmaMetricasBase]
  );
  const metricasAdicionalesCount = useMemo(
    () => contarMetricasAdicionales(metricas),
    [metricas]
  );
  const puedeAgregarMetrica = metricasAdicionalesCount < MAX_METRICAS_ADICIONALES;

  const restaurarCultos = useCallback(() => {
    setCultos(clonarLista(cultosBase));
    setErroresCultos({});
  }, [cultosBase]);

  const restaurarProcedencias = useCallback(() => {
    setProcedencias(clonarLista(procedenciasBase));
    setErroresProcedencias({});
  }, [procedenciasBase]);

  const restaurarMetricas = useCallback(() => {
    setMetricas(clonarLista(metricasBase));
    setErroresMetricas({});
  }, [metricasBase]);

  return {
    cultos,
    procedencias,
    metricas,
    erroresCultos,
    erroresProcedencias,
    erroresMetricas,
    guardandoCultos,
    guardandoProcedencias,
    guardandoMetricas,
    finalizando,
    tieneCambiosCultos,
    tieneCambiosProcedencias,
    tieneCambiosMetricas,
    metricasAdicionalesCount,
    maxMetricasAdicionales: MAX_METRICAS_ADICIONALES,
    puedeAgregarMetrica,
    restaurarCultos,
    restaurarProcedencias,
    restaurarMetricas,
    resumen,
    DIA_OPCIONES,
    cambiarCulto,
    agregarCulto,
    eliminarCulto,
    cambiarProcedencia,
    agregarProcedencia,
    eliminarProcedencia,
    cambiarMetrica,
    agregarMetrica,
    eliminarMetrica,
    guardarCultos,
    guardarProcedencias,
    guardarMetricas,
    finalizarSetup
  };
}

