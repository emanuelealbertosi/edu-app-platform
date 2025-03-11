import axios, { AxiosInstance } from 'axios';

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

class AuthService {
  private api: AxiosInstance;
  private refreshTokenTimeout?: NodeJS.Timeout;

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
    const response = await this.api.post<AuthResponse>('/login', credentials);
    const { accessToken, refreshToken, user } = response.data;
    this.setTokens(accessToken, refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    return response.data;
  }

  public async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/register', userData);
    const { accessToken, refreshToken, user } = response.data;
    this.setTokens(accessToken, refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    return response.data;
  }

  public async refreshTokens(refreshToken: string): Promise<TokenResponse> {
    const response = await this.api.post<TokenResponse>('/refresh', { refreshToken });
    return response.data;
  }

  public async getProfile(): Promise<ProfileResponse> {
    const response = await this.api.get<ProfileResponse>('/profile');
    return response.data;
  }

  public logout(): void {
    // Pulisci timeout refresh
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
      this.refreshTokenTimeout = undefined;
    }
    
    // Rimuovi token e dati utente
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Chiamata al server per invalidare refresh token
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.api.post('/logout', { refreshToken }).catch(console.error);
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
}

// Esporta una singola istanza del servizio
export default new AuthService();
