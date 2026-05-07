import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { SetupProvider, useSetupStatus } from './hooks/useSetupStatus';
import Sidebar from './components/layout/Sidebar';
import ProtectedRoute from './components/layout/ProtectedRoute';
import ToastContainer from './components/ui/ToastContainer';
import ConfirmModal from './components/ui/ConfirmModal';
import { ROLES } from './config/constants';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegistroPage = lazy(() => import('./pages/RegistroPage'));
const RegistrosPage = lazy(() => import('./pages/RegistrosPage'));
const EstadisticasPage = lazy(() => import('./pages/EstadisticasPage'));
const ComparacionesPage = lazy(() => import('./pages/ComparacionesPage'));
const PresentacionesPage = lazy(() => import('./pages/PresentacionesPage'));
const CampanasPage = lazy(() => import('./pages/CampanasPage'));
const EstudiosBiblicosPage = lazy(() => import('./pages/EstudiosBiblicosPage'));
const JuntasIglesiaPage = lazy(() => import('./pages/JuntasIglesiaPage'));
const SuperadminPage = lazy(() => import('./pages/SuperadminPage'));
const AdministradorPage = lazy(() => import('./pages/AdministradorPage'));

function RouteFallback() {
  return (
    <div className="container-fluid py-4">
      <div className="alert alert-light mb-0" role="status">
        Cargando módulo...
      </div>
    </div>
  );
}

/**
 * Componente interior que usa los hooks de auth dentro del BrowserRouter
 */
function AppContent() {
  const { usuario, estaAutenticado, esSuperadmin, esAdmin, cerrarSesion } = useAuth();
  const { requiereSetup } = useSetupStatus();
  const esRolEstudios = [ROLES.MINISTERIO_PERSONAL, ROLES.INSTRUCTOR_BIBLICO].includes(usuario?.rol);
  const rutaInicio = esSuperadmin
    ? '/superadmin'
    : (esRolEstudios ? '/estudios-biblicos' : (esAdmin && requiereSetup ? '/administrador' : '/registro'));

  /* Resetear scroll al cambiar el estado de autenticacion */
  useEffect(() => {
    window.scrollTo(0, 0);
    // Segundo reset tras render del nuevo layout
    const t = setTimeout(() => window.scrollTo(0, 0), 50);
    return () => clearTimeout(t);
  }, [estaAutenticado]);

  // Si no esta autenticado, mostrar solo login
  if (!estaAutenticado) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    );
  }

  // Autenticado: mostrar layout con sidebar
  return (
    <Sidebar usuario={usuario} onCerrarSesion={cerrarSesion}>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Redirigir raiz segun rol */}
          <Route path="/" element={<Navigate to={rutaInicio} replace />} />

          {/* Modulo SUPERADMIN */}
          <Route
            path="/superadmin"
            element={(
              <ProtectedRoute rolesPermitidos={[ROLES.SUPERADMIN]}>
                <SuperadminPage />
              </ProtectedRoute>
            )}
          />

          <Route
            path="/administrador"
            element={(
              <ProtectedRoute rolesPermitidos={[ROLES.ADMIN]}>
                <AdministradorPage />
              </ProtectedRoute>
            )}
          />

          {/* Nuevo Registro */}
          <Route
            path="/registro"
            element={
              <ProtectedRoute
                rolesPermitidos={[ROLES.ADMIN, ROLES.SECRETARIO]}
                requiereSetupInicial
                nombreModulo="Registro"
              >
                <RegistroPage />
              </ProtectedRoute>
            }
          />

        {/* Ver Registros */}
          <Route
            path="/registros"
            element={
              <ProtectedRoute
                rolesPermitidos={[ROLES.ADMIN, ROLES.SECRETARIO]}
                requiereSetupInicial
                nombreModulo="Registros"
              >
                <RegistrosPage />
              </ProtectedRoute>
            }
          />

        {/* Estadisticas */}
          <Route
            path="/estadisticas"
            element={
              <ProtectedRoute
                rolesPermitidos={[ROLES.ADMIN, ROLES.SECRETARIO]}
                requiereSetupInicial
                nombreModulo="Estadisticas"
              >
                <EstadisticasPage />
              </ProtectedRoute>
            }
          />

        {/* Comparaciones */}
          <Route
            path="/comparaciones"
            element={
              <ProtectedRoute
                rolesPermitidos={[ROLES.ADMIN, ROLES.SECRETARIO]}
                requiereSetupInicial
                nombreModulo="Comparaciones"
              >
                <ComparacionesPage />
              </ProtectedRoute>
            }
          />

        {/* Presentaciones */}
          <Route
            path="/presentaciones"
            element={
              <ProtectedRoute
                rolesPermitidos={[ROLES.ADMIN, ROLES.SECRETARIO]}
                requiereSetupInicial
                nombreModulo="Presentaciones"
              >
                <PresentacionesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/campanas"
            element={
              <ProtectedRoute
                rolesPermitidos={[ROLES.ADMIN, ROLES.SECRETARIO]}
                requiereSetupInicial
                nombreModulo="Campanas"
              >
                <CampanasPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/estudios-biblicos"
            element={
              <ProtectedRoute
                rolesPermitidos={[ROLES.ADMIN, ROLES.SECRETARIO, ROLES.MINISTERIO_PERSONAL, ROLES.INSTRUCTOR_BIBLICO]}
                requiereSetupInicial
                nombreModulo="Estudios Biblicos"
              >
                <EstudiosBiblicosPage />
              </ProtectedRoute>
            }
          />

          {/* Pequeñas Congregaciones module removed */}

          <Route
            path="/juntas-iglesia"
            element={
              <ProtectedRoute
                rolesPermitidos={[ROLES.ADMIN, ROLES.SECRETARIO]}
                requiereSetupInicial
                nombreModulo="Juntas de Iglesia"
              >
                <JuntasIglesiaPage />
              </ProtectedRoute>
            }
          />

        {/* Usuarios se administra desde /administrador */}
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute
                rolesPermitidos={[ROLES.ADMIN]}
                requiereSetupInicial
                nombreModulo="Usuarios"
              >
                <Navigate to="/administrador" replace />
              </ProtectedRoute>
            }
          />

          {/* Ruta no encontrada */}
          <Route path="*" element={<Navigate to={rutaInicio} replace />} />
        </Routes>
      </Suspense>
    </Sidebar>
  );
}

/**
 * Componente raiz de la aplicacion
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SetupProvider>
          <AppContent />
          <ToastContainer />
          <ConfirmModal />
        </SetupProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
