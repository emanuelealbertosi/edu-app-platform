import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Tipologie di errori API gestiti
 */
export enum ApiErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Interfaccia per gli errori API standardizzati
 */
export interface ApiError {
  type: ApiErrorType;
  status?: number;
  message: string;
  details?: any;
  originalError?: any;
}

/**
 * Opzioni per la configurazione dell'handler degli errori
 */
export interface ApiErrorHandlerOptions {
  /**
   * Callback da eseguire per ogni errore
   */
  onError?: (error: ApiError) => void;
  
  /**
   * Timeout in millisecondi per le richieste
   */
  timeout?: number;
  
  /**
   * Numero massimo di tentativi per richieste fallite
   */
  maxRetries?: number;
  
  /**
   * Lista di codici di errore per cui tentare un nuovo invio
   */
  retryStatusCodes?: number[];
  
  /**
   * Se true, mostra automaticamente notifiche per gli errori
   */
  showNotifications?: boolean;
}

/**
 * Classe per la gestione degli errori API
 */
export class ApiErrorHandler {
  private options: ApiErrorHandlerOptions;
  private notificationService?: any;
  
  constructor(options: ApiErrorHandlerOptions = {}) {
    this.options = {
      timeout: 30000, // 30 secondi di default
      maxRetries: 2,
      retryStatusCodes: [408, 429, 500, 502, 503, 504],
      showNotifications: true,
      ...options
    };
    
    // Importazione dinamica per evitare dipendenze circolari
    import('./NotificationsService').then(module => {
      this.notificationService = module.default;
    }).catch(err => {
      console.warn('Impossibile caricare NotificationsService:', err);
    });
  }
  
  /**
   * Configura un'istanza axios con gli interceptor per la gestione degli errori
   */
  setupAxiosInterceptors(axiosInstance: any): void {
    // Configura il timeout globale
    axiosInstance.defaults.timeout = this.options.timeout;
    
    // Interceptor per la richiesta
    axiosInstance.interceptors.request.use(
      (config: AxiosRequestConfig) => {
        // Aggiunge un contatore di tentativi alla configurazione
        config.headers = config.headers || {};
        config.headers['x-retry-count'] = config.headers['x-retry-count'] || 0;
        return config;
      },
      (error: any) => Promise.reject(error)
    );
    
    // Interceptor per la risposta
    axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const apiError = this.normalizeError(error);
        
        // Gestione dei ritentativi per errori di rete o server
        const config = error.config as any;
        if (config && this.shouldRetry(error, config)) {
          config.headers['x-retry-count'] = (config.headers['x-retry-count'] || 0) + 1;
          
          // Attesa esponenziale prima del nuovo tentativo
          const delay = this.getRetryDelay(config.headers['x-retry-count']);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Ritenta la richiesta
          return axiosInstance(config);
        }
        
        // Notifica l'errore tramite callback se configurato
        if (this.options.onError) {
          this.options.onError(apiError);
        }
        
        return Promise.reject(apiError);
      }
    );
  }
  
  /**
   * Normalizza vari tipi di errori in un formato standard ApiError
   */
  normalizeError(error: any): ApiError {
    const apiError = this.mapErrorToApiError(error);
    
    // Mostra notifica se richiesto
    if (this.options.showNotifications && this.notificationService) {
      this.showErrorNotification(apiError);
    }
    
    return apiError;
  }
  
  /**
   * Mappa un errore al formato standardizzato ApiError
   */
  private mapErrorToApiError(error: any): ApiError {
    if (axios.isAxiosError(error)) {
      // Errore di rete (nessuna risposta dal server)
      if (error.code === 'ECONNABORTED' || !error.response) {
        return {
          type: ApiErrorType.TIMEOUT,
          message: 'La richiesta è scaduta. Controlla la tua connessione.',
          originalError: error
        };
      }
      
      const { status, data } = error.response || {};
      
      // Mappa il codice di stato HTTP al tipo di errore
      switch (status) {
        case 400:
          return {
            type: ApiErrorType.VALIDATION_ERROR,
            status,
            message: data?.message || 'Dati non validi.',
            details: data?.details,
            originalError: error
          };
        case 401:
          return {
            type: ApiErrorType.UNAUTHORIZED,
            status,
            message: data?.message || 'Sessione scaduta. Effettua nuovamente l\'accesso.',
            originalError: error
          };
        case 403:
          return {
            type: ApiErrorType.FORBIDDEN,
            status,
            message: data?.message || 'Non hai i permessi necessari per questa operazione.',
            originalError: error
          };
        case 404:
          return {
            type: ApiErrorType.NOT_FOUND,
            status,
            message: data?.message || 'Risorsa non trovata.',
            originalError: error
          };
        case 408:
        case 429:
          return {
            type: ApiErrorType.TIMEOUT,
            status,
            message: data?.message || 'Troppe richieste. Riprova più tardi.',
            originalError: error
          };
        case 500:
        case 502:
        case 503:
        case 504:
          return {
            type: ApiErrorType.SERVER_ERROR,
            status,
            message: data?.message || 'Errore del server. Riprova più tardi.',
            originalError: error
          };
        default:
          return {
            type: ApiErrorType.UNKNOWN,
            status,
            message: data?.message || 'Si è verificato un errore imprevisto.',
            originalError: error
          };
      }
    }
    
    // Errore generico non-Axios
    return {
      type: ApiErrorType.UNKNOWN,
      message: error?.message || 'Si è verificato un errore imprevisto.',
      originalError: error
    };
  }
  
  /**
   * Mostra una notifica per l'errore API
   */
  private showErrorNotification(error: ApiError): void {
    if (!this.notificationService) return;
    
    let title = 'Errore';
    let autoClose = false;
    
    switch (error.type) {
      case ApiErrorType.NETWORK_ERROR:
        title = 'Errore di rete';
        break;
      case ApiErrorType.UNAUTHORIZED:
        title = 'Autenticazione richiesta';
        break;
      case ApiErrorType.FORBIDDEN:
        title = 'Accesso negato';
        break;
      case ApiErrorType.NOT_FOUND:
        title = 'Risorsa non trovata';
        break;
      case ApiErrorType.VALIDATION_ERROR:
        title = 'Dati non validi';
        break;
      case ApiErrorType.SERVER_ERROR:
        title = 'Errore del server';
        break;
      case ApiErrorType.TIMEOUT:
        title = 'Timeout della richiesta';
        break;
    }
    
    this.notificationService.error(error.message, title, {
      autoClose,
      details: error.details
    });
  }
  
  /**
   * Determina se una richiesta fallita dovrebbe essere ritentata
   */
  private shouldRetry(error: AxiosError, config: any): boolean {
    // Non ritenta se abbiamo raggiunto il massimo numero di tentativi
    const retryCount = config.headers['x-retry-count'] || 0;
    if (retryCount >= (this.options.maxRetries || 0)) {
      return false;
    }
    
    // Ritenta per errori di rete
    if (!error.response) {
      return true;
    }
    
    // Ritenta solo per specifici codici di stato
    const { status } = error.response;
    return this.options.retryStatusCodes?.includes(status) || false;
  }
  
  /**
   * Calcola il tempo di attesa tra i tentativi (con backoff esponenziale)
   */
  private getRetryDelay(retryCount: number): number {
    // Implementa un backoff esponenziale con jitter
    const baseDelay = 1000; // 1 secondo
    const maxDelay = 10000; // 10 secondi
    const exponentialDelay = Math.min(maxDelay, baseDelay * Math.pow(2, retryCount));
    
    // Aggiungi jitter (±20%) per evitare il "thundering herd problem"
    const jitter = 0.2 * exponentialDelay * (Math.random() - 0.5);
    
    return exponentialDelay + jitter;
  }
}

// Esporta un'istanza predefinita
export default new ApiErrorHandler();
