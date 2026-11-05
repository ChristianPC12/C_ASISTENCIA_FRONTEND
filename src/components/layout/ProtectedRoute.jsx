import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSetupStatus } from '../../hooks/useSetupStatus';
import SetupBlockedNotice from '../setup/SetupBlockedNotice';

const EMPTY_LABEL = '';

/**
 * Wrapper de rutas autenticadas.
 * Props:
 *  - soloSuperadmin / soloAdmin: restringe a esos roles.
 *  - seccion: clave de permiso requerida (ADMIN siempre pasa).
 *  - requiereEditor: exige nivel EDITOR en la sección.
 *  - requiereSetupInicial: bloquea el módulo si el setup no está completo.
 *  - nombreModulo: texto del aviso de bloqueo.
 */
export default function ProtectedRoute({
  children,
  soloSuperadmin = false,
  soloAdmin = false,
  seccion = null,
  requiereEditor = false,
  requiereSetupInicial = false,
  nombreModulo = EMPTY_LABEL
}) {
  const { estaAutenticado, esSuperadmin, esAdmin, puedeVer, puedeEditar, rutaInicio } = useAuth();
  const { cargando, requiereSetup } = useSetupStatus();

  if (!estaAutenticado) {
    return <Navigate to="/" replace />;
  }

  const destinoSinAcceso = esSuperadmin ? '/superadmin' : (rutaInicio || '/registro');
  const permitido = soloSuperadmin
    ? esSuperadmin
    : !esSuperadmin && (
      soloAdmin
        ? esAdmin
        : (!seccion || (requiereEditor ? puedeEditar(seccion) : puedeVer(seccion)))
    );

  if (!permitido) {
    return <Navigate to={destinoSinAcceso} replace />;
  }

  if (requiereSetupInicial && !esSuperadmin) {
    if (cargando) {
      return (
        <div className="container-fluid py-4">
          <div className="card shadow-sm border-0">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="spinner-border spinner-iasd" role="status" />
              <span>Validando configuración inicial de la organización...</span>
            </div>
          </div>
        </div>
      );
    }

    if (requiereSetup) {
      return <SetupBlockedNotice modulo={nombreModulo || 'Módulo operativo'} />;
    }
  }

  return children;
}
