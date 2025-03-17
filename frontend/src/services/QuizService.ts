import ApiService from './ApiService';
import { NotificationsService } from './NotificationsService';

// API URLs
const API_URL = process.env.REACT_APP_API_URL || '';
// Modifica l'endpoint per utilizzare quiz-templates invece di quizzes/templates
const QUIZ_API_URL = `${API_URL}/api/quiz-templates`;

// Debug dell'URL usato
console.log('QUIZ SERVICE - API URL:', API_URL);
console.log('QUIZ SERVICE - QUIZ API URL:', QUIZ_API_URL);

// Interfaces
export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'single_choice' | 'true_false' | 'text' | 'numeric';
  options?: Option[];
  points: number;
  timeLimit?: number;
  score?: number;
  correctAnswer?: string | number;
  explanation?: string;
  answer_options?: any; // Add this line to allow answer_options property
}

export interface QuizTemplate {
  id: string;
  title: string;
  description: string;
  subject: string;
  difficultyLevel: 'easy' | 'medium' | 'hard';
  questionsCount: number;
  timeLimit?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  questions: Question[];
  totalQuestions?: number;
  isPublic?: boolean;
  passingScore?: number;
  createdBy?: string;
  totalPoints?: number;
  estimatedTime?: number;
}

export interface Quiz {
  id: string;
  templateId: string;
  studentId: string;
  title: string;
  description: string;
  isCompleted: boolean;
  startedAt?: Date;
  completedAt?: Date;
  score: number;
  maxScore: number;
  questions: Question[];
  timeLimit?: number;
  pathId?: string;
  pathTitle?: string;
}

export interface QuizAnswer {
  questionId: string;
  selectedOptionId?: string;
  textAnswer?: string;
}

export interface QuizSubmission {
  answers: QuizAnswer[];
  timeSpent: number;
}

export interface QuizResult {
  score: number;
  maxScore: number;
  correctAnswers: number;
  totalQuestions: number;
  pointsAwarded?: number;
  feedback?: string;
}

/**
 * Normalizes a single question from backend format to frontend format
 */
export const normalizeQuestion = (question: any): Question => {
  console.log('Normalizzazione domanda:', question);
  
  if (!question || typeof question !== 'object') {
    console.error('Domanda non valida:', question);
    // Crea una domanda vuota ma valida in caso di dati mancanti
    return {
      id: `question_${Math.random().toString(36).substring(2, 9)}`,
      text: 'Domanda non disponibile',
      type: 'multiple_choice',
      options: [
        { id: `opt1_${Math.random().toString(36).substr(2, 9)}`, text: 'Opzione 1', isCorrect: false },
        { id: `opt2_${Math.random().toString(36).substr(2, 9)}`, text: 'Opzione 2', isCorrect: true }
      ],
      points: 1,
      timeLimit: 0
    };
  }
  
  // Handle options/answer_options difference
  let options: Option[] = [];
  if (question.options && Array.isArray(question.options)) {
    options = question.options.map((opt: any) => ({
      id: opt.id || `option_${Math.random().toString(36).substring(2, 9)}`,
      text: opt.text || '',
      isCorrect: opt.isCorrect === true || opt.is_correct === true
    }));
  } else if (question.answer_options && Array.isArray(question.answer_options)) {
    options = question.answer_options.map((opt: any) => ({
      id: opt.id || `option_${Math.random().toString(36).substring(2, 9)}`,
      text: opt.text || '',
      isCorrect: opt.isCorrect === true || opt.is_correct === true
    }));
  }
  
  // Assicuriamoci che ci siano sempre opzioni per i tipi di domande che le richiedono
  const questionType = question.type || question.question_type || 'multiple_choice';
  if ((questionType === 'multiple_choice' || questionType === 'single_choice') && options.length === 0) {
    options = [
      { id: `opt1_${Math.random().toString(36).substr(2, 9)}`, text: 'Opzione 1', isCorrect: false },
      { id: `opt2_${Math.random().toString(36).substr(2, 9)}`, text: 'Opzione 2', isCorrect: true }
    ];
  }
  
  return {
    id: question.id || `question_${Math.random().toString(36).substring(2, 9)}`,
    text: question.text || 'Domanda senza testo',
    type: questionType,
    options: options,
    points: question.points || question.score || 1,
    timeLimit: question.time_limit || question.timeLimit || 0,
    explanation: question.explanation || '',
    correctAnswer: question.correctAnswer || question.correct_answer || ''
  };
};

/**
 * Normalizes an array of questions from backend format to frontend format
 */
export const normalizeQuestions = (questions: any): Question[] => {
  console.log('Normalizzazione domande:', questions);
  
  if (!questions) {
    console.error('questions è undefined o null');
    return defaultQuestions();
  }
  
  if (!Array.isArray(questions)) {
    console.log('normalizeQuestions ricevuto un non-array:', typeof questions);
    
    // Se è un oggetto con proprietà items, prova a usare quello
    if (questions && typeof questions === 'object' && questions.hasOwnProperty('items') && Array.isArray(questions.items)) {
      return questions.items.map((q: any) => normalizeQuestion(q));
    }
    
    // Fallback: return default questions
    return defaultQuestions();
  }
  
  // Almeno una domanda è sempre necessaria
  if (questions.length === 0) {
    return defaultQuestions();
  }
  
  return questions.map(q => normalizeQuestion(q));
};

/**
 * Provides default questions as a fallback
 */
function defaultQuestions(): Question[] {
  return [
    {
      id: 'default_q1',
      text: 'Qual è la differenza principale tra un sistema monolitico e un sistema basato su microservizi?',
      type: 'multiple_choice',
      options: [
        { id: 'default_o1', text: 'I sistemi monolitici sono sempre più lenti dei microservizi', isCorrect: false },
        { id: 'default_o2', text: 'I sistemi monolitici sono costituiti da un singolo blocco di codice, mentre i microservizi sono suddivisi in componenti indipendenti', isCorrect: true },
        { id: 'default_o3', text: 'I microservizi sono sempre più facili da sviluppare rispetto ai sistemi monolitici', isCorrect: false }
      ],
      points: 1,
      timeLimit: 60,
      explanation: 'I sistemi monolitici sono costruiti come un singolo pezzo di software, mentre i microservizi dividono l\'applicazione in servizi indipendenti con responsabilità specifiche.'
    }
  ];
}

/**
 * Servizio per la gestione dei quiz
 */
class QuizService {
  // Rimuovere il riferimento all'AxiosInstance che causa errore di tipo
  constructor() {
    // Inizializzazione
  }

  /**
   * Ottiene tutti i template di quiz disponibili
   */
  public static async getAllQuizTemplates(): Promise<QuizTemplate[]> {
    try {
      console.log('Chiamata API a:', QUIZ_API_URL);
      // Rimuovo il percorso /templates poiché l'endpoint è già completo
      const response = await ApiService.get<any[]>(`${QUIZ_API_URL}`);
      
      if (!response || !Array.isArray(response)) {
        console.error('Risposta API inattesa per getAllQuizTemplates:', response);
        throw new Error('Formato risposta API non valido');
      }
      
      // Debug: mostriamo la struttura dei dati
      if (response.length > 0) {
        const firstItem = response[0];
        console.log('Struttura primo quiz template:', {
          id: firstItem.id || '(mancante)',
          title: firstItem.title || '(mancante)',
          subject: firstItem.subject ? (typeof firstItem.subject === 'object' ? JSON.stringify(firstItem.subject) : firstItem.subject) : '(mancante)',
          questions: Array.isArray(firstItem.questions) ? 
            `Array con ${firstItem.questions.length} domande` : 
            `Non è un array: ${typeof firstItem.questions}`,
          prima_domanda: firstItem.questions?.[0] ? {
            id: firstItem.questions[0].id || '(mancante)',
            text: firstItem.questions[0].text || '(mancante)',
            answer_options: Array.isArray(firstItem.questions[0].answer_options) ? 
              `Array con ${firstItem.questions[0].answer_options?.length} opzioni` : 
              `Non è un array o mancante: ${typeof firstItem.questions[0].answer_options}`
          } : 'Nessuna domanda'
        });
      }
      
      return response.map((item: any) => ({
        id: item.id || '',
        title: item.title || 'Senza titolo',
        description: item.description || '',
        subject: item.subject || '',
        difficultyLevel: this.mapDifficultyLevel(item.difficulty_level || item.difficultyLevel),
        questionsCount: Array.isArray(item.questions) ? item.questions.length : 0,
        timeLimit: item.time_limit || item.timeLimit || 0,
        createdAt: item.created_at ? new Date(item.created_at) : new Date(),
        updatedAt: item.updated_at ? new Date(item.updated_at) : new Date(),
        questions: Array.isArray(item.questions) ? normalizeQuestions(item.questions) : [],
        isPublic: item.isPublic,
        totalPoints: item.totalPoints,
        estimatedTime: item.estimatedTime
      }));
    } catch (error) {
      console.error('Errore nel recupero dei template di quiz:', error);
      throw error;
    }
  }

  /**
   * Ottiene i dettagli di un template di quiz
   */
  public static async getQuizTemplateById(templateId: string): Promise<QuizTemplate> {
    try {
      const response = await ApiService.get<any>(`${QUIZ_API_URL}/templates/${templateId}`);
      
      // Debug della risposta
      console.log('Risposta API getQuizTemplateById:', JSON.stringify(response, null, 2));
      
      // Normalizza i dati
      return {
        id: response.id || '',
        title: response.title || 'Senza titolo',
        description: response.description || '',
        subject: response.subject || '',
        difficultyLevel: this.mapDifficultyLevel(response.difficulty_level || response.difficultyLevel),
        questionsCount: Array.isArray(response.questions) ? response.questions.length : 0,
        timeLimit: response.time_limit || response.timeLimit || 0,
        createdAt: response.created_at ? new Date(response.created_at) : new Date(),
        updatedAt: response.updated_at ? new Date(response.updated_at) : new Date(),
        questions: Array.isArray(response.questions) ? normalizeQuestions(response.questions) : [],
        isPublic: response.isPublic,
        totalPoints: response.totalPoints,
        estimatedTime: response.estimatedTime
      };
    } catch (error) {
      console.error(`Errore nel recupero del template di quiz ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Crea un nuovo template di quiz
   */
  public static async createQuizTemplate(quizData: Partial<QuizTemplate>): Promise<QuizTemplate> {
    try {
      // Debug: mostra il payload che stiamo inviando
      console.log('Payload creazione quiz:', quizData);
      
      // Prepara i dati per l'API
      const apiData = {
        title: quizData.title,
        description: quizData.description || '',
        subject: quizData.subject || '',
        difficulty_level: this.mapDifficultyLevelToApi(quizData.difficultyLevel || 'medium'),
        time_limit: quizData.timeLimit || 0,
        questions: quizData.questions ? quizData.questions.map(q => ({
          id: q.id,
          text: q.text,
          question_type: q.type,
          points: q.points || 1,
          time_limit: q.timeLimit || 0,
          answer_options: q.options ? q.options.map(o => ({
            id: o.id,
            text: o.text,
            is_correct: o.isCorrect
          })) : [],
          explanation: q.explanation || ''
        })) : [],
        isPublic: quizData.isPublic,
        totalPoints: quizData.totalPoints,
        estimatedTime: quizData.estimatedTime
      };
      
      // Debug: mostra il payload preparato per l'API
      console.log('Payload API:', apiData);
      
      const response = await ApiService.post<any>(`${QUIZ_API_URL}/templates`, apiData);
      
      NotificationsService.success(
        'Template di quiz creato con successo!',
        'Creazione completata'
      );
      
      return this.getQuizTemplateById(response.id);
    } catch (error) {
      console.error('Errore nella creazione del template di quiz:', error);
      NotificationsService.error(
        'Si è verificato un errore durante la creazione del template',
        'Errore'
      );
      throw error;
    }
  }

  /**
   * Aggiorna un template di quiz esistente
   */
  public static async updateQuizTemplate(templateId: string, quizData: Partial<QuizTemplate>): Promise<QuizTemplate> {
    try {
      console.log(`Aggiornamento template quiz ${templateId}`);
      
      // Debug: mostra il payload che stiamo inviando
      console.log('Payload aggiornamento quiz:', quizData);
      
      // Prepara i dati per l'API
      const apiData = {
        title: quizData.title,
        description: quizData.description || '',
        subject: quizData.subject || '',
        difficulty_level: this.mapDifficultyLevelToApi(quizData.difficultyLevel || 'medium'),
        time_limit: quizData.timeLimit || 0,
        questions: quizData.questions ? quizData.questions.map(q => ({
          id: q.id,
          text: q.text,
          question_type: q.type,
          points: q.points || 1,
          time_limit: q.timeLimit || 0,
          answer_options: q.options ? q.options.map(o => ({
            id: o.id,
            text: o.text,
            is_correct: o.isCorrect
          })) : [],
          explanation: q.explanation || ''
        })) : [],
        isPublic: quizData.isPublic,
        totalPoints: quizData.totalPoints,
        estimatedTime: quizData.estimatedTime
      };
      
      // Debug: mostra il payload preparato per l'API
      console.log('Payload API per aggiornamento:', apiData);
      
      await ApiService.put<any>(`${QUIZ_API_URL}/templates/${templateId}`, apiData);
      
      NotificationsService.success(
        'Template di quiz aggiornato con successo!',
        'Aggiornamento completato'
      );
      
      return this.getQuizTemplateById(templateId);
    } catch (error) {
      console.error(`Errore nell'aggiornamento del template di quiz ${templateId}:`, error);
      NotificationsService.error(
        'Si è verificato un errore durante l\'aggiornamento del template',
        'Errore'
      );
      throw error;
    }
  }

  /**
   * Elimina un template di quiz
   */
  public static async deleteQuizTemplate(templateId: string): Promise<void> {
    try {
      await ApiService.delete(`${QUIZ_API_URL}/templates/${templateId}`);
      NotificationsService.success(
        'Template di quiz eliminato con successo!',
        'Eliminazione completata'
      );
    } catch (error) {
      console.error(`Errore nell'eliminazione del template di quiz ${templateId}:`, error);
      NotificationsService.error(
        'Si è verificato un errore durante l\'eliminazione del template',
        'Errore'
      );
      throw error;
    }
  }

  /**
   * Ottiene tutti i quiz assegnati allo studente corrente
   */
  public static async getAssignedQuizzes(): Promise<Quiz[]> {
    try {
      console.log('Chiamata ai quiz assegnati, percorso completo:', `${API_URL}/api/quizzes/assigned`);
      
      // Usa l'endpoint corretto per i quiz assegnati (probabilmente sotto /api/quizzes invece di /api/quiz-templates)
      const response = await ApiService.get<any[]>(`${API_URL}/api/quizzes/assigned`);
      
      if (!response || !Array.isArray(response)) {
        throw new Error('Formato risposta API non valido');
      }
      
      return response.map(item => ({
        id: item.id || '',
        templateId: item.template_id || item.templateId || '',
        studentId: item.student_id || item.studentId || '',
        title: item.title || 'Quiz senza titolo',
        description: item.description || '',
        isCompleted: item.is_completed || item.isCompleted || false,
        startedAt: item.started_at ? new Date(item.started_at) : undefined,
        completedAt: item.completed_at ? new Date(item.completed_at) : undefined,
        score: item.score || 0,
        maxScore: item.max_score || 100,
        questions: Array.isArray(item.questions) ? normalizeQuestions(item.questions) : [],
        timeLimit: item.time_limit || 0
      }));
    } catch (error) {
      console.error('Errore nel recupero dei quiz assegnati:', error);
      throw error;
    }
  }

  /**
   * Ottiene un quiz specifico per ID
   */
  public static async getQuiz(quizId: string): Promise<Quiz> {
    try {
      console.log('Chiamata per ottenere quiz, percorso completo:', `${API_URL}/api/quizzes/${quizId}`);
      // Modifica: usiamo il percorso /api/quizzes/ che è quello gestito dal backend
      const response = await ApiService.get<any>(`${API_URL}/api/quizzes/${quizId}`);
      return this.normalizeQuizData(response);
    } catch (error) {
      console.error(`Errore nel caricamento del quiz ${quizId}:`, error);
      throw error;
    }
  }

  /**
   * Ottiene un quiz nel contesto di un percorso
   * Questo carica la specifica istanza del quiz associata al percorso invece del template generale
   */
  public static async getPathQuiz(pathId: string, quizId: string): Promise<Quiz> {
    try {
      console.log(`Richiesta quiz ${quizId} per il percorso ${pathId}`);
      
      // Tentiamo di caricare il quiz direttamente usando l'endpoint specifico per i percorsi
      try {
        const response = await ApiService.get<any>(`${API_URL}/api/paths/${pathId}/nodes/${quizId}`);
        console.log('Risposta diretta dal nodo quiz:', response);
        if (response && response.id) {
          return this.normalizeQuizData({
            ...response,
            pathId: pathId
          });
        }
      } catch (directError) {
        console.error('Errore nel caricamento diretto del nodo quiz:', directError);
      }
      
      // Prima proviamo a ottenere tutti i nodi del percorso
      const nodesResponse = await ApiService.get<any[]>(`${API_URL}/api/paths/${pathId}/nodes`);
      console.log('Risposta nodi percorso:', JSON.stringify(nodesResponse, null, 2));
      
      if (!nodesResponse) {
        console.error('Risposta API vuota per i nodi del percorso');
        throw new Error('Nessun dato ricevuto dall\'API');
      }
      
      if (!Array.isArray(nodesResponse)) {
        console.error('Risposta API non è un array:', typeof nodesResponse, nodesResponse);
        
        // Tentiamo di recuperare il quiz direttamente
        console.log('Tentativo di recupero diretto del quiz template:', quizId);
        const quizTemplate = await this.getQuizTemplateById(quizId);
        console.log('Quiz template recuperato:', quizTemplate);
        
        // Creiamo una versione compatibile con Quiz
        return {
          id: quizTemplate.id,
          templateId: quizTemplate.id,
          studentId: '', // Non disponibile in questo contesto
          title: quizTemplate.title,
          description: quizTemplate.description,
          isCompleted: false,
          score: 0,
          maxScore: quizTemplate.questions.reduce((sum, q) => sum + (q.points || 1), 0),
          questions: quizTemplate.questions,
          timeLimit: quizTemplate.timeLimit,
          pathId: pathId
        };
      }
      
      // Debug aggiuntivo per controllare la struttura degli elementi
      if (nodesResponse.length > 0) {
        console.log('Esempio di nodo:', JSON.stringify(nodesResponse[0], null, 2));
      }
      
      // Cerchiamo il nodo specifico che corrisponde al quiz richiesto
      console.log('Cercando nodo con ID ESATTO:', quizId);
      const quizNode = nodesResponse.find((node: any) => {
        return node.id === quizId;
      });
      
      // Se abbiamo trovato il nodo con l'ID esatto, lo usiamo
      if (quizNode) {
        console.log('Trovato nodo quiz con ID esatto:', quizNode);
        return this.normalizeQuizData({
          ...quizNode,
          pathId: pathId
        });
      }
      
      // Altrimenti cerchiamo nodi di tipo quiz che possono contenere l'ID del quiz desiderato
      console.log('Cercando nodi di tipo quiz che contengono quiz_id:', quizId);
      const contentMatchNode = nodesResponse.find((node: any) => 
        (node.content && node.content.quiz_id === quizId) ||
        (node.quiz_id === quizId) ||
        (node.node_type === 'quiz' && node.content && node.content.id === quizId)
      );
      
      if (contentMatchNode) {
        console.log('Trovato nodo con quiz_id corrispondente:', contentMatchNode);
        return this.normalizeQuizData({
          ...contentMatchNode,
          pathId: pathId
        });
      }
      
      // Tentativo alternativo: cerchiamo per indice nei nodi di tipo quiz
      const quizNodes = nodesResponse.filter((node: any) => 
        node.node_type === 'quiz' || 
        (node.content && node.content.quiz_id)
      );
      
      console.log('Nodi quiz trovati:', quizNodes.length);
      
      // Se abbiamo trovato dei nodi quiz, proviamo a usare quello che corrisponde per posizione
      if (quizNodes.length > 0) {
        // Proviamo a convertire quizId in numero e usarlo come indice
        const index = parseInt(quizId, 10);
        if (!isNaN(index) && index >= 0 && index < quizNodes.length) {
          console.log(`Usando quiz node per indice ${index}:`, quizNodes[index]);
          const quizData = this.normalizeQuizData(quizNodes[index]);
          return {
            ...quizData,
            pathId: pathId
          };
        } else {
          // Altrimenti, prendiamo il primo nodo quiz trovato
          console.log('Usando il primo quiz node trovato:', quizNodes[0]);
          const quizData = this.normalizeQuizData(quizNodes[0]);
          return {
            ...quizData,
            pathId: pathId
          };
        }
      }
      
      // Se ancora non abbiamo trovato nulla, tentiamo di recuperare il quiz template
      console.log('Tentativo di recupero diretto del quiz template:', quizId);
      try {
        const quizTemplate = await this.getQuizTemplateById(quizId);
        console.log('Quiz template recuperato:', quizTemplate);
        
        // Creiamo una versione compatibile con Quiz
        return {
          id: quizTemplate.id,
          templateId: quizTemplate.id,
          studentId: '', // Non disponibile in questo contesto
          title: quizTemplate.title,
          description: quizTemplate.description,
          isCompleted: false,
          score: 0,
          maxScore: quizTemplate.questions.reduce((sum, q) => sum + (q.points || 1), 0),
          questions: quizTemplate.questions,
          timeLimit: quizTemplate.timeLimit,
          pathId: pathId
        };
      } catch (templateError) {
        console.error('Anche il recupero del template è fallito:', templateError);
        throw new Error(`Quiz non trovato nel percorso specificato`);
      }
    } catch (error) {
      console.error(`Errore recupero quiz ${quizId} del percorso ${pathId}:`, error);
      NotificationsService.error(
        'Impossibile caricare il quiz specifico per questo percorso',
        'Errore di caricamento'
      );
      throw error;
    }
  }

  /**
   * Invia le risposte del quiz
   */
  public static async submitQuiz(quizId: string, submission: QuizSubmission): Promise<QuizResult> {
    try {
      console.log(`Invio risposte per il quiz ${quizId}:`, submission);
      
      // Adatta il formato delle risposte per rispettare le aspettative dell'API (snake_case)
      const formattedSubmission = {
        quiz_id: quizId,
        answers: submission.answers.map(answer => ({
          question_id: answer.questionId,
          selected_option_id: answer.selectedOptionId,
          text_answer: answer.textAnswer
        })),
        time_spent: submission.timeSpent
      };
      
      console.log('Submission riformattata per API:', formattedSubmission);
      
      const response = await ApiService.post<QuizResult>(
        `${API_URL}/api/quizzes/${quizId}/submit`,
        formattedSubmission
      );
      
      // Verifica la risposta console per debug
      console.log('Risposta sottomissione quiz:', response);
      
      // Aggiunge animazioni e notifiche per migliorare l'esperienza utente
      NotificationsService.success(
        `Quiz completato con punteggio: ${response.score}/${response.maxScore}`,
        'Quiz completato'
      );
      
      return response;
    } catch (error) {
      console.error(`Errore durante l'invio delle risposte per il quiz ${quizId}:`, error);
      
      NotificationsService.error(
        'Si è verificato un errore durante l\'invio delle risposte',
        'Errore'
      );
      
      throw error;
    }
  }

  /**
   * Invia le risposte del quiz nel contesto di un percorso
   */
  public static async submitPathQuiz(pathId: string, quizId: string, submission: QuizSubmission): Promise<QuizResult> {
    try {
      console.log(`Invio risposte per il quiz ${quizId} nel percorso ${pathId}:`, submission);
      
      // Adatta il formato delle risposte per rispettare le aspettative dell'API (snake_case)
      const formattedSubmission = {
        quiz_id: quizId,
        answers: submission.answers.map(answer => ({
          question_id: answer.questionId,
          selected_option_id: answer.selectedOptionId,
          text_answer: answer.textAnswer
        })),
        time_spent: submission.timeSpent
      };
      
      console.log('Submission riformattata per API percorsi:', formattedSubmission);
      
      // Utilizziamo l'endpoint corretto per l'invio delle risposte in un percorso
      // che corrisponde alla struttura dell'API per i nodi
      const response = await ApiService.post<QuizResult>(
        `${API_URL}/api/paths/${pathId}/progress/${quizId}`, 
        formattedSubmission
      );
      
      // Log del risultato per debug
      console.log('Risposta sottomissione quiz percorso:', response);
      
      // Aggiunge animazioni e notifiche per migliorare l'esperienza utente
      NotificationsService.success(
        `Quiz completato con punteggio: ${response.score}/${response.maxScore}`,
        'Quiz completato'
      );
      
      return response;
    } catch (error) {
      console.error(`Errore durante l'invio delle risposte per il quiz ${quizId} nel percorso ${pathId}:`, error);
      
      NotificationsService.error(
        'Si è verificato un errore durante l\'invio delle risposte',
        'Errore'
      );
      
      throw error;
    }
  }

  /**
   * Normalizes the quiz data received from the backend
   */
  private static normalizeQuizData(data: any): Quiz {
    console.log('Normalizzazione dati quiz:', JSON.stringify(data, null, 2));
    
    // Gestisce il caso in cui i dati provengano da un nodo percorso
    let quizData = data;
    
    // Scenario 1: Nodo percorso con content.quiz_id
    if (data.content && data.content.quiz_id) {
      // Se è un nodo percorso, estraiamo i dati del quiz dal contenuto
      quizData = {
        ...data.content,
        id: data.content.quiz_id || data.id,
        title: data.title || data.content.title,
        description: data.description || data.content.description,
        // Assicuriamoci che le domande vengano estratte correttamente
        questions: data.content.questions || data.questions || []
      };
      console.log('Estratti dati quiz dal nodo percorso (content.quiz_id):', quizData);
    } 
    // Scenario 2: Nodo percorso con node_type quiz
    else if (data.node_type === 'quiz') {
      // Il nodo è direttamente un quiz
      quizData = {
        id: data.id,
        quiz_id: data.quiz_id || data.id,
        title: data.title || 'Quiz senza titolo',
        description: data.description || 'Nessuna descrizione',
        questions: data.questions || []
      };
      console.log('Estratti dati da nodo quiz diretto:', quizData);
    }
    // Scenario 3: Il nodo è un quiz template diretto
    else if (data.template_id || data.templateId) {
      quizData = data;
      console.log('Quiz è già in formato template');
    }
    // Scenario 4: Formato risposta API non riconosciuto, prova a recuperare comunque qualche informazione
    else {
      console.log('Formato dati quiz non riconosciuto, tentativo di recupero dati');
      quizData = {
        ...data,
        id: data.id || data.uuid || data.quiz_id || `quiz_${Date.now()}`,
        title: data.title || 'Quiz',
        description: data.description || 'Descrizione non disponibile'
      };
    }
    
    // Normalizza le domande
    let questions: Question[] = [];
    
    // Tenta di estrarre le domande da tutte le possibili posizioni/formati
    if (quizData.questions) {
      if (Array.isArray(quizData.questions)) {
        questions = normalizeQuestions(quizData.questions);
      } else if (typeof quizData.questions === 'object') {
        questions = normalizeQuestions(quizData.questions);
      }
    } else if (quizData.content && quizData.content.questions) {
      questions = normalizeQuestions(quizData.content.questions);
    } else if (data.questions) {
      questions = normalizeQuestions(data.questions);
    } else if (data.content && data.content.questions) {
      questions = normalizeQuestions(data.content.questions);
    }
    
    // Se non abbiamo trovato domande, usa i default
    if (questions.length === 0) {
      console.log('Nessuna domanda trovata nel quiz, uso domande di default');
      questions = defaultQuestions();
    }
    
    // Calcola il punteggio massimo
    const maxScore = questions.reduce((sum: number, q: any) => sum + (q.points || 1), 0);
    
    const result: Quiz = {
      id: quizData.id || quizData.uuid || '',
      templateId: quizData.template_id || quizData.templateId || quizData.quiz_id || '',
      studentId: quizData.student_id || quizData.studentId || '',
      title: quizData.title || 'Quiz senza titolo',
      description: quizData.description || 'Nessuna descrizione disponibile',
      isCompleted: quizData.is_completed || quizData.isCompleted || false,
      startedAt: quizData.started_at ? new Date(quizData.started_at) : undefined,
      completedAt: quizData.completed_at ? new Date(quizData.completed_at) : undefined,
      score: quizData.score || 0,
      maxScore: quizData.max_score || maxScore || 100,
      questions: questions,
      timeLimit: quizData.time_limit || quizData.timeLimit || 0,
      pathId: quizData.pathId || ''
    };
    
    console.log('Quiz normalizzato finale:', result);
    return result;
  }

  /**
   * Mappa il livello di difficoltà dal valore numerico del backend
   * alle stringhe usate nel frontend
   */
  private static mapDifficultyLevel(level: any): 'easy' | 'medium' | 'hard' {
    console.log('Conversione difficoltà:', level, 'tipo:', typeof level);
    
    if (level === 'easy' || level === 'medium' || level === 'hard') {
      return level as 'easy' | 'medium' | 'hard';
    }
    
    // Se è una stringa numerica, convertila in numero
    if (typeof level === 'string' && !isNaN(Number(level))) {
      level = Number(level);
    }
    
    // Se è un numero, mappa secondo la logica del backend
    if (typeof level === 'number') {
      if (level === 1) return 'easy';
      if (level === 2) return 'medium';
      if (level === 3) return 'hard';
    }
    
    // Valore di default
    return 'medium';
  }

  /**
   * Mappa il livello di difficoltà dalle stringhe del frontend
   * al valore numerico usato dal backend
   */
  private static mapDifficultyLevelToApi(level: 'easy' | 'medium' | 'hard'): number {
    if (level === 'easy') return 1;
    if (level === 'medium') return 2;
    if (level === 'hard') return 3;
    return 2; // Medium come default
  }
}

// Esportiamo direttamente la classe QuizService invece di un'istanza
export default QuizService;