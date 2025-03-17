import axios, { AxiosInstance } from 'axios';
import ApiErrorHandler from './ApiErrorHandler';
import { NotificationsService } from './NotificationsService';
import ApiService from './ApiService';
import pathService, { Path } from './PathService';

// Fix per errore lint: "Cannot find name 'process'"
declare const process: {
  env: {
    REACT_APP_API_URL?: string;
    NODE_ENV?: string;
  };
};

// Determina l'URL dell'API in base all'ambiente
const getApiUrl = () => {
  // Usa l'URL configurato in .env se disponibile
  const configuredUrl = process.env.REACT_APP_API_URL;
  if (configuredUrl) return configuredUrl;
  
  // Altrimenti, usa l'host corrente con la porta 8000
  const currentHost = window.location.hostname;
  return `http://${currentHost}:8000`;
};

const API_URL = getApiUrl();
const AUTH_API_URL = `${API_URL}/api/auth`;

/**
 * Interfaccia per i dati dello studente
 */
export interface Student {
  id: string;
  userId: string;
  name: string;
  username: string;
  avatar?: string;
  points: number;
  level: number;
  parentId: string;
  createdAt: Date;
  updatedAt: Date;
  pendingRewards: number; // Numero di richieste di ricompensa in attesa
}

/**
 * Interfaccia per le statistiche dello studente
 */
export interface StudentStatistics {
  studentId: string;
  totalPoints: number;
  completedPaths: number;
  completedQuizzes: number;
  averageScore: number;
  totalRewards: number;
  pendingRewards: number;
  lastActivity?: Date;
}

/**
 * Interfaccia per le attività recenti dello studente
 */
export interface StudentActivity {
  id: string;
  studentId: string;
  studentName: string;
  type: 'path_completed' | 'quiz_completed' | 'reward_requested' | 'reward_approved';
  title: string;
  date: Date;
  details?: Record<string, any>;
}

/**
 * Interfaccia per un percorso assegnato allo studente
 */
export interface StudentPath {
  id: string;
  pathId: string;
  title: string;
  description?: string;
  status: 'new' | 'in_progress' | 'completed';
  progress: number; // Percentuale di completamento (0-100)
  totalNodes: number;
  completedNodes: number;
  assignedAt: Date;
  lastActivity?: Date;
}

/**
 * Interfaccia per un quiz assegnato allo studente
 */
export interface StudentQuiz {
  id: string;
  quizId: string;
  title: string;
  description?: string;
  status: 'new' | 'in_progress' | 'completed';
  score?: number;
  maxScore?: number;
  assignedAt: Date;
  completedAt?: Date;
  pathId?: string; // Se il quiz è parte di un percorso
}

/**
 * Servizio per gestire le operazioni relative agli studenti
 */
class StudentService {
  private api: AxiosInstance;

  // Mappa per memorizzare i callback di invalidazione della cache
  private static cacheInvalidationCallbacks: Map<string, Set<() => void>> = new Map();

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
  }

  /**
   * Ottiene tutti gli studenti associati al genitore attualmente autenticato
   */
  public async getStudentsByParent(): Promise<Student[]> {
    try {
      return await ApiService.get<Student[]>(`${AUTH_API_URL}/parent/students`);
    } catch (error) {
      ApiErrorHandler.handleApiError(error, 'Errore nel recupero degli studenti');
      throw error;
    }
  }

  /**
   * Ottiene i dettagli di uno studente specifico per ID
   */
  public async getStudentById(studentId: string): Promise<Student> {
    try {
      const response = await this.api.get<Student>(`/students/${studentId}`);
      NotificationsService.success('Dati studente caricati con successo');
      return response.data;
    } catch (error) {
      ApiErrorHandler.handleApiError(error, 'Errore nel recupero dei dati dello studente');
      throw error;
    }
  }

  /**
   * Ottiene le statistiche di uno studente
   */
  public async getStudentStatistics(studentId: string): Promise<StudentStatistics> {
    try {
      const response = await this.api.get<StudentStatistics>(`/students/${studentId}/statistics`);
      return response.data;
    } catch (error) {
      ApiErrorHandler.handleApiError(error, 'Errore nel recupero delle statistiche dello studente');
      throw error;
    }
  }

  /**
   * Ottiene le attività recenti di uno studente
   */
  public async getStudentActivities(studentId: string): Promise<StudentActivity[]> {
    try {
      const response = await this.api.get<StudentActivity[]>(`/students/${studentId}/activities`);
      return response.data;
    } catch (error) {
      ApiErrorHandler.handleApiError(error, 'Errore nel recupero delle attività dello studente');
      throw error;
    }
  }

  /**
   * Ottiene le attività recenti di tutti gli studenti associati al genitore
   */
  public async getAllStudentActivities(): Promise<StudentActivity[]> {
    try {
      return await ApiService.get<StudentActivity[]>(`${AUTH_API_URL}/parent/activities`);
    } catch (error) {
      ApiErrorHandler.handleApiError(error, 'Errore nel recupero delle attività degli studenti');
      throw error;
    }
  }

  /**
   * Crea un nuovo account studente associato al genitore attualmente autenticato
   */
  public async createStudent(student: {
    name: string;
    username: string;
    password: string;
    avatar?: string;
  }): Promise<Student> {
    try {
      const response = await ApiService.post<Student>(`${AUTH_API_URL}/parent/students`, student);
      NotificationsService.success('Studente creato con successo');
      return response;
    } catch (error) {
      ApiErrorHandler.handleApiError(error, 'Errore nella creazione dello studente');
      throw error;
    }
  }

  /**
   * Aggiorna i dati di uno studente
   */
  public async updateStudent(
    studentId: string,
    data: {
      name?: string;
      username?: string;
      password?: string;
      avatar?: string;
    }
  ): Promise<Student> {
    try {
      const response = await this.api.put<Student>(`/students/${studentId}`, data);
      NotificationsService.success('Dati studente aggiornati con successo');
      return response.data;
    } catch (error) {
      ApiErrorHandler.handleApiError(error, 'Errore nell\'aggiornamento dei dati dello studente');
      throw error;
    }
  }

  /**
   * Ottiene tutti i percorsi assegnati a uno studente
   */
  async getStudentPaths(studentId: string): Promise<StudentPath[]> {
    try {
      if (!studentId) {
        console.error('ID studente non valido');
        return [];
      }
      
      console.log(`%c[DEBUG StudentService] Recupero percorsi per studente con ID: ${studentId}`, 'background: #673AB7; color: white; padding: 2px 4px; border-radius: 2px;');
      
      // Usiamo l'endpoint /api/paths direttamente con il parametro student_id
      // Aggiungiamo un timestamp per evitare la cache
      const timestamp = Date.now();
      
      // Chiamata diretta all'API per ottenere i percorsi dello studente
      const response = await ApiService.get<any[]>(`${API_URL}/api/paths?student_id=${studentId}&_t=${timestamp}`);
      
      console.log(`%c[DEBUG StudentService] Risposta API percorsi:`, 'background: #673AB7; color: white; padding: 2px 4px; border-radius: 2px;', response);
      
      if (!response || !Array.isArray(response)) {
        console.log(`%c[DEBUG StudentService] Nessun percorso trovato o risposta non valida`, 'background: #F44336; color: white; padding: 2px 4px; border-radius: 2px;');
        return [];
      }
      
      // Mappiamo i percorsi nel formato richiesto dall'interfaccia genitore
      return response.map((path: any) => {
        // Normalizzazione campi in camelCase
        const pathId = path.id?.toString() || '';
        const templateId = path.template_id?.toString() || '';
        const title = path.template_title || path.title || 'Percorso senza titolo';
        const description = path.description || '';
        const nodeCount = path.node_count || 0;
        const completedNodes = path.completed_nodes || 0;
        const status = this.convertPathStatusToStudentStatus(path.status || 'not_started');
        
        // Calcolo progresso
        let progress = 0;
        if (nodeCount > 0) {
          progress = Math.round((completedNodes / nodeCount) * 100);
        } else if (path.completion_percentage !== undefined) {
          progress = path.completion_percentage;
        }
        
        return {
          id: pathId,
          pathId: templateId,
          title: title,
          description: description,
          status: status,
          progress: progress,
          totalNodes: nodeCount,
          completedNodes: completedNodes,
          assignedAt: path.started_at ? new Date(path.started_at) : new Date(),
          lastActivity: path.updated_at ? new Date(path.updated_at) : undefined
        };
      });
    } catch (error) {
      console.error('Errore nel recupero dei percorsi dello studente:', error);
      ApiErrorHandler.handleApiError(error, 'Errore nel recupero dei percorsi dello studente');
      return [];
    }
  }
  
  /**
   * Converte lo stato del percorso dal formato PathService al formato StudentService
   */
  private convertPathStatusToStudentStatus(pathStatus: string): 'new' | 'in_progress' | 'completed' {
    const status = pathStatus.toLowerCase();
    if (status.includes('complet')) {
      return 'completed';
    } else if (status.includes('corso') || status.includes('progress')) {
      return 'in_progress';
    } else {
      return 'new';
    }
  }

  /**
   * Ottiene tutti i quiz assegnati a uno studente
   */
  async getStudentQuizzes(studentId: string): Promise<StudentQuiz[]> {
    try {
      console.log(`%c[DEBUG StudentService] Recupero quiz per studente con ID: ${studentId}`, 'background: #009688; color: white; padding: 2px 4px; border-radius: 2px;');
      
      // Aggiungiamo un timestamp per evitare la cache
      const timestamp = Date.now();
      
      // Otteniamo tutti i percorsi con i loro nodi in una singola chiamata
      const pathsResponse = await ApiService.get<any[]>(`${API_URL}/api/paths?student_id=${studentId}&include_nodes=true&_t=${timestamp}`);
      
      console.log(`%c[DEBUG StudentService] Risposta paths con nodi:`, 'background: #009688; color: white; padding: 2px 4px; border-radius: 2px;', pathsResponse);
      
      const quizzes: StudentQuiz[] = [];
      
      if (!Array.isArray(pathsResponse)) {
        console.log(`%c[DEBUG StudentService] Risposta non valida da /api/paths`, 'background: #F44336; color: white; padding: 2px 4px; border-radius: 2px;');
        return [];
      }
      
      // Estraiamo tutti i quiz dai percorsi
      let quizFound = false;
      for (const path of pathsResponse) {
        if (path.nodes && Array.isArray(path.nodes)) {
          for (const node of path.nodes) {
            // Verifichiamo se questo nodo è un quiz
            if (node.node_type === 'quiz' || node.content?.quiz_id) {
              quizFound = true;
              quizzes.push({
                id: node.id.toString(),
                quizId: node.content?.quiz_id || node.id.toString(),
                title: node.title || node.content?.title || 'Quiz senza titolo',
                description: node.description || node.content?.description,
                status: this.mapCompletionStatus(node.status || 'NOT_STARTED'),
                score: node.score !== undefined ? node.score : undefined,
                maxScore: node.max_score !== undefined ? node.max_score : undefined,
                assignedAt: new Date(path.created_at || Date.now()),
                completedAt: node.completed_at ? new Date(node.completed_at) : undefined,
                pathId: path.id.toString()
              });
            }
          }
        }
      }
      
      console.log(`%c[DEBUG StudentService] Quiz trovati nei percorsi: ${quizFound ? quizzes.length : 'nessuno'}`, 'background: #009688; color: white; padding: 2px 4px; border-radius: 2px;');
      
      // Se abbiamo bisogno di quiz non associati a percorsi, utilizzare una nuova API appropriata
      // invece di /api/quizzes che potrebbe non essere sincronizzata
      
      return quizzes;
    } catch (error) {
      console.error('Errore nel recupero dei quiz dello studente:', error);
      ApiErrorHandler.handleApiError(error, 'Errore nel recupero dei quiz dello studente');
      return [];
    }
  }

  /**
   * Mappa lo stato di completamento dal formato API al formato frontend
   */
  private mapCompletionStatus(status: string): 'new' | 'in_progress' | 'completed' {
    switch (status) {
      case 'COMPLETED':
        return 'completed';
      case 'IN_PROGRESS':
        return 'in_progress';
      case 'NOT_STARTED':
      default:
        return 'new';
    }
  }

  /**
   * Calcola la percentuale di progresso di un percorso
   */
  private calculatePathProgress(path: any): number {
    if (!path.nodes || path.nodes.length === 0) {
      return 0;
    }
    
    const totalNodes = path.nodes.length;
    const completedNodes = path.nodes.filter((node: any) => node.status === 'COMPLETED').length;
    
    return Math.round((completedNodes / totalNodes) * 100);
  }

  /**
   * Rimuove un percorso assegnato a uno studente
   */
  async removeStudentPath(studentId: string, pathId: string): Promise<boolean> {
    try {
      await ApiService.delete(`${API_URL}/api/paths/${pathId}`);
      NotificationsService.success('Percorso rimosso con successo');
      StudentService.invalidateStudentCache(studentId);
      return true;
    } catch (error) {
      ApiErrorHandler.handleApiError(error, 'Errore nella rimozione del percorso');
      return false;
    }
  }

  /**
   * Rimuove un quiz assegnato a uno studente (solo quiz non parte di un percorso)
   */
  async removeStudentQuiz(studentId: string, quizId: string): Promise<boolean> {
    try {
      await ApiService.delete(`${API_URL}/api/quizzes/${quizId}`);
      NotificationsService.success('Quiz rimosso con successo');
      StudentService.invalidateStudentCache(studentId);
      return true;
    } catch (error) {
      ApiErrorHandler.handleApiError(error, 'Errore nella rimozione del quiz');
      return false;
    }
  }

  /**
   * Registra una funzione di callback da chiamare quando la cache di uno studente viene invalidata
   * @param studentId ID dello studente
   * @param callback Funzione da chiamare quando la cache viene invalidata
   * @returns Una funzione per annullare la registrazione
   */
  static registerCacheInvalidationCallback(studentId: string, callback: () => void): () => void {
    if (!this.cacheInvalidationCallbacks.has(studentId)) {
      this.cacheInvalidationCallbacks.set(studentId, new Set());
    }
    this.cacheInvalidationCallbacks.get(studentId)!.add(callback);
    
    // Restituisce una funzione per annullare la registrazione
    return () => {
      const callbacks = this.cacheInvalidationCallbacks.get(studentId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.cacheInvalidationCallbacks.delete(studentId);
        }
      }
    };
  }

  /**
   * Invalida la cache per uno studente specifico e notifica tutti i componenti registrati
   * @param studentId ID dello studente per cui invalidare la cache
   */
  static invalidateStudentCache(studentId: string): void {
    // Invalida la cache
    const timestamp = Date.now().toString();
    localStorage.setItem(`student_cache_invalidated_${studentId}`, timestamp);
    
    // Notifica tutti i callback registrati
    const callbacks = this.cacheInvalidationCallbacks.get(studentId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback();
        } catch (e) {
          console.error('Errore durante l\'esecuzione del callback di invalidazione cache:', e);
        }
      });
    }
    
    console.log(`Cache dello studente ${studentId} invalidata, notificati ${callbacks?.size || 0} componenti`);
  }
}

// Esporta una singola istanza del servizio
export default new StudentService();
