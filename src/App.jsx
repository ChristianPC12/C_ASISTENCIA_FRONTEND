import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { SetupProvider, useSetupStatus } from './hooks/useSetupStatus';
import Sidebar from './components/layout/Sidebar';
import ProtectedRoute from './components/layout/ProtectedRoute';
import ToastContainer from './components/ui/ToastContainer';
import ConfirmModal from './components/ui/ConfirmModal';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegistroPage = lazy(() => import('./pages/RegistroPage'));
const RegistrosPage = lazy(() => import('./pages/RegistrosPage'));
const EstadisticasPage = lazy(() => import('./pages/EstadisticasPage'));
const ComparacionesPage = lazy(() => import('./pages/ComparacionesPage'));
const PresentacionesPage = lazy(() => import('./pages/PresentacionesPage'));
const CampanasPage = lazy(() => import('./pages/CampanasPage'));
const VisitasPage = lazy(() => import('./pages/VisitasPage'));
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

function SinAcceso() {
  return (
    <div className="container-fluid py-4">
      <div className="alert alert-warning mb-0" role="status">
        <i className="bi bi-shield-lock me-2" aria-hidden="true"></i>
        Su usuario aún no tiene secciones asignadas. Solicite acceso al administrador de su iglesia.
      </div>
    </div>
  );
}

/**
 * Componente interior que usa los hooks de auth dentro del BrowserRouter
 */
function AppContent() {
  const { usuario, estaAutenticado, cerrarSesion, rutaInicio: rutaInicioPermisos } = useAuth();
  const { requiereSetup } = useSetupStatus();
  const rutaInicio = rutaInicioPermisos || (requiereSetup ? '/administrador' : '/registro');

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
              <ProtectedRoute soloSuperadmin>
                <SuperadminPage />
              </ProtectedRoute>
            )}
          />

          <Route
            path="/administrador"
            element={(
              <ProtectedRoute soloAdmin>
                <AdministradorPage />
              </ProtectedRoute>
            )}
          />

          {/* Nuevo Registro */}
          <Route
            path="/registro"
            element={
              <ProtectedRoute
                seccion="asistencia"
                requiereEditor
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
                seccion="asistencia"
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
                seccion="estadisticas"
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
                seccion="comparaciones"
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
                seccion="presentaciones"
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
                seccion="campanas"
                requiereSetupInicial
                nombreModulo="Campanas"
              >
                <CampanasPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/visitas"
            element={(
              <ProtectedRoute
                seccion="visitas"
                requiereSetupInicial
                nombreModulo="Visitas"
              >
                <VisitasPage />
              </ProtectedRoute>
            )}
          />

          <Route
            path="/estudios-biblicos"
            element={
              <ProtectedRoute
                seccion="estudios_biblicos"
                requiereSetupInicial
                nombreModulo="Estudios Biblicos"
              >
                <EstudiosBiblicosPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/juntas-iglesia"
            element={
              <ProtectedRoute
                seccion="juntas_iglesia"
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
                soloAdmin
                requiereSetupInicial
                nombreModulo="Usuarios"
              >
                <Navigate to="/administrador" replace />
              </ProtectedRoute>
            }
          />

          <Route path="/sin-acceso" element={<SinAcceso />} />

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
