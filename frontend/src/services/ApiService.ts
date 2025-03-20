import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiErrorHandler } from './ApiErrorHandler';
import AuthService from './AuthService';

// Fix per errore lint: "Cannot find name 'process'"
declare const process: {
  env: {
    REACT_APP_API_URL?: string;
  };
};

// Determina l'URL dell'API in base all'ambiente
const getApiUrl = () => {
  // Usa l'URL configurato in .env se disponibile
  const configuredUrl = process.env.REACT_APP_API_URL;
  if (configuredUrl) return configuredUrl;
  
  // Altrimenti, usa l'host corrente con la porta 8000
  const protocol = window.location.protocol;
  const currentHost = window.location.hostname;
  
  // Per debug, mostriamo l'hostname rilevato
  console.log('DEBUG API - Hostname rilevato:', currentHost);
  
  return `${protocol}//${currentHost}:8000`;
};

const API_URL = getApiUrl();
console.log('API URL utilizzato:', API_URL);

/**
 * Servizio base per le chiamate API che gestisce automaticamente:
 * - Autenticazione con token JWT
 * - Gestione errori unificata
 * - Retry automatici
 * - Timeout e cancellazione richieste
 */
class ApiService {
  private api: AxiosInstance;

  constructor() {
    // Get the API URL from environment variables or use a default
    const baseURL = getApiUrl();
    
    console.log('[DEBUG ApiService] Creating API service with base URL:', baseURL);
    
    // Create an Axios instance with default config
    this.api = axios.create({
      baseURL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Set up interceptors for authentication
    this.setupInterceptors();
  }

  /**
   * Setup interceptors for adding auth token and handling errors
   */
  private setupInterceptors(): void {
    // Interceptor per aggiungere il token di autenticazione
    this.api.interceptors.request.use(
      (config) => {
        // Try different token keys for backward compatibility
        const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
        
        // Se il token esiste, aggiungilo agli header
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log(`[DEBUG ApiService] Adding auth token to request: ${config.method?.toUpperCase()} ${config.url}`);
        } else {
          console.warn(`[DEBUG ApiService] No auth token found for request: ${config.method?.toUpperCase()} ${config.url}`);
        }
        
        return config;
      },
      (error) => {
        console.error('[DEBUG ApiService] Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Interceptor per gestire le risposte e gli errori
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        console.log(`[DEBUG ApiService] Response error:`, {
          status: error.response?.status,
          url: originalRequest?.url,
          method: originalRequest?.method?.toUpperCase(),
          errorMessage: error.message
        });
        
        // Gestisci errori di autenticazione
        if (error.response?.status === 401 && !originalRequest?._retry) {
          console.log('[DEBUG ApiService] Received 401 error, attempting token refresh');
          
          // Try refreshing token
          try {
            // Mark request as retry to avoid infinite loop
            originalRequest._retry = true;
            
            // Attempt to refresh the token
            const token = await this.refreshToken();
            
            if (token) {
              // Update the original request with the new token
              originalRequest.headers.Authorization = `Bearer ${token}`;
              console.log('[DEBUG ApiService] Token refreshed, retrying request');
              return this.api(originalRequest);
            } else {
              // If token refresh fails, let user know they need to login again
              console.error('[DEBUG ApiService] Token refresh failed');
              window.location.href = '/login';
              return Promise.reject(error);
            }
          } catch (refreshError) {
            console.error('[DEBUG ApiService] Error refreshing token:', refreshError);
            // Redirect to login
            window.location.href = '/login';
            return Promise.reject(error);
          }
        }
        
        // Return the error for other cases
        return Promise.reject(error);
      }
    );
  }

  /**
   * Attempt to refresh the authentication token
   * @returns A new valid token or null if refresh failed
   */
  private async refreshToken(): Promise<string | null> {
    console.log('[DEBUG ApiService] Attempting to refresh token');
    try {
      // Get refresh token from localStorage
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        console.error('[DEBUG ApiService] No refresh token available');
        return null;
      }
      
      // Make request to refresh token endpoint
      const response = await axios.post(`${this.api.defaults.baseURL}/api/auth/refresh-token`, {
        refreshToken
      });
      
      if (response.data && response.data.accessToken) {
        // Store new tokens in localStorage
        localStorage.setItem('authToken', response.data.accessToken);
        
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        
        console.log('[DEBUG ApiService] Token refresh successful');
        return response.data.accessToken;
      }
      
      return null;
    } catch (error) {
      console.error('[DEBUG ApiService] Error in refreshToken:', error);
      return null;
    }
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

// Expose the ApiService class for static method access
export class ApiServiceClass {
  /**
   * Diagnostic function to check API connectivity and authentication status
   * @param pathId Optional path ID to check access to specific path
   */
  public static async checkApiAccess(pathId?: string): Promise<any> {
    console.log('[DEBUG ApiService] Running API access diagnostic');
    
    try {
      // Check auth token
      const accessToken = localStorage.getItem('accessToken');
      const authToken = localStorage.getItem('authToken');
      
      console.log('[DEBUG ApiService] Auth tokens available:', {
        accessToken: accessToken ? '✓ Present' : '✗ Missing',
        authToken: authToken ? '✓ Present' : '✗ Missing',
        tokenToUse: accessToken || authToken || 'NONE'
      });
      
      // Test API basic connectivity
      const apiInstance = new ApiService();
      
      // Test a simple endpoint first
      try {
        const testResult = await apiInstance.get('/api/health');
        console.log('[DEBUG ApiService] Basic API connectivity: ✓ SUCCESS');
        console.log('[DEBUG ApiService] Response:', testResult);
      } catch (e: any) {
        console.error('[DEBUG ApiService] Basic API connectivity: ✗ FAILED');
        console.error(e);
      }
      
      // Test paths API if pathId provided
      if (pathId) {
        try {
          const pathResult = await apiInstance.get(`/api/paths/${pathId}`);
          console.log(`[DEBUG ApiService] Path ${pathId} access: ✓ SUCCESS`);
          console.log('[DEBUG ApiService] Path data:', pathResult);
          
          // Try to get nodes
          try {
            const nodesResult = await apiInstance.get(`/api/paths/${pathId}/nodes`);
            if (!Array.isArray(nodesResult)) {
              console.error(`[DEBUG ApiService] Path ${pathId} nodes response format is invalid:`, nodesResult);
              return {
                success: false,
                message: 'Path nodes response format is invalid',
                data: nodesResult
              };
            }
            
            console.log(`[DEBUG ApiService] Path ${pathId} nodes access: ✓ SUCCESS`);
            console.log(`[DEBUG ApiService] Found ${nodesResult.length} nodes in path`);
            
            // Log all nodes with basic info for debugging
            nodesResult.forEach((node, index) => {
              console.log(`[DEBUG ApiService] Node #${index+1}:`, {
                id: node.id,
                type: node.node_type,
                title: node.title || 'No title',
                hasContent: Boolean(node.content),
                contentKeys: node.content ? Object.keys(node.content) : [],
                contentQuizId: node.content?.quiz_id,
              });
            });
            
            // Check for quiz nodes
            const quizNodes = nodesResult.filter(node => 
              node.node_type === 'quiz' || node.content?.quiz_id
            );
            
            console.log(`[DEBUG ApiService] Quiz nodes found: ${quizNodes.length}`);
            
            if (quizNodes.length > 0) {
              // Print all quiz nodes
              quizNodes.forEach((node, index) => {
                console.log(`[DEBUG ApiService] Quiz node #${index+1}:`, {
                  id: node.id,
                  title: node.title || 'No title',
                  quizId: node.content?.quiz_id || 'Missing quiz_id'
                });
              });
              
              // Try to load a quiz template for the first node with valid content.quiz_id
              const nodeWithQuizId = quizNodes.find(node => node.content?.quiz_id);
              
              if (nodeWithQuizId) {
                const quizId = nodeWithQuizId.content.quiz_id;
                console.log(`[DEBUG ApiService] Testing quiz template access with ID: ${quizId}`);
                
                try {
                  const quizResult = await apiInstance.get(`/api/quiz-templates/${quizId}`);
                  console.log(`[DEBUG ApiService] Quiz template ${quizId} access: ✓ SUCCESS`);
                  console.log('[DEBUG ApiService] Quiz template data:', quizResult);
                } catch (e: any) {
                  console.error(`[DEBUG ApiService] Quiz template ${quizId} access: ✗ FAILED`);
                  console.error(`Error type: ${e.name}, message: ${e.message}`);
                  
                  // Check if quiz ID exists in response
                  if (e.response && e.response.status === 404) {
                    console.error(`[DEBUG ApiService] Quiz template with ID ${quizId} does not exist (404)`);
                    console.log("[DEBUG ApiService] This suggests the quiz_id in the node doesn't match any real quiz template.");
                  }
                }
              } else {
                console.warn('[DEBUG ApiService] Found quiz nodes but none have a content.quiz_id property');
              }
            } else {
              console.warn('[DEBUG ApiService] No quiz nodes found in path');
            }
          } catch (e: any) {
            console.error(`[DEBUG ApiService] Path ${pathId} nodes access: ✗ FAILED`);
            console.error(`Error type: ${e.name}, message: ${e.message}`);
          }
        } catch (e: any) {
          console.error(`[DEBUG ApiService] Path ${pathId} access: ✗ FAILED`);
          console.error(`Error type: ${e.name}, message: ${e.message}`);
        }
      }
      
      return {
        success: true,
        message: 'API diagnostic complete'
      };
    } catch (e: any) {
      console.error('[DEBUG ApiService] API diagnostic failed:', e);
      return {
        success: false,
        error: e
      };
    }
  }

  /**
   * Ottiene gli header di autenticazione necessari per le richieste API
   * @returns Un oggetto con gli header di autenticazione
   */
  private static getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }

  /**
   * Metodo per effettuare richieste POST
   * @param url URL della richiesta
   * @param data Dati da inviare con la richiesta
   * @returns Promise con i dati della risposta
   */
  public static async post<T>(url: string, data: any): Promise<T> {
    try {
      console.log(`[DEBUG ApiService] POST request to ${url}`, { requestBody: data });
      
      // Includi sempre le credenziali per gestire l'autenticazione
      const response = await axios.post(url, data, {
        withCredentials: true,
        headers: this.getAuthHeaders()
      });
      
      console.log(`[DEBUG ApiService] POST response from ${url}`, { 
        status: response.status,
        statusText: response.statusText,
        responseData: response.data 
      });
      
      return response.data;
    } catch (error) {
      console.error(`[DEBUG ApiService] Error in POST request to ${url}:`, error);
      
      if (axios.isAxiosError(error)) {
        console.error('[DEBUG ApiService] Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            baseURL: error.config?.baseURL,
            headers: error.config?.headers,
            data: error.config?.data
          }
        });
        
        // Handle auth errors
        if (error.response?.status === 401) {
          console.error('[DEBUG ApiService] Authentication error detected (401)');
          // Redirect to login or show notification
          this.handleUnauthorizedError();
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Gestisce gli errori di autenticazione (401)
   */
  private static handleUnauthorizedError() {
    // Pulisci il token e reindirizza alla pagina di login
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
}
