import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../config/constants';
import { useSetupStatus } from '../../hooks/useSetupStatus';
import SetupBlockedNotice from '../setup/SetupBlockedNotice';

const EMPTY_ROLES = [];
const EMPTY_LABEL = '';

/**
 * Wrapper que redirige al login si no hay sesión
 * Props:
 *  - children: contenido a renderizar si hay sesión
 *  - rolesPermitidos?: arreglo de roles autorizados para esta ruta
 *  - requiereSetupInicial?: bloquea módulo si setup aún no está completo
 *  - nombreModulo?: texto a mostrar en aviso de bloqueo
 */
export default function ProtectedRoute({
  children,
  rolesPermitidos = EMPTY_ROLES,
  requiereSetupInicial = false,
  nombreModulo = EMPTY_LABEL
}) {
  const { estaAutenticado, usuario, esSuperadmin } = useAuth();
  const { cargando, requiereSetup } = useSetupStatus();

  if (!estaAutenticado) {
    return <Navigate to="/" replace />;
  }

  if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(usuario?.rol)) {
    let destino = '/';
    if (usuario?.rol === ROLES.SUPERADMIN) {
      destino = '/superadmin';
    } else if (usuario?.rol === ROLES.ADMIN || usuario?.rol === ROLES.SECRETARIO) {
      destino = '/registro';
    }
    return <Navigate to={destino} replace />;
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
