import { useCallback, useEffect, useMemo, useState } from 'react';
import setupApi from '../api/setupApi';
import { notificarError, notificarExito } from '../utils/notify';
import { useSetupStatus } from './useSetupStatus';
import { METRICAS_FALLBACK, normalizarMetricasConfig } from '../utils/metricasConfig';

const CLAVES_PUNTUALIDAD = ['llegaron_antes_hora', 'llegaron_despues_hora'];
const DIA_OPCIONES = [
  { valor: 1, etiqueta: 'Domingo' },
  { valor: 2, etiqueta: 'Lunes' },
  { valor: 3, etiqueta: 'Martes' },
  { valor: 4, etiqueta: 'Miercoles' },
  { valor: 5, etiqueta: 'Jueves' },
  { valor: 6, etiqueta: 'Viernes' },
  { valor: 7, etiqueta: 'Sabado' }
];

const CULTOS_DEFAULT = [
  { codigo: 'SABADO', nombre: 'Culto Sabado', dia_semana: 7, hora_inicio: '09:00', activo: true, orden: 1 },
  { codigo: 'DOMINGO', nombre: 'Culto Domingo', dia_semana: 1, hora_inicio: '18:30', activo: true, orden: 2 },
  { codigo: 'MIERCOLES', nombre: 'Culto Miercoles', dia_semana: 4, hora_inicio: '18:30', activo: true, orden: 3 }
];

const PROCEDENCIAS_DEFAULT = [
  { nombre: 'Barrio', activo: true, orden: 1 },
  { nombre: 'Guayabo', activo: true, orden: 2 }
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
    return ['1', 'true', 'on', 'yes', 'si'].includes(valor.trim().toLowerCase());
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

function normalizarCultos(cultosRaw) {
  const lista = Array.isArray(cultosRaw) && cultosRaw.length > 0 ? cultosRaw : CULTOS_DEFAULT;
  return lista
    .map((item, idx) => ({
      ui_id: resolverUiId(item, 'culto', ['culto_id', 'id']),
      codigo: String(item?.codigo || '').trim().toUpperCase(),
      nombre: String(item?.nombre || '').trim(),
      dia_semana: toInt(item?.dia_semana, 1),
      hora_inicio: formatearHora(item?.hora_inicio),
      activo: toBool(item?.activo ?? true),
      orden: toInt(item?.orden, idx + 1)
    }))
    .filter((item) => item.codigo || item.nombre);
}

function normalizarProcedencias(procedenciasRaw) {
  const lista = Array.isArray(procedenciasRaw) && procedenciasRaw.length > 0
    ? procedenciasRaw
    : PROCEDENCIAS_DEFAULT;
  return lista.map((item, idx) => ({
    ui_id: resolverUiId(item, 'procedencia', ['procedencia_id', 'id']),
    nombre: String(item?.nombre || '').trim(),
    activo: toBool(item?.activo ?? true),
    orden: toInt(item?.orden, idx + 1)
  }));
}

function normalizarMetricas(metricasRaw) {
  const base = normalizarMetricasConfig(metricasRaw?.length ? metricasRaw : METRICAS_FALLBACK);
  return base.map((item, idx) => ({
    ui_id: resolverUiId(item, 'metrica', ['metrica_id', 'id']),
    clave: item.clave,
    etiqueta: item.etiqueta,
    habilitado: item.habilitado,
    obligatorio: item.obligatorio,
    depende_de_clave: item.depende_de_clave || '',
    regla_dependencia: item.regla_dependencia || '',
    orden: toInt(item.orden, (idx + 1) * 10)
  }));
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
      filaErrores.codigo = 'Codigo invalido (A-Z, 0-9 y guion bajo).';
    } else if (codigos.has(culto.codigo)) {
      filaErrores.codigo = 'Codigo duplicado.';
    } else {
      codigos.add(culto.codigo);
    }

    if ((culto.nombre || '').length < 3) {
      filaErrores.nombre = 'El nombre debe tener al menos 3 caracteres.';
    }

    if (!Number.isInteger(culto.dia_semana) || culto.dia_semana < 1 || culto.dia_semana > 7) {
      filaErrores.dia_semana = 'Dia invalido.';
    }

    if (!/^\d{2}:\d{2}$/.test(culto.hora_inicio || '')) {
      filaErrores.hora_inicio = 'Formato de hora invalido (HH:MM).';
    }

    if (!Number.isInteger(culto.orden) || culto.orden < 1 || culto.orden > 99) {
      filaErrores.orden = 'Orden invalido (1-99).';
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
      filaErrores.nombre = 'Nombre invalido (2-80).';
    } else if (nombres.has(nombreClave)) {
      filaErrores.nombre = 'Nombre duplicado.';
    } else {
      nombres.add(nombreClave);
    }

    if (!Number.isInteger(item.orden) || item.orden < 1 || item.orden > 99) {
      filaErrores.orden = 'Orden invalido (1-99).';
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

function validarMetricas(metricas) {
  const errores = {};
  const claves = new Set();
  const ordenes = new Set();
  let habilitadas = 0;
  let antes = null;
  let despues = null;

  if (!Array.isArray(metricas) || metricas.length < 1) {
    return { general: 'Debe configurar al menos una metrica.' };
  }

  metricas.forEach((item, idx) => {
    const key = `fila_${idx}`;
    const filaErrores = {};

    if (!/^[a-z0-9_]{2,80}$/.test(item.clave || '')) {
      filaErrores.clave = 'Clave invalida (a-z, 0-9 y guion bajo).';
    } else if (claves.has(item.clave)) {
      filaErrores.clave = 'Clave duplicada.';
    } else {
      claves.add(item.clave);
    }

    if ((item.etiqueta || '').trim().length < 2) {
      filaErrores.etiqueta = 'Etiqueta muy corta.';
    }

    if (!Number.isInteger(item.orden) || item.orden < 1 || item.orden > 999) {
      filaErrores.orden = 'Orden invalido (1-999).';
    } else if (ordenes.has(item.orden)) {
      filaErrores.orden = 'Orden duplicado.';
    } else {
      ordenes.add(item.orden);
    }

    if (item.habilitado) {
      habilitadas++;
    }

    if (item.clave === CLAVES_PUNTUALIDAD[0]) antes = item;
    if (item.clave === CLAVES_PUNTUALIDAD[1]) despues = item;

    if (Object.keys(filaErrores).length > 0) {
      errores[key] = filaErrores;
    }
  });

  if (habilitadas < 1) {
    errores.general = 'Debe dejar al menos una metrica habilitada.';
  }

  if ((antes && !despues) || (!antes && despues)) {
    errores.general = 'Puntualidad requiere ambas metricas: antes y despues.';
  }

  if (antes && despues) {
    if (antes.habilitado !== despues.habilitado || antes.obligatorio !== despues.obligatorio) {
      errores.general = 'Puntualidad (antes/despues) debe mantenerse ambos o ninguno.';
    }
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

  useEffect(() => {
    setCultos(normalizarCultos(detalle?.configuracion?.cultos));
    setProcedencias(normalizarProcedencias(detalle?.configuracion?.procedencias));
    setMetricas(normalizarMetricas(detalle?.configuracion?.metricas));
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
    setProcedencias((prev) => prev.map((item, idx) => {
      if (idx !== index) return item;
      if (campo === 'activo') return { ...item, activo: !!valor };
      if (campo === 'orden') return { ...item, orden: toInt(valor, item.orden) };
      return { ...item, [campo]: valor };
    }));
  }, []);

  const agregarProcedencia = useCallback(() => {
    setProcedencias((prev) => ([
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
    setProcedencias((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const cambiarMetrica = useCallback((index, campo, valor) => {
    setMetricas((prev) => {
      const actualizado = prev.map((item, idx) => {
        if (idx !== index) return item;

        if (campo === 'habilitado' || campo === 'obligatorio') {
          return { ...item, [campo]: !!valor };
        }

        if (campo === 'orden') {
          return { ...item, orden: toInt(valor, item.orden) };
        }

        if (campo === 'clave') {
          return {
            ...item,
            clave: String(valor || '')
              .toLowerCase()
              .replace(/\s+/g, '_')
              .replace(/[^a-z0-9_]/g, '')
          };
        }

        return { ...item, [campo]: valor };
      });

      const metricaEditada = actualizado[index];
      if (!metricaEditada || !CLAVES_PUNTUALIDAD.includes(metricaEditada.clave)) {
        return actualizado;
      }

      return actualizado.map((item, idx) => {
        if (idx === index || !CLAVES_PUNTUALIDAD.includes(item.clave)) return item;
        if (campo === 'habilitado' || campo === 'obligatorio') {
          return { ...item, [campo]: metricaEditada[campo] };
        }
        return item;
      });
    });
  }, []);

  const agregarMetrica = useCallback(() => {
    setMetricas((prev) => ([
      ...prev,
      {
        ui_id: generarUiId('metrica'),
        clave: `metrica_nueva_${prev.length + 1}`,
        etiqueta: 'Nueva metrica',
        habilitado: true,
        obligatorio: false,
        depende_de_clave: '',
        regla_dependencia: '',
        orden: (prev.length + 1) * 10
      }
    ]));
  }, []);

  const eliminarMetrica = useCallback((index) => {
    setMetricas((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const guardarCultos = useCallback(async () => {
    const validacion = validarCultos(cultos);
    setErroresCultos(validacion);
    if (Object.keys(validacion).length > 0) {
      notificarError(validacion.general || 'Revise la configuracion de cultos.');
      return false;
    }

    setGuardandoCultos(true);
    try {
      const payload = {
        cultos: cultos.map((item) => ({
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
    const validacion = validarProcedencias(procedencias);
    setErroresProcedencias(validacion);
    if (Object.keys(validacion).length > 0) {
      notificarError(validacion.general || 'Revise la configuracion de procedencias.');
      return false;
    }

    setGuardandoProcedencias(true);
    try {
      const payload = {
        procedencias: procedencias.map((item) => ({
          nombre: item.nombre.trim(),
          activo: !!item.activo,
          orden: item.orden
        }))
      };
      const res = await setupApi.guardarProcedencias(payload);
      if (res?.exito && res?.datos) {
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
    const validacion = validarMetricas(metricas);
    setErroresMetricas(validacion);
    if (Object.keys(validacion).length > 0) {
      notificarError(validacion.general || 'Revise la configuracion de metricas.');
      return false;
    }

    setGuardandoMetricas(true);
    try {
      const payload = {
        metricas: metricas.map((item) => ({
          clave: item.clave,
          etiqueta: item.etiqueta.trim(),
          habilitado: !!item.habilitado,
          obligatorio: !!item.obligatorio,
          depende_de_clave: item.depende_de_clave || null,
          regla_dependencia: item.regla_dependencia || null,
          orden: item.orden
        }))
      };
      const res = await setupApi.guardarMetricas(payload);
      if (res?.exito && res?.datos) {
        aplicarDetalleSetup(res.datos);
        setErroresMetricas({});
        notificarExito(res.mensaje || 'Metricas guardadas correctamente.');
        return true;
      }
      notificarError(res?.mensaje || 'No se pudieron guardar las metricas.');
      return false;
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudieron guardar las metricas.');
      return false;
    } finally {
      setGuardandoMetricas(false);
    }
  }, [metricas, aplicarDetalleSetup]);

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
    bloqueada_operacion: Boolean(detalle?.bloqueada_operacion ?? true),
    setup_completado_en: detalle?.setup_completado_en || null,
    ultima_revision_en: detalle?.ultima_revision_en || null,
    faltantes: Array.isArray(faltantes) ? faltantes : []
  }), [detalle, faltantes]);

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
