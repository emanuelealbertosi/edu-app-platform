import ApiService from './ApiService';
import { NotificationsService } from './NotificationsService';

// Fix per errore lint: "Cannot find name 'process'"
declare const process: {
  env: {
    REACT_APP_API_URL?: string;
  };
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const QUIZ_API_URL = `${API_URL}/quiz`;

/**
 * Interfaccia per un'opzione di risposta
 */
export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
  additional_data?: { [key: string]: any };
}

/**
 * Interfaccia per un'opzione di risposta del backend (formato differente)
 */
export interface BackendOption {
  id?: string;
  text?: string;
  is_correct?: boolean;
  additional_data?: { [key: string]: any };
  [key: string]: any; // Per permettere altri campi sconosciuti
}

/**
 * Interfaccia per una domanda di quiz
 */
export interface Question {
  id: string;
  text: string;
  options: Array<Option>;
  timeLimit?: number;
  points: number;
  type: 'single_choice' | 'multiple_choice' | 'true_false' | 'numeric';
  score: number;
  explanation?: string;
  correctAnswer?: string | number; // Per domande numeriche
  answer_options?: Array<BackendOption>; // Formato backend per le opzioni
  additional_data?: { [key: string]: any }; // Dati aggiuntivi generici
  [key: string]: any; // Per permettere altri campi sconosciuti dal backend
}

export interface QuizTemplate {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  totalQuestions: number;
  totalPoints: number;
  estimatedTime: number;
  questions: Question[];
  isPublic?: boolean; // Indica se il quiz è pubblico o privato
  subject: string;
  difficultyLevel: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  passingScore: number;
  createdAt?: string;
  updatedAt?: string;
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
  score?: number;
  maxScore: number;
  questions: Question[];
}

export interface QuizAnswer {
  questionId: string;
  selectedOptionId: string;
  timeSpent: number; // Tempo in secondi
}

export interface QuizSubmission {
  quizId: string;
  answers: QuizAnswer[];
}

export interface QuizResult {
  quizId: string;
  studentId: string;
  score: number;
  maxScore: number;
  completedAt: Date;
  answers: Array<{
    questionId: string;
    selectedOptionId: string;
    isCorrect: boolean;
    points: number;
    timeSpent: number;
  }>;
}

/**
 * Servizio per la gestione dei quiz
 */
// Funzione helper per normalizzare una singola domanda
function normalizeQuestion(question: any): Question {
  console.log('Normalizzazione domanda:', question);
  
  // Se question è una stringa o un oggetto vuoto o nullo, restituisci una domanda predefinita
  if (!question || typeof question === 'string' || Object.keys(question).length === 0) {
    return {
      id: `question-${Math.random().toString(36).substring(2, 11)}`,
      text: typeof question === 'string' ? question : 'Nuova domanda',
      options: [
        { id: 'option-1', text: 'Opzione 1', isCorrect: true },
        { id: 'option-2', text: 'Opzione 2', isCorrect: false },
        { id: 'option-3', text: 'Opzione 3', isCorrect: false },
        { id: 'option-4', text: 'Opzione 4', isCorrect: false }
      ],
      timeLimit: 0,
      points: 1,
      type: 'single_choice',
      score: 1,
      explanation: '',
      correctAnswer: undefined
    };
  }
  
  // Gestiamo diverse strutture di opzioni che potrebbero arrivare dal backend
  let optionsArray = [];
  
  // Caso 1: options è già un array
  if (Array.isArray(question.options)) {
    console.log('Trovate opzioni come array:', question.options);
    optionsArray = question.options;
  }
  // Caso 2: answers è un array (alcuni backend usano questa struttura)
  else if (Array.isArray(question.answers)) {
    console.log('Trovate opzioni come answers array:', question.answers);
    optionsArray = question.answers;
  }
  // Caso 3: choices è un array (alcuni backend usano questa struttura)
  else if (Array.isArray(question.choices)) {
    console.log('Trovate opzioni come choices array:', question.choices);
    optionsArray = question.choices;
  }
  // Caso 4: options è un oggetto che dobbiamo convertire in array
  else if (question.options && typeof question.options === 'object' && !Array.isArray(question.options)) {
    console.log('Trovate opzioni come oggetto:', question.options);
    optionsArray = Object.keys(question.options).map(key => ({
      id: key,
      text: question.options[key],
      isCorrect: key === question.correct_answer || key === question.correctAnswer
    }));
  }
  // Caso 5: non sono state trovate opzioni, creiamo alcune opzioni di default
  else {
    console.log('Nessuna opzione trovata, creando opzioni di default');
    // Per True/False o se non ci sono opzioni, creiamo opzioni di default
    const rawType = question.type || question.question_type || '';
    if (rawType.includes('true') || rawType.includes('false') || rawType === 'boolean') {
      optionsArray = [
        { id: 'true', text: 'Vero', isCorrect: question.correct_answer === true },
        { id: 'false', text: 'Falso', isCorrect: question.correct_answer === false }
      ];
    } else {
      // Per altri tipi, creiamo 4 opzioni vuote
      optionsArray = [
        { id: 'option-1', text: 'Opzione 1', isCorrect: true },
        { id: 'option-2', text: 'Opzione 2', isCorrect: false },
        { id: 'option-3', text: 'Opzione 3', isCorrect: false },
        { id: 'option-4', text: 'Opzione 4', isCorrect: false }
      ];
    }
  }
  
  // Normalizza le opzioni di risposta
  const normalizedOptions = optionsArray.map((option: any) => {
    // Debug dell'opzione ricevuta
    console.log('[DEBUG] Opzione da normalizzare:', option);
    
    // Se option è solo una stringa, convertiamola in oggetto
    if (typeof option === 'string') {
      return {
        id: `option-${Math.random().toString(36).substring(2, 11)}`,
        text: option,
        isCorrect: false,
        additional_data: {}
      };
    }
    
    // Se l'opzione è un oggetto vuoto o nullo, crea un'opzione predefinita
    if (!option || Object.keys(option).length === 0) {
      return {
        id: `option-${Math.random().toString(36).substring(2, 11)}`,
        text: 'Opzione predefinita',
        isCorrect: false,
        additional_data: {}
      };
    }
    
    // Gestisci opzioni che potrebbero provenire da answer_options del backend
    if (option.answer_options && Array.isArray(option.answer_options)) {
      console.log('[DEBUG] Trovate answer_options annidate nell\'opzione!');
      return option.answer_options.map((ao: any) => ({
        id: ao.id || `option-${Math.random().toString(36).substring(2, 11)}`,
        text: ao.text || 'Opzione senza testo',
        isCorrect: ao.is_correct !== undefined ? ao.is_correct : false,
        additional_data: ao.additional_data || {}
      }));
    }
    
    // Opzione normale
    const normalizedOption = {
      id: option.id || option.value || `option-${Math.random().toString(36).substring(2, 11)}`,
      text: option.text || option.label || String(option.value || ''),
      isCorrect: option.is_correct !== undefined ? option.is_correct : 
                (option.isCorrect !== undefined ? option.isCorrect : 
                (option.correct !== undefined ? option.correct : false)),
      additional_data: option.additional_data || {}
    };
    
    console.log('[DEBUG] Opzione normalizzata:', normalizedOption);
    return normalizedOption;
  });
  
  // Appiattisci l'array nel caso ci fossero opzioni annidate
  const flattenedOptions = normalizedOptions.flat();
  
  if (flattenedOptions.length !== normalizedOptions.length) {
    console.log('[DEBUG] Opzioni appiattite da struttura annidata:', {
      prima: normalizedOptions.length,
      dopo: flattenedOptions.length
    });
  }
  
  console.log('Opzioni normalizzate:', normalizedOptions);
  
  // Tratta il tipo di domanda in modo coerente
  let questionType: 'single_choice' | 'multiple_choice' | 'true_false' | 'numeric' = 'single_choice';
  const rawType = question.type || question.question_type;
  
  if (rawType) {
    if (rawType.includes('multiple') || rawType === 'checkbox') {
      questionType = 'multiple_choice';
    } else if (rawType.includes('true') || rawType.includes('false') || rawType === 'boolean') {
      questionType = 'true_false';
    } else if (rawType.includes('numeric') || rawType === 'number') {
      questionType = 'numeric';
    } else {
      questionType = 'single_choice';
    }
  }
  
  // Determinare il punteggio
  const points = Number(question.points || question.score || question.value || 1);
  
  // Verifica opzioni nidificate in answer_options
  let finalOptions = flattenedOptions;
  
  // Se non ci sono opzioni ma ci sono answer_options, usale
  if (finalOptions.length === 0 && question.answer_options && Array.isArray(question.answer_options)) {
    console.log('[DEBUG] Nessuna opzione trovata, ma ci sono answer_options:', question.answer_options.length);
    finalOptions = question.answer_options.map((ao: any) => ({
      id: ao.id || `option-${Math.random().toString(36).substring(2, 11)}`,
      text: ao.text || 'Opzione senza testo',
      isCorrect: ao.is_correct !== undefined ? ao.is_correct : false,
      additional_data: ao.additional_data || {}
    }));
  }
  
  // Preserva eventuali campi addizionali che potrebbero essere utili
  const result = {
    id: question.id || question._id || `question-${Math.random().toString(36).substring(2, 11)}`,
    text: question.text || question.question_text || question.title || question.stem || '',
    options: finalOptions,
    timeLimit: Number(question.time_limit || question.timeLimit || 0),
    points: points,
    type: questionType,
    score: Number(question.score || points),
    explanation: question.explanation || question.feedback || '',
    correctAnswer: question.correct_answer || question.correctAnswer || question.answer,
    // Preserva campi aggiuntivi che potrebbero servire per il backend
    additional_data: question.additional_data || {}
  };
  
  console.log(`[DEBUG] Domanda normalizzata: "${result.text.substring(0, 20)}..." con ${result.options.length} opzioni`);
  return result;
}

// Funzione per normalizzare un array di domande
function normalizeQuestions(questions: any[]): Question[] {
  if (!Array.isArray(questions)) {
    console.warn('Le domande non sono in formato array:', questions);
    return [];
  }
  
  const normalizedQuestions = questions.map(normalizeQuestion);
  console.log('DOMANDE NORMALIZZATE:', normalizedQuestions.map(q => ({
    id: q.id,
    text: q.text,
    options: q.options.length > 0 ? `${q.options.length} opzioni` : 'Nessuna opzione',
    optionsDettagli: q.options
  })));
  
  return normalizedQuestions;
}

class QuizService {
  // Rimuovere il riferimento all'AxiosInstance che causa errore di tipo
  constructor() {
    // ApiService gestisce tutto internamente
  }

  // OPERAZIONI SUI TEMPLATE DI QUIZ
  /**
   * Ottiene tutti i template di quiz disponibili
   * Solo admin può vedere tutti i template
   */
  public async getAllQuizTemplates(): Promise<QuizTemplate[]> {
    // Array di percorsi possibili da provare in ordine
    const possiblePaths = [
      '/api/quiz/templates',
      '/api/quiz/v1/templates',
      '/api/quiz'
    ];
    
    // Flag per tracciare se abbiamo già mostrato un messaggio di errore
    let errorShown = false;
    
    // Prova ogni percorso in sequenza
    for (const path of possiblePaths) {
      try {
        console.log(`Tentativo di accesso al percorso: ${path}`);
        const rawData = await ApiService.get<any[]>(`${API_URL}${path}`);
        console.log(`Successo con il percorso: ${path}`);
        
        // Normalizza i dati ricevuti dal backend
        const normalizedTemplates = rawData.map(item => {
          // Mappa difficulty_level numerico (1,2,3) a difficultyLevel stringa (easy,medium,hard)
          let difficultyLevel: 'easy' | 'medium' | 'hard' = 'medium';
          
          // Se esiste il campo difficulty_level (numerico)
          if (item.difficulty_level !== undefined) {
            // Mappa i valori numerici a stringhe
            switch(Number(item.difficulty_level)) {
              case 1: difficultyLevel = 'easy'; break;
              case 2: difficultyLevel = 'medium'; break;
              case 3: difficultyLevel = 'hard'; break;
              default: difficultyLevel = 'medium'; break;
            }
          } else if (item.difficultyLevel) {
            // Usa il valore stringa esistente se presente
            difficultyLevel = item.difficultyLevel;
          }
          
          // Mappatura per materie
          let subject = '';
          
          // Prima controlla se abbiamo un category_id per mappare la materia correttamente
          // La priorità va al category_id per una mappatura uniforme
          if (item.category_id || item.categoryId) {
            // Mappa l'ID numerico della categoria al nome della materia con prima lettera maiuscola
            const categoryId = item.category_id || item.categoryId;
            switch(Number(categoryId)) {
              case 1: subject = 'Matematica'; break;
              case 2: subject = 'Italiano'; break;
              case 3: subject = 'Scienze'; break;
              case 4: subject = 'Storia'; break;
              case 5: subject = 'Geografia'; break;
              case 6: subject = 'Inglese'; break;
              default: subject = 'Altra materia'; break;
            }
            console.log(`[DEBUG] Mappato category_id ${categoryId} a materia "${subject}"`);
          }
          // Se non abbiamo un category_id, proviamo altri campi
          else if (item.subject) {
            // Se subject è un oggetto, estrai una proprietà significativa
            if (typeof item.subject === 'object' && item.subject !== null) {
              console.log('Subject è un oggetto:', item.subject);
              // Prova a estrarre il nome/titolo/valore
              subject = item.subject.name || item.subject.title || item.subject.value ||
                       item.subject.label || item.subject.text || item.subject.id ||
                       'Soggetto non specificato';
            } else {
              subject = String(item.subject);
            }
          } else if (item.category) {
            // Gestisci anche category come oggetto
            if (typeof item.category === 'object' && item.category !== null) {
              subject = item.category.name || item.category.title || item.category.value ||
                       item.category.label || item.category.text || item.category.id ||
                       'Categoria non specificata';
            } else {
              subject = String(item.category);
            }
          } else if (item.topic) {
            subject = typeof item.topic === 'object' && item.topic !== null ?
                     (item.topic.name || item.topic.title || 'Argomento non specificato') :
                     String(item.topic);
          } else if (item.subject_area) {
            subject = typeof item.subject_area === 'object' && item.subject_area !== null ?
                     (item.subject_area.name || item.subject_area.title || 'Area non specificata') :
                     String(item.subject_area);
          } else {
            // Valore di default se nessuna materia è specificata
            subject = 'Materia non specificata';
          }
          
          // Assicurati che la prima lettera sia maiuscola
          if (subject && subject.length > 0) {
            subject = subject.charAt(0).toUpperCase() + subject.slice(1);
          }
          
          // Gestiamo le domande che potrebbero essere in formati diversi
          let questions = [];
          let questionsSource = '';
          
          if (Array.isArray(item.questions)) {
            questions = item.questions;
            questionsSource = 'questions array';
          } else if (item.questions && typeof item.questions === 'object') {
            // Potrebbe essere un oggetto con chiavi numeriche
            questions = Object.values(item.questions);
            questionsSource = 'questions object values';
          } else if (Array.isArray(item.items)) {
            // Alcuni backend usano "items" invece di "questions"
            questions = item.items;
            questionsSource = 'items array';
          }
          
          // Se abbiamo il question_count dal backend, usiamolo per validare
          const backendCount = item.question_count || item.questionCount || null;
          if (backendCount !== null && questions.length === 0) {
            console.log(`[DEBUG] Quiz ${item.id}: Nessuna domanda trovata ma question_count=${backendCount}`);
          }
          
          // Log per debug
          console.log(`[DEBUG] Quiz ${item.id}: Trovate ${questions.length} domande (fonte: ${questionsSource})`);
          
          // Normalizza le domande correttamente
          const normalizedQuestions = questions.length > 0 ? normalizeQuestions(questions) : [];
          
          // Determina il numero effettivo di domande normalizzate
          const questionsCount = normalizedQuestions.length;
          console.log(`[DEBUG] Quiz ${item.id}: ${questionsCount} domande normalizzate, subject: "${subject}"`);
          
          // Costruisce un oggetto normalizzato che rispetta l'interfaccia QuizTemplate
          return {
            id: item.id || item._id || '',
            title: item.title || item.name || '',
            description: item.description || item.summary || '',
            createdBy: item.created_by || item.createdBy || item.author || '',
            totalQuestions: questionsCount, // Usa il conteggio effettivo delle domande normalizzate
            totalPoints: item.total_points || item.totalPoints || 10,
            estimatedTime: item.estimated_time || item.estimatedTime || item.duration || 10,
            questions: normalizedQuestions, // Usa l'array normalizzato che abbiamo già creato
            isPublic: item.is_public !== undefined ? item.is_public : (item.isPublic || false),
            subject: subject,
            difficultyLevel: difficultyLevel,
            timeLimit: item.time_limit || item.timeLimit || 10,
            passingScore: item.passing_score || item.passingScore || 60
          } as QuizTemplate;
        });
        
        console.log('Quiz template normalizzati:', normalizedTemplates);
        return normalizedTemplates;
      } catch (error: any) {
        console.log(`Errore con il percorso ${path}:`, error.response?.status);
        // Continua a provare altri percorsi se otteniamo 404
        if (error.response?.status === 404) {
          continue;
        }
        
        // Per altri errori, mostra una notifica e termina
        NotificationsService.error(
          'Errore nel recupero dei template di quiz',
          'Errore'
        );
        errorShown = true;
        throw error;
      }
    }
    
    // Se arriviamo qui, nessun percorso ha funzionato
    if (!errorShown) {
      NotificationsService.warning(
        'I template di quiz non sono ancora disponibili',
        'Funzionalità in sviluppo'
      );
    }
    
    // Ritorna un template di quiz di esempio per scopi di sviluppo
    return [
      {
        id: 'sample-1',
        title: 'Quiz di esempio',
        description: 'Questo è un quiz di esempio poiché i template non sono ancora disponibili',
        createdBy: 'system',
        totalQuestions: 0,
        totalPoints: 0,
        estimatedTime: 15,
        questions: [],
        isPublic: true,
        subject: 'Generale',
        difficultyLevel: 'medium',
        timeLimit: 10,
        passingScore: 60,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  /**
   * Ottiene un template di quiz specifico per ID
   */
  public async getQuizTemplate(id: string): Promise<QuizTemplate> {
    // Array di percorsi possibili da provare in ordine
    const possiblePaths = [
      `/api/quiz/templates/${id}`,
      `/api/quiz/v1/templates/${id}`,
      `/api/quiz/${id}`
    ];
    
    console.log(`RICHIESTA GET QUIZ TEMPLATE con ID: ${id}`);
    // Prova ogni percorso in sequenza
    for (const path of possiblePaths) {
      try {
        console.log(`Tentativo di accesso al percorso: ${path}`);
        
        // Tracciamento richiesta
        console.log(`[DEBUG] Richiesta GET effettuata a: ${API_URL}${path}`);
        
        const rawData = await ApiService.get<any>(`${API_URL}${path}`);
        
        console.log(`[DEBUG] Risposta ricevuta dal server:`, rawData);
        console.log(`Successo con il percorso: ${path}`);
        
        // Log dettagliato dei dati ricevuti
        console.log(`[DEBUG] DATI GREZZI RICEVUTI:`, {
          id: rawData.id || '(mancante)',
          title: rawData.title || '(mancante)',
          subject: rawData.subject ? (typeof rawData.subject === 'object' ? JSON.stringify(rawData.subject) : rawData.subject) : '(mancante)',
          questions: Array.isArray(rawData.questions) ? `Array con ${rawData.questions.length} domande` : `Non è un array: ${typeof rawData.questions}`,
          prima_domanda: rawData.questions?.[0] ? {
            id: rawData.questions[0].id || '(mancante)',
            text: rawData.questions[0].text || '(mancante)',
            options: Array.isArray(rawData.questions[0].options) 
              ? `${rawData.questions[0].options.length} opzioni` 
              : (rawData.questions[0].answer_options 
                ? `${rawData.questions[0].answer_options.length} opzioni (answer_options)` 
                : 'nessuna opzione')
          } : 'nessuna domanda'
        });
        
        // Normalizza i dati ricevuti dal backend
        // Mappa difficulty_level numerico (1,2,3) a difficultyLevel stringa (easy,medium,hard)
        let difficultyLevel: 'easy' | 'medium' | 'hard' = 'medium';
        
        // Se esiste il campo difficulty_level (numerico)
        if (rawData.difficulty_level !== undefined) {
          // Mappa i valori numerici a stringhe
          switch(Number(rawData.difficulty_level)) {
            case 1: difficultyLevel = 'easy'; break;
            case 2: difficultyLevel = 'medium'; break;
            case 3: difficultyLevel = 'hard'; break;
            default: difficultyLevel = 'medium'; break;
          }
        } else if (rawData.difficultyLevel) {
          // Usa il valore stringa esistente se presente
          difficultyLevel = rawData.difficultyLevel;
        }
        
        // Mappatura per materie
        let subject = '';
        
        // Potrebbe essere in vari formati
        if (rawData.subject) {
          // Se subject è un oggetto, estrai una proprietà significativa
          if (typeof rawData.subject === 'object' && rawData.subject !== null) {
            console.log('Subject è un oggetto:', rawData.subject);
            // Prova a estrarre il nome/titolo/valore
            subject = rawData.subject.name || rawData.subject.title || rawData.subject.value ||
                     rawData.subject.label || rawData.subject.text || rawData.subject.id ||
                     'Soggetto non specificato';
          } else {
            subject = String(rawData.subject);
          }
        } else if (rawData.category) {
          // Gestisci anche category come oggetto
          if (typeof rawData.category === 'object' && rawData.category !== null) {
            subject = rawData.category.name || rawData.category.title || rawData.category.value ||
                     rawData.category.label || rawData.category.text || rawData.category.id ||
                     'Categoria non specificata';
          } else {
            subject = String(rawData.category);
          }
        } else if (rawData.topic) {
          subject = typeof rawData.topic === 'object' && rawData.topic !== null ?
                   (rawData.topic.name || rawData.topic.title || 'Argomento non specificato') :
                   String(rawData.topic);
        } else if (rawData.subject_area) {
          subject = typeof rawData.subject_area === 'object' && rawData.subject_area !== null ?
                   (rawData.subject_area.name || rawData.subject_area.title || 'Area non specificata') :
                   String(rawData.subject_area);
        }
        
        // Debug completo della struttura dei dati ricevuti
        console.log('STRUTTURA COMPLETA DATI RICEVUTI DAL BACKEND:', {
          id: rawData.id,
          title: rawData.title,
          description: rawData.description,
          subject: subject,
          questions: Array.isArray(rawData.questions) ? 
            `Array con ${rawData.questions.length} domande` : 
            `Tipo: ${typeof rawData.questions}`,
          difficulty: rawData.difficulty_level || rawData.difficultyLevel,
          campi_raw: Object.keys(rawData)
        });
        
        // Gestiamo le domande che potrebbero essere in formati diversi
        let questions = [];
        
        console.log(`[DEBUG] Analisi delle domande nel template:`, { 
          has_questions: !!rawData.questions,
          is_array: Array.isArray(rawData.questions),
          length: Array.isArray(rawData.questions) ? rawData.questions.length : 'n/a'
        });
        
        if (Array.isArray(rawData.questions)) {
          console.log(`[DEBUG] Usando array di domande standard (${rawData.questions.length} elementi)`);
          questions = rawData.questions;
        } else if (rawData.questions && typeof rawData.questions === 'object') {
          // Potrebbe essere un oggetto con chiavi numeriche
          console.log(`[DEBUG] Le domande sono un oggetto, estraggo i valori`);
          questions = Object.values(rawData.questions);
        } else if (Array.isArray(rawData.items)) {
          // Alcuni backend usano "items" invece di "questions"
          console.log(`[DEBUG] Usando 'items' come domande (${rawData.items.length} elementi)`);
          questions = rawData.items;
        } else {
          console.log(`[DEBUG] Non ho trovato domande in un formato riconoscibile`);
        }
        
        // Log delle domande trovate
        if (questions.length > 0) {
          console.log(`[DEBUG] Trovate ${questions.length} domande`);
          // Analizziamo la prima domanda per debugging
          const firstQ = questions[0];
          console.log(`[DEBUG] Prima domanda:`, firstQ);
          console.log(`[DEBUG] Opzioni nella prima domanda:`, {
            has_options: !!firstQ.options,
            has_answer_options: !!firstQ.answer_options,
            options_type: firstQ.options ? typeof firstQ.options : 'undefined',
            answer_options_type: firstQ.answer_options ? typeof firstQ.answer_options : 'undefined',
            options_length: Array.isArray(firstQ.options) ? firstQ.options.length : 'non è un array',
            answer_options_length: Array.isArray(firstQ.answer_options) ? firstQ.answer_options.length : 'non è un array'
          });
        }
        
        // Costruisce un oggetto normalizzato che rispetta l'interfaccia QuizTemplate
        // Normalize le domande con il metodo più robusto per le opzioni
        const normalizedQuestions = questions.length > 0 ? this.normalizeQuestionsWithOptions(questions) : [];
        
        // Log di debug per le domande normalizzate
        console.log(`[DEBUG] Dopo normalizzazione: ${normalizedQuestions.length} domande normalizzate`);
        if (normalizedQuestions.length > 0) {
          const firstQ = normalizedQuestions[0];
          console.log(`[DEBUG] Prima domanda normalizzata:`, firstQ);
          console.log(`[DEBUG] Opzioni nella prima domanda normalizzata: ${firstQ.options?.length || 0}`);
        }
        
        // Ottieni il nome della materia dal category_id se presente
        let categoryBasedSubject = '';
        if (rawData.category_id) {
          // Mappa l'ID numerico al nome della materia con prima lettera maiuscola
          switch(Number(rawData.category_id)) {
            case 1: categoryBasedSubject = 'Matematica'; break;
            case 2: categoryBasedSubject = 'Italiano'; break;
            case 3: categoryBasedSubject = 'Scienze'; break;
            case 4: categoryBasedSubject = 'Storia'; break;
            case 5: categoryBasedSubject = 'Geografia'; break;
            case 6: categoryBasedSubject = 'Inglese'; break;
            default: categoryBasedSubject = ''; break;
          }
          
          if (categoryBasedSubject) {
            console.log(`[DEBUG] Mappato category_id ${rawData.category_id} a materia "${categoryBasedSubject}". Sostituisco subject attuale: "${subject}"`);
            subject = categoryBasedSubject;
          }
        }
        
        // Assicuriamoci che il conteggio delle domande sia coerente con l'array di domande normalizzate
        const questionsCount = normalizedQuestions.length;
        console.log(`[DEBUG] Numero effettivo di domande normalizzate: ${questionsCount}`);
        
        const normalizedTemplate: QuizTemplate = {
          id: rawData.id || rawData._id || '',
          title: rawData.title || rawData.name || '',
          description: rawData.description || rawData.summary || '',
          createdBy: rawData.created_by || rawData.createdBy || rawData.author || '',
          totalQuestions: questionsCount, // Usiamo il conteggio effettivo delle domande normalizzate
          totalPoints: rawData.total_points || rawData.totalPoints || 10,
          estimatedTime: rawData.estimated_time || rawData.estimatedTime || rawData.duration || 10,
          questions: normalizedQuestions,  // Usa le domande normalizzate dal metodo robusto
          isPublic: rawData.is_public !== undefined ? rawData.is_public : (rawData.isPublic || false),
          subject: subject,
          difficultyLevel: difficultyLevel,
          timeLimit: rawData.time_limit || rawData.timeLimit || 10,
          passingScore: rawData.passing_score || rawData.passingScore || 60
        };
        
        console.log('Quiz template normalizzato per modifica:', normalizedTemplate);
        return normalizedTemplate;
      } catch (error: any) {
        console.log(`Errore con il percorso ${path}:`, error.response?.status);
        // Continua a provare altri percorsi se otteniamo 404
        if (error.response?.status === 404) {
          continue;
        }
        
        // Per altri errori, mostra una notifica e termina
        NotificationsService.error(
          'Errore nel recupero del template di quiz',
          'Errore'
        );
        throw error;
      }
    }
    
    // Se arriviamo qui, nessun percorso ha funzionato
    NotificationsService.warning(
      `I dettagli del quiz con ID ${id} non sono disponibili al momento`,
      'Funzionalità in sviluppo'
    );
    
    // Restituisci un template di esempio per scopi di sviluppo
    return {
      id: id,
      title: 'Quiz di esempio',
      description: 'Questo è un quiz di esempio poiché il backend non è disponibile',
      createdBy: 'system',
      totalQuestions: 0,
      totalPoints: 0,
      estimatedTime: 15,
      questions: [],
      isPublic: true,
      subject: 'Generale',
      difficultyLevel: 'medium',
      timeLimit: 10,
      passingScore: 60,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
  
  /**
   * Ottiene un template di quiz specifico per ID (alias di getQuizTemplate)
   * @param id ID del template di quiz
   * @returns Promise con il template di quiz
   */
  public async getQuizTemplateById(id: string): Promise<QuizTemplate> {
    return this.getQuizTemplate(id);
  }

  /**
   * Crea un nuovo template di quiz
   * Solo admin può creare template
   */
  public async createQuizTemplate(template: Omit<QuizTemplate, 'id'>): Promise<QuizTemplate> {
    // Array di percorsi possibili da provare in ordine
    const possiblePaths = [
      `/api/quiz/templates`,
      `/api/quiz/v1/templates`,
      `/quiz/templates`,
      `/api/quiz`
    ];
    
    let lastError: any;
    
    // Verifica che i dati essenziali siano presenti e validi
    console.log('Dati quiz originali prima dell\'invio:', template);
    
    // Assicuriamoci che la materia sia presente e corretta
    let normalizedTemplate = { ...template };
    
    // Verifica che la materia sia in un formato valido
    if (!normalizedTemplate.subject) {
      console.warn('Materia mancante nel template quiz, impostazione valore default');
      normalizedTemplate.subject = 'Generale';
    } else if (typeof normalizedTemplate.subject === 'object' && normalizedTemplate.subject !== null) {
      // Se la materia è un oggetto, estraiamo un valore significativo
      const subjectObj = normalizedTemplate.subject as { [key: string]: any };
      normalizedTemplate.subject = subjectObj.name || subjectObj.title || subjectObj.value || 
                                 subjectObj.label || subjectObj.text || subjectObj.id || 
                                 'Soggetto non specificato';
      console.log('[DEBUG] Materia normalizzata da oggetto:', normalizedTemplate.subject);
    }
    
    // Assicuriamoci che le domande abbiano opzioni valide
    if (normalizedTemplate.questions && normalizedTemplate.questions.length > 0) {
      normalizedTemplate.questions = normalizedTemplate.questions.map((question, qIndex) => {
        // Verifica se le opzioni sono vuote o mancanti
        if (!question.options || question.options.length === 0) {
          console.warn(`Domanda ${qIndex+1} senza opzioni: "${question.text}". Aggiunta di opzioni predefinite.`);
          
          // Verifichiamo se la domanda ha answer_options (formato backend)
          if (question.answer_options && Array.isArray(question.answer_options) && question.answer_options.length > 0) {
            console.log(`[DEBUG] Trovate answer_options per la domanda ${qIndex+1}:`, question.answer_options.length);
            // Convertiamo answer_options in options
            const convertedOptions = question.answer_options.map((ao: any, aoIndex: number) => ({
              id: ao.id || `option-${qIndex}-${aoIndex}`,
              text: ao.text || `Opzione ${aoIndex+1}`,
              isCorrect: ao.is_correct === true,
              additional_data: ao.additional_data || {}
            }));
            return { ...question, options: convertedOptions };
          }
          
          // Se non ci sono neppure answer_options, creiamo opzioni di default
          const defaultOptions = [
            { 
              id: `option-${qIndex}-1`, 
              text: 'Opzione 1', 
              isCorrect: true, 
              additional_data: {} 
            },
            { 
              id: `option-${qIndex}-2`, 
              text: 'Opzione 2', 
              isCorrect: false, 
              additional_data: {} 
            }
          ];
          return { ...question, options: defaultOptions };
        }
        
        // Se le opzioni ci sono ma non hanno tutti i campi richiesti
        if (question.options.some((opt: any) => !opt.additional_data)) {
          const completeOptions = question.options.map((opt: any) => ({
            ...opt,
            additional_data: opt.additional_data || {}
          }));
          return { ...question, options: completeOptions };
        }
        
        return question;
      });
    }
    
    console.log('Dati quiz normalizzati per l\'invio:', normalizedTemplate);
    
    // Prova ogni percorso in sequenza
    for (const path of possiblePaths) {
      try {
        console.log(`Tentativo di creazione quiz con percorso: ${path}`);
        const result = await ApiService.post<QuizTemplate>(`${API_URL}${path}`, normalizedTemplate);
        console.log(`Successo con il percorso: ${path}`);
        NotificationsService.success(
          `Il quiz "${normalizedTemplate.title}" è stato creato con successo.`,
          'Quiz creato'
        );
        return result;
      } catch (error: any) {
        console.log(`Errore con il percorso ${path}:`, error.response?.status);
        lastError = error;
        // Continua a provare altri percorsi se otteniamo 404
        if (error.response?.status === 404) {
          continue;
        }
        
        // Per altri errori, termina
        throw error;
      }
    }
    
    // Se arriviamo qui, nessun percorso ha funzionato
    NotificationsService.error(
      'Errore nella creazione del quiz',
      'Si è verificato un errore durante il salvataggio. L\'API potrebbe non essere disponibile.'
    );
    throw lastError;
  }

  /**
   * Aggiorna un template di quiz esistente
   * Solo admin può modificare template
   */
  public async updateQuizTemplate(id: string, template: Partial<QuizTemplate>): Promise<QuizTemplate> {
    console.log("Template originale da aggiornare:", template);
    
    // NUOVA SOLUZIONE: Prepara i dati completi includendo le domande e le opzioni
    
    // 1. Normalizza la materia e imposta il category_id
    // La materia deve essere convertita in category_id che è un numero intero
    let categoryId: number | null = null;
    let subjectName = "Generale";

    if (template.subject) {
      // Estrai il nome della materia dall'oggetto o dalla stringa
      if (typeof template.subject === 'object' && template.subject !== null) {
        const obj = template.subject as any;
        // Cerca prima l'ID della categoria se disponibile
        if (obj.id && !isNaN(Number(obj.id))) {
          categoryId = Number(obj.id);
          subjectName = obj.name || obj.title || obj.value || obj.label || obj.text || "Categoria "+ categoryId;
        } else {
          // Altrimenti usa il nome per determinare la categoria
          subjectName = obj.name || obj.title || obj.value || obj.label || obj.text || obj.id || "Generale";
          // Mappa nomi comuni alle categorie del database
          categoryId = this.mapSubjectNameToCategoryId(subjectName);
        }
      } else {
        // Se è una stringa, prova a convertirla in un ID se è numerica
        const subjectStr = String(template.subject);
        if (!isNaN(Number(subjectStr))) {
          categoryId = Number(subjectStr);
          subjectName = "Categoria " + categoryId;
        } else {
          // Altrimenti usa il nome come stringa
          subjectName = subjectStr;
          categoryId = this.mapSubjectNameToCategoryId(subjectName);
        }
      }
    }
    
    console.log(`[DEBUG] Materia normalizzata: Nome='${subjectName}', CategoryID=${categoryId}`);
    
    
    // 2. Mappa la difficoltà a valori numerici come richiesto dal backend
    const difficultyValue = (() => {
      switch(template.difficultyLevel) {
        case 'easy': return 1;
        case 'medium': return 2;
        case 'hard': return 3;
        default: return 2;
      }
    })();
    
    // 3. Normalizza le domande per assicurarsi che abbiano tutte le proprietà richieste
    // Normalizza le domande e opzioni in modo più dettagliato per il formato backend
    // Definiamo un'interfaccia per il formato backend delle domande
    interface NormalizedQuestion {
      id?: string;
      text: string;
      question_type: string;
      points: number;
      order: number;
      answer_options: Array<{
        id?: string;
        text: string;
        is_correct: boolean;
        order: number;
      }>;
    }
    
    const normalizedQuestions: NormalizedQuestion[] = [];
    
    if (template.questions && Array.isArray(template.questions)) {
      console.log(`[DEBUG] Processando ${template.questions.length} domande`);
      
      // Itera attraverso ogni domanda
      template.questions.forEach((question, qIndex) => {
        console.log(`[DEBUG] Domanda ${qIndex+1}: ${question.text}, Tipo: ${question.type}, Opzioni: ${question.options?.length || 'nessuna'}`);
        
        // Prepara le opzioni normalizzate
        let processedOptions = [];
        
        if (question.options && Array.isArray(question.options) && question.options.length > 0) {
          // Log per debug
          question.options.forEach((opt, i) => {
            console.log(`[DEBUG] Opzione ${i+1}: ${opt.text}, Corretta: ${opt.isCorrect}`);
          });
          
          // Normalizza ogni opzione per il backend
          processedOptions = question.options.map((option, optIndex) => ({
            text: option.text || `Opzione ${optIndex + 1}`,
            is_correct: option.isCorrect === true,
            order: optIndex,
            // Conserva l'ID originale se esiste e non è temporaneo
            ...(option.id && !option.id.startsWith('temp_') && !option.id.startsWith('option-') ? { id: option.id } : {})
          }));
        } else {
          console.log(`[DEBUG] Nessuna opzione valida trovata per la domanda ${qIndex+1}, generando opzioni predefinite`);
          
          // Crea opzioni predefinite in base al tipo di domanda
          if (question.type === 'true_false') {
            processedOptions = [
              { text: 'Vero', is_correct: true, order: 0 },
              { text: 'Falso', is_correct: false, order: 1 }
            ];
          } else {
            processedOptions = [
              { text: 'Opzione 1', is_correct: true, order: 0 },
              { text: 'Opzione 2', is_correct: false, order: 1 },
              { text: 'Opzione 3', is_correct: false, order: 2 },
              { text: 'Opzione 4', is_correct: false, order: 3 }
            ];
          }
        }
        
        // Crea l'oggetto domanda normalizzato
        const normalizedQuestion = {
          text: question.text || `Domanda ${qIndex + 1}`,
          question_type: question.type || 'single_choice',
          points: Number(question.score || question.points) || 1,
          order: qIndex,
          answer_options: processedOptions,
          // Conserva l'ID originale se esiste e non è temporaneo
          ...(question.id && !question.id.startsWith('temp_') ? { id: question.id } : {})
        };
        
        normalizedQuestions.push(normalizedQuestion);
      });
    } else {
      console.log(`[AVVISO] Template senza domande o struttura domande non valida`);
    }
    
    console.log(`[DEBUG] Totale domande normalizzate: ${normalizedQuestions.length}`);
    normalizedQuestions.forEach((q, i) => {
      console.log(`[DEBUG] Domanda norm. ${i+1}: ${q.text}, Opzioni: ${q.answer_options.length}`);
    });
    
    // 4. Costruisci il payload completo che include tutte le informazioni necessarie
    const completeData = {
      id: id,
      title: template.title || "",
      description: template.description || "",
      // FONDAMENTALE: Forziamo il category_id a essere sempre un numero valido
      category_id: categoryId || 1,  // ID numerico della categoria/materia (default a 1=Matematica)
      difficulty_level: difficultyValue,
      time_limit: Number(template.timeLimit) || 10,
      passing_score: Number(template.passingScore) || 60,
      is_active: template.isPublic === true, // Nota: nel DB è is_active, non is_public
      questions: normalizedQuestions,  // Includi le domande normalizzate
      created_by: "3664795c-7353-4ac1-ac76-f25e62b0b249", // ID admin fisso
      // Salviamo il nome della materia nei dati aggiuntivi per sicurezza e debugging
      additional_data: {
        subject_name: subjectName,
        category_id_debug: categoryId || 1,  // Per debugging
        mapped_from: subjectName
      }
    };
    
    // Verifica finale che category_id sia impostato
    if (!completeData.category_id) {
      console.warn(`[CRITICO] category_id è ancora ${completeData.category_id} dopo tutti i controlli! Impostiamo forzatamente a 1`);
      completeData.category_id = 1; // Ultimo fallback di sicurezza
    }
    
    console.log("PAYLOAD COMPLETO PER AGGIORNAMENTO:", completeData);
    console.log("DOMANDE NEL PAYLOAD:", completeData.questions.length);
    if (completeData.questions.length > 0) {
      console.log("PRIMA DOMANDA ESEMPIO:", {
        text: completeData.questions[0].text,
        tipo: completeData.questions[0].question_type,
        opzioni: completeData.questions[0].answer_options?.length || 0
      });
    }
    
    try {
      // Aggiungiamo log dettagliati per tracciare eventuali problemi
      console.log(`[DEBUG] Iniziando l'aggiornamento del quiz template ${id}`);
      console.log(`[DEBUG] Categoria: ${categoryId} (${subjectName})`);
      console.log(`[DEBUG] Il quiz contiene ${normalizedQuestions.length} domande`);
      
      // Verifichiamo che il payload includa effettivamente le domande e le opzioni
      if (normalizedQuestions.length > 0) {
        console.log(`[DEBUG] Prima domanda: ${normalizedQuestions[0].text}`);
        console.log(`[DEBUG] Opzioni: ${normalizedQuestions[0].answer_options.length}`);
      }
      
      // STRATEGIA: Prima proviamo a fare un PUT diretto, e solo se fallisce usiamo DELETE + CREATE
      
      // 1. Tentativo diretto di aggiornamento con PUT
      const possibleUpdateEndpoints = [
        `/api/quiz/templates/${id}`,
        `/api/quiz/${id}`
      ];
      
      let updateSuccess = false;
      let updateResult = null;
      
      for (const endpoint of possibleUpdateEndpoints) {
        try {
          console.log(`[DEBUG] Tentativo di PUT su ${endpoint}`);
          updateResult = await ApiService.put<QuizTemplate>(`${API_URL}${endpoint}`, completeData);
          console.log(`[DEBUG] PUT riuscito su ${endpoint}`, updateResult);
          updateSuccess = true;
          break;
        } catch (error: any) {
          console.log(`[DEBUG] PUT fallito su ${endpoint}:`, error.response?.status, error.response?.data);
          // Continuiamo a provare altri endpoint se riceviamo 404
          if (error.response?.status === 404) continue;
          
          // Se è un altro tipo di errore, potrebbe essere un problema di struttura dati
          console.log(`[DEBUG] Errore dettagliato:`, error);
        }
      }
      
      // Se l'aggiornamento diretto è fallito, proviamo con DELETE + CREATE
      if (!updateSuccess) {
        console.log(`[DEBUG] Aggiornamento diretto fallito, passando a strategia DELETE + CREATE`);
        
        // 2. Elimina il quiz esistente
        let deleted = false;
        
        for (const endpoint of possibleUpdateEndpoints) {
          try {
            await ApiService.delete(`${API_URL}${endpoint}`);
            deleted = true;
            console.log(`[DEBUG] Quiz esistente eliminato con successo via ${endpoint}`);
            break;
          } catch (error: any) {
            console.log(`[DEBUG] DELETE fallito su ${endpoint}:`, error.response?.status);
            // Continuiamo con altri endpoint se riceviamo 404
            if (error.response?.status === 404) continue;
          }
        }
        
        if (!deleted) {
          console.warn("[DEBUG] Non è stato possibile eliminare il quiz esistente. Procediamo comunque con la creazione.");
        }
        
        // 3. Crea un nuovo quiz con i dati completi
        const { id: _, ...createData } = completeData;
        console.log(`[DEBUG] Dati completi per la creazione:`, createData);
        
        let createSuccess = false;
        let createResult = null;
        
        for (const endpoint of ['/api/quiz/templates', '/api/quiz']) {
          try {
            console.log(`[DEBUG] Tentativo di POST su ${endpoint}`);
            createResult = await ApiService.post<QuizTemplate>(`${API_URL}${endpoint}`, createData);
            console.log(`[DEBUG] Creazione riuscita su ${endpoint}:`, createResult);
            createSuccess = true;
            break;
          } catch (error: any) {
            console.log(`[DEBUG] POST fallito su ${endpoint}:`, error.response?.status, error.response?.data);
            if (error.response?.status === 404) continue;
            // Se non è un 404, potrebbe essere un problema con i dati
            console.error(`[DEBUG] Errore CREATE dettagliato:`, error);
          }
        }
        
        // Aggiorniamo updateSuccess e updateResult con i risultati della creazione
        updateSuccess = createSuccess;
        updateResult = createResult;
      }
      
      if (updateSuccess && updateResult) {
        NotificationsService.success(
          'Quiz aggiornato con successo!',
          'Operazione completata'
        );
        // Ritorniamo direttamente il risultato dell'aggiornamento
        return updateResult;
      }
      
      // Se arriviamo qui, entrambi gli endpoint hanno fallito
      throw new Error("Tutti i tentativi di aggiornamento sono falliti");
    } catch (error: any) {
      console.error("Errore finale:", error);
      NotificationsService.error(
        `Errore durante l'aggiornamento del quiz: ${error.message || 'Errore sconosciuto'}`,
        'Aggiornamento fallito'
      );
      throw error;
    }
  }

  /**
   * Elimina un template di quiz
   * Solo admin può eliminare template
   */
  public async deleteQuizTemplate(id: string): Promise<void> {
    // Array di percorsi possibili da provare in ordine
    const possiblePaths = [
      `/api/quiz/templates/${id}`,
      `/api/quiz/v1/templates/${id}`,
      `/quiz/templates/${id}`,
      `/api/quiz/${id}`
    ];
    
    let lastError: any;
    
    // Prova ogni percorso in sequenza
    for (const path of possiblePaths) {
      try {
        console.log(`Tentativo di eliminazione quiz con percorso: ${path}`);
        await ApiService.delete(`${API_URL}${path}`);
        console.log(`Successo con il percorso: ${path}`);
        NotificationsService.success(
          'Il quiz è stato eliminato con successo.',
          'Quiz eliminato'
        );
        return;
      } catch (error: any) {
        console.log(`Errore con il percorso ${path}:`, error.response?.status);
        lastError = error;
        // Continua a provare altri percorsi se otteniamo 404
        if (error.response?.status === 404) {
          continue;
        }
        
        // Per altri errori, termina
        throw error;
      }
    }
    
    // Se arriviamo qui, nessun percorso ha funzionato
    NotificationsService.error(
      'Errore nell\'eliminazione del quiz',
      'Si è verificato un errore durante l\'eliminazione. L\'API potrebbe non essere disponibile.'
    );
    throw lastError;
  }

  // OPERAZIONI SUI QUIZ ASSEGNATI
  /**
   * Ottiene tutti i quiz assegnati allo studente corrente
   */
  public async getAssignedQuizzes(): Promise<Quiz[]> {
    return ApiService.get<Quiz[]>(`${QUIZ_API_URL}/assigned`);
  }

  /**
   * Ottiene un quiz specifico per ID
   */
  public async getQuiz(id: string): Promise<Quiz> {
    return ApiService.get<Quiz>(`${QUIZ_API_URL}/${id}`);
  }

  /**
   * Assegna un quiz a uno studente
   * Solo parent può assegnare quiz
   */
  public async assignQuiz(templateId: string, studentId: string): Promise<Quiz> {
    try {
      const result = await ApiService.post<Quiz>(`${QUIZ_API_URL}/assign`, { templateId, studentId });
      NotificationsService.success(
        'Quiz assegnato con successo allo studente.',
        'Quiz assegnato'
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Inizia un quiz
   * Segna l'ora di inizio e prepara le domande
   */
  public async startQuiz(quizId: string): Promise<Quiz> {
    try {
      const result = await ApiService.post<Quiz>(`${QUIZ_API_URL}/${quizId}/start`);
      NotificationsService.info(
        'Il quiz è iniziato. Buona fortuna!',
        'Quiz avviato',
        { autoClose: true, duration: 3000 }
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Invia le risposte di un quiz completato
   * Calcola il punteggio e finalizza il quiz
   */
  public async submitQuiz(submission: QuizSubmission): Promise<QuizResult> {
    try {
      const result = await ApiService.post<QuizResult>(`${QUIZ_API_URL}/${submission.quizId}/submit`, submission);
      
      // Notifica con feedback sul punteggio
      const percentScore = Math.round((result.score / result.maxScore) * 100);
      
      if (percentScore >= 80) {
        NotificationsService.success(
          `Ottimo lavoro! Hai completato il quiz con un punteggio di ${result.score}/${result.maxScore} (${percentScore}%).`,
          'Quiz completato'
        );
      } else if (percentScore >= 60) {
        NotificationsService.success(
          `Hai completato il quiz con un punteggio di ${result.score}/${result.maxScore} (${percentScore}%).`,
          'Quiz completato'
        );
      } else {
        NotificationsService.warning(
          `Hai completato il quiz con un punteggio di ${result.score}/${result.maxScore} (${percentScore}%). Puoi fare di meglio!`,
          'Quiz completato',
          { autoClose: true, duration: 7000 }
        );
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Ottiene i risultati di un quiz specifico
   */
  public async getQuizResults(quizId: string): Promise<QuizResult> {
    return ApiService.get<QuizResult>(`${QUIZ_API_URL}/${quizId}/results`);
  }

  /**
   * Ottiene tutti i risultati dei quiz di uno studente
   * Parent può vedere i risultati dei propri figli
   */
  public async getStudentQuizResults(studentId: string): Promise<QuizResult[]> {
    return ApiService.get<QuizResult[]>(`${QUIZ_API_URL}/results/student/${studentId}`);
  }

  /**
   * Normalizza le domande con particolare attenzione alle opzioni di risposta
   * @param questions Array di domande da normalizzare
   * @returns Array di domande normalizzate con opzioni corrette
   */
  private normalizeQuestionsWithOptions(questions: any[]): any[] {
    console.log(`[DEBUG] Normalizzazione di ${questions.length} domande con controllo opzioni`);
    
    return questions.map((question, index) => {
      // Identifica il campo che contiene le opzioni di risposta
      let options = [];
      
      // PRIORITA' 1: Cerca nel campo options
      if (Array.isArray(question.options)) {
        console.log(`[DEBUG] Domanda ${index}: trovate ${question.options.length} opzioni nel campo 'options'`);
        options = question.options;
      }
      // PRIORITA' 2: Cerca nel campo answer_options
      else if (Array.isArray(question.answer_options)) {
        console.log(`[DEBUG] Domanda ${index}: trovate ${question.answer_options.length} opzioni nel campo 'answer_options'`);
        options = question.answer_options;
      }
      // PRIORITA' 3: Cerca nel campo answers
      else if (Array.isArray(question.answers)) {
        console.log(`[DEBUG] Domanda ${index}: trovate ${question.answers.length} opzioni nel campo 'answers'`);
        options = question.answers;
      }
      // Fallback: se non troviamo opzioni, crea un array vuoto
      else {
        console.log(`[DEBUG] Domanda ${index}: nessuna opzione trovata in formati standard`);
        options = [];
      }
      
      // Normalizza le opzioni di risposta
      const normalizedOptions = options.map((option: any) => {
        // Mappa i diversi formati delle opzioni a un formato standard
        return {
          id: option.id || option._id || `temp-option-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          text: option.text || option.content || option.label || option.value || 'Opzione',
          isCorrect: option.is_correct !== undefined ? option.is_correct : (option.isCorrect || false),
          order: option.order !== undefined ? option.order : (option.position || 0)
        };
      });
      
      console.log(`[DEBUG] Domanda ${index}: ${normalizedOptions.length} opzioni normalizzate`);
      
      // Costruisci la domanda normalizzata
      return {
        id: question.id || question._id || `temp-question-${Date.now()}-${index}`,
        text: question.text || question.content || question.title || `Domanda ${index + 1}`,
        type: this.normalizeQuestionType(question.question_type || question.type),
        score: question.score || question.points || 1,
        options: normalizedOptions,  // Usiamo sempre 'options' nel frontend
        order: question.order !== undefined ? question.order : index
      };
    });
  }
  
  /**
   * Normalizza il tipo di domanda
   */
  private normalizeQuestionType(type: string): string {
    if (!type) return 'single_choice';
    
    // Converti in minuscolo e rimuovi spazi/underscore per normalizzare
    const normalizedType = type.toLowerCase()
      .replace(/[_\s-]/g, ''); // rimuove underscore, spazi e trattini
    
    // Mappa vari formati al formato standard
    if (normalizedType.includes('multiple') || normalizedType.includes('multi')) {
      return 'multiple_choice';
    } else if (normalizedType.includes('single') || normalizedType.includes('radio')) {
      return 'single_choice';
    } else if (normalizedType.includes('text') || normalizedType.includes('open')) {
      return 'text';
    } else if (normalizedType.includes('true') || normalizedType.includes('false') ||
              normalizedType.includes('vero') || normalizedType.includes('falso')) {
      return 'true_false';
    }
    
    // Default a single_choice
    return 'single_choice';
  }
  
  /**
   * Mappa il nome della materia all'ID della categoria corrispondente nel database
   * @param subjectName Il nome della materia da mappare
   * @returns L'ID della categoria corrispondente, o 1 (Matematica) se non trovata
   */
  private mapSubjectNameToCategoryId(subjectName: string): number {
    console.log(`[DEBUG] Richiesta mappatura di subject: "${subjectName}"`);
    
    // Se non abbiamo un nome materia, usa l'ID 1 (Matematica) come default
    if (!subjectName) {
      console.log(`[DEBUG] Nome materia non fornito, uso categoria 1 (Matematica) come default`);
      return 1;
    }
    
    // Gestione caso speciale per oggetti
    if (typeof subjectName === 'object') {
      const objStr = JSON.stringify(subjectName);
      console.log(`[DEBUG] Ricevuto oggetto invece di stringa: ${objStr}`);
      
      // Prova a estrarre il campo 'name' se esiste
      if (subjectName && 'name' in subjectName) {
        const name = (subjectName as any).name;
        if (typeof name === 'string') {
          console.log(`[DEBUG] Estratto nome da oggetto: "${name}"`);
          return this.mapSubjectNameToCategoryId(name);
        }
      }
      
      // Se non riusciamo a estrarre un nome valido, usa il default
      return 1;
    }
    
    // Normalizza il nome rimuovendo accenti, spazi extra e convertendo in minuscolo
    const normalizedName = String(subjectName).toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .trim();
    
    console.log(`[DEBUG] Nome materia normalizzato: "${normalizedName}"`);
    
    // Mappa per associare nomi di materie a ID di categorie
    // Basata sui dati nella tabella quiz_categories
    const categoryMap: {[key: string]: number} = {
      // Mappatura esatta dalla tabella quiz_categories
      "matematica": 1,
      "italiano": 2,
      "scienze": 3,
      "storia": 4,
      "geografia": 5,
      "inglese": 6,
      
      // Sinonimi e varianti comuni
      "math": 1,
      "algebra": 1,
      "geometria": 1,
      "aritmetica": 1,
      "trigonometria": 1,
      "calcolo": 1,
      
      "grammar": 2,
      "lingua italiana": 2,
      "grammatica": 2,
      "letteratura": 2,
      
      "science": 3,
      "fisica": 3,
      "chimica": 3,
      "biologia": 3,
      "physic": 3,
      "chemistry": 3,
      "biology": 3,
      
      "history": 4,
      "storia mondiale": 4,
      "storia italiana": 4,
      
      "geography": 5,
      "maps": 5,
      "cartografia": 5,
      
      "english": 6,
      "lingua inglese": 6
    };
    
    // Cerca prima la corrispondenza esatta
    if (categoryMap[normalizedName] !== undefined) {
      const categoryId = categoryMap[normalizedName];
      console.log(`[DEBUG] Corrispondenza esatta trovata: "${normalizedName}" -> ID ${categoryId}`);
      return categoryId;
    }
    
    // Se non c'è corrispondenza esatta, prova a cercare sottostringhe
    for (const [key, value] of Object.entries(categoryMap)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        console.log(`[DEBUG] Corrispondenza parziale: "${normalizedName}" include/è incluso in "${key}" -> ID ${value}`);
        return value;
      }
    }
    
    // IMPORTANTE: Fallback a un valore di default se non troviamo corrispondenze
    // Usiamo ID 1 (Matematica) come default universale
    console.log(`[DEBUG] Nessuna corrispondenza trovata per "${normalizedName}", usando ID 1 (Matematica) come default`);
    return 1;
  }
}

// Esporta una singola istanza del servizio
// Esportiamo anche le funzioni di utilità per la normalizzazione


export { normalizeQuestion, normalizeQuestions };

export default new QuizService();
