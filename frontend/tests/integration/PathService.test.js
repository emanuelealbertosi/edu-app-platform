import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import PathService from '../../src/services/PathService';
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

describe('PathService Integration Tests', () => {
  let mockAxios;
  let pathService;
  
  beforeEach(() => {
    // Creazione di un nuovo mock per axios
    mockAxios = new MockAdapter(axios);
    // Istanziazione del servizio path
    pathService = new PathService();
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

  // Test recupero percorsi assegnati allo studente
  test('getAssignedPaths dovrebbe recuperare i percorsi assegnati allo studente', async () => {
    const mockPaths = [
      {
        id: 1,
        title: 'Percorso Matematica Base',
        description: 'Percorso introduttivo alla matematica',
        progress: 65,
        status: 'in_progress',
        path_template_id: 101,
        assigned_date: '2025-03-01T10:00:00Z',
        nodes: [
          { id: 1, type: 'content', title: 'Introduzione', completed: true },
          { id: 2, type: 'quiz', title: 'Quiz 1', completed: true },
          { id: 3, type: 'quiz', title: 'Quiz 2', completed: false }
        ]
      },
      {
        id: 2,
        title: 'Percorso Scienze',
        description: 'Studio dei fenomeni naturali',
        progress: 100,
        status: 'completed',
        path_template_id: 102,
        assigned_date: '2025-02-15T10:00:00Z',
        completion_date: '2025-02-28T15:30:00Z'
      }
    ];
    
    // Mock della richiesta GET per ottenere i percorsi assegnati
    mockAxios.onGet('/api/paths/assigned').reply(200, mockPaths);
    
    // Chiamata al metodo per ottenere i percorsi assegnati
    const result = await pathService.getAssignedPaths();
    
    // Verifica risultato
    expect(result).toEqual(mockPaths);
    expect(result.length).toBe(2);
    expect(result[0].title).toBe('Percorso Matematica Base');
    expect(result[0].progress).toBe(65);
    expect(result[1].status).toBe('completed');
  });

  // Test recupero di un percorso specifico con nodi
  test('getPathById dovrebbe recuperare un percorso con i suoi nodi', async () => {
    const pathId = 1;
    const mockPath = {
      id: 1,
      title: 'Percorso Matematica Base',
      description: 'Percorso introduttivo alla matematica',
      progress: 65,
      status: 'in_progress',
      path_template_id: 101,
      assigned_date: '2025-03-01T10:00:00Z',
      nodes: [
        { 
          id: 1, 
          type: 'content', 
          title: 'Introduzione', 
          description: 'Concetti base di matematica',
          completed: true,
          order: 1,
          content: 'La matematica è la scienza che studia le quantità, lo spazio, le strutture e il cambiamento.'
        },
        { 
          id: 2, 
          type: 'quiz', 
          title: 'Quiz 1 - Addizioni e sottrazioni', 
          description: 'Verifica le tue conoscenze su addizioni e sottrazioni',
          completed: true,
          order: 2,
          quiz_id: 101
        },
        { 
          id: 3, 
          type: 'quiz', 
          title: 'Quiz 2 - Moltiplicazioni', 
          description: 'Verifica le tue conoscenze sulle moltiplicazioni',
          completed: false,
          order: 3,
          quiz_id: 102
        }
      ]
    };
    
    // Mock della richiesta GET per ottenere un percorso specifico
    mockAxios.onGet(`/api/paths/${pathId}`).reply(200, mockPath);
    
    // Chiamata al metodo per ottenere il percorso
    const result = await pathService.getPathById(pathId);
    
    // Verifica risultato
    expect(result).toEqual(mockPath);
    expect(result.nodes.length).toBe(3);
    expect(result.nodes[0].type).toBe('content');
    expect(result.nodes[1].completed).toBe(true);
    expect(result.nodes[2].quiz_id).toBe(102);
  });

  // Test aggiornamento progresso nodo
  test('updateNodeProgress dovrebbe aggiornare il progresso di un nodo', async () => {
    const pathId = 1;
    const nodeId = 3;
    const mockUpdateResult = {
      success: true,
      node_id: 3,
      completed: true,
      path_progress: 100,
      path_status: 'completed',
      message: 'Progresso nodo aggiornato con successo'
    };
    
    // Mock della richiesta PUT per aggiornare il progresso
    mockAxios.onPut(`/api/paths/${pathId}/nodes/${nodeId}/progress`).reply(200, mockUpdateResult);
    
    // Chiamata al metodo per aggiornare il progresso
    const result = await pathService.updateNodeProgress(pathId, nodeId, { completed: true });
    
    // Verifica risultato
    expect(result).toEqual(mockUpdateResult);
    expect(result.success).toBe(true);
    expect(result.path_progress).toBe(100);
    expect(NotificationsService.showSuccess).toHaveBeenCalledWith('Progresso nodo aggiornato con successo');
  });

  // Test recupero template percorsi (per genitori)
  test('getPathTemplates dovrebbe recuperare i template percorsi', async () => {
    const mockTemplates = [
      {
        id: 101,
        title: 'Template Matematica Base',
        description: 'Percorso introduttivo alla matematica',
        created_by: 'parent@example.com',
        node_count: 10,
        target_age_min: 6,
        target_age_max: 8
      },
      {
        id: 102,
        title: 'Template Scienze',
        description: 'Studio dei fenomeni naturali',
        created_by: 'parent@example.com',
        node_count: 8,
        target_age_min: 7,
        target_age_max: 9
      }
    ];
    
    // Mock della richiesta GET per ottenere i template percorsi
    mockAxios.onGet('/api/path-templates').reply(200, mockTemplates);
    
    // Chiamata al metodo per ottenere i template percorsi
    const result = await pathService.getPathTemplates();
    
    // Verifica risultato
    expect(result).toEqual(mockTemplates);
    expect(result.length).toBe(2);
    expect(result[0].title).toBe('Template Matematica Base');
  });

  // Test assegnazione percorso a studente
  test('assignPathToStudent dovrebbe assegnare un percorso a uno studente', async () => {
    const templateId = 101;
    const studentId = 5;
    const mockAssignmentResult = {
      id: 3,
      title: 'Percorso Matematica Base',
      description: 'Percorso introduttivo alla matematica',
      student_id: 5,
      path_template_id: 101,
      assigned_date: '2025-03-12T05:40:00Z',
      status: 'assigned',
      message: 'Percorso assegnato con successo'
    };
    
    // Mock della richiesta POST per assegnare un percorso
    mockAxios.onPost('/api/paths/assign').reply(201, mockAssignmentResult);
    
    // Chiamata al metodo per assegnare un percorso
    const result = await pathService.assignPathToStudent(templateId, studentId);
    
    // Verifica risultato
    expect(result).toEqual(mockAssignmentResult);
    expect(result.student_id).toBe(5);
    expect(result.path_template_id).toBe(101);
    expect(NotificationsService.showSuccess).toHaveBeenCalledWith('Percorso assegnato con successo');
  });

  // Test gestione errori nel recupero percorsi
  test('getAssignedPaths dovrebbe gestire gli errori e mostrare notifiche', async () => {
    // Mock della richiesta GET con errore
    mockAxios.onGet('/api/paths/assigned').reply(500, { 
      detail: 'Errore interno del server' 
    });
    
    // Chiamata al metodo per ottenere i percorsi assegnati
    const result = await pathService.getAssignedPaths();
    
    // Verifica gestione errore
    expect(result).toEqual([]);
    expect(NotificationsService.showError).toHaveBeenCalled();
  });
});
