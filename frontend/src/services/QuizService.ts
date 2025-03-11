import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const QUIZ_API_URL = `${API_URL}/quiz`;

/**
 * Servizio per gestire le operazioni relative ai quiz
 * Integra con quiz-service attraverso l'API Gateway
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

class QuizService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: QUIZ_API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor per aggiungere il token di autenticazione
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  // OPERAZIONI SUI TEMPLATE DI QUIZ

  /**
   * Ottiene tutti i template di quiz
   * Solo admin può vedere tutti i template
   */
  public async getAllQuizTemplates(): Promise<QuizTemplate[]> {
    const response = await this.api.get<QuizTemplate[]>('/templates');
    return response.data;
  }

  /**
   * Ottiene un template di quiz specifico per ID
   */
  public async getQuizTemplate(id: string): Promise<QuizTemplate> {
    const response = await this.api.get<QuizTemplate>(`/templates/${id}`);
    return response.data;
  }

  /**
   * Crea un nuovo template di quiz
   * Solo admin può creare template
   */
  public async createQuizTemplate(template: Omit<QuizTemplate, 'id'>): Promise<QuizTemplate> {
    const response = await this.api.post<QuizTemplate>('/templates', template);
    return response.data;
  }

  /**
   * Aggiorna un template di quiz esistente
   * Solo admin può modificare template
   */
  public async updateQuizTemplate(id: string, template: Partial<QuizTemplate>): Promise<QuizTemplate> {
    const response = await this.api.put<QuizTemplate>(`/templates/${id}`, template);
    return response.data;
  }

  /**
   * Elimina un template di quiz
   * Solo admin può eliminare template
   */
  public async deleteQuizTemplate(id: string): Promise<void> {
    await this.api.delete(`/templates/${id}`);
  }

  // OPERAZIONI SUI QUIZ ASSEGNATI

  /**
   * Ottiene tutti i quiz assegnati allo studente corrente
   */
  public async getAssignedQuizzes(): Promise<Quiz[]> {
    const response = await this.api.get<Quiz[]>('/assigned');
    return response.data;
  }

  /**
   * Ottiene un quiz specifico per ID
   */
  public async getQuiz(id: string): Promise<Quiz> {
    const response = await this.api.get<Quiz>(`/${id}`);
    return response.data;
  }

  /**
   * Assegna un quiz a uno studente
   * Solo parent può assegnare quiz
   */
  public async assignQuiz(templateId: string, studentId: string): Promise<Quiz> {
    const response = await this.api.post<Quiz>('/assign', { templateId, studentId });
    return response.data;
  }

  /**
   * Avvia un quiz
   * Segna l'ora di inizio e prepara le domande
   */
  public async startQuiz(quizId: string): Promise<Quiz> {
    const response = await this.api.post<Quiz>(`/${quizId}/start`);
    return response.data;
  }

  /**
   * Invia le risposte a un quiz
   * Calcola il punteggio e finalizza il quiz
   */
  public async submitQuiz(submission: QuizSubmission): Promise<QuizResult> {
    const response = await this.api.post<QuizResult>(`/${submission.quizId}/submit`, submission);
    return response.data;
  }

  /**
   * Ottiene i risultati di un quiz specifico
   */
  public async getQuizResults(quizId: string): Promise<QuizResult> {
    const response = await this.api.get<QuizResult>(`/${quizId}/results`);
    return response.data;
  }

  /**
   * Ottiene tutti i risultati dei quiz per uno studente specifico
   * Parent può vedere i risultati dei propri figli
   */
  public async getStudentQuizResults(studentId: string): Promise<QuizResult[]> {
    const response = await this.api.get<QuizResult[]>(`/results/student/${studentId}`);
    return response.data;
  }
}

// Esporta una singola istanza del servizio
export default new QuizService();
