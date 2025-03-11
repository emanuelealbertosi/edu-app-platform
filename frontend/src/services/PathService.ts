import axios, { AxiosInstance } from 'axios';

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
    const response = await this.api.get<PathTemplate[]>('/templates');
    return response.data;
  }

  /**
   * Ottiene un template di percorso specifico per ID
   */
  public async getPathTemplate(id: string): Promise<PathTemplate> {
    const response = await this.api.get<PathTemplate>(`/templates/${id}`);
    return response.data;
  }

  /**
   * Crea un nuovo template di percorso
   * Admin e parent possono creare template
   */
  public async createPathTemplate(template: Omit<PathTemplate, 'id'>): Promise<PathTemplate> {
    const response = await this.api.post<PathTemplate>('/templates', template);
    return response.data;
  }

  /**
   * Aggiorna un template di percorso esistente
   * Solo il creatore del template può modificarlo
   */
  public async updatePathTemplate(id: string, template: Partial<PathTemplate>): Promise<PathTemplate> {
    const response = await this.api.put<PathTemplate>(`/templates/${id}`, template);
    return response.data;
  }

  /**
   * Elimina un template di percorso
   * Solo il creatore del template può eliminarlo
   */
  public async deletePathTemplate(id: string): Promise<void> {
    await this.api.delete(`/templates/${id}`);
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
    const response = await this.api.post<Path>('/assign', { 
      templateId, 
      studentId, 
      startDate: startDate.toISOString(), 
      targetEndDate: targetEndDate.toISOString() 
    });
    return response.data;
  }

  /**
   * Aggiorna lo stato di un percorso
   */
  public async updatePathStatus(pathId: string, status: Path['status']): Promise<Path> {
    const response = await this.api.patch<Path>(`/${pathId}/status`, { status });
    return response.data;
  }

  /**
   * Aggiorna il progresso di un percorso
   * Chiamato automaticamente quando i quiz vengono completati
   */
  public async updatePathProgress(pathId: string, progress: number): Promise<Path> {
    const response = await this.api.patch<Path>(`/${pathId}/progress`, { progress });
    return response.data;
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
