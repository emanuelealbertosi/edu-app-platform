import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PathNodeComponent from '../../../src/components/student/PathNodeComponent';
import { NotificationsProvider } from '../../../src/contexts/NotificationsContext';
import { NotificationsService } from '../../../src/services/NotificationsService';
import PathService from '../../../src/services/PathService';
import QuizService from '../../../src/services/QuizService';

// Mock dei servizi
jest.mock('../../../src/services/PathService');
jest.mock('../../../src/services/QuizService');
jest.mock('../../../src/services/NotificationsService', () => ({
  NotificationsService: {
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showInfo: jest.fn(),
    showWarning: jest.fn(),
  }
}));

describe('PathNodeComponent Integration Tests', () => {
  // Dati di test
  const mockPathId = 1;
  
  const mockNode = {
    id: 2,
    title: 'Introduzione all\'Algebra',
    description: 'Impara i concetti base dell\'algebra',
    node_type: 'learning',
    content_url: 'https://example.com/algebra-intro',
    order: 2,
    status: 'unlocked',
    completion_status: 'not_started',
    completion_date: null,
    prerequisites: [1],
    next_nodes: [3],
    resources: [
      {
        id: 5,
        title: 'Guida all\'Algebra',
        resource_type: 'pdf',
        url: 'https://example.com/algebra-guide.pdf'
      }
    ]
  };
  
  const mockQuizNode = {
    id: 3,
    title: 'Quiz di Algebra',
    description: 'Verifica le tue conoscenze di algebra',
    node_type: 'quiz',
    quiz_id: 10,
    order: 3,
    status: 'locked',
    completion_status: 'not_started',
    completion_date: null,
    prerequisites: [2],
    next_nodes: [4]
  };
  
  const mockContentNode = {
    id: 4,
    title: 'Video sulle Equazioni',
    description: 'Video didattico sulle equazioni di primo grado',
    node_type: 'video',
    content_url: 'https://example.com/equazioni-video',
    order: 4,
    status: 'locked',
    completion_status: 'not_started',
    completion_date: null,
    prerequisites: [3],
    next_nodes: []
  };
  
  beforeEach(() => {
    // Configurazione mock dei servizi
    PathService.updateNodeProgress.mockResolvedValue({
      node_id: 2,
      completion_status: 'completed',
      completion_date: '2025-03-12T06:00:00Z',
      updated_at: '2025-03-12T06:00:00Z',
      message: 'Progresso del nodo aggiornato con successo'
    });
    
    QuizService.getQuizById.mockResolvedValue({
      id: 10,
      title: 'Quiz di Algebra',
      description: 'Verifica le tue conoscenze di algebra',
      questions: []
    });
    
    // Reset delle chiamate mock
    jest.clearAllMocks();
  });
  
  test('dovrebbe visualizzare correttamente un nodo di apprendimento', async () => {
    // Rendering del componente
    render(
      <BrowserRouter>
        <NotificationsProvider>
          <PathNodeComponent pathId={mockPathId} node={mockNode} onNodeUpdate={jest.fn()} />
        </NotificationsProvider>
      </BrowserRouter>
    );
    
    // Verifica che le informazioni del nodo siano visualizzate
    expect(screen.getByText('Introduzione all\'Algebra')).toBeInTheDocument();
    expect(screen.getByText('Impara i concetti base dell\'algebra')).toBeInTheDocument();
    expect(screen.getByText('Risorse didattiche:')).toBeInTheDocument();
    expect(screen.getByText('Guida all\'Algebra')).toBeInTheDocument();
    
    // Verifica che il pulsante per completare il nodo sia presente
    expect(screen.getByText('Segna come completato')).toBeInTheDocument();
  });
  
  test('dovrebbe visualizzare correttamente un nodo quiz', async () => {
    // Rendering del componente
    render(
      <BrowserRouter>
        <NotificationsProvider>
          <PathNodeComponent pathId={mockPathId} node={mockQuizNode} onNodeUpdate={jest.fn()} />
        </NotificationsProvider>
      </BrowserRouter>
    );
    
    // Verifica che le informazioni del nodo siano visualizzate
    expect(screen.getByText('Quiz di Algebra')).toBeInTheDocument();
    expect(screen.getByText('Verifica le tue conoscenze di algebra')).toBeInTheDocument();
    
    // Verifica che il pulsante per iniziare il quiz sia presente
    expect(screen.getByText('Inizia Quiz')).toBeInTheDocument();
  });
  
  test('dovrebbe visualizzare correttamente un nodo video', async () => {
    // Rendering del componente
    render(
      <BrowserRouter>
        <NotificationsProvider>
          <PathNodeComponent pathId={mockPathId} node={mockContentNode} onNodeUpdate={jest.fn()} />
        </NotificationsProvider>
      </BrowserRouter>
    );
    
    // Verifica che le informazioni del nodo siano visualizzate
    expect(screen.getByText('Video sulle Equazioni')).toBeInTheDocument();
    expect(screen.getByText('Video didattico sulle equazioni di primo grado')).toBeInTheDocument();
    
    // Verifica che sia presente l'indicazione del tipo di nodo
    expect(screen.getByText('Tipo: video')).toBeInTheDocument();
  });
  
  test('dovrebbe aggiornare il progresso quando il nodo è completato', async () => {
    // Mock per la funzione di callback
    const mockOnNodeUpdate = jest.fn();
    
    // Rendering del componente
    render(
      <BrowserRouter>
        <NotificationsProvider>
          <PathNodeComponent pathId={mockPathId} node={mockNode} onNodeUpdate={mockOnNodeUpdate} />
        </NotificationsProvider>
      </BrowserRouter>
    );
    
    // Verifica che il pulsante per completare il nodo sia presente
    const completeButton = screen.getByText('Segna come completato');
    expect(completeButton).toBeInTheDocument();
    
    // Clicca il pulsante per completare il nodo
    fireEvent.click(completeButton);
    
    // Verifica che il servizio sia stato chiamato con i parametri corretti
    expect(PathService.updateNodeProgress).toHaveBeenCalledWith(mockPathId, mockNode.id, { completion_status: 'completed' });
    
    // Verifica che sia stata mostrata una notifica di successo
    await waitFor(() => {
      expect(NotificationsService.showSuccess).toHaveBeenCalledWith('Progresso del nodo aggiornato con successo');
    });
    
    // Verifica che la funzione di callback sia stata chiamata
    expect(mockOnNodeUpdate).toHaveBeenCalledWith({
      node_id: 2,
      completion_status: 'completed',
      completion_date: '2025-03-12T06:00:00Z'
    });
  });
  
  test('dovrebbe navigare al quiz quando iniziato', async () => {
    // Preparazione del mock per window.location.href
    delete window.location;
    window.location = { href: jest.fn() };
    
    // Rendering del componente
    render(
      <BrowserRouter>
        <NotificationsProvider>
          <PathNodeComponent pathId={mockPathId} node={mockQuizNode} onNodeUpdate={jest.fn()} />
        </NotificationsProvider>
      </BrowserRouter>
    );
    
    // Verifica che il pulsante per iniziare il quiz sia presente
    const startQuizButton = screen.getByText('Inizia Quiz');
    expect(startQuizButton).toBeInTheDocument();
    
    // Clicca il pulsante per iniziare il quiz
    fireEvent.click(startQuizButton);
    
    // Verifica che si navighi alla pagina del quiz
    await waitFor(() => {
      expect(window.location.href).toBe(`/student/paths/${mockPathId}/quizzes/${mockQuizNode.quiz_id}`);
    });
  });
  
  test('dovrebbe gestire errori durante l\'aggiornamento del progresso', async () => {
    // Modifichiamo il mock per simulare un errore
    PathService.updateNodeProgress.mockRejectedValue(new Error('Errore nell\'aggiornamento del progresso'));
    
    // Mock per la funzione di callback
    const mockOnNodeUpdate = jest.fn();
    
    // Rendering del componente
    render(
      <BrowserRouter>
        <NotificationsProvider>
          <PathNodeComponent pathId={mockPathId} node={mockNode} onNodeUpdate={mockOnNodeUpdate} />
        </NotificationsProvider>
      </BrowserRouter>
    );
    
    // Clicca il pulsante per completare il nodo
    const completeButton = screen.getByText('Segna come completato');
    fireEvent.click(completeButton);
    
    // Verifica che venga mostrata una notifica di errore
    await waitFor(() => {
      expect(NotificationsService.showError).toHaveBeenCalled();
    });
    
    // Verifica che la funzione di callback non sia stata chiamata
    expect(mockOnNodeUpdate).not.toHaveBeenCalled();
  });
  
  test('dovrebbe visualizzare lo stato di completamento del nodo', async () => {
    // Nodo completato
    const completedNode = {
      ...mockNode,
      completion_status: 'completed',
      completion_date: '2025-03-10T14:30:00Z'
    };
    
    // Rendering del componente
    render(
      <BrowserRouter>
        <NotificationsProvider>
          <PathNodeComponent pathId={mockPathId} node={completedNode} onNodeUpdate={jest.fn()} />
        </NotificationsProvider>
      </BrowserRouter>
    );
    
    // Verifica che sia mostrato lo stato di completamento
    expect(screen.getByText('Completato')).toBeInTheDocument();
    
    // Verifica che la data di completamento sia visualizzata
    expect(screen.getByText('10/03/2025')).toBeInTheDocument();
    
    // Verifica che il pulsante "Segna come completato" non sia presente
    expect(screen.queryByText('Segna come completato')).not.toBeInTheDocument();
  });
  
  test('dovrebbe mostrare lo stato di nodo bloccato', async () => {
    // Rendering del componente con nodo bloccato
    render(
      <BrowserRouter>
        <NotificationsProvider>
          <PathNodeComponent pathId={mockPathId} node={mockQuizNode} onNodeUpdate={jest.fn()} />
        </NotificationsProvider>
      </BrowserRouter>
    );
    
    // Verifica che sia mostrato lo stato di blocco
    expect(screen.getByText('Bloccato')).toBeInTheDocument();
    
    // Verifica che sia presente il messaggio sui prerequisiti
    expect(screen.getByText('Completa i nodi precedenti per sbloccare questo nodo')).toBeInTheDocument();
  });
});
