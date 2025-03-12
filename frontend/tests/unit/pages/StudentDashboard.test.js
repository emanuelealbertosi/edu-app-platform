import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import StudentDashboard from '../../../src/pages/student/StudentDashboard';
import { AuthContext } from '../../../src/contexts/AuthContext';
import PathService from '../../../src/services/PathService';
import QuizService from '../../../src/services/QuizService';
import RewardService from '../../../src/services/RewardService';

// Mock dei servizi
jest.mock('../../../src/services/PathService');
jest.mock('../../../src/services/QuizService');
jest.mock('../../../src/services/RewardService');

// Mock dei componenti di layout
jest.mock('../../../src/components/layout/MainLayout', () => {
  return ({ children, title }) => (
    <div data-testid="main-layout">
      <h1>{title}</h1>
      {children}
    </div>
  );
});

// Mock dei componenti di animazione
jest.mock('../../../src/components/animations/Transitions', () => ({
  FadeIn: ({ children }) => <div data-testid="fade-in">{children}</div>,
  SlideInUp: ({ children, delay }) => <div data-testid="slide-in-up">{children}</div>,
  SlideInLeft: ({ children, delay }) => <div data-testid="slide-in-left">{children}</div>,
  SlideInRight: ({ children, delay }) => <div data-testid="slide-in-right">{children}</div>,
  HoverAnimation: ({ children, scale }) => <div data-testid="hover-animation">{children}</div>
}));

jest.mock('../../../src/components/animations/LoadingAnimations', () => ({
  LoadingIndicator: ({ text, color }) => <div data-testid="loading-indicator">{text}</div>,
  ProgressBar: ({ value, color }) => <div data-testid="progress-bar">Progress: {value}%</div>,
  CardSkeleton: () => <div data-testid="card-skeleton">Loading...</div>
}));

jest.mock('../../../src/components/animations/PageTransitions', () => ({
  AnimatedPage: ({ children, transitionType }) => <div data-testid="animated-page">{children}</div>,
  AnimatedList: ({ children, staggerDelay }) => <div data-testid="animated-list">{children}</div>
}));

describe('StudentDashboard', () => {
  // Dati di test
  const mockUser = {
    id: 'student-1',
    firstName: 'Mario',
    lastName: 'Rossi',
    email: 'mario.rossi@example.com',
    role: 'student'
  };
  
  const mockPaths = [
    { 
      id: 'path-1', 
      title: 'Matematica Base', 
      description: 'Corso di matematica base', 
      progress: 75,
      targetEndDate: '2025-04-15T12:00:00Z'
    },
    { 
      id: 'path-2', 
      title: 'Scienze', 
      description: 'Corso di scienze', 
      progress: 30,
      targetEndDate: '2025-05-20T12:00:00Z'
    }
  ];
  
  const mockQuizzes = [
    { 
      id: 'quiz-1', 
      title: 'Quiz matematica', 
      templateId: 'path-1',
      isCompleted: true 
    },
    { 
      id: 'quiz-2', 
      title: 'Quiz scienze', 
      templateId: 'path-2', 
      isCompleted: false 
    }
  ];
  
  const mockRewards = [
    { 
      id: 'reward-1', 
      title: 'Premio 1', 
      description: 'Descrizione premio 1', 
      pointsCost: 100,
      imageUrl: 'reward1.jpg'
    },
    { 
      id: 'reward-2', 
      title: 'Premio 2', 
      description: 'Descrizione premio 2', 
      pointsCost: 200,
      imageUrl: 'reward2.jpg'
    }
  ];
  
  const mockRedeemedRewards = [
    { 
      id: 'reward-3', 
      title: 'Premio riscattato', 
      description: 'Descrizione premio riscattato', 
      pointsCost: 50,
      imageUrl: 'reward3.jpg',
      status: 'riscattato'
    }
  ];
  
  const mockRewardStats = {
    availablePoints: 500,
    earnedPoints: 700,
    usedPoints: 200
  };
  
  // Setup dei mock prima di ogni test
  beforeEach(() => {
    PathService.getAssignedPaths.mockResolvedValue(mockPaths);
    QuizService.getAssignedQuizzes.mockResolvedValue(mockQuizzes);
    RewardService.getAvailableRewards.mockResolvedValue(mockRewards);
    RewardService.getRedeemedRewards.mockResolvedValue(mockRedeemedRewards);
    RewardService.getStudentRewardStats.mockResolvedValue(mockRewardStats);
  });
  
  // Pulizia dopo ogni test
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('dovrebbe mostrare messaggio di benvenuto con il nome dello studente', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser, isAuthenticated: true }}>
          <StudentDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    // Verifica che il titolo della pagina sia corretto
    expect(screen.getByText('Dashboard Studente')).toBeInTheDocument();
    
    // Attendi che il messaggio di benvenuto con il nome dello studente sia visualizzato
    await waitFor(() => {
      expect(screen.getByText(/Benvenuto, Mario/)).toBeInTheDocument();
    });
  });
  
  test('dovrebbe caricare e visualizzare percorsi, quiz e ricompense', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser, isAuthenticated: true }}>
          <StudentDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    // Verifica che i servizi siano stati chiamati
    expect(PathService.getAssignedPaths).toHaveBeenCalled();
    expect(QuizService.getAssignedQuizzes).toHaveBeenCalled();
    expect(RewardService.getAvailableRewards).toHaveBeenCalled();
    expect(RewardService.getRedeemedRewards).toHaveBeenCalled();
    expect(RewardService.getStudentRewardStats).toHaveBeenCalledWith(mockUser.id);
    
    // Verifica che i dati siano visualizzati
    await waitFor(() => {
      // Percorsi
      expect(screen.getByText('Matematica Base')).toBeInTheDocument();
      expect(screen.getByText('Scienze')).toBeInTheDocument();
      
      // Quiz
      expect(screen.getByText('Quiz matematica')).toBeInTheDocument();
      expect(screen.getByText('Quiz scienze')).toBeInTheDocument();
      
      // Ricompense
      expect(screen.getByText('Premio 1')).toBeInTheDocument();
      expect(screen.getByText('Premio 2')).toBeInTheDocument();
      expect(screen.getByText('Premio riscattato')).toBeInTheDocument();
      
      // Punti
      expect(screen.getByText('500')).toBeInTheDocument();
    });
  });
  
  test('dovrebbe mostrare gli indicatori di caricamento quando i dati vengono caricati', () => {
    // Modifica i mock per ritardare la risoluzione delle Promise
    PathService.getAssignedPaths.mockReturnValue(new Promise(resolve => {}));
    QuizService.getAssignedQuizzes.mockReturnValue(new Promise(resolve => {}));
    RewardService.getAvailableRewards.mockReturnValue(new Promise(resolve => {}));
    RewardService.getRedeemedRewards.mockReturnValue(new Promise(resolve => {}));
    RewardService.getStudentRewardStats.mockReturnValue(new Promise(resolve => {}));
    
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser, isAuthenticated: true }}>
          <StudentDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    // Verifica che gli indicatori di caricamento siano visualizzati
    const loadingIndicators = screen.getAllByTestId('loading-indicator');
    expect(loadingIndicators.length).toBeGreaterThan(0);
    
    // Verifica che uno degli indicatori contenga il testo relativo ai punti
    expect(screen.getByText('Caricamento punti...')).toBeInTheDocument();
  });
  
  test('dovrebbe gestire errori nel caricamento dei dati', async () => {
    // Simula un errore nel caricamento dei percorsi
    const errorMessage = 'Errore di rete';
    PathService.getAssignedPaths.mockRejectedValue(new Error(errorMessage));
    
    // Spia console.error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser, isAuthenticated: true }}>
          <StudentDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    // Verifica che l'errore sia stato loggato nella console
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Errore nel caricamento dei dati:',
        expect.any(Error)
      );
    });
    
    consoleSpy.mockRestore();
  });
});
