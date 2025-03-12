import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { act } from 'react-dom/test-utils';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

// Importazione dei componenti
import StudentDashboard from '../../../src/components/student/StudentDashboard';
import TakeQuiz from '../../../src/components/student/TakeQuiz';
import RewardShop from '../../../src/components/student/RewardShop';
import { NotificationsProvider } from '../../../src/contexts/NotificationsContext';
import { AuthProvider } from '../../../src/contexts/AuthContext';
import { NotificationsService } from '../../../src/services/NotificationsService';

// Mock di NotificationsService
jest.mock('../../../src/services/NotificationsService', () => ({
  NotificationsService: {
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showInfo: jest.fn(),
    showWarning: jest.fn(),
  }
}));

// Mock del hook useParams per TakeQuiz
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({
    quizId: '1',
    pathId: '1'
  }),
}));

describe('Flusso Studente: Completamento Quiz e Acquisto Ricompense', () => {
  let mockAxios;
  
  // Dati di test per simulare le risposte del backend
  const mockUser = {
    id: 3,
    email: 'student@example.com',
    full_name: 'Student User',
    role: 'student'
  };
  
  const mockAssignedQuizzes = [
    {
      id: 1,
      title: 'Quiz di Matematica',
      description: 'Quiz sulle operazioni base',
      is_completed: false,
      quiz_template_id: 10,
      assigned_date: '2025-03-10T10:00:00Z',
      due_date: '2025-03-15T23:59:59Z',
      max_score: 100
    }
  ];
  
  const mockQuizWithQuestions = {
    id: 1,
    title: 'Quiz di Matematica',
    description: 'Quiz sulle operazioni base',
    quiz_template_id: 10,
    questions: [
      {
        id: 101,
        text: 'Quanto fa 2 + 2?',
        question_type: 'multiple_choice',
        options: [
          { id: 1001, text: '3', is_correct: false },
          { id: 1002, text: '4', is_correct: true },
          { id: 1003, text: '5', is_correct: false },
          { id: 1004, text: '22', is_correct: false }
        ]
      },
      {
        id: 102,
        text: 'Quanto fa 10 - 5?',
        question_type: 'multiple_choice',
        options: [
          { id: 1005, text: '4', is_correct: false },
          { id: 1006, text: '5', is_correct: true },
          { id: 1007, text: '6', is_correct: false },
          { id: 1008, text: '15', is_correct: false }
        ]
      }
    ]
  };
  
  const mockSubmissionResult = {
    quiz_id: 1,
    completed: true,
    score: 100,
    max_score: 100,
    correct_answers: 2,
    total_questions: 2,
    points_earned: 100,
    message: 'Quiz completato con successo! Hai guadagnato 100 punti.'
  };
  
  const mockPointsBeforeQuiz = {
    student_id: 3,
    points_balance: 750,
    total_earned: 1100,
    total_spent: 350
  };
  
  const mockPointsAfterQuiz = {
    student_id: 3,
    points_balance: 850,
    total_earned: 1200,
    total_spent: 350
  };
  
  const mockRewards = [
    {
      id: 1,
      title: 'Giornata al Parco',
      description: 'Una giornata divertente al parco',
      cost: 500,
      category: 'Attività',
      image_url: 'https://example.com/park.jpg',
      status: 'available'
    },
    {
      id: 2,
      title: 'Film a Scelta',
      description: 'Visione di un film a scelta',
      cost: 300,
      category: 'Intrattenimento',
      image_url: 'https://example.com/movie.jpg',
      status: 'available'
    }
  ];
  
  const mockPurchaseResult = {
    purchase_id: 101,
    reward_id: 2,
    student_id: 3,
    purchase_date: '2025-03-12T10:20:00Z',
    status: 'pending_approval',
    points_spent: 300,
    new_balance: 550,
    message: 'Ricompensa acquistata con successo! In attesa di approvazione.'
  };
  
  beforeEach(() => {
    // Configurazione del mock per axios
    mockAxios = new MockAdapter(axios);
    
    // Simuliamo l'utente autenticato
    localStorage.setItem('accessToken', 'mock-access-token');
    localStorage.setItem('user', JSON.stringify(mockUser));
    
    // Reset delle chiamate mock
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    // Pulizia dopo ogni test
    mockAxios.restore();
    localStorage.clear();
  });
  
  test('dovrebbe simulare un flusso completo di completamento quiz e acquisto ricompensa', async () => {
    // FASE 1: Dashboard Studente - Visualizzazione dei quiz assegnati
    
    // Mock delle risposte del backend per la dashboard
    mockAxios.onGet('/api/quizzes/assigned').reply(200, mockAssignedQuizzes);
    mockAxios.onGet('/api/paths/assigned').reply(200, []);
    mockAxios.onGet('/api/rewards/student/points').reply(200, mockPointsBeforeQuiz);
    
    // Rendering della dashboard
    const { unmount } = render(
      <BrowserRouter>
        <AuthProvider>
          <NotificationsProvider>
            <StudentDashboard />
          </NotificationsProvider>
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Verifichiamo che il quiz sia visualizzato nella dashboard
    await waitFor(() => {
      expect(screen.getByText('Quiz di Matematica')).toBeInTheDocument();
      expect(screen.getByText('Non completato')).toBeInTheDocument();
    });
    
    // Verifichiamo che il saldo punti iniziale sia visualizzato
    await waitFor(() => {
      expect(screen.getByText('750')).toBeInTheDocument();
    });
    
    // Cleanup
    unmount();
    
    // FASE 2: Svolgimento del Quiz - TakeQuiz
    
    // Mock delle risposte del backend per il quiz
    mockAxios.onGet('/api/quizzes/1').reply(200, mockQuizWithQuestions);
    mockAxios.onPost('/api/quizzes/1/submit').reply(200, mockSubmissionResult);
    mockAxios.onPut('/api/paths/1/nodes/1/progress').reply(200, { success: true });
    
    // Rendering del componente TakeQuiz
    const { unmount: unmountTakeQuiz } = render(
      <BrowserRouter>
        <AuthProvider>
          <NotificationsProvider>
            <TakeQuiz />
          </NotificationsProvider>
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Attendiamo che le domande del quiz vengano caricate
    await waitFor(() => {
      expect(screen.getByText('Quanto fa 2 + 2?')).toBeInTheDocument();
    });
    
    // Rispondiamo alla prima domanda
    const opzione4 = screen.getByLabelText('4');
    await act(async () => {
      fireEvent.click(opzione4);
    });
    
    // Passiamo alla domanda successiva
    const btnAvanti = screen.getByText('Avanti');
    await act(async () => {
      fireEvent.click(btnAvanti);
    });
    
    // Verifichiamo che la seconda domanda sia visualizzata
    await waitFor(() => {
      expect(screen.getByText('Quanto fa 10 - 5?')).toBeInTheDocument();
    });
    
    // Rispondiamo alla seconda domanda
    const opzione5 = screen.getByLabelText('5');
    await act(async () => {
      fireEvent.click(opzione5);
    });
    
    // Inviamo il quiz
    const btnInvia = screen.getByText('Invia');
    await act(async () => {
      fireEvent.click(btnInvia);
    });
    
    // Verifichiamo che sia stata mostrata la notifica di successo
    await waitFor(() => {
      expect(NotificationsService.showSuccess).toHaveBeenCalledWith('Quiz completato con successo! Hai guadagnato 100 punti.');
    });
    
    // Cleanup
    unmountTakeQuiz();
    
    // FASE 3: Shop Ricompense - Acquisto di una ricompensa con i punti guadagnati
    
    // Mock delle risposte del backend per lo shop
    mockAxios.onGet('/api/rewards/student').reply(200, mockRewards);
    mockAxios.onGet('/api/rewards/student/points').reply(200, mockPointsAfterQuiz);
    mockAxios.onGet('/api/rewards/student/purchases').reply(200, []);
    mockAxios.onPost('/api/rewards/2/purchase').reply(200, mockPurchaseResult);
    
    // Rendering del componente RewardShop
    const { unmount: unmountRewardShop } = render(
      <BrowserRouter>
        <AuthProvider>
          <NotificationsProvider>
            <RewardShop />
          </NotificationsProvider>
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Attendiamo che le ricompense vengano caricate
    await waitFor(() => {
      expect(screen.getByText('Giornata al Parco')).toBeInTheDocument();
      expect(screen.getByText('Film a Scelta')).toBeInTheDocument();
    });
    
    // Verifichiamo che il saldo punti aggiornato sia visualizzato
    await waitFor(() => {
      expect(screen.getByText('850')).toBeInTheDocument();
    });
    
    // Troviamo il pulsante di acquisto per "Film a Scelta" e lo clicchiamo
    const buttons = screen.getAllByText('Acquista');
    const filmRewardButton = buttons[1]; // Il secondo pulsante Acquista (per Film a Scelta)
    await act(async () => {
      fireEvent.click(filmRewardButton);
    });
    
    // Verifichiamo che appaia la finestra di conferma
    await waitFor(() => {
      expect(screen.getByText(/Conferma Acquisto/i)).toBeInTheDocument();
      expect(screen.getByText(/Film a Scelta/i)).toBeInTheDocument();
      expect(screen.getByText(/300 punti/i)).toBeInTheDocument();
    });
    
    // Confermiamo l'acquisto
    const confirmButton = screen.getByText('Conferma');
    await act(async () => {
      fireEvent.click(confirmButton);
    });
    
    // Verifichiamo che sia stata mostrata la notifica di acquisto completato
    await waitFor(() => {
      expect(NotificationsService.showSuccess).toHaveBeenCalledWith('Ricompensa acquistata con successo! In attesa di approvazione.');
    });
    
    // Cleanup
    unmountRewardShop();
  });
});
