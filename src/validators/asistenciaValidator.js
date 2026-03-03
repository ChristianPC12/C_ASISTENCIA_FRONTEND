import { aEnteroPositivo } from '../utils/sanitizer';

/** Limite de caracteres para observaciones */
export const OBSERVACIONES_MAX = 100;

/**
 * Orden de campos para determinar cual enfocar primero ante errores.
 * Debe coincidir con el orden visual del formulario.
 */
const ORDEN_CAMPOS = [
  'culto_id', 'fecha',
  'llegaron_antes_hora', 'llegaron_despues_hora',
  'proc_barrio', 'proc_guayabo',
  'ninos', 'jovenes',
  'total_asistentes',
  'visitas_barrio', 'visitas_guayabo',
  'retiros_antes_terminar', 'se_quedaron_todo',
  'observaciones'
];

/**
 * Valida el formulario de asistencia
 * @param {Object} datos - Datos del formulario
 * @returns {{ valido: boolean, errores: Object, primerCampoError: string|null }}
 */
export function validarAsistencia(datos) {
  const errores = {};

  // Culto obligatorio
  if (!datos.culto_id) {
    errores.culto_id = 'Debe seleccionar un culto.';
  }

  // Fecha obligatoria
  if (!datos.fecha) {
    errores.fecha = 'La fecha es obligatoria.';
  }

  // ── Campos obligatorios (deben tener un valor >= 0) ────────────────
  const camposObligatorios = [
    { campo: 'llegaron_antes_hora', etiqueta: 'Llegaron antes de la hora' },
    { campo: 'llegaron_despues_hora', etiqueta: 'Llegaron después de la hora' },
    { campo: 'proc_barrio', etiqueta: 'Procedentes del barrio' },
    { campo: 'proc_guayabo', etiqueta: 'Procedentes de Guayabo' }
  ];

  for (const { campo, etiqueta } of camposObligatorios) {
    const valorRaw = datos[campo];
    if (valorRaw === '' || valorRaw === null || valorRaw === undefined) {
      errores[campo] = `${etiqueta} es obligatorio.`;
    } else {
      const num = parseInt(valorRaw, 10);
      if (isNaN(num) || num < 0) {
        errores[campo] = `${etiqueta} debe ser un número válido (>= 0).`;
      }
    }
  }

  // ── Campos opcionales (si se escriben deben ser >= 0) ─────────────
  const camposOpcionales = [
    { campo: 'ninos', etiqueta: 'Niños' },
    { campo: 'jovenes', etiqueta: 'Jóvenes' },
    { campo: 'total_asistentes', etiqueta: 'Total de asistentes' },
    { campo: 'visitas_barrio', etiqueta: 'Visitas del barrio' },
    { campo: 'visitas_guayabo', etiqueta: 'Visitas de Guayabo' },
    { campo: 'retiros_antes_terminar', etiqueta: 'Retiros antes de terminar' },
    { campo: 'se_quedaron_todo', etiqueta: 'Se quedaron todo el culto' }
  ];

  for (const { campo, etiqueta } of camposOpcionales) {
    const valorRaw = datos[campo];
    if (valorRaw !== '' && valorRaw !== null && valorRaw !== undefined) {
      const num = parseInt(valorRaw, 10);
      if (isNaN(num) || num < 0) {
        errores[campo] = `${etiqueta} debe ser un número válido (>= 0).`;
      }
    }
  }

  // Validacion: total_asistentes >= ninos + jovenes
  const total = aEnteroPositivo(datos.total_asistentes);
  const ninos = aEnteroPositivo(datos.ninos);
  const jovenes = aEnteroPositivo(datos.jovenes);
  if (total < ninos + jovenes) {
    errores.total_asistentes = 'El total de asistentes debe ser mayor o igual a niños + jóvenes.';
  }

  // Validacion: retiros + se_quedaron <= total_asistentes
  const retiros = aEnteroPositivo(datos.retiros_antes_terminar);
  const seQuedaron = aEnteroPositivo(datos.se_quedaron_todo);
  if (retiros + seQuedaron > total) {
    errores.se_quedaron_todo = 'Retiros + Se quedaron no puede superar el total de asistentes.';
  }

  // Observaciones: limite de caracteres
  if (datos.observaciones && datos.observaciones.length > OBSERVACIONES_MAX) {
    errores.observaciones = `Las observaciones no deben superar los ${OBSERVACIONES_MAX} caracteres.`;
  }

  // Determinar primer campo con error segun orden visual
  const primerCampoError = ORDEN_CAMPOS.find(c => errores[c]) || null;

  return {
    valido: Object.keys(errores).length === 0,
    errores,
    primerCampoError
  };
}
