import { useState, useEffect, useCallback } from 'react';
import asistenciaApi from '../api/asistenciaApi';
import cultoApi from '../api/cultoApi';
import { validarAsistencia } from '../validators/asistenciaValidator';
import { sanitizarObjeto, aEnteroPositivo } from '../utils/sanitizer';
import { notificarExito, notificarError, confirmar } from '../utils/notify';
import { ASISTENCIA_FORM_INICIAL, ANIO_ACTUAL } from '../config/constants';

/**
 * Hook para CRUD de asistencia
 */
export function useAsistencia() {
  const [registros, setRegistros] = useState([]);
  const [cultos, setCultos] = useState([]);
  const [formulario, setFormulario] = useState({ ...ASISTENCIA_FORM_INICIAL });
  const [editandoId, setEditandoId] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState({});
  const [fechasRegistradas, setFechasRegistradas] = useState([]);

  // Filtros
  const [filtros, setFiltros] = useState({
    culto: '',
    anio: ANIO_ACTUAL,
    trimestre: '',
    mes: ''
  });

  // Auto-calcular total_asistentes cuando cambian antes/despues
  useEffect(() => {
    const antesVacio = formulario.llegaron_antes_hora === '' || formulario.llegaron_antes_hora === null;
    const despuesVacio = formulario.llegaron_despues_hora === '' || formulario.llegaron_despues_hora === null;
    // Si ambos estan vacios, dejar total vacio tambien
    if (antesVacio && despuesVacio) {
      setFormulario(prev => prev.total_asistentes === '' ? prev : { ...prev, total_asistentes: '' });
      return;
    }
    const antes = aEnteroPositivo(formulario.llegaron_antes_hora);
    const despues = aEnteroPositivo(formulario.llegaron_despues_hora);
    const nuevoTotal = antes + despues;
    setFormulario(prev => {
      if (aEnteroPositivo(prev.total_asistentes) !== nuevoTotal) {
        return { ...prev, total_asistentes: nuevoTotal };
      }
      return prev;
    });
  }, [formulario.llegaron_antes_hora, formulario.llegaron_despues_hora]);

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
  }, []);

  // Cargar registros cuando cambian los filtros
  useEffect(() => {
    cargarRegistros();
  }, [filtros]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cargar cultos del backend
  const cargarCultos = useCallback(async () => {
    try {
      const res = await cultoApi.listar();
      if (res.exito) {
        setCultos(res.datos);
      }
    } catch (error) {
      notificarError('Error al cargar los cultos.');
    }
  }, []);

  // Cargar registros de asistencia
  const cargarRegistros = useCallback(async () => {
    setCargando(true);
    try {
      const params = {};
      if (filtros.culto) params.culto = filtros.culto;
      if (filtros.anio) params.anio = filtros.anio;
      if (filtros.trimestre) params.trimestre = filtros.trimestre;
      if (filtros.mes) {
        // Enviar mes como string de dos dígitos ("01", "02", ...)
        const mesStr = String(filtros.mes).padStart(2, '0');
        params.mes = mesStr;
      }

      const res = await asistenciaApi.listar(params);
      if (res.exito) {
        setRegistros(res.datos || []);
      }
    } catch (error) {
      notificarError('Error al cargar los registros de asistencia.');
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
      const cultoObj = cultos.find(c => String(c.id) === String(cultoId));
      const params = {};
      if (cultoObj) params.culto = cultoObj.codigo;
      const res = await asistenciaApi.listar(params);
      if (res.exito) {
        setFechasRegistradas((res.datos || []).map(r => r.fecha));
      }
    } catch {
      setFechasRegistradas([]);
    }
  }, [cultos]);

  // Recargar fechas registradas cuando cambia el culto seleccionado
  useEffect(() => {
    cargarFechasRegistradas(formulario.culto_id);
  }, [formulario.culto_id, cultos]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cambiar un campo del formulario
  const cambiarCampo = useCallback((campo, valor) => {
    setFormulario(prev => ({ ...prev, [campo]: valor }));
    // Limpiar error del campo al modificarlo
    setErrores(prev => {
      const nuevos = { ...prev };
      delete nuevos[campo];
      return nuevos;
    });
  }, []);

  // Preparar datos para enviar al backend
  const prepararDatos = useCallback((datos) => {
    const sanitizados = sanitizarObjeto(datos);
    return {
      culto_id: aEnteroPositivo(sanitizados.culto_id),
      fecha: sanitizados.fecha,
      llegaron_antes_hora: aEnteroPositivo(sanitizados.llegaron_antes_hora),
      llegaron_despues_hora: aEnteroPositivo(sanitizados.llegaron_despues_hora),
      ninos: aEnteroPositivo(sanitizados.ninos),
      jovenes: aEnteroPositivo(sanitizados.jovenes),
      total_asistentes: aEnteroPositivo(sanitizados.total_asistentes),
      proc_barrio: aEnteroPositivo(sanitizados.proc_barrio),
      proc_guayabo: aEnteroPositivo(sanitizados.proc_guayabo),
      visitas_barrio: aEnteroPositivo(sanitizados.visitas_barrio),
      nombres_visitas_barrio: sanitizados.nombres_visitas_barrio || null,
      visitas_guayabo: aEnteroPositivo(sanitizados.visitas_guayabo),
      nombres_visitas_guayabo: sanitizados.nombres_visitas_guayabo || null,
      retiros_antes_terminar: aEnteroPositivo(sanitizados.retiros_antes_terminar),
      se_quedaron_todo: aEnteroPositivo(sanitizados.se_quedaron_todo),
      observaciones: sanitizados.observaciones || null
    };
  }, []);

  // Guardar (crear o actualizar)
  const guardar = useCallback(async () => {
    const validacion = validarAsistencia(formulario);
    if (!validacion.valido) {
      setErrores(validacion.errores);
      // Enfocar el primer campo con error para que el usuario sepa donde corregir
      if (validacion.primerCampoError) {
        setTimeout(() => {
          const el = document.getElementById(validacion.primerCampoError);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Para el selector de fecha usamos un click, para el resto focus
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
        // Refrescar fechas registradas para que el calendario se actualice
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
  }, [formulario, editandoId, prepararDatos, cargarRegistros]);

  // Funcion interna para cargar datos de edicion
  const cargarParaEdicion = (registro) => {
    // Convertir 0 a '' en campos numéricos para que se muestre el placeholder
    const aVacio = (val) => (val === 0 || val === '0') ? '' : val;

    setFormulario({
      culto_id: registro.culto_id,
      fecha: registro.fecha,
      llegaron_antes_hora: aVacio(registro.llegaron_antes_hora),
      llegaron_despues_hora: aVacio(registro.llegaron_despues_hora),
      ninos: aVacio(registro.ninos),
      jovenes: aVacio(registro.jovenes),
      total_asistentes: aVacio(registro.total_asistentes),
      proc_barrio: aVacio(registro.proc_barrio),
      proc_guayabo: aVacio(registro.proc_guayabo),
      visitas_barrio: aVacio(registro.visitas_barrio),
      nombres_visitas_barrio: registro.nombres_visitas_barrio || '',
      visitas_guayabo: aVacio(registro.visitas_guayabo),
      nombres_visitas_guayabo: registro.nombres_visitas_guayabo || '',
      retiros_antes_terminar: aVacio(registro.retiros_antes_terminar),
      se_quedaron_todo: aVacio(registro.se_quedaron_todo),
      observaciones: registro.observaciones || ''
    });
    setEditandoId(registro.id);
    setErrores({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cargar registro para edicion (usado desde la misma pagina)
  const editar = useCallback((registro) => {
    cargarParaEdicion(registro);
  }, []);

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

  // Limpiar formulario
  const limpiarFormulario = useCallback(() => {
    setFormulario({ ...ASISTENCIA_FORM_INICIAL });
    setEditandoId(null);
    setErrores({});
  }, []);

  // Cambiar filtros
  const cambiarFiltro = useCallback((campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
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
    cambiarCampo,
    guardar,
    editar,
    eliminar,
    limpiarFormulario,
    cambiarFiltro
  };
}
