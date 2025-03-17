import axios, { AxiosInstance } from 'axios';
import ApiErrorHandler from './ApiErrorHandler';
import { NotificationsService } from './NotificationsService';
import ApiService from './ApiService';

// Fix per errore lint: "Cannot find name 'process'"
declare const process: {
  env: {
    REACT_APP_API_URL?: string;
  };
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
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
 * Servizio per gestire le operazioni relative agli studenti
 */
class StudentService {
  private api: AxiosInstance;

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
}

// Esporta una singola istanza del servizio
export default new StudentService();
