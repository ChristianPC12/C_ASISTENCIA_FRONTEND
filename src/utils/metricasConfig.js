const REGLA_AMBOS_O_NINGUNO = 'AMBOS_O_NINGUNO';
const REGLA_SI_MAYOR_CERO = 'SI_MAYOR_CERO';

function toBool(valor) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'number') return valor === 1;
  if (typeof valor === 'string') {
    const normalizado = valor.trim().toLowerCase();
    return ['1', 'true', 'on', 'yes', 'si'].includes(normalizado);
  }
  return false;
}

function toInt(valor, fallback = 0) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? Math.trunc(numero) : fallback;
}

function normalizarTexto(valor, fallback = '') {
  if (typeof valor !== 'string') return fallback;
  const limpio = valor.trim();
  return limpio || fallback;
}

export const METRICAS_FALLBACK = [
  { clave: 'llegaron_antes_hora', etiqueta: 'Llegaron antes de la hora', habilitado: true, obligatorio: true, orden: 10 },
  { clave: 'llegaron_despues_hora', etiqueta: 'Llegaron despues de la hora', habilitado: true, obligatorio: true, orden: 20 },
  { clave: 'ninos', etiqueta: 'Ninos', habilitado: true, obligatorio: true, orden: 30 },
  { clave: 'jovenes', etiqueta: 'Jovenes', habilitado: true, obligatorio: true, orden: 40 },
  { clave: 'total_asistentes', etiqueta: 'Total de asistentes', habilitado: true, obligatorio: true, orden: 50 },
  { clave: 'proc_barrio', etiqueta: 'Procedencia Barrio', habilitado: true, obligatorio: true, orden: 60 },
  { clave: 'proc_guayabo', etiqueta: 'Procedencia Guayabo', habilitado: true, obligatorio: true, orden: 70 },
  { clave: 'visitas_barrio', etiqueta: 'Visitas Barrio', habilitado: true, obligatorio: false, orden: 80 },
  {
    clave: 'nombres_visitas_barrio',
    etiqueta: 'Nombres visitas Barrio',
    habilitado: true,
    obligatorio: false,
    depende_de_clave: 'visitas_barrio',
    regla_dependencia: REGLA_SI_MAYOR_CERO,
    orden: 90
  },
  { clave: 'visitas_guayabo', etiqueta: 'Visitas Guayabo', habilitado: true, obligatorio: false, orden: 100 },
  {
    clave: 'nombres_visitas_guayabo',
    etiqueta: 'Nombres visitas Guayabo',
    habilitado: true,
    obligatorio: false,
    depende_de_clave: 'visitas_guayabo',
    regla_dependencia: REGLA_SI_MAYOR_CERO,
    orden: 110
  },
  { clave: 'retiros_antes_terminar', etiqueta: 'Retiros antes de terminar', habilitado: true, obligatorio: true, orden: 120 },
  { clave: 'se_quedaron_todo', etiqueta: 'Se quedaron todo', habilitado: true, obligatorio: true, orden: 130 },
  { clave: 'observaciones', etiqueta: 'Observaciones', habilitado: true, obligatorio: false, orden: 140 }
];

export function tipoMetricaPorClave(clave) {
  const key = normalizarTexto(clave).toLowerCase();
  if (!key) return 'numero';
  if (key === 'observaciones' || key.startsWith('nombres_') || key.includes('observacion')) {
    return 'texto';
  }
  return 'numero';
}

export function seccionMetricaPorClave(clave) {
  const key = normalizarTexto(clave).toLowerCase();

  if (key === 'llegaron_antes_hora' || key === 'llegaron_despues_hora') return 'puntualidad';
  if (key === 'ninos' || key === 'jovenes') return 'composicion';
  if (key === 'total_asistentes') return 'total';
  if (key.startsWith('proc_')) return 'procedencia';
  if (key.startsWith('visitas_') || key.startsWith('nombres_visitas_')) return 'visitas';
  if (key === 'retiros_antes_terminar' || key === 'se_quedaron_todo') return 'permanencia';
  if (key === 'observaciones') return 'observaciones';
  return 'adicionales';
}

export const ETIQUETAS_SECCION = {
  puntualidad: 'Puntualidad',
  composicion: 'Composicion de asistentes',
  total: 'Total de asistentes',
  procedencia: 'Procedencia',
  visitas: 'Visitas',
  permanencia: 'Permanencia',
  observaciones: 'Observaciones',
  adicionales: 'Metricas adicionales'
};

export function normalizarMetricasConfig(metricasRaw) {
  const listaBase = Array.isArray(metricasRaw) && metricasRaw.length > 0
    ? metricasRaw
    : METRICAS_FALLBACK;

  return listaBase
    .map((item, index) => {
      const clave = normalizarTexto(item?.clave, '').toLowerCase();
      if (!clave) return null;

      const etiqueta = normalizarTexto(item?.etiqueta, clave);
      const dependeDeClave = normalizarTexto(item?.depende_de_clave, '').toLowerCase() || null;
      const reglaDependencia = normalizarTexto(item?.regla_dependencia, '').toUpperCase() || null;

      return {
        clave,
        etiqueta,
        habilitado: toBool(item?.habilitado ?? true),
        obligatorio: toBool(item?.obligatorio ?? false),
        depende_de_clave: dependeDeClave,
        regla_dependencia: reglaDependencia,
        orden: toInt(item?.orden, (index + 1) * 10),
        tipo: tipoMetricaPorClave(clave),
        seccion: seccionMetricaPorClave(clave)
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.orden - b.orden || a.clave.localeCompare(b.clave));
}

export function obtenerMetricasActivas(metricasRaw) {
  return normalizarMetricasConfig(metricasRaw).filter((item) => item.habilitado);
}

export function agruparMetricasPorSeccion(metricasActivas) {
  const grupos = {
    puntualidad: [],
    composicion: [],
    procedencia: [],
    visitas: [],
    permanencia: [],
    total: [],
    adicionales: [],
    observaciones: []
  };

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
        errores[metrica.clave] = `${metrica.etiqueta} debe ser un numero valido (>= 0).`;
      }
    }
  });

  metricasActivas.forEach((metrica) => {
    if (!metrica.depende_de_clave || !metrica.regla_dependencia) return;

    const padre = porClave[metrica.depende_de_clave];
    if (!padre) return;

    const valorPadre = metricasFormulario?.[padre.clave];
    const valorHijo = metricasFormulario?.[metrica.clave];
    const padreVacio = valorPadre === '' || valorPadre === null || valorPadre === undefined;
    const hijoVacio = valorHijo === '' || valorHijo === null || valorHijo === undefined;

    if (metrica.regla_dependencia === REGLA_SI_MAYOR_CERO) {
      const numeroPadre = Number(valorPadre || 0);
      if (Number.isFinite(numeroPadre) && numeroPadre > 0 && hijoVacio) {
        errores[metrica.clave] = `${metrica.etiqueta} es obligatorio cuando ${padre.etiqueta} es mayor a cero.`;
      }
    }

    if (metrica.regla_dependencia === REGLA_AMBOS_O_NINGUNO && padreVacio !== hijoVacio) {
      errores[metrica.clave] = `${padre.etiqueta} y ${metrica.etiqueta} deben completarse ambos o ninguno.`;
    }
  });

  return errores;
}
