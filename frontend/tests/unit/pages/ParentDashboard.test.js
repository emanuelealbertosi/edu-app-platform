import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ParentDashboard from '../../../src/pages/parent/ParentDashboard';
import { AuthContext } from '../../../src/contexts/AuthContext';
import StudentService from '../../../src/services/StudentService';
import PathService from '../../../src/services/PathService';
import RewardService from '../../../src/services/RewardService';
import { NotificationsService } from '../../../src/services/NotificationsService';

// Mock dei servizi
jest.mock('../../../src/services/StudentService');
jest.mock('../../../src/services/PathService');
jest.mock('../../../src/services/RewardService');
jest.mock('../../../src/services/NotificationsService');

// Mock dei componenti di layout
jest.mock('../../../src/components/layout/MainLayout', () => {
  return ({ children, title }) => (
    <div data-testid="main-layout">
      <h1>{title}</h1>
      {children}
    </div>
  );
});

// Mock hook useNavigate di react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock dei componenti di animazione
jest.mock('../../../src/components/animations/LoadingAnimations', () => ({
  LoadingIndicator: ({ text }) => <div data-testid="loading-indicator">{text || 'Loading...'}</div>,
  CardSkeleton: () => <div data-testid="card-skeleton">Loading...</div>
}));

jest.mock('../../../src/components/animations/Transitions', () => ({
  FadeIn: ({ children }) => <div data-testid="fade-in">{children}</div>,
  SlideInUp: ({ children }) => <div data-testid="slide-in-up">{children}</div>
}));

jest.mock('../../../src/components/animations/PageTransitions', () => ({
  AnimatedPage: ({ children }) => <div data-testid="animated-page">{children}</div>,
  AnimatedList: ({ children }) => <div data-testid="animated-list">{children}</div>
}));

describe('ParentDashboard', () => {
  // Dati di test
  const mockUser = {
    id: 'parent-1',
    firstName: 'Lucia',
    lastName: 'Bianchi',
    email: 'lucia.bianchi@example.com',
    role: 'parent'
  };
  
  const mockStudents = [
    {
      id: 'student-1',
      firstName: 'Marco',
      lastName: 'Bianchi',
      grade: '3',
      avatarUrl: 'avatar1.jpg',
      birthDate: '2015-05-10',
      totalPoints: 350,
      activePaths: 2
    },
    {
      id: 'student-2',
      firstName: 'Sara',
      lastName: 'Bianchi',
      grade: '5',
      avatarUrl: 'avatar2.jpg',
      birthDate: '2013-09-22',
      totalPoints: 520,
      activePaths: 3
    }
  ];
  
  const mockPathTemplates = [
    {
      id: 'path-1',
      title: 'Matematica Avanzata',
      description: 'Percorso avanzato di matematica',
      difficulty: 'avanzato',
      estimatedDuration: '4 settimane',
      targetAge: '9-10 anni',
      imageUrl: 'math.jpg'
    },
    {
      id: 'path-2',
      title: 'Scienze Base',
      description: 'Percorso base di scienze',
      difficulty: 'base',
      estimatedDuration: '3 settimane',
      targetAge: '8-9 anni',
      imageUrl: 'science.jpg'
    }
  ];
  
  const mockRewardTemplates = [
    {
      id: 'reward-1',
      title: 'Giornata al Parco',
      description: 'Una giornata al parco divertimenti',
      pointsCost: 500,
      imageUrl: 'park.jpg'
    },
    {
      id: 'reward-2',
      title: 'Film a scelta',
      description: 'Scegliere un film da guardare in famiglia',
      pointsCost: 200,
      imageUrl: 'movie.jpg'
    }
  ];
  
  const mockPendingRewards = [
    {
      id: 'pending-1',
      studentId: 'student-1',
      studentName: 'Marco Bianchi',
      rewardId: 'reward-1',
      rewardTitle: 'Giornata al Parco',
      pointsCost: 500,
      requestDate: '2025-03-10T14:30:00Z'
    }
  ];
  
  const mockRecentActivities = [
    {
      id: 'activity-1',
      studentId: 'student-1',
      studentName: 'Marco Bianchi',
      type: 'quiz_completed',
      description: 'Quiz di matematica completato',
      date: '2025-03-11T10:15:00Z',
      resourceId: 'quiz-1',
      resourceTitle: 'Quiz matematica',
      points: 50
    },
    {
      id: 'activity-2',
      studentId: 'student-2',
      studentName: 'Sara Bianchi',
      type: 'reward_redeemed',
      description: 'Ricompensa richiesta',
      date: '2025-03-10T16:45:00Z',
      resourceId: 'reward-2',
      resourceTitle: 'Film a scelta',
      points: -200
    }
  ];
  
  // Setup dei mock prima di ogni test
  beforeEach(() => {
    StudentService.getStudentsByParent.mockResolvedValue(mockStudents);
    PathService.getAllPathTemplates.mockResolvedValue(mockPathTemplates);
    RewardService.getRewardTemplates.mockResolvedValue(mockRewardTemplates);
    RewardService.getPendingRewards.mockResolvedValue(mockPendingRewards);
    StudentService.getAllStudentActivities.mockResolvedValue(mockRecentActivities);
    
    RewardService.approveReward.mockResolvedValue({});
    RewardService.rejectReward.mockResolvedValue({});
    
    NotificationsService.success.mockImplementation(() => {});
  });
  
  // Pulizia dopo ogni test
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('dovrebbe mostrare i dati degli studenti, dei percorsi e delle ricompense', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser, isAuthenticated: true }}>
          <ParentDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    // Verifica che i servizi siano stati chiamati
    expect(StudentService.getStudentsByParent).toHaveBeenCalled();
    expect(PathService.getAllPathTemplates).toHaveBeenCalled();
    expect(RewardService.getRewardTemplates).toHaveBeenCalled();
    expect(RewardService.getPendingRewards).toHaveBeenCalled();
    expect(StudentService.getAllStudentActivities).toHaveBeenCalled();
    
    // Verifica che i dati siano visualizzati dopo il caricamento
    await waitFor(() => {
      // Studenti
      expect(screen.getByText('Marco Bianchi')).toBeInTheDocument();
      expect(screen.getByText('Sara Bianchi')).toBeInTheDocument();
      
      // Percorsi
      expect(screen.getByText('Matematica Avanzata')).toBeInTheDocument();
      expect(screen.getByText('Scienze Base')).toBeInTheDocument();
      
      // Ricompense
      expect(screen.getByText('Giornata al Parco')).toBeInTheDocument();
      expect(screen.getByText('Film a scelta')).toBeInTheDocument();
      
      // Ricompense in attesa
      expect(screen.getByText(/Marco Bianchi ha richiesto/)).toBeInTheDocument();
      
      // Attività recenti
      expect(screen.getByText(/Quiz di matematica completato/)).toBeInTheDocument();
      expect(screen.getByText(/Ricompensa richiesta/)).toBeInTheDocument();
    });
  });
  
  test('dovrebbe mostrare gli indicatori di caricamento mentre i dati vengono caricati', () => {
    // Imposta tutti i servizi per non risolvere immediatamente
    StudentService.getStudentsByParent.mockReturnValue(new Promise(resolve => {}));
    PathService.getAllPathTemplates.mockReturnValue(new Promise(resolve => {}));
    RewardService.getRewardTemplates.mockReturnValue(new Promise(resolve => {}));
    RewardService.getPendingRewards.mockReturnValue(new Promise(resolve => {}));
    StudentService.getAllStudentActivities.mockReturnValue(new Promise(resolve => {}));
    
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser, isAuthenticated: true }}>
          <ParentDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    // Verifica che vengano mostrati gli indicatori di caricamento
    const loadingIndicators = screen.getAllByTestId('loading-indicator');
    expect(loadingIndicators.length).toBeGreaterThan(0);
  });
  
  test('dovrebbe navigare alla pagina di dettaglio dello studente quando si clicca su Visualizza', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser, isAuthenticated: true }}>
          <ParentDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    // Attendi che i dati siano caricati
    await waitFor(() => {
      expect(screen.getByText('Marco Bianchi')).toBeInTheDocument();
    });
    
    // Trova e clicca sul pulsante Visualizza per il primo studente
    const viewButtons = screen.getAllByText('Visualizza');
    fireEvent.click(viewButtons[0]);
    
    // Verifica che la navigazione sia stata chiamata con il percorso corretto
    expect(mockNavigate).toHaveBeenCalledWith(`/parent/student/${mockStudents[0].id}`);
  });
  
  test('dovrebbe poter approvare una ricompensa in attesa', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser, isAuthenticated: true }}>
          <ParentDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    // Attendi che i dati siano caricati
    await waitFor(() => {
      expect(screen.getByText(/Marco Bianchi ha richiesto/)).toBeInTheDocument();
    });
    
    // Trova e clicca sul pulsante Approva
    const approveButton = screen.getByText('Approva');
    fireEvent.click(approveButton);
    
    // Verifica che il servizio sia stato chiamato con l'ID corretto
    expect(RewardService.approveReward).toHaveBeenCalledWith('pending-1');
    
    // Verifica che la notifica di successo sia stata mostrata
    await waitFor(() => {
      expect(NotificationsService.success).toHaveBeenCalledWith('Ricompensa approvata con successo');
    });
  });
  
  test('dovrebbe poter rifiutare una ricompensa in attesa', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser, isAuthenticated: true }}>
          <ParentDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    // Attendi che i dati siano caricati
    await waitFor(() => {
      expect(screen.getByText(/Marco Bianchi ha richiesto/)).toBeInTheDocument();
    });
    
    // Trova e clicca sul pulsante Rifiuta
    const rejectButton = screen.getByText('Rifiuta');
    fireEvent.click(rejectButton);
    
    // Verifica che il servizio sia stato chiamato con l'ID corretto
    expect(RewardService.rejectReward).toHaveBeenCalledWith('pending-1');
    
    // Verifica che la notifica di successo sia stata mostrata
    await waitFor(() => {
      expect(NotificationsService.success).toHaveBeenCalledWith('Ricompensa rifiutata');
    });
  });
  
  test('dovrebbe gestire gli errori nel caricamento dei dati', async () => {
    // Simula un errore nel caricamento degli studenti
    const errorMessage = 'Errore di connessione';
    StudentService.getStudentsByParent.mockRejectedValue(new Error(errorMessage));
    
    // Spia console.error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser, isAuthenticated: true }}>
          <ParentDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    // Verifica che l'errore sia stato loggato
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Errore nel recupero degli studenti:',
        expect.any(Error)
      );
    });
    
    consoleSpy.mockRestore();
  });
});
