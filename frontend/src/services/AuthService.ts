import axios, { AxiosInstance } from 'axios';
import { NotificationsService } from './NotificationsService';

// Fix per errore lint: "Cannot find name 'process'"
declare const process: {
  env: {
    REACT_APP_API_URL?: string;
  };
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const AUTH_API_URL = `${API_URL}/api/auth`;

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
  access_token: string;
  refresh_token: string;
  token_type: string;
  // Il campo user verrà gestito separatamente
  user?: {
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
    // Reset forzato dei token all'avvio (per gestire incompatibilità formato token)
    this.resetTokensIfNeeded();
    
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
        
        // IMPORTANTE: Se è una richiesta all'endpoint /refresh che ha fallito, non ritentare
        // Questo evita cicli infiniti
        if (error.response?.status === 401 && originalRequest.url.includes('/refresh')) {
          console.log('[DEBUG] Errore 401 durante il refresh token - NON RITENTO');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          NotificationsService.error(
            'La sessione è scaduta. Effettua nuovamente il login.',
            'Errore di autenticazione'
          );
          return Promise.reject(error);
        }
        
        // Ignora completamente gli errori 401 per le richieste di login
        if (error.response?.status === 401 && originalRequest.url.includes('/login')) {
          console.log('[DEBUG] Intercettato errore 401 per login - IGNORO COMPLETAMENTE');
          return Promise.reject(error);
        }
        
        // Se l'errore è 401 (Unauthorized) per altre richieste e non è già un retry
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            console.log('[DEBUG] Gestione errore 401 nell\'interceptor. URL:', originalRequest.url);
            
            // Per tutti gli altri endpoint di autenticazione, lasciamo che l'errore venga gestito dai rispettivi metodi
            const isAuthEndpoint = [
              '/register',
              '/reset-password',
              '/verify-email',
              '/forgot-password'
            ].some(endpoint => originalRequest.url.includes(endpoint));
            
            if (isAuthEndpoint) {
              console.log('[DEBUG] Endpoint di autenticazione rilevato, non gestisco il refresh token');
              // Non gestire il refresh token e non mostrare notifiche negli endpoint di autenticazione
              return Promise.reject(error);
            }
            
            // Tenta di refreshare il token per altre richieste
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) {
              // Nessun refresh token disponibile, richiede login
              console.log('[DEBUG] No refresh token disponibile');
              this.logout();
              return Promise.reject(error);
            }
            
            console.log('[DEBUG] Tentativo di refresh token prima di riprovare la richiesta');
            const newTokens = await this.refreshTokens(refreshToken);
            this.setTokens(newTokens.accessToken, newTokens.refreshToken);
            
            // Riprova la richiesta originale con il nuovo token
            originalRequest.headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            // Se il refresh fallisce, logout
            console.log('[DEBUG] Refresh token fallito');
            this.logout();
            return Promise.reject(refreshError);
          }
        } else if (error.response) {
          // Gestisci altri errori con status code
          const statusCode = error.response.status;
          const errorMessage = error.response.data?.message || error.response.data?.detail || 'Si è verificato un errore';
          
          // Non mostrare notifica per errori già gestiti nel metodo login o register
          const isAuthEndpoint = originalRequest.url === '/login' || originalRequest.url === '/register';
          if (!isAuthEndpoint) {
            switch (statusCode) {
              case 400:
                NotificationsService.error(errorMessage, 'Richiesta non valida');
                break;
              case 403:
                NotificationsService.error(errorMessage, 'Accesso negato');
                break;
              case 404:
                NotificationsService.error(errorMessage, 'Risorsa non trovata');
                break;
              case 500:
                NotificationsService.error(errorMessage, 'Errore del server');
                break;
              default:
                NotificationsService.error(errorMessage, `Errore ${statusCode}`);
            }
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
  
  // Verifica e resetta i token se necessario (per gestire cambiamenti nel formato)
  private resetTokensIfNeeded(): void {
    try {
      const accessToken = this.getAccessToken();
      // Se c'è un token, verifichiamo il formato del campo exp
      if (accessToken) {
        const tokenParts = accessToken.split('.');
        if (tokenParts.length === 3) {
          const decodedPayload = atob(tokenParts[1]);
          const payload = JSON.parse(decodedPayload);
          
          // Verifica se exp è un float (formato vecchio) o un intero (formato nuovo)
          if (payload.exp && typeof payload.exp === 'number') {
            const isFloat = payload.exp % 1 !== 0;
            
            if (isFloat) {
              console.log('[DEBUG TOKEN] Rilevato token con formato exp obsoleto (float). Reset forzato.');
              // Pulizia token obsoleti
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
              
              // Mostra notifica all'utente
              NotificationsService.warning(
                'Per miglioramenti di sicurezza, è necessario effettuare nuovamente il login.',
                'Sessione reimpostata',
                { autoClose: true, duration: 5000 }
              );
            }
          }
        }
      }
    } catch (error) {
      console.error('[DEBUG TOKEN] Errore durante la verifica del formato token:', error);
      // In caso di errore, meglio resettare i token per sicurezza
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  // Metodo per estrarre i dati dell'utente dal token JWT
  private getUserFromToken(token: string): any {
    try {
      if (!token) return null;
      
      // Dividiamo il token nelle sue parti
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) return null;
      
      // Decodifichiamo la parte payload (la seconda parte)
      const payload = JSON.parse(atob(tokenParts[1]));
      console.log('[DEBUG TOKEN] Payload completo:', payload);
      
      // Creiamo l'oggetto user dai dati del payload
      const user = {
        id: payload.sub, // Il campo 'sub' contiene l'ID dell'utente
        // Estraiamo email e nome dal token se disponibili, altrimenti usiamo valori di default
        email: payload.email || 'utente@edapp.com',
        firstName: payload.first_name || 'Utente',
        lastName: payload.last_name || 'App',
        role: payload.roles?.[0] || 'user' // Prendiamo il primo ruolo se presente
      };
      
      return user;
    } catch (error) {
      console.error('[DEBUG TOKEN] Errore nell\'estrazione dei dati utente dal token:', error);
      return null;
    }
  }

  // DEPRECATO: Invece di usare questo metodo, salviamo i token direttamente dove serve
  // per evitare problemi di timing e sequenza delle operazioni
  private setTokens(accessToken: string, refreshToken: string): void {
    console.log('[DEBUG LOGIN] DEPRECATO - Salvataggio tokens:', { 
      accessTokenLength: accessToken?.length || 0,
      refreshTokenLength: refreshToken?.length || 0 
    });
    
    if (!accessToken) {
      console.error('[DEBUG LOGIN] ERRORE CRITICO: accessToken vuoto o null');
      return;
    }
    
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    // Imposta l'intestazione Authorization per le richieste future con il nuovo token
    this.api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    console.log('[DEBUG LOGIN] Header Authorization impostato nel client axios');
    
    // Avvia timer per refresh automatico
    this.startRefreshTokenTimer(accessToken);
  }

  private startRefreshTokenTimer(token: string): void {
    try {
      console.log('[DEBUG TOKEN] Avvio refresh timer. Token fornito:', token ? 'presente' : 'mancante');
      
      if (!token || token.split('.').length !== 3) {
        console.error('[DEBUG TOKEN] ERRORE: Token JWT malformato o mancante. Non posso avviare il timer di refresh.');
        return;
      }
      
      // Decodifica token per calcolare scadenza
      const tokenParts = token.split('.');
      console.log('[DEBUG TOKEN] Parti del token:', tokenParts.length);
      
      try {
        const encodedPayload = tokenParts[1];
        console.log('[DEBUG TOKEN] Payload codificato:', encodedPayload.substring(0, 10) + '...');
        
        const decodedPayload = atob(encodedPayload);
        console.log('[DEBUG TOKEN] Payload decodificato (primi 20 caratteri):', decodedPayload.substring(0, 20) + '...');
        
        const payload = JSON.parse(decodedPayload);
        console.log('[DEBUG TOKEN] Payload parsato:', { exp: payload.exp, iat: payload.iat });
        
        const expires = new Date(payload.exp * 1000);
        console.log('[DEBUG TOKEN] Data di scadenza:', expires.toISOString());
        
        // Calcola il tempo rimanente meno 1 minuto
        const timeout = expires.getTime() - Date.now() - (60 * 1000);
        console.log('[DEBUG TOKEN] Timeout calcolato (ms):', timeout);
    
        // Pulisci timeout esistente se presente
        if (this.refreshTokenTimeout) {
          clearTimeout(this.refreshTokenTimeout);
          console.log('[DEBUG TOKEN] Cancellato timeout esistente');
        }
        
        // Imposta nuovo timeout per refreshare prima della scadenza
        this.refreshTokenTimeout = setTimeout(() => this.refreshIfNeeded(), timeout > 0 ? timeout : 0);
        console.log('[DEBUG TOKEN] Nuovo timeout impostato per:', new Date(Date.now() + (timeout > 0 ? timeout : 0)).toISOString());
      } catch (error) {
        console.error('[DEBUG TOKEN] Errore nella decodifica o parsing del payload:', error);
      }
    } catch (error) {
      console.error('[DEBUG TOKEN] Errore generale nel refresh timer:', error);
    }
  }

  private async refreshIfNeeded(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    console.log('[DEBUG REFRESH_TIMER] Esecuzione refreshIfNeeded, refresh token presente:', !!refreshToken);
    
    if (refreshToken) {
      try {
        console.log('[DEBUG REFRESH_TIMER] Tentativo di refresh token automatico');
        const tokens = await this.refreshTokens(refreshToken);
        console.log('[DEBUG REFRESH_TIMER] Refresh completato, nuovi token ricevuti');
        
        // Salviamo i token direttamente qui per garantire che vengano aggiornati immediatamente
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        // Imposta l'intestazione Authorization per le richieste future con il nuovo token
        this.api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
        // Avvia timer per refresh automatico
        this.startRefreshTokenTimer(tokens.accessToken);
        
        console.log('[DEBUG REFRESH_TIMER] Token aggiornati e timer impostato');
      } catch (error) {
        console.error('[DEBUG REFRESH_TIMER] Auto-refresh fallito:', error);
        this.logout();
      }
    }
  }

  // Metodi pubblici per operazioni di autenticazione
  public async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      console.log('[DEBUG LOGIN] Inizio processo di login');
      
      // Crea un FormData per conformarsi a OAuth2PasswordRequestForm
      const formData = new URLSearchParams();
      formData.append('username', credentials.email); // OAuth2PasswordRequestForm si aspetta 'username' anche se usiamo email
      formData.append('password', credentials.password);
      
      console.log('[DEBUG LOGIN] Invio richiesta login');
      // Invia richiesta con Content-Type corretta per form data
      const response = await this.api.post<AuthResponse>('/login', formData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      console.log('[DEBUG LOGIN] Login riuscito');
      console.log('[DEBUG LOGIN] STRUTTURA RISPOSTA COMPLETA:', JSON.stringify(response.data));
      
      // Validazione della risposta
      if (!response.data.access_token) console.log('[DEBUG LOGIN] ERRORE: access_token mancante nella risposta');
      if (!response.data.refresh_token) console.log('[DEBUG LOGIN] ERRORE: refresh_token mancante nella risposta');
      if (!response.data.token_type) console.log('[DEBUG LOGIN] ERRORE: token_type mancante nella risposta');
      
      // Adattiamo i nomi dei campi per essere compatibili con il resto del codice
      const accessToken = response.data.access_token;
      const refreshToken = response.data.refresh_token;
      
      // IMPORTANTE: Salviamo immediatamente i token prima di usarli
      console.log('[DEBUG LOGIN] Salvataggio immediato dei token in localStorage');
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Imposta l'intestazione Authorization per le richieste future
      this.api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      console.log('[DEBUG LOGIN] Header Authorization impostato nel client axios');
            
      // Otteniamo i dati dell'utente dal token JWT
      const userFromToken = this.getUserFromToken(accessToken);
      console.log('[DEBUG LOGIN] Dati utente estratti dal token:', userFromToken);
      
      // Usiamo questi dati come nostro oggetto user
      const user = userFromToken;
      console.log('[DEBUG LOGIN] Token e user estratti:', { accessToken: !!accessToken, refreshToken: !!refreshToken, userObj: !!user });
      
      // Salviamo i dati utente nel localStorage
      if (user) {
        console.log('[DEBUG LOGIN] Salvataggio dati utente nel localStorage');
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        console.error('[DEBUG LOGIN] ERRORE: Impossibile estrarre dati utente dal token');
      }
      
      // Avvia timer refresh automatico solo dopo aver salvato i token
      this.startRefreshTokenTimer(accessToken);
      console.log('[DEBUG LOGIN] Timer refresh avviato');
      
      // Mostra notifica di benvenuto con il nome utente
      NotificationsService.success(
        `Benvenuto ${user.firstName}! Accesso effettuato con successo.`,
        'Login completato',
        { autoClose: true, duration: 3000 }
      );
      
      return response.data;
    } catch (err: any) {
      // Gestione specifica degli errori di login
      console.log('[DEBUG LOGIN] ====== ERRORE DURANTE IL LOGIN ======');
      console.error('[DEBUG LOGIN] Dettagli errore:', err);
      
      const statusCode = err.response?.status;
      let errorMessage = 'Si è verificato un errore durante il login';
      let errorTitle = 'Errore di autenticazione';
      
      if (err.response) {
        console.log('[DEBUG LOGIN] Status code:', statusCode);
        console.log('[DEBUG LOGIN] Response data:', err.response.data);
        
        // Errori specifici in base allo status code
        switch (statusCode) {
          case 401:
            errorMessage = 'Le credenziali inserite non sono valide';
            break;
          case 404:
            errorMessage = 'Servizio di autenticazione non disponibile';
            break;
          case 422:
            errorMessage = 'Formato dati non valido';
            break;
          case 500:
            errorMessage = 'Errore interno del server di autenticazione';
            break;
          default:
            errorMessage = err.response.data?.message || err.response.data?.detail || errorMessage;
        }
      } else if (err.request) {
        console.log('[DEBUG LOGIN] Errore di rete, nessuna risposta ricevuta');
        // Richiesta inviata ma nessuna risposta ricevuta (errore di rete)
        errorMessage = 'Impossibile contattare il server. Verifica la tua connessione.';
        errorTitle = 'Errore di connessione';
      }
      
      console.log('[DEBUG LOGIN] Messaggio errore finale:', errorMessage);
      console.log('[DEBUG LOGIN] Titolo errore finale:', errorTitle);
      
      // Mostra la notifica di errore - UNICA NOTIFICA che dovrebbe apparire
      NotificationsService.error(errorMessage, errorTitle, { 
        autoClose: false
        // Rimuoviamo l'id che non è una proprietà valida di NotificationOptions
      });
      
      throw err;
    }
  }

  public async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      console.log('[DEBUG REGISTER] Tentativo di registrazione utente');
      const response = await this.api.post<AuthResponse>('/register', userData);
      console.log('[DEBUG REGISTER] Registrazione completata con successo');
      
      // Adattiamo i nomi dei campi per essere compatibili con il resto del codice
      const accessToken = response.data.access_token;
      const refreshToken = response.data.refresh_token;
      
      // IMPORTANTE: Salviamo immediatamente i token prima di usarli
      console.log('[DEBUG REGISTER] Salvataggio immediato dei token in localStorage');
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Imposta l'intestazione Authorization per le richieste future
      this.api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      console.log('[DEBUG REGISTER] Header Authorization impostato nel client axios');
      
      // Otteniamo i dati dell'utente dal token JWT
      const userFromToken = this.getUserFromToken(accessToken);
      const user = userFromToken;
      console.log('[DEBUG REGISTER] Dati utente estratti dal token:', user);
      
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        console.log('[DEBUG REGISTER] Dati utente salvati in localStorage');
        
        // Mostra notifica di registrazione completata
        NotificationsService.success(
          `Benvenuto ${user.firstName}! La tua registrazione è stata completata con successo.`,
          'Registrazione completata',
          { autoClose: true, duration: 5000 }
        );
      } else {
        // Se non possiamo estrarre i dati dell'utente, mostriamo un messaggio generico
        console.error('[DEBUG REGISTER] Impossibile estrarre dati utente dal token');
        NotificationsService.success(
          'La tua registrazione è stata completata con successo.',
          'Registrazione completata',
          { autoClose: true, duration: 5000 }
        );
      }
      
      // Avvia timer refresh automatico solo dopo aver salvato i token
      this.startRefreshTokenTimer(accessToken);
      console.log('[DEBUG REGISTER] Timer refresh avviato');
      
      return response.data;
    } catch (error) {
      console.error('[DEBUG REGISTER] Errore durante la registrazione:', error);
      throw error;
    }
  }

  public async refreshTokens(refreshToken: string): Promise<TokenResponse> {
    console.log('[DEBUG REFRESH] Tentativo di refresh token');
    try {
      // Verifica più approfondita del token
      if (!refreshToken) {
        console.error('[DEBUG REFRESH] ERRORE: Tentativo di refresh con token vuoto o null');
        throw new Error('Refresh token non valido');
      }

      // Verifica che il token sia in un formato valido
      const tokenParts = refreshToken.split('.');
      if (tokenParts.length !== 3) {
        console.error('[DEBUG REFRESH] ERRORE: Il refresh token non ha un formato JWT valido');
        throw new Error('Formato del refresh token non valido');
      }

      console.log('[DEBUG REFRESH] Richiesta refresh con token', refreshToken.substring(0, 10) + '...');
      console.log('[DEBUG REFRESH] Corpo della richiesta:', JSON.stringify({ refresh_token: refreshToken }));
      
      // IMPORTANTE: Verifichiamo che stiamo usando il nome del campo corretto che si aspetta il backend
      const response = await this.api.post<AuthResponse>('/refresh', { refresh_token: refreshToken });
      
      console.log('[DEBUG REFRESH] Refresh riuscito:', !!response.data);
      console.log('[DEBUG REFRESH] STRUTTURA RISPOSTA COMPLETA:', JSON.stringify(response.data));
      
      // Validazione della risposta
      if (!response.data.access_token) {
        console.error('[DEBUG REFRESH] ERRORE: access_token mancante nella risposta');
        throw new Error('Token di accesso mancante nella risposta');
      }
      if (!response.data.refresh_token) {
        console.error('[DEBUG REFRESH] ERRORE: refresh_token mancante nella risposta');
        throw new Error('Token di refresh mancante nella risposta');
      }
      
      // Adattiamo i nomi dei campi per essere compatibili con il resto del codice
      const accessToken = response.data.access_token;
      const newRefreshToken = response.data.refresh_token;
      
      // Log del payload per debugging
      const payload = this.getUserFromToken(accessToken);
      console.log('[DEBUG REFRESH] Contenuto nuovo token:', payload);
      
      return {
        accessToken,
        refreshToken: newRefreshToken
      };
    } catch (error: any) {
      console.error('[DEBUG REFRESH] ====== ERRORE DURANTE IL REFRESH ======');
      console.error('[DEBUG REFRESH] Errore API durante refresh:', error.message);
      console.error('[DEBUG REFRESH] Codice stato:', error.response?.status);
      console.error('[DEBUG REFRESH] Dettagli risposta:', JSON.stringify(error.response?.data));
      
      // In caso di errore 401, controlliamo lo stato del token
      if (error.response?.status === 401) {
        console.error('[DEBUG REFRESH] Errore 401 durante il refresh - Token non valido o scaduto');
        // Puliamo i token locali
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // Mostra la notifica di errore
        NotificationsService.error(
          'La sessione è scaduta. Effettua nuovamente il login.',
          'Errore di autenticazione'
        );
      }
      
      if (error.response) {
        console.error('[DEBUG REFRESH] Status:', error.response.status);
        console.error('[DEBUG REFRESH] Dati:', error.response.data);
      }
      console.error('[DEBUG REFRESH] Dettagli errore:', error);
      
      throw error;
    }
  }

  public async getProfile(): Promise<ProfileResponse> {
    const response = await this.api.get<ProfileResponse>('/profile');
    return response.data;
  }

  public async logout(logoutAllDevices: boolean = false): Promise<void> {
    try {
      console.log('[DEBUG LOGOUT] Avvio processo di logout');
      // Pulisci timeout refresh token se presente
      if (this.refreshTokenTimeout) {
        clearTimeout(this.refreshTokenTimeout);
        console.log('[DEBUG LOGOUT] Timeout refresh cancellato');
      }
      
      const refreshToken = this.getRefreshToken();
      console.log('[DEBUG LOGOUT] Refresh token disponibile:', !!refreshToken);
      
      // Se l'utente è autenticato, tenta logout sul server (revoca token)
      if (refreshToken) {
        if (logoutAllDevices) {
          // Logout da tutti i dispositivi
          console.log('[DEBUG LOGOUT] Tentativo logout da tutti i dispositivi');
          // Usiamo il nome corretto del campo come atteso dal backend
          await this.api.post('/logout-all', { refresh_token: refreshToken });
          NotificationsService.info(
            'Sei stato disconnesso da tutti i dispositivi.',
            'Logout completato',
            { autoClose: true, duration: 4000 }
          );
        } else {
          // Logout solo dal dispositivo corrente
          console.log('[DEBUG LOGOUT] Tentativo logout dal dispositivo corrente');
          // Usiamo il nome corretto del campo come atteso dal backend
          await this.api.post('/logout', { refresh_token: refreshToken });
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
