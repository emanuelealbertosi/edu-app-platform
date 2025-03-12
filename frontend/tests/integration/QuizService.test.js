import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import QuizService from '../../src/services/QuizService';
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

describe('QuizService Integration Tests', () => {
  let mockAxios;
  
  beforeEach(() => {
    // Setup Mock di axios
    mockAxios = new MockAdapter(axios);
    
    // Setup del localStorage con token di autenticazione simulato
    localStorage.setItem('accessToken', 'mock-access-token');
    
    // Reset delle chiamate mock
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    // Pulizia
    mockAxios.reset();
    localStorage.clear();
  });
  
  test('getAssignedQuizzes dovrebbe recuperare i quiz assegnati allo studente', async () => {
    // Mock response data
    const mockQuizzes = [
      {
        id: '1',
        templateId: 'template-1',
        studentId: 'student-1',
        title: 'Quiz di Matematica',
        description: 'Quiz sulle operazioni di base',
        isCompleted: false,
        maxScore: 100,
        questions: []
      },
      {
        id: '2',
        templateId: 'template-2',
        studentId: 'student-1',
        title: 'Quiz di Italiano',
        description: 'Quiz sulla grammatica italiana',
        isCompleted: true,
        startedAt: '2024-03-10T09:00:00Z',
        completedAt: '2024-03-10T09:30:00Z',
        score: 85,
        maxScore: 100,
        questions: []
      }
    ];
    
    // Setup del mock
    mockAxios.onGet('/api/quiz/assigned').reply(200, mockQuizzes);
    
    // Chiamata al metodo da testare
    const result = await QuizService.getAssignedQuizzes();
    
    // Verifica del risultato
    expect(result).toEqual(mockQuizzes);
    
    // Verifica che sia stata fatta la richiesta giusta
    expect(mockAxios.history.get[0].url).toBe('/api/quiz/assigned');
    expect(mockAxios.history.get[0].headers.Authorization).toBe('Bearer mock-access-token');
  });
  
  test('getQuizWithQuestions dovrebbe recuperare un quiz con le sue domande', async () => {
    // ID del quiz per il test
    const quizId = '1';
    
    // Mock response data
    const mockQuiz = {
      id: quizId,
      templateId: 'template-1',
      studentId: 'student-1',
      title: 'Quiz di Matematica',
      description: 'Quiz sulle operazioni di base',
      isCompleted: false,
      maxScore: 100,
      questions: [
        {
          id: 'q1',
          text: 'Quanto fa 2+2?',
          options: [
            { id: 'opt1', text: '3' },
            { id: 'opt2', text: '4' },
            { id: 'opt3', text: '5' },
            { id: 'opt4', text: '6' }
          ]
        },
        {
          id: 'q2',
          text: 'Quanto fa 5x5?',
          options: [
            { id: 'opt1', text: '20' },
            { id: 'opt2', text: '25' },
            { id: 'opt3', text: '30' },
            { id: 'opt4', text: '35' }
          ]
        }
      ]
    };
    
    // Setup del mock
    mockAxios.onGet(`/api/quiz/${quizId}`).reply(200, mockQuiz);
    
    // Chiamata al metodo da testare
    const result = await QuizService.getQuiz(quizId);
    
    // Verifica del risultato
    expect(result).toEqual(mockQuiz);
    
    // Verifica che sia stata fatta la richiesta giusta
    expect(mockAxios.history.get[0].url).toBe(`/api/quiz/${quizId}`);
    expect(mockAxios.history.get[0].headers.Authorization).toBe('Bearer mock-access-token');
  });
  
  test('submitQuizAnswers dovrebbe inviare le risposte e restituire il risultato', async () => {
    // Dati per il test
    const quizId = '1';
    const submission = {
      quizId: quizId,
      answers: [
        { questionId: 'q1', selectedOptionId: 'opt2', timeSpent: 25 },
        { questionId: 'q2', selectedOptionId: 'opt2', timeSpent: 40 }
      ]
    };
    
    // Mock response data
    const mockResult = {
      quizId: quizId,
      studentId: 'student-1',
      score: 100,
      maxScore: 100,
      completedAt: '2024-03-10T10:30:00Z',
      answers: [
        {
          questionId: 'q1',
          selectedOptionId: 'opt2',
          isCorrect: true,
          points: 50,
          timeSpent: 25
        },
        {
          questionId: 'q2',
          selectedOptionId: 'opt2',
          isCorrect: true,
          points: 50,
          timeSpent: 40
        }
      ]
    };
    
    // Setup del mock
    mockAxios.onPost(`/api/quiz/${quizId}/submit`).reply(200, mockResult);
    
    // Chiamata al metodo da testare
    const result = await QuizService.submitQuiz(submission);
    
    // Verifica del risultato
    expect(result).toEqual(mockResult);
    
    // Verifica che sia stata fatta la richiesta giusta
    expect(mockAxios.history.post[0].url).toBe(`/api/quiz/${quizId}/submit`);
    expect(mockAxios.history.post[0].data).toBe(JSON.stringify(submission));
    expect(mockAxios.history.post[0].headers.Authorization).toBe('Bearer mock-access-token');
    
    // Verifica che sia stata mostrata una notifica di successo
    expect(NotificationsService.showSuccess).toHaveBeenCalledWith('Quiz completato con successo!');
  });
  
  test('getQuizTemplates dovrebbe recuperare i template quiz', async () => {
    // Mock response data
    const mockTemplates = [
      {
        id: 'template-1',
        title: 'Template Matematica',
        description: 'Template per quiz di matematica',
        createdBy: 'admin',
        totalQuestions: 10,
        totalPoints: 100,
        estimatedTime: 30,
        questions: []
      },
      {
        id: 'template-2',
        title: 'Template Italiano',
        description: 'Template per quiz di italiano',
        createdBy: 'admin',
        totalQuestions: 15,
        totalPoints: 150,
        estimatedTime: 45,
        questions: []
      }
    ];
    
    // Setup del mock
    mockAxios.onGet('/api/quiz/templates').reply(200, mockTemplates);
    
    // Chiamata al metodo da testare
    const result = await QuizService.getAllQuizTemplates();
    
    // Verifica del risultato
    expect(result).toEqual(mockTemplates);
    
    // Verifica che sia stata fatta la richiesta giusta
    expect(mockAxios.history.get[0].url).toBe('/api/quiz/templates');
    expect(mockAxios.history.get[0].headers.Authorization).toBe('Bearer mock-access-token');
  });
  
  test('getAssignedQuizzes dovrebbe gestire gli errori e mostrare notifiche', async () => {
    // Setup del mock per errore
    mockAxios.onGet('/api/quiz/assigned').reply(500, { 
      detail: 'Errore interno del server' 
    });
    
    // Chiamata al metodo da testare con cattura dell'errore
    let error;
    try {
      await QuizService.getAssignedQuizzes();
    } catch (e) {
      error = e;
    }
    
    // Verifica che sia stato catturato un errore
    expect(error).toBeDefined();
    
    // Verifica che sia stata mostrata una notifica di errore
    expect(NotificationsService.showError).toHaveBeenCalledWith(
      'Errore nel caricamento dei quiz: Errore interno del server'
    );
  });
});
