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
 * Interfaccia per una domanda di quiz
 */
export interface Question {
  id: string;
  text: string;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  timeLimit?: number;
  points: number;
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
    return ApiService.get<QuizTemplate[]>(`${QUIZ_API_URL}/templates`);
  }

  /**
   * Ottiene un template di quiz specifico per ID
   */
  public async getQuizTemplate(id: string): Promise<QuizTemplate> {
    return ApiService.get<QuizTemplate>(`${QUIZ_API_URL}/templates/${id}`);
  }

  /**
   * Crea un nuovo template di quiz
   * Solo admin può creare template
   */
  public async createQuizTemplate(template: Omit<QuizTemplate, 'id'>): Promise<QuizTemplate> {
    try {
      const result = await ApiService.post<QuizTemplate>(`${QUIZ_API_URL}/templates`, template);
      NotificationsService.success(
        `Il quiz "${template.title}" è stato creato con successo.`,
        'Quiz creato'
      );
      return result;
    } catch (error) {
      // ApiService già gestisce la visualizzazione degli errori
      throw error;
    }
  }

  /**
   * Aggiorna un template di quiz esistente
   * Solo admin può modificare template
   */
  public async updateQuizTemplate(id: string, template: Partial<QuizTemplate>): Promise<QuizTemplate> {
    try {
      const result = await ApiService.put<QuizTemplate>(`${QUIZ_API_URL}/templates/${id}`, template);
      NotificationsService.success(
        `Il quiz "${template.title || 'selezionato'}" è stato aggiornato.`,
        'Quiz aggiornato'
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un template di quiz
   * Solo admin può eliminare template
   */
  public async deleteQuizTemplate(id: string): Promise<void> {
    try {
      await ApiService.delete(`${QUIZ_API_URL}/templates/${id}`);
      NotificationsService.success(
        'Il quiz è stato eliminato con successo.',
        'Quiz eliminato'
      );
    } catch (error) {
      throw error;
    }
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
}

// Esporta una singola istanza del servizio
export default new QuizService();
