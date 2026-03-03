import { Link, useLocation } from 'react-router-dom';
import { ROLES } from '../../config/constants';

/**
 * Barra de navegacion superior con identidad IASD
 * Props:
 *  - usuario: objeto con datos del usuario autenticado
 *  - onCerrarSesion: funcion para cerrar sesion
 */
export default function Navbar({ usuario, onCerrarSesion }) {
  const location = useLocation();

  const esRutaActiva = (ruta) => location.pathname === ruta;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark shadow-sm">
      <div className="container-fluid">
        {/* Marca */}
        <Link className="navbar-brand d-flex align-items-center" to="/asistencia">
          <span className="fw-bold">IASD</span>
          <span className="ms-2 d-none d-sm-inline" style={{ fontSize: '0.85rem', opacity: 0.9 }}>
            Control de Asistencia
          </span>
        </Link>

        {/* Boton hamburguesa */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarMain"
          aria-controls="navbarMain"
          aria-expanded="false"
          aria-label="Abrir menu"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Contenido colapsable */}
        <div className="collapse navbar-collapse" id="navbarMain">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {/* Asistencia - siempre visible */}
            <li className="nav-item">
              <Link
                className={`nav-link ${esRutaActiva('/asistencia') ? 'active' : ''}`}
                to="/asistencia"
              >
                Asistencia
              </Link>
            </li>

            {/* Usuarios - solo ADMIN */}
            {usuario?.rol === ROLES.ADMIN && (
              <li className="nav-item">
                <Link
                  className={`nav-link ${esRutaActiva('/usuarios') ? 'active' : ''}`}
                  to="/usuarios"
                >
                  Usuarios
                </Link>
              </li>
            )}
          </ul>

          {/* Info del usuario y logout */}
          <div className="d-flex align-items-center">
            <span className="navbar-text me-3 d-flex align-items-center">
              <span className="me-2">{usuario?.nombre_completo}</span>
              <span className="badge bg-secondary" style={{ fontSize: '0.7rem' }}>
                {usuario?.rol}
              </span>
            </span>
            <button
              className="btn btn-outline-light btn-sm"
              onClick={onCerrarSesion}
            >
              Cerrar sesion
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
