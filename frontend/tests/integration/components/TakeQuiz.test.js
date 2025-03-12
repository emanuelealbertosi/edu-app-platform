import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TakeQuiz from '../../../src/components/student/TakeQuiz';
import QuizService from '../../../src/services/QuizService';
import PathService from '../../../src/services/PathService';
import { NotificationsProvider } from '../../../src/contexts/NotificationsContext';
import { NotificationsService } from '../../../src/services/NotificationsService';

// Mock dei servizi
jest.mock('../../../src/services/QuizService');
jest.mock('../../../src/services/PathService');
jest.mock('../../../src/services/NotificationsService', () => ({
  NotificationsService: {
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showInfo: jest.fn(),
    showWarning: jest.fn(),
  }
}));

// Mock del hook useParams
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({
    quizId: '1',
    pathId: '1'
  }),
}));

describe('TakeQuiz Integration Tests', () => {
  // Dati di test
  const mockQuiz = {
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
    message: 'Quiz completato con successo!'
  };
  
  const mockNodeUpdateResult = {
    success: true,
    node_id: 3,
    completed: true,
    path_progress: 75,
    message: 'Progresso nodo aggiornato con successo'
  };
  
  beforeEach(() => {
    // Configurazione mock dei servizi
    QuizService.getQuizWithQuestions.mockResolvedValue(mockQuiz);
    QuizService.submitQuizAnswers.mockResolvedValue(mockSubmissionResult);
    PathService.updateNodeProgress.mockResolvedValue(mockNodeUpdateResult);
    
    // Reset delle chiamate mock
    jest.clearAllMocks();
  });
  
  test('dovrebbe caricare e visualizzare le domande del quiz', async () => {
    // Rendering del componente
    render(
      <BrowserRouter>
        <NotificationsProvider>
          <TakeQuiz />
        </NotificationsProvider>
      </BrowserRouter>
    );
    
    // Verifica che il servizio sia stato chiamato
    expect(QuizService.getQuizWithQuestions).toHaveBeenCalledWith('1');
    
    // Attendiamo che i dati vengano caricati e visualizzati
    await waitFor(() => {
      // Verifichiamo il titolo del quiz
      expect(screen.getByText('Quiz di Matematica')).toBeInTheDocument();
      
      // Verifichiamo che le domande siano visualizzate
      expect(screen.getByText('Quanto fa 2 + 2?')).toBeInTheDocument();
      
      // Verifichiamo che le opzioni siano visualizzate
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('22')).toBeInTheDocument();
    });
  });
  
  test('dovrebbe permettere di rispondere alle domande e inviare le risposte', async () => {
    // Rendering del componente
    render(
      <BrowserRouter>
        <NotificationsProvider>
          <TakeQuiz />
        </NotificationsProvider>
      </BrowserRouter>
    );
    
    // Attendiamo il caricamento delle domande
    await waitFor(() => {
      expect(screen.getByText('Quanto fa 2 + 2?')).toBeInTheDocument();
    });
    
    // Selezioniamo le risposte
    const opzione4 = screen.getByLabelText('4');
    fireEvent.click(opzione4);
    
    // Passiamo alla domanda successiva
    const btnAvanti = screen.getByText('Avanti');
    fireEvent.click(btnAvanti);
    
    // Verifichiamo che sia visualizzata la seconda domanda
    expect(screen.getByText('Quanto fa 10 - 5?')).toBeInTheDocument();
    
    // Selezioniamo la risposta alla seconda domanda
    const opzione5 = screen.getByLabelText('5');
    fireEvent.click(opzione5);
    
    // Inviamo il quiz
    const btnInvia = screen.getByText('Invia');
    fireEvent.click(btnInvia);
    
    // Verifichiamo che il servizio sia stato chiamato con le risposte corrette
    await waitFor(() => {
      expect(QuizService.submitQuizAnswers).toHaveBeenCalledWith('1', [
        { question_id: 101, selected_option_ids: [1002] },
        { question_id: 102, selected_option_ids: [1006] }
      ]);
      
      expect(PathService.updateNodeProgress).toHaveBeenCalledWith('1', '1', { completed: true });
      
      // Verifichiamo che sia stata mostrata la notifica di successo
      expect(NotificationsService.showSuccess).toHaveBeenCalledWith('Quiz completato con successo!');
    });
  });
  
  test('dovrebbe gestire errori nel caricamento del quiz', async () => {
    // Modifichiamo il mock per simulare un errore
    QuizService.getQuizWithQuestions.mockRejectedValue(new Error('Errore nel caricamento del quiz'));
    
    // Rendering del componente
    render(
      <BrowserRouter>
        <NotificationsProvider>
          <TakeQuiz />
        </NotificationsProvider>
      </BrowserRouter>
    );
    
    // Attendiamo che venga visualizzato il messaggio di errore
    await waitFor(() => {
      expect(screen.getByText(/Impossibile caricare il quiz/i)).toBeInTheDocument();
      expect(NotificationsService.showError).toHaveBeenCalled();
    });
  });
  
  test('dovrebbe gestire errori nell\'invio delle risposte', async () => {
    // Configurazione iniziale
    QuizService.getQuizWithQuestions.mockResolvedValue(mockQuiz);
    
    // Modifichiamo il mock per simulare un errore nell'invio
    QuizService.submitQuizAnswers.mockRejectedValue(new Error('Errore nell\'invio delle risposte'));
    
    // Rendering del componente
    render(
      <BrowserRouter>
        <NotificationsProvider>
          <TakeQuiz />
        </NotificationsProvider>
      </BrowserRouter>
    );
    
    // Attendiamo il caricamento delle domande
    await waitFor(() => {
      expect(screen.getByText('Quanto fa 2 + 2?')).toBeInTheDocument();
    });
    
    // Selezioniamo le risposte per entrambe le domande e inviamo
    const opzione4 = screen.getByLabelText('4');
    fireEvent.click(opzione4);
    
    const btnAvanti = screen.getByText('Avanti');
    fireEvent.click(btnAvanti);
    
    const opzione5 = screen.getByLabelText('5');
    fireEvent.click(opzione5);
    
    const btnInvia = screen.getByText('Invia');
    fireEvent.click(btnInvia);
    
    // Verifichiamo che venga mostrato un messaggio di errore
    await waitFor(() => {
      expect(NotificationsService.showError).toHaveBeenCalled();
    });
  });
  
  test('dovrebbe verificare le risposte incomplete e mostrare avviso', async () => {
    // Rendering del componente
    render(
      <BrowserRouter>
        <NotificationsProvider>
          <TakeQuiz />
        </NotificationsProvider>
      </BrowserRouter>
    );
    
    // Attendiamo il caricamento delle domande
    await waitFor(() => {
      expect(screen.getByText('Quanto fa 2 + 2?')).toBeInTheDocument();
    });
    
    // Non selezioniamo nessuna risposta
    
    // Proviamo ad andare avanti senza rispondere
    const btnAvanti = screen.getByText('Avanti');
    fireEvent.click(btnAvanti);
    
    // Verifichiamo che venga mostrato un avviso
    expect(NotificationsService.showWarning).toHaveBeenCalledWith('Seleziona una risposta prima di procedere');
  });
});
