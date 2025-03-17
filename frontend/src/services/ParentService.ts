import axios from 'axios';
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
 * Interfaccia per i dati del profilo genitore
 */
export interface ParentProfile {
  id: number;
  user_id: number;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    username?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Classe per la gestione dei servizi relativi ai genitori
 */
class ParentService {
  /**
   * Ottiene tutti i profili dei genitori (solo per admin)
   */
  public async getAllParents(): Promise<ParentProfile[]> {
    try {
      return await ApiService.get<ParentProfile[]>('/api/auth/parents');
    } catch (error) {
      NotificationsService.error('Errore nel recupero dei profili dei genitori', 'Errore');
      throw error;
    }
  }

  /**
   * Ottiene il profilo di un genitore specifico per ID
   */
  public async getParentById(parentId: number): Promise<ParentProfile> {
    try {
      return await ApiService.get<ParentProfile>(`/api/auth/parents/${parentId}`);
    } catch (error) {
      NotificationsService.error('Errore nel recupero del profilo genitore', 'Errore');
      throw error;
    }
  }

  /**
   * Ottiene il profilo del genitore associato all'utente corrente
   */
  public async getCurrentParentProfile(): Promise<ParentProfile> {
    try {
      return await ApiService.get<ParentProfile>('/api/auth/parents/me');
    } catch (error) {
      NotificationsService.error('Errore nel recupero del profilo genitore', 'Errore');
      throw error;
    }
  }

  /**
   * Ottiene gli studenti associati al genitore corrente
   */
  public async getParentStudents(): Promise<any[]> {
    try {
      return await ApiService.get<any[]>('/api/auth/parent/students');
    } catch (error) {
      NotificationsService.error('Errore nel recupero degli studenti associati', 'Errore');
      throw error;
    }
  }
}

// Esporta un'istanza singola del servizio
export default new ParentService();
