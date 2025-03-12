import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AuthService from '../services/AuthService';
import { NotificationsService } from '../services/NotificationsService';

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
  sessionStatus: 'active' | 'expired' | 'invalid';
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    username: string; // Aggiunto username per compatibilità con RegisterForm
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'parent' | 'student';
  }) => Promise<void>;
  logout: (logoutAllDevices?: boolean) => Promise<void>;
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
  const [sessionStatus, setSessionStatus] = useState<'active' | 'expired' | 'invalid'>('active');

  // Funzione per verificare e aggiornare lo stato della sessione
  const checkSessionValidity = useCallback(async () => {
    if (!user) return;
    
    try {
      const isValid = await AuthService.validateSession({
        onLogout: () => {
          setSessionStatus('expired');
          setUser(null);
          setError('La tua sessione è scaduta. Effettua nuovamente il login.');
        }
      });
      
      if (!isValid) {
        setSessionStatus('invalid');
      } else {
        setSessionStatus('active');
      }
    } catch (err) {
      console.error('Errore durante la validazione della sessione:', err);
      setSessionStatus('invalid');
    }
  }, [user]);

  // Verifica periodicamente la validità della sessione (ogni 5 minuti)
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      checkSessionValidity();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user, checkSessionValidity]);

  useEffect(() => {
    // Verifica se l'utente è già autenticato al caricamento dell'app
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        // Recupera l'utente corrente dal localStorage (salvato dal AuthService)
        const currentUser = AuthService.getCurrentUser();
        
        if (currentUser) {
          // Se l'utente esiste, verifica che il token sia valido
          const isValid = await AuthService.validateSession();
          if (isValid) {
            setUser(currentUser);
            setSessionStatus('active');
          } else {
            // Se il token non è valido, logout
            await AuthService.logout();
            setUser(null);
            setSessionStatus('expired');
            setError('La tua sessione è scaduta. Effettua nuovamente il login.');
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
      // Estrai i dati del token per ottenere i dati utente
      // Il metodo getUserFromToken viene chiamato all'interno di login
      // e il risultato viene memorizzato in localStorage
      const userFromStorage = localStorage.getItem('user');
      if (userFromStorage) {
        const user = JSON.parse(userFromStorage);
        setUser(user);
      } else {
        setError('Impossibile recuperare i dati dell\'utente dal token');
      }
      // Rimuoviamo la notifica di successo qui perché è già gestita in AuthService
      // NotificationsService.success('Login effettuato', 'Bentornato!');
    } catch (err: any) {
      console.error('Errore durante il login:', err);
      const errorMessage = err.response?.data?.message || 'Errore durante il login';
      setError(errorMessage);
      // Rimuoviamo la notifica di errore qui perché è già gestita in AuthService
      // NotificationsService.error('Errore di autenticazione', errorMessage);
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
      // Estrai i dati del token per ottenere i dati utente
      // Il metodo getUserFromToken viene chiamato all'interno di register
      // e il risultato viene memorizzato in localStorage
      const userFromStorage = localStorage.getItem('user');
      if (userFromStorage) {
        const user = JSON.parse(userFromStorage);
        setUser(user);
      } else {
        // Fallback: creare un user object basato sui dati di registrazione
        setUser({
          id: 'temp-id', // Verrà sostituito dall'ID reale al prossimo login
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role
        });
      }
      // Notifica già gestita in AuthService, rimuoviamo da qui
      // NotificationsService.success('Registrazione completata', 'Account creato con successo!');
    } catch (err: any) {
      console.error('Errore durante la registrazione:', err);
      const errorMessage = err.response?.data?.message || 'Errore durante la registrazione';
      setError(errorMessage);
      NotificationsService.error('Errore di registrazione', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (logoutAllDevices: boolean = false) => {
    try {
      await AuthService.logout(logoutAllDevices);
      setUser(null);
    } catch (err: any) {
      console.error('Errore durante il logout:', err);
      setError(err.response?.data?.message || 'Errore durante il logout');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        loading,
        error,
        sessionStatus,
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
