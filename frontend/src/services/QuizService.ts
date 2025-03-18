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
  public static async getQuizTemplateById(templateId: string, resourceIdOverride?: string): Promise<QuizTemplate> {
    try {
      // HACK: Se resourceIdOverride è fornito, usa quello invece del templateId
      // Questo permette di forzare l'uso del resource_id quando chiamato da getPathQuiz
      const effectiveTemplateId = resourceIdOverride || templateId;
      
      console.log(`[DEBUG QuizService] Fetching quiz template with ID: ${effectiveTemplateId} (original id: ${templateId}, override: ${resourceIdOverride || 'none'})`);
      const response = await ApiService.get<any>(`${QUIZ_API_URL}/${effectiveTemplateId}`);
      
      // Debug della risposta
      console.log('[DEBUG QuizService] Quiz template response:', {
        id: response.id,
        title: response.title,
        questionsCount: response.questions?.length
      });
      
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
    } catch (error: any) {
      // Ridefiniamo effectiveTemplateId all'interno del blocco catch per risolvere l'errore
      const effectiveTemplateId = resourceIdOverride || templateId;
      console.error(`[DEBUG QuizService] Error fetching template ${effectiveTemplateId}:`, error);
      
      // Controllo più approfondito degli errori di autorizzazione e accesso
      let errorType = "unknown";
      let errorDetails = "";
      
      if (error.response) {
        // Controllo codici di errore HTTP
        if (error.response.status === 404) {
          errorType = "not_found";
          errorDetails = "Il template non esiste";
        } else if (error.response.status === 403) {
          errorType = "forbidden";
          errorDetails = "Accesso non autorizzato al template";
        } else if (error.response.status === 401) {
          errorType = "unauthorized";
          errorDetails = "Autenticazione non valida";
        } else {
          errorType = `server_error_${error.response.status}`;
          errorDetails = error.response.data?.message || "Errore di server";
        }
      } else if (error.request) {
        errorType = "network";
        errorDetails = "Errore di connessione al server";
      } else {
        errorType = "client";
        errorDetails = error.message || "Errore sconosciuto";
      }
      
      console.log(`[DEBUG QuizService] Template error type: ${errorType}, details: ${errorDetails}`);
      
      // Create a placeholder template with an error message
      return {
        id: effectiveTemplateId,
        title: `Quiz non disponibile (ID: ${effectiveTemplateId})`,
        description: `Errore: ${errorDetails}`,
        subject: 'Errore',
        difficultyLevel: 'medium',
        questionsCount: 1,
        timeLimit: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        questions: [{
          id: 'error_q1',
          text: `Non è stato possibile caricare questo quiz: ${errorDetails}`,
          type: 'multiple_choice',
          options: [
            { id: 'error_o1', text: 'Contattare l\'amministratore', isCorrect: true },
            { id: 'error_o2', text: 'Tornare al percorso', isCorrect: false }
          ],
          points: 1,
          explanation: 'Il quiz è in stato di errore. Contatta l\'amministratore del sistema.'
        }],
        isPublic: false,
        totalPoints: 1,
        estimatedTime: 5
      };
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
      
      const response = await ApiService.post<any>(`${QUIZ_API_URL}`, apiData);
      
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
      
      await ApiService.put<any>(`${QUIZ_API_URL}/${templateId}`, apiData);
      
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
      await ApiService.delete(`${QUIZ_API_URL}/${templateId}`);
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
      console.log(`[DEBUG QuizService] getPathQuiz called with pathId=${pathId}, quizId=${quizId}`);
      
      // Proviamo a recuperare il nodo prima di tutto per ottenere il resource_id
      let resourceId: string | null = null;
      
      try {
        console.log(`[DEBUG QuizService] Pre-fetching node info to get resource_id`);
        const nodesResponse = await ApiService.get(`${API_URL}/api/paths/${pathId}/nodes`);
        
        if (Array.isArray(nodesResponse)) {
          const matchedNode = nodesResponse.find(node => node.id.toString() === quizId);
          if (matchedNode) {
            // Tenta di ottenere il resource_id da tutte le possibili fonti
            resourceId = matchedNode.resource_id ? matchedNode.resource_id.toString() : 
                        (matchedNode.content?.quiz_id ? matchedNode.content.quiz_id.toString() : 
                         (matchedNode.content?.quiz_template_id ? matchedNode.content.quiz_template_id.toString() : null));
            
            console.log(`[DEBUG QuizService] Found resource_id ${resourceId} for node ${quizId}`);
          }
        }
      } catch (error) {
        console.warn(`[DEBUG QuizService] Error pre-fetching node info: ${error}`);
        // Continua anche se non riesce a ottenere il resource_id
      }
      
      // First attempt: Try to interpret quizId as a template ID directly
      // This is the most reliable way to get the correct quiz content
      try {
        console.log(`[DEBUG QuizService] First attempt: Loading direct template. Using resource_id: ${resourceId || 'not found, using node id instead'}`);
        // IMPORTANTE: Passa il resource_id come override se disponibile
        const template = await this.getQuizTemplateById(quizId, resourceId || undefined);
        
        if (template && template.questions && template.questions.length > 0) {
          console.log(`[DEBUG QuizService] Successfully loaded template directly with ${template.questions.length} questions`);
          
          // Create a quiz object from the template data
          const quiz: Quiz = {
            id: quizId,
            templateId: template.id,
            studentId: '',
            title: template.title,
            description: template.description,
            isCompleted: false,
            score: 0,
            maxScore: template.questions.reduce((sum, q) => sum + (q.points || 1), 0),
            questions: template.questions,
            timeLimit: template.timeLimit || 0,
            pathId: pathId
          };
          
          console.log(`[DEBUG QuizService] Created quiz from direct template lookup:`, {
            id: quiz.id,
            templateId: quiz.templateId,
            questionCount: quiz.questions.length
          });
          
          return quiz;
        }
      } catch (templateError: any) {
        console.log(`[DEBUG QuizService] Direct template load failed: ${templateError?.response?.status || templateError?.message || templateError}`);
        // Continue to the next approach
      }
      
      // Second attempt: Try to find all the quiz nodes in the path and then match by ID or templateId
      // This approach is more likely to work when we have permissions issues
      try {
        console.log(`[DEBUG QuizService] Second attempt: Searching in all path nodes`);
        const nodesResponse = await ApiService.get(`${API_URL}/api/paths/${pathId}/nodes`);
        
        if (!Array.isArray(nodesResponse)) {
          throw new Error('Invalid format: Path nodes response is not an array');
        }
        
        console.log(`[DEBUG QuizService] Found ${nodesResponse.length} nodes in path`);
        
        // Look for the node with this ID
        const matchedNode = nodesResponse.find(node => 
          node.id.toString() === quizId
        );
        
        if (!matchedNode) {
          console.warn(`[DEBUG QuizService] No node matching ID=${quizId} found among path nodes`);
          throw new Error('Quiz node not found in path');
        }
        
        console.log(`[DEBUG QuizService] Found matching node:`, {
          id: matchedNode.id, 
          type: matchedNode.node_type,
          title: matchedNode.title,
          contentKeys: matchedNode.content ? Object.keys(matchedNode.content) : [],
          resourceId: matchedNode.resource_id,
          contentData: matchedNode.content
        });
        
        // Logging dettagliato delle possibili fonti per l'ID del template
        if (matchedNode.resource_id) {
          console.log(`[DEBUG QuizService] Found resource_id in node: ${matchedNode.resource_id}`);
        }
        if (matchedNode.content?.quiz_id) {
          console.log(`[DEBUG QuizService] Found content.quiz_id in node: ${matchedNode.content.quiz_id}`);
        }
        if (matchedNode.content?.quiz_template_id) {
          console.log(`[DEBUG QuizService] Found content.quiz_template_id in node: ${matchedNode.content.quiz_template_id}`);
        }
        
        // IMPORTANTE: Utilizza il resource_id del nodo se disponibile per trovare il template
        let templateId = matchedNode.resource_id ? matchedNode.resource_id.toString() : 
                          (matchedNode.content?.quiz_id ? matchedNode.content.quiz_id.toString() : 
                           (matchedNode.content?.quiz_template_id ? matchedNode.content.quiz_template_id.toString() : null));
        
        console.log(`[DEBUG QuizService] Using templateId from node: ${templateId || 'none found'}`);
        
        let questions: Question[] = [];
        
        if (templateId) {
          // Try to load the template with that ID
          try {
            console.log(`[DEBUG QuizService] Node has template ID ${templateId}, attempting to load it`);
            const template = await this.getQuizTemplateById(templateId);
            questions = template.questions;
            console.log(`[DEBUG QuizService] Successfully loaded ${questions.length} questions from template ${templateId}`);
          } catch (templateError: any) {
            console.error(`[DEBUG QuizService] Error loading template ${templateId}:`, 
                         templateError?.response?.status || templateError?.message);
            
            // Create placeholder questions for the quiz
            questions = [{
              id: 'placeholder_q1',
              text: 'Questo quiz ha un problema: non è stato possibile caricare il template associato.',
              type: 'multiple_choice',
              options: [
                { id: 'placeholder_o1', text: 'Contattare l\'amministratore', isCorrect: true },
                { id: 'placeholder_o2', text: 'Riprovare più tardi', isCorrect: false }
              ],
              points: 1,
              explanation: 'Il quiz è in stato di errore. Contatta l\'amministratore del sistema.'
            }];
          }
        } else {
          // Node doesn't have a template ID, check if it has embedded questions
          if (matchedNode.content?.questions && Array.isArray(matchedNode.content.questions)) {
            console.log(`[DEBUG QuizService] Node has ${matchedNode.content.questions.length} embedded questions`);
            questions = normalizeQuestions(matchedNode.content.questions);
          } else {
            // No questions found, use placeholders
            console.warn('[DEBUG QuizService] Node has no template ID or embedded questions');
            questions = [{
              id: 'placeholder_q1',
              text: 'Questo quiz è incompleto: non contiene domande.',
              type: 'multiple_choice',
              options: [
                { id: 'placeholder_o1', text: 'Contattare l\'amministratore', isCorrect: true },
                { id: 'placeholder_o2', text: 'Tornare al percorso', isCorrect: false }
              ],
              points: 1,
              explanation: 'Il quiz è in stato di errore. Contatta l\'amministratore del sistema.'
            }];
          }
        }
        
        // Create a quiz object based on the node and any questions we found
        const quiz: Quiz = {
          id: matchedNode.id?.toString(),
          templateId: templateId || '',
          studentId: '',
          title: matchedNode.title || 'Quiz senza titolo',
          description: matchedNode.description || 'Nessuna descrizione disponibile',
          isCompleted: matchedNode.status?.toLowerCase().includes('complet') || false,
          score: matchedNode.score || matchedNode.points_awarded || 0,
          maxScore: questions.reduce((sum, q) => sum + (q.points || 1), 0),
          questions: questions,
          timeLimit: matchedNode.content?.time_limit || 0,
          pathId: pathId
        };
        
        console.log(`[DEBUG QuizService] Created quiz from matched node:`, {
          id: quiz.id,
          templateId: quiz.templateId,
          questionCount: quiz.questions.length
        });
        
        return quiz;
      } catch (pathError: any) {
        console.error(`[DEBUG QuizService] Error searching for quiz in path nodes:`, pathError);
        // Continue to next attempt
      }
      
      // Third attempt: Try to get the quiz directly from the path node
      try {
        console.log(`[DEBUG QuizService] Third attempt: Loading quiz directly from path node`);
        const response = await ApiService.get(`${API_URL}/api/paths/${pathId}/nodes/${quizId}`);
        
        console.log('[DEBUG QuizService] Path node response:', {
          id: response.id,
          type: response.node_type,
          resourceId: response.resource_id,
          contentKeys: response.content ? Object.keys(response.content) : [],
          contentData: response.content
        });
        
        // Logging dettagliato delle possibili fonti per l'ID del template
        if (response.resource_id) {
          console.log(`[DEBUG QuizService] Found resource_id in response: ${response.resource_id}`);
        }
        if (response.content?.quiz_id) {
          console.log(`[DEBUG QuizService] Found content.quiz_id in response: ${response.content.quiz_id}`);
        }
        if (response.content?.quiz_template_id) {
          console.log(`[DEBUG QuizService] Found content.quiz_template_id in response: ${response.content.quiz_template_id}`);
        }
        
        // Extract content from the node
        if (!response || !response.content) {
          throw new Error('Node response missing content');
        }
        
        // Create default questions if none are available
        let questions: Question[] = [];
        let title = response.title || 'Quiz senza titolo';
        let description = response.description || '';
        
        // IMPORTANTE: Prova prima a utilizzare resource_id se disponibile
        const templateId = response.resource_id ? response.resource_id.toString() : 
                          (response.content.quiz_id ? response.content.quiz_id.toString() : 
                           (response.content.quiz_template_id ? response.content.quiz_template_id.toString() : null));
        
        console.log(`[DEBUG QuizService] Using templateId from node response: ${templateId || 'none found'}`);
        
        if (response.content.questions && Array.isArray(response.content.questions)) {
          // The node already contains all the questions
          console.log('[DEBUG QuizService] Node contains embedded questions', response.content.questions.length);
          questions = response.content.questions;
        } else if (templateId) {
          // We need to get the questions from the template
          console.log('[DEBUG QuizService] Node references quiz template, trying to load template questions');
          try {
            // Try to load the quiz template to get the questions
            // But we'll still return the quiz in the context of the path node
            console.log(`[DEBUG QuizService] Loading questions from template ID: ${templateId}`);
            const template = await this.getQuizTemplateById(templateId);
            
            questions = template.questions;
            // Only use template title/description as fallback
            if (!title) title = template.title;
            if (!description) description = template.description;
            
            console.log('[DEBUG QuizService] Successfully loaded questions from template', questions.length);
          } catch (templateError: any) {
            console.error('[DEBUG QuizService] Failed to load template questions:', templateError);
            
            // Create placeholder questions if template couldn't be loaded
            if (templateError.response?.status === 404) {
              console.log('[DEBUG QuizService] Quiz template not found (404). Creating placeholder questions.');
              questions = [{
                id: 'placeholder_q1',
                text: 'Questo quiz ha un problema: il template associato non esiste.',
                type: 'multiple_choice',
                options: [
                  { id: 'placeholder_o1', text: 'Contattare l\'amministratore', isCorrect: true },
                  { id: 'placeholder_o2', text: 'Riprovare più tardi', isCorrect: false }
                ],
                points: 1,
                explanation: 'Il quiz è in stato di errore. Contatta l\'amministratore del sistema.'
              }];
            }
          }
        }
        
        // If we still don't have questions, create a default empty quiz
        if (!questions || !Array.isArray(questions) || questions.length === 0) {
          console.log('[DEBUG QuizService] No questions found, creating default quiz');
          questions = defaultQuestions();
        }
        
        // Construct a compatible quiz object with the data we have
        const quiz: Quiz = {
          id: quizId, // The node ID
          templateId: templateId || '', // Il templateId che abbiamo determinato
          studentId: '', // Not available in this context
          title: title,
          description: description,
          isCompleted: response.status?.toLowerCase().includes('complet') || false,
          score: response.score || 0,
          maxScore: response.max_score || 100,
          questions: normalizeQuestions(questions),
          timeLimit: response.content.time_limit || 0,
          pathId: pathId // Include the path ID for context
        };
        
        console.log(`[DEBUG QuizService] Successfully constructed quiz from path node:`, quiz);
        return quiz;
      } catch (pathError: any) {
        console.log(`[DEBUG QuizService] Third attempt failed:`, pathError?.message || pathError);
      }
      
      // If all previous attempts failed, return a default error quiz
      console.error(`[DEBUG QuizService] All attempts to load quiz failed, returning error quiz`);
      
      // Create a default quiz with error message
      const defaultQuiz: Quiz = {
        id: quizId,
        templateId: '',
        studentId: '',
        title: 'Quiz non disponibile',
        description: 'Non è stato possibile caricare il quiz. Il template potrebbe non esistere o potresti non avere il permesso di accedervi.',
        isCompleted: false,
        score: 0,
        maxScore: 100,
        questions: [{
          id: 'error_q1',
          text: 'Questo quiz non può essere caricato. Potrebbero esserci problemi con il template o i permessi di accesso.',
          type: 'multiple_choice',
          options: [
            { id: 'error_o1', text: 'Contattare l\'amministratore', isCorrect: true },
            { id: 'error_o2', text: 'Riprovare più tardi', isCorrect: false }
          ],
          points: 1,
          explanation: 'Il quiz è in stato di errore. Contatta l\'amministratore del sistema.'
        }],
        timeLimit: 0,
        pathId: pathId
      };
      
      return defaultQuiz;
    } catch (error: any) {
      console.error(`[DEBUG QuizService] Unexpected error in getPathQuiz:`, error);
      
      // Create a default quiz with error message
      const defaultQuiz: Quiz = {
        id: quizId,
        templateId: '',
        studentId: '',
        title: 'Errore durante il caricamento',
        description: 'Si è verificato un errore durante il caricamento del quiz.',
        isCompleted: false,
        score: 0,
        maxScore: 100,
        questions: [{
          id: 'error_q1',
          text: `Si è verificato un errore durante il caricamento del quiz: ${error.message || 'Errore sconosciuto'}`,
          type: 'multiple_choice',
          options: [
            { id: 'error_o1', text: 'Contattare l\'amministratore', isCorrect: true },
            { id: 'error_o2', text: 'Riprovare più tardi', isCorrect: false }
          ],
          points: 1,
          explanation: 'Il quiz è in stato di errore. Contatta l\'amministratore del sistema.'
        }],
        timeLimit: 0,
        pathId: pathId
      };
      
      return defaultQuiz;
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