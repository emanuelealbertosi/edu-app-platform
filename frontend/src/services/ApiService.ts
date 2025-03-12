import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiErrorHandler } from './ApiErrorHandler';
import AuthService from './AuthService';

// Fix per errore lint: "Cannot find name 'process'"
declare const process: {
  env: {
    REACT_APP_API_URL?: string;
  };
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * Servizio base per le chiamate API che gestisce automaticamente:
 * - Autenticazione con token JWT
 * - Gestione errori unificata
 * - Retry automatici
 * - Timeout e cancellazione richieste
 */
class ApiService {
  private api: AxiosInstance;
  private errorHandler: ApiErrorHandler;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Configura l'handler degli errori
    this.errorHandler = new ApiErrorHandler({
      onError: (error) => {
        console.error('Errore API:', error);
        // Implementare qui eventuali notifiche UI globali per errori
      },
      timeout: 15000, // 15 secondi
      maxRetries: 2,
      retryStatusCodes: [408, 429, 500, 502, 503, 504]
    });

    // Configura gli interceptor
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Interceptor per aggiungere il token di autenticazione
    this.api.interceptors.request.use(
      (config) => {
        // Otteniamo il token direttamente dal localStorage
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor per gestire gli errori di autenticazione e refresh token
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Se l'errore è 401 (Unauthorized) e non è già un retry
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            // Tenta di refreshare il token
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
              // Nessun refresh token disponibile, richiede login
              await AuthService.logout();
              return Promise.reject(error);
            }
            
            // Utilizziamo il metodo pubblico refreshTokens del AuthService
            const tokens = await AuthService.refreshTokens(refreshToken);
            
            // Salviamo i nuovi token nel localStorage
            localStorage.setItem('accessToken', tokens.accessToken);
            localStorage.setItem('refreshToken', tokens.refreshToken);
            
            // Riprova la richiesta originale con il nuovo token
            originalRequest.headers['Authorization'] = `Bearer ${tokens.accessToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            // Se il refresh fallisce, logout
            await AuthService.logout();
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );

    // Configura gli interceptor di gestione errori
    this.errorHandler.setupAxiosInterceptors(this.api);
  }

  /**
   * Esegue una richiesta GET
   */
  public async get<T = any>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.get<T>(path, config);
    return response.data;
  }

  /**
   * Esegue una richiesta POST
   */
  public async post<T = any>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.post<T>(path, data, config);
    return response.data;
  }

  /**
   * Esegue una richiesta PUT
   */
  public async put<T = any>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.put<T>(path, data, config);
    return response.data;
  }

  /**
   * Esegue una richiesta DELETE
   */
  public async delete<T = any>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.delete<T>(path, config);
    return response.data;
  }

  /**
   * Ottiene l'istanza axios configurata per utilizzo diretto
   */
  public getAxiosInstance(): AxiosInstance {
    return this.api;
  }
}

// Esporta una singola istanza del servizio
export default new ApiService();
