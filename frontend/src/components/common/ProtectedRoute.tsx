import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

type RoleType = 'admin' | 'parent' | 'student' | 'any';

interface ProtectedRouteProps {
  children: ReactNode | ((props: { user: any }) => React.ReactElement);
  requiredRole?: RoleType;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Mostra un loader mentre verifichiamo l'autenticazione
  if (isLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Utente non autenticato, reindirizza alla pagina di login
    return <Navigate to="/login" replace />;
  }

  // Se è richiesto un ruolo specifico e l'utente non ha quel ruolo
  if (requiredRole && requiredRole !== 'any' && user?.role !== requiredRole) {
    // Reindirizza alla dashboard appropriata in base al ruolo
    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    if (user?.role === 'parent') return <Navigate to="/parent" replace />;
    if (user?.role === 'student') return <Navigate to="/student" replace />;
    
    // Fallback alla home se per qualche motivo il ruolo non è riconosciuto
    return <Navigate to="/" replace />;
  }

  // Se children è una funzione, chiamala con l'utente corrente
  if (typeof children === 'function') {
    return children({ user });
  }

  // Altrimenti, renderizza children normalmente
  return <>{children}</>;
};

export default ProtectedRoute;
