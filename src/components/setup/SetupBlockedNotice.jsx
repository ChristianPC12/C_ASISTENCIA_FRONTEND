import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSetupStatus } from '../../hooks/useSetupStatus';

const FALLBACK_FALTANTES = [];

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

export default function SetupBlockedNotice({ modulo = 'Este módulo' }) {
  const { esAdmin, esAdminTemporal, diasRestantesPassword } = useAuth();
  const { faltantes = FALLBACK_FALTANTES, error } = useSetupStatus();
  const faltantesVisibles = obtenerFaltantesVisibles(faltantes);

  return (
    <div className="container-fluid py-4">
      <div className="card shadow-sm border-0">
        <div className="card-body">
          <h2 className="h4 mb-3">{modulo} bloqueado temporalmente</h2>
          <p className="text-muted mb-3">
            Tu organización aún no completa la configuración inicial. Cuando se finalice el setup,
            este módulo se habilita automáticamente.
          </p>

          {esAdmin && (
            <div className="alert alert-warning" role="alert">
              <strong>Importante:</strong>{' '}
              {esAdminTemporal && Number.isInteger(diasRestantesPassword)
                ? `tu cuenta ADMIN temporal vence en ${Math.max(diasRestantesPassword, 0)} día(s). `
                : 'la cuenta ADMIN temporal tiene una vigencia máxima de 5 días desde su creación. '}
              Debes completar la configuración inicial antes del vencimiento para evitar bloqueo operativo.
            </div>
          )}

          {faltantesVisibles.length > 0 && (
            <div className="alert alert-warning" role="alert">
              <strong className="d-block mb-2">Pendientes por completar:</strong>
              <ul className="mb-0">
                {faltantesVisibles.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div className="alert alert-info" role="alert">
              {error}
            </div>
          )}

          {esAdmin ? (
            <Link to="/administrador" className="btn btn-primary">
              Ir a configuración inicial
            </Link>
          ) : (
            <div className="alert alert-secondary mb-0" role="alert">
              Solicite al usuario ADMIN completar el módulo <strong>Administrador</strong> para desbloquear la operación.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
