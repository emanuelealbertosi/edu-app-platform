import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import StudentService from '../../src/services/StudentService';
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

describe('StudentService Integration Tests', () => {
  let mockAxios;
  
  // Dati di test
  const mockStudents = [
    {
      id: 1,
      full_name: 'Mario Rossi',
      email: 'mario.rossi@example.com',
      age: 10,
      points_balance: 750,
      total_paths: 3,
      completed_paths: 1
    },
    {
      id: 2,
      full_name: 'Giulia Bianchi',
      email: 'giulia.bianchi@example.com',
      age: 8,
      points_balance: 500,
      total_paths: 2,
      completed_paths: 0
    }
  ];
  
  const mockStudent = {
    id: 1,
    full_name: 'Mario Rossi',
    email: 'mario.rossi@example.com',
    age: 10,
    birth_date: '2015-05-10',
    parent_id: 5,
    parent_name: 'Paolo Rossi',
    parent_email: 'paolo.rossi@example.com',
    profile_image: 'https://example.com/mario.jpg',
    points_balance: 750,
    total_paths: 3,
    completed_paths: 1,
    reward_purchases: 2,
    active_quizzes: 2,
    completed_quizzes: 5,
    average_score: 85.5
  };
  
  const mockNewStudent = {
    full_name: 'Lucia Verdi',
    email: 'lucia.verdi@example.com',
    password: 'password123',
    birth_date: '2017-03-20',
    parent_id: 5
  };
  
  const mockCreatedStudent = {
    id: 3,
    full_name: 'Lucia Verdi',
    email: 'lucia.verdi@example.com',
    age: 8,
    birth_date: '2017-03-20',
    parent_id: 5,
    parent_name: 'Paolo Rossi',
    parent_email: 'paolo.rossi@example.com'
  };
  
  const mockProgressUpdate = {
    student_id: 1,
    progress_data: {
      total_paths: 3,
      completed_paths: 2,
      total_quizzes: 7,
      completed_quizzes: 6,
      points_earned: 850,
      average_score: 88.5
    },
    timestamp: '2025-03-12T05:30:00Z'
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
  
  test('dovrebbe ottenere l\'elenco degli studenti', async () => {
    // Configurazione del mock per simulare una risposta di successo
    mockAxios.onGet('/api/students').reply(200, mockStudents);
    
    // Chiamata al servizio
    const result = await StudentService.getStudents();
    
    // Verifica che la risposta sia corretta
    expect(result).toEqual(mockStudents);
    expect(result.length).toBe(2);
    expect(result[0].full_name).toBe('Mario Rossi');
    expect(result[1].full_name).toBe('Giulia Bianchi');
  });
  
  test('dovrebbe gestire errori nel recupero degli studenti', async () => {
    // Configurazione del mock per simulare un errore
    mockAxios.onGet('/api/students').reply(500, {
      detail: 'Errore interno del server'
    });
    
    // Chiamata al servizio e intercettazione dell'errore
    try {
      await StudentService.getStudents();
      fail('Il test dovrebbe fallire con un errore');
    } catch (error) {
      // Verifica che l'errore sia gestito correttamente
      expect(error.message).toEqual('Request failed with status code 500');
      expect(NotificationsService.showError).toHaveBeenCalledWith(
        'Errore del server: Errore interno del server'
      );
    }
  });
  
  test('dovrebbe ottenere i dettagli di uno studente specifico', async () => {
    // Configurazione del mock per simulare una risposta di successo
    mockAxios.onGet('/api/students/1').reply(200, mockStudent);
    
    // Chiamata al servizio
    const result = await StudentService.getStudentById(1);
    
    // Verifica che la risposta sia corretta
    expect(result).toEqual(mockStudent);
    expect(result.id).toBe(1);
    expect(result.full_name).toBe('Mario Rossi');
    expect(result.age).toBe(10);
    expect(result.points_balance).toBe(750);
  });
  
  test('dovrebbe creare un nuovo studente', async () => {
    // Configurazione del mock per simulare una risposta di successo
    mockAxios.onPost('/api/students').reply(201, mockCreatedStudent);
    
    // Chiamata al servizio
    const result = await StudentService.createStudent(mockNewStudent);
    
    // Verifica che la risposta sia corretta
    expect(result).toEqual(mockCreatedStudent);
    expect(result.id).toBe(3);
    expect(result.full_name).toBe('Lucia Verdi');
    
    // Verifica che sia stata mostrata una notifica di successo
    expect(NotificationsService.showSuccess).toHaveBeenCalledWith(
      'Studente creato con successo'
    );
  });
  
  test('dovrebbe aggiornare i dati di uno studente', async () => {
    // Dati per l'aggiornamento
    const updateData = {
      full_name: 'Mario Rossi Aggiornato',
      age: 11,
      birth_date: '2014-05-10'
    };
    
    // Risposta attesa
    const updatedStudent = {
      ...mockStudent,
      full_name: 'Mario Rossi Aggiornato',
      age: 11,
      birth_date: '2014-05-10'
    };
    
    // Configurazione del mock per simulare una risposta di successo
    mockAxios.onPut('/api/students/1').reply(200, updatedStudent);
    
    // Chiamata al servizio
    const result = await StudentService.updateStudent(1, updateData);
    
    // Verifica che la risposta sia corretta
    expect(result).toEqual(updatedStudent);
    expect(result.full_name).toBe('Mario Rossi Aggiornato');
    expect(result.age).toBe(11);
    
    // Verifica che sia stata mostrata una notifica di successo
    expect(NotificationsService.showSuccess).toHaveBeenCalledWith(
      'Dati studente aggiornati con successo'
    );
  });
  
  test('dovrebbe eliminare uno studente', async () => {
    // Configurazione del mock per simulare una risposta di successo
    mockAxios.onDelete('/api/students/1').reply(200, {
      success: true,
      message: 'Studente eliminato con successo'
    });
    
    // Chiamata al servizio
    const result = await StudentService.deleteStudent(1);
    
    // Verifica che la risposta sia corretta
    expect(result).toEqual({
      success: true,
      message: 'Studente eliminato con successo'
    });
    
    // Verifica che sia stata mostrata una notifica di successo
    expect(NotificationsService.showSuccess).toHaveBeenCalledWith(
      'Studente eliminato con successo'
    );
  });
  
  test('dovrebbe ottenere il progresso di uno studente', async () => {
    // Configurazione del mock per simulare una risposta di successo
    mockAxios.onGet('/api/students/1/progress').reply(200, mockProgressUpdate);
    
    // Chiamata al servizio
    const result = await StudentService.getStudentProgress(1);
    
    // Verifica che la risposta sia corretta
    expect(result).toEqual(mockProgressUpdate);
    expect(result.student_id).toBe(1);
    expect(result.progress_data.completed_paths).toBe(2);
    expect(result.progress_data.average_score).toBe(88.5);
  });
  
  test('dovrebbe gestire errori di validazione nella creazione di uno studente', async () => {
    // Configurazione del mock per simulare un errore di validazione
    mockAxios.onPost('/api/students').reply(422, {
      detail: [
        {
          loc: ['body', 'email'],
          msg: 'Email non valida',
          type: 'value_error'
        },
        {
          loc: ['body', 'birth_date'],
          msg: 'La data di nascita deve essere nel formato YYYY-MM-DD',
          type: 'value_error'
        }
      ]
    });
    
    // Dati invalidi per il test
    const invalidStudent = {
      full_name: 'Studente Test',
      email: 'invalid-email',
      password: 'pass',
      birth_date: '20-03-2017',
      parent_id: 5
    };
    
    // Chiamata al servizio e intercettazione dell'errore
    try {
      await StudentService.createStudent(invalidStudent);
      fail('Il test dovrebbe fallire con un errore');
    } catch (error) {
      // Verifica che l'errore sia gestito correttamente
      expect(NotificationsService.showError).toHaveBeenCalledWith(
        expect.stringContaining('Errori di validazione')
      );
      
      // Verifica che il messaggio di errore contenga i dettagli degli errori di validazione
      const errorCall = NotificationsService.showError.mock.calls[0][0];
      expect(errorCall).toContain('Email non valida');
      expect(errorCall).toContain('La data di nascita deve essere nel formato YYYY-MM-DD');
    }
  });
  
  test('dovrebbe ottenere gli studenti associati a un genitore', async () => {
    // Configurazione del mock per simulare una risposta di successo
    mockAxios.onGet('/api/parents/5/students').reply(200, mockStudents);
    
    // Chiamata al servizio
    const result = await StudentService.getStudentsByParent(5);
    
    // Verifica che la risposta sia corretta
    expect(result).toEqual(mockStudents);
    expect(result.length).toBe(2);
  });
});
