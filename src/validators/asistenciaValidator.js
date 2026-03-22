import { aEnteroPositivo } from '../utils/sanitizer';
import { METRICAS_FALLBACK, obtenerMetricasActivas, validarDependenciasMetricas } from '../utils/metricasConfig';

/** Limite de caracteres para observaciones */
export const OBSERVACIONES_MAX = 60;

/** Limite general de metricas de texto diferentes a observaciones */
const METRICA_TEXTO_MAX = 1000;

function esVacio(valor) {
  return valor === '' || valor === null || valor === undefined;
}

function resolverMetricasActivas(metricasActivas) {
  if (Array.isArray(metricasActivas) && metricasActivas.length > 0) {
    return metricasActivas;
  }

  return obtenerMetricasActivas(METRICAS_FALLBACK);
}

function construirOrdenCampos(metricasActivas) {
  return [
    'culto_id',
    'fecha',
    ...metricasActivas.map((item) => item.clave)
  ];
}

/**
 * Valida el formulario de asistencia dinamico
 *
 * @param {Object} datos
 * @param {Object} opciones
 * @param {Array} opciones.metricasActivas
 * @returns {{ valido: boolean, errores: Object, primerCampoError: string|null }}
 */
export function validarAsistencia(datos, opciones = {}) {
  const errores = {};
  const metricasActivas = resolverMetricasActivas(opciones.metricasActivas);
  const metricasFormulario = datos?.metricas || {};

  if (!datos?.culto_id) {
    errores.culto_id = 'Debe seleccionar un culto.';
  }

  if (!datos?.fecha) {
    errores.fecha = 'La fecha es obligatoria.';
  }

  metricasActivas.forEach((metrica) => {
    const clave = metrica.clave;
    const etiqueta = metrica.etiqueta || clave;
    const valorRaw = metricasFormulario?.[clave];

    if (metrica.obligatorio && esVacio(valorRaw)) {
      errores[clave] = `${etiqueta} es obligatorio.`;
      return;
    }

    if (metrica.tipo === 'numero' && !esVacio(valorRaw)) {
      const numero = Number(valorRaw);
      if (!Number.isFinite(numero) || numero < 0) {
        errores[clave] = `${etiqueta} debe ser un numero valido (>= 0).`;
      }
    }

    if (metrica.tipo === 'texto' && !esVacio(valorRaw)) {
      const limiteTexto = clave === 'observaciones' ? OBSERVACIONES_MAX : METRICA_TEXTO_MAX;
      if (String(valorRaw).length > limiteTexto) {
        errores[clave] = `${etiqueta} no debe superar ${limiteTexto} caracteres.`;
      }
    }
  });

  Object.assign(errores, validarDependenciasMetricas(metricasActivas, metricasFormulario));

  const ordenCampos = construirOrdenCampos(metricasActivas);
  const primerCampoError = ordenCampos.find((campo) => errores[campo]) || null;

  return {
    valido: Object.keys(errores).length === 0,
    errores,
    primerCampoError
  };
}
