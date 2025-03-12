import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RewardShop from '../../../src/components/student/RewardShop';
import RewardService from '../../../src/services/RewardService';
import { NotificationsProvider } from '../../../src/contexts/NotificationsContext';
import { NotificationsService } from '../../../src/services/NotificationsService';

// Mock dei servizi
jest.mock('../../../src/services/RewardService');
jest.mock('../../../src/services/NotificationsService', () => ({
  NotificationsService: {
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showInfo: jest.fn(),
    showWarning: jest.fn(),
  }
}));

describe('RewardShop Integration Tests', () => {
  // Dati di test
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
    },
    {
      id: 3,
      title: 'Videogioco',
      description: 'Un\'ora di videogioco',
      cost: 250,
      category: 'Intrattenimento',
      image_url: 'https://example.com/game.jpg',
      status: 'available'
    }
  ];
  
  const mockPointsBalance = {
    student_id: 5,
    points_balance: 850,
    total_earned: 1200,
    total_spent: 350
  };
  
  const mockPurchaseResult = {
    purchase_id: 101,
    reward_id: 2,
    student_id: 5,
    purchase_date: '2025-03-12T10:15:00Z',
    status: 'pending_approval',
    points_spent: 300,
    new_balance: 550,
    message: 'Ricompensa acquistata con successo! In attesa di approvazione.'
  };
  
  const mockPurchaseHistory = [
    {
      purchase_id: 100,
      reward_id: 3,
      title: 'Libro a Scelta',
      description: 'Un libro a tua scelta',
      cost: 400,
      purchase_date: '2025-03-01T14:30:00Z',
      status: 'delivered',
      delivery_date: '2025-03-03T10:15:00Z'
    }
  ];
  
  beforeEach(() => {
    // Configurazione mock dei servizi
    RewardService.getStudentRewards.mockResolvedValue(mockRewards);
    RewardService.getStudentPoints.mockResolvedValue(mockPointsBalance);
    RewardService.purchaseReward.mockResolvedValue(mockPurchaseResult);
    RewardService.getPurchaseHistory.mockResolvedValue(mockPurchaseHistory);
    
    // Reset delle chiamate mock
    jest.clearAllMocks();
  });
  
  test('dovrebbe caricare e visualizzare le ricompense disponibili', async () => {
    // Rendering del componente
    render(
      <BrowserRouter>
        <NotificationsProvider>
          <RewardShop />
        </NotificationsProvider>
      </BrowserRouter>
    );
    
    // Verifica che i servizi siano stati chiamati
    expect(RewardService.getStudentRewards).toHaveBeenCalled();
    expect(RewardService.getStudentPoints).toHaveBeenCalled();
    
    // Attendiamo che i dati vengano caricati e visualizzati
    await waitFor(() => {
      // Verifichiamo che le ricompense siano visualizzate
      expect(screen.getByText('Giornata al Parco')).toBeInTheDocument();
      expect(screen.getByText('Film a Scelta')).toBeInTheDocument();
      expect(screen.getByText('Videogioco')).toBeInTheDocument();
      
      // Verifichiamo che i costi siano visualizzati
      expect(screen.getByText('500 punti')).toBeInTheDocument();
      expect(screen.getByText('300 punti')).toBeInTheDocument();
      expect(screen.getByText('250 punti')).toBeInTheDocument();
      
      // Verifichiamo che il saldo punti sia visualizzato
      expect(screen.getByText('850')).toBeInTheDocument();
    });
  });
  
  test('dovrebbe permettere l\'acquisto di una ricompensa', async () => {
    // Rendering del componente
    render(
      <BrowserRouter>
        <NotificationsProvider>
          <RewardShop />
        </NotificationsProvider>
      </BrowserRouter>
    );
    
    // Attendiamo che i dati vengano caricati
    await waitFor(() => {
      expect(screen.getByText('Film a Scelta')).toBeInTheDocument();
    });
    
    // Troviamo il pulsante di acquisto per "Film a Scelta" e lo clicchiamo
    const buttons = screen.getAllByText('Acquista');
    const filmRewardButton = buttons[1]; // Il secondo pulsante Acquista (per Film a Scelta)
    fireEvent.click(filmRewardButton);
    
    // Verifichiamo che appaia la finestra di conferma
    expect(screen.getByText(/Conferma Acquisto/i)).toBeInTheDocument();
    expect(screen.getByText(/Film a Scelta/i)).toBeInTheDocument();
    expect(screen.getByText(/300 punti/i)).toBeInTheDocument();
    
    // Confermiamo l'acquisto
    const confirmButton = screen.getByText('Conferma');
    fireEvent.click(confirmButton);
    
    // Verifichiamo che il servizio sia stato chiamato
    await waitFor(() => {
      expect(RewardService.purchaseReward).toHaveBeenCalledWith(2);
      
      // Verifichiamo che sia stata mostrata la notifica di successo
      expect(NotificationsService.showSuccess).toHaveBeenCalledWith('Ricompensa acquistata con successo! In attesa di approvazione.');
      
      // Verifichiamo che il saldo punti sia stato aggiornato
      expect(RewardService.getStudentPoints).toHaveBeenCalledTimes(2);
    });
  });
  
  test('dovrebbe mostrare lo storico degli acquisti', async () => {
    // Rendering del componente
    render(
      <BrowserRouter>
        <NotificationsProvider>
          <RewardShop />
        </NotificationsProvider>
      </BrowserRouter>
    );
    
    // Verifica che il servizio sia stato chiamato
    expect(RewardService.getPurchaseHistory).toHaveBeenCalled();
    
    // Attendiamo che i dati vengano caricati
    await waitFor(() => {
      // Verifichiamo che lo storico sia visualizzato
      expect(screen.getByText('Libro a Scelta')).toBeInTheDocument();
      expect(screen.getByText('Consegnato')).toBeInTheDocument();
    });
  });
  
  test('dovrebbe gestire errori nel caricamento delle ricompense', async () => {
    // Modifichiamo il mock per simulare un errore
    RewardService.getStudentRewards.mockRejectedValue(new Error('Errore nel caricamento delle ricompense'));
    
    // Rendering del componente
    render(
      <BrowserRouter>
        <NotificationsProvider>
          <RewardShop />
        </NotificationsProvider>
      </BrowserRouter>
    );
    
    // Attendiamo che venga visualizzato il messaggio di errore
    await waitFor(() => {
      expect(screen.getByText(/Nessuna ricompensa disponibile/i)).toBeInTheDocument();
      expect(NotificationsService.showError).toHaveBeenCalled();
    });
  });
  
  test('dovrebbe impedire l\'acquisto se i punti sono insufficienti', async () => {
    // Modifichiamo il mock per simulare punti insufficienti
    RewardService.purchaseReward.mockImplementation(() => {
      const error = new Error('Punti insufficienti per acquistare questa ricompensa');
      error.response = { data: { detail: 'Punti insufficienti per acquistare questa ricompensa' } };
      return Promise.reject(error);
    });
    
    // Rendering del componente
    render(
      <BrowserRouter>
        <NotificationsProvider>
          <RewardShop />
        </NotificationsProvider>
      </BrowserRouter>
    );
    
    // Attendiamo che i dati vengano caricati
    await waitFor(() => {
      expect(screen.getByText('Giornata al Parco')).toBeInTheDocument();
    });
    
    // Troviamo il pulsante di acquisto per "Giornata al Parco" e lo clicchiamo
    const buttons = screen.getAllByText('Acquista');
    const parkRewardButton = buttons[0]; // Il primo pulsante Acquista (per Giornata al Parco)
    fireEvent.click(parkRewardButton);
    
    // Verifichiamo che appaia la finestra di conferma
    expect(screen.getByText(/Conferma Acquisto/i)).toBeInTheDocument();
    
    // Confermiamo l'acquisto
    const confirmButton = screen.getByText('Conferma');
    fireEvent.click(confirmButton);
    
    // Verifichiamo che venga mostrato un messaggio di errore
    await waitFor(() => {
      expect(NotificationsService.showError).toHaveBeenCalledWith(
        expect.stringContaining('Punti insufficienti')
      );
    });
  });
});
