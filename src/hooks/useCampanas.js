import { useCallback, useEffect, useMemo, useState } from 'react';
import campanaApi from '../api/campanaApi';
import { confirmar, notificarError, notificarExito } from '../utils/notify';

const FORM_CAMPANA_INICIAL = {
  lema: '',
  tipo: 'SEMANA_EVANGELISTICA',
  fecha_inicio: '',
  fecha_fin: '',
  lugar: '',
  hora: '',
  predicador: '',
  responsable: '',
  descripcion: '',
  observaciones: ''
};

const FORM_SESION_INICIAL = {
  fecha: '',
  tema_titulo: '',
  observaciones: ''
};

const FORM_ASISTENTE_INICIAL = {
  nombre_completo: '',
  telefono: '',
  correo: '',
  direccion: '',
  barrio_comunidad: '',
  procedencia: '',
  tipo_asistente: 'VISITA',
  clasificacion_etaria: '',
  invitado_por_contacto_id: '',
  primera_vez: true,
  observaciones: '',
  estado_seguimiento: 'PENDIENTE'
};

const FORM_ASISTENCIA_INICIAL = {
  sesion_id: '',
  campana_asistente_id: '',
  hora_llegada: '',
  puntual: false,
  elegible_premio: false,
  asistio: true,
  observaciones: ''
};

const FORM_DECISION_INICIAL = {
  campana_asistente_id: '',
  decision_clave: '',
  decision_etiqueta: '',
  fecha_decision: '',
  observaciones: ''
};

export function useCampanas() {
  const [filtros, setFiltros] = useState({
    q: '',
    estado: '',
    responsable_usuario_id: '',
    fecha_desde: '',
    fecha_hasta: ''
  });
  const [dashboard, setDashboard] = useState({});
  const [campanas, setCampanas] = useState([]);
  const [seleccionadaId, setSeleccionadaId] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [editandoCampanaId, setEditandoCampanaId] = useState(null);
  const [campanaForm, setCampanaForm] = useState(FORM_CAMPANA_INICIAL);
  const [sesionForm, setSesionForm] = useState(FORM_SESION_INICIAL);
  const [asistenteForm, setAsistenteForm] = useState(FORM_ASISTENTE_INICIAL);
  const [asistenciaForm, setAsistenciaForm] = useState(FORM_ASISTENCIA_INICIAL);
  const [decisionForm, setDecisionForm] = useState(FORM_DECISION_INICIAL);
  const [detalleVista, setDetalleVista] = useState('RESUMEN');
  const [convirtiendoAsistenteId, setConvirtiendoAsistenteId] = useState(null);

  const cargarDashboard = useCallback(async () => {
    try {
      const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== ''));
      const res = await campanaApi.dashboard(params);
      if (res?.exito) {
        setDashboard(res.datos?.item || {});
      }
    } catch (error) {
      setDashboard({});
      notificarError(error?.mensaje || 'No se pudo cargar el dashboard de campa\u00f1as.');
    }
  }, [filtros]);

  const cargarCampanas = useCallback(async () => {
    setCargando(true);
    try {
      const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== ''));
      const res = await campanaApi.listar(params);
      if (res?.exito) {
        const items = res.datos?.items || [];
        setCampanas(items);
        setSeleccionadaId((prev) => {
          if (items.length === 0) return null;
          return items.some((item) => item.id === prev) ? prev : items[0].id;
        });
      }
    } catch (error) {
      setCampanas([]);
      setSeleccionadaId(null);
      notificarError(error?.mensaje || 'No se pudo cargar el listado de campa\u00f1as.');
    } finally {
      setCargando(false);
    }
  }, [filtros]);

  const cargarDetalle = useCallback(async (id) => {
    if (!id) {
      setDetalle(null);
      return;
    }

    setCargandoDetalle(true);
    try {
      const res = await campanaApi.obtenerPorId(id);
      if (res?.exito) {
        setDetalle(res.datos?.item || null);
      }
    } catch (error) {
      setDetalle(null);
      notificarError(error?.mensaje || 'No se pudo cargar el detalle de la campa\u00f1a.');
    } finally {
      setCargandoDetalle(false);
    }
  }, []);

  useEffect(() => {
    cargarDashboard();
    cargarCampanas();
  }, [cargarDashboard, cargarCampanas]);

  useEffect(() => {
    cargarDetalle(seleccionadaId);
  }, [seleccionadaId, cargarDetalle]);

  const cambiarFiltro = useCallback((campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }, []);

  const editarCampana = useCallback((item) => {
    setEditandoCampanaId(item.id);
    setCampanaForm({
      lema: item.lema || '',
      tipo: item.tipo || 'SEMANA_EVANGELISTICA',
      fecha_inicio: item.fecha_inicio || '',
      fecha_fin: item.fecha_fin || '',
      lugar: item.lugar || '',
      hora: item.hora || '',
      predicador: item.predicador || '',
      responsable: item.responsable || '',
      descripcion: item.descripcion || '',
      observaciones: item.observaciones || ''
    });
  }, []);

  const resetCampanaForm = useCallback(() => {
    setEditandoCampanaId(null);
    setCampanaForm(FORM_CAMPANA_INICIAL);
  }, []);

  const guardarCampana = useCallback(async () => {
    setGuardando(true);
    try {
      const calcularEstadoCampana = (fechaInicio, fechaFin) => {
        const hoy = new Date().toLocaleDateString('en-CA');
        if (!fechaInicio || hoy < fechaInicio) return 'POR_INICIAR';
        if (!fechaFin || hoy <= fechaFin) return 'ACTIVA';
        return 'FINALIZADA';
      };

      const payload = {
        ...campanaForm,
        nombre: campanaForm.lema,
        estado: calcularEstadoCampana(campanaForm.fecha_inicio, campanaForm.fecha_fin)
      };

      const res = editandoCampanaId
        ? await campanaApi.actualizar(editandoCampanaId, payload)
        : await campanaApi.crear(payload);

      if (res?.exito) {
        const item = res.datos?.item || null;
        notificarExito(res.mensaje || 'Campa\u00f1a guardada correctamente.');
        resetCampanaForm();
        await cargarDashboard();
        await cargarCampanas();
        if (item?.id) {
          setSeleccionadaId(item.id);
        }
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo guardar la campa\u00f1a.');
    } finally {
      setGuardando(false);
    }
  }, [campanaForm, editandoCampanaId, resetCampanaForm, cargarDashboard, cargarCampanas]);

  const eliminarCampana = useCallback(async (id) => {
    const ok = await confirmar('\u00bfEst\u00e1 seguro de que desea eliminar esta campa\u00f1a? Esta acci\u00f3n no se puede deshacer.');
    if (!ok) return;

    try {
      const res = await campanaApi.eliminar(id);
      if (res?.exito) {
        notificarExito('Campaña eliminada correctamente.');
        if (seleccionadaId === id) {
          setSeleccionadaId(null);
          setDetalle(null);
        }
        await cargarDashboard();
        await cargarCampanas();
        resetCampanaForm();
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo eliminar la campa\u00f1a.');
    }
  }, [seleccionadaId, cargarDashboard, cargarCampanas, resetCampanaForm]);

  const guardarSesion = useCallback(async () => {
    if (!seleccionadaId) return;
    try {
      const payload = {
        ...sesionForm,
        hora_inicio: detalle?.hora || '',
        estado_sesion: 'PROGRAMADA',
        predicador_noche: detalle?.predicador || ''
      };
      const res = await campanaApi.crearSesion(seleccionadaId, payload);
      if (res?.exito) {
        notificarExito(res.mensaje || 'Sesi\u00f3n creada correctamente.');
        setSesionForm(FORM_SESION_INICIAL);
        await cargarDetalle(seleccionadaId);
        await cargarDashboard();
        await cargarCampanas();
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo guardar la sesi\u00f3n.');
    }
  }, [seleccionadaId, sesionForm, detalle, cargarDetalle, cargarDashboard, cargarCampanas]);

  const guardarAsistente = useCallback(async () => {
    if (!seleccionadaId) return;
    try {
      const res = await campanaApi.crearAsistente(seleccionadaId, asistenteForm);
      if (res?.exito) {
        notificarExito(res.mensaje || 'Asistente registrado correctamente.');
        setAsistenteForm(FORM_ASISTENTE_INICIAL);
        await cargarDetalle(seleccionadaId);
        await cargarDashboard();
        await cargarCampanas();
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo guardar el asistente.');
    }
  }, [seleccionadaId, asistenteForm, cargarDetalle, cargarDashboard, cargarCampanas]);

  const guardarAsistencia = useCallback(async () => {
    if (!asistenciaForm.sesion_id) return;
    try {
      const { sesion_id, ...payload } = asistenciaForm;
      const res = await campanaApi.registrarAsistenciaSesion(sesion_id, payload);
      if (res?.exito) {
        notificarExito(res.mensaje || 'Asistencia registrada correctamente.');
        setAsistenciaForm(FORM_ASISTENCIA_INICIAL);
        if (seleccionadaId) {
          await cargarDetalle(seleccionadaId);
          await cargarDashboard();
          await cargarCampanas();
        }
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo registrar la asistencia.');
    }
  }, [asistenciaForm, seleccionadaId, cargarDetalle, cargarDashboard, cargarCampanas]);

  const guardarDecision = useCallback(async () => {
    if (!seleccionadaId) return;
    try {
      const res = await campanaApi.crearDecision(seleccionadaId, decisionForm);
      if (res?.exito) {
        notificarExito(res.mensaje || 'Decisi\u00f3n registrada correctamente.');
        setDecisionForm(FORM_DECISION_INICIAL);
        await cargarDetalle(seleccionadaId);
        await cargarDashboard();
        await cargarCampanas();
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo registrar la decisi\u00f3n.');
    }
  }, [seleccionadaId, decisionForm, cargarDetalle, cargarDashboard, cargarCampanas]);

  const convertirAsistenteAEstudio = useCallback(async (asistente) => {
    if (!asistente?.id) return;

    const ok = await confirmar(`Se creara un estudio biblico para ${asistente.nombre_snapshot}. Desea continuar?`);
    if (!ok) return;

    setConvirtiendoAsistenteId(asistente.id);
    try {
      const res = await campanaApi.convertirAsistenteAEstudio(asistente.id);
      if (res?.exito) {
        notificarExito(res.mensaje || 'El asistente fue convertido a estudio biblico.');
        if (seleccionadaId) {
          await cargarDetalle(seleccionadaId);
        }
        await cargarDashboard();
        await cargarCampanas();
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo convertir el asistente a estudio biblico.');
    } finally {
      setConvirtiendoAsistenteId(null);
    }
  }, [seleccionadaId, cargarDetalle, cargarDashboard, cargarCampanas]);

  const asistentesOpciones = useMemo(() => detalle?.asistentes || [], [detalle]);
  const sesionesOpciones = useMemo(() => detalle?.sesiones || [], [detalle]);

  return {
    filtros,
    dashboard,
    campanas,
    seleccionadaId,
    setSeleccionadaId,
    detalle,
    cargando,
    cargandoDetalle,
    guardando,
    editandoCampanaId,
    campanaForm,
    setCampanaForm,
    sesionForm,
    setSesionForm,
    asistenteForm,
    setAsistenteForm,
    asistenciaForm,
    setAsistenciaForm,
    decisionForm,
    setDecisionForm,
    detalleVista,
    setDetalleVista,
    convirtiendoAsistenteId,
    asistentesOpciones,
    sesionesOpciones,
    cambiarFiltro,
    editarCampana,
    resetCampanaForm,
    guardarCampana,
    eliminarCampana,
    guardarSesion,
    guardarAsistente,
    guardarAsistencia,
    guardarDecision,
    convertirAsistenteAEstudio,
    recargar: async () => {
      await cargarDashboard();
      await cargarCampanas();
      if (seleccionadaId) {
        await cargarDetalle(seleccionadaId);
      }
    }
  };
}
