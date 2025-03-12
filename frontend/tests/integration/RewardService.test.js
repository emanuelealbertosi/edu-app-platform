import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import RewardService from '../../src/services/RewardService';
import { NotificationsService } from '../../src/services/NotificationsService';

// Mock di NotificationsService
jest.mock('../../src/services/NotificationsService', () => ({
  NotificationsService: {
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showInfo: jest.fn(),
    showWarning: jest.fn(),
  }
}));

describe('RewardService Integration Tests', () => {
  let mockAxios;
  let rewardService;
  
  beforeEach(() => {
    // Creazione di un nuovo mock per axios
    mockAxios = new MockAdapter(axios);
    // Istanziazione del servizio reward
    rewardService = new RewardService();
    // Setup del localStorage con token di autenticazione simulato
    localStorage.setItem('accessToken', 'mock-access-token');
    // Reset delle chiamate mock
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    // Pulizia dopo ogni test
    mockAxios.restore();
    localStorage.clear();
  });

  // Test recupero ricompense nello shop dello studente
  test('getStudentRewards dovrebbe recuperare le ricompense disponibili per lo studente', async () => {
    const mockRewards = [
      {
        id: 1,
        title: 'Giornata al Parco',
        description: 'Una giornata divertente al parco',
        cost: 500,
        category: 'Attività',
        image_url: 'https://example.com/park.jpg',
        reward_template_id: 101,
        status: 'available'
      },
      {
        id: 2,
        title: 'Film a Scelta',
        description: 'Visione di un film a scelta',
        cost: 300,
        category: 'Intrattenimento',
        image_url: 'https://example.com/movie.jpg',
        reward_template_id: 102,
        status: 'available'
      }
    ];
    
    // Mock della richiesta GET per ottenere le ricompense dello studente
    mockAxios.onGet('/api/rewards/student').reply(200, mockRewards);
    
    // Chiamata al metodo per ottenere le ricompense
    const result = await rewardService.getStudentRewards();
    
    // Verifica risultato
    expect(result).toEqual(mockRewards);
    expect(result.length).toBe(2);
    expect(result[0].title).toBe('Giornata al Parco');
    expect(result[1].cost).toBe(300);
  });

  // Test recupero saldo punti dello studente
  test('getStudentPoints dovrebbe recuperare il saldo punti dello studente', async () => {
    const mockPointsBalance = {
      student_id: 5,
      points_balance: 850,
      total_earned: 1200,
      total_spent: 350
    };
    
    // Mock della richiesta GET per ottenere il saldo punti
    mockAxios.onGet('/api/rewards/student/points').reply(200, mockPointsBalance);
    
    // Chiamata al metodo per ottenere il saldo punti
    const result = await rewardService.getStudentPoints();
    
    // Verifica risultato
    expect(result).toEqual(mockPointsBalance);
    expect(result.points_balance).toBe(850);
  });

  // Test acquisto ricompensa da parte dello studente
  test('purchaseReward dovrebbe effettuare l\'acquisto di una ricompensa', async () => {
    const rewardId = 1;
    const mockPurchaseResult = {
      purchase_id: 101,
      reward_id: 1,
      student_id: 5,
      purchase_date: '2025-03-12T05:45:00Z',
      status: 'pending_approval',
      points_spent: 500,
      new_balance: 350,
      message: 'Ricompensa acquistata con successo! In attesa di approvazione.'
    };
    
    // Mock della richiesta POST per acquistare una ricompensa
    mockAxios.onPost(`/api/rewards/${rewardId}/purchase`).reply(200, mockPurchaseResult);
    
    // Chiamata al metodo per acquistare la ricompensa
    const result = await rewardService.purchaseReward(rewardId);
    
    // Verifica risultato
    expect(result).toEqual(mockPurchaseResult);
    expect(result.reward_id).toBe(1);
    expect(result.status).toBe('pending_approval');
    expect(NotificationsService.showSuccess).toHaveBeenCalledWith('Ricompensa acquistata con successo! In attesa di approvazione.');
  });

  // Test recupero storico acquisti dello studente
  test('getPurchaseHistory dovrebbe recuperare la cronologia degli acquisti dello studente', async () => {
    const mockPurchaseHistory = [
      {
        purchase_id: 100,
        reward_id: 3,
        title: 'Libro a Scelta',
        description: 'Un libro a tua scelta',
        cost: 400,
        purchase_date: '2025-03-01T14:30:00Z',
        status: 'delivered',
        delivery_date: '2025-03-03T10:15:00Z'
      },
      {
        purchase_id: 101,
        reward_id: 1,
        title: 'Giornata al Parco',
        description: 'Una giornata divertente al parco',
        cost: 500,
        purchase_date: '2025-03-12T05:45:00Z',
        status: 'pending_approval'
      }
    ];
    
    // Mock della richiesta GET per ottenere la cronologia acquisti
    mockAxios.onGet('/api/rewards/student/purchases').reply(200, mockPurchaseHistory);
    
    // Chiamata al metodo per ottenere la cronologia acquisti
    const result = await rewardService.getPurchaseHistory();
    
    // Verifica risultato
    expect(result).toEqual(mockPurchaseHistory);
    expect(result.length).toBe(2);
    expect(result[0].status).toBe('delivered');
    expect(result[1].status).toBe('pending_approval');
  });

  // Test recupero template ricompense (per genitori)
  test('getRewardTemplates dovrebbe recuperare i template ricompense', async () => {
    const mockTemplates = [
      {
        id: 101,
        title: 'Template Giornata al Parco',
        description: 'Una giornata divertente al parco',
        cost: 500,
        category_id: 1,
        category_name: 'Attività',
        image_url: 'https://example.com/park.jpg',
        created_by: 'parent@example.com'
      },
      {
        id: 102,
        title: 'Template Film a Scelta',
        description: 'Visione di un film a scelta',
        cost: 300,
        category_id: 2,
        category_name: 'Intrattenimento',
        image_url: 'https://example.com/movie.jpg',
        created_by: 'parent@example.com'
      }
    ];
    
    // Mock della richiesta GET per ottenere i template ricompense
    mockAxios.onGet('/api/reward-templates').reply(200, mockTemplates);
    
    // Chiamata al metodo per ottenere i template ricompense
    const result = await rewardService.getRewardTemplates();
    
    // Verifica risultato
    expect(result).toEqual(mockTemplates);
    expect(result.length).toBe(2);
    expect(result[0].title).toBe('Template Giornata al Parco');
  });

  // Test creazione template ricompensa (per genitori)
  test('createRewardTemplate dovrebbe creare un nuovo template ricompensa', async () => {
    const newTemplateData = {
      title: 'Nuovo Template Videogioco',
      description: 'Un\'ora di videogioco',
      cost: 250,
      category_id: 2,
      image_url: 'https://example.com/videogame.jpg'
    };
    
    const mockCreationResult = {
      id: 103,
      ...newTemplateData,
      category_name: 'Intrattenimento',
      created_by: 'parent@example.com',
      created_at: '2025-03-12T05:50:00Z'
    };
    
    // Mock della richiesta POST per creare un template ricompensa
    mockAxios.onPost('/api/reward-templates').reply(201, mockCreationResult);
    
    // Chiamata al metodo per creare un template ricompensa
    const result = await rewardService.createRewardTemplate(newTemplateData);
    
    // Verifica risultato
    expect(result).toEqual(mockCreationResult);
    expect(result.id).toBe(103);
    expect(result.title).toBe('Nuovo Template Videogioco');
    expect(NotificationsService.showSuccess).toHaveBeenCalledWith('Template ricompensa creato con successo');
  });

  // Test approvazione acquisto ricompensa (per genitori)
  test('approveRewardPurchase dovrebbe approvare l\'acquisto di una ricompensa', async () => {
    const purchaseId = 101;
    const mockApprovalResult = {
      purchase_id: 101,
      reward_id: 1,
      student_id: 5,
      status: 'approved',
      approval_date: '2025-03-12T06:00:00Z',
      message: 'Acquisto approvato con successo'
    };
    
    // Mock della richiesta PUT per approvare un acquisto
    mockAxios.onPut(`/api/rewards/purchases/${purchaseId}/approve`).reply(200, mockApprovalResult);
    
    // Chiamata al metodo per approvare l'acquisto
    const result = await rewardService.approveRewardPurchase(purchaseId);
    
    // Verifica risultato
    expect(result).toEqual(mockApprovalResult);
    expect(result.status).toBe('approved');
    expect(NotificationsService.showSuccess).toHaveBeenCalledWith('Acquisto approvato con successo');
  });

  // Test gestione errori nell'acquisto delle ricompense
  test('purchaseReward dovrebbe gestire errori di punti insufficienti', async () => {
    const rewardId = 1;
    
    // Mock della richiesta POST con errore
    mockAxios.onPost(`/api/rewards/${rewardId}/purchase`).reply(400, { 
      detail: 'Punti insufficienti per acquistare questa ricompensa'
    });
    
    // Chiamata al metodo per acquistare la ricompensa
    const result = await rewardService.purchaseReward(rewardId);
    
    // Verifica gestione errore
    expect(result).toBe(false);
    expect(NotificationsService.showError).toHaveBeenCalledWith('Errore durante l\'acquisto: Punti insufficienti per acquistare questa ricompensa');
  });
});
