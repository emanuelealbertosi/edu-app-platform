import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import UserService from '../../src/services/UserService';
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

describe('UserService Integration Tests', () => {
  let mockAxios;
  
  // Dati di test
  const mockUsers = [
    {
      id: 1,
      email: 'admin@example.com',
      full_name: 'Admin User',
      role: 'admin',
      created_at: '2025-01-10T10:00:00Z',
      is_active: true
    },
    {
      id: 2,
      email: 'parent@example.com',
      full_name: 'Parent User',
      role: 'parent',
      created_at: '2025-02-15T14:30:00Z',
      is_active: true
    },
    {
      id: 3,
      email: 'student@example.com',
      full_name: 'Student User',
      role: 'student',
      created_at: '2025-03-01T09:15:00Z',
      is_active: true
    }
  ];
  
  const mockUser = {
    id: 2,
    email: 'parent@example.com',
    full_name: 'Parent User',
    role: 'parent',
    created_at: '2025-02-15T14:30:00Z',
    is_active: true,
    last_login: '2025-03-10T08:45:00Z',
    profile_info: {
      phone: '+39 123 456 7890',
      address: 'Via Roma 123, Milano',
      profile_image: 'https://example.com/parent.jpg'
    }
  };
  
  const mockNewUser = {
    email: 'new.parent@example.com',
    password: 'securePassword123',
    full_name: 'Nuovo Genitore',
    role: 'parent'
  };
  
  const mockCreatedUser = {
    id: 4,
    email: 'new.parent@example.com',
    full_name: 'Nuovo Genitore',
    role: 'parent',
    created_at: '2025-03-12T05:30:00Z',
    is_active: true
  };
  
  const mockSystemStats = {
    total_users: 42,
    users_by_role: {
      admin: 2,
      parent: 15,
      student: 25
    },
    total_quiz_templates: 15,
    total_quiz_attempts: 320,
    successful_attempts: 275,
    average_score: 76.5,
    active_sessions: 12
  };
  
  beforeEach(() => {
    // Configurazione del mock axios
    mockAxios = new MockAdapter(axios);
    
    // Reset delle chiamate mock
    jest.clearAllMocks();
    
    // Setup del localStorage con token di autenticazione simulato
    localStorage.setItem('accessToken', 'mock-access-token');
  });
  
  afterEach(() => {
    // Pulizia dopo ogni test
    mockAxios.restore();
    localStorage.clear();
  });
  
  test('dovrebbe ottenere l\'elenco degli utenti', async () => {
    // Configurazione del mock per simulare una risposta di successo
    mockAxios.onGet('/api/users').reply(200, mockUsers);
    
    // Chiamata al servizio
    const result = await UserService.getUsers();
    
    // Verifica che la risposta sia corretta
    expect(result).toEqual(mockUsers);
    expect(result.length).toBe(3);
    expect(result[0].role).toBe('admin');
    expect(result[1].role).toBe('parent');
    expect(result[2].role).toBe('student');
  });
  
  test('dovrebbe gestire errori nel recupero degli utenti', async () => {
    // Configurazione del mock per simulare un errore
    mockAxios.onGet('/api/users').reply(403, {
      detail: 'Accesso negato: permessi insufficienti'
    });
    
    // Chiamata al servizio e intercettazione dell'errore
    try {
      await UserService.getUsers();
      fail('Il test dovrebbe fallire con un errore');
    } catch (error) {
      // Verifica che l'errore sia gestito correttamente
      expect(error.message).toEqual('Request failed with status code 403');
      expect(NotificationsService.showError).toHaveBeenCalledWith(
        'Errore: Accesso negato: permessi insufficienti'
      );
    }
  });
  
  test('dovrebbe ottenere i dettagli di un utente specifico', async () => {
    // Configurazione del mock per simulare una risposta di successo
    mockAxios.onGet('/api/users/2').reply(200, mockUser);
    
    // Chiamata al servizio
    const result = await UserService.getUserById(2);
    
    // Verifica che la risposta sia corretta
    expect(result).toEqual(mockUser);
    expect(result.id).toBe(2);
    expect(result.email).toBe('parent@example.com');
    expect(result.role).toBe('parent');
    expect(result.profile_info.phone).toBe('+39 123 456 7890');
  });
  
  test('dovrebbe creare un nuovo utente', async () => {
    // Configurazione del mock per simulare una risposta di successo
    mockAxios.onPost('/api/users').reply(201, mockCreatedUser);
    
    // Chiamata al servizio
    const result = await UserService.createUser(mockNewUser);
    
    // Verifica che la risposta sia corretta
    expect(result).toEqual(mockCreatedUser);
    expect(result.id).toBe(4);
    expect(result.email).toBe('new.parent@example.com');
    expect(result.role).toBe('parent');
    
    // Verifica che sia stata mostrata una notifica di successo
    expect(NotificationsService.showSuccess).toHaveBeenCalledWith(
      'Utente creato con successo'
    );
  });
  
  test('dovrebbe aggiornare i dati di un utente', async () => {
    // Dati per l'aggiornamento
    const updateData = {
      full_name: 'Parent User Aggiornato',
      profile_info: {
        phone: '+39 098 765 4321',
        address: 'Via Garibaldi 456, Roma'
      }
    };
    
    // Risposta attesa
    const updatedUser = {
      ...mockUser,
      full_name: 'Parent User Aggiornato',
      profile_info: {
        ...mockUser.profile_info,
        phone: '+39 098 765 4321',
        address: 'Via Garibaldi 456, Roma'
      }
    };
    
    // Configurazione del mock per simulare una risposta di successo
    mockAxios.onPut('/api/users/2').reply(200, updatedUser);
    
    // Chiamata al servizio
    const result = await UserService.updateUser(2, updateData);
    
    // Verifica che la risposta sia corretta
    expect(result).toEqual(updatedUser);
    expect(result.full_name).toBe('Parent User Aggiornato');
    expect(result.profile_info.phone).toBe('+39 098 765 4321');
    expect(result.profile_info.address).toBe('Via Garibaldi 456, Roma');
    
    // Verifica che sia stata mostrata una notifica di successo
    expect(NotificationsService.showSuccess).toHaveBeenCalledWith(
      'Dati utente aggiornati con successo'
    );
  });
  
  test('dovrebbe disattivare un utente', async () => {
    // Configurazione del mock per simulare una risposta di successo
    mockAxios.onPatch('/api/users/2/deactivate').reply(200, {
      ...mockUser,
      is_active: false
    });
    
    // Chiamata al servizio
    const result = await UserService.deactivateUser(2);
    
    // Verifica che la risposta sia corretta
    expect(result.is_active).toBe(false);
    
    // Verifica che sia stata mostrata una notifica di successo
    expect(NotificationsService.showSuccess).toHaveBeenCalledWith(
      'Utente disattivato con successo'
    );
  });
  
  test('dovrebbe riattivare un utente', async () => {
    // Utente disattivato
    const inactiveUser = {
      ...mockUser,
      is_active: false
    };
    
    // Configurazione del mock per simulare una risposta di successo
    mockAxios.onPatch('/api/users/2/activate').reply(200, mockUser);
    
    // Chiamata al servizio
    const result = await UserService.activateUser(2);
    
    // Verifica che la risposta sia corretta
    expect(result.is_active).toBe(true);
    
    // Verifica che sia stata mostrata una notifica di successo
    expect(NotificationsService.showSuccess).toHaveBeenCalledWith(
      'Utente riattivato con successo'
    );
  });
  
  test('dovrebbe gestire errori di validazione nella creazione di un utente', async () => {
    // Configurazione del mock per simulare un errore di validazione
    mockAxios.onPost('/api/users').reply(422, {
      detail: [
        {
          loc: ['body', 'email'],
          msg: 'Email non valida',
          type: 'value_error'
        },
        {
          loc: ['body', 'password'],
          msg: 'La password deve essere lunga almeno 8 caratteri',
          type: 'value_error'
        }
      ]
    });
    
    // Dati invalidi per il test
    const invalidUser = {
      email: 'invalid-email',
      password: 'pass',
      full_name: 'Test User',
      role: 'parent'
    };
    
    // Chiamata al servizio e intercettazione dell'errore
    try {
      await UserService.createUser(invalidUser);
      fail('Il test dovrebbe fallire con un errore');
    } catch (error) {
      // Verifica che l'errore sia gestito correttamente
      expect(NotificationsService.showError).toHaveBeenCalledWith(
        expect.stringContaining('Errori di validazione')
      );
      
      // Verifica che il messaggio di errore contenga i dettagli degli errori di validazione
      const errorCall = NotificationsService.showError.mock.calls[0][0];
      expect(errorCall).toContain('Email non valida');
      expect(errorCall).toContain('La password deve essere lunga almeno 8 caratteri');
    }
  });
  
  test('dovrebbe ottenere le statistiche di sistema', async () => {
    // Configurazione del mock per simulare una risposta di successo
    mockAxios.onGet('/api/system/stats').reply(200, mockSystemStats);
    
    // Chiamata al servizio
    const result = await UserService.getSystemStats();
    
    // Verifica che la risposta sia corretta
    expect(result).toEqual(mockSystemStats);
    expect(result.total_users).toBe(42);
    expect(result.users_by_role.admin).toBe(2);
    expect(result.users_by_role.parent).toBe(15);
    expect(result.users_by_role.student).toBe(25);
    expect(result.average_score).toBe(76.5);
  });
  
  test('dovrebbe generare un report utenti', async () => {
    // Configurazione del mock per simulare una risposta di successo
    mockAxios.onGet('/api/reports/users').reply(200, {
      report_id: 'user-report-2025-03-12',
      generated_at: '2025-03-12T05:45:00Z',
      user_count: 42,
      active_users: 40,
      inactive_users: 2,
      registrations_last_30_days: 8,
      download_url: 'https://example.com/reports/user-report-2025-03-12.csv'
    });
    
    // Chiamata al servizio
    const result = await UserService.generateUserReport();
    
    // Verifica che la risposta sia corretta
    expect(result.report_id).toBe('user-report-2025-03-12');
    expect(result.user_count).toBe(42);
    expect(result.download_url).toBe('https://example.com/reports/user-report-2025-03-12.csv');
    
    // Verifica che sia stata mostrata una notifica di successo
    expect(NotificationsService.showSuccess).toHaveBeenCalledWith(
      'Report utenti generato con successo'
    );
  });
});
