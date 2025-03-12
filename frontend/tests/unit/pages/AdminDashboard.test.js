import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminDashboard from '../../../src/pages/admin/AdminDashboard';
import { AuthContext } from '../../../src/contexts/AuthContext';
import UserService from '../../../src/services/UserService';
import PathService from '../../../src/services/PathService';
import QuizService from '../../../src/services/QuizService';
import { NotificationsService } from '../../../src/services/NotificationsService';

// Mock dei servizi
jest.mock('../../../src/services/UserService');
jest.mock('../../../src/services/PathService');
jest.mock('../../../src/services/QuizService');
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

describe('AdminDashboard', () => {
  // Dati di test
  const mockUser = {
    id: 'admin-1',
    firstName: 'Mario',
    lastName: 'Verdi',
    email: 'mario.verdi@example.com',
    role: 'admin'
  };
  
  const mockUsers = [
    {
      id: 'user-1',
      firstName: 'Lucia',
      lastName: 'Bianchi',
      email: 'lucia.bianchi@example.com',
      role: 'parent',
      lastLogin: '2025-03-10T14:30:00Z',
      createdAt: '2024-11-15T10:20:00Z',
      isActive: true
    },
    {
      id: 'user-2',
      firstName: 'Marco',
      lastName: 'Rossi',
      email: 'marco.rossi@example.com',
      role: 'student',
      lastLogin: '2025-03-11T09:15:00Z',
      createdAt: '2024-11-20T14:30:00Z',
      isActive: true
    },
    {
      id: 'user-3',
      firstName: 'Laura',
      lastName: 'Neri',
      email: 'laura.neri@example.com',
      role: 'admin',
      lastLogin: '2025-03-12T08:45:00Z',
      createdAt: '2024-10-05T11:00:00Z',
      isActive: true
    }
  ];
  
  const mockQuizTemplates = [
    {
      id: 'quiz-1',
      title: 'Quiz Matematica',
      description: 'Quiz sulla matematica base',
      questions: 10,
      difficulty: 'intermedio',
      createdAt: '2025-01-10T10:00:00Z',
      lastUpdated: '2025-02-15T14:30:00Z',
      subject: 'Matematica'
    },
    {
      id: 'quiz-2',
      title: 'Quiz Scienze',
      description: 'Quiz sulle scienze naturali',
      questions: 15,
      difficulty: 'avanzato',
      createdAt: '2025-01-15T11:20:00Z',
      lastUpdated: '2025-02-20T15:40:00Z',
      subject: 'Scienze'
    }
  ];
  
  const mockPathTemplates = [
    {
      id: 'path-1',
      title: 'Percorso Matematica',
      description: 'Percorso completo di matematica',
      difficulty: 'intermedio',
      estimatedDuration: '4 settimane',
      createdAt: '2025-01-05T09:30:00Z',
      lastUpdated: '2025-02-10T13:15:00Z',
      status: 'attivo'
    },
    {
      id: 'path-2',
      title: 'Percorso Scienze',
      description: 'Percorso completo di scienze',
      difficulty: 'base',
      estimatedDuration: '3 settimane',
      createdAt: '2025-01-10T10:45:00Z',
      lastUpdated: '2025-02-12T16:20:00Z',
      status: 'attivo'
    }
  ];
  
  const mockSystemStats = {
    totalUsers: 150,
    activeStudents: 100,
    activeParents: 45,
    completedPaths: 80,
    totalPaths: 120,
    completedQuizzes: 500,
    totalQuizzes: 800,
    redeemedRewards: 200,
    totalRewards: 250
  };
  
  const mockRecentActivities = [
    {
      id: 'activity-1',
      userId: 'user-2',
      userName: 'Marco Rossi',
      userRole: 'student',
      action: 'quiz_completed',
      description: 'Quiz completato',
      resourceId: 'quiz-1',
      resourceName: 'Quiz Matematica',
      timestamp: '2025-03-11T15:30:00Z'
    },
    {
      id: 'activity-2',
      userId: 'user-1',
      userName: 'Lucia Bianchi',
      userRole: 'parent',
      action: 'reward_approved',
      description: 'Ricompensa approvata',
      resourceId: 'reward-1',
      resourceName: 'Giornata al Parco',
      timestamp: '2025-03-11T14:45:00Z'
    }
  ];
  
  // Setup dei mock prima di ogni test
  beforeEach(() => {
    UserService.getAllUsers.mockResolvedValue(mockUsers);
    QuizService.getAllQuizTemplates.mockResolvedValue(mockQuizTemplates);
    PathService.getAllPathTemplates.mockResolvedValue(mockPathTemplates);
    UserService.getSystemStats.mockResolvedValue(mockSystemStats);
    UserService.getRecentAdminActivities.mockResolvedValue(mockRecentActivities);
  });
  
  // Pulizia dopo ogni test
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('dovrebbe mostrare il titolo e le informazioni di benvenuto', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser, isAuthenticated: true }}>
          <AdminDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    // Verifica che il titolo della pagina sia corretto
    expect(screen.getByText('Dashboard Admin')).toBeInTheDocument();
    
    // Attendi che il messaggio di benvenuto con il nome dell'admin sia visualizzato
    await waitFor(() => {
      expect(screen.getByText(/Benvenuto, Mario/)).toBeInTheDocument();
    });
  });
  
  test('dovrebbe caricare e visualizzare le statistiche di sistema', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser, isAuthenticated: true }}>
          <AdminDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    // Verifica che i servizi siano stati chiamati
    expect(UserService.getSystemStats).toHaveBeenCalled();
    
    // Verifica che le statistiche siano visualizzate
    await waitFor(() => {
      expect(screen.getByText('Utenti totali')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      
      expect(screen.getByText('Studenti attivi')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      
      expect(screen.getByText('Quiz completati')).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument();
    });
  });
  
  test('dovrebbe caricare e visualizzare la lista degli utenti', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser, isAuthenticated: true }}>
          <AdminDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    // Verifica che il servizio sia stato chiamato
    expect(UserService.getAllUsers).toHaveBeenCalled();
    
    // Verifica che gli utenti siano visualizzati
    await waitFor(() => {
      expect(screen.getByText('Lucia Bianchi')).toBeInTheDocument();
      expect(screen.getByText('Marco Rossi')).toBeInTheDocument();
      expect(screen.getByText('Laura Neri')).toBeInTheDocument();
      
      // Verifica che i ruoli siano visualizzati
      expect(screen.getByText('parent')).toBeInTheDocument();
      expect(screen.getByText('student')).toBeInTheDocument();
      expect(screen.getByText('admin')).toBeInTheDocument();
    });
  });
  
  test('dovrebbe caricare e visualizzare la lista dei quiz e dei percorsi', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser, isAuthenticated: true }}>
          <AdminDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    // Verifica che i servizi siano stati chiamati
    expect(QuizService.getAllQuizTemplates).toHaveBeenCalled();
    expect(PathService.getAllPathTemplates).toHaveBeenCalled();
    
    // Verifica che i quiz siano visualizzati
    await waitFor(() => {
      expect(screen.getByText('Quiz Matematica')).toBeInTheDocument();
      expect(screen.getByText('Quiz Scienze')).toBeInTheDocument();
      
      // Verifica che i percorsi siano visualizzati
      expect(screen.getByText('Percorso Matematica')).toBeInTheDocument();
      expect(screen.getByText('Percorso Scienze')).toBeInTheDocument();
    });
  });
  
  test('dovrebbe mostrare le attività recenti', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser, isAuthenticated: true }}>
          <AdminDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    // Verifica che il servizio sia stato chiamato
    expect(UserService.getRecentAdminActivities).toHaveBeenCalled();
    
    // Verifica che le attività recenti siano visualizzate
    await waitFor(() => {
      expect(screen.getByText(/Marco Rossi/)).toBeInTheDocument();
      expect(screen.getByText(/Quiz completato/)).toBeInTheDocument();
      expect(screen.getByText(/Lucia Bianchi/)).toBeInTheDocument();
      expect(screen.getByText(/Ricompensa approvata/)).toBeInTheDocument();
    });
  });
  
  test('dovrebbe mostrare gli indicatori di caricamento durante il caricamento dei dati', () => {
    // Modifica i mock per non risolvere immediatamente
    UserService.getAllUsers.mockReturnValue(new Promise(resolve => {}));
    QuizService.getAllQuizTemplates.mockReturnValue(new Promise(resolve => {}));
    PathService.getAllPathTemplates.mockReturnValue(new Promise(resolve => {}));
    UserService.getSystemStats.mockReturnValue(new Promise(resolve => {}));
    UserService.getRecentAdminActivities.mockReturnValue(new Promise(resolve => {}));
    
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser, isAuthenticated: true }}>
          <AdminDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    // Verifica che gli indicatori di caricamento siano visualizzati
    const loadingIndicators = screen.getAllByTestId('loading-indicator');
    expect(loadingIndicators.length).toBeGreaterThan(0);
  });
  
  test('dovrebbe gestire gli errori nel caricamento dei dati', async () => {
    // Simula un errore nel caricamento degli utenti
    const errorMessage = 'Errore di rete';
    UserService.getAllUsers.mockRejectedValue(new Error(errorMessage));
    
    // Spia console.error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser, isAuthenticated: true }}>
          <AdminDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    // Verifica che l'errore sia stato loggato
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Errore nel recupero degli utenti:',
        expect.any(Error)
      );
    });
    
    consoleSpy.mockRestore();
  });
  
  test('dovrebbe navigare alle pagine di dettaglio quando si clicca sui pulsanti Visualizza', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser, isAuthenticated: true }}>
          <AdminDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    // Attendi che i dati siano caricati
    await waitFor(() => {
      expect(screen.getByText('Lucia Bianchi')).toBeInTheDocument();
    });
    
    // Trova e clicca sui pulsanti Visualizza per le diverse sezioni
    const viewButtons = screen.getAllByText('Visualizza');
    
    // Clicca sul primo pulsante Visualizza (potrebbe essere per un utente)
    fireEvent.click(viewButtons[0]);
    
    // Verifica che la navigazione sia stata chiamata (la destinazione esatta dipende dall'implementazione)
    expect(mockNavigate).toHaveBeenCalled();
  });
});
