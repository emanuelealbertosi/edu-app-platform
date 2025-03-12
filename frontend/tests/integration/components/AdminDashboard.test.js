import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminDashboard from '../../../src/components/admin/AdminDashboard';
import UserService from '../../../src/services/UserService';
import QuizService from '../../../src/services/QuizService';
import { NotificationsProvider } from '../../../src/contexts/NotificationsContext';

// Mock dei servizi
jest.mock('../../../src/services/UserService');
jest.mock('../../../src/services/QuizService');

describe('AdminDashboard Integration Tests', () => {
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
  
  const mockQuizTemplates = [
    {
      id: 1,
      title: 'Quiz Matematica Base',
      description: 'Quiz sulle operazioni fondamentali',
      created_by: 'admin@example.com',
      creation_date: '2025-02-01T11:00:00Z',
      question_count: 5,
      max_score: 100,
      assigned_count: 8
    },
    {
      id: 2,
      title: 'Quiz Scienze',
      description: 'Quiz sul sistema solare e pianeti',
      created_by: 'admin@example.com',
      creation_date: '2025-02-10T15:45:00Z',
      question_count: 8,
      max_score: 80,
      assigned_count: 6
    }
  ];
  
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
    // Configurazione mock dei servizi
    UserService.getUsers.mockResolvedValue(mockUsers);
    QuizService.getQuizTemplates.mockResolvedValue(mockQuizTemplates);
    UserService.getSystemStats.mockResolvedValue(mockSystemStats);
    
    // Reset delle chiamate mock
    jest.clearAllMocks();
  });
  
  test('dovrebbe caricare e visualizzare correttamente i dati del dashboard admin', async () => {
    // Rendering del componente con i provider necessari
    render(
      <BrowserRouter>
        <NotificationsProvider>
          <AdminDashboard />
        </NotificationsProvider>
      </BrowserRouter>
    );
    
    // Verifica che i servizi siano stati chiamati
    expect(UserService.getUsers).toHaveBeenCalled();
    expect(QuizService.getQuizTemplates).toHaveBeenCalled();
    expect(UserService.getSystemStats).toHaveBeenCalled();
    
    // Attendiamo che i dati vengano caricati e visualizzati
    await waitFor(() => {
      // Verifichiamo che gli utenti siano visualizzati
      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByText('Parent User')).toBeInTheDocument();
      expect(screen.getByText('Student User')).toBeInTheDocument();
      
      // Verifichiamo che i template quiz siano visualizzati
      expect(screen.getByText('Quiz Matematica Base')).toBeInTheDocument();
      expect(screen.getByText('Quiz Scienze')).toBeInTheDocument();
      
      // Verifichiamo che le statistiche di sistema siano visualizzate
      expect(screen.getByText('42')).toBeInTheDocument(); // Total users
      expect(screen.getByText('320')).toBeInTheDocument(); // Total quiz attempts
      expect(screen.getByText('76.5%')).toBeInTheDocument(); // Average score
    });
  });
  
  test('dovrebbe gestire errori nel caricamento dei dati', async () => {
    // Modifichiamo i mock per simulare errori
    UserService.getUsers.mockRejectedValue(new Error('Errore nel caricamento degli utenti'));
    
    // Rendering del componente
    render(
      <BrowserRouter>
        <NotificationsProvider>
          <AdminDashboard />
        </NotificationsProvider>
      </BrowserRouter>
    );
    
    // Verifichiamo che vengano visualizzati i dati disponibili (template e statistiche)
    await waitFor(() => {
      // Verifichiamo che i template quiz siano visualizzati
      expect(screen.getByText('Quiz Matematica Base')).toBeInTheDocument();
      expect(screen.getByText('Quiz Scienze')).toBeInTheDocument();
      
      // Verifichiamo che le statistiche di sistema siano visualizzate
      expect(screen.getByText('42')).toBeInTheDocument(); // Total users
      
      // Verifichiamo che ci sia un messaggio di errore per gli utenti
      expect(screen.getByText(/Nessun utente disponibile/i)).toBeInTheDocument();
    });
  });
  
  test('dovrebbe visualizzare stato di caricamento durante il fetch dei dati', async () => {
    // Modifichiamo i mock per ritardare la risposta
    jest.useFakeTimers();
    UserService.getSystemStats.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve(mockSystemStats), 1000);
      });
    });
    
    // Rendering del componente
    render(
      <BrowserRouter>
        <NotificationsProvider>
          <AdminDashboard />
        </NotificationsProvider>
      </BrowserRouter>
    );
    
    // Verifichiamo che venga mostrato lo stato di caricamento
    expect(screen.getByText(/Caricamento statistiche.../i)).toBeInTheDocument();
    
    // Avanziamo il tempo simulato
    jest.advanceTimersByTime(1100);
    
    // Verifichiamo che i dati vengano visualizzati
    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument(); // Total users
      expect(screen.getByText('320')).toBeInTheDocument(); // Total quiz attempts
    });
    
    jest.useRealTimers();
  });
  
  test('dovrebbe mostrare un sommario delle statistiche del sistema', async () => {
    // Rendering del componente
    render(
      <BrowserRouter>
        <NotificationsProvider>
          <AdminDashboard />
        </NotificationsProvider>
      </BrowserRouter>
    );
    
    // Attendiamo che i dati vengano caricati
    await waitFor(() => {
      // Verifichiamo le statistiche di sistema
      expect(screen.getByText('Utenti totali: 42')).toBeInTheDocument();
      expect(screen.getByText('Admin: 2')).toBeInTheDocument();
      expect(screen.getByText('Genitori: 15')).toBeInTheDocument();
      expect(screen.getByText('Studenti: 25')).toBeInTheDocument();
      expect(screen.getByText('Quiz creati: 15')).toBeInTheDocument();
      expect(screen.getByText('Tentativi quiz: 320')).toBeInTheDocument();
      expect(screen.getByText('Tasso di successo: 85.9%')).toBeInTheDocument();
      expect(screen.getByText('Punteggio medio: 76.5%')).toBeInTheDocument();
      expect(screen.getByText('Sessioni attive: 12')).toBeInTheDocument();
    });
  });
});
