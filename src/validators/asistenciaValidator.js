import { aEnteroPositivo } from '../utils/sanitizer';

/**
 * Valida el formulario de asistencia
 * @param {Object} datos - Datos del formulario
 * @returns {{ valido: boolean, errores: Object }}
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

  // Campos numericos obligatorios (>= 0)
  const camposNumericos = [
    { campo: 'llegaron_antes_hora', etiqueta: 'Llegaron antes de la hora' },
    { campo: 'llegaron_despues_hora', etiqueta: 'Llegaron después de la hora' },
    { campo: 'ninos', etiqueta: 'Niños' },
    { campo: 'jovenes', etiqueta: 'Jóvenes' },
    { campo: 'total_asistentes', etiqueta: 'Total de asistentes' },
    { campo: 'proc_barrio', etiqueta: 'Procedentes del barrio' },
    { campo: 'proc_guayabo', etiqueta: 'Procedentes de Guayabo' },
    { campo: 'visitas_barrio', etiqueta: 'Visitas del barrio' },
    { campo: 'visitas_guayabo', etiqueta: 'Visitas de Guayabo' },
    { campo: 'retiros_antes_terminar', etiqueta: 'Retiros antes de terminar' },
    { campo: 'se_quedaron_todo', etiqueta: 'Se quedaron todo el culto' }
  ];

  for (const { campo, etiqueta } of camposNumericos) {
    const valorRaw = datos[campo];
    // Permitir vacios (se tratan como 0) pero rechazar negativos o texto no numerico
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

  return {
    valido: Object.keys(errores).length === 0,
    errores
  };
}
