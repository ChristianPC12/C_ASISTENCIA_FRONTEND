const CATEGORIAS_VALIDAS = [
  'informacion_culto',
  'composicion_asistentes',
  'procedencia',
  'visitas',
  'permanencia',
  'total_asistentes',
  'observaciones',
  'adicionales'
];

export const CATEGORIAS_METRICA_ORDEN = [
  'informacion_culto',
  'composicion_asistentes',
  'procedencia',
  'visitas',
  'permanencia',
  'total_asistentes',
  'adicionales',
  'observaciones'
];

export const ETIQUETAS_SECCION = {
  informacion_culto: 'Información del culto',
  composicion_asistentes: 'Composición de asistentes',
  procedencia: 'Procedencia',
  visitas: 'Visitas',
  permanencia: 'Permanencia',
  total_asistentes: 'Total de asistentes',
  observaciones: 'Observaciones',
  adicionales: 'Métricas adicionales'
};

export const CATEGORIAS_METRICA_OPCIONES = CATEGORIAS_METRICA_ORDEN.map((valor) => ({
  valor,
  etiqueta: ETIQUETAS_SECCION[valor] || valor
}));

function toBool(valor) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'number') return valor === 1;
  if (typeof valor === 'string') {
    const normalizado = valor.trim().toLowerCase();
    return ['1', 'true', 'on', 'yes', 'si', 'sí'].includes(normalizado);
  }
  return false;
}

function normalizarTexto(valor, fallback = '') {
  if (typeof valor !== 'string') return fallback;
  const limpio = valor.trim();
  return limpio || fallback;
}

function normalizarCategoria(categoriaRaw, clave = '') {
  const categoria = normalizarTexto(categoriaRaw, '').toLowerCase();
  if (CATEGORIAS_VALIDAS.includes(categoria)) {
    return categoria;
  }

  return inferirCategoriaPorClave(clave);
}

export function tipoMetricaPorClave(clave) {
  const key = normalizarTexto(clave).toLowerCase();
  if (!key) return 'numero';
  if (key === 'observaciones' || key.startsWith('nombres_') || key.includes('observacion')) {
    return 'texto';
  }
  return 'numero';
}

export function inferirCategoriaPorClave(clave) {
  const key = normalizarTexto(clave).toLowerCase();

  if (key === 'llegaron_antes_hora' || key === 'llegaron_despues_hora') return 'informacion_culto';
  if (key === 'ninos' || key === 'jovenes') return 'composicion_asistentes';
  if (key === 'total_asistentes') return 'total_asistentes';
  if (key.startsWith('proc_')) return 'procedencia';
  if (key.startsWith('visitas_') || key.startsWith('nombres_visitas_')) return 'visitas';
  if (key === 'retiros_antes_terminar' || key === 'se_quedaron_todo') return 'permanencia';
  if (key === 'observaciones') return 'observaciones';

  return 'adicionales';
}

export const METRICAS_FALLBACK = [
  { clave: 'llegaron_antes_hora', etiqueta: 'Llegaron antes de la hora', categoria: 'informacion_culto', habilitado: false, obligatorio: false },
  { clave: 'llegaron_despues_hora', etiqueta: 'Llegaron después de la hora', categoria: 'informacion_culto', habilitado: false, obligatorio: false },
  { clave: 'ninos', etiqueta: 'Niños', categoria: 'composicion_asistentes', habilitado: false, obligatorio: false },
  { clave: 'jovenes', etiqueta: 'Jóvenes', categoria: 'composicion_asistentes', habilitado: false, obligatorio: false },
  { clave: 'total_asistentes', etiqueta: 'Total de asistentes', categoria: 'total_asistentes', habilitado: false, obligatorio: false },
  { clave: 'proc_barrio', etiqueta: 'Procedencia del barrio', categoria: 'procedencia', habilitado: false, obligatorio: false },
  { clave: 'proc_guayabo', etiqueta: 'Procedencia de Guayabo', categoria: 'procedencia', habilitado: false, obligatorio: false },
  { clave: 'visitas_barrio', etiqueta: 'Visitas del barrio', categoria: 'visitas', habilitado: false, obligatorio: false },
  { clave: 'nombres_visitas_barrio', etiqueta: 'Nombres de visitas del barrio', categoria: 'visitas', habilitado: false, obligatorio: false },
  { clave: 'visitas_guayabo', etiqueta: 'Visitas de Guayabo', categoria: 'visitas', habilitado: false, obligatorio: false },
  { clave: 'nombres_visitas_guayabo', etiqueta: 'Nombres de visitas de Guayabo', categoria: 'visitas', habilitado: false, obligatorio: false },
  { clave: 'retiros_antes_terminar', etiqueta: 'Retiros antes de terminar', categoria: 'permanencia', habilitado: false, obligatorio: false },
  { clave: 'se_quedaron_todo', etiqueta: 'Se quedaron todo', categoria: 'permanencia', habilitado: false, obligatorio: false },
  { clave: 'observaciones', etiqueta: 'Observaciones', categoria: 'observaciones', habilitado: false, obligatorio: false }
];

function normalizarListaMetricas(listaRaw) {
  const salida = [];
  const clavesVistas = new Set();

  (Array.isArray(listaRaw) ? listaRaw : [])
    .forEach((item) => {
      const clave = normalizarTexto(item?.clave, '').toLowerCase();
      if (!clave || clavesVistas.has(clave)) return;

      const etiqueta = normalizarTexto(item?.etiqueta, clave);
      const categoria = normalizarCategoria(item?.categoria, clave);

      salida.push({
        clave,
        etiqueta,
        categoria,
        habilitado: toBool(item?.habilitado ?? true),
        obligatorio: toBool(item?.obligatorio ?? false),
        tipo: tipoMetricaPorClave(clave),
        seccion: categoria
      });

      clavesVistas.add(clave);
    });

  return salida;
}

export function normalizarMetricasConfig(metricasRaw) {
  const entradaNormalizada = normalizarListaMetricas(metricasRaw);
  const fallbackNormalizada = normalizarListaMetricas(METRICAS_FALLBACK);

  if (entradaNormalizada.length === 0) {
    return fallbackNormalizada.map((item, index) => ({
      ...item,
      posicion: index + 1
    }));
  }

  const entradaPorClave = new Map(entradaNormalizada.map((item) => [item.clave, item]));
  const clavesFallback = new Set(fallbackNormalizada.map((item) => item.clave));

  const resultado = fallbackNormalizada.map((base) => entradaPorClave.get(base.clave) || base);

  entradaNormalizada.forEach((item) => {
    if (!clavesFallback.has(item.clave)) {
      resultado.push(item);
    }
  });

  return resultado.map((item, index) => ({
    ...item,
    posicion: index + 1
  }));
}

export function obtenerMetricasActivas(metricasRaw) {
  return normalizarMetricasConfig(metricasRaw).filter((item) => item.habilitado);
}

export function agruparMetricasPorSeccion(metricasActivas) {
  const grupos = CATEGORIAS_METRICA_ORDEN.reduce((acc, categoria) => {
    acc[categoria] = [];
    return acc;
  }, {});

  metricasActivas.forEach((metrica) => {
    const seccion = metrica.seccion || 'adicionales';
    if (!grupos[seccion]) {
      grupos[seccion] = [];
    }
    grupos[seccion].push(metrica);
  });

  return grupos;
}

export function construirFormularioMetricas(metricasActivas, metricasPrevias = {}) {
  const salida = {};

  metricasActivas.forEach((metrica) => {
    const previo = metricasPrevias?.[metrica.clave];
    if (previo === null || previo === undefined) {
      salida[metrica.clave] = '';
      return;
    }

    if (metrica.tipo === 'numero') {
      if (typeof previo === 'number') {
        salida[metrica.clave] = String(Math.max(0, Math.trunc(previo)));
      } else if (typeof previo === 'string') {
        salida[metrica.clave] = previo.trim();
      } else {
        salida[metrica.clave] = '';
      }
      return;
    }

    salida[metrica.clave] = typeof previo === 'string' ? previo : String(previo);
  });

  return salida;
}

export function normalizarPayloadMetricas(metricasActivas, metricasFormulario) {
  const payload = {};

  metricasActivas.forEach((metrica) => {
    const valor = metricasFormulario?.[metrica.clave];
    if (metrica.tipo === 'numero') {
      if (valor === '' || valor === null || valor === undefined) {
        payload[metrica.clave] = null;
      } else {
        const numero = Number(valor);
        payload[metrica.clave] = Number.isFinite(numero) ? Math.max(0, Math.trunc(numero)) : null;
      }
      return;
    }

    payload[metrica.clave] = typeof valor === 'string' ? valor.trim() : (valor ?? null);
  });

  return payload;
}

export function obtenerMapaEtiquetasMetricas(metricasActivas) {
  return metricasActivas.reduce((acc, metrica) => {
    acc[metrica.clave] = metrica.etiqueta;
    return acc;
  }, {});
}

export function obtenerClaveTotalAsistentes(metricasActivas) {
  return metricasActivas.find((m) => m.clave === 'total_asistentes')?.clave || null;
}

export function obtenerParPuntualidad(metricasActivas) {
  const antes = metricasActivas.find((m) => m.clave === 'llegaron_antes_hora')?.clave || null;
  const despues = metricasActivas.find((m) => m.clave === 'llegaron_despues_hora')?.clave || null;
  return { antes, despues };
}

function contarNombresPorComa(valor = '') {
  return String(valor || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .length;
}

export function validarDependenciasMetricas(metricasActivas, metricasFormulario) {
  const errores = {};

  const porClave = metricasActivas.reduce((acc, metrica) => {
    acc[metrica.clave] = metrica;
    return acc;
  }, {});

  metricasActivas.forEach((metrica) => {
    const valor = metricasFormulario?.[metrica.clave];
    const vacio = valor === '' || valor === null || valor === undefined;

    if (metrica.obligatorio && vacio) {
      errores[metrica.clave] = `${metrica.etiqueta} es obligatorio.`;
      return;
    }

    if (metrica.tipo === 'numero' && !vacio) {
      const numero = Number(valor);
      if (!Number.isFinite(numero) || numero < 0) {
        errores[metrica.clave] = `${metrica.etiqueta} debe ser un número válido (>= 0).`;
      }
    }
  });

  const existeAntes = !!porClave.llegaron_antes_hora;
  const existeDespues = !!porClave.llegaron_despues_hora;
  const existeTotal = !!porClave.total_asistentes;

  if (existeAntes !== existeDespues) {
    errores.llegaron_antes_hora = 'Las métricas de puntualidad deben estar ambas habilitadas.';
    errores.llegaron_despues_hora = 'Las métricas de puntualidad deben estar ambas habilitadas.';
  }

  if (existeAntes && existeDespues) {
    const antes = Number(metricasFormulario?.llegaron_antes_hora ?? 0);
    const despues = Number(metricasFormulario?.llegaron_despues_hora ?? 0);
    const suma = (Number.isFinite(antes) ? Math.max(0, Math.trunc(antes)) : 0)
      + (Number.isFinite(despues) ? Math.max(0, Math.trunc(despues)) : 0);

    if (existeTotal) {
      const total = Number(metricasFormulario?.total_asistentes ?? 0);
      const totalNorm = Number.isFinite(total) ? Math.max(0, Math.trunc(total)) : 0;
      if (totalNorm !== suma) {
        errores.total_asistentes = 'Total de asistentes debe ser igual a antes + después de la hora.';
      }
    }
  } else if (existeTotal) {
    errores.total_asistentes = 'Total de asistentes requiere métricas de puntualidad habilitadas.';
  }

  Object.keys(porClave)
    .filter((clave) => clave.startsWith('visitas_'))
    .forEach((claveVisitas) => {
      const claveNombres = `nombres_${claveVisitas}`;
      if (!porClave[claveNombres]) return;

      const visitasRaw = Number(metricasFormulario?.[claveVisitas] ?? 0);
      const cantidadVisitas = Number.isFinite(visitasRaw) ? Math.max(0, Math.trunc(visitasRaw)) : 0;
      if (cantidadVisitas <= 0) return;

      const nombresTexto = String(metricasFormulario?.[claveNombres] ?? '').trim();
      const cantidadNombres = contarNombresPorComa(nombresTexto);

      if (cantidadNombres === 0) {
        errores[claveNombres] = `Debe indicar ${cantidadVisitas} nombre(s) separados por coma.`;
        return;
      }

      if (cantidadNombres !== cantidadVisitas) {
        errores[claveNombres] = `Debe indicar ${cantidadVisitas} nombre(s) separados por coma (actual: ${cantidadNombres}).`;
      }
    });

  return errores;
}
