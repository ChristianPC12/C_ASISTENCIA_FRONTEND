import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ROLES } from '../../config/constants';
import { useSetupStatus } from '../../hooks/useSetupStatus';
import { useAuth } from '../../hooks/useAuth';
import {
  EVENT_ADMIN_ABRIR_CATEGORIAS_METRICAS,
  EVENT_ADMIN_ABRIR_CULTOS,
  EVENT_ADMIN_ABRIR_METRICAS,
  EVENT_ADMIN_ABRIR_PROCEDENCIAS,
  EVENT_ADMIN_ABRIR_USUARIOS,
  EVENT_ADMIN_VISTA_ACTIVA,
  EVENT_CAMPANAS_ABRIR_NUEVA,
  EVENT_CAMPANAS_ABRIR_LISTA,
  EVENT_CAMPANAS_ABRIR_SELECTOR,
  EVENT_CAMPANAS_ABRIR_VISITAS,
  EVENT_CAMPANAS_VISTA_ACTIVA,
  EVENT_ESTUDIOS_ABRIR_ASIGNAR,
  EVENT_ESTUDIOS_ABRIR_INSTRUCTORES,
  EVENT_ESTUDIOS_ABRIR_LISTA,
  EVENT_ESTUDIOS_ABRIR_REGISTRO,
  EVENT_ESTUDIOS_ABRIR_VISITAS,
  EVENT_ESTUDIOS_VISTA_ACTIVA,
  EVENT_COMPARACIONES_ABRIR_TABLA,
  EVENT_COMPARACIONES_ABRIR_DETALLE,
  EVENT_COMPARACIONES_ABRIR_VISITAS,
  EVENT_ESTADISTICAS_ABRIR_TABLA,
  EVENT_SUPERADMIN_ABRIR_CREAR_INSTANCIA,
  EVENT_SUPERADMIN_ABRIR_GESTION_CATALOGOS,
  EVENT_SUPERADMIN_ABRIR_GESTION_CAMPOS,
  EVENT_SUPERADMIN_ABRIR_GESTION_DISTRITOS,
  EVENT_SUPERADMIN_ABRIR_SUPERADMINS,
  EVENT_SUPERADMIN_VISTA_ACTIVA
} from '../../config/events';

/**
 * Sidebar de navegacion con hamburguesa
 * Props:
 *  - usuario: objeto con datos del usuario autenticado
 *  - onCerrarSesion: funcion para cerrar sesion
 *  - children: contenido principal de la pagina
 */
export default function Sidebar({ usuario, onCerrarSesion, children }) {
  const [abierto, setAbierto] = useState(false);
  const [adminVistaActiva, setAdminVistaActiva] = useState('RESUMEN');
  const [superadminVistaActiva, setSuperadminVistaActiva] = useState('ORGANIZACIONES');
  const [campanasVistaActiva, setCampanasVistaActiva] = useState('CAMPANAS');
  const [estudiosVistaActiva, setEstudiosVistaActiva] = useState('ESTUDIOS');
  const location = useLocation();
  const { requiereSetup } = useSetupStatus();
  const { tenant, esAdminTemporal, diasRestantesPassword } = useAuth();

  /* Bloquear scroll del body cuando el sidebar esta abierto (mobile) */
  useEffect(() => {
    if (abierto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [abierto]);

  const esRutaActiva = (ruta) => location.pathname === ruta;

  const toggleMenu = () => setAbierto(!abierto);
  const cerrarMenu = () => setAbierto(false);
  const esAdmin = usuario?.rol === ROLES.ADMIN;
  const esSuperadmin = usuario?.rol === ROLES.SUPERADMIN;
  const esInstructorBiblico = usuario?.rol === ROLES.INSTRUCTOR_BIBLICO;
  const esMinisterioPersonal = usuario?.rol === ROLES.MINISTERIO_PERSONAL;
  const enPantallaSuperadmin = esSuperadmin && esRutaActiva('/superadmin');
  const enPantallaAdministrador = esAdmin && esRutaActiva('/administrador');
  const enPantallaEstadisticas = esRutaActiva('/estadisticas');
  const enPantallaComparaciones = esRutaActiva('/comparaciones');
  const enPantallaCampanas = esRutaActiva('/campanas');
  const enPantallaEstudios = esRutaActiva('/estudios-biblicos');
  const tenantSesion = tenant || usuario?.tenant || {};
  const campoSesion = String(
    tenantSesion?.campo_nombre || tenantSesion?.campo || usuario?.campo_nombre || usuario?.campo || ''
  ).trim();
  const distritoSesion = String(
    tenantSesion?.distrito_nombre || tenantSesion?.distrito || usuario?.distrito_nombre || usuario?.distrito || ''
  ).trim();
  const organizacionSesion = String(
    tenantSesion?.nombre_organizacion || usuario?.nombre_organizacion || ''
  ).trim();
  const mostrarDatosTenant = !esSuperadmin && (campoSesion || distritoSesion || organizacionSesion);

  useEffect(() => {
    const manejarVistaActivaAdmin = (event) => {
      const vista = String(event?.detail?.vista || 'RESUMEN');
      setAdminVistaActiva(vista);
    };

    window.addEventListener(EVENT_ADMIN_VISTA_ACTIVA, manejarVistaActivaAdmin);
    return () => {
      window.removeEventListener(EVENT_ADMIN_VISTA_ACTIVA, manejarVistaActivaAdmin);
    };
  }, []);

  useEffect(() => {
    const manejarVistaActivaSuperadmin = (event) => {
      const vista = String(event?.detail?.vista || 'ORGANIZACIONES');
      setSuperadminVistaActiva(vista);
    };

    window.addEventListener(EVENT_SUPERADMIN_VISTA_ACTIVA, manejarVistaActivaSuperadmin);
    return () => {
      window.removeEventListener(EVENT_SUPERADMIN_VISTA_ACTIVA, manejarVistaActivaSuperadmin);
    };
  }, []);

  useEffect(() => {
    const manejarVistaActivaCampanas = (event) => {
      const vista = String(event?.detail?.vista || 'CAMPANAS');
      setCampanasVistaActiva(vista);
    };

    window.addEventListener(EVENT_CAMPANAS_VISTA_ACTIVA, manejarVistaActivaCampanas);
    return () => {
      window.removeEventListener(EVENT_CAMPANAS_VISTA_ACTIVA, manejarVistaActivaCampanas);
    };
  }, []);

  useEffect(() => {
    const manejarVistaActivaEstudios = (event) => {
      const vista = String(event?.detail?.vista || 'ESTUDIOS');
      setEstudiosVistaActiva(vista);
    };

    window.addEventListener(EVENT_ESTUDIOS_VISTA_ACTIVA, manejarVistaActivaEstudios);
    return () => {
      window.removeEventListener(EVENT_ESTUDIOS_VISTA_ACTIVA, manejarVistaActivaEstudios);
    };
  }, []);

  const adminVistaTopbar = enPantallaAdministrador ? adminVistaActiva : 'RESUMEN';
  const claseBotonTopbarAdmin = (vista) => (
    `sidebar-topbar-metric-btn ${adminVistaTopbar === vista ? 'is-active' : ''}`
  );
  const superadminVistaTopbar = enPantallaSuperadmin ? superadminVistaActiva : 'ORGANIZACIONES';
  const claseBotonTopbarSuperadmin = (activo) => (
    `sidebar-topbar-metric-btn ${activo ? 'is-active' : ''}`
  );
  const campanasVistaTopbar = enPantallaCampanas ? campanasVistaActiva : 'CAMPANAS';
  const claseBotonTopbarCampanas = (vista) => (
    `sidebar-topbar-metric-btn ${campanasVistaTopbar === vista ? 'is-active' : ''}`
  );
  const estudiosVistaTopbar = enPantallaEstudios ? estudiosVistaActiva : 'ESTUDIOS';
  const claseBotonTopbarEstudios = (vista) => (
    `sidebar-topbar-metric-btn ${estudiosVistaTopbar === vista ? 'is-active' : ''}`
  );

  const abrirPanelNuevaInstancia = () => {
    window.dispatchEvent(new CustomEvent(EVENT_SUPERADMIN_ABRIR_CREAR_INSTANCIA));
  };

  const abrirPanelGestionCatalogos = () => {
    window.dispatchEvent(new CustomEvent(EVENT_SUPERADMIN_ABRIR_GESTION_CATALOGOS));
  };

  const abrirPanelGestionCampos = () => {
    window.dispatchEvent(new CustomEvent(EVENT_SUPERADMIN_ABRIR_GESTION_CAMPOS));
  };

  const abrirPanelGestionDistritos = () => {
    window.dispatchEvent(new CustomEvent(EVENT_SUPERADMIN_ABRIR_GESTION_DISTRITOS));
  };

  const abrirPanelSuperadmins = () => {
    window.dispatchEvent(new CustomEvent(EVENT_SUPERADMIN_ABRIR_SUPERADMINS));
  };

  const abrirPanelCultos = () => {
    window.dispatchEvent(new CustomEvent(EVENT_ADMIN_ABRIR_CULTOS));
  };

  const abrirPanelMetricas = () => {
    window.dispatchEvent(new CustomEvent(EVENT_ADMIN_ABRIR_METRICAS));
  };

  const abrirPanelProcedencias = () => {
    window.dispatchEvent(new CustomEvent(EVENT_ADMIN_ABRIR_PROCEDENCIAS));
  };

  const abrirPanelCategoriasMetricas = () => {
    window.dispatchEvent(new CustomEvent(EVENT_ADMIN_ABRIR_CATEGORIAS_METRICAS));
  };

  const abrirPanelUsuarios = () => {
    window.dispatchEvent(new CustomEvent(EVENT_ADMIN_ABRIR_USUARIOS));
  };

  const abrirDetalleComparaciones = () => {
    window.dispatchEvent(new CustomEvent(EVENT_COMPARACIONES_ABRIR_DETALLE));
  };

  const abrirTablaComparaciones = () => {
    window.dispatchEvent(new CustomEvent(EVENT_COMPARACIONES_ABRIR_TABLA));
  };

  const abrirVisitasComparaciones = () => {
    window.dispatchEvent(new CustomEvent(EVENT_COMPARACIONES_ABRIR_VISITAS));
  };

  const abrirTablaEstadisticas = () => {
    window.dispatchEvent(new CustomEvent(EVENT_ESTADISTICAS_ABRIR_TABLA));
  };

  const abrirNuevaCampana = () => {
    window.dispatchEvent(new CustomEvent(EVENT_CAMPANAS_ABRIR_NUEVA));
  };

  const abrirListaCampanas = () => {
    window.dispatchEvent(new CustomEvent(EVENT_CAMPANAS_ABRIR_LISTA));
  };

  const abrirSelectorCampana = () => {
    window.dispatchEvent(new CustomEvent(EVENT_CAMPANAS_ABRIR_SELECTOR));
  };

  const abrirVisitasCampana = () => {
    window.dispatchEvent(new CustomEvent(EVENT_CAMPANAS_ABRIR_VISITAS));
  };

  const abrirVisitasEstudios = () => {
    window.dispatchEvent(new CustomEvent(EVENT_ESTUDIOS_ABRIR_VISITAS));
  };

  const abrirListaEstudios = () => {
    window.dispatchEvent(new CustomEvent(EVENT_ESTUDIOS_ABRIR_LISTA));
  };

  const abrirInstructoresEstudios = () => {
    window.dispatchEvent(new CustomEvent(EVENT_ESTUDIOS_ABRIR_INSTRUCTORES));
  };

  const abrirAsignarEstudios = () => {
    window.dispatchEvent(new CustomEvent(EVENT_ESTUDIOS_ABRIR_ASIGNAR));
  };

  const abrirRegistroEstudios = () => {
    window.dispatchEvent(new CustomEvent(EVENT_ESTUDIOS_ABRIR_REGISTRO));
  };

  let enlaces = [];

  if (esSuperadmin) {
    enlaces = [
      { ruta: '/superadmin', etiqueta: 'Superadministrador', icono: 'bi-shield-lock' }
    ];
  } else if (esInstructorBiblico || esMinisterioPersonal) {
    enlaces = [
      { ruta: '/estudios-biblicos', etiqueta: 'Estudios Bíblicos', icono: 'bi-journal-bookmark' }
    ];
  } else {
    enlaces = [
      ...(usuario?.rol === ROLES.ADMIN
        ? [{ ruta: '/administrador', etiqueta: 'Administrador', icono: 'bi-sliders2' }]
        : []),
      { ruta: '/registro', etiqueta: 'Nuevo Registro', icono: 'bi-plus-circle' },
      { ruta: '/registros', etiqueta: 'Ver Registros', icono: 'bi-list-ul' },
      { ruta: '/estadisticas', etiqueta: 'Estadísticas', icono: 'bi-bar-chart-line' },
      { ruta: '/comparaciones', etiqueta: 'Comparaciones', icono: 'bi-arrow-left-right' },
      { ruta: '/presentaciones', etiqueta: 'Presentaciones', icono: 'bi-easel2' },
      { ruta: '/campanas', etiqueta: 'Campañas', icono: 'bi-megaphone' },
      { ruta: '/estudios-biblicos', etiqueta: 'Estudios Bíblicos', icono: 'bi-journal-bookmark' },
      { ruta: '/pequenas-congregaciones', etiqueta: 'Pequeñas Congregaciones (PC)', icono: 'bi-house-heart' },
      { ruta: '/juntas-iglesia', etiqueta: 'Juntas de Iglesia', icono: 'bi-people-fill' }
    ];

  }

  return (
    <div className="sidebar-layout">
      {/* Overlay oscuro en mobile cuando el menu esta abierto */}
      {abierto && (
        <div
          className="sidebar-overlay"
          onClick={cerrarMenu}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') cerrarMenu();
          }}
          role="button"
          tabIndex={0}
          aria-label="Cerrar menú lateral"
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${abierto ? 'sidebar-abierto' : ''}`}>
        {/* Cabecera del sidebar */}
        <div className="sidebar-header">
          <img
            src="/imgs/logo_IASD.jpg"
            alt="Logo IASD"
            className="sidebar-logo"
          />
          <div className="sidebar-marca">
            <span className="sidebar-marca-titulo">Iglesia Adventista</span>
            <span className="sidebar-marca-subtitulo">del Séptimo Día</span>
          </div>
          {/* Boton cerrar en mobile */}
          <button className="sidebar-cerrar" onClick={cerrarMenu} aria-label="Cerrar menú">
            &times;
          </button>
        </div>

        {/* Navegacion */}
        <nav className="sidebar-nav">
          {!esSuperadmin && requiereSetup && (
            <div className="px-3 pb-2">
              <span className="badge text-bg-warning text-dark w-100 py-2">
                Setup inicial pendiente
              </span>
            </div>
          )}

          {enlaces.map((enlace) => (
            <Link
              key={enlace.ruta}
              to={enlace.ruta}
              className={`sidebar-link ${esRutaActiva(enlace.ruta) ? 'sidebar-link-activo' : ''}`}
              onClick={cerrarMenu}
            >
              <i className={`bi ${enlace.icono} sidebar-link-icono`}></i>
              {enlace.etiqueta}
            </Link>
          ))}
        </nav>

        {/* Info del usuario al fondo */}
        <div className="sidebar-footer">
          <div className="sidebar-usuario-info sidebar-usuario-info-mobile">
            <span className="sidebar-usuario-nombre">{usuario?.nombre_completo}</span>
            <span className="badge bg-secondary sidebar-usuario-rol">{usuario?.rol}</span>
            {mostrarDatosTenant && (
              <div className="sidebar-tenant-info">
                <span>Campo: <strong>{campoSesion || '-'}</strong></span>
                <span>Distrito: <strong>{distritoSesion || '-'}</strong></span>
                <span>Iglesia/Grupo: <strong>{organizacionSesion || '-'}</strong></span>
              </div>
            )}
          </div>
          <button
            className="btn btn-outline-light btn-sm w-100 mt-2 sidebar-logout-btn d-none d-md-inline-flex justify-content-center align-items-center"
            onClick={onCerrarSesion}
          >
            <i className="bi bi-box-arrow-right" aria-hidden="true"></i>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className={`sidebar-contenido ${abierto ? 'sidebar-contenido-bloqueado' : ''}`}>
        {/* Barra superior con hamburguesa */}
        <header className="sidebar-topbar">
          <button className="sidebar-hamburguesa" onClick={toggleMenu} aria-label="Abrir menú">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className="sidebar-topbar-usuario d-none d-md-flex">
            <div className="sidebar-topbar-usuario-main">
              <span>{usuario?.nombre_completo}</span>
              <span className="badge bg-secondary ms-2">{usuario?.rol}</span>
            </div>
            {mostrarDatosTenant && (
              <div className="sidebar-topbar-tenant">
                <span>Campo: <strong>{campoSesion || '-'}</strong></span>
                <span>Distrito: <strong>{distritoSesion || '-'}</strong></span>
                <span>Iglesia/Grupo: <strong>{organizacionSesion || '-'}</strong></span>
              </div>
            )}
          </div>
          <div className="sidebar-topbar-acciones">
            {enPantallaSuperadmin && (
              <>
                <button
                  type="button"
                  className={`${claseBotonTopbarSuperadmin(
                    superadminVistaTopbar === 'CATALOGOS'
                    || superadminVistaTopbar === 'CAMPOS'
                    || superadminVistaTopbar === 'DISTRITOS'
                  )} d-none d-md-inline-flex`}
                  onClick={abrirPanelGestionCatalogos}
                  aria-label="Gestionar campos y distritos"
                  title="Gestionar campos y distritos"
                >
                  <i className="bi bi-diagram-3" aria-hidden="true"></i>
                  <span>Campos y distritos</span>
                </button>
                <button
                  type="button"
                  className={`${claseBotonTopbarSuperadmin(superadminVistaTopbar === 'CAMPOS')} d-md-none`}
                  onClick={abrirPanelGestionCampos}
                  aria-label="Gestionar campos"
                  title="Gestionar campos"
                >
                  <i className="bi bi-diagram-3" aria-hidden="true"></i>
                  <span className="visually-hidden">Campos</span>
                </button>
                <button
                  type="button"
                  className={`${claseBotonTopbarSuperadmin(superadminVistaTopbar === 'DISTRITOS')} d-md-none`}
                  onClick={abrirPanelGestionDistritos}
                  aria-label="Gestionar distritos"
                  title="Gestionar distritos"
                >
                  <i className="bi bi-geo-alt" aria-hidden="true"></i>
                  <span className="visually-hidden">Distritos</span>
                </button>
                <button
                  type="button"
                  className={claseBotonTopbarSuperadmin(superadminVistaTopbar === 'SUPERADMINS')}
                  onClick={abrirPanelSuperadmins}
                  aria-label="Mantenimiento de superadministradores"
                  title="Mantenimiento de superadministradores"
                >
                  <i className="bi bi-person-gear" aria-hidden="true"></i>
                  <span className="d-none d-md-inline">Superadmins</span>
                </button>
                <button
                  type="button"
                  className={claseBotonTopbarSuperadmin(superadminVistaTopbar === 'CREAR_INSTANCIA')}
                  onClick={abrirPanelNuevaInstancia}
                  aria-label="Crear nueva instancia"
                  title="Crear nueva instancia"
                >
                  <i className="bi bi-plus-lg" aria-hidden="true"></i>
                  <span className="d-none d-md-inline">Crear nueva instancia</span>
                  <span className="visually-hidden d-md-none">Crear nueva instancia</span>
                </button>
              </>
            )}
            {enPantallaAdministrador && (
              <>
                <button
                  type="button"
                  className={claseBotonTopbarAdmin('CULTOS')}
                  onClick={abrirPanelCultos}
                  aria-label="Cultos"
                  title="Cultos"
                >
                  <i className="bi bi-calendar-week" aria-hidden="true"></i>
                  <span className="d-none d-md-inline">Cultos</span>
                </button>
                <button
                  type="button"
                  className={claseBotonTopbarAdmin('PROCEDENCIAS')}
                  onClick={abrirPanelProcedencias}
                  aria-label="Procedencias"
                  title="Procedencias"
                >
                  <i className="bi bi-people" aria-hidden="true"></i>
                  <span className="d-none d-md-inline">Procedencias</span>
                </button>
                <button
                  type="button"
                  className={claseBotonTopbarAdmin('METRICAS')}
                  onClick={abrirPanelMetricas}
                  aria-label="Métricas del formulario"
                  title="Métricas del formulario"
                >
                  <i className="bi bi-bar-chart-line" aria-hidden="true"></i>
                  <span className="d-none d-md-inline">Métricas</span>
                </button>
                <button
                  type="button"
                  className={claseBotonTopbarAdmin('CATEGORIAS_METRICAS')}
                  onClick={abrirPanelCategoriasMetricas}
                  aria-label="Información"
                  title="Información"
                >
                  <i className="bi bi-journal-text" aria-hidden="true"></i>
                  <span className="d-none d-md-inline">Información</span>
                </button>
                <button
                  type="button"
                  className={claseBotonTopbarAdmin('USUARIOS')}
                  onClick={abrirPanelUsuarios}
                  aria-label="Usuarios"
                  title="Usuarios"
                >
                  <i className="bi bi-person-gear" aria-hidden="true"></i>
                  <span className="d-none d-md-inline">Usuarios</span>
                </button>
              </>
            )}
            {enPantallaComparaciones && (
              <>
                <button
                  type="button"
                  className="sidebar-topbar-metric-btn d-md-none"
                  onClick={abrirTablaComparaciones}
                  aria-label="Ver tabla comparativa"
                  title="Ver tabla comparativa"
                >
                  <i className="bi bi-table" aria-hidden="true"></i>
                  <span className="visually-hidden">Ver tabla comparativa</span>
                </button>
                <button
                  type="button"
                  className="sidebar-topbar-metric-btn d-md-none"
                  onClick={abrirDetalleComparaciones}
                  aria-label="Ver detalles generales"
                  title="Ver detalles generales"
                >
                  <i className="bi bi-grid-1x2" aria-hidden="true"></i>
                  <span className="visually-hidden">Ver detalles generales</span>
                </button>
                <button
                  type="button"
                  className="sidebar-topbar-metric-btn d-md-none"
                  onClick={abrirVisitasComparaciones}
                  aria-label="Ver top nombres de visitas"
                  title="Ver top nombres de visitas"
                >
                  <i className="bi bi-people" aria-hidden="true"></i>
                  <span className="visually-hidden">Ver top nombres de visitas</span>
                </button>
              </>
            )}
            {enPantallaEstadisticas && (
              <button
                type="button"
                className="sidebar-topbar-metric-btn d-md-none"
                onClick={abrirTablaEstadisticas}
                aria-label="Ver tabla de estadísticas"
                title="Ver tabla de estadísticas"
              >
                <i className="bi bi-table" aria-hidden="true"></i>
                <span className="visually-hidden">Ver tabla de estadísticas</span>
              </button>
            )}
            {enPantallaCampanas && (
              <>
                <button
                  type="button"
                  className={`${claseBotonTopbarCampanas('NUEVA')} d-flex align-items-center gap-1`}
                  onClick={abrirNuevaCampana}
                  aria-label="Nueva Campaña"
                  title="Nueva Campaña"
                >
                  <i className="bi bi-plus-lg" aria-hidden="true"></i>
                  <span className="d-none d-md-inline">Nueva Campaña</span>
                </button>
                <button
                  type="button"
                  className={`${claseBotonTopbarCampanas('CAMPANAS')} d-flex align-items-center gap-1`}
                  onClick={abrirListaCampanas}
                  aria-label="Campañas"
                  title="Campañas"
                >
                  <i className="bi bi-megaphone" aria-hidden="true"></i>
                  <span className="d-none d-md-inline">Campañas</span>
                </button>
                <button
                  type="button"
                  className={`${claseBotonTopbarCampanas('VER_CAMPANA')} d-flex align-items-center gap-1`}
                  onClick={abrirSelectorCampana}
                  aria-label="Ver Campaña"
                  title="Ver Campaña"
                >
                  <i className="bi bi-folder2-open" aria-hidden="true"></i>
                  <span className="d-none d-md-inline">Ver Campaña</span>
                </button>
                <button
                  type="button"
                  className={`${claseBotonTopbarCampanas('VISITAS')} d-flex align-items-center gap-1`}
                  onClick={abrirVisitasCampana}
                  aria-label="Visitas"
                  title="Visitas registradas"
                >
                  <i className="bi bi-people" aria-hidden="true"></i>
                  <span className="d-none d-md-inline">Visitas</span>
                </button>
              </>
            )}
            {enPantallaEstudios && (
              esInstructorBiblico ? (
                <button
                  type="button"
                  className={`${claseBotonTopbarEstudios('REGISTRO')} d-flex align-items-center gap-1`}
                  onClick={abrirRegistroEstudios}
                  aria-label="Registrar sesión"
                  title="Registrar sesión"
                >
                  <i className="bi bi-journal-check" aria-hidden="true"></i>
                  <span className="d-none d-md-inline">Registrar sesión</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className={`${claseBotonTopbarEstudios('VISITAS')} d-flex align-items-center gap-1`}
                    onClick={abrirVisitasEstudios}
                    aria-label="Visitas"
                    title="Visitas registradas"
                  >
                    <i className="bi bi-people" aria-hidden="true"></i>
                    <span className="d-none d-md-inline">Visitas</span>
                  </button>
                  <button
                    type="button"
                    className={`${claseBotonTopbarEstudios('ESTUDIOS')} d-flex align-items-center gap-1`}
                    onClick={abrirListaEstudios}
                    aria-label="Estudios bíblicos"
                    title="Estudios bíblicos"
                  >
                    <i className="bi bi-journal-bookmark" aria-hidden="true"></i>
                    <span className="d-none d-md-inline">Estudios Bíblicos</span>
                  </button>
                  <button
                    type="button"
                    className={`${claseBotonTopbarEstudios('INSTRUCTORES')} d-flex align-items-center gap-1`}
                    onClick={abrirInstructoresEstudios}
                    aria-label="Instructores"
                    title="Instructores"
                  >
                    <i className="bi bi-person-badge" aria-hidden="true"></i>
                    <span className="d-none d-md-inline">Instructores</span>
                  </button>
                  <button
                    type="button"
                    className={`${claseBotonTopbarEstudios('ASIGNAR')} d-flex align-items-center gap-1`}
                    onClick={abrirAsignarEstudios}
                    aria-label="Asignar estudio"
                    title="Asignar estudio"
                  >
                    <i className="bi bi-diagram-3" aria-hidden="true"></i>
                    <span className="d-none d-md-inline">Asignar estudio</span>
                  </button>
                </>
              )
            )}
            <button
              type="button"
              className="sidebar-topbar-logout"
              onClick={onCerrarSesion}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <i className="bi bi-box-arrow-right" aria-hidden="true"></i>
              <span className="visually-hidden">Cerrar sesión</span>
            </button>
          </div>
        </header>

        {/* Contenido de la pagina */}
        <main className="sidebar-main">
          {esAdminTemporal && (
            <div className="container-fluid pt-3">
              <div className="alert alert-warning mb-0">
                <strong>Cuenta temporal:</strong> este acceso ADMIN vence en{' '}
                <strong>{diasRestantesPassword ?? 0}</strong> día(s). Coordine con superadministración para actualizar credenciales antes del vencimiento.
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
