import { useCallback, useEffect, useMemo, useState } from 'react';
import campanaApi from '../api/campanaApi';
import estudioBiblicoApi from '../api/estudioBiblicoApi';
import juntaApi from '../api/juntaApi';
import usuarioApi from '../api/usuarioApi';
import { confirmar, notificarError, notificarExito } from '../utils/notify';

const FORM_JUNTA_INICIAL = {
  fecha: '',
  hora_inicio: '',
  hora_fin: '',
  tipo: 'PRESENCIAL',
  moderador: '',
  secretario: '',
  estado: 'EN_PROCESO',
  observaciones_generales: '',
  resumen_general: '',
  quorum_texto: '',
  junta_anterior_id: ''
};

const FORM_PUNTO_INICIAL = {
  numero_orden: '',
  titulo: '',
  departamento_origen: '',
  presentado_por: '',
  tipo_punto: 'NUEVO',
  descripcion_base: '',
  observacion_secretaria: '',
  discusion_resumen: '',
  decision_final: '',
  estado: 'PENDIENTE',
  prioridad: 'MEDIA',
  confidencial: false,
  responsable_seguimiento_usuario_id: '',
  fecha_limite: '',
  punto_anterior_id: '',
  pasar_proxima_junta: false,
  referencia_modulo: '',
  referencia_entidad_id: ''
};

const FORM_VOTACION_INICIAL = {
  punto_agenda_id: '',
  requirio_voto: true,
  tipo_voto: 'MAYORIA',
  texto_voto: '',
  votos_favor: '',
  votos_contra: '',
  abstenciones: '',
  fecha_voto: '',
  observacion: '',
  estado_resultante: 'APROBADO'
};

const TIPOS_JUNTA_LEGACY = {
  ORDINARIA: 'PRESENCIAL',
  EXTRAORDINARIA: 'PRESENCIAL',
  SEGUIMIENTO: 'PRESENCIAL',
  CONTINUACION: 'PRESENCIAL',
  WHATSAPP: 'VIRTUAL'
};

function fechaHoyInput() {
  return new Date().toLocaleDateString('en-CA');
}

function normalizarTipoJunta(valor) {
  const tipo = String(valor || '').trim().toUpperCase();
  return TIPOS_JUNTA_LEGACY[tipo] || tipo || 'PRESENCIAL';
}

function resolverEstadoJuntaPorFecha(fecha, estadoActual = '') {
  const estado = String(estadoActual || '').toUpperCase();
  if (['CERRADA', 'APROBADA', 'ARCHIVADA'].includes(estado)) return estado;

  const fechaBase = String(fecha || '').slice(0, 10);
  if (fechaBase && fechaBase > fechaHoyInput()) return 'POR_COMENZAR';
  return 'EN_PROCESO';
}

export function useJuntasIglesia() {
  const [filtros, setFiltros] = useState({
    q: '',
    estado: '',
    tipo: '',
    departamento_origen: '',
    responsable_usuario_id: '',
    fecha_desde: '',
    fecha_hasta: ''
  });
  const [dashboard, setDashboard] = useState({});
  const [juntas, setJuntas] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [campanas, setCampanas] = useState([]);
  
  const [estudios, setEstudios] = useState([]);
  const [seleccionadaId, setSeleccionadaId] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [detalleVista, setDetalleVista] = useState('RESUMEN');
  const [editandoJuntaId, setEditandoJuntaId] = useState(null);
  const [editandoPuntoId, setEditandoPuntoId] = useState(null);
  const [editandoVotacionId, setEditandoVotacionId] = useState(null);
  const [juntaForm, setJuntaForm] = useState(FORM_JUNTA_INICIAL);
  const [puntoForm, setPuntoForm] = useState(FORM_PUNTO_INICIAL);
  const [votacionForm, setVotacionForm] = useState(FORM_VOTACION_INICIAL);

  const cargarCatalogos = useCallback(async () => {
    try {
      const [resUsuarios, resCampanas, resEstudios] = await Promise.all([
        usuarioApi.listar(),
        campanaApi.listar(),
        estudioBiblicoApi.listar()
      ]);

      setUsuarios(resUsuarios?.exito ? (resUsuarios.datos || []) : []);
      setCampanas(resCampanas?.exito ? (resCampanas?.datos?.items || []) : []);
      setEstudios(resEstudios?.exito ? (resEstudios?.datos?.items || []) : []);
    } catch {
      setUsuarios([]);
      setCampanas([]);
      setEstudios([]);
    }
  }, []);

  const cargarDashboard = useCallback(async () => {
    try {
      const res = await juntaApi.dashboard(filtros);
      setDashboard(res?.exito ? (res?.datos?.item || {}) : {});
    } catch (error) {
      setDashboard({});
      notificarError(error?.mensaje || 'No se pudo cargar el dashboard de juntas.');
    }
  }, [filtros]);

  const cargarJuntas = useCallback(async () => {
    setCargando(true);
    try {
      const res = await juntaApi.listar(filtros);
      if (res?.exito) {
        const items = res?.datos?.items || [];
        setJuntas(items);
        setSeleccionadaId((prev) => {
          if (!items.length) return null;
          return items.some((item) => item.id === prev) ? prev : items[0].id;
        });
      }
    } catch (error) {
      setJuntas([]);
      setSeleccionadaId(null);
      notificarError(error?.mensaje || 'No se pudo cargar el listado de juntas.');
    } finally {
      setCargando(false);
    }
  }, [filtros]);

  const cargarPendientes = useCallback(async () => {
    try {
      const res = await juntaApi.listarPendientes({
        ...filtros,
        excluir_junta_id: seleccionadaId || undefined
      });
      setPendientes(res?.exito ? (res?.datos?.items || []) : []);
    } catch (error) {
      setPendientes([]);
      notificarError(error?.mensaje || 'No se pudo cargar el seguimiento pendiente.');
    }
  }, [filtros, seleccionadaId]);

  const cargarDetalle = useCallback(async (id) => {
    if (!id) {
      setDetalle(null);
      return;
    }

    setCargandoDetalle(true);
    try {
      const res = await juntaApi.obtenerPorId(id);
      setDetalle(res?.exito ? (res?.datos?.item || null) : null);
    } catch (error) {
      setDetalle(null);
      notificarError(error?.mensaje || 'No se pudo cargar el detalle de la junta.');
    } finally {
      setCargandoDetalle(false);
    }
  }, []);

  useEffect(() => {
    cargarCatalogos();
  }, [cargarCatalogos]);

  useEffect(() => {
    cargarDashboard();
    cargarJuntas();
  }, [cargarDashboard, cargarJuntas]);

  useEffect(() => {
    cargarPendientes();
  }, [cargarPendientes]);

  useEffect(() => {
    cargarDetalle(seleccionadaId);
  }, [seleccionadaId, cargarDetalle]);

  useEffect(() => {
    if (!detalle) {
      setPuntoForm(FORM_PUNTO_INICIAL);
      setVotacionForm(FORM_VOTACION_INICIAL);
      return;
    }
    setPuntoForm(FORM_PUNTO_INICIAL);
    setVotacionForm(FORM_VOTACION_INICIAL);
    setEditandoPuntoId(null);
    setEditandoVotacionId(null);
  }, [detalle]);

  const cambiarFiltro = useCallback((campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }, []);

  const resetJuntaForm = useCallback(() => {
    setEditandoJuntaId(null);
    setJuntaForm((prev) => ({
      ...FORM_JUNTA_INICIAL,
      junta_anterior_id: juntas[0]?.id || prev.junta_anterior_id || ''
    }));
  }, [juntas]);

  const editarJunta = useCallback((item) => {
    setEditandoJuntaId(item.id);
    setJuntaForm({
      fecha: item.fecha || '',
      hora_inicio: item.hora_inicio ? String(item.hora_inicio).slice(0, 5) : '',
      hora_fin: item.hora_fin ? String(item.hora_fin).slice(0, 5) : '',
      tipo: normalizarTipoJunta(item.tipo),
      moderador: item.moderador || '',
      secretario: item.secretario || '',
      estado: item.estado || 'EN_PROCESO',
      observaciones_generales: item.observaciones_generales || '',
      resumen_general: item.resumen_general || '',
      quorum_texto: item.quorum_texto || '',
      junta_anterior_id: item.junta_anterior_id || ''
    });
  }, []);

  const inicializarJuntaNueva = useCallback(() => {
    setEditandoJuntaId(null);
    setJuntaForm({
      ...FORM_JUNTA_INICIAL,
      junta_anterior_id: juntas[0]?.id || ''
    });
  }, [juntas]);

  const resetPuntoForm = useCallback(() => {
    setEditandoPuntoId(null);
    setPuntoForm(FORM_PUNTO_INICIAL);
  }, []);

  const editarPunto = useCallback((item) => {
    setEditandoPuntoId(item.id);
    setDetalleVista('AGENDA');
    setPuntoForm({
      numero_orden: item.numero_orden || '',
      titulo: item.titulo || '',
      departamento_origen: item.departamento_origen || '',
      presentado_por: item.presentado_por || '',
      tipo_punto: item.tipo_punto || 'NUEVO',
      descripcion_base: item.descripcion_base || '',
      observacion_secretaria: item.observacion_secretaria || '',
      discusion_resumen: item.discusion_resumen || '',
      decision_final: item.decision_final || '',
      estado: item.estado || 'PENDIENTE',
      prioridad: item.prioridad || 'MEDIA',
      confidencial: Boolean(item.confidencial),
      responsable_seguimiento_usuario_id: item.responsable_seguimiento_usuario_id || '',
      fecha_limite: item.fecha_limite || '',
      punto_anterior_id: item.punto_anterior_id || '',
      pasar_proxima_junta: Boolean(item.pasar_proxima_junta),
      referencia_modulo: item.referencia_modulo || '',
      referencia_entidad_id: item.referencia_entidad_id || ''
    });
  }, []);

  const resetVotacionForm = useCallback(() => {
    setEditandoVotacionId(null);
    setVotacionForm(FORM_VOTACION_INICIAL);
  }, []);

  const prepararVotacion = useCallback((punto) => {
    setDetalleVista('AGENDA');
    setEditandoVotacionId(null);
    setVotacionForm({
      ...FORM_VOTACION_INICIAL,
      punto_agenda_id: punto?.id || '',
      texto_voto: punto?.decision_final || '',
      estado_resultante: punto?.estado === 'RECHAZADO' ? 'RECHAZADO' : 'APROBADO',
      fecha_voto: new Date().toISOString().slice(0, 16)
    });
  }, []);

  const editarVotacion = useCallback((item) => {
    setDetalleVista('AGENDA');
    setEditandoVotacionId(item.id);
    setVotacionForm({
      punto_agenda_id: item.punto_agenda_id || '',
      requirio_voto: item.requirio_voto !== false && item.requirio_voto !== 0,
      tipo_voto: item.tipo_voto || 'MAYORIA',
      texto_voto: item.texto_voto || '',
      votos_favor: item.votos_favor ?? '',
      votos_contra: item.votos_contra ?? '',
      abstenciones: item.abstenciones ?? '',
      fecha_voto: item.fecha_voto ? String(item.fecha_voto).replace(' ', 'T').slice(0, 16) : '',
      observacion: item.observacion || '',
      estado_resultante: item.estado_resultante || 'APROBADO'
    });
  }, []);

  const guardarJunta = useCallback(async (opciones = {}) => {
    setGuardando(true);
    try {
      const payload = {
        ...juntaForm,
        tipo: normalizarTipoJunta(juntaForm.tipo),
        estado: resolverEstadoJuntaPorFecha(juntaForm.fecha, juntaForm.estado),
        puntos: Array.isArray(opciones?.puntos) ? opciones.puntos : []
      };
      const res = editandoJuntaId
        ? await juntaApi.actualizar(editandoJuntaId, payload)
        : await juntaApi.crear(payload);

      if (res?.exito) {
        const nuevaId = res?.datos?.item?.id || editandoJuntaId;
        notificarExito(editandoJuntaId ? 'Junta actualizada.' : 'Junta creada.');
        resetJuntaForm();
        await Promise.all([cargarDashboard(), cargarJuntas(), cargarPendientes()]);
        if (nuevaId) setSeleccionadaId(nuevaId);
        return true;
      }
      return false;
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo guardar la junta.');
      return false;
    } finally {
      setGuardando(false);
    }
  }, [editandoJuntaId, juntaForm, resetJuntaForm, cargarDashboard, cargarJuntas, cargarPendientes]);

  const eliminarJunta = useCallback(async (item) => {
    const ok = await confirmar(`La junta del ${item?.fecha || ''} se eliminará definitivamente. ¿Desea continuar?`);
    if (!ok) return;

    setGuardando(true);
    try {
      const res = await juntaApi.eliminar(item.id);
      if (res?.exito) {
        notificarExito('Junta eliminada.');
        if (seleccionadaId === item.id) setSeleccionadaId(null);
        await Promise.all([cargarDashboard(), cargarJuntas(), cargarPendientes()]);
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo eliminar la junta.');
    } finally {
      setGuardando(false);
    }
  }, [cargarDashboard, cargarJuntas, cargarPendientes, seleccionadaId]);

  const guardarPunto = useCallback(async () => {
    if (!detalle?.id) {
      notificarError('Seleccione una junta antes de registrar puntos.');
      return;
    }

    setGuardando(true);
    try {
      const res = editandoPuntoId
        ? await juntaApi.actualizarPunto(editandoPuntoId, puntoForm)
        : await juntaApi.crearPunto(detalle.id, puntoForm);

      if (res?.exito) {
        notificarExito(editandoPuntoId ? 'Punto actualizado.' : 'Punto registrado.');
        resetPuntoForm();
        await Promise.all([cargarDashboard(), cargarJuntas(), cargarDetalle(detalle.id), cargarPendientes()]);
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo guardar el punto.');
    } finally {
      setGuardando(false);
    }
  }, [detalle, editandoPuntoId, puntoForm, resetPuntoForm, cargarDashboard, cargarJuntas, cargarDetalle, cargarPendientes]);

  const guardarVotacion = useCallback(async () => {
    const puntoId = Number(votacionForm.punto_agenda_id || 0);
    if (!detalle?.id || !puntoId) {
      notificarError('Seleccione primero el punto que recibira la votacion.');
      return;
    }

    setGuardando(true);
    try {
      const res = editandoVotacionId
        ? await juntaApi.actualizarVotacion(editandoVotacionId, votacionForm)
        : await juntaApi.crearVotacion(puntoId, votacionForm);

      if (res?.exito) {
        notificarExito(editandoVotacionId ? 'Votacion actualizada.' : 'Votacion registrada.');
        resetVotacionForm();
        await Promise.all([cargarDashboard(), cargarJuntas(), cargarDetalle(detalle.id), cargarPendientes()]);
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo guardar la votacion.');
    } finally {
      setGuardando(false);
    }
  }, [detalle, votacionForm, editandoVotacionId, resetVotacionForm, cargarDashboard, cargarJuntas, cargarDetalle, cargarPendientes]);

  const refrescarJuntas = useCallback(async (detalleId = seleccionadaId) => {
    await Promise.all([
      cargarDashboard(),
      cargarJuntas(),
      cargarPendientes(),
      detalleId ? cargarDetalle(detalleId) : Promise.resolve()
    ]);
  }, [cargarDashboard, cargarJuntas, cargarPendientes, cargarDetalle, seleccionadaId]);

  const referenciasPorModulo = useMemo(() => ({
    CAMPANAS: campanas.map((item) => ({ id: item.id, nombre: item.nombre || `Campaña #${item.id}` })),
    ESTUDIOS_BIBLICOS: estudios.map((item) => ({ id: item.id, nombre: item.persona_nombre || `Estudio #${item.id}` })),
    ASISTENCIA: [],
    OTRO: []
  }), [campanas, estudios]);

  return {
    filtros,
    dashboard,
    juntas,
    pendientes,
    usuarios,
    referenciasPorModulo,
    seleccionadaId,
    detalle,
    cargando,
    cargandoDetalle,
    guardando,
    detalleVista,
    setDetalleVista,
    editandoJuntaId,
    editandoPuntoId,
    editandoVotacionId,
    juntaForm,
    setJuntaForm,
    puntoForm,
    setPuntoForm,
    votacionForm,
    setVotacionForm,
    cambiarFiltro,
    setSeleccionadaId,
    guardarJunta,
    editarJunta,
    resetJuntaForm,
    inicializarJuntaNueva,
    eliminarJunta,
    guardarPunto,
    editarPunto,
    resetPuntoForm,
    prepararVotacion,
    guardarVotacion,
    editarVotacion,
    resetVotacionForm,
    refrescarJuntas
  };
}
