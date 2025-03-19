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
  uuid?: string;
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
  uuid: string;
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
  quizUuid?: string;
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
  
  // Caso 1: options è un array di oggetti con proprietà text e isCorrect
  if (question.options && Array.isArray(question.options)) {
    options = question.options.map((opt: any) => ({
      id: opt.id || `option_${Math.random().toString(36).substring(2, 9)}`,
      text: typeof opt.text === 'string' ? opt.text : 'Opzione senza testo',
      isCorrect: opt.isCorrect === true || opt.is_correct === true
    }));
    console.log('Processate opzioni dal campo options:', options);
  } 
  // Caso 2: answer_options è un array di oggetti
  else if (question.answer_options && Array.isArray(question.answer_options)) {
    options = question.answer_options.map((opt: any) => ({
      id: opt.id || opt.uuid || `option_${Math.random().toString(36).substring(2, 9)}`,
      // Gestisci il caso in cui text potrebbe essere in una sottostruttura
      text: typeof opt.text === 'string' ? opt.text : 
            (opt.text_content ? opt.text_content : 
             (opt.content && typeof opt.content === 'string' ? opt.content : 'Opzione senza testo')),
      isCorrect: opt.isCorrect === true || opt.is_correct === true
    }));
    console.log('Processate opzioni dal campo answer_options:', options);
  }
  
  // Assicuriamoci che ci siano sempre opzioni per i tipi di domande che le richiedono
  const questionType = question.type || question.question_type || 'multiple_choice';
  if ((questionType === 'multiple_choice' || questionType === 'single_choice') && options.length === 0) {
    console.warn('Nessuna opzione trovata per la domanda, creazione di opzioni predefinite');
    options = [
      { id: `opt1_${Math.random().toString(36).substr(2, 9)}`, text: 'Opzione 1', isCorrect: false },
      { id: `opt2_${Math.random().toString(36).substr(2, 9)}`, text: 'Opzione 2', isCorrect: true }
    ];
  }
  
  // Log dettagliato delle opzioni per debug
  if (options.length > 0) {
    console.log('Esempio prima opzione dopo normalizzazione:', {
      id: options[0].id,
      text: options[0].text,
      isCorrect: options[0].isCorrect
    });
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
      
      return response.map((quiz: any) => {
        return {
          id: quiz.id,
          uuid: quiz.uuid || '',
          templateId: quiz.template_id,
          studentId: quiz.student_id,
          title: quiz.title,
          description: quiz.description,
          isCompleted: quiz.is_completed,
          startedAt: quiz.started_at ? new Date(quiz.started_at) : undefined,
          completedAt: quiz.completed_at ? new Date(quiz.completed_at) : undefined,
          score: quiz.score,
          maxScore: quiz.max_score,
          questions: [],
          timeLimit: quiz.time_limit
        };
      });
    } catch (error) {
      console.error('Errore nel recupero dei quiz assegnati:', error);
      throw error;
    }
  }

  /**
   * Ottiene un quiz specifico
   */
  public static async getQuiz(quizId: string): Promise<Quiz> {
    try {
      console.log('[DEBUG QuizService] Chiamata per ottenere quiz, percorso completo:', `${API_URL}/api/quizzes/${quizId}`);
      // Modifica: usiamo il percorso /api/quizzes/ che è quello gestito dal backend
      const response = await ApiService.get<any>(`${API_URL}/api/quizzes/${quizId}`);
      
      // Stampa la risposta grezza completa per debug
      console.log('[DEBUG QuizService] Risposta API GREZZA:', JSON.stringify(response));
      
      // Log dettagliato della risposta per verificare l'UUID
      console.log('[DEBUG QuizService] Risposta dal server per quiz:', {
        id: response.id,
        uuid: response.uuid,
        uuidPresent: !!response.uuid,
        uuidType: response.uuid ? typeof response.uuid : 'non presente',
        uuidLength: response.uuid ? response.uuid.length : 0,
        templateId: response.template_id,
        rawResponse: JSON.stringify(response).substring(0, 200) + '...'
      });
      
      return this.normalizeQuizData(response);
    } catch (error) {
      console.error(`[DEBUG QuizService] Errore nel caricamento del quiz ${quizId}:`, error);
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
            
            console.log(`[DEBUG QuizService] Found resource_id ${resourceId} for node ${quizId}:`, matchedNode);
            
            // Debug dettagliato della struttura del nodo
            console.log("[DEBUG QuizService] Node structure:", {
              id: matchedNode.id,
              type: matchedNode.node_type,
              contentKeys: matchedNode.content ? Object.keys(matchedNode.content) : [],
              hasResource: !!matchedNode.resource_id,
              resource_id: matchedNode.resource_id
            });
          }
        }
      } catch (error) {
        console.warn(`[DEBUG QuizService] Error pre-fetching node info: ${error}`);
        // Continua anche se non riesce a ottenere il resource_id
      }
      
      // IMPORTANTE: Se abbiamo un resource_id, carica il template dal servizio quiz
      if (resourceId) {
        try {
          console.log(`[DEBUG QuizService] Loading quiz template with resource_id: ${resourceId}`);
          
          // NUOVA IMPLEMENTAZIONE: carica direttamente la risorsa dal backend
          const response = await ApiService.get(`${API_URL}/api/quiz-templates/${resourceId}`);
          
          console.log(`[DEBUG QuizService] Direct API response for resource_id ${resourceId}:`, response);
          
          if (response && response.id) {
            // Normalizzazione corretta delle domande e opzioni
            const processedQuestions = response.questions.map((q: any) => {
              // Deep clone per evitare mutazioni indesiderate
              const processedQuestion = { ...q };
              
              // Assicurati che il tipo sia corretto
              processedQuestion.type = q.question_type || q.type || 'single_choice';
              
              // Assicurati che le opzioni siano in formato corretto
              if (q.answer_options && Array.isArray(q.answer_options)) {
                processedQuestion.options = q.answer_options.map((opt: any) => ({
                  id: opt.id || opt.uuid || `opt_${Math.random().toString(36).substr(2, 9)}`,
                  text: opt.text || 'Opzione senza testo',
                  isCorrect: opt.is_correct === true || opt.isCorrect === true
                }));
              } else if (q.options && Array.isArray(q.options)) {
                processedQuestion.options = q.options.map((opt: any) => ({
                  id: opt.id || `opt_${Math.random().toString(36).substr(2, 9)}`,
                  text: opt.text || 'Opzione senza testo',
                  isCorrect: opt.is_correct === true || opt.isCorrect === true
                }));
              } else {
                // Crea opzioni di default in base al tipo
                if (processedQuestion.type === 'true_false') {
                  processedQuestion.options = [
                    { id: `tf_true_${q.id}`, text: 'Vero', isCorrect: true },
                    { id: `tf_false_${q.id}`, text: 'Falso', isCorrect: false }
                  ];
                } else if (processedQuestion.type === 'single_choice' || processedQuestion.type === 'multiple_choice') {
                  processedQuestion.options = [
                    { id: `opt1_${q.id}`, text: 'Opzione 1', isCorrect: true },
                    { id: `opt2_${q.id}`, text: 'Opzione 2', isCorrect: false },
                    { id: `opt3_${q.id}`, text: 'Opzione 3', isCorrect: false }
                  ];
                }
              }
              
              // Aggiungi punti di default se mancanti
              processedQuestion.points = q.points || q.score || 1;
              
              return processedQuestion;
            });
            
            // Crea il quiz con i dati processati
            const quiz: Quiz = {
              id: quizId,
              uuid: response.uuid || '',
              templateId: response.id.toString(),
              studentId: '',
              title: response.title || 'Quiz senza titolo',
              description: response.description || 'Nessuna descrizione',
              isCompleted: false,
              score: 0,
              maxScore: processedQuestions.reduce((sum: number, q: any) => sum + (q.points || 1), 0),
              questions: processedQuestions,
              timeLimit: response.time_limit || 0,
              pathId: pathId
            };
            
            // Debug per verificare la struttura delle domande e opzioni
            if (processedQuestions.length > 0) {
              console.log(`[DEBUG QuizService] First question of processed quiz:`, {
                id: processedQuestions[0].id,
                text: processedQuestions[0].text,
                type: processedQuestions[0].type,
                optionsCount: processedQuestions[0].options?.length || 0,
                options: processedQuestions[0].options?.map((o: any) => ({
                  id: o.id,
                  text: o.text,
                  isCorrect: o.isCorrect
                }))
              });
            }
            
            console.log(`[DEBUG QuizService] Created quiz with ${processedQuestions.length} questions`);
            return quiz;
          }
        } catch (directError) {
          console.error(`[DEBUG QuizService] Error loading resource directly:`, directError);
          // Continua con gli altri metodi
        }
      }
      
      // Continua con l'implementazione originale se l'approccio diretto non funziona
      try {
        console.log(`[DEBUG QuizService] Falling back to original implementation`);
        let quizData: any = null;
        
        console.log(`[DEBUG QuizService] First attempt: Loading direct template. Using resource_id: ${resourceId || 'not found, using node id instead'}`);
        // IMPORTANTE: Passa il resource_id come override se disponibile
        const template = await this.getQuizTemplateById(quizId, resourceId || undefined);
        
        if (template && template.questions && template.questions.length > 0) {
          console.log(`[DEBUG QuizService] Successfully loaded template directly with ${template.questions.length} questions`);
          
          // NUOVA VERIFICA: Controlla che le opzioni delle domande abbiano il testo corretto
          let hasQuestionWithoutOptions = false;
          let hasOptionsWithoutText = false;
          
          template.questions.forEach((q, i) => {
            if (!Array.isArray(q.options) || q.options.length === 0) {
              console.warn(`[DEBUG QuizService] Question ${i} has no options`);
              hasQuestionWithoutOptions = true;
            } else {
              q.options.forEach((opt, j) => {
                if (!opt.text || typeof opt.text !== 'string' || opt.text.trim() === '') {
                  console.warn(`[DEBUG QuizService] Question ${i}, option ${j} has no text`);
                  hasOptionsWithoutText = true;
                }
              });
            }
          });
          
          if (hasQuestionWithoutOptions || hasOptionsWithoutText) {
            console.log(`[DEBUG QuizService] Found data issues in quiz. Re-normalizing questions...`);
            // Rinormalizza le domande per assicurarsi che le opzioni siano corrette
            template.questions = normalizeQuestions(template.questions);
          }
          
          // Create a quiz object from the template data
          const quiz: Quiz = {
            id: quizId,
            uuid: template.uuid || '',
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
          
          // Debug della prima domanda e delle sue opzioni
          if (quiz.questions.length > 0) {
            const firstQuestion = quiz.questions[0];
            console.log(`[DEBUG QuizService] First question:`, {
              id: firstQuestion.id,
              text: firstQuestion.text,
              type: firstQuestion.type,
              optionsCount: firstQuestion.options?.length || 0,
              firstOptionText: firstQuestion.options && firstQuestion.options.length > 0 
                ? firstQuestion.options[0].text : 'No options'
            });
          }
          
          console.log(`[DEBUG QuizService] Created quiz from direct template lookup:`, {
            id: quiz.id,
            templateId: quiz.templateId,
            questionCount: quiz.questions.length,
            firstQuestionText: quiz.questions.length > 0 ? quiz.questions[0].text : 'No questions',
            firstQuestionOptionsCount: quiz.questions.length > 0 && Array.isArray(quiz.questions[0].options) 
              ? quiz.questions[0].options.length 
              : 0,
            firstQuestionOptionText: quiz.questions.length > 0 && 
              Array.isArray(quiz.questions[0].options) && 
              quiz.questions[0].options.length > 0
              ? quiz.questions[0].options[0].text
              : 'No options'
          });
          
          return quiz;
        }
      } catch (templateError: any) {
        console.log(`[DEBUG QuizService] Template loading attempt failed: ${templateError?.response?.status || templateError?.message || templateError}`);
        // Continua con gli altri approcci
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
            
            // Verifica le domande e le opzioni anche qui
            let hasIssuesWithQuestions = false;
            
            questions.forEach((q, i) => {
              // Controlla domande senza opzioni per tipi che richiedono opzioni
              if ((q.type === 'multiple_choice' || q.type === 'single_choice') && 
                  (!Array.isArray(q.options) || q.options.length === 0)) {
                console.warn(`[DEBUG QuizService] Question ${i} has no options but type requires them`);
                hasIssuesWithQuestions = true;
              }
              
              // Controlla opzioni senza testo
              if (Array.isArray(q.options)) {
                q.options.forEach((opt, j) => {
                  if (!opt.text || typeof opt.text !== 'string' || opt.text.trim() === '') {
                    console.warn(`[DEBUG QuizService] Question ${i}, option ${j} has empty text`);
                    hasIssuesWithQuestions = true;
                  }
                });
              }
            });
            
            if (hasIssuesWithQuestions) {
              console.log(`[DEBUG QuizService] Found issues with questions/options. Re-normalizing...`);
              questions = normalizeQuestions(questions);
            }
            
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
            
            // Aggiunta del log dettagliato della struttura delle domande e opzioni
            if (matchedNode.content.questions.length > 0) {
              const sampleQuestion = matchedNode.content.questions[0];
              console.log(`[DEBUG QuizService] Sample question structure:`, {
                id: sampleQuestion.id,
                text: sampleQuestion.text,
                type: sampleQuestion.type || sampleQuestion.question_type,
                optionsProperty: Object.keys(sampleQuestion).find(key => 
                  key.includes('option') || key.includes('answer')),
                optionsType: sampleQuestion.options ? 
                  `Array with ${sampleQuestion.options.length} items` : 
                  (sampleQuestion.answer_options ? 
                   `Array with ${sampleQuestion.answer_options.length} items` : 'Not found')
              });
              
              // Se ha answer_options, mostra un campione
              if (sampleQuestion.answer_options && sampleQuestion.answer_options.length > 0) {
                console.log(`[DEBUG QuizService] Sample answer_option structure:`, 
                           sampleQuestion.answer_options[0]);
              }
              // Se ha options, mostra un campione
              else if (sampleQuestion.options && sampleQuestion.options.length > 0) {
                console.log(`[DEBUG QuizService] Sample option structure:`, 
                           sampleQuestion.options[0]);
              }
            }
            
            questions = normalizeQuestions(matchedNode.content.questions);
          } else {
            console.error(`[DEBUG QuizService] Node doesn't have a template or embedded questions`);
            throw new Error('Quiz content not found');
          }
        }
        
        // Create a quiz object based on the node and any questions we found
        const quiz: Quiz = {
          id: matchedNode.id?.toString(),
          uuid: matchedNode.uuid || '',
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
          uuid: response.uuid || '',
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
        uuid: '',
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
        uuid: '',
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

  // Cerca di ottenere il tentativo UUID dai dati del quiz
  private static async tryGetQuizUuid(quizId: string): Promise<string | undefined> {
    try {
      // Prima tenta di usare l'API per ottenere il quiz
      console.log('[DEBUG UUID] Tentativo di trovare l\'UUID per quiz ' + quizId);
      
      // Prova prima con getQuiz
      try {
        console.log('[DEBUG UUID] Tentativo 1: getQuiz');
        const quizData = await this.getQuiz(quizId);
        if (quizData?.uuid && quizData.uuid.includes('-')) {
          console.log('[DEBUG UUID] Trovato UUID via getQuiz:', quizData.uuid);
          return quizData.uuid;
        } else {
          console.log('[DEBUG UUID] getQuiz non ha prodotto un UUID valido:', quizData?.uuid);
        }
      } catch (error) {
        console.error('[DEBUG UUID] Errore nel recupero quiz:', error);
      }
      
      // Prova con l'endpoint degli attempts
      try {
        console.log('[DEBUG UUID] Tentativo 2: ricerca tra tentativi esistenti');
        const apiUrl = `${API_URL}/quiz-attempts?quiz_id=${quizId}`;
        const attempts = await ApiService.get<any[]>(apiUrl);
        
        if (Array.isArray(attempts) && attempts.length > 0) {
          const latestAttempt = attempts[0];
          if (latestAttempt?.uuid && latestAttempt.uuid.includes('-')) {
            console.log('[DEBUG UUID] Trovato UUID nei tentativi esistenti:', latestAttempt.uuid);
            return latestAttempt.uuid;
          }
        } else {
          console.log('[DEBUG UUID] Nessun tentativo esistente trovato');
        }
      } catch (error) {
        console.error('[DEBUG UUID] Errore nella ricerca tentativi:', error);
      }
      
      // Come ultima risorsa, crea un nuovo tentativo
      try {
        console.log('[DEBUG UUID] Tentativo 3: creazione nuovo tentativo');
        const attemptResponse = await ApiService.post<any>(
          `${API_URL}/quiz-attempts`,
          { quiz_id: parseInt(quizId) }
        );
        
        if (attemptResponse && attemptResponse.uuid && attemptResponse.uuid.includes('-')) {
          console.log('[DEBUG UUID] Creato nuovo tentativo con UUID:', attemptResponse.uuid);
          return attemptResponse.uuid;
        } else {
          console.log('[DEBUG UUID] Creazione tentativo non ha prodotto UUID valido:', attemptResponse?.uuid);
        }
      } catch (error) {
        console.error('[DEBUG UUID] Errore nella creazione tentativo:', error);
      }
      
      console.log('[DEBUG UUID] Tutti i tentativi di ottenere UUID falliti');
      return undefined;
    } catch (error) {
      console.error('[DEBUG UUID] Errore globale nel recupero UUID:', error);
      return undefined;
    }
  }

  /**
   * Invia le risposte del quiz
   */
  public static async submitQuiz(quizId: string, submission: QuizSubmission): Promise<QuizResult> {
    try {
      console.log(`[DEBUG QuizService] Preparazione invio quiz ${quizId}`);
      
      // Verifica se abbiamo già un UUID valido nella submission
      let quizUuid = submission.quizUuid;
      console.log(`[DEBUG QuizService] UUID nella submission:`, {
        uuid: quizUuid,
        valido: quizUuid && quizUuid.includes('-')
      });
      
      // Se non abbiamo un UUID valido, dobbiamo ottenerlo
      if (!quizUuid || !quizUuid.includes('-')) {
        console.log('[DEBUG QuizService] UUID non valido o non fornito nella submission, tentativo di ottenerne uno');
        
        // Prima prova con tryGetQuizUuid
        quizUuid = await this.tryGetQuizUuid(quizId);
        
        if (!quizUuid || !quizUuid.includes('-')) {
          console.log('[DEBUG QuizService] Primo tentativo fallito, provo a creare un nuovo tentativo');
          // Se il primo tentativo fallisce, prova a crearne uno nuovo
          quizUuid = await this.getOrCreateQuizAttempt(quizId);
        }
        
        if (quizUuid && quizUuid.includes('-')) {
          console.log('[DEBUG QuizService] Ottenuto UUID valido:', quizUuid);
        } else {
          // Se non siamo riusciti a ottenere un UUID valido, non possiamo procedere
          console.error('[DEBUG QuizService] Impossibile ottenere un UUID valido per il quiz');
          throw new Error('Impossibile ottenere un UUID valido per il quiz. Riprova più tardi.');
        }
      }
      
      // A questo punto abbiamo un UUID valido o abbiamo lanciato un'eccezione
      console.log(`[DEBUG QuizService] Procedo con l'invio usando UUID: ${quizUuid}`);
      
      // Adatta il formato delle risposte per rispettare le aspettative dell'API
      const formattedSubmission = {
        quiz_id: quizId,
        answers: submission.answers.map(answer => ({
          question_id: answer.questionId,
          selected_option_id: answer.selectedOptionId,
          text_answer: answer.textAnswer
        }))
      };
      
      console.log('[DEBUG QuizService] Dati formattati per invio:', {
        endpoint: `/quiz-attempts/${quizUuid}/submit`,
        dati: formattedSubmission
      });
      
      // Usa l'endpoint SENZA il prefisso /api/ come richiesto dal backend
      const response = await ApiService.post<QuizResult>(
        `${API_URL}/quiz-attempts/${quizUuid}/submit`,
        formattedSubmission
      );
      
      console.log('[DEBUG QuizService] Risposta invio quiz:', response);
      
      NotificationsService.success(
        `Quiz completato con punteggio: ${response.score}/${response.maxScore}`,
        'Quiz completato'
      );
      
      return response;
    } catch (error) {
      console.error(`[DEBUG QuizService] Errore di invio quiz ${quizId}:`, error);
      
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
      console.log(`[DEBUG QuizService] Preparazione invio quiz ${quizId} nel percorso ${pathId}`);
      
      // Primo passo: ottenere un UUID valido
      let quizUuid = submission.quizUuid;
      console.log(`[DEBUG QuizService] UUID nella submission:`, {
        uuid: quizUuid,
        valido: quizUuid && quizUuid.includes('-')
      });
      
      // Se non abbiamo un UUID valido, dobbiamo ottenerlo
      if (!quizUuid || !quizUuid.includes('-')) {
        console.log('[DEBUG QuizService] UUID non valido, tentativo di ottenerlo');
        
        // Prima prova con tryGetQuizUuid
        quizUuid = await this.tryGetQuizUuid(quizId);
        
        if (!quizUuid || !quizUuid.includes('-')) {
          console.log('[DEBUG QuizService] Primo tentativo fallito, provo a creare un nuovo tentativo');
          quizUuid = await this.getOrCreateQuizAttempt(quizId);
        }
        
        if (quizUuid && quizUuid.includes('-')) {
          console.log('[DEBUG QuizService] Ottenuto UUID valido:', quizUuid);
        } else {
          // Se non siamo riusciti a ottenere un UUID valido, non possiamo procedere
          console.error('[DEBUG QuizService] Impossibile ottenere un UUID valido per il quiz nel percorso');
          throw new Error('Impossibile ottenere un UUID valido per il quiz. Riprova più tardi.');
        }
      }
      
      // Adatta il formato delle risposte per rispettare le aspettative dell'API
      const formattedSubmission = {
        quiz_id: quizId,
        answers: submission.answers.map(answer => ({
          question_id: answer.questionId,
          selected_option_id: answer.selectedOptionId,
          text_answer: answer.textAnswer
        }))
      };
      
      console.log('[DEBUG QuizService] Dati formattati per invio:', {
        endpoint: `/quiz-attempts/${quizUuid}/submit`,
        pathId: pathId,
        dati: formattedSubmission
      });
      
      // Invia le risposte tramite l'endpoint con UUID
      const response = await ApiService.post<QuizResult>(
        `${API_URL}/quiz-attempts/${quizUuid}/submit`,
        formattedSubmission
      );
      
      console.log('[DEBUG QuizService] Risposta invio quiz nel percorso:', response);
      
      NotificationsService.success(
        `Quiz completato con punteggio: ${response.score}/${response.maxScore}`,
        'Quiz completato'
      );
      
      return response;
    } catch (error) {
      console.error(`[DEBUG QuizService] Errore durante l'invio delle risposte per il quiz ${quizId} nel percorso ${pathId}:`, error);
      
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
    console.log('[DEBUG QuizService] Normalizzazione dati quiz - dati originali:', {
      id: data.id,
      uuid: data.uuid,
      rawUuid: JSON.stringify(data.uuid),
      hasUuid: 'uuid' in data,
      template_id: data.template_id,
      is_completed: data.is_completed
    });
    
    // Gestisce il caso in cui i dati provengano da un nodo percorso
    let quizData = data;
    
    // Verifica speciale per UUID
    if (!quizData.uuid) {
      console.log('[DEBUG QuizService] ATTENZIONE: UUID non trovato nei dati originali. Cerco alternative...');
      
      // Cerca UUID in altre possibili proprietà (per API inconsistenti)
      const possibleUuidFields = ['uuid', 'id_uuid', 'quiz_uuid', 'attempt_uuid'];
      for (const field of possibleUuidFields) {
        if (quizData[field] && typeof quizData[field] === 'string' && quizData[field].includes('-')) {
          console.log(`[DEBUG QuizService] Trovato UUID alternativo in ${field}: ${quizData[field]}`);
          quizData.uuid = quizData[field];
          break;
        }
      }
      
      // Se ancora non abbiamo un UUID, guarda nei campi che rappresentano frammenti annidati
      if (!quizData.uuid) {
        if (quizData.quiz && quizData.quiz.uuid) {
          console.log(`[DEBUG QuizService] Trovato UUID in quiz.uuid: ${quizData.quiz.uuid}`);
          quizData.uuid = quizData.quiz.uuid;
        } else if (quizData.attempt && quizData.attempt.uuid) {
          console.log(`[DEBUG QuizService] Trovato UUID in attempt.uuid: ${quizData.attempt.uuid}`);
          quizData.uuid = quizData.attempt.uuid;
        }
      }
    }
    
    // Scenario 1: Nodo percorso con content.quiz_id
    if (data.content && data.content.quiz_id) {
      // Se è un nodo percorso, estraiamo i dati del quiz dal contenuto
      quizData = {
        ...data.content,
        id: data.content.quiz_id || data.id,
        uuid: quizData.uuid, // Preserva l'UUID che abbiamo recuperato
        title: data.title || data.content.title || 'Quiz senza titolo',
        description: data.description || data.content.description || 'Nessuna descrizione',
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
        uuid: quizData.uuid, // Preserva l'UUID che abbiamo recuperato
        quiz_id: data.quiz_id || data.id,
        title: data.title || 'Quiz senza titolo',
        description: data.description || 'Nessuna descrizione',
        questions: data.questions || []
      };
      console.log('Estratti dati da nodo quiz diretto:', quizData);
    }
    // Scenario 3: Il nodo è un quiz template diretto
    else if (data.template_id || data.templateId) {
      quizData = {
        ...data,
        uuid: quizData.uuid // Preserva l'UUID che abbiamo recuperato
      };
      console.log('Quiz è già in formato template');
    }
    // Scenario 4: Formato risposta API non riconosciuto, prova a recuperare comunque qualche informazione
    else {
      console.log('Formato dati quiz non riconosciuto, tentativo di recupero dati');
      quizData = {
        ...data,
        uuid: quizData.uuid, // Preserva l'UUID che abbiamo recuperato
        id: data.id || data.uuid || data.quiz_id || `quiz_${Date.now()}`,
        title: data.title || 'Quiz',
        description: data.description || 'Descrizione non disponibile'
      };
    }
    
    // Normalizza le domande
    let questions: Question[] = [];
    
    // Debug del percorso delle domande
    console.log('Tentativi di estrazione domande:');
    if (quizData.questions) {
      console.log('- Da quizData.questions:', Array.isArray(quizData.questions) ? 
                 `Array con ${quizData.questions.length} elementi` : typeof quizData.questions);
    }
    if (quizData.content && quizData.content.questions) {
      console.log('- Da quizData.content.questions:', Array.isArray(quizData.content.questions) ? 
                 `Array con ${quizData.content.questions.length} elementi` : typeof quizData.content.questions);
    }
    
    // Tenta di estrarre le domande da tutte le possibili posizioni/formati
    if (quizData.questions) {
      if (Array.isArray(quizData.questions)) {
        questions = normalizeQuestions(quizData.questions);
      } else if (typeof quizData.questions === 'object') {
        questions = normalizeQuestions([quizData.questions]);
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
    } else {
      console.log(`Normalizzate ${questions.length} domande. Prima domanda:`, {
        id: questions[0].id,
        text: questions[0].text,
        opzioni: questions[0].options ? 
          `${questions[0].options.length} opzioni` + 
          (questions[0].options.length > 0 ? 
           ` (prima: ${questions[0].options[0].text})` : '') : 
          'nessuna'
      });
    }
    
    // Calcola il punteggio massimo
    const maxScore = questions.reduce((sum: number, q: any) => sum + (q.points || 1), 0);
    
    const result: Quiz = {
      id: quizData.id || quizData.uuid || '',
      uuid: quizData.uuid || '',
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
    
    // Prima di restituire, verifichiamo i dati normalizzati
    console.log('[DEBUG QuizService] Quiz normalizzato - verifica UUID:', {
      id: result.id,
      uuid: result.uuid,
      uuidLength: result.uuid ? result.uuid.length : 0,
      hasValidUuid: result.uuid && result.uuid.includes('-')
    });
    
    // Se ancora non abbiamo un UUID valido, proviamo a generarne uno per il debug
    if (!result.uuid || !result.uuid.includes('-')) {
      console.log('[DEBUG QuizService] ATTENZIONE: UUID mancante o non valido dopo normalizzazione!');
      
      // Genera un UUID fittizio per il debug
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEBUG QuizService] Generazione UUID fittizio per debug');
        // Genera un UUID v4 semplificato
        result.uuid = 'debug-' + Math.random().toString(36).substring(2, 15) + 
                       '-' + Math.random().toString(36).substring(2, 15) +
                       '-' + Date.now().toString(36);
        console.log('[DEBUG QuizService] UUID fittizio generato:', result.uuid);
      }
    }
    
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

  /**
   * Ottiene o crea un tentativo di quiz specificando l'ID del quiz
   * L'endpoint restituirà un UUID che possiamo usare per l'invio
   */
  public static async getOrCreateQuizAttempt(quizId: string): Promise<string | undefined> {
    try {
      console.log('[DEBUG QuizService] Tentativo di ottenere o creare un nuovo tentativo per il quiz', quizId);
      
      // Prima prova a ottenere i tentativi esistenti
      try {
        // Assicuriamoci che quiz_id sia in formato numerico per la ricerca
        const numericQuizId = !isNaN(parseInt(quizId)) ? parseInt(quizId) : quizId;
        console.log(`[DEBUG QuizService] Cerco tentativi esistenti per quiz_id=${numericQuizId}`);
        
        const attempts = await ApiService.get<any[]>(`${API_URL}/quiz-attempts?quiz_id=${numericQuizId}`);
        
        if (Array.isArray(attempts) && attempts.length > 0 && attempts[0].uuid) {
          console.log('[DEBUG QuizService] Trovato tentativo esistente:', attempts[0].uuid);
          return attempts[0].uuid;
        } else {
          console.log('[DEBUG QuizService] Nessun tentativo esistente trovato');
        }
      } catch (err) {
        console.error('[DEBUG QuizService] Errore nel recupero dei tentativi esistenti:', err);
      }
      
      // Se non ci sono tentativi esistenti, crea un nuovo tentativo
      try {
        // Formato dati per la richiesta in base allo schema QuizAttemptCreate
        const numericQuizId = !isNaN(parseInt(quizId)) ? parseInt(quizId) : quizId;
        
        // Il formato corretto richiede quiz_id come intero (non stringa)
        const requestBody = {
          quiz_id: numericQuizId,
          started_at: new Date().toISOString(), // Aggiungiamo il timestamp di inizio
          completed_at: null,
          score: 0.0,
          max_score: 0.0,
          passed: false,
          additional_data: null
        };
        
        console.log('[DEBUG QuizService] Creazione tentativo - corpo richiesta:', requestBody);
        
        try {
          // Usa il formato con l'ID del quiz nell'URL invece che nel body 
          const response = await ApiService.post<any>(
            `${API_URL}/quizzes/${numericQuizId}/attempt`,
            {}
          );
          
          console.log('[DEBUG QuizService] Risposta creazione tentativo (format 1):', response);
          if (response && response.uuid) {
            console.log('[DEBUG QuizService] Creato nuovo tentativo con UUID:', response.uuid);
            return response.uuid;
          }
        } catch (firstError) {
          console.error('[DEBUG QuizService] Errore nel primo formato di tentativo:', firstError);
          
          try {
            console.log('[DEBUG QuizService] Tentativo alternativo con quiz_id nel body');
            const response = await ApiService.post<any>(
              `${API_URL}/quiz-attempts`,
              requestBody
            );
            
            if (response && response.uuid) {
              console.log('[DEBUG QuizService] Creato nuovo tentativo con UUID (format 2):', response.uuid);
              return response.uuid;
            }
          } catch (secondError) {
            console.error('[DEBUG QuizService] Errore anche nel secondo tentativo:', secondError);
            
            // Ultimo tentativo: format 3 - con solo quiz_id come required field
            try {
              console.log('[DEBUG QuizService] Ultimo tentativo: solo quiz_id');
              const response = await ApiService.post<any>(
                `${API_URL}/quiz-attempts`,
                { quiz_id: numericQuizId }
              );
              
              if (response && response.uuid) {
                console.log('[DEBUG QuizService] Creato nuovo tentativo con UUID (format 3):', response.uuid);
                return response.uuid;
              }
            } catch (thirdError) {
              console.error('[DEBUG QuizService] Tutti i tentativi di creazione falliti:', thirdError);
            }
          }
        }
        
        console.warn('[DEBUG QuizService] Tutti i tentativi di creazione sono falliti');
        return undefined;
      } catch (err) {
        console.error('[DEBUG QuizService] Errore nella creazione di un nuovo tentativo:', err);
        return undefined;
      }
    } catch (err) {
      console.error('[DEBUG QuizService] Errore globale in getOrCreateQuizAttempt:', err);
      return undefined;
    }
  }
}

// Esportiamo direttamente la classe QuizService come default export
export default QuizService;