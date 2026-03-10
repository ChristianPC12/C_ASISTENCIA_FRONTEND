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
      return 'Reducir procedencias a maximo 10';
    case 'metricas':
      return 'Habilitar al menos una metrica';
    case 'dependencias_metricas':
      return 'Corregir dependencias entre metricas';
    default:
      return item;
  }
}

export default function SetupBlockedNotice({ modulo = 'Este modulo' }) {
  const { esAdmin } = useAuth();
  const { faltantes = FALLBACK_FALTANTES, error } = useSetupStatus();

  return (
    <div className="container-fluid py-4">
      <div className="card shadow-sm border-0">
        <div className="card-body">
          <h2 className="h4 mb-3">{modulo} bloqueado temporalmente</h2>
          <p className="text-muted mb-3">
            Tu organizacion aun no completa la configuracion inicial. Cuando se finalice el setup, este modulo se habilita automaticamente.
          </p>

          {Array.isArray(faltantes) && faltantes.length > 0 && (
            <div className="alert alert-warning" role="alert">
              <strong className="d-block mb-2">Pendientes por completar:</strong>
              <ul className="mb-0">
                {faltantes.map((item) => (
                  <li key={item}>{traducirFaltante(item)}</li>
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
              Ir a configuracion inicial
            </Link>
          ) : (
            <div className="alert alert-secondary mb-0" role="alert">
              Solicite al usuario ADMIN completar el modulo <strong>Administrador</strong> para desbloquear la operacion.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
