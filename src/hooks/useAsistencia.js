import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import asistenciaApi from '../api/asistenciaApi';
import cultoApi from '../api/cultoApi';
import { OBSERVACIONES_MAX, validarAsistencia } from '../validators/asistenciaValidator';
import { sanitizarObjeto, aEnteroPositivo } from '../utils/sanitizer';
import { notificarExito, notificarError, notificarAdvertencia, confirmar } from '../utils/notify';
import { ANIO_ACTUAL } from '../config/constants';
import {
  METRICAS_FALLBACK,
  construirFormularioMetricas,
  normalizarPayloadMetricas,
  obtenerClaveTotalAsistentes,
  obtenerMapaEtiquetasMetricas,
  obtenerMetricasActivas,
  obtenerMetricasNumericasPorSeccion
} from '../utils/metricasConfig';
import { useSetupStatus } from './useSetupStatus';

const normalizarFechaExacta = (valor) => {
  const fecha = (valor || '').trim();
  if (!fecha) return '';

  const construirFechaIso = (anio, mes, dia) => {
    const y = Number(anio);
    const m = Number(mes);
    const d = Number(dia);
    if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return '';

    const dt = new Date(y, m - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return '';

    return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  const matchLatino = fecha.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (matchLatino) {
    const [, dia, mes, anio] = matchLatino;
    return construirFechaIso(anio, mes, dia);
  }

  const matchIso = fecha.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (matchIso) {
    const [, anio, mes, dia] = matchIso;
    return construirFechaIso(anio, mes, dia);
  }

  return '';
};

const OBSERVACIONES_MAX_SALTOS = 3;
const NOMBRE_VISITA_MAX = 20;

const esValorVacio = (valor) => valor === '' || valor === null || valor === undefined;

const normalizarSaltosObservaciones = (valor) => {
  const texto = String(valor ?? '').replace(/\r\n/g, '\n');
  const textoConLimiteCaracteres = texto.slice(0, OBSERVACIONES_MAX);
  const lineasConLimiteCaracteres = textoConLimiteCaracteres.split('\n');

  if (lineasConLimiteCaracteres.length <= OBSERVACIONES_MAX_SALTOS + 1) {
    return textoConLimiteCaracteres;
  }

  return lineasConLimiteCaracteres.slice(0, OBSERVACIONES_MAX_SALTOS + 1).join('\n');
};

const coincideTextoFecha = (fechaIso, textoBusqueda) => {
  const texto = (textoBusqueda || '').trim();
  if (!texto) return true;
  if (!fechaIso) return false;

  const partes = String(fechaIso).split('-');
  if (partes.length !== 3) return false;

  const [anio, mesRaw, diaRaw] = partes;
  const dia = String(Number(diaRaw));
  const mes = String(Number(mesRaw));
  const fechaCorta = `${dia}/${mes}/${anio}`;
  const fechaLarga = `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${anio}`;

  return fechaCorta.startsWith(texto) || fechaLarga.startsWith(texto);
};

function crearFormularioVacio(metricasActivas) {
  return {
    culto_id: '',
    fecha: '',
    metricas: construirFormularioMetricas(metricasActivas, {})
  };
}

function extraerValorCampoFormulario(datos, campo) {
  if (!campo) return undefined;
  if (campo === 'culto_id' || campo === 'fecha') {
    return datos?.[campo];
  }
  return datos?.metricas?.[campo];
}

function filtrarErroresTiempoReal({ erroresValidacion, datos, tocados }) {
  return Object.entries(erroresValidacion).reduce((acc, [clave, mensaje]) => {
    const tocado = Boolean(tocados?.[clave]);
    const tieneValor = !esValorVacio(extraerValorCampoFormulario(datos, clave));

    if (tocado || tieneValor) {
      acc[clave] = mensaje;
    }

    return acc;
  }, {});
}

function normalizarValorNumericoEntrada(valor) {
  const texto = String(valor ?? '').trim();
  if (texto === '') return '';
  if (!/^\d+$/.test(texto)) return null;
  return String(Math.max(0, Math.trunc(Number(texto))));
}

function tieneNombreVisitaMayorAlLimite(valor) {
  return String(valor ?? '')
    .replace(/\r\n/g, '\n')
    .split(',')
    .some((parte) => parte.trim().length > NOMBRE_VISITA_MAX);
}

function normalizarNombresVisitasEntrada(valor) {
  return String(valor ?? '')
    .replace(/\r\n/g, ' ')
    .replace(/\n/g, ' ')
    .split(',')
    .map((parte, index) => {
      const limpio = index === 0
        ? parte.replace(/\s+/g, ' ').trimStart()
        : parte.replace(/\s+/g, ' ').trim();
      return limpio.slice(0, NOMBRE_VISITA_MAX);
    })
    .join(', ');
}

function sumarMetricas(metricas, valores, excluirClaves = []) {
  const excluidas = new Set(excluirClaves);
  return (Array.isArray(metricas) ? metricas : [])
    .filter((item) => !excluidas.has(item.clave))
    .reduce((acumulado, item) => acumulado + aEnteroPositivo(valores?.[item.clave]), 0);
}

/**
 * Hook para CRUD de asistencia con metricas dinamicas por tenant
 */
export function useAsistencia() {
  const TRIMESTRE_ACTUAL = Math.floor(new Date().getMonth() / 3) + 1;
  const { metricasActivas: metricasSetup } = useSetupStatus();
  const metricasActivas = useMemo(
    () => obtenerMetricasActivas(metricasSetup?.length ? metricasSetup : METRICAS_FALLBACK),
    [metricasSetup]
  );
  const mapaEtiquetasMetricas = useMemo(
    () => obtenerMapaEtiquetasMetricas(metricasActivas),
    [metricasActivas]
  );
  const metricasPorClave = useMemo(
    () => metricasActivas.reduce((acc, metrica) => {
      acc[metrica.clave] = metrica;
      return acc;
    }, {}),
    [metricasActivas]
  );
  const claveTotal = useMemo(
    () => obtenerClaveTotalAsistentes(metricasActivas),
    [metricasActivas]
  );
  const metricasInfoCulto = useMemo(
    () => obtenerMetricasNumericasPorSeccion(metricasActivas, 'informacion_culto'),
    [metricasActivas]
  );
  const metricasComposicion = useMemo(
    () => obtenerMetricasNumericasPorSeccion(metricasActivas, 'composicion_asistentes'),
    [metricasActivas]
  );
  const metricasProcedencia = useMemo(
    () => obtenerMetricasNumericasPorSeccion(metricasActivas, 'procedencia'),
    [metricasActivas]
  );
  const metricasPermanencia = useMemo(
    () => obtenerMetricasNumericasPorSeccion(metricasActivas, 'permanencia'),
    [metricasActivas]
  );
  const clavePermanenciaAuto = useMemo(() => {
    if (metricasPermanencia.length < 2) return null;
    const ultima = metricasPermanencia[metricasPermanencia.length - 1];
    return ultima?.clave || null;
  }, [metricasPermanencia]);

  const [registros, setRegistros] = useState([]);
  const [cultos, setCultos] = useState([]);
  const [formulario, setFormulario] = useState(() => crearFormularioVacio(metricasActivas));
  const [editandoId, setEditandoId] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState({});
  const [camposTocados, setCamposTocados] = useState({});
  const [fechasRegistradas, setFechasRegistradas] = useState([]);
  const ultimoCampoEditadoRef = useRef(null);
  const ultimaAdvertenciaRef = useRef({ mensaje: '', tiempo: 0 });

  // Filtros
  const [filtros, setFiltros] = useState({
    culto: '',
    anio: ANIO_ACTUAL,
    trimestre: TRIMESTRE_ACTUAL,
    mes: '',
    fecha_exacta: ''
  });

  useEffect(() => {
    setFormulario((prev) => ({
      ...prev,
      metricas: construirFormularioMetricas(metricasActivas, prev.metricas)
    }));
  }, [metricasActivas]);

  const mostrarAdvertencia = useCallback((mensaje) => {
    const texto = String(mensaje || '').trim();
    if (!texto) return;

    const ahora = Date.now();
    const ultima = ultimaAdvertenciaRef.current;
    if (ultima.mensaje === texto && (ahora - ultima.tiempo) < 1200) {
      return;
    }

    ultimaAdvertenciaRef.current = { mensaje: texto, tiempo: ahora };
    notificarAdvertencia(texto);
  }, []);

  const validarTiempoReal = useCallback((datos, tocados, campoActual = null) => {
    const validacion = validarAsistencia(datos, { metricasActivas });
    const erroresFiltrados = filtrarErroresTiempoReal({
      erroresValidacion: validacion.errores,
      datos,
      tocados
    });
    setErrores(erroresFiltrados);

    if (campoActual && erroresFiltrados[campoActual]) {
      mostrarAdvertencia(erroresFiltrados[campoActual]);
    }
  }, [metricasActivas, mostrarAdvertencia]);

  // Auto-calcular total_asistentes si hay métricas activas en Información del culto.
  useEffect(() => {
    if (!claveTotal || metricasInfoCulto.length < 1) {
      return;
    }

    const valoresInfo = metricasInfoCulto.map((item) => formulario.metricas?.[item.clave]);
    const todasVacias = valoresInfo.every((valor) => esValorVacio(valor));
    const sumaInfoCulto = metricasInfoCulto
      .reduce((acumulado, item) => acumulado + aEnteroPositivo(formulario.metricas?.[item.clave]), 0);
    const nuevoTotal = todasVacias ? '' : String(sumaInfoCulto);

    setFormulario((prev) => {
      const actual = String(prev.metricas?.[claveTotal] ?? '');
      if (actual === nuevoTotal) {
        return prev;
      }
      return {
        ...prev,
        metricas: {
          ...prev.metricas,
          [claveTotal]: nuevoTotal
        }
      };
    });
  }, [
    formulario.metricas,
    claveTotal,
    metricasInfoCulto
  ]);

  // Si no hay Información del culto, permitir derivar total desde Permanencia cuando el usuario complete todas.
  useEffect(() => {
    if (!claveTotal || metricasInfoCulto.length > 0 || metricasPermanencia.length < 1) {
      return;
    }

    const totalRaw = formulario.metricas?.[claveTotal];
    if (!esValorVacio(totalRaw)) return;

    const tieneVacias = metricasPermanencia.some((item) => esValorVacio(formulario.metricas?.[item.clave]));
    if (tieneVacias) return;

    const sumaPermanencia = metricasPermanencia
      .reduce((acumulado, item) => acumulado + aEnteroPositivo(formulario.metricas?.[item.clave]), 0);
    if (sumaPermanencia <= 0) return;

    setFormulario((prev) => {
      const actual = String(prev.metricas?.[claveTotal] ?? '');
      const nuevoTotal = String(sumaPermanencia);
      if (actual === nuevoTotal) {
        return prev;
      }
      return {
        ...prev,
        metricas: {
          ...prev.metricas,
          [claveTotal]: nuevoTotal
        }
      };
    });
  }, [
    formulario.metricas,
    claveTotal,
    metricasInfoCulto,
    metricasPermanencia
  ]);

  const permanenciaAutoBloqueada = useMemo(() => {
    if (!claveTotal || !clavePermanenciaAuto || metricasPermanencia.length < 2) {
      return false;
    }

    const totalRaw = formulario.metricas?.[claveTotal];
    if (esValorVacio(totalRaw)) return false;

    return metricasPermanencia
      .filter((item) => item.clave !== clavePermanenciaAuto)
      .every((item) => !esValorVacio(formulario.metricas?.[item.clave]));
  }, [
    formulario.metricas,
    claveTotal,
    clavePermanenciaAuto,
    metricasPermanencia
  ]);

  // Calcular en tiempo real la última métrica de Permanencia (auto) para que la suma coincida con total_asistentes.
  useEffect(() => {
    if (!claveTotal || !clavePermanenciaAuto || metricasPermanencia.length < 2) {
      return;
    }

    const totalRaw = formulario.metricas?.[claveTotal];
    if (esValorVacio(totalRaw)) {
      return;
    }

    const totalAsistentes = aEnteroPositivo(totalRaw);
    const otras = metricasPermanencia.filter((item) => item.clave !== clavePermanenciaAuto);
    if (otras.length < 1) {
      return;
    }

    const faltantesOtras = otras.some((item) => esValorVacio(formulario.metricas?.[item.clave]));
    if (faltantesOtras) {
      setFormulario((prev) => {
        if ((prev.metricas?.[clavePermanenciaAuto] ?? '') === '') return prev;
        return {
          ...prev,
          metricas: {
            ...prev.metricas,
            [clavePermanenciaAuto]: ''
          }
        };
      });
      return;
    }

    const sumaOtras = otras.reduce(
      (acumulado, item) => acumulado + aEnteroPositivo(formulario.metricas?.[item.clave]),
      0
    );
    const restante = totalAsistentes - sumaOtras;
    const nuevoValor = restante >= 0 ? String(restante) : '';

    setFormulario((prev) => {
      const actual = String(prev.metricas?.[clavePermanenciaAuto] ?? '');
      if (actual === nuevoValor) {
        return prev;
      }
      return {
        ...prev,
        metricas: {
          ...prev.metricas,
          [clavePermanenciaAuto]: nuevoValor
        }
      };
    });
  }, [
    formulario.metricas,
    claveTotal,
    clavePermanenciaAuto,
    metricasPermanencia
  ]);

  // Cargar cultos al montar
  useEffect(() => {
    cargarCultos();
    // Verificar si hay un registro para editar en sessionStorage
    const registroEditar = sessionStorage.getItem('editarRegistro');
    if (registroEditar) {
      sessionStorage.removeItem('editarRegistro');
      const registro = JSON.parse(registroEditar);
      cargarParaEdicion(registro);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metricasActivas]);

  // Cargar registros cuando cambian los filtros
  useEffect(() => {
    cargarRegistros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  // Cargar cultos del backend
  const cargarCultos = useCallback(async () => {
    try {
      const res = await cultoApi.listar();
      if (res.exito) {
        setCultos(res.datos || []);
      }
    } catch (error) {
      if (String(error?.codigo || '').toUpperCase() !== 'SETUP_REQUIRED') {
        notificarError('Error al cargar los cultos.');
      }
    }
  }, []);

  // Cargar registros de asistencia
  const cargarRegistros = useCallback(async () => {
    setCargando(true);
    try {
      const params = {};
      if (filtros.culto) params.culto = filtros.culto;
      const fechaExactaTexto = (filtros.fecha_exacta || '').trim();
      const fechaExactaNormalizada = normalizarFechaExacta(filtros.fecha_exacta);

      if (fechaExactaNormalizada) {
        params.fecha_exacta = fechaExactaNormalizada;
      } else {
        if (filtros.anio) params.anio = filtros.anio;
        if (filtros.trimestre) params.trimestre = filtros.trimestre;
        if (filtros.mes) {
          params.mes = String(filtros.mes).padStart(2, '0');
        }
      }

      const res = await asistenciaApi.listar(params);
      if (res.exito) {
        let datos = res.datos || [];

        if (fechaExactaTexto && !fechaExactaNormalizada) {
          datos = datos.filter((r) => coincideTextoFecha(r.fecha, fechaExactaTexto));
        }

        setRegistros(datos);
      }
    } catch (error) {
      if (String(error?.codigo || '').toUpperCase() !== 'SETUP_REQUIRED') {
        notificarError('Error al cargar los registros de asistencia.');
      }
      setRegistros([]);
    } finally {
      setCargando(false);
    }
  }, [filtros]);

  // Cargar fechas ya registradas para el culto seleccionado
  const cargarFechasRegistradas = useCallback(async (cultoId) => {
    if (!cultoId) {
      setFechasRegistradas([]);
      return;
    }
    try {
      const cultoObj = cultos.find((c) => String(c.id) === String(cultoId));
      const params = {};
      if (cultoObj) params.culto = cultoObj.codigo;
      const res = await asistenciaApi.listar(params);
      if (res.exito) {
        setFechasRegistradas((res.datos || []).map((r) => r.fecha));
      }
    } catch {
      setFechasRegistradas([]);
    }
  }, [cultos]);

  // Recargar fechas registradas cuando cambia el culto seleccionado
  useEffect(() => {
    cargarFechasRegistradas(formulario.culto_id);
  }, [formulario.culto_id, cultos, cargarFechasRegistradas]);

  const obtenerErrorBloqueoCambio = useCallback((campo, valor, datosActuales) => {
    const metrica = metricasPorClave[campo];
    if (!metrica || metrica.tipo !== 'numero') {
      return { mensaje: null, valorNormalizado: valor };
    }

    const valorNormalizado = normalizarValorNumericoEntrada(valor);
    if (valorNormalizado === null) {
      return { mensaje: null, valorNormalizado: null };
    }

    const siguienteMetricas = {
      ...(datosActuales?.metricas || {}),
      [campo]: valorNormalizado
    };
    const totalRaw = campo === claveTotal ? valorNormalizado : siguienteMetricas?.[claveTotal];
    const totalExiste = !esValorVacio(totalRaw);
    const total = aEnteroPositivo(totalRaw);
    const seccion = metrica.seccion || metrica.categoria || '';

    if (campo === claveTotal && totalExiste) {
      const sumaComposicion = sumarMetricas(metricasComposicion, siguienteMetricas);
      if (sumaComposicion > total) {
        return {
          mensaje: 'Total de asistentes no puede ser menor que la suma de Composición de asistentes.',
          valorNormalizado
        };
      }

      const sumaProcedencia = sumarMetricas(metricasProcedencia, siguienteMetricas);
      if (sumaProcedencia > total) {
        return {
          mensaje: 'Total de asistentes no puede ser menor que la suma de Procedencia.',
          valorNormalizado
        };
      }

      const sumaPermanenciaManual = sumarMetricas(
        metricasPermanencia,
        siguienteMetricas,
        clavePermanenciaAuto ? [clavePermanenciaAuto] : []
      );
      if (sumaPermanenciaManual > total) {
        return {
          mensaje: 'Total de asistentes no puede ser menor que la suma de Permanencia.',
          valorNormalizado
        };
      }
    }

    if (seccion === 'composicion_asistentes' && totalExiste) {
      const sumaComposicion = sumarMetricas(metricasComposicion, siguienteMetricas);
      if (sumaComposicion > total) {
        return {
          mensaje: 'La suma de Composición de asistentes no puede superar Total de asistentes.',
          valorNormalizado
        };
      }
    }

    if (seccion === 'procedencia' && totalExiste) {
      const sumaProcedencia = sumarMetricas(metricasProcedencia, siguienteMetricas);
      if (sumaProcedencia > total) {
        return {
          mensaje: 'La suma de Procedencia no puede superar Total de asistentes.',
          valorNormalizado
        };
      }
    }

    if (seccion === 'permanencia' && totalExiste) {
      const sumaPermanenciaManual = sumarMetricas(
        metricasPermanencia,
        siguienteMetricas,
        clavePermanenciaAuto ? [clavePermanenciaAuto] : []
      );
      if (sumaPermanenciaManual > total) {
        return {
          mensaje: 'La suma de Permanencia no puede superar Total de asistentes.',
          valorNormalizado
        };
      }
    }

    if (campo.startsWith('visitas_')) {
      const slug = campo.slice('visitas_'.length);
      const procedenciaRelacionada = aEnteroPositivo(siguienteMetricas?.[`proc_${slug}`]);
      if (aEnteroPositivo(valorNormalizado) > procedenciaRelacionada) {
        return {
          mensaje: 'Las visitas no pueden superar la procedencia indicada.',
          valorNormalizado
        };
      }
    }

    return { mensaje: null, valorNormalizado };
  }, [
    metricasPorClave,
    claveTotal,
    metricasComposicion,
    metricasProcedencia,
    metricasPermanencia,
    clavePermanenciaAuto
  ]);

  useEffect(() => {
    if (Object.keys(camposTocados).length === 0) {
      return;
    }

    validarTiempoReal(formulario, camposTocados, ultimoCampoEditadoRef.current);
  }, [formulario, camposTocados, validarTiempoReal]);

  const cambiarCampo = useCallback((campo, valor) => {
    ultimoCampoEditadoRef.current = campo;
    setCamposTocados((prev) => ({ ...prev, [campo]: true }));

    if (campo === 'culto_id' || campo === 'fecha') {
      setFormulario((prev) => ({ ...prev, [campo]: valor }));
      return;
    }

    if (campo.startsWith('nombres_visitas_')) {
      if (tieneNombreVisitaMayorAlLimite(valor)) {
        mostrarAdvertencia('Cada nombre de visita admite hasta 20 caracteres.');
      }

      const valorNormalizado = normalizarNombresVisitasEntrada(valor);
      setFormulario((prev) => ({
        ...prev,
        metricas: {
          ...prev.metricas,
          [campo]: valorNormalizado
        }
      }));
      return;
    }

    const { mensaje, valorNormalizado } = obtenerErrorBloqueoCambio(campo, valor, formulario);
    if (valorNormalizado === null) {
      return;
    }

    if (mensaje) {
      mostrarAdvertencia(mensaje);
      setErrores((prev) => ({
        ...prev,
        [campo]: mensaje
      }));
      return;
    }

    setFormulario((prev) => ({
      ...prev,
      metricas: {
        ...prev.metricas,
        [campo]: valorNormalizado
      }
    }));
  }, [formulario, obtenerErrorBloqueoCambio]);

  const prepararDatos = useCallback((datos) => {
    const sanitizados = sanitizarObjeto(datos);
    const metricasPayload = normalizarPayloadMetricas(metricasActivas, sanitizados.metricas || {});
    const observacionesNormalizadas = typeof metricasPayload.observaciones === 'string'
      ? normalizarSaltosObservaciones(metricasPayload.observaciones)
      : null;

    if (observacionesNormalizadas !== null) {
      metricasPayload.observaciones = observacionesNormalizadas;
    }

    return {
      culto_id: aEnteroPositivo(sanitizados.culto_id),
      fecha: sanitizados.fecha,
      metricas: metricasPayload,
      observaciones: observacionesNormalizadas
    };
  }, [metricasActivas]);

  // Guardar (crear o actualizar)
  const guardar = useCallback(async () => {
    const validacion = validarAsistencia(formulario, { metricasActivas });
    if (!validacion.valido) {
      setErrores(validacion.errores);
      const primerMensaje = validacion.primerCampoError
        ? validacion.errores?.[validacion.primerCampoError]
        : Object.values(validacion.errores || {})[0];
      mostrarAdvertencia(primerMensaje || 'Revise los datos del formulario.');
      setCamposTocados((prev) => {
        const siguientes = { ...prev };
        Object.keys(validacion.errores).forEach((campo) => {
          siguientes[campo] = true;
        });
        return siguientes;
      });
      if (validacion.primerCampoError) {
        setTimeout(() => {
          const el = document.getElementById(validacion.primerCampoError);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
              el.focus({ preventScroll: true });
            } else {
              el.click();
            }
          }
        }, 100);
      }
      return false;
    }

    setCargando(true);
    setErrores({});

    try {
      const datos = prepararDatos(formulario);

      let res;
      if (editandoId) {
        res = await asistenciaApi.actualizar(editandoId, datos);
      } else {
        res = await asistenciaApi.crear(datos);
      }

      if (res.exito) {
        notificarExito(res.mensaje);
        const cultoIdGuardado = formulario.culto_id;
        limpiarFormulario();
        await cargarRegistros();
        await cargarFechasRegistradas(cultoIdGuardado);
        return true;
      }

      notificarError(res.mensaje || 'Error al guardar.');
      return false;
    } catch (error) {
      const mensaje = error?.mensaje || 'Error al guardar el registro.';
      notificarError(mensaje);
      return false;
    } finally {
      setCargando(false);
    }
  }, [
    formulario,
    metricasActivas,
    editandoId,
    mostrarAdvertencia,
    prepararDatos,
    cargarRegistros,
    cargarFechasRegistradas
  ]);

  const cargarParaEdicion = useCallback((registro) => {
    const metricasRegistro = registro?.metricas || {};
    setFormulario({
      culto_id: registro.culto_id,
      fecha: registro.fecha,
      metricas: construirFormularioMetricas(metricasActivas, metricasRegistro)
    });
    setEditandoId(registro.id);
    setErrores({});
    setCamposTocados({});
    ultimoCampoEditadoRef.current = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [metricasActivas]);

  const editar = useCallback((registro) => {
    cargarParaEdicion(registro);
  }, [cargarParaEdicion]);

  // Eliminar registro
  const eliminar = useCallback(async (id) => {
    if (!await confirmar('¿Está seguro de que desea eliminar este registro de asistencia?')) {
      return false;
    }

    setCargando(true);
    try {
      const res = await asistenciaApi.eliminar(id);
      if (res.exito) {
        notificarExito(res.mensaje);
        await cargarRegistros();
        return true;
      }
      notificarError(res.mensaje || 'Error al eliminar.');
      return false;
    } catch (error) {
      const mensaje = error?.mensaje || 'Error al eliminar el registro.';
      notificarError(mensaje);
      return false;
    } finally {
      setCargando(false);
    }
  }, [cargarRegistros]);

  // Exportar un registro puntual a Excel
  const exportarRegistro = useCallback(async (registro) => {
    if (!registro?.id) return false;

    try {
      const blob = await asistenciaApi.exportarExcel(registro.id);
      const extension = 'xls';
      const fecha = (registro.fecha || 'sin-fecha').replace(/[^\d-]/g, '');
      const nombre = `asistencia_${fecha}.${extension}`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombre;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      notificarExito('Exportacion Excel generada.');
      return true;
    } catch (error) {
      notificarError('No se pudo exportar el registro a Excel.');
      return false;
    }
  }, []);

  // Exportar informe segun filtros actuales (solo Excel)
  const exportarInforme = useCallback(async () => {
    try {
      const params = {};
      if (filtros.culto) params.culto = filtros.culto;
      const fechaExactaNormalizada = normalizarFechaExacta(filtros.fecha_exacta);
      if (fechaExactaNormalizada) {
        params.fecha_exacta = fechaExactaNormalizada;
      } else {
        if (filtros.anio) params.anio = filtros.anio;
        if (filtros.trimestre) params.trimestre = filtros.trimestre;
        if (filtros.mes) params.mes = String(filtros.mes).padStart(2, '0');
      }

      const blob = await asistenciaApi.exportarInformeExcel(params);
      const extension = 'xls';
      const anio = filtros.anio || ANIO_ACTUAL;
      const periodo = filtros.mes
        ? `mes-${String(filtros.mes).padStart(2, '0')}`
        : (filtros.trimestre ? `t${filtros.trimestre}` : 'todos');
      const nombre = `informe_asistencia_${anio}_${periodo}.${extension}`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombre;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      notificarExito('Informe Excel generado.');
      return true;
    } catch {
      notificarError('No se pudo generar el informe en Excel.');
      return false;
    }
  }, [filtros]);

  // Limpiar formulario
  const limpiarFormulario = useCallback(() => {
    setFormulario(crearFormularioVacio(metricasActivas));
    setEditandoId(null);
    setErrores({});
    setCamposTocados({});
    ultimoCampoEditadoRef.current = null;
  }, [metricasActivas]);

  const cambiarFiltro = useCallback((campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }, []);

  return {
    registros,
    cultos,
    formulario,
    editandoId,
    cargando,
    errores,
    fechasRegistradas,
    filtros,
    metricasActivas,
    mapaEtiquetasMetricas,
    clavePermanenciaAuto,
    permanenciaAutoBloqueada,
    cambiarCampo,
    guardar,
    editar,
    eliminar,
    exportarRegistro,
    exportarInforme,
    limpiarFormulario,
    cambiarFiltro
  };
}
