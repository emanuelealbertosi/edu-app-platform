import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import StudentDashboard from '../../../src/components/student/StudentDashboard';
import PathService from '../../../src/services/PathService';
import QuizService from '../../../src/services/QuizService';
import RewardService from '../../../src/services/RewardService';
import { NotificationsProvider } from '../../../src/contexts/NotificationsContext';

// Mock dei servizi
jest.mock('../../../src/services/PathService');
jest.mock('../../../src/services/QuizService');
jest.mock('../../../src/services/RewardService');

describe('StudentDashboard Integration Tests', () => {
  // Dati di test
  const mockPaths = [
    {
      id: 1,
      title: 'Percorso Matematica',
      description: 'Percorso introduttivo alla matematica',
      progress: 65,
      status: 'in_progress',
    },
    {
      id: 2,
      title: 'Percorso Scienze',
      description: 'Studio dei fenomeni naturali',
      progress: 100,
      status: 'completed',
    }
  ];
  
  const mockQuizzes = [
    {
      id: 1,
      title: 'Quiz di Matematica',
      description: 'Operazioni elementari',
      is_completed: false,
      max_score: 100
    },
    {
      id: 2,
      title: 'Quiz di Scienze',
      description: 'Sistema solare',
      is_completed: true,
      max_score: 80,
      achieved_score: 75
    }
  ];
  
  const mockPoints = {
    points_balance: 850,
    total_earned: 1200,
  };
  
  beforeEach(() => {
    // Configurazione mock dei servizi
    PathService.getAssignedPaths.mockResolvedValue(mockPaths);
    QuizService.getAssignedQuizzes.mockResolvedValue(mockQuizzes);
    RewardService.getStudentPoints.mockResolvedValue(mockPoints);
    
    // Reset delle chiamate mock
    jest.clearAllMocks();
  });
  
  test('dovrebbe caricare e visualizzare correttamente i dati del dashboard studente', async () => {
    // Rendering del componente con i provider necessari
    render(
      <BrowserRouter>
        <NotificationsProvider>
          <StudentDashboard />
        </NotificationsProvider>
      </BrowserRouter>
    );
    
    // Verifica che i servizi siano stati chiamati
    expect(PathService.getAssignedPaths).toHaveBeenCalled();
    expect(QuizService.getAssignedQuizzes).toHaveBeenCalled();
    expect(RewardService.getStudentPoints).toHaveBeenCalled();
    
    // Attendiamo che i dati vengano caricati e visualizzati
    await waitFor(() => {
      // Verifichiamo che i percorsi siano visualizzati
      expect(screen.getByText('Percorso Matematica')).toBeInTheDocument();
      expect(screen.getByText('Percorso Scienze')).toBeInTheDocument();
      
      // Verifichiamo che i quiz siano visualizzati
      expect(screen.getByText('Quiz di Matematica')).toBeInTheDocument();
      expect(screen.getByText('Quiz di Scienze')).toBeInTheDocument();
      
      // Verifichiamo che il punteggio sia visualizzato
      expect(screen.getByText('850')).toBeInTheDocument();
    });
  });
  
  test('dovrebbe gestire errori nel caricamento dei dati', async () => {
    // Modifichiamo i mock per simulare errori
    PathService.getAssignedPaths.mockRejectedValue(new Error('Errore nel caricamento dei percorsi'));
    
    // Rendering del componente
    render(
      <BrowserRouter>
        <NotificationsProvider>
          <StudentDashboard />
        </NotificationsProvider>
      </BrowserRouter>
    );
    
    // Verifichiamo che vengano visualizzati i dati disponibili (quiz e punti)
    await waitFor(() => {
      // Verifichiamo che i quiz siano visualizzati
      expect(screen.getByText('Quiz di Matematica')).toBeInTheDocument();
      expect(screen.getByText('Quiz di Scienze')).toBeInTheDocument();
      
      // Verifichiamo che il punteggio sia visualizzato
      expect(screen.getByText('850')).toBeInTheDocument();
      
      // Verifichiamo che ci sia un messaggio di errore per i percorsi
      expect(screen.getByText(/Nessun percorso disponibile/i)).toBeInTheDocument();
    });
  });
  
  test('dovrebbe visualizzare stato di caricamento durante il fetch dei dati', async () => {
    // Modifichiamo i mock per ritardare la risposta
    jest.useFakeTimers();
    PathService.getAssignedPaths.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve(mockPaths), 1000);
      });
    });
    
    // Rendering del componente
    render(
      <BrowserRouter>
        <NotificationsProvider>
          <StudentDashboard />
        </NotificationsProvider>
      </BrowserRouter>
    );
    
    // Verifichiamo che venga mostrato lo stato di caricamento
    expect(screen.getByText(/Caricamento percorsi.../i)).toBeInTheDocument();
    
    // Avanziamo il tempo simulato
    jest.advanceTimersByTime(1100);
    
    // Verifichiamo che i dati vengano visualizzati
    await waitFor(() => {
      expect(screen.getByText('Percorso Matematica')).toBeInTheDocument();
      expect(screen.getByText('Percorso Scienze')).toBeInTheDocument();
    });
    
    jest.useRealTimers();
  });
});
