import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSetupAdministrador } from '../hooks/useSetupAdministrador';
import { useAuth } from '../hooks/useAuth';
import { CATEGORIAS_METRICA_OPCIONES } from '../utils/metricasConfig';
import InfoCategoriasMetricas from '../components/administrador/InfoCategoriasMetricas';
import InfoRolesUsuarios from '../components/administrador/InfoRolesUsuarios';
import UsuarioPage, {
  OPCIONES_USUARIO,
  SECCION_USUARIOS
} from './UsuarioPage';
import {
  EVENT_ADMIN_ABRIR_CATEGORIAS_METRICAS,
  EVENT_ADMIN_ABRIR_CULTOS,
  EVENT_ADMIN_ABRIR_METRICAS,
  EVENT_ADMIN_ABRIR_PROCEDENCIAS,
  EVENT_ADMIN_ABRIR_USUARIOS,
  EVENT_ADMIN_VISTA_ACTIVA
} from '../config/events';
import { confirmar } from '../utils/notify';

const VISTA_RESUMEN = 'RESUMEN';
const VISTA_CULTOS = 'CULTOS';
const VISTA_METRICAS = 'METRICAS';
const VISTA_PROCEDENCIAS = 'PROCEDENCIAS';
const VISTA_CATEGORIAS_METRICAS = 'CATEGORIAS_METRICAS';
const VISTA_USUARIOS = 'USUARIOS';
const CATEGORIAS_AUTOMATICAS = new Set(['procedencia', 'visitas']);
const CATEGORIAS_METRICA_OPCIONES_MANUALES = CATEGORIAS_METRICA_OPCIONES.filter(
  (opcion) => !CATEGORIAS_AUTOMATICAS.has(opcion.valor)
);

const DESCRIPCIONES_CATEGORIA_METRICA = {
  informacion_culto: 'Datos de control del culto, por ejemplo llegadas antes y después de la hora.',
  composicion_asistentes: 'Composición demográfica de asistentes, como niños y jóvenes.',
  procedencia: 'Conteos por zona de procedencia para medir origen de asistentes.',
  visitas: 'Métricas de visitas y nombres de visitas por procedencia.',
  permanencia: 'Métricas relacionadas con permanencia durante el culto.',
  total_asistentes: 'Métrica total de asistentes, calculada según reglas del sistema.',
  observaciones: 'Campos descriptivos para notas y observaciones del registro.',
  adicionales: 'Métricas opcionales para necesidades específicas de una iglesia o grupo.'
};

const ACCESO_ROLES_PRELIMINAR = [
  {
    rol: 'Administrador',
    estado: 'En definición',
    detalle: 'Acceso operativo amplio. Alcance final pendiente según módulos restantes.'
  },
  {
    rol: 'Secretario/a',
    estado: 'En definición',
    detalle: 'Accesos orientados a registro y seguimiento. Permisos finales pendientes.'
  },
  {
    rol: 'Ministerio personal',
    estado: 'En definición',
    detalle: 'Espacio reservado para reglas futuras de visitas y consolidación.'
  }
];

const INFO_SECCIONES = [
  {
    id: 'METRICAS',
    etiqueta: 'Métricas',
    icono: 'bi-journal-text',
    descripcion: 'Estas categorías organizan el formulario de Nuevo registro y ayudan a ubicar cada métrica en su sección correcta.'
  },
  {
    id: 'ROLES',
    etiqueta: 'Roles por usuario',
    icono: 'bi-shield-check',
    descripcion: 'Resumen visual de accesos por rol. El detalle final se completará conforme cerremos los módulos pendientes.'
  }
];

function agruparEnPares(items = []) {
  const grupos = [];
  for (let index = 0; index < items.length; index += 2) {
    grupos.push(items.slice(index, index + 2));
  }
  return grupos;
}

function BadgeEstado({ completo }) {
  return (
    <span className={`badge w-100 text-center py-2 ${completo ? 'text-bg-success' : 'text-bg-warning'}`}>
      {completo ? 'Setup completo' : 'Setup pendiente'}
    </span>
  );
}

function traducirFaltante(item) {
  switch (item) {
    case 'cultos':
      return 'Definir al menos un culto activo';
    case 'procedencias_minimas':
      return 'Definir al menos una procedencia';
    case 'procedencias_maximas':
      return 'Reducir procedencias a máximo 10';
    case 'metricas':
      return 'Debe habilitar al menos una métrica en el panel de Métricas.';
    case 'admin_definitivo':
      return 'Crear al menos un usuario administrador definitivo.';
    case 'dependencias_metricas':
      return null;
    default:
      return item;
  }
}

function obtenerFaltantesVisibles(faltantes = []) {
  return (Array.isArray(faltantes) ? faltantes : [])
    .map((item) => traducirFaltante(item))
    .filter((item) => typeof item === 'string' && item.trim() !== '');
}

function resolverEstadoBloques(faltantes = []) {
  const lista = new Set(Array.isArray(faltantes) ? faltantes : []);
  return {
    cultos: !lista.has('cultos'),
    metricas: !lista.has('metricas'),
    procedencias: !lista.has('procedencias_minimas') && !lista.has('procedencias_maximas'),
    usuarios: !lista.has('admin_definitivo')
  };
}

function EstadoBloqueCard({ titulo, detalle, completo }) {
  return (
    <div className={`card h-100 shadow-sm admin-setup-step-card ${completo ? 'is-complete' : 'is-pending'}`}>
      <div className="card-body">
        <div className="d-flex align-items-start justify-content-between gap-2">
          <h3 className="h6 mb-2">{titulo}</h3>
          <span className={`badge ${completo ? 'text-bg-success' : 'text-bg-warning'}`}>
            {completo ? 'Listo' : 'Pendiente'}
          </span>
        </div>
        <p className="text-muted mb-0 small">{detalle}</p>
      </div>
    </div>
  );
}

function BotonCerrarPanel({ onClick, label }) {
  return (
    <button
      type="button"
      className="btn btn-outline-light btn-sm admin-panel-close"
      onClick={onClick}
      aria-label={label}
      title="Cerrar"
    >
      <i className="bi bi-x-lg" aria-hidden="true"></i>
    </button>
  );
}

function BotonAccionPanel({
  onClick,
  disabled = false,
  label,
  icono,
  className = 'btn btn-light btn-sm',
  title = label
}) {
  return (
    <button
      type="button"
      className={`${className} admin-responsive-action-btn`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={title}
    >
      <i className={`bi ${icono}`} aria-hidden="true"></i>
      <span className="admin-responsive-btn-label">{label}</span>
    </button>
  );
}

export default function AdministradorPage() {
  const { esAdminTemporal, diasRestantesPassword } = useAuth();
  const {
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
    tieneCambiosCultos,
    tieneCambiosProcedencias,
    tieneCambiosMetricas,
    metricasAdicionalesCount,
    maxMetricasAdicionales,
    maxCultosInstancia,
    puedeAgregarMetrica,
    restaurarCultos,
    restaurarProcedencias,
    restaurarMetricas,
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
  } = useSetupAdministrador();

  const [vistaActiva, setVistaActiva] = useState(VISTA_RESUMEN);
  const [infoSeccionActiva, setInfoSeccionActiva] = useState(INFO_SECCIONES[0].id);
  const [slideResumenActivo, setSlideResumenActivo] = useState(0);
  const [slideInfoActivo, setSlideInfoActivo] = useState(0);
  const [usuarioSeccionActiva, setUsuarioSeccionActiva] = useState(SECCION_USUARIOS);
  const metricaPendienteFocusRef = useRef(null);
  const metricaInputRefs = useRef(new Map());
  const autoFinalizacionSolicitadaRef = useRef(false);
  const resumenTouchStartXRef = useRef(null);
  const infoTouchStartXRef = useRef(null);
  const estadoSetupNormalizado = String(resumen.estado_setup || '').toUpperCase();
  const setupCompleto = estadoSetupNormalizado === 'COMPLETO' && !Boolean(resumen.bloqueada_operacion);
  const faltantes = useMemo(
    () => (Array.isArray(resumen.faltantes) ? resumen.faltantes : []),
    [resumen.faltantes]
  );
  const faltantesVisibles = useMemo(() => obtenerFaltantesVisibles(faltantes), [faltantes]);
  const estadoBloques = useMemo(() => resolverEstadoBloques(faltantes), [faltantes]);
  const diasRestantes = Number.isInteger(diasRestantesPassword) ? Math.max(diasRestantesPassword, 0) : null;
  const cultosActivos = cultos.filter((item) => item.activo).length;
  const metricasHabilitadas = metricas.filter((item) => item.habilitado).length;
  const procedenciasActivas = procedencias.filter((item) => item.activo).length;
  const adminsDefinitivosActivos = Number.isFinite(Number(resumen.admins_definitivos_activos))
    ? Number(resumen.admins_definitivos_activos)
    : 0;
  const tarjetasResumen = useMemo(() => ([
    {
      id: 'cultos',
      titulo: 'Cultos',
      detalle: `${cultosActivos} activo(s) de ${cultos.length} configurado(s)`,
      completo: estadoBloques.cultos
    },
    {
      id: 'procedencias',
      titulo: 'Procedencias (1 a 10)',
      detalle: `${procedenciasActivas} activa(s) de ${procedencias.length} configurada(s)`,
      completo: estadoBloques.procedencias
    },
    {
      id: 'metricas',
      titulo: 'Métricas del formulario',
      detalle: `${metricasHabilitadas} habilitada(s) de ${metricas.length} configurada(s)`,
      completo: estadoBloques.metricas
    },
    {
      id: 'usuarios',
      titulo: 'Usuarios administradores',
      detalle: `${adminsDefinitivosActivos} administrador(es) definitivo(s) activo(s)`,
      completo: estadoBloques.usuarios
    }
  ]), [
    adminsDefinitivosActivos,
    cultos.length,
    cultosActivos,
    estadoBloques.cultos,
    estadoBloques.metricas,
    estadoBloques.procedencias,
    estadoBloques.usuarios,
    metricas.length,
    metricasHabilitadas,
    procedencias.length,
    procedenciasActivas
  ]);
  const slidesResumen = useMemo(() => agruparEnPares(tarjetasResumen), [tarjetasResumen]);
  const itemsInfoActivos = infoSeccionActiva === 'METRICAS'
    ? CATEGORIAS_METRICA_OPCIONES
    : ACCESO_ROLES_PRELIMINAR;
  const slidesInfo = useMemo(() => agruparEnPares(itemsInfoActivos), [itemsInfoActivos]);
  const registrarInputMetricaRef = useCallback((uiId, node) => {
    if (!uiId) return;
    if (node) {
      metricaInputRefs.current.set(uiId, node);
      return;
    }
    metricaInputRefs.current.delete(uiId);
  }, []);
  const manejarAgregarMetrica = useCallback(() => {
    const nuevaUiId = agregarMetrica();
    if (nuevaUiId) {
      metricaPendienteFocusRef.current = nuevaUiId;
    }
  }, [agregarMetrica]);

  const abrirVistaDesdeTopbar = useCallback(async (nuevaVista) => {
    if (vistaActiva === nuevaVista) {
      return;
    }

    let tieneCambios = false;
    let etiqueta = '';
    let restaurarFn = null;

    if (vistaActiva === VISTA_CULTOS) {
      tieneCambios = tieneCambiosCultos;
      etiqueta = 'cultos';
      restaurarFn = restaurarCultos;
    } else if (vistaActiva === VISTA_METRICAS) {
      tieneCambios = tieneCambiosMetricas;
      etiqueta = 'métricas';
      restaurarFn = restaurarMetricas;
    } else if (vistaActiva === VISTA_PROCEDENCIAS) {
      tieneCambios = tieneCambiosProcedencias;
      etiqueta = 'procedencias';
      restaurarFn = restaurarProcedencias;
    }

    if (tieneCambios && restaurarFn) {
      const confirmado = await confirmar(
        `Tiene cambios sin guardar en ${etiqueta}. ¿Desea descartarlos y cerrar?`
      );
      if (!confirmado) {
        return;
      }
      restaurarFn();
    }

    setVistaActiva(nuevaVista);
  }, [
    vistaActiva,
    tieneCambiosCultos,
    tieneCambiosMetricas,
    tieneCambiosProcedencias,
    restaurarCultos,
    restaurarMetricas,
    restaurarProcedencias
  ]);

  useEffect(() => {
    const manejarAbrirCultos = () => { void abrirVistaDesdeTopbar(VISTA_CULTOS); };
    const manejarAbrirMetricas = () => { void abrirVistaDesdeTopbar(VISTA_METRICAS); };
    const manejarAbrirProcedencias = () => { void abrirVistaDesdeTopbar(VISTA_PROCEDENCIAS); };
    const manejarAbrirCategorias = () => { void abrirVistaDesdeTopbar(VISTA_CATEGORIAS_METRICAS); };
    const manejarAbrirUsuarios = () => { void abrirVistaDesdeTopbar(VISTA_USUARIOS); };

    window.addEventListener(EVENT_ADMIN_ABRIR_CULTOS, manejarAbrirCultos);
    window.addEventListener(EVENT_ADMIN_ABRIR_METRICAS, manejarAbrirMetricas);
    window.addEventListener(EVENT_ADMIN_ABRIR_PROCEDENCIAS, manejarAbrirProcedencias);
    window.addEventListener(EVENT_ADMIN_ABRIR_CATEGORIAS_METRICAS, manejarAbrirCategorias);
    window.addEventListener(EVENT_ADMIN_ABRIR_USUARIOS, manejarAbrirUsuarios);

    return () => {
      window.removeEventListener(EVENT_ADMIN_ABRIR_CULTOS, manejarAbrirCultos);
      window.removeEventListener(EVENT_ADMIN_ABRIR_METRICAS, manejarAbrirMetricas);
      window.removeEventListener(EVENT_ADMIN_ABRIR_PROCEDENCIAS, manejarAbrirProcedencias);
      window.removeEventListener(EVENT_ADMIN_ABRIR_CATEGORIAS_METRICAS, manejarAbrirCategorias);
      window.removeEventListener(EVENT_ADMIN_ABRIR_USUARIOS, manejarAbrirUsuarios);
    };
  }, [abrirVistaDesdeTopbar]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(EVENT_ADMIN_VISTA_ACTIVA, {
        detail: { vista: vistaActiva }
      })
    );
  }, [vistaActiva]);

  useEffect(() => {
    const metricaPendienteFocus = metricaPendienteFocusRef.current;
    if (!metricaPendienteFocus) {
      return;
    }
    const input = metricaInputRefs.current.get(metricaPendienteFocus);
    if (!input) {
      return;
    }
    input.focus();
    input.select?.();
    input.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    metricaPendienteFocusRef.current = null;
  }, [metricas]);

  const mostrarResumen = vistaActiva === VISTA_RESUMEN;
  const mostrarCultos = vistaActiva === VISTA_CULTOS;
  const mostrarMetricas = vistaActiva === VISTA_METRICAS;
  const mostrarProcedencias = vistaActiva === VISTA_PROCEDENCIAS;
  const mostrarCategoriasMetricas = vistaActiva === VISTA_CATEGORIAS_METRICAS;
  const mostrarUsuarios = vistaActiva === VISTA_USUARIOS;
  const mensajeEncabezado = setupCompleto
    ? 'Configuración inicial completada. Ya puede registrar asistencia, ver reportes/estadísticas y crear usuarios; también puede editar el setup cuando lo necesite.'
    : 'Complete la configuración inicial para habilitar registro, reportes y estadísticas. Debe crear al menos un administrador definitivo.';
  const textoBotonEditarSetup = 'Editar setup';

  const cambiarSlideResumen = useCallback((direccion) => {
    if (slidesResumen.length <= 1) return;
    setSlideResumenActivo((prev) => (prev + direccion + slidesResumen.length) % slidesResumen.length);
  }, [slidesResumen.length]);

  const manejarTouchInicioResumen = useCallback((event) => {
    resumenTouchStartXRef.current = event.changedTouches?.[0]?.clientX ?? null;
  }, []);

  const manejarTouchFinResumen = useCallback((event) => {
    const inicio = resumenTouchStartXRef.current;
    const fin = event.changedTouches?.[0]?.clientX ?? null;
    resumenTouchStartXRef.current = null;
    if (inicio == null || fin == null) return;

    const delta = fin - inicio;
    if (Math.abs(delta) < 42) return;

    cambiarSlideResumen(delta < 0 ? 1 : -1);
  }, [cambiarSlideResumen]);

  useEffect(() => {
    if (!mostrarResumen || slidesResumen.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setSlideResumenActivo((prev) => (prev + 1) % slidesResumen.length);
    }, 8000);

    return () => window.clearInterval(timer);
  }, [mostrarResumen, slidesResumen.length]);

  useEffect(() => {
    setSlideResumenActivo((prev) => {
      if (slidesResumen.length <= 1) return 0;
      return prev >= slidesResumen.length ? 0 : prev;
    });
  }, [slidesResumen.length]);

  const cambiarSlideInfo = useCallback((direccion) => {
    if (slidesInfo.length <= 1) return;
    setSlideInfoActivo((prev) => (prev + direccion + slidesInfo.length) % slidesInfo.length);
  }, [slidesInfo.length]);

  const manejarTouchInicioInfo = useCallback((event) => {
    infoTouchStartXRef.current = event.changedTouches?.[0]?.clientX ?? null;
  }, []);

  const manejarTouchFinInfo = useCallback((event) => {
    const inicio = infoTouchStartXRef.current;
    const fin = event.changedTouches?.[0]?.clientX ?? null;
    infoTouchStartXRef.current = null;
    if (inicio == null || fin == null) return;

    const delta = fin - inicio;
    if (Math.abs(delta) < 42) return;

    cambiarSlideInfo(delta < 0 ? 1 : -1);
  }, [cambiarSlideInfo]);

  useEffect(() => {
    if (!mostrarCategoriasMetricas || slidesInfo.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setSlideInfoActivo((prev) => (prev + 1) % slidesInfo.length);
    }, 8000);

    return () => window.clearInterval(timer);
  }, [mostrarCategoriasMetricas, slidesInfo.length]);

  useEffect(() => {
    setSlideInfoActivo((prev) => {
      if (slidesInfo.length <= 1) return 0;
      return prev >= slidesInfo.length ? 0 : prev;
    });
  }, [slidesInfo.length, infoSeccionActiva]);

  useEffect(() => {
    if (setupCompleto) {
      autoFinalizacionSolicitadaRef.current = false;
      return;
    }

    if (faltantes.length > 0) {
      autoFinalizacionSolicitadaRef.current = false;
      return;
    }

    if (finalizando || autoFinalizacionSolicitadaRef.current) {
      return;
    }

    autoFinalizacionSolicitadaRef.current = true;
    void (async () => {
      const ok = await finalizarSetup();
      if (!ok) {
        autoFinalizacionSolicitadaRef.current = false;
      }
    })();
  }, [setupCompleto, faltantes, finalizando, finalizarSetup]);

  const manejarEliminarCulto = async (index) => {
    if (cultos.length <= 1) {
      return;
    }
    const confirmado = await confirmar(
      '¿Desea eliminar este culto? Si ya existen registros asociados, el sistema podría rechazar el cambio al guardar.'
    );
    if (!confirmado) {
      return;
    }
    eliminarCulto(index);
  };

  const manejarEliminarMetrica = async (index) => {
    if (metricas.length <= 1 || metricas[index]?.es_fija) {
      return;
    }
    const confirmado = await confirmar(
      '¿Desea eliminar esta métrica? Esta acción puede afectar reportes y comparaciones configuradas.'
    );
    if (!confirmado) {
      return;
    }
    eliminarMetrica(index);
  };

  const manejarEliminarProcedencia = async (index) => {
    if (procedencias.length <= 1) {
      return;
    }
    const confirmado = await confirmar(
      '¿Desea eliminar esta procedencia? Si ya existen registros asociados, el sistema puede rechazar el cambio al guardar.'
    );
    if (!confirmado) {
      return;
    }
    eliminarProcedencia(index);
  };

  const manejarCerrarPanelConDescartar = async (etiqueta, tieneCambios, restaurarFn) => {
    if (tieneCambios) {
      const confirmado = await confirmar(
        `Tiene cambios sin guardar en ${etiqueta}. ¿Desea descartarlos y cerrar?`
      );
      if (!confirmado) {
        return;
      }
      restaurarFn();
    }
    setVistaActiva(VISTA_RESUMEN);
  };

  const manejarLimpiarPanel = (tieneCambios, restaurarFn) => {
    if (!tieneCambios) {
      return;
    }
    restaurarFn();
  };

  const indiceInfoActivo = INFO_SECCIONES.findIndex((item) => item.id === infoSeccionActiva);
  const metaInfoActiva = INFO_SECCIONES[indiceInfoActivo >= 0 ? indiceInfoActivo : 0];

  return (
    <div className="container-fluid py-4">
      {mostrarResumen && (
        <>
          <div className="card border-0 shadow-sm mb-4 admin-setup-hero">
            <div className="card-body">
              <div className="mb-3">
                <p className="text-muted mb-0">
                  {mensajeEncabezado}
                </p>
              </div>

              <div className="row g-3 align-items-stretch">
                <div className="col-12 col-lg-8">
                  <div className="alert alert-iasd mb-0">
                    <strong>Estado actual:</strong> {resumen.estado_setup}
                    {resumen.setup_completado_en ? ` | completado en ${resumen.setup_completado_en}` : ''}
                    {resumen.ultima_revision_en ? ` | última revisión ${resumen.ultima_revision_en}` : ''}
                  </div>
                </div>
                <div className="col-12 col-lg-4">
                  <div className="d-flex flex-column gap-2 h-100 admin-setup-side-actions">
                    <BadgeEstado completo={setupCompleto} />
                    {setupCompleto ? (
                      <button
                        type="button"
                        className="btn btn-primary w-100"
                        onClick={() => setVistaActiva(VISTA_CULTOS)}
                      >
                        {textoBotonEditarSetup}
                      </button>
                    ) : (
                      <div className="small text-muted text-center">
                        {finalizando
                          ? 'Finalizando setup automáticamente...'
                          : 'El setup se finalizará automáticamente al completar todos los requisitos.'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {esAdminTemporal && (
                <div className="alert alert-warning mt-3 mb-0">
                  <strong>Cuenta ADMIN temporal:</strong>{' '}
                  {Number.isInteger(diasRestantes)
                    ? `dispone de ${diasRestantes} día(s) restantes para completar el setup inicial.`
                    : 'debe completarse el setup inicial dentro de los 5 días posteriores a la creación del usuario.'}
                </div>
              )}
            </div>
          </div>

          <div className="row g-3 mb-3 d-none d-lg-flex">
            {tarjetasResumen.map((item) => (
              <div className="col-lg-6" key={item.id}>
                <EstadoBloqueCard
                  titulo={item.titulo}
                  detalle={item.detalle}
                  completo={item.completo}
                />
              </div>
            ))}
          </div>

          <div
            className="admin-resumen-carousel mb-3 d-lg-none"
            onTouchStart={manejarTouchInicioResumen}
            onTouchEnd={manejarTouchFinResumen}
          >
            <div
              className="admin-resumen-track"
              style={{ transform: `translateX(-${slideResumenActivo * 100}%)` }}
            >
              {slidesResumen.map((slide, slideIndex) => (
                <div className="admin-resumen-slide" key={`slide_resumen_${slideIndex}`}>
                  <div className="row g-3 admin-resumen-slide-grid">
                    {slide.map((item) => (
                      <div className="col-12 col-md-6" key={item.id}>
                        <EstadoBloqueCard
                          titulo={item.titulo}
                          detalle={item.detalle}
                          completo={item.completo}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {faltantesVisibles.length > 0 && (
            <div className="alert alert-warning">
              <strong className="d-block mb-2">Pendientes por completar:</strong>
              <ul className="mb-0">
                {faltantesVisibles.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

        </>
      )}

      {mostrarCultos && (
        <div className="card shadow-sm mb-4 admin-setup-panel">
          <div className="card-header d-flex justify-content-between align-items-center gap-2">
            <div className="d-flex align-items-center gap-2">
              <h5 className="mb-0" style={{ color: '#FFFFFF' }}>Cultos</h5>
              <span className="badge text-bg-light">{cultos.length}/{maxCultosInstancia}</span>
            </div>
            <BotonCerrarPanel
              onClick={() => {
                void manejarCerrarPanelConDescartar('cultos', tieneCambiosCultos, restaurarCultos);
              }}
              label="Cerrar panel de cultos"
            />
          </div>
          <div className="card-body">
            {erroresCultos.general && <div className="alert alert-danger">{erroresCultos.general}</div>}

            <div className="table-responsive admin-tabla-scroll-x">
              <div className="admin-setup-tabla-wrap admin-setup-tabla-wrap-cultos">
                <table className="table table-sm align-middle mb-0">
                <colgroup>
                  <col className="admin-col-culto-nombre" />
                  <col className="admin-col-culto-dia" />
                  <col className="admin-col-culto-hora" />
                  <col className="admin-col-check" />
                  <col className="admin-col-acciones" />
                </colgroup>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Día</th>
                    <th>Hora</th>
                    <th className="text-center admin-col-check">Activo</th>
                    <th className="text-center admin-col-acciones">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cultos.map((item, index) => {
                    const filaErrores = erroresCultos[`fila_${index}`] || {};
                    return (
                      <tr key={item.ui_id}>
                        <td>
                          <input
                            className={`form-control form-control-sm admin-input-culto-nombre ${filaErrores.nombre ? 'is-invalid' : ''}`}
                            value={item.nombre}
                            maxLength={25}
                            onChange={(event) => cambiarCulto(index, 'nombre', event.target.value)}
                          />
                        </td>
                        <td>
                          <select
                            className={`form-select form-select-sm admin-select-culto-dia ${filaErrores.dia_semana ? 'is-invalid' : ''}`}
                            value={item.dia_semana}
                            onChange={(event) => cambiarCulto(index, 'dia_semana', event.target.value)}
                          >
                            {DIA_OPCIONES.map((dia) => (
                              <option key={dia.valor} value={dia.valor}>{dia.etiqueta}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="time"
                            className={`form-control form-control-sm admin-input-culto-hora ${filaErrores.hora_inicio ? 'is-invalid' : ''}`}
                            value={item.hora_inicio}
                            onChange={(event) => cambiarCulto(index, 'hora_inicio', event.target.value)}
                          />
                        </td>
                        <td className="text-center">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={!!item.activo}
                            onChange={(event) => cambiarCulto(index, 'activo', event.target.checked)}
                          />
                        </td>
                        <td className="text-center admin-col-acciones">
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm admin-table-icon-btn"
                            onClick={() => { void manejarEliminarCulto(index); }}
                            disabled={cultos.length <= 1}
                            title="Eliminar culto"
                            aria-label="Eliminar culto"
                          >
                            <i className="bi bi-trash" aria-hidden="true"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>

            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
              <div className="d-flex flex-wrap align-items-center gap-2">
                <BotonAccionPanel
                  onClick={agregarCulto}
                  disabled={cultos.length >= maxCultosInstancia}
                  title={cultos.length >= maxCultosInstancia ? `Máximo ${maxCultosInstancia} cultos` : 'Agregar culto'}
                  label="Agregar culto"
                  icono="bi-plus-lg"
                />
                <BotonAccionPanel
                  onClick={() => manejarLimpiarPanel(tieneCambiosCultos, restaurarCultos)}
                  disabled={!tieneCambiosCultos}
                  label="Limpiar"
                  icono="bi-arrow-counterclockwise"
                  className="btn btn-outline-secondary btn-sm"
                />
              </div>

              {tieneCambiosCultos && (
                <BotonAccionPanel
                  onClick={guardarCultos}
                  disabled={guardandoCultos}
                  label={guardandoCultos ? 'Guardando...' : 'Guardar cultos'}
                  icono="bi-floppy"
                  className="btn btn-primary"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {mostrarMetricas && (
        <div className="card shadow-sm mb-4 admin-setup-panel">
          <div className="card-header d-flex justify-content-between align-items-center gap-2">
            <div className="d-flex align-items-center gap-2">
              <h5 className="mb-0" style={{ color: '#FFFFFF' }}>Métricas del formulario</h5>
              <span className="badge text-bg-light">{metricas.length}</span>
              <span className="badge text-bg-secondary">
                Adicionales {metricasAdicionalesCount}/{maxMetricasAdicionales}
              </span>
            </div>
            <BotonCerrarPanel
              onClick={() => {
                void manejarCerrarPanelConDescartar('métricas', tieneCambiosMetricas, restaurarMetricas);
              }}
              label="Cerrar panel de métricas"
            />
          </div>
          <div className="card-body">
            <div className="table-responsive admin-tabla-scroll-x">
              <div className="admin-setup-tabla-wrap admin-setup-tabla-wrap-metricas">
                <table className="table table-sm align-middle mb-0">
                <colgroup>
                  <col className="admin-col-metrica-etiqueta" />
                  <col className="admin-col-metrica-categoria" />
                  <col className="admin-col-check" />
                  <col className="admin-col-acciones" />
                </colgroup>
                <thead>
                  <tr>
                    <th>Métrica</th>
                    <th>Categoría</th>
                    <th className="text-center admin-col-check">Activo</th>
                    <th className="text-center admin-col-acciones">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {metricas.map((item, index) => {
                    const filaErrores = erroresMetricas[`fila_${index}`] || {};
                    const categoriaActual = String(item.categoria || '').trim().toLowerCase();
                    const categoriaBloqueada = item.es_fija || CATEGORIAS_AUTOMATICAS.has(categoriaActual);
                    const opcionesCategoria = categoriaBloqueada
                      ? CATEGORIAS_METRICA_OPCIONES
                      : CATEGORIAS_METRICA_OPCIONES_MANUALES;

                    return (
                      <tr key={item.ui_id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <input
                              ref={(node) => registrarInputMetricaRef(item.ui_id, node)}
                              className={`form-control form-control-sm admin-input-metrica-etiqueta ${filaErrores.etiqueta ? 'is-invalid' : ''}`}
                              value={item.etiqueta}
                              placeholder="Nueva métrica"
                              maxLength={40}
                              onChange={(event) => cambiarMetrica(index, 'etiqueta', event.target.value)}
                              disabled={item.es_fija}
                            />
                            {item.es_fija && <span className="badge text-bg-secondary">Base</span>}
                          </div>
                          {filaErrores.etiqueta && (
                            <div className="invalid-feedback d-block">{filaErrores.etiqueta}</div>
                          )}
                        </td>
                        <td>
                          <select
                            className={`form-select form-select-sm admin-select-metrica-categoria ${filaErrores.categoria ? 'is-invalid' : ''}`}
                            value={item.categoria || 'adicionales'}
                            onChange={(event) => cambiarMetrica(index, 'categoria', event.target.value)}
                            disabled={categoriaBloqueada}
                          >
                            {opcionesCategoria.map((opcion) => (
                              <option key={opcion.valor} value={opcion.valor}>
                                {opcion.etiqueta}
                              </option>
                            ))}
                          </select>
                          {filaErrores.categoria && (
                            <div className="invalid-feedback d-block">{filaErrores.categoria}</div>
                          )}
                        </td>
                        <td className="text-center admin-col-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={!!item.habilitado}
                            onChange={(event) => cambiarMetrica(index, 'habilitado', event.target.checked)}
                          />
                        </td>
                        <td className="text-center admin-col-acciones">
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm admin-table-icon-btn"
                            onClick={() => { void manejarEliminarMetrica(index); }}
                            disabled={metricas.length <= 1 || item.es_fija}
                            title={item.es_fija ? 'Métrica base (no eliminable)' : 'Eliminar métrica'}
                            aria-label={item.es_fija ? 'Métrica base no eliminable' : 'Eliminar métrica'}
                          >
                            <i className="bi bi-trash" aria-hidden="true"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>

            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
              <div className="d-flex flex-wrap align-items-center gap-2">
                <BotonAccionPanel
                  onClick={manejarAgregarMetrica}
                  disabled={!puedeAgregarMetrica}
                  title={
                    !puedeAgregarMetrica
                      ? `Límite alcanzado: máximo ${maxMetricasAdicionales} métricas adicionales.`
                      : 'Agregar métrica'
                  }
                  label="Agregar métrica"
                  icono="bi-plus-lg"
                />
                <BotonAccionPanel
                  onClick={() => manejarLimpiarPanel(tieneCambiosMetricas, restaurarMetricas)}
                  disabled={!tieneCambiosMetricas}
                  label="Limpiar"
                  icono="bi-arrow-counterclockwise"
                  className="btn btn-outline-secondary btn-sm"
                />
              </div>

              {tieneCambiosMetricas && (
                <BotonAccionPanel
                  onClick={guardarMetricas}
                  disabled={guardandoMetricas}
                  label={guardandoMetricas ? 'Guardando...' : 'Guardar métricas'}
                  icono="bi-floppy"
                  className="btn btn-primary"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {mostrarCategoriasMetricas && (
        <div className="card shadow-sm mb-4 admin-setup-panel">
          <div className="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <h5 className="mb-0" style={{ color: '#FFFFFF' }}>Información</h5>
            <BotonCerrarPanel
              onClick={() => setVistaActiva(VISTA_RESUMEN)}
              label="Cerrar panel de información"
            />
          </div>
          <div className="card-body admin-info-panel-body">
            <p className="text-muted small mb-3">
              {metaInfoActiva.descripcion}
            </p>
            <div className="admin-info-switch mb-3">
              <button
                type="button"
                className="btn btn-outline-primary btn-sm admin-info-arrow-btn"
                onClick={() => cambiarSlideInfo(-1)}
                aria-label="Ver tarjetas anteriores"
                title="Anterior"
                disabled={slidesInfo.length <= 1}
              >
                <i className="bi bi-chevron-left" aria-hidden="true"></i>
              </button>

              <div className="admin-info-switch-title">
                <span className="badge text-bg-secondary">{slidesInfo.length ? slideInfoActivo + 1 : 0}/{slidesInfo.length || 1}</span>
                <span>
                  <i className={`bi ${metaInfoActiva.icono} me-2`} aria-hidden="true"></i>
                  {metaInfoActiva.etiqueta}
                </span>
              </div>

              <button
                type="button"
                className="btn btn-outline-primary btn-sm admin-info-arrow-btn"
                onClick={() => cambiarSlideInfo(1)}
                aria-label="Ver tarjetas siguientes"
                title="Siguiente"
                disabled={slidesInfo.length <= 1}
              >
                <i className="bi bi-chevron-right" aria-hidden="true"></i>
              </button>
            </div>

            <div
              className="admin-info-carousel"
              onTouchStart={manejarTouchInicioInfo}
              onTouchEnd={manejarTouchFinInfo}
            >
              <div
                className="admin-info-track"
                style={{ transform: `translateX(-${slideInfoActivo * 100}%)` }}
              >
                {slidesInfo.map((slide, slideIndex) => (
                  <div className="admin-info-slide" key={`slide_info_${infoSeccionActiva}_${slideIndex}`}>
                    <div className="admin-info-content">
                      {infoSeccionActiva === 'METRICAS' ? (
                        <InfoCategoriasMetricas
                          categorias={slide}
                          descripciones={DESCRIPCIONES_CATEGORIA_METRICA}
                        />
                      ) : (
                        <InfoRolesUsuarios roles={slide} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="d-flex flex-wrap justify-content-start align-items-center gap-2 mt-3">
              {INFO_SECCIONES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`admin-info-tab-btn ${infoSeccionActiva === item.id ? 'is-active' : ''}`}
                  onClick={() => {
                    setInfoSeccionActiva(item.id);
                    setSlideInfoActivo(0);
                  }}
                  title={item.etiqueta}
                  aria-label={item.etiqueta}
                >
                  <i className={`bi ${item.icono}`} aria-hidden="true"></i>
                  <span className="admin-info-tab-btn-label">{item.etiqueta}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {mostrarUsuarios && (
        <div className="card shadow-sm mb-4 admin-setup-panel">
          <div className="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <div className="admin-panel-header-top">
              <h5 className="mb-0" style={{ color: '#FFFFFF' }}>Usuarios</h5>
              <div className="admin-panel-header-actions">
                {OPCIONES_USUARIO.map((opcion) => (
                  <button
                    key={opcion.valor}
                    type="button"
                    className={`admin-usuarios-switch-btn ${usuarioSeccionActiva === opcion.valor ? 'is-active' : ''}`}
                    onClick={() => setUsuarioSeccionActiva(opcion.valor)}
                    title={opcion.etiqueta}
                    aria-label={opcion.etiqueta}
                  >
                    <i className={`bi ${opcion.icono}`} aria-hidden="true"></i>
                    <span className="admin-usuarios-switch-btn-label">{opcion.etiqueta}</span>
                  </button>
                ))}
              </div>
            </div>
            <BotonCerrarPanel
              onClick={() => setVistaActiva(VISTA_RESUMEN)}
              label="Cerrar panel de usuarios"
            />
          </div>
          <div className="card-body">
            <UsuarioPage
              modo="panel"
              mostrarSelector={false}
              seccionActiva={usuarioSeccionActiva}
              onCambiarSeccion={setUsuarioSeccionActiva}
            />
          </div>
        </div>
      )}

      {mostrarProcedencias && (
        <div className="card shadow-sm mb-4 admin-setup-panel">
          <div className="card-header d-flex justify-content-between align-items-center gap-2">
            <div className="d-flex align-items-center gap-2">
              <h5 className="mb-0" style={{ color: '#FFFFFF' }}>Procedencias (1 a 10)</h5>
              <span className="badge text-bg-light">{procedencias.length}</span>
            </div>
            <BotonCerrarPanel
              onClick={() => {
                void manejarCerrarPanelConDescartar(
                  'procedencias',
                  tieneCambiosProcedencias,
                  restaurarProcedencias
                );
              }}
              label="Cerrar panel de procedencias"
            />
          </div>
          <div className="card-body">
            {erroresProcedencias.general && <div className="alert alert-danger">{erroresProcedencias.general}</div>}

            <div className="table-responsive admin-tabla-scroll-x">
              <div className="admin-setup-tabla-wrap admin-setup-tabla-wrap-procedencias">
                <table className="table table-sm align-middle mb-0">
                <colgroup>
                  <col className="admin-col-procedencia-nombre" />
                  <col className="admin-col-check" />
                  <col className="admin-col-acciones" />
                </colgroup>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th className="text-center admin-col-check">Activo</th>
                    <th className="text-center admin-col-acciones">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {procedencias.map((item, index) => {
                    const filaErrores = erroresProcedencias[`fila_${index}`] || {};
                    return (
                      <tr key={item.ui_id}>
                        <td>
                          <input
                            className={`form-control form-control-sm admin-input-procedencia-nombre ${filaErrores.nombre ? 'is-invalid' : ''}`}
                            value={item.nombre}
                            maxLength={25}
                            onChange={(event) => cambiarProcedencia(index, 'nombre', event.target.value)}
                          />
                        </td>
                        <td className="text-center admin-col-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={!!item.activo}
                            onChange={(event) => cambiarProcedencia(index, 'activo', event.target.checked)}
                          />
                        </td>
                        <td className="text-center admin-col-acciones">
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm admin-table-icon-btn"
                            onClick={() => { void manejarEliminarProcedencia(index); }}
                            disabled={procedencias.length <= 1}
                            title="Eliminar procedencia"
                            aria-label="Eliminar procedencia"
                          >
                            <i className="bi bi-trash" aria-hidden="true"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>

            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
              <div className="d-flex flex-wrap align-items-center gap-2">
                <BotonAccionPanel
                  onClick={agregarProcedencia}
                  disabled={procedencias.length >= 10}
                  label="Agregar procedencia"
                  icono="bi-plus-lg"
                />
                <BotonAccionPanel
                  onClick={() => manejarLimpiarPanel(tieneCambiosProcedencias, restaurarProcedencias)}
                  disabled={!tieneCambiosProcedencias}
                  label="Limpiar"
                  icono="bi-arrow-counterclockwise"
                  className="btn btn-outline-secondary btn-sm"
                />
              </div>

              {tieneCambiosProcedencias && (
                <BotonAccionPanel
                  onClick={guardarProcedencias}
                  disabled={guardandoProcedencias}
                  label={guardandoProcedencias ? 'Guardando...' : 'Guardar procedencias'}
                  icono="bi-floppy"
                  className="btn btn-primary"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
