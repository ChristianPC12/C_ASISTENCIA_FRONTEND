import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Sidebar from './components/layout/Sidebar';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegistroPage from './pages/RegistroPage';
import RegistrosPage from './pages/RegistrosPage';
import UsuarioPage from './pages/UsuarioPage';
import { ROLES } from './config/constants';

/**
 * Componente interior que usa los hooks de auth dentro del BrowserRouter
 */
function AppContent() {
  const { usuario, estaAutenticado, esAdmin, cerrarSesion } = useAuth();

  // Si no esta autenticado, mostrar solo login
  if (!estaAutenticado) {
    return (
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Autenticado: mostrar layout con sidebar
  return (
    <Sidebar usuario={usuario} onCerrarSesion={cerrarSesion}>
      <Routes>
        {/* Redirigir raiz a registro */}
        <Route path="/" element={<Navigate to="/registro" replace />} />

        {/* Nuevo Registro */}
        <Route
          path="/registro"
          element={
            <ProtectedRoute>
              <RegistroPage />
            </ProtectedRoute>
          }
        />

        {/* Ver Registros */}
        <Route
          path="/registros"
          element={
            <ProtectedRoute>
              <RegistrosPage />
            </ProtectedRoute>
          }
        />

        {/* Usuarios (solo ADMIN) */}
        <Route
          path="/usuarios"
          element={
            <ProtectedRoute>
              {esAdmin ? (
                <UsuarioPage />
              ) : (
                <Navigate to="/registro" replace />
              )}
            </ProtectedRoute>
          }
        />

        {/* Ruta no encontrada */}
        <Route path="*" element={<Navigate to="/registro" replace />} />
      </Routes>
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
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
