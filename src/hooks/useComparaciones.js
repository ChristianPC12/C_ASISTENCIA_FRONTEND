import { useCallback, useEffect, useMemo, useState } from 'react';
import asistenciaApi from '../api/asistenciaApi';
import cultoApi from '../api/cultoApi';
import { ANIO_ACTUAL, MES_OPCIONES } from '../config/constants';
import { notificarError } from '../utils/notify';

const ESTADISTICAS_VACIAS = {
  resumen_general: {
    total_cultos_registrados: 0,
    total_asistentes: 0,
    promedio_por_culto: 0,
    maximo_asistentes: 0,
    minimo_asistentes: 0
  },
  composicion_asistentes: {
    ninos: { cantidad: 0, porcentaje: 0 },
    jovenes: { cantidad: 0, porcentaje: 0 }
  },
  puntualidad: {
    antes: { cantidad: 0, porcentaje: 0 },
    despues: { cantidad: 0, porcentaje: 0 }
  },
  procedencia: {
    barrio: { cantidad: 0, porcentaje: 0 },
    guayabo: { cantidad: 0, porcentaje: 0 }
  },
  visitas: {
    total_visitas: 0,
    barrio: { cantidad: 0, porcentaje: 0 },
    guayabo: { cantidad: 0, porcentaje: 0 },
    top_nombres: []
  },
  series: {
    asistencia_por_fecha: []
  },
  resumen_condensado: ''
};

const MAPA_MESES = Object.fromEntries(
  MES_OPCIONES.map((item) => [String(item.valor), item.etiqueta])
);

const DEFINICIONES_INDICADORES = [
  {
    id: 'total_asistentes',
    etiqueta: 'Total asistentes',
    unidad: 'entero',
    obtener: (stats) => Number(stats?.resumen_general?.total_asistentes || 0)
  },
  {
    id: 'promedio_por_culto',
    etiqueta: 'Promedio por culto',
    unidad: 'decimal',
    obtener: (stats) => Number(stats?.resumen_general?.promedio_por_culto || 0)
  },
  {
    id: 'maximo_asistentes',
    etiqueta: 'Maximo asistentes',
    unidad: 'entero',
    obtener: (stats) => Number(stats?.resumen_general?.maximo_asistentes || 0)
  },
  {
    id: 'minimo_asistentes',
    etiqueta: 'Minimo asistentes',
    unidad: 'entero',
    obtener: (stats) => Number(stats?.resumen_general?.minimo_asistentes || 0)
  },
  {
    id: 'total_visitas',
    etiqueta: 'Total visitas',
    unidad: 'entero',
    obtener: (stats) => Number(stats?.visitas?.total_visitas || 0)
  },
  {
    id: 'ninos_porcentaje',
    etiqueta: 'Ninos (%)',
    unidad: 'porcentaje',
    obtener: (stats) => Number(stats?.composicion_asistentes?.ninos?.porcentaje || 0)
  },
  {
    id: 'jovenes_porcentaje',
    etiqueta: 'Jovenes (%)',
    unidad: 'porcentaje',
    obtener: (stats) => Number(stats?.composicion_asistentes?.jovenes?.porcentaje || 0)
  },
  {
    id: 'puntualidad_antes',
    etiqueta: 'Temprano (%)',
    unidad: 'porcentaje',
    obtener: (stats) => Number(stats?.puntualidad?.antes?.porcentaje || 0)
  },
  {
    id: 'puntualidad_despues',
    etiqueta: 'Tarde (%)',
    unidad: 'porcentaje',
    obtener: (stats) => Number(stats?.puntualidad?.despues?.porcentaje || 0)
  },
  {
    id: 'procedencia_barrio',
    etiqueta: 'Barrio (%)',
    unidad: 'porcentaje',
    obtener: (stats) => Number(stats?.procedencia?.barrio?.porcentaje || 0)
  },
  {
    id: 'procedencia_guayabo',
    etiqueta: 'Guayabo (%)',
    unidad: 'porcentaje',
    obtener: (stats) => Number(stats?.procedencia?.guayabo?.porcentaje || 0)
  }
];

function formatearNombreCulto(nombre = '', codigo = '') {
  const valor = nombre || codigo || '';
  return valor
    .replace(/Sabado/gi, 'Sabado')
    .replace(/Miercoles/gi, 'Miercoles');
}

function obtenerPeriodosIniciales() {
  const hoy = new Date();
  const mesActual = hoy.getMonth() + 1;
  const anioActual = hoy.getFullYear();

  let mesAnterior = mesActual - 1;
  let anioAnterior = anioActual;

  if (mesAnterior <= 0) {
    mesAnterior = 12;
    anioAnterior -= 1;
  }

  return {
    anioA: String(anioAnterior),
    mesA: String(mesAnterior),
    anioB: String(anioActual),
    mesB: String(mesActual)
  };
}

function calcularVariacion(base, comparado) {
  if (Number(base) === 0) return null;
  return ((Number(comparado) - Number(base)) / Number(base)) * 100;
}

function construirTopNombresComparados(periodoA, periodoB) {
  const mapa = new Map();
  const listaA = periodoA?.visitas?.top_nombres || [];
  const listaB = periodoB?.visitas?.top_nombres || [];

  listaA.forEach((item) => {
    mapa.set(item.nombre, {
      nombre: item.nombre,
      cantidadA: Number(item.cantidad || 0),
      cantidadB: 0
    });
  });

  listaB.forEach((item) => {
    const actual = mapa.get(item.nombre) || {
      nombre: item.nombre,
      cantidadA: 0,
      cantidadB: 0
    };
    actual.cantidadB = Number(item.cantidad || 0);
    mapa.set(item.nombre, actual);
  });

  return Array.from(mapa.values())
    .map((item) => ({
      ...item,
      diferencia: item.cantidadB - item.cantidadA
    }))
    .sort((a, b) => (b.cantidadA + b.cantidadB) - (a.cantidadA + a.cantidadB) || a.nombre.localeCompare(b.nombre))
    .slice(0, 10);
}

export function useComparaciones() {
  const inicial = obtenerPeriodosIniciales();

  const [cultos, setCultos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [periodoA, setPeriodoA] = useState(ESTADISTICAS_VACIAS);
  const [periodoB, setPeriodoB] = useState(ESTADISTICAS_VACIAS);
  const [filtros, setFiltros] = useState({
    culto: '',
    anioA: inicial.anioA,
    mesA: inicial.mesA,
    anioB: inicial.anioB,
    mesB: inicial.mesB
  });

  const cargarCultos = useCallback(async () => {
    try {
      const res = await cultoApi.listar();
      if (!res.exito) return;

      const lista = res.datos || [];
      setCultos(lista);
      setFiltros((prev) => {
        if (prev.culto || lista.length === 0) return prev;
        return { ...prev, culto: lista[0].codigo };
      });
    } catch {
      notificarError('No se pudieron cargar los cultos para comparar.');
    }
  }, []);

  const cargarComparacion = useCallback(async () => {
    if (!filtros.culto || !filtros.anioA || !filtros.mesA || !filtros.anioB || !filtros.mesB) {
      return;
    }

    setCargando(true);
    try {
      const paramsA = {
        culto: filtros.culto,
        anio: filtros.anioA,
        mes: filtros.mesA
      };

      const paramsB = {
        culto: filtros.culto,
        anio: filtros.anioB,
        mes: filtros.mesB
      };

      const [resA, resB] = await Promise.all([
        asistenciaApi.obtenerEstadisticas(paramsA),
        asistenciaApi.obtenerEstadisticas(paramsB)
      ]);

      setPeriodoA(resA?.exito ? (resA.datos || ESTADISTICAS_VACIAS) : ESTADISTICAS_VACIAS);
      setPeriodoB(resB?.exito ? (resB.datos || ESTADISTICAS_VACIAS) : ESTADISTICAS_VACIAS);

      if (!resA?.exito || !resB?.exito) {
        notificarError(resA?.mensaje || resB?.mensaje || 'No fue posible cargar la comparacion.');
      }
    } catch (error) {
      setPeriodoA(ESTADISTICAS_VACIAS);
      setPeriodoB(ESTADISTICAS_VACIAS);
      notificarError(error?.mensaje || 'No fue posible cargar la comparacion entre meses.');
    } finally {
      setCargando(false);
    }
  }, [filtros.anioA, filtros.anioB, filtros.culto, filtros.mesA, filtros.mesB]);

  useEffect(() => {
    cargarCultos();
  }, [cargarCultos]);

  useEffect(() => {
    cargarComparacion();
  }, [cargarComparacion]);

  const cambiarFiltro = useCallback((campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }, []);

  const etiquetaPeriodoA = useMemo(() => {
    const etiquetaMes = MAPA_MESES[String(filtros.mesA)] || 'Mes';
    return `${etiquetaMes} ${filtros.anioA || ANIO_ACTUAL}`;
  }, [filtros.anioA, filtros.mesA]);

  const etiquetaPeriodoB = useMemo(() => {
    const etiquetaMes = MAPA_MESES[String(filtros.mesB)] || 'Mes';
    return `${etiquetaMes} ${filtros.anioB || ANIO_ACTUAL}`;
  }, [filtros.anioB, filtros.mesB]);

  const cultoSeleccionado = useMemo(() => {
    const item = cultos.find((culto) => culto.codigo === filtros.culto);
    if (!item) return '';
    return formatearNombreCulto(item.nombre, item.codigo);
  }, [cultos, filtros.culto]);

  const indicadores = useMemo(() => {
    return DEFINICIONES_INDICADORES.map((definicion) => {
      const valorA = definicion.obtener(periodoA);
      const valorB = definicion.obtener(periodoB);
      const diferencia = valorB - valorA;
      const variacion = calcularVariacion(valorA, valorB);
      const cambioTipo = diferencia > 0 ? 'sube' : diferencia < 0 ? 'baja' : 'igual';

      return {
        id: definicion.id,
        etiqueta: definicion.etiqueta,
        unidad: definicion.unidad,
        valorA,
        valorB,
        diferencia,
        variacion,
        cambioTipo
      };
    });
  }, [periodoA, periodoB]);

  const topNombresComparados = useMemo(() => {
    return construirTopNombresComparados(periodoA, periodoB);
  }, [periodoA, periodoB]);

  return {
    cultos,
    cargando,
    filtros,
    periodoA,
    periodoB,
    indicadores,
    topNombresComparados,
    etiquetaPeriodoA,
    etiquetaPeriodoB,
    cultoSeleccionado,
    cambiarFiltro
  };
}
