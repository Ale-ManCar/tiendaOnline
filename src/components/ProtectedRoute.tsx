import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export function ProtectedRoute({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { currentUser, authReady } = useStore();

  if (!authReady) {
    return (
      <main className="container not-found" role="status" aria-live="polite">
        <span className="eyebrow">SESIÓN</span>
        <h1>Validando acceso</h1>
        <p>Estamos comprobando tu sesión antes de continuar.</p>
      </main>
    );
  }

  if (!currentUser) return <Navigate to="/" replace />;

  if (admin && currentUser.role !== 'admin') {
    return (
      <main className="container not-found" role="alert">
        <span className="eyebrow">ACCESO RESTRINGIDO</span>
        <h1>Panel administrativo</h1>
        <p>Esta sección está disponible únicamente para usuarios administradores.</p>
      </main>
    );
  }

  return children;
}
