import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import axios from 'axios';
import jwtDecode from 'jwt-decode';

// Interfacce TypeScript
interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'parent' | 'student';
  firstName?: string;
  lastName?: string;
}

interface DecodedToken {
  sub: string;
  role: 'admin' | 'parent' | 'student';
  exp: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'parent' | 'student';
  firstName?: string;
  lastName?: string;
}

interface AuthProviderProps {
  children: ReactNode;
}

// API client configurato
const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api', // API Gateway
  headers: {
    'Content-Type': 'application/json',
  },
});

// Aggiungi interceptor per gestire automaticamente il token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor per gestire token scaduti e refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Se è una 401 e non è già un tentativo di refresh
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Tenta di fare refresh del token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        
        const response = await axios.post('http://localhost:8000/api/auth/refresh', {
          refresh_token: refreshToken,
        });
        
        const { access_token, refresh_token } = response.data;
        
        // Salva i nuovi token
        localStorage.setItem('accessToken', access_token);
        localStorage.setItem('refreshToken', refresh_token);
        
        // Ritenta la richiesta originale con il nuovo token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // Fallimento del refresh, logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Creazione del contesto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider del contesto
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Controlla se l'utente è autenticato basandosi sul token
  const isAuthenticated = !!user;
  
  // Verifica il token e carica i dati utente all'avvio
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      
      if (token) {
        try {
          // Verifica scadenza token
          const decoded = jwtDecode<DecodedToken>(token);
          const currentTime = Date.now() / 1000;
          
          if (decoded.exp < currentTime) {
            // Token scaduto, prova a refreshare
            await refreshToken();
          } else {
            // Token valido, carica dati utente
            await loadUserData();
          }
        } catch (error) {
          console.error('Error initializing auth:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      
      setIsLoading(false);
    };
    
    initAuth();
  }, []);
  
  // Carica i dati dell'utente dal server
  const loadUserData = async () => {
    try {
      const response = await apiClient.get('/users/me');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to load user data:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };
  
  // Refresh del token
  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token');
      }
      
      const response = await axios.post('http://localhost:8000/api/auth/refresh', {
        refresh_token: refreshToken,
      });
      
      const { access_token, refresh_token } = response.data;
      
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      
      await loadUserData();
    } catch (error) {
      console.error('Token refresh failed:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };
  
  // Login
  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });
      
      const { access_token, refresh_token } = response.data;
      
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      
      await loadUserData();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };
  
  // Registrazione
  const register = async (userData: RegisterData) => {
    try {
      await apiClient.post('/auth/register', userData);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };
  
  // Logout
  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await apiClient.post('/auth/logout', {
          refresh_token: refreshToken,
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };
  
  // Verifica se l'utente ha un ruolo specifico
  const hasRole = (role: string) => {
    return user?.role === role;
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizzato per usare il contesto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
