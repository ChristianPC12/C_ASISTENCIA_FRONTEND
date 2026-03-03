import { Navigate } from 'react-router-dom';

/**
 * Wrapper que redirige al login si no hay token
 * Props:
 *  - children: contenido a renderizar si hay sesion
 */
export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
}
