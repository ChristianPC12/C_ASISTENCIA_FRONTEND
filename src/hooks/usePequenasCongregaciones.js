import { useCallback, useEffect, useMemo, useState } from 'react';
import pcApi from '../api/pcApi';
import estudioBiblicoApi from '../api/estudioBiblicoApi';
import usuarioApi from '../api/usuarioApi';
import { confirmar, notificarError, notificarExito } from '../utils/notify';

const FORM_PC_INICIAL = {
  nombre_pc: '',
  sector: '',
  comunidad: '',
  direccion_reunion: '',
  anfitrion_nombre: '',
  anfitrion_telefono: '',
  lider_principal_nombre: '',
  lider_principal_telefono: '',
  lider_auxiliar_nombre: '',
  lider_auxiliar_telefono: '',
  fecha_inicio: '',
  fecha_fin: '',
  dia_reunion: '',
  hora_reunion: '',
  estado: 'ACTIVA',
  pc_madre_id: '',
  motivo_cierre: '',
  meta_trimestral: '',
  observaciones_generales: ''
};

const FORM_PARTICIPANTE_INICIAL = {
  nombre: '',
  telefono: '',
  clasificacion: 'AMIGO_INTERESADO',
  rol_pc: '',
  es_miembro: false,
  fecha_ingreso: '',
  fecha_salida: '',
  motivo_salida: '',
  estado_participacion: 'ACTIVO',
  observaciones: ''
};

const FORM_REUNION_INICIAL = {
  fecha: '',
  tema_titulo: '',
  material_usado: '',
  hubo_estudio_biblico: false,
  hubo_visita: false,
  cantidad_asistentes: 0,
  total_miembros: 0,
  total_visitas: 0,
  total_ninos: 0,
  total_jovenes: 0,
  total_adultos: 0,
  observacion_reunion: '',
  decisiones_tomadas: '',
  proximos_pasos: '',
  responsable_seguimiento_usuario_id: ''
};

const FORM_ASISTENCIA_INICIAL = {
  reunion_id: '',
  participante_id: '',
  asistio: true,
  clasificacion_dia: '',
  observaciones: ''
};

const FORM_RESULTADO_INICIAL = {
  fecha: '',
  tipo_resultado: 'INTERESADO_NUEVO',
  contacto_nombre: '',
  contacto_telefono: '',
  estudio_biblico_id: '',
  cantidad: 1,
  descripcion: '',
  observaciones: ''
};

const FORM_LIDERAZGO_INICIAL = {
  nombre: '',
  telefono: '',
  rol_liderazgo: 'LIDER_PRINCIPAL',
  fecha_inicio: '',
  fecha_fin: '',
  motivo_cambio: '',
  observaciones: ''
};

export function usePequenasCongregaciones() {
  const [filtros, setFiltros] = useState({
    q: '',
    estado: '',
    sector: '',
    fecha_desde: '',
    fecha_hasta: '',
    sin_reunion_dias: ''
  });
  const [dashboard, setDashboard] = useState({});
  const [pcs, setPcs] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [estudios, setEstudios] = useState([]);
  const [seleccionadaId, setSeleccionadaId] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [detalleVista, setDetalleVista] = useState('RESUMEN');
  const [editandoPcId, setEditandoPcId] = useState(null);
  const [editandoParticipanteId, setEditandoParticipanteId] = useState(null);
  const [editandoReunionId, setEditandoReunionId] = useState(null);
  const [editandoResultadoId, setEditandoResultadoId] = useState(null);
  const [editandoLiderazgoId, setEditandoLiderazgoId] = useState(null);
  const [convirtiendoParticipanteId, setConvirtiendoParticipanteId] = useState(null);
  const [pcForm, setPcForm] = useState(FORM_PC_INICIAL);
  const [participanteForm, setParticipanteForm] = useState(FORM_PARTICIPANTE_INICIAL);
  const [reunionForm, setReunionForm] = useState(FORM_REUNION_INICIAL);
  const [asistenciaForm, setAsistenciaForm] = useState(FORM_ASISTENCIA_INICIAL);
  const [resultadoForm, setResultadoForm] = useState(FORM_RESULTADO_INICIAL);
  const [liderazgoForm, setLiderazgoForm] = useState(FORM_LIDERAZGO_INICIAL);

  const cargarCatalogos = useCallback(async () => {
    try {
      const [resUsuarios, resEstudios] = await Promise.all([
        usuarioApi.listar(),
        estudioBiblicoApi.listar()
      ]);
      setUsuarios(resUsuarios?.exito ? (resUsuarios.datos || []) : []);
      setEstudios(resEstudios?.exito ? (resEstudios?.datos?.items || []) : []);
    } catch {
      setUsuarios([]);
      setEstudios([]);
    }
  }, []);

  const cargarDashboard = useCallback(async () => {
    try {
      const res = await pcApi.dashboard(filtros);
      if (res?.exito) setDashboard(res?.datos?.item || {});
    } catch (error) {
      setDashboard({});
      notificarError(error?.mensaje || 'No se pudo cargar el dashboard de PC.');
    }
  }, [filtros]);

  const cargarPcs = useCallback(async () => {
    setCargando(true);
    try {
      const res = await pcApi.listar(filtros);
      if (res?.exito) {
        const items = res?.datos?.items || [];
        setPcs(items);
        setSeleccionadaId((prev) => {
          if (!items.length) return null;
          return items.some((item) => item.id === prev) ? prev : items[0].id;
        });
      }
    } catch (error) {
      setPcs([]);
      setSeleccionadaId(null);
      notificarError(error?.mensaje || 'No se pudo cargar el listado de PC.');
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
      const res = await pcApi.obtenerPorId(id);
      if (res?.exito) setDetalle(res?.datos?.item || null);
    } catch (error) {
      setDetalle(null);
      notificarError(error?.mensaje || 'No se pudo cargar el detalle de la PC.');
    } finally {
      setCargandoDetalle(false);
    }
  }, []);

  useEffect(() => {
    cargarCatalogos();
  }, [cargarCatalogos]);

  useEffect(() => {
    cargarDashboard();
    cargarPcs();
  }, [cargarDashboard, cargarPcs]);

  useEffect(() => {
    cargarDetalle(seleccionadaId);
  }, [seleccionadaId, cargarDetalle]);

  useEffect(() => {
    if (!detalle) {
      setParticipanteForm(FORM_PARTICIPANTE_INICIAL);
      setReunionForm(FORM_REUNION_INICIAL);
      setAsistenciaForm(FORM_ASISTENCIA_INICIAL);
      setResultadoForm(FORM_RESULTADO_INICIAL);
      setLiderazgoForm(FORM_LIDERAZGO_INICIAL);
      return;
    }
    setParticipanteForm(FORM_PARTICIPANTE_INICIAL);
    setReunionForm(FORM_REUNION_INICIAL);
    setAsistenciaForm((prev) => ({ ...FORM_ASISTENCIA_INICIAL, reunion_id: '', participante_id: prev.participante_id || '' }));
    setResultadoForm(FORM_RESULTADO_INICIAL);
    setLiderazgoForm(FORM_LIDERAZGO_INICIAL);
  }, [detalle]);

  const cambiarFiltro = useCallback((campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }, []);

  const resetPcForm = useCallback(() => {
    setEditandoPcId(null);
    setPcForm(FORM_PC_INICIAL);
  }, []);

  const editarPc = useCallback((item) => {
    setEditandoPcId(item.id);
    setPcForm({
      nombre_pc: item.nombre_pc || '',
      sector: item.sector || '',
      comunidad: item.comunidad || '',
      direccion_reunion: item.direccion_reunion || '',
      anfitrion_nombre: item.anfitrion_nombre || '',
      anfitrion_telefono: '',
      lider_principal_nombre: item.lider_principal_nombre || '',
      lider_principal_telefono: '',
      lider_auxiliar_nombre: item.lider_auxiliar_nombre || '',
      lider_auxiliar_telefono: '',
      fecha_inicio: item.fecha_inicio || '',
      fecha_fin: item.fecha_fin || '',
      dia_reunion: item.dia_reunion ? String(item.dia_reunion) : '',
      hora_reunion: item.hora_reunion ? String(item.hora_reunion).slice(0, 5) : '',
      estado: item.estado || 'ACTIVA',
      pc_madre_id: item.pc_madre_id ? String(item.pc_madre_id) : '',
      motivo_cierre: item.motivo_cierre || '',
      meta_trimestral: item.meta_trimestral || '',
      observaciones_generales: item.observaciones_generales || ''
    });
  }, []);

  const guardarPc = useCallback(async () => {
    setGuardando(true);
    try {
      const payload = { ...pcForm, pc_madre_id: pcForm.pc_madre_id || null };
      const res = editandoPcId ? await pcApi.actualizar(editandoPcId, payload) : await pcApi.crear(payload);
      if (res?.exito) {
        const item = res?.datos?.item || null;
        notificarExito(res.mensaje || 'PC guardada correctamente.');
        resetPcForm();
        await cargarDashboard();
        await cargarPcs();
        if (item?.id) setSeleccionadaId(item.id);
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo guardar la PC.');
    } finally {
      setGuardando(false);
    }
  }, [pcForm, editandoPcId, resetPcForm, cargarDashboard, cargarPcs]);

  const archivarPc = useCallback(async (id) => {
    const ok = await confirmar('Esta PC se archivara. Desea continuar?');
    if (!ok) return;
    try {
      const res = await pcApi.eliminar(id);
      if (res?.exito) {
        notificarExito(res.mensaje || 'PC archivada.');
        if (seleccionadaId === id) {
          setSeleccionadaId(null);
          setDetalle(null);
        }
        resetPcForm();
        await cargarDashboard();
        await cargarPcs();
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo archivar la PC.');
    }
  }, [seleccionadaId, resetPcForm, cargarDashboard, cargarPcs]);

  const prepararEdicion = useCallback((setterId, setterForm, item, mapper) => {
    setterId(item.id);
    setterForm(mapper(item));
  }, []);

  const resetFormsDetalle = useCallback(() => {
    setEditandoParticipanteId(null);
    setEditandoReunionId(null);
    setEditandoResultadoId(null);
    setEditandoLiderazgoId(null);
    setParticipanteForm(FORM_PARTICIPANTE_INICIAL);
    setReunionForm(FORM_REUNION_INICIAL);
    setAsistenciaForm(FORM_ASISTENCIA_INICIAL);
    setResultadoForm(FORM_RESULTADO_INICIAL);
    setLiderazgoForm(FORM_LIDERAZGO_INICIAL);
  }, []);

  const refrescarDetalle = useCallback(async (pcId) => {
    await cargarDetalle(pcId);
    await cargarDashboard();
    await cargarPcs();
  }, [cargarDetalle, cargarDashboard, cargarPcs]);

  const guardarParticipante = useCallback(async () => {
    if (!seleccionadaId) return;
    try {
      const res = editandoParticipanteId
        ? await pcApi.actualizarParticipante(editandoParticipanteId, participanteForm)
        : await pcApi.crearParticipante(seleccionadaId, participanteForm);
      if (res?.exito) {
        notificarExito(res.mensaje || 'Participante guardado correctamente.');
        setEditandoParticipanteId(null);
        setParticipanteForm(FORM_PARTICIPANTE_INICIAL);
        await refrescarDetalle(seleccionadaId);
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo guardar el participante.');
    }
  }, [seleccionadaId, editandoParticipanteId, participanteForm, refrescarDetalle]);

  const guardarReunion = useCallback(async () => {
    if (!seleccionadaId) return;
    try {
      const payload = {
        ...reunionForm,
        responsable_seguimiento_usuario_id: reunionForm.responsable_seguimiento_usuario_id || null
      };
      const res = editandoReunionId
        ? await pcApi.actualizarReunion(editandoReunionId, payload)
        : await pcApi.crearReunion(seleccionadaId, payload);
      if (res?.exito) {
        notificarExito(res.mensaje || 'Reunion guardada correctamente.');
        setEditandoReunionId(null);
        setReunionForm(FORM_REUNION_INICIAL);
        await refrescarDetalle(seleccionadaId);
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo guardar la reunion.');
    }
  }, [seleccionadaId, editandoReunionId, reunionForm, refrescarDetalle]);

  const registrarAsistencia = useCallback(async () => {
    if (!asistenciaForm.reunion_id) return;
    try {
      const res = await pcApi.registrarAsistenciaReunion(asistenciaForm.reunion_id, {
        ...asistenciaForm,
        participante_id: asistenciaForm.participante_id || null
      });
      if (res?.exito) {
        notificarExito(res.mensaje || 'Asistencia registrada correctamente.');
        setAsistenciaForm(FORM_ASISTENCIA_INICIAL);
        if (seleccionadaId) await refrescarDetalle(seleccionadaId);
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo registrar la asistencia.');
    }
  }, [asistenciaForm, seleccionadaId, refrescarDetalle]);

  const guardarResultado = useCallback(async () => {
    if (!seleccionadaId) return;
    try {
      const payload = { ...resultadoForm, estudio_biblico_id: resultadoForm.estudio_biblico_id || null };
      const res = editandoResultadoId
        ? await pcApi.actualizarResultado(editandoResultadoId, payload)
        : await pcApi.crearResultado(seleccionadaId, payload);
      if (res?.exito) {
        notificarExito(res.mensaje || 'Resultado guardado correctamente.');
        setEditandoResultadoId(null);
        setResultadoForm(FORM_RESULTADO_INICIAL);
        await refrescarDetalle(seleccionadaId);
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo guardar el resultado.');
    }
  }, [seleccionadaId, editandoResultadoId, resultadoForm, refrescarDetalle]);

  const guardarLiderazgo = useCallback(async () => {
    if (!seleccionadaId) return;
    try {
      const res = editandoLiderazgoId
        ? await pcApi.actualizarLiderazgo(editandoLiderazgoId, liderazgoForm)
        : await pcApi.crearLiderazgo(seleccionadaId, liderazgoForm);
      if (res?.exito) {
        notificarExito(res.mensaje || 'Movimiento de liderazgo guardado correctamente.');
        setEditandoLiderazgoId(null);
        setLiderazgoForm(FORM_LIDERAZGO_INICIAL);
        await refrescarDetalle(seleccionadaId);
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo guardar el liderazgo.');
    }
  }, [seleccionadaId, editandoLiderazgoId, liderazgoForm, refrescarDetalle]);

  const convertirParticipanteAEstudio = useCallback(async (participante) => {
    if (!participante?.id) return;

    const ok = await confirmar(`Se creara un estudio biblico para ${participante.contacto_nombre}. Desea continuar?`);
    if (!ok) return;

    setConvirtiendoParticipanteId(participante.id);
    try {
      const res = await pcApi.convertirParticipanteAEstudio(participante.id);
      if (res?.exito) {
        notificarExito(res.mensaje || 'El participante fue convertido a estudio biblico.');
        await cargarCatalogos();
        if (seleccionadaId) {
          await refrescarDetalle(seleccionadaId);
        }
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo convertir el participante a estudio biblico.');
    } finally {
      setConvirtiendoParticipanteId(null);
    }
  }, [seleccionadaId, refrescarDetalle, cargarCatalogos]);

  const pcsMadre = useMemo(
    () => pcs.filter((item) => item.id !== editandoPcId),
    [pcs, editandoPcId]
  );

  return {
    filtros,
    dashboard,
    pcs,
    usuarios,
    estudios,
    pcsMadre,
    seleccionadaId,
    detalle,
    cargando,
    cargandoDetalle,
    guardando,
    detalleVista,
    setDetalleVista,
    pcForm,
    setPcForm,
    participanteForm,
    setParticipanteForm,
    reunionForm,
    setReunionForm,
    asistenciaForm,
    setAsistenciaForm,
    resultadoForm,
    setResultadoForm,
    liderazgoForm,
    setLiderazgoForm,
    editandoPcId,
    editandoParticipanteId,
    editandoReunionId,
    editandoResultadoId,
    editandoLiderazgoId,
    convirtiendoParticipanteId,
    setSeleccionadaId,
    cambiarFiltro,
    editarPc,
    resetPcForm,
    guardarPc,
    archivarPc,
    guardarParticipante,
    guardarReunion,
    registrarAsistencia,
    guardarResultado,
    guardarLiderazgo,
    convertirParticipanteAEstudio,
    resetFormsDetalle,
    prepararEdicion,
    setEditandoParticipanteId,
    setEditandoReunionId,
    setEditandoResultadoId,
    setEditandoLiderazgoId
  };
}
