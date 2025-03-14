import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

// Utilizziamo un'importazione dinamica per evitare dipendenze circolari
let NotificationsService: any = null;
import('./NotificationsService').then(module => {
  NotificationsService = module.NotificationsService;
});

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
  
  /**
   * Metodo statico per gestire gli errori API (per compatibilità)
   */
  static handleApiError(error: any, message?: string): ApiError {
    const handler = new ApiErrorHandler();
    return handler.handleApiError(error, message);
  }

  /**
   * Metodo per gestire gli errori API
   */
  handleApiError(error: any, message?: string): ApiError {
    const apiError = this.normalizeError(error);
    
    if (message) {
      apiError.message = message;
    }
    
    if (this.options.showNotifications) {
      this.showErrorNotification(apiError);
    }
    
    if (this.options.onError) {
      this.options.onError(apiError);
    }
    
    return apiError;
  }
  
  constructor(options: ApiErrorHandlerOptions = {}) {
    this.options = {
      timeout: 30000, // 30 secondi di default
      maxRetries: 2,
      retryStatusCodes: [408, 429, 500, 502, 503, 504],
      showNotifications: true,
      ...options
    };
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
    
    // Verifica se l'errore è relativo al login o se è un errore di ricompense ignorabile
    // Ciò eviterà notifiche duplicate o non necessarie
    const isLoginError = this.isLoginRelatedError(error);
    const isIgnorableError = this.isIgnorableRewardError(error);
    
    if (isLoginError) {
      console.log('[DEBUG ERROR HANDLER] Errore relativo al login, skippo notifica per evitare duplicati');
    } else if (isIgnorableError) {
      console.log('[DEBUG ERROR HANDLER] Errore 404 relativo alle ricompense, skippo notifica');
    } else if (this.options.showNotifications) {
      console.log('[DEBUG ERROR HANDLER] Mostro notifica per errore non relativo al login');
      this.showErrorNotification(apiError);
    }
    
    return apiError;
  }
  
  /**
   * Verifica se l'errore è relativo a un tentativo di login
   */
  private isLoginRelatedError(error: any): boolean {
    // Verifica se l'errore è di tipo Axios e contiene un URL
    if (axios.isAxiosError(error) && error.config?.url) {
      // Controlla se l'URL contiene 'login'
      return error.config.url.includes('/login');
    }
    return false;
  }
  
  /**
   * Verifica se l'errore è un 404 che può essere ignorato (ricompense, templates, favicon, ecc.)
   */
  private isIgnorableRewardError(error: any): boolean {
    // Verifica se l'errore è di tipo Axios, è un 404 e contiene un URL
    if (axios.isAxiosError(error) && error.response?.status === 404 && error.config?.url) {
      // Lista di pattern da ignorare per errori 404
      const ignorablePatterns = [
        '/reward/',
        '/rewards/',
        '/api/rewards',
        '/api/templates',
        '/templates/',
        '/favicon.ico',
        '/api/parent',
        '/parent/',
        '/api/points'
      ];
      
      // Verifica se l'URL contiene uno dei pattern ignorabili
      for (const pattern of ignorablePatterns) {
        if (error.config.url.includes(pattern)) {
          console.log(`[DEBUG ERROR HANDLER] Ignorato errore 404 per URL: ${error.config.url}`);
          return true;
        }
      }
    }
    return false;
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
  
  // Teniamo traccia degli errori recenti per evitare duplicazioni 
  private recentErrors: Set<string> = new Set();
  private readonly ERROR_MEMORY_TIME = 5000; // 5 secondi di "memoria"

  /**
   * Mostra una notifica per l'errore API
   */
  private showErrorNotification(error: ApiError): void {
    try {
      // Aggiungi log diagnostici dettagliati per ogni errore
      console.log('=== ERRORE DA NOTIFICARE ===');
      console.log('Tipo errore:', error.type);
      console.log('Status:', error.status);
      console.log('Messaggio:', error.message);
      console.log('Request URL:', error.originalError?.config?.url || 'N/A');
      console.log('Detail:', error.details);
      
      // Controlliamo gli URL per far gestire certi errori direttamente dal servizio relativo
      const url = error.originalError?.config?.url || '';
      if (url.includes('/api/rewards') || url.includes('/api/templates')) {
        console.log('URL relativo alle ricompense, la notifica sarà gestita dal servizio RewardService');
        return;
      }
      
      // Non mostrare notifiche per errori vuoti o con messaggi generici
      if (!error.message || error.message === 'Risorsa non trovata.' || 
          (error.type === ApiErrorType.NOT_FOUND && !error.details)) {
        console.log('Skipping generic/empty notification');
        return;
      }
      
      // Evitiamo duplicazioni di errori simili in breve tempo
      const errorKey = `${error.type}-${error.status}-${error.message}`;
      if (this.recentErrors.has(errorKey)) {
        console.log('Errore simile mostrato di recente, evito duplicazione');
        return;
      }
      
      // Aggiungiamo questo errore ai recenti e lo rimuoviamo dopo un po'
      this.recentErrors.add(errorKey);
      setTimeout(() => {
        this.recentErrors.delete(errorKey);
      }, this.ERROR_MEMORY_TIME);
      
      // Se NotificationsService non è ancora pronto, logghiamo e non facciamo niente
      if (!NotificationsService) {
        console.warn('NotificationsService non ancora disponibile. Errore non mostrato:', error.message);
        return;
      }
      
      switch (error.type) {
        case ApiErrorType.NETWORK_ERROR:
          NotificationsService.showError('Errore di connessione: Verifica la tua connessione internet.', 'Errore di rete');
          break;
        case ApiErrorType.UNAUTHORIZED:
          NotificationsService.showWarning('Sessione scaduta. Effettua nuovamente il login.');
          break;
        case ApiErrorType.VALIDATION_ERROR:
          if (Array.isArray(error.details)) {
            const detailsText = error.details
              .map((detail: any) => {
                if (detail.loc && detail.msg) {
                  return `${detail.msg}`;
                }
                return detail.toString();
              })
              .join('\n');
            
            NotificationsService.showError('Errori di validazione', detailsText);
          } else {
            NotificationsService.showError(`Errore: ${error.message}`, 
              error.details ? JSON.stringify(error.details, null, 2) : undefined);
          }
          break;
        case ApiErrorType.TIMEOUT:
          NotificationsService.showError('Timeout della richiesta: Il server non risponde.', 'Timeout');
          break;
        case ApiErrorType.NOT_FOUND:
          // Per NOT_FOUND, controlliamo ancora una volta l'URL
          if (this.isIgnorableRewardError(error.originalError)) {
            console.log('Ignorato errore 404 per URL specific.');
            return; // Non mostrare notifica
          }
          
          // Solo se proprio necessario mostriamo l'errore 404
          NotificationsService.showError(`Risorsa non trovata: ${error.message !== 'Risorsa non trovata.' ? error.message : ''}`, 
            error.details ? `${error.details}` : '');
          break;
        default:
          NotificationsService.showError(`Errore: ${error.message}`, 
            `Status: ${error.status || 'N/A'}`);
      }
    } catch (error) {
      console.error('Errore durante la visualizzazione della notifica:', error);
    }
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
