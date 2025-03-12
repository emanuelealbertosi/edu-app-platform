import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ParentDashboard from '../../../src/components/parent/ParentDashboard';
import PathService from '../../../src/services/PathService';
import StudentService from '../../../src/services/StudentService';
import RewardService from '../../../src/services/RewardService';
import { NotificationsProvider } from '../../../src/contexts/NotificationsContext';

// Mock dei servizi
jest.mock('../../../src/services/PathService');
jest.mock('../../../src/services/StudentService');
jest.mock('../../../src/services/RewardService');

describe('ParentDashboard Integration Tests', () => {
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
  
  const mockPathTemplates = [
    {
      id: 1,
      title: 'Template Matematica Base',
      description: 'Percorso introduttivo alla matematica',
      created_by: 'parent@example.com',
      node_count: 10,
      assigned_count: 5,
      completed_count: 2
    },
    {
      id: 2,
      title: 'Template Scienze',
      description: 'Studio dei fenomeni naturali',
      created_by: 'parent@example.com',
      node_count: 8,
      assigned_count: 3,
      completed_count: 1
    }
  ];
  
  const mockRewardTemplates = [
    {
      id: 1,
      title: 'Template Giornata al Parco',
      description: 'Una giornata divertente al parco',
      cost: 500,
      category_name: 'Attività',
      creation_date: '2025-02-15T10:00:00Z',
      assigned_count: 4
    },
    {
      id: 2,
      title: 'Template Film a Scelta',
      description: 'Visione di un film a scelta',
      cost: 300,
      category_name: 'Intrattenimento',
      creation_date: '2025-02-20T14:30:00Z',
      assigned_count: 6
    }
  ];
  
  const mockPendingApprovals = [
    {
      purchase_id: 101,
      reward_id: 2,
      student_id: 1,
      student_name: 'Mario Rossi',
      title: 'Film a Scelta',
      cost: 300,
      purchase_date: '2025-03-12T10:15:00Z',
      status: 'pending_approval'
    }
  ];
  
  beforeEach(() => {
    // Configurazione mock dei servizi
    StudentService.getStudents.mockResolvedValue(mockStudents);
    PathService.getPathTemplates.mockResolvedValue(mockPathTemplates);
    RewardService.getRewardTemplates.mockResolvedValue(mockRewardTemplates);
    RewardService.getPendingApprovals.mockResolvedValue(mockPendingApprovals);
    
    // Reset delle chiamate mock
    jest.clearAllMocks();
  });
  
  test('dovrebbe caricare e visualizzare correttamente i dati del dashboard genitore', async () => {
    // Rendering del componente con i provider necessari
    render(
      <BrowserRouter>
        <NotificationsProvider>
          <ParentDashboard />
        </NotificationsProvider>
      </BrowserRouter>
    );
    
    // Verifica che i servizi siano stati chiamati
    expect(StudentService.getStudents).toHaveBeenCalled();
    expect(PathService.getPathTemplates).toHaveBeenCalled();
    expect(RewardService.getRewardTemplates).toHaveBeenCalled();
    expect(RewardService.getPendingApprovals).toHaveBeenCalled();
    
    // Attendiamo che i dati vengano caricati e visualizzati
    await waitFor(() => {
      // Verifichiamo che gli studenti siano visualizzati
      expect(screen.getByText('Mario Rossi')).toBeInTheDocument();
      expect(screen.getByText('Giulia Bianchi')).toBeInTheDocument();
      
      // Verifichiamo che i template percorsi siano visualizzati
      expect(screen.getByText('Template Matematica Base')).toBeInTheDocument();
      expect(screen.getByText('Template Scienze')).toBeInTheDocument();
      
      // Verifichiamo che i template ricompense siano visualizzati
      expect(screen.getByText('Template Giornata al Parco')).toBeInTheDocument();
      expect(screen.getByText('Template Film a Scelta')).toBeInTheDocument();
      
      // Verifichiamo che le approvazioni in sospeso siano visualizzate
      expect(screen.getByText('Approvazioni in sospeso: 1')).toBeInTheDocument();
    });
  });
  
  test('dovrebbe gestire errori nel caricamento dei dati', async () => {
    // Modifichiamo i mock per simulare errori
    StudentService.getStudents.mockRejectedValue(new Error('Errore nel caricamento degli studenti'));
    
    // Rendering del componente
    render(
      <BrowserRouter>
        <NotificationsProvider>
          <ParentDashboard />
        </NotificationsProvider>
      </BrowserRouter>
    );
    
    // Verifichiamo che vengano visualizzati i dati disponibili (template e approvazioni)
    await waitFor(() => {
      // Verifichiamo che i template percorsi siano visualizzati
      expect(screen.getByText('Template Matematica Base')).toBeInTheDocument();
      expect(screen.getByText('Template Scienze')).toBeInTheDocument();
      
      // Verifichiamo che i template ricompense siano visualizzati
      expect(screen.getByText('Template Giornata al Parco')).toBeInTheDocument();
      expect(screen.getByText('Template Film a Scelta')).toBeInTheDocument();
      
      // Verifichiamo che ci sia un messaggio di errore per gli studenti
      expect(screen.getByText(/Nessuno studente disponibile/i)).toBeInTheDocument();
    });
  });
  
  test('dovrebbe visualizzare stato di caricamento durante il fetch dei dati', async () => {
    // Modifichiamo i mock per ritardare la risposta
    jest.useFakeTimers();
    StudentService.getStudents.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve(mockStudents), 1000);
      });
    });
    
    // Rendering del componente
    render(
      <BrowserRouter>
        <NotificationsProvider>
          <ParentDashboard />
        </NotificationsProvider>
      </BrowserRouter>
    );
    
    // Verifichiamo che venga mostrato lo stato di caricamento
    expect(screen.getByText(/Caricamento studenti.../i)).toBeInTheDocument();
    
    // Avanziamo il tempo simulato
    jest.advanceTimersByTime(1100);
    
    // Verifichiamo che i dati vengano visualizzati
    await waitFor(() => {
      expect(screen.getByText('Mario Rossi')).toBeInTheDocument();
      expect(screen.getByText('Giulia Bianchi')).toBeInTheDocument();
    });
    
    jest.useRealTimers();
  });
  
  test('dovrebbe mostrare un sommario dei dati nella dashboard', async () => {
    // Rendering del componente
    render(
      <BrowserRouter>
        <NotificationsProvider>
          <ParentDashboard />
        </NotificationsProvider>
      </BrowserRouter>
    );
    
    // Attendiamo che i dati vengano caricati
    await waitFor(() => {
      // Verifichiamo che i contatori di sommario siano visualizzati
      expect(screen.getByText('2')).toBeInTheDocument(); // Numero studenti
      expect(screen.getByText('2')).toBeInTheDocument(); // Numero template percorsi
      expect(screen.getByText('2')).toBeInTheDocument(); // Numero template ricompense
      expect(screen.getByText('1')).toBeInTheDocument(); // Numero approvazioni pendenti
      
      // Verifichiamo le statistiche aggregate
      expect(screen.getByText('Percorsi assegnati: 8')).toBeInTheDocument();
      expect(screen.getByText('Percorsi completati: 3')).toBeInTheDocument();
      expect(screen.getByText('Ricompense assegnate: 10')).toBeInTheDocument();
    });
  });
});
