import axios, { AxiosInstance } from 'axios';
import NotificationsService from './NotificationsService';

// Fix per errore lint: "Cannot find name 'process'"
declare const process: {
  env: {
    REACT_APP_API_URL?: string;
  };
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const AUTH_API_URL = `${API_URL}/auth`;

/**
 * Servizio per gestire le operazioni di autenticazione
 * Integra con auth-service attraverso l'API Gateway
 */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'parent' | 'student';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface ProfileResponse {
  id: string;
  userId: string;
  // Campi specifici per profilo parent
  parentFields?: {
    children: string[]; // IDs degli studenti associati
  };
  // Campi specifici per profilo student
  studentFields?: {
    age: number;
    parentId: string;
    points: number;
  };
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface TokenRefreshOptions {
  /**
   * Se true, refresha il token anche se non è ancora scaduto
   */
  forceRefresh?: boolean;
  
  /**
   * Callback da eseguire se il refresh fallisce e l'utente viene disconnesso
   */
  onLogout?: () => void;
}

class AuthService {
  private api: AxiosInstance;
  // Fix per errore lint: "Cannot find namespace 'NodeJS'"
  private refreshTokenTimeout?: ReturnType<typeof setTimeout>;

  constructor() {
    this.api = axios.create({
      baseURL: AUTH_API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor per aggiungere il token di autenticazione
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor per gestire errori di autenticazione
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Se l'errore è 401 (Unauthorized) e non è già un retry
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            // Tenta di refreshare il token
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) {
              // Nessun refresh token disponibile, richiede login
              this.logout();
              return Promise.reject(error);
            }
            
            const newTokens = await this.refreshTokens(refreshToken);
            this.setTokens(newTokens.accessToken, newTokens.refreshToken);
            
            // Riprova la richiesta originale con il nuovo token
            originalRequest.headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            // Se il refresh fallisce, logout
            this.logout();
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Metodi privati per gestione token
  private getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    // Avvia timer per refresh automatico
    this.startRefreshTokenTimer(accessToken);
  }

  private startRefreshTokenTimer(token: string): void {
    // Decodifica token per calcolare scadenza
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expires = new Date(payload.exp * 1000);
    // Calcola il tempo rimanente meno 1 minuto
    const timeout = expires.getTime() - Date.now() - (60 * 1000);
    
    // Pulisci timeout esistente se presente
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }
    
    // Imposta nuovo timeout per refreshare prima della scadenza
    this.refreshTokenTimeout = setTimeout(() => this.refreshIfNeeded(), timeout > 0 ? timeout : 0);
  }

  private async refreshIfNeeded(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      try {
        const tokens = await this.refreshTokens(refreshToken);
        this.setTokens(tokens.accessToken, tokens.refreshToken);
      } catch (error) {
        console.error('Auto-refresh fallito:', error);
        this.logout();
      }
    }
  }

  // Metodi pubblici per operazioni di autenticazione
  public async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/login', credentials);
      const { accessToken, refreshToken, user } = response.data;
      this.setTokens(accessToken, refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Mostra notifica di benvenuto con il nome utente
      NotificationsService.success(
        `Benvenuto ${user.firstName}! Accesso effettuato con successo.`,
        'Login completato',
        { autoClose: true, duration: 3000 }
      );
      
      return response.data;
    } catch (error) {
      // Gli errori sono già gestiti dall'ApiErrorHandler
      throw error;
    }
  }

  public async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/register', userData);
      const { accessToken, refreshToken, user } = response.data;
      this.setTokens(accessToken, refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Mostra notifica di registrazione completata
      NotificationsService.success(
        `Benvenuto ${user.firstName}! La tua registrazione è stata completata con successo.`,
        'Registrazione completata',
        { autoClose: true, duration: 5000 }
      );
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  public async refreshTokens(refreshToken: string): Promise<TokenResponse> {
    const response = await this.api.post<TokenResponse>('/refresh', { refreshToken });
    return response.data;
  }

  public async getProfile(): Promise<ProfileResponse> {
    const response = await this.api.get<ProfileResponse>('/profile');
    return response.data;
  }

  public async logout(logoutAllDevices: boolean = false): Promise<void> {
    try {
      // Pulisci timeout refresh token se presente
      if (this.refreshTokenTimeout) {
        clearTimeout(this.refreshTokenTimeout);
      }
      
      const refreshToken = this.getRefreshToken();
      // Se l'utente è autenticato, tenta logout sul server (revoca token)
      if (refreshToken) {
        if (logoutAllDevices) {
          // Logout da tutti i dispositivi
          await this.api.post('/logout-all', { refreshToken });
          NotificationsService.info(
            'Sei stato disconnesso da tutti i dispositivi.',
            'Logout completato',
            { autoClose: true, duration: 4000 }
          );
        } else {
          // Logout solo dal dispositivo corrente
          await this.api.post('/logout', { refreshToken });
          NotificationsService.info(
            'Disconnessione effettuata con successo.',
            'Logout completato',
            { autoClose: true, duration: 3000 }
          );
        }
      }
    } catch (error) {
      console.error('Errore durante il logout:', error);
    } finally {
      // Rimuovi dati locali indipendentemente da errori di rete
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  public isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  public getCurrentUser(): any {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  }

  /**
   * Forza il refresh del token di accesso, indipendentemente dalla sua scadenza.
   * Utile quando si sospetta che il token corrente non sia più valido.
   */
  public async forceTokenRefresh(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) return false;
      
      const tokens = await this.refreshTokens(refreshToken);
      this.setTokens(tokens.accessToken, tokens.refreshToken);
      
      NotificationsService.info(
        'La tua sessione è stata aggiornata.',
        'Sessione aggiornata',
        { autoClose: true, duration: 3000 }
      );
      
      return true;
    } catch (error) {
      console.error('Force refresh fallito:', error);
      this.logout();
      
      NotificationsService.error(
        'La tua sessione è scaduta. Effettua nuovamente il login.',
        'Sessione scaduta',
        { autoClose: true, duration: 5000 }
      );
      
      return false;
    }
  }

  /**
   * Verifica lo stato di autenticazione e refresha il token se necessario.
   * Ritorna true se l'utente è autenticato dopo l'operazione, false altrimenti.
   */
  public async validateSession(options: TokenRefreshOptions = {}): Promise<boolean> {
    const token = this.getAccessToken();
    if (!token) {
      return false;
    }
    
    // Se forceRefresh è true, refresha il token indipendentemente dalla scadenza
    if (options.forceRefresh) {
      return this.forceTokenRefresh();
    }
    
    // Verifica se il token è scaduto
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expires = new Date(payload.exp * 1000);
      const now = new Date();
      
      // Se il token scade entro 5 minuti, refreshalo
      const tokenNeedsRefresh = expires.getTime() - now.getTime() < 5 * 60 * 1000;
      
      if (tokenNeedsRefresh) {
        return this.forceTokenRefresh();
      }
      
      return true;
    } catch (error) {
      console.error('Errore nella validazione del token:', error);
      this.logout();
      if (options.onLogout) {
        options.onLogout();
      }
      return false;
    }
  }
}

// Esporta una singola istanza del servizio
export default new AuthService();
