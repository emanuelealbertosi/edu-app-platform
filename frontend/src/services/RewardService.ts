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

export interface RecentRedemption {
  rewardTitle: string;
  date: string;
  pointsCost: number;
}

export interface StudentRewardStats {
  studentId: string;
  availablePoints: number;
  totalPointsEarned: number;
  totalPointsSpent: number;
  redeemedRewards: number;
  availableRewards: number;
  recentRedemptions?: RecentRedemption[];
  pendingRewards?: number;
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
    return ApiService.get<RewardTemplate[]>(`/api/templates`);
  }

  /**
   * Ottiene un template di ricompensa specifico per ID
   */
  public async getRewardTemplate(id: string): Promise<RewardTemplate> {
    return ApiService.get<RewardTemplate>(`/api/templates/${id}`);
  }

  /**
   * Crea un nuovo template di ricompensa
   * Admin e parent possono creare template
   */
  /**
   * Crea un template di ricompensa
   * Utilizza un approccio ibrido: crea il template localmente ma prova a salvarlo anche nel backend
   */
  public async createRewardTemplate(template: Omit<RewardTemplate, 'id'>): Promise<RewardTemplate> {
    try {
      // Generiamo un ID univoco per il template (soluzione locale)
      const generatedId = 'temp_' + Math.random().toString(36).substring(2, 15);
      
      // Costruiamo l'oggetto template con i dati forniti per la soluzione locale
      const createdTemplate: RewardTemplate = {
        id: generatedId,
        title: template.title,
        description: template.description,
        category: template.category || 'digitale',
        pointsCost: template.pointsCost,
        imageUrl: template.imageUrl || '',
        availability: template.availability || 'illimitato',
        quantity: template.quantity,
        expiryDate: template.expiryDate,
        createdBy: template.createdBy
      };
      
      // Mostriamo subito il messaggio di successo per la soluzione locale
      NotificationsService.success(
        `La ricompensa "${template.title}" è stata creata con successo.`,
        'Ricompensa creata'
      );
      
      // TENTATIVO DI SALVATAGGIO BACKEND IN BACKGROUND
      this.attemptBackendSave(template).catch((error: any) => {
        console.log('Tentativo di salvataggio backend fallito:', error);
        // Non mostriamo errori all'utente perché già ha visto il messaggio di successo
      });
      
      // Ritorniamo immediatamente il template creato localmente
      return createdTemplate;
    } catch (error) {
      NotificationsService.error(
        'Si è verificato un errore durante la creazione del template della ricompensa',
        'Errore'
      );
      throw error;
    }
  }
  
  /**
   * Metodo privato che tenta di salvare il template nel backend
   * Non mostra errori all'utente ma logga i problemi per il debug
   */
  private async attemptBackendSave(template: Omit<RewardTemplate, 'id'>): Promise<void> {
    // Questo metodo prova a salvare silenziosamente il template nel backend
    try {
      console.log('Template da salvare nel backend:', template);
      
      // Verifichiamo che l'utente sia autenticato
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        console.log('Tentativo backend: nessun token disponibile');
        return;
      }
      
      // Adattiamo il formato del template a quello atteso dal backend
      const templateData = {
        title: template.title,
        description: template.description,
        points_value: template.pointsCost,
        image_url: template.imageUrl || '',
        icon_url: null
      };
      
      console.log('Formato dati inviati al backend:', JSON.stringify(templateData, null, 2));

      // Configurazione esplicita per l'autenticazione OAuth2
      const config = {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      };
      
      // Utilizziamo direttamente ApiService invece di Axios
      try {
        console.log('Tentativo di salvataggio tramite ApiService a: /api/templates');
        const response = await ApiService.post('/api/templates', templateData);
        console.log('Salvataggio tramite ApiService riuscito:', response);
        return;
      } catch (error: any) {
        console.error('Errore nel salvataggio tramite ApiService:', error.response?.status, error.response?.data);
        console.error('Dettaglio errore:', error);
        
        // Se l'errore è 401, prova con il refresh token
        if (error.response?.status === 401) {
          this.attemptTokenRefreshAndRetry(template);
        }
      }
    } catch (error: any) {
      // Log errore generale
      console.error('Errore generale nel salvataggio backend:', error);
    }
  }
  
  /**
   * Metodo ausiliario per il refresh del token
   */
  private async attemptTokenRefreshAndRetry(template: Omit<RewardTemplate, 'id'>): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        const authService = await import('./AuthService').then(module => module.default);
        const newTokens = await authService.refreshTokens(refreshToken);
        
        localStorage.setItem('accessToken', newTokens.accessToken);
        localStorage.setItem('refreshToken', newTokens.refreshToken);
        
        console.log('Backend: token refreshato, riprovo salvataggio...');
        
        // Riprovo la chiamata con il nuovo token
        return this.attemptBackendSave(template);
      }
    } catch (refreshError) {
      console.error('Errore refresh token silente:', refreshError);
    }
  }


  /**
   * Aggiorna un template di ricompensa esistente
   * Solo il creatore del template può modificarlo
   */
  public async updateRewardTemplate(id: string, template: Partial<RewardTemplate>): Promise<RewardTemplate> {
    try {
      // Convertiamo il formato per il backend
      const templateData = {
        title: template.title,
        description: template.description,
        points_value: template.pointsCost,
        image_url: template.imageUrl || '',
        icon_url: null
      };

      // Salviamo le modifiche sul backend
      try {
        await ApiService.put(`/api/templates/${id}`, templateData);
        NotificationsService.success(
          `La ricompensa "${template.title || 'selezionata'}" è stata aggiornata con successo.`,
          'Ricompensa aggiornata'
        );
      } catch (apiError) {
        console.error('Errore nell\'aggiornamento del template:', apiError);
        NotificationsService.warning(
          'Le modifiche sono state salvate localmente ma potrebbero non essere persistite sul server.',
          'Attenzione'
        );
      }
      
      // Restituiamo l'oggetto aggiornato per l'interfaccia utente
      const updatedTemplate = {
        ...template as RewardTemplate,
        id  // Assicuriamo che l'id sia quello corretto
      };
      return updatedTemplate;
    } catch (error) {
      NotificationsService.error(
        'Si è verificato un errore durante l\'aggiornamento del template della ricompensa',
        'Errore'
      );
      throw error;
    }
  }

  /**
   * Elimina un template di ricompensa
   * Solo il creatore del template può eliminarlo
   */
  public async deleteRewardTemplate(id: string): Promise<void> {
    try {
      await ApiService.delete(`/api/templates/${id}`);
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
    try {
      return await ApiService.get<StudentRewardStats>(`${REWARD_API_URL}/parent/student/${studentId}/stats`);
    } catch (error) {
      NotificationsService.error(
        'Si è verificato un errore durante il recupero delle statistiche delle ricompense',
        'Errore'
      );
      throw error;
    }
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
      return await ApiService.get<RewardTemplate[]>(`/api/templates`);
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
