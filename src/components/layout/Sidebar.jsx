import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ROLES } from '../../config/constants';

/**
 * Sidebar de navegacion con hamburguesa
 * Props:
 *  - usuario: objeto con datos del usuario autenticado
 *  - onCerrarSesion: funcion para cerrar sesion
 *  - children: contenido principal de la pagina
 */
export default function Sidebar({ usuario, onCerrarSesion, children }) {
  const [abierto, setAbierto] = useState(false);
  const location = useLocation();

  const esRutaActiva = (ruta) => location.pathname === ruta;

  const toggleMenu = () => setAbierto(!abierto);
  const cerrarMenu = () => setAbierto(false);

  const enlaces = [
    { ruta: '/registro', etiqueta: 'Nuevo Registro', icono: 'bi-plus-circle' },
    { ruta: '/registros', etiqueta: 'Ver Registros', icono: 'bi-list-ul' },
  ];

  // Agregar enlace de Usuarios solo para ADMIN
  if (usuario?.rol === ROLES.ADMIN) {
    enlaces.push({ ruta: '/usuarios', etiqueta: 'Usuarios', icono: 'bi-people' });
  }

  return (
    <div className="sidebar-layout">
      {/* Overlay oscuro en mobile cuando el menu esta abierto */}
      {abierto && (
        <div className="sidebar-overlay" onClick={cerrarMenu}></div>
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
          <div className="sidebar-usuario-info">
            <span className="sidebar-usuario-nombre">{usuario?.nombre_completo}</span>
            <span className="badge bg-secondary sidebar-usuario-rol">{usuario?.rol}</span>
          </div>
          <button
            className="btn btn-outline-light btn-sm w-100 mt-2"
            onClick={onCerrarSesion}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="sidebar-contenido">
        {/* Barra superior con hamburguesa */}
        <header className="sidebar-topbar">
          <button className="sidebar-hamburguesa" onClick={toggleMenu} aria-label="Abrir menú">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <span className="sidebar-topbar-titulo">
            {enlaces.find(e => esRutaActiva(e.ruta))?.etiqueta || 'Iglesia Adventista'}
          </span>
          <div className="sidebar-topbar-usuario d-none d-md-flex">
            <span>{usuario?.nombre_completo}</span>
            <span className="badge bg-secondary ms-2">{usuario?.rol}</span>
          </div>
        </header>

        {/* Contenido de la pagina */}
        <main className="sidebar-main">
          {children}
        </main>
      </div>
    </div>
  );
}
