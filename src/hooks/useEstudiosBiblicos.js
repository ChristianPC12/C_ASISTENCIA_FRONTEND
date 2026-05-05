import { useCallback, useEffect, useMemo, useState } from 'react';
import estudioBiblicoApi from '../api/estudioBiblicoApi';
import campanaApi from '../api/campanaApi';
import { confirmar, notificarError, notificarExito } from '../utils/notify';

const FORM_ESTUDIO_INICIAL = {
  persona_nombre: '',
  telefono: '',
  correo: '',
  direccion: '',
  barrio_comunidad: '',
  origen_clave: 'VISITA_IGLESIA',
  campana_origen_id: '',
  instructor_principal_nombre: '',
  instructor_principal_telefono: '',
  instructor_secundario_nombre: '',
  instructor_secundario_telefono: '',
  responsable_usuario_id: '',
  modalidad: 'INDIVIDUAL',
  material_estudio: '',
  leccion_actual: '',
  total_lecciones_completadas: 0,
  fecha_inicio: '',
  frecuencia_periodo: 'SEMANA',
  frecuencia_cantidad: 1,
  proxima_sesion: '',
  estado_general: 'NUEVO',
  observaciones: '',
  motivo_cierre_pausa: '',
  motivo_reasignacion: ''
};

const FORM_SESION_INICIAL = {
  fecha: '',
  tema_leccion: '',
  resumen_breve: '',
  dudas_surgidas: '',
  asistencia: 'SI',
  percepcion_avance: 'MEDIA',
  progreso_bautismo: 0,
  proxima_accion: '',
  proxima_fecha_sugerida: '',
  responsable_usuario_id: ''
};

const FORM_DECISION_INICIAL = {
  decision_clave: '',
  decision_etiqueta: '',
  fecha_decision: '',
  observaciones: '',
  requiere_seguimiento: false,
  seguimiento_fecha_limite: '',
  seguimiento_titulo: '',
  seguimiento_descripcion: '',
  seguimiento_responsable_usuario_id: '',
  prioridad: 'MEDIA'
};

const FORM_ASIGNACION_INICIAL = {
  instructor_principal_nombre: '',
  instructor_principal_telefono: '',
  instructor_secundario_nombre: '',
  instructor_secundario_telefono: '',
  responsable_usuario_id: '',
  motivo_cambio: '',
  observaciones: ''
};

const FORM_INSTRUCTOR_INICIAL = {
  id: null,
  nombre_completo: '',
  usuario: '',
  password: '',
  password_confirmacion: '',
  cargo: '',
  activo: true
};

const FORM_ASIGNAR_INICIAL = {
  visita_id: '',
  visita_nombre: '',
  responsable_usuario_id: '',
  fecha_inicio: new Date().toISOString().slice(0, 10),
  frecuencia_periodo: 'SEMANA',
  frecuencia_cantidad: 1,
  modalidad: 'INDIVIDUAL',
  material_estudio: '',
  leccion_actual: '',
  observaciones: ''
};

export function useEstudiosBiblicos() {
  const [filtros, setFiltros] = useState({
    q: '',
    estado_general: '',
    origen_clave: '',
    responsable_usuario_id: '',
    fecha_desde: '',
    fecha_hasta: ''
  });
  const [dashboard, setDashboard] = useState({});
  const [estudios, setEstudios] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [instructores, setInstructores] = useState([]);
  const [campanas, setCampanas] = useState([]);
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [detalleVista, setDetalleVista] = useState('RESUMEN');
  const [estudioForm, setEstudioForm] = useState(FORM_ESTUDIO_INICIAL);
  const [sesionForm, setSesionForm] = useState(FORM_SESION_INICIAL);
  const [decisionForm, setDecisionForm] = useState(FORM_DECISION_INICIAL);
  const [asignacionForm, setAsignacionForm] = useState(FORM_ASIGNACION_INICIAL);
  const [instructorForm, setInstructorForm] = useState(FORM_INSTRUCTOR_INICIAL);
  const [asignarForm, setAsignarForm] = useState(FORM_ASIGNAR_INICIAL);
  const [editandoInstructorId, setEditandoInstructorId] = useState(null);

  const cargarCatalogos = useCallback(async () => {
    try {
      const [resUsuarios, resCampanas] = await Promise.all([
        estudioBiblicoApi.listarInstructores(),
        campanaApi.listar()
      ]);

      const listaInstructores = resUsuarios?.exito ? (resUsuarios.datos?.items || []) : [];
      setUsuarios(listaInstructores);
      setInstructores(listaInstructores);
      setCampanas(resCampanas?.exito ? (resCampanas?.datos?.items || []) : []);
    } catch {
      setUsuarios([]);
      setInstructores([]);
      setCampanas([]);
    }
  }, []);

  const cargarDashboard = useCallback(async () => {
    try {
      const res = await estudioBiblicoApi.dashboard(filtros);
      if (res?.exito) {
        setDashboard(res?.datos?.item || {});
      }
    } catch (error) {
      setDashboard({});
      notificarError(error?.mensaje || 'No se pudo cargar el dashboard de estudios bíblicos.');
    }
  }, [filtros]);

  const cargarEstudios = useCallback(async () => {
    setCargando(true);
    try {
      const res = await estudioBiblicoApi.listar(filtros);
      if (res?.exito) {
        const items = res?.datos?.items || [];
        setEstudios(items);
        setSeleccionadoId((prev) => {
          if (items.length === 0) return null;
          return items.some((item) => item.id === prev) ? prev : items[0].id;
        });
      }
    } catch (error) {
      setEstudios([]);
      setSeleccionadoId(null);
      notificarError(error?.mensaje || 'No se pudo cargar el listado de estudios bíblicos.');
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
      const res = await estudioBiblicoApi.obtenerPorId(id);
      if (res?.exito) {
        setDetalle(res?.datos?.item || null);
      }
    } catch (error) {
      setDetalle(null);
      notificarError(error?.mensaje || 'No se pudo cargar el detalle del estudio bíblico.');
    } finally {
      setCargandoDetalle(false);
    }
  }, []);

  useEffect(() => {
    cargarCatalogos();
  }, [cargarCatalogos]);

  useEffect(() => {
    cargarDashboard();
    cargarEstudios();
  }, [cargarDashboard, cargarEstudios]);

  useEffect(() => {
    cargarDetalle(seleccionadoId);
  }, [seleccionadoId, cargarDetalle]);

  useEffect(() => {
    if (!detalle) {
      setSesionForm(FORM_SESION_INICIAL);
      setDecisionForm(FORM_DECISION_INICIAL);
      setAsignacionForm(FORM_ASIGNACION_INICIAL);
      return;
    }

    setSesionForm(FORM_SESION_INICIAL);
    setDecisionForm(FORM_DECISION_INICIAL);
    setAsignacionForm({
      instructor_principal_nombre: detalle.instructor_principal_nombre || '',
      instructor_principal_telefono: '',
      instructor_secundario_nombre: detalle.instructor_secundario_nombre || '',
      instructor_secundario_telefono: '',
      responsable_usuario_id: detalle.responsable_usuario_id ? String(detalle.responsable_usuario_id) : '',
      motivo_cambio: '',
      observaciones: ''
    });
  }, [detalle]);

  const cambiarFiltro = useCallback((campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }, []);

  const resetEstudioForm = useCallback(() => {
    setEditandoId(null);
    setEstudioForm(FORM_ESTUDIO_INICIAL);
  }, []);

  const editarEstudio = useCallback((item) => {
    setEditandoId(item.id);
    setEstudioForm({
      persona_nombre: item.contacto_nombre || '',
      telefono: item.contacto_telefono || '',
      correo: '',
      direccion: '',
      barrio_comunidad: '',
      origen_clave: item.origen_clave || 'VISITA_IGLESIA',
      campana_origen_id: item.campana_origen_id ? String(item.campana_origen_id) : '',
      instructor_principal_nombre: item.instructor_principal_nombre || '',
      instructor_principal_telefono: '',
      instructor_secundario_nombre: item.instructor_secundario_nombre || '',
      instructor_secundario_telefono: '',
      responsable_usuario_id: item.responsable_usuario_id ? String(item.responsable_usuario_id) : '',
      modalidad: item.modalidad || 'INDIVIDUAL',
      material_estudio: item.material_estudio || '',
      leccion_actual: item.leccion_actual || '',
      total_lecciones_completadas: Number(item.total_lecciones_completadas || 0),
      fecha_inicio: item.fecha_inicio || '',
      frecuencia_periodo: item.frecuencia_periodo || 'SEMANA',
      frecuencia_cantidad: Number(item.frecuencia_cantidad || 1),
      proxima_sesion: item.proxima_sesion ? String(item.proxima_sesion).slice(0, 16) : '',
      estado_general: item.estado_general || 'NUEVO',
      observaciones: item.observaciones || '',
      motivo_cierre_pausa: item.motivo_cierre_pausa || '',
      motivo_reasignacion: ''
    });
  }, []);

  const guardarEstudio = useCallback(async () => {
    setGuardando(true);
    try {
      const payload = {
        ...estudioForm,
        campana_origen_id: estudioForm.campana_origen_id || null,
        responsable_usuario_id: estudioForm.responsable_usuario_id || null,
        total_lecciones_completadas: Number(estudioForm.total_lecciones_completadas || 0),
        frecuencia_cantidad: Number(estudioForm.frecuencia_cantidad || 1)
      };

      const res = editandoId
        ? await estudioBiblicoApi.actualizar(editandoId, payload)
        : await estudioBiblicoApi.crear(payload);

      if (res?.exito) {
        const item = res?.datos?.item || null;
        notificarExito(res.mensaje || 'Estudio bíblico guardado correctamente.');
        resetEstudioForm();
        await cargarDashboard();
        await cargarEstudios();
        if (item?.id) {
          setSeleccionadoId(item.id);
        }
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo guardar el estudio bíblico.');
    } finally {
      setGuardando(false);
    }
  }, [estudioForm, editandoId, resetEstudioForm, cargarDashboard, cargarEstudios]);

  const archivarEstudio = useCallback(async (id) => {
    const ok = await confirmar('Este estudio bíblico se archivará. ¿Desea continuar?');
    if (!ok) return;

    try {
      const res = await estudioBiblicoApi.eliminar(id);
      if (res?.exito) {
        notificarExito(res.mensaje || 'Estudio bíblico archivado.');
        if (seleccionadoId === id) {
          setSeleccionadoId(null);
          setDetalle(null);
        }
        await cargarDashboard();
        await cargarEstudios();
        resetEstudioForm();
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo archivar el estudio bíblico.');
    }
  }, [seleccionadoId, cargarDashboard, cargarEstudios, resetEstudioForm]);

  const guardarSesion = useCallback(async () => {
    if (!seleccionadoId) return;
    try {
      const payload = {
        ...sesionForm,
        progreso_bautismo: Number(sesionForm.progreso_bautismo || 0),
        responsable_usuario_id: sesionForm.responsable_usuario_id || null
      };
      const res = await estudioBiblicoApi.crearSesion(seleccionadoId, payload);
      if (res?.exito) {
        notificarExito(res.mensaje || 'Sesión registrada correctamente.');
        setSesionForm(FORM_SESION_INICIAL);
        await cargarDetalle(seleccionadoId);
        await cargarDashboard();
        await cargarEstudios();
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo registrar la sesión.');
    }
  }, [seleccionadoId, sesionForm, cargarDetalle, cargarDashboard, cargarEstudios]);

  const guardarDecision = useCallback(async () => {
    if (!seleccionadoId) return;
    try {
      const payload = {
        ...decisionForm,
        seguimiento_responsable_usuario_id: decisionForm.seguimiento_responsable_usuario_id || null
      };
      const res = await estudioBiblicoApi.crearDecision(seleccionadoId, payload);
      if (res?.exito) {
        notificarExito(res.mensaje || 'Decisión registrada correctamente.');
        setDecisionForm(FORM_DECISION_INICIAL);
        await cargarDetalle(seleccionadoId);
        await cargarDashboard();
        await cargarEstudios();
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo registrar la decisión.');
    }
  }, [seleccionadoId, decisionForm, cargarDetalle, cargarDashboard, cargarEstudios]);

  const guardarAsignacion = useCallback(async () => {
    if (!seleccionadoId) return;
    try {
      const payload = {
        ...asignacionForm,
        responsable_usuario_id: asignacionForm.responsable_usuario_id || null
      };
      const res = await estudioBiblicoApi.crearAsignacion(seleccionadoId, payload);
      if (res?.exito) {
        notificarExito(res.mensaje || 'Asignación actualizada correctamente.');
        setAsignacionForm(FORM_ASIGNACION_INICIAL);
        await cargarDetalle(seleccionadoId);
        await cargarDashboard();
        await cargarEstudios();
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo actualizar la asignación.');
    }
  }, [seleccionadoId, asignacionForm, cargarDetalle, cargarDashboard, cargarEstudios]);

  const resetInstructorForm = useCallback(() => {
    setEditandoInstructorId(null);
    setInstructorForm(FORM_INSTRUCTOR_INICIAL);
  }, []);

  const editarInstructor = useCallback((item) => {
    setEditandoInstructorId(item.id);
    setInstructorForm({
      id: item.id,
      nombre_completo: item.nombre_completo || '',
      usuario: item.usuario || '',
      password: '',
      password_confirmacion: '',
      cargo: item.cargo || '',
      activo: item.activo ?? true
    });
  }, []);

  const cargarInstructores = useCallback(async () => {
    try {
      const res = await estudioBiblicoApi.listarInstructores();
      if (res?.exito) {
        const items = res?.datos?.items || [];
        setInstructores(items);
        setUsuarios(items);
      }
    } catch {
      setInstructores([]);
      setUsuarios([]);
    }
  }, []);

  const guardarInstructor = useCallback(async () => {
    if (!instructorForm.nombre_completo.trim() || !instructorForm.usuario.trim() || !instructorForm.cargo.trim()) {
      notificarError('Nombre, usuario y cargo son obligatorios.');
      return false;
    }
    if (!editandoInstructorId && (!instructorForm.password || !instructorForm.password_confirmacion)) {
      notificarError('La contraseña y su confirmación son obligatorias.');
      return false;
    }
    if (instructorForm.password && instructorForm.password !== instructorForm.password_confirmacion) {
      notificarError('Las contraseñas no coinciden.');
      return false;
    }

    setGuardando(true);
    try {
      const payload = {
        nombre_completo: instructorForm.nombre_completo,
        usuario: instructorForm.usuario,
        cargo: instructorForm.cargo,
        ...(instructorForm.password ? { password: instructorForm.password } : {}),
        activo: instructorForm.activo
      };
      const res = editandoInstructorId
        ? await estudioBiblicoApi.actualizarInstructor(editandoInstructorId, payload)
        : await estudioBiblicoApi.crearInstructor(payload);

      if (res?.exito) {
        notificarExito(res.mensaje || 'Instructor guardado correctamente.');
        resetInstructorForm();
        await cargarInstructores();
        return true;
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo guardar el instructor.');
    } finally {
      setGuardando(false);
    }
    return false;
  }, [instructorForm, editandoInstructorId, resetInstructorForm, cargarInstructores]);

  const eliminarInstructor = useCallback(async (id) => {
    const ok = await confirmar('Este instructor se desactivará. ¿Desea continuar?');
    if (!ok) return false;
    try {
      const res = await estudioBiblicoApi.eliminarInstructor(id);
      if (res?.exito) {
        notificarExito(res.mensaje || 'Instructor desactivado.');
        await cargarInstructores();
        return true;
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo desactivar el instructor.');
    }
    return false;
  }, [cargarInstructores]);

  const guardarAsignarEstudio = useCallback(async () => {
    if (!asignarForm.visita_id) {
      notificarError('Seleccione una visita.');
      return false;
    }
    if (!asignarForm.responsable_usuario_id) {
      notificarError('Seleccione un instructor responsable.');
      return false;
    }

    setGuardando(true);
    try {
      const payload = {
        ...asignarForm,
        frecuencia_cantidad: Number(asignarForm.frecuencia_cantidad || 1)
      };
      const res = await estudioBiblicoApi.asignarDesdeVisita(payload);
      if (res?.exito) {
        notificarExito(res.mensaje || 'Estudio asignado correctamente.');
        setAsignarForm(FORM_ASIGNAR_INICIAL);
        await Promise.all([cargarDashboard(), cargarEstudios()]);
        const item = res?.datos?.item;
        if (item?.id) setSeleccionadoId(item.id);
        return true;
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo asignar el estudio.');
    } finally {
      setGuardando(false);
    }
    return false;
  }, [asignarForm, cargarDashboard, cargarEstudios]);

  const guardarSesionDirecta = useCallback(async (estudioId, form) => {
    if (!estudioId) return false;
    setGuardando(true);
    try {
      const payload = {
        ...form,
        progreso_bautismo: Number(form.progreso_bautismo || 0),
        responsable_usuario_id: form.responsable_usuario_id || null
      };
      const res = await estudioBiblicoApi.crearSesion(estudioId, payload);
      if (res?.exito) {
        notificarExito(res.mensaje || 'Sesión registrada correctamente.');
        await Promise.all([cargarDashboard(), cargarEstudios()]);
        if (seleccionadoId === estudioId) await cargarDetalle(estudioId);
        return true;
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo registrar la sesión.');
    } finally {
      setGuardando(false);
    }
    return false;
  }, [cargarDashboard, cargarEstudios, cargarDetalle, seleccionadoId]);

  const cambiarEstadoEstudio = useCallback(async (id, estado, motivo = '') => {
    try {
      const res = await estudioBiblicoApi.cambiarEstado(id, {
        estado_general: estado,
        motivo_cierre_pausa: motivo
      });
      if (res?.exito) {
        notificarExito(res.mensaje || 'Estado actualizado.');
        await Promise.all([cargarDashboard(), cargarEstudios()]);
        if (seleccionadoId === id) await cargarDetalle(id);
        return true;
      }
    } catch (error) {
      notificarError(error?.mensaje || 'No se pudo actualizar el estado.');
    }
    return false;
  }, [cargarDashboard, cargarEstudios, cargarDetalle, seleccionadoId]);

  const asignaciones = useMemo(() => detalle?.asignaciones || [], [detalle]);
  const sesiones = useMemo(() => detalle?.sesiones || [], [detalle]);
  const decisiones = useMemo(() => detalle?.decisiones || [], [detalle]);

  const recargar = useCallback(async () => {
    await cargarDashboard();
    await cargarEstudios();
    await cargarInstructores();
    if (seleccionadoId) {
      await cargarDetalle(seleccionadoId);
    }
  }, [cargarDashboard, cargarEstudios, cargarInstructores, seleccionadoId, cargarDetalle]);

  return {
    filtros,
    dashboard,
    estudios,
    usuarios,
    instructores,
    campanas,
    seleccionadoId,
    setSeleccionadoId,
    detalle,
    cargando,
    cargandoDetalle,
    guardando,
    editandoId,
    detalleVista,
    setDetalleVista,
    estudioForm,
    setEstudioForm,
    sesionForm,
    setSesionForm,
    decisionForm,
    setDecisionForm,
    asignacionForm,
    setAsignacionForm,
    instructorForm,
    setInstructorForm,
    asignarForm,
    setAsignarForm,
    editandoInstructorId,
    asignaciones,
    sesiones,
    decisiones,
    cambiarFiltro,
    editarEstudio,
    resetEstudioForm,
    guardarEstudio,
    archivarEstudio,
    guardarSesion,
    guardarDecision,
    guardarAsignacion,
    cargarInstructores,
    editarInstructor,
    resetInstructorForm,
    guardarInstructor,
    eliminarInstructor,
    guardarAsignarEstudio,
    guardarSesionDirecta,
    cambiarEstadoEstudio,
    recargar
  };
}
