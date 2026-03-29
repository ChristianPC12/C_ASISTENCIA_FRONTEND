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
  EVENT_SUPERADMIN_ABRIR_CREAR_INSTANCIA,
  EVENT_SUPERADMIN_ABRIR_GESTION_CAMPOS,
  EVENT_SUPERADMIN_ABRIR_GESTION_DISTRITOS
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
  const enPantallaSuperadmin = esSuperadmin && esRutaActiva('/superadmin');
  const enPantallaAdministrador = esAdmin && esRutaActiva('/administrador');
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

  const adminVistaTopbar = enPantallaAdministrador ? adminVistaActiva : 'RESUMEN';
  const claseBotonTopbarAdmin = (vista) => (
    `sidebar-topbar-metric-btn ${adminVistaTopbar === vista ? 'is-active' : ''}`
  );

  const abrirPanelNuevaInstancia = () => {
    window.dispatchEvent(new CustomEvent(EVENT_SUPERADMIN_ABRIR_CREAR_INSTANCIA));
  };

  const abrirPanelGestionCampos = () => {
    window.dispatchEvent(new CustomEvent(EVENT_SUPERADMIN_ABRIR_GESTION_CAMPOS));
  };

  const abrirPanelGestionDistritos = () => {
    window.dispatchEvent(new CustomEvent(EVENT_SUPERADMIN_ABRIR_GESTION_DISTRITOS));
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

  let enlaces = [];

  if (esSuperadmin) {
    enlaces = [
      { ruta: '/superadmin', etiqueta: 'Superadministrador', icono: 'bi-shield-lock' }
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
      { ruta: '/presentaciones', etiqueta: 'Presentaciones', icono: 'bi-easel2' }
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

        {/* Info del usuario y logout al fondo */}
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
            className="btn btn-outline-light btn-sm w-100 mt-2 sidebar-logout-btn"
            onClick={onCerrarSesion}
          >
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
                  className="sidebar-topbar-metric-btn"
                  onClick={abrirPanelGestionCampos}
                  aria-label="Gestionar campos"
                  title="Gestionar campos"
                >
                  <i className="bi bi-diagram-3" aria-hidden="true"></i>
                  <span className="d-none d-md-inline">Campos</span>
                </button>
                <button
                  type="button"
                  className="sidebar-topbar-metric-btn"
                  onClick={abrirPanelGestionDistritos}
                  aria-label="Gestionar distritos"
                  title="Gestionar distritos"
                >
                  <i className="bi bi-geo-alt" aria-hidden="true"></i>
                  <span className="d-none d-md-inline">Distritos</span>
                </button>
                <button
                  type="button"
                  className="sidebar-topbar-plus"
                  onClick={abrirPanelNuevaInstancia}
                  aria-label="Crear nueva instancia"
                  title="Crear nueva instancia"
                >
                  <i className="bi bi-plus-lg" aria-hidden="true"></i>
                  <span className="visually-hidden">Crear nueva instancia</span>
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


