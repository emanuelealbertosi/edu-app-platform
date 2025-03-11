import axios, { AxiosInstance } from 'axios';
import ApiService from './ApiService';
import NotificationsService from './NotificationsService';

// Fix per errore lint: "Cannot find name 'process'"
declare const process: {
  env: {
    REACT_APP_API_URL?: string;
  };
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const REWARD_API_URL = `${API_URL}/reward`;

/**
 * Servizio per gestire le operazioni relative alle ricompense
 * Integra con reward-service attraverso l'API Gateway
 */

export interface RewardTemplate {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  pointsCost: number;
  category: 'digitale' | 'fisico' | 'privilegio';
  imageUrl?: string;
  availability: 'illimitato' | 'limitato';
  quantity?: number; // Solo per disponibilità limitata
  expiryDate?: Date; // Data di scadenza opzionale
}

export interface Reward {
  id: string;
  templateId: string;
  studentId: string;
  title: string;
  description: string;
  pointsCost: number;
  category: string;
  imageUrl?: string;
  status: 'disponibile' | 'riscattato' | 'consegnato' | 'scaduto';
  redeemedAt?: Date;
  deliveredAt?: Date;
  expiryDate?: Date;
}

export interface StudentRewardStats {
  studentId: string;
  availablePoints: number;
  totalPointsEarned: number;
  totalPointsSpent: number;
  redeemedRewards: number;
  availableRewards: number;
}

export interface RedemptionRequest {
  templateId: string;
  studentId: string;
}

export interface RedemptionResponse {
  reward: Reward;
  remainingPoints: number;
}

export interface PendingReward {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  cost: number;
  requestDate: string;
}

class RewardService {
  constructor() {
    // ApiService gestisce tutto internamente
  }

  // OPERAZIONI SUI TEMPLATE DI RICOMPENSE

  /**
   * Ottiene tutti i template di ricompense
   * Admin e parent possono vedere tutti i template
   */
  public async getAllRewardTemplates(): Promise<RewardTemplate[]> {
    return ApiService.get<RewardTemplate[]>(`${REWARD_API_URL}/templates`);
  }

  /**
   * Ottiene un template di ricompensa specifico per ID
   */
  public async getRewardTemplate(id: string): Promise<RewardTemplate> {
    return ApiService.get<RewardTemplate>(`${REWARD_API_URL}/templates/${id}`);
  }

  /**
   * Crea un nuovo template di ricompensa
   * Admin e parent possono creare template
   */
  public async createRewardTemplate(template: Omit<RewardTemplate, 'id'>): Promise<RewardTemplate> {
    try {
      const result = await ApiService.post<RewardTemplate>(`${REWARD_API_URL}/templates`, template);
      NotificationsService.success(
        `La ricompensa "${template.title}" è stata creata con successo.`,
        'Ricompensa creata'
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Aggiorna un template di ricompensa esistente
   * Solo il creatore del template può modificarlo
   */
  public async updateRewardTemplate(id: string, template: Partial<RewardTemplate>): Promise<RewardTemplate> {
    try {
      const result = await ApiService.put<RewardTemplate>(`${REWARD_API_URL}/templates/${id}`, template);
      NotificationsService.success(
        `La ricompensa "${template.title || 'selezionata'}" è stata aggiornata.`,
        'Ricompensa aggiornata'
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un template di ricompensa
   * Solo il creatore del template può eliminarlo
   */
  public async deleteRewardTemplate(id: string): Promise<void> {
    try {
      await ApiService.delete(`${REWARD_API_URL}/templates/${id}`);
      NotificationsService.success(
        'La ricompensa è stata eliminata con successo.',
        'Ricompensa eliminata'
      );
    } catch (error) {
      throw error;
    }
  }

  // OPERAZIONI SULLE RICOMPENSE

  /**
   * Ottiene tutte le ricompense disponibili per lo studente corrente
   */
  public async getAvailableRewards(): Promise<RewardTemplate[]> {
    return ApiService.get<RewardTemplate[]>(`${REWARD_API_URL}/available`);
  }

  /**
   * Ottiene tutte le ricompense riscattate dallo studente corrente
   */
  public async getRedeemedRewards(): Promise<Reward[]> {
    return ApiService.get<Reward[]>(`${REWARD_API_URL}/redeemed`);
  }

  /**
   * Riscatta una ricompensa
   */
  public async redeemReward(redemption: RedemptionRequest): Promise<RedemptionResponse> {
    try {
      const result = await ApiService.post<RedemptionResponse>(`${REWARD_API_URL}/redeem`, redemption);
      
      NotificationsService.success(
        `Hai riscattato con successo la ricompensa! Ti restano ${result.remainingPoints} punti.`,
        'Ricompensa riscattata',
        { autoClose: true, duration: 6000 }
      );
      
      return result;
    } catch (error) {
      // Se ci sono errori specifici, mostriamo notifiche più informative
      // L'ApiErrorHandler si occuperà di mostrare eventuali errori generici
      throw error;
    }
  }

  /**
   * Ottiene statistiche sulle ricompense di uno studente
   */
  public async getStudentRewardStats(studentId: string): Promise<StudentRewardStats> {
    return ApiService.get<StudentRewardStats>(`${REWARD_API_URL}/stats/student/${studentId}`);
  }

  /**
   * Aggiorna lo stato di una ricompensa
   * Solo parent può aggiornare lo stato (ad es. segnarla come consegnata)
   */
  public async updateRewardStatus(rewardId: string, status: Reward['status']): Promise<Reward> {
    try {
      const result = await ApiService.put<Reward>(`${REWARD_API_URL}/${rewardId}/status`, { status });
      
      let message = '';
      let title = 'Stato ricompensa aggiornato';
      
      switch(status) {
        case 'consegnato':
          message = 'La ricompensa è stata contrassegnata come consegnata.';
          title = 'Ricompensa consegnata';
          break;
        case 'riscattato':
          message = 'La ricompensa è stata riscattata con successo.';
          title = 'Ricompensa riscattata';
          break;
        case 'scaduto':
          message = 'La ricompensa è scaduta e non è più disponibile.';
          title = 'Ricompensa scaduta';
          NotificationsService.warning(message, title);
          return result;
        default:
          message = `Lo stato della ricompensa è stato aggiornato a: ${status}.`;
      }
      
      NotificationsService.success(message, title);
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Aggiunge punti a uno studente (può essere usato per bonus o correzioni)
   * Solo parent o admin possono aggiungere punti
   */
  public async addPointsToStudent(studentId: string, points: number, reason: string): Promise<StudentRewardStats> {
    try {
      const result = await ApiService.post<StudentRewardStats>(`${REWARD_API_URL}/points/add`, { 
        studentId, 
        points, 
        reason 
      });
      
      if (points > 0) {
        NotificationsService.success(
          `Sono stati aggiunti ${points} punti allo studente. Nuovo saldo: ${result.availablePoints} punti.`,
          'Punti aggiunti',
          { autoClose: true, duration: 5000 }
        );
      } else if (points < 0) {
        NotificationsService.warning(
          `Sono stati rimossi ${Math.abs(points)} punti allo studente. Nuovo saldo: ${result.availablePoints} punti.`,
          'Punti rimossi',
          { autoClose: true, duration: 5000 }
        );
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Ottiene la cronologia dei punti di uno studente
   */
  public async getPointsHistory(studentId: string): Promise<Array<{
    date: Date;
    points: number;
    balance: number;
    source: 'quiz' | 'path' | 'manual' | 'redemption';
    description: string;
  }>> {
    return ApiService.get(`${REWARD_API_URL}/points/history/${studentId}`);
  }

  /**
   * Ottiene le ricompense in attesa di approvazione per i figli del genitore
   * Solo i genitori possono vedere le ricompense in attesa dei propri figli
   */
  public async getPendingRewards(): Promise<PendingReward[]> {
    try {
      const result = await ApiService.get<PendingReward[]>(`${REWARD_API_URL}/parent/pending`);
      return result;
    } catch (error) {
      NotificationsService.error(
        'Si è verificato un errore durante il recupero delle ricompense in attesa',
        'Errore'
      );
      throw error;
    }
  }

  /**
   * Approva una richiesta di ricompensa in attesa
   * @param rewardId ID della ricompensa da approvare
   */
  public async approveReward(rewardId: string): Promise<void> {
    try {
      await ApiService.put(`${REWARD_API_URL}/parent/approve/${rewardId}`);
      NotificationsService.success('Ricompensa approvata con successo', 'Approvata');
    } catch (error) {
      NotificationsService.error(
        'Si è verificato un errore durante l\'approvazione della ricompensa',
        'Errore'
      );
      throw error;
    }
  }

  /**
   * Rifiuta una richiesta di ricompensa in attesa
   * @param rewardId ID della ricompensa da rifiutare
   */
  public async rejectReward(rewardId: string): Promise<void> {
    try {
      await ApiService.put(`${REWARD_API_URL}/parent/reject/${rewardId}`);
      NotificationsService.success('Ricompensa rifiutata', 'Rifiutata');
    } catch (error) {
      NotificationsService.error(
        'Si è verificato un errore durante il rifiuto della ricompensa',
        'Errore'
      );
      throw error;
    }
  }

  /**
   * Ottiene i template di ricompense che possono essere assegnati ai figli
   * Filtrati in base alle impostazioni del genitore
   */
  public async getRewardTemplates(): Promise<RewardTemplate[]> {
    try {
      return await ApiService.get<RewardTemplate[]>(`${REWARD_API_URL}/parent/templates`);
    } catch (error) {
      NotificationsService.error(
        'Si è verificato un errore durante il recupero dei template delle ricompense',
        'Errore'
      );
      throw error;
    }
  }
}

// Esporta una singola istanza del servizio
export default new RewardService();
