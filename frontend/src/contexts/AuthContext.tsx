import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AuthService from '../services/AuthService';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'parent' | 'student';
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verifica se l'utente è già autenticato al caricamento dell'app
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        // Recupera l'utente corrente dal localStorage (salvato dal AuthService)
        const currentUser = AuthService.getCurrentUser();
        
        if (currentUser) {
          // Se l'utente esiste, verifica che il token sia valido
          if (AuthService.isAuthenticated()) {
            setUser(currentUser);
          } else {
            // Se il token non è valido, logout
            AuthService.logout();
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Errore durante la verifica dello stato di autenticazione:', err);
        setError('Errore durante il controllo dell\'autenticazione');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await AuthService.login({ email, password });
      setUser(response.user);
    } catch (err: any) {
      console.error('Errore durante il login:', err);
      setError(err.response?.data?.message || 'Errore durante il login');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'parent' | 'student';
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await AuthService.register(userData);
      setUser(response.user);
    } catch (err: any) {
      console.error('Errore durante la registrazione:', err);
      setError(err.response?.data?.message || 'Errore durante la registrazione');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        loading,
        error,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
