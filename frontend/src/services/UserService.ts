import axios, { AxiosInstance } from 'axios';
import ApiService from './ApiService';
import { NotificationsService } from './NotificationsService';

// Fix per errore lint: "Cannot find name 'process'"
declare const process: {
  env: {
    REACT_APP_API_URL?: string;
  };
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const AUTH_API_URL = `${API_URL}/auth`;

/**
 * Interfaccia per i dati dell'utente
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'parent' | 'student';
  createdAt: Date;
  lastLogin?: Date;
  active: boolean;
  username?: string;
}

/**
 * Interfaccia per le statistiche del sistema
 */
export interface SystemStats {
  totalUsers: number;
  activeStudents: number;
  activeParents: number;
  totalPaths: number;
  completedPaths: number;
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  totalRewards: number;
  redeemedRewards: number;
}

/**
 * Interfaccia per l'attività di sistema recente
 */
export interface AdminActivity {
  id: string;
  action: string;
  userId: string;
  username: string;
  userRole: string;
  timestamp: Date;
  details?: Record<string, any>;
}

/**
 * Servizio per gestire le operazioni relative agli utenti (admin)
 */
class UserService {
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
   * Ottiene tutti gli utenti (solo admin)
   */
  public async getAllUsers(): Promise<User[]> {
    try {
      const response = await this.api.get<User[]>('/admin/users');
      return response.data;
    } catch (error) {
      NotificationsService.error('Errore nel recupero degli utenti', 'Errore');
      throw error;
    }
  }

  /**
   * Ottiene un utente specifico per ID (solo admin)
   */
  public async getUserById(userId: string): Promise<User> {
    try {
      const response = await this.api.get<User>(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      NotificationsService.error('Errore nel recupero dei dati dell\'utente', 'Errore');
      throw error;
    }
  }

  /**
   * Crea un nuovo utente (solo admin)
   */
  public async createUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'parent' | 'student';
  }): Promise<User> {
    try {
      const response = await this.api.post<User>('/admin/users', userData);
      NotificationsService.success('Utente creato con successo');
      return response.data;
    } catch (error) {
      NotificationsService.error('Errore nella creazione dell\'utente', 'Errore');
      throw error;
    }
  }

  /**
   * Aggiorna un utente esistente (solo admin)
   */
  public async updateUser(
    userId: string,
    userData: {
      email?: string;
      firstName?: string;
      lastName?: string;
      role?: 'admin' | 'parent' | 'student';
      active?: boolean;
    }
  ): Promise<User> {
    try {
      const response = await this.api.put<User>(`/admin/users/${userId}`, userData);
      NotificationsService.success('Utente aggiornato con successo');
      return response.data;
    } catch (error) {
      NotificationsService.error('Errore nell\'aggiornamento dell\'utente', 'Errore');
      throw error;
    }
  }

  /**
   * Disattiva un utente (solo admin)
   */
  public async deactivateUser(userId: string): Promise<void> {
    try {
      await this.api.put(`/admin/users/${userId}/deactivate`);
      NotificationsService.success('Utente disattivato con successo');
    } catch (error) {
      NotificationsService.error('Errore nella disattivazione dell\'utente', 'Errore');
      throw error;
    }
  }

  /**
   * Reimposta la password di un utente (solo admin)
   */
  public async resetUserPassword(userId: string, newPassword: string): Promise<void> {
    try {
      await this.api.put(`/admin/users/${userId}/reset-password`, { password: newPassword });
      NotificationsService.success('Password reimpostata con successo');
    } catch (error) {
      NotificationsService.error('Errore nel reset della password', 'Errore');
      throw error;
    }
  }

  /**
   * Ottiene le statistiche del sistema (solo admin)
   */
  public async getSystemStats(): Promise<SystemStats> {
    try {
      const response = await this.api.get<SystemStats>('/admin/stats');
      return response.data;
    } catch (error) {
      NotificationsService.error('Errore nel recupero delle statistiche di sistema', 'Errore');
      throw error;
    }
  }

  /**
   * Ottiene le attività recenti del sistema (solo admin)
   */
  public async getSystemActivities(): Promise<AdminActivity[]> {
    try {
      const response = await this.api.get<AdminActivity[]>('/admin/activities');
      return response.data;
    } catch (error) {
      NotificationsService.error('Errore nel recupero delle attività di sistema', 'Errore');
      throw error;
    }
  }
}

// Esporta una singola istanza del servizio
export default new UserService();
