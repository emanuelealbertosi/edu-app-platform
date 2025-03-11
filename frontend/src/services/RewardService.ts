import axios, { AxiosInstance } from 'axios';

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

class RewardService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: REWARD_API_URL,
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

  // OPERAZIONI SUI TEMPLATE DI RICOMPENSE

  /**
   * Ottiene tutti i template di ricompense
   * Admin e parent possono vedere tutti i template
   */
  public async getAllRewardTemplates(): Promise<RewardTemplate[]> {
    const response = await this.api.get<RewardTemplate[]>('/templates');
    return response.data;
  }

  /**
   * Ottiene un template di ricompensa specifico per ID
   */
  public async getRewardTemplate(id: string): Promise<RewardTemplate> {
    const response = await this.api.get<RewardTemplate>(`/templates/${id}`);
    return response.data;
  }

  /**
   * Crea un nuovo template di ricompensa
   * Admin e parent possono creare template
   */
  public async createRewardTemplate(template: Omit<RewardTemplate, 'id'>): Promise<RewardTemplate> {
    const response = await this.api.post<RewardTemplate>('/templates', template);
    return response.data;
  }

  /**
   * Aggiorna un template di ricompensa esistente
   * Solo il creatore del template può modificarlo
   */
  public async updateRewardTemplate(id: string, template: Partial<RewardTemplate>): Promise<RewardTemplate> {
    const response = await this.api.put<RewardTemplate>(`/templates/${id}`, template);
    return response.data;
  }

  /**
   * Elimina un template di ricompensa
   * Solo il creatore del template può eliminarlo
   */
  public async deleteRewardTemplate(id: string): Promise<void> {
    await this.api.delete(`/templates/${id}`);
  }

  // OPERAZIONI SULLE RICOMPENSE

  /**
   * Ottiene tutte le ricompense disponibili per lo studente corrente
   */
  public async getAvailableRewards(): Promise<RewardTemplate[]> {
    const response = await this.api.get<RewardTemplate[]>('/available');
    return response.data;
  }

  /**
   * Ottiene tutte le ricompense riscattate dallo studente corrente
   */
  public async getRedeemedRewards(): Promise<Reward[]> {
    const response = await this.api.get<Reward[]>('/redeemed');
    return response.data;
  }

  /**
   * Riscatta una ricompensa
   */
  public async redeemReward(redemption: RedemptionRequest): Promise<RedemptionResponse> {
    const response = await this.api.post<RedemptionResponse>('/redeem', redemption);
    return response.data;
  }

  /**
   * Ottiene statistiche sulle ricompense di uno studente
   */
  public async getStudentRewardStats(studentId: string): Promise<StudentRewardStats> {
    const response = await this.api.get<StudentRewardStats>(`/stats/student/${studentId}`);
    return response.data;
  }

  /**
   * Aggiorna lo stato di una ricompensa
   * Solo parent può aggiornare lo stato (ad es. segnarla come consegnata)
   */
  public async updateRewardStatus(rewardId: string, status: Reward['status']): Promise<Reward> {
    const response = await this.api.patch<Reward>(`/${rewardId}/status`, { status });
    return response.data;
  }

  /**
   * Aggiunge punti a uno studente (può essere usato per bonus o correzioni)
   * Solo parent o admin possono aggiungere punti
   */
  public async addPointsToStudent(studentId: string, points: number, reason: string): Promise<StudentRewardStats> {
    const response = await this.api.post<StudentRewardStats>(`/points/add`, { studentId, points, reason });
    return response.data;
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
    const response = await this.api.get(`/points/history/${studentId}`);
    return response.data;
  }
}

// Esporta una singola istanza del servizio
export default new RewardService();
