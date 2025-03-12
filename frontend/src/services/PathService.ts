import axios, { AxiosInstance } from 'axios';
import { NotificationsService } from './NotificationsService';
import ApiService from './ApiService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const PATH_API_URL = `${API_URL}/path`;

/**
 * Servizio per gestire le operazioni relative ai percorsi educativi
 * Integra con path-service attraverso l'API Gateway
 */

export interface PathTemplate {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  subject: string;
  difficulty: 'facile' | 'medio' | 'difficile';
  estimatedDays: number;
  quizIds: string[];
  prerequisites?: string[]; // IDs di altri percorsi prerequisiti
  skills: string[];
}

export interface Path {
  id: string;
  templateId: string;
  studentId: string;
  title: string;
  description: string;
  subject: string;
  difficulty: string;
  startDate: Date;
  targetEndDate: Date;
  actualEndDate?: Date;
  status: 'assegnato' | 'in_corso' | 'completato';
  progress: number; // 0-100%
  quizzes: Array<{
    quizId: string;
    title: string;
    status: 'da_iniziare' | 'in_corso' | 'completato';
    score?: number;
    maxScore: number;
    completedAt?: Date;
  }>;
}

export interface PathStatistics {
  pathId: string;
  studentId: string;
  completedQuizzes: number;
  totalQuizzes: number;
  averageScore: number;
  totalPoints: number;
  timeSpent: number; // Tempo in minuti
  startDate: Date;
  lastActivity: Date;
  completedAt?: Date;
}

class PathService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: PATH_API_URL,
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

  // OPERAZIONI SUI TEMPLATE DI PERCORSI

  /**
   * Ottiene tutti i template di percorsi
   * Admin e parent possono vedere tutti i template
   */
  public async getAllPathTemplates(): Promise<PathTemplate[]> {
    try {
      // Verifica se l'utente è autenticato
      const currentUser = localStorage.getItem('user');
      if (!currentUser) {
        NotificationsService.error(
          'È necessario effettuare l\'accesso per visualizzare i percorsi',
          'Accesso negato'
        );
        return [];
      }
      
      return await ApiService.get<PathTemplate[]>(`${API_URL}/api/paths/templates`);
    } catch (error: any) {
      // L'errore 403 indica che l'utente non ha le autorizzazioni necessarie (es. solo admin)
      if (error.response?.status === 403) {
        NotificationsService.error(
          'Non hai le autorizzazioni necessarie per accedere a questa risorsa',
          'Accesso negato'
        );
        return [];
      }
      
      NotificationsService.error(
        'Errore nel recupero dei template di percorsi',
        'Errore'
      );
      throw error;
    }
  }

  /**
   * Ottiene un template di percorso specifico per ID
   */
  public async getPathTemplate(id: string): Promise<PathTemplate> {
    return await ApiService.get<PathTemplate>(`${API_URL}/api/paths/templates/${id}`);
  }

  /**
   * Crea un nuovo template di percorso
   * Admin e parent possono creare template
   */
  public async createPathTemplate(template: Omit<PathTemplate, 'id'>): Promise<PathTemplate> {
    try {
      const result = await ApiService.post<PathTemplate>(`${API_URL}/api/paths/templates`, template);
      NotificationsService.success(
        `Il percorso "${template.title}" è stato creato con successo.`,
        'Percorso creato'
      );
      return result;
    } catch (error) {
      // ApiService già gestisce la visualizzazione degli errori tramite ApiErrorHandler
      throw error;
    }
  }

  /**
   * Aggiorna un template di percorso esistente
   * Solo il creatore del template può modificarlo
   */
  public async updatePathTemplate(id: string, template: Partial<PathTemplate>): Promise<PathTemplate> {
    try {
      const result = await ApiService.put<PathTemplate>(`${API_URL}/api/paths/templates/${id}`, template);
      NotificationsService.success(
        `Il percorso "${template.title || 'selezionato'}" è stato aggiornato.`,
        'Percorso aggiornato'
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un template di percorso
   * Solo il creatore del template può eliminarlo
   */
  public async deletePathTemplate(id: string): Promise<void> {
    try {
      await ApiService.delete(`${API_URL}/api/paths/templates/${id}`);
      NotificationsService.success(
        'Il percorso è stato eliminato con successo.',
        'Percorso eliminato'
      );
    } catch (error) {
      throw error;
    }
  }

  // OPERAZIONI SUI PERCORSI ASSEGNATI

  /**
   * Ottiene tutti i percorsi assegnati allo studente corrente
   */
  public async getAssignedPaths(): Promise<Path[]> {
    const response = await this.api.get<Path[]>('/assigned');
    return response.data;
  }

  /**
   * Ottiene un percorso specifico per ID
   */
  public async getPath(id: string): Promise<Path> {
    const response = await this.api.get<Path>(`/${id}`);
    return response.data;
  }

  /**
   * Assegna un percorso a uno studente
   * Solo parent può assegnare percorsi
   */
  public async assignPath(templateId: string, studentId: string, startDate: Date, targetEndDate: Date): Promise<Path> {
    try {
      const response = await this.api.post<Path>('/assign', {
        templateId,
        studentId,
        startDate: startDate.toISOString(),
        targetEndDate: targetEndDate.toISOString()
      });
      NotificationsService.success(
        'Percorso educativo assegnato con successo allo studente.',
        'Percorso assegnato'
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Aggiorna lo stato di un percorso
   */
  public async updatePathStatus(pathId: string, status: Path['status']): Promise<Path> {
    try {
      const response = await this.api.put<Path>(`/${pathId}/status`, { status });
      
      let message = '';
      let title = 'Stato percorso aggiornato';
      
      switch(status) {
        case 'in_corso':
          message = 'Il percorso è stato avviato con successo.';
          title = 'Percorso avviato';
          break;
        case 'completato':
          message = 'Congratulazioni! Il percorso è stato completato con successo.';
          title = 'Percorso completato';
          break;
        default:
          message = `Lo stato del percorso è stato aggiornato a: ${status}.`;
      }
      
      NotificationsService.success(message, title);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Aggiorna il progresso di un percorso
   * Chiamato automaticamente quando i quiz vengono completati
   */
  public async updatePathProgress(pathId: string, progress: number): Promise<Path> {
    try {
      const response = await this.api.put<Path>(`/${pathId}/progress`, { progress });
      
      // Mostra notifica solo per progressi significativi (25%, 50%, 75%, 100%)
      if (progress === 100) {
        NotificationsService.success(
          'Congratulazioni! Hai completato il 100% del percorso educativo.',
          'Percorso completato',
          { autoClose: true, duration: 6000 }
        );
      } else if (progress === 75) {
        NotificationsService.info(
          'Ottimo lavoro! Hai completato il 75% del percorso educativo.',
          'Progresso percorso',
          { autoClose: true, duration: 4000 }
        );
      } else if (progress === 50) {
        NotificationsService.info(
          'Buon lavoro! Sei a metà del percorso educativo.',
          'Progresso percorso',
          { autoClose: true, duration: 4000 }
        );
      } else if (progress === 25) {
        NotificationsService.info(
          'Hai completato il 25% del percorso educativo. Continua così!',
          'Progresso percorso',
          { autoClose: true, duration: 4000 }
        );
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Ottiene le statistiche di un percorso specifico
   */
  public async getPathStatistics(pathId: string): Promise<PathStatistics> {
    const response = await this.api.get<PathStatistics>(`/${pathId}/statistics`);
    return response.data;
  }

  /**
   * Ottiene tutti i percorsi assegnati agli studenti di un genitore
   * Solo parent può vedere i percorsi dei propri figli
   */
  public async getStudentPaths(studentId: string): Promise<Path[]> {
    const response = await this.api.get<Path[]>(`/student/${studentId}`);
    return response.data;
  }

  /**
   * Ottiene le statistiche di tutti i percorsi di uno studente
   */
  public async getStudentPathStatistics(studentId: string): Promise<PathStatistics[]> {
    const response = await this.api.get<PathStatistics[]>(`/statistics/student/${studentId}`);
    return response.data;
  }
}

// Esporta una singola istanza del servizio
export default new PathService();
