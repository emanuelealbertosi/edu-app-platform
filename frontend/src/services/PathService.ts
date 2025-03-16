import axios, { AxiosInstance } from 'axios';
import { NotificationsService } from './NotificationsService';
import ApiService from './ApiService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const PATH_API_URL = `${API_URL}/path`;

/**
 * Servizio per gestire le operazioni relative ai percorsi educativi
 * Integra con path-service attraverso l'API Gateway
 */

export interface PathNodeTemplate {
  id?: string;
  uuid?: string;
  path_template_id?: string;
  title: string;
  description: string;
  node_type: 'quiz' | 'content' | 'task' | 'milestone' | 'reward';
  points: number;
  order: number;
  dependencies?: { [key: string]: string[] };
  content?: any; // Per i nodi quiz, questo può essere un oggetto con quizId
  estimated_time?: number;
  additional_data?: {
    [key: string]: any;
  };
}

export interface PathTemplate {
  id?: string;
  uuid?: string;
  title: string;
  description: string;
  instructions?: string;
  difficulty_level: number; // 1-5
  points?: number;
  estimated_days: number;
  is_active?: boolean;
  is_public?: boolean;
  additional_data?: {
    subject?: string;
    skills?: string[];
    prerequisites?: string[];
    quizIds?: string[];
  };
  category_id?: number | null;
  created_by?: string;
  created_by_role?: string;
  nodes?: PathNodeTemplate[];
  node_count?: number; // Numero di nodi associati al template
  created_at?: string;
  updated_at?: string | null;
}

export interface Path {
  id: string;
  templateId: string;
  studentId: string;
  title: string;
  description: string;
  subject: string;
  difficulty: string;
  startDate: Date;
  targetEndDate: Date;
  actualEndDate?: Date;
  status: 'assegnato' | 'in_corso' | 'completato';
  progress: number; // 0-100%
  quizzes: Array<{
    quizId: string;
    title: string;
    status: 'da_iniziare' | 'in_corso' | 'completato';
    score?: number;
    maxScore: number;
    completedAt?: Date;
  }>;
}

export interface PathStatistics {
  pathId: string;
  studentId: string;
  completedQuizzes: number;
  totalQuizzes: number;
  averageScore: number;
  totalPoints: number;
  timeSpent: number; // Tempo in minuti
  startDate: Date;
  lastActivity: Date;
  completedAt?: Date;
}

class PathService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: PATH_API_URL,
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

  // OPERAZIONI SUI TEMPLATE DI PERCORSI

  /**
   * Ottiene tutti i template di percorsi
   * Admin e parent possono vedere tutti i template
   */
  public async getAllPathTemplates(): Promise<PathTemplate[]> {
    try {
      // Verifica se l'utente è autenticato
      const currentUser = localStorage.getItem('user');
      if (!currentUser) {
        NotificationsService.error(
          'È necessario effettuare l\'accesso per visualizzare i percorsi',
          'Accesso negato'
        );
        return [];
      }
      
      // Usa il percorso relativo corretto, senza includere API_URL che è già incluso in ApiService
      const response = await ApiService.get<PathTemplate[]>('/api/path-templates');
      console.log('Template di percorsi caricati:', response);
      return response;
    } catch (error: any) {
      // L'errore 403 indica che l'utente non ha le autorizzazioni necessarie (es. solo admin)
      if (error.response?.status === 403) {
        NotificationsService.error(
          'Non hai le autorizzazioni necessarie per accedere a questa risorsa',
          'Accesso negato'
        );
        return [];
      }
      
      console.error('Errore nel recupero dei template di percorsi:', error);
      NotificationsService.error(
        'Si è verificato un errore nel caricamento dei template di percorsi. Riprova più tardi.',
        'Errore di caricamento'
      );
      return [];
    }
  }

  /**
   * Ottiene un template di percorso specifico per ID
   */
  public async getPathTemplate(id: string): Promise<PathTemplate> {
    return await ApiService.get<PathTemplate>(`${API_URL}/api/path-templates/${id}`);
  }

  /**
   * Crea un nuovo template di percorso
   * Admin e parent possono creare template
   */
  public async createPathTemplate(template: Omit<PathTemplate, 'id'>): Promise<PathTemplate> {
    try {
      console.log('Creazione template percorso:', template);
      const result = await ApiService.post<PathTemplate>(`${API_URL}/api/path-templates`, template);
      NotificationsService.success(
        `Il percorso "${template.title}" è stato creato con successo.`,
        'Percorso creato'
      );
      return result;
    } catch (error) {
      console.error('Errore creazione template percorso:', error);
      // ApiService già gestisce la visualizzazione degli errori tramite ApiErrorHandler
      throw error;
    }
  }

  /**
   * Aggiorna un template di percorso esistente
   * Solo il creatore del template può modificarlo
   */
  public async updatePathTemplate(id: string, template: Partial<PathTemplate>): Promise<PathTemplate> {
    try {
      console.log('Aggiornamento template percorso:', template);
      const result = await ApiService.put<PathTemplate>(`${API_URL}/api/path-templates/${id}`, template);
      NotificationsService.success(
        `Il percorso "${template.title || 'selezionato'}" è stato aggiornato.`,
        'Percorso aggiornato'
      );
      return result;
    } catch (error) {
      console.error('Errore aggiornamento template percorso:', error);
      throw error;
    }
  }
  
  /**
   * Cambia la visibilità di un template (pubblico/privato)
   * Solo il creatore del template può modificare la visibilità
   */
  public async toggleTemplateVisibility(id: string, isPublic: boolean): Promise<PathTemplate> {
    try {
      const result = await ApiService.put<PathTemplate>(`${API_URL}/api/path-templates/${id}`, {
        is_public: isPublic
      });
      
      NotificationsService.success(
        `Il percorso è stato reso ${isPublic ? 'pubblico' : 'privato'}.`,
        'Visibilità aggiornata'
      );
      return result;
    } catch (error) {
      console.error('Errore aggiornamento visibilità template:', error);
      throw error;
    }
  }

  /**
   * Elimina un template di percorso
   * Solo il creatore del template può eliminarlo
   */
  public async deletePathTemplate(id: string): Promise<void> {
    try {
      await ApiService.delete(`${API_URL}/api/path-templates/${id}`);
      NotificationsService.success(
        'Il percorso è stato eliminato con successo.',
        'Percorso eliminato'
      );
    } catch (error) {
      throw error;
    }
  }

  // OPERAZIONI SUI PERCORSI ASSEGNATI

  /**
   * Ottiene tutti i percorsi assegnati allo studente corrente
   */
  public async getAssignedPaths(): Promise<Path[]> {
    const response = await this.api.get<Path[]>('/assigned');
    return response.data;
  }

  /**
   * Ottiene un percorso specifico per ID
   */
  public async getPath(id: string): Promise<Path> {
    const response = await this.api.get<Path>(`/${id}`);
    return response.data;
  }

  /**
   * Assegna un percorso a uno studente
   * Solo parent può assegnare percorsi
   */
  public async assignPath(templateId: string, studentId: string, startDate: Date, targetEndDate: Date): Promise<Path> {
    try {
      console.log("Assegnando percorso con templateId:", templateId, "tipo:", typeof templateId);
      // Converti templateId in numero e verifica che sia valido
      const templateIdNum = parseInt(templateId, 10);
      
      if (isNaN(templateIdNum)) {
        throw new Error(`ID template non valido: ${templateId}`);
      }
      
      // Utilizziamo l'API Gateway con il percorso corretto
      const result = await ApiService.post<Path>(`${API_URL}/api/paths/assign`, {
        templateId: templateIdNum, // Converti da string a int
        studentId,
        startDate: startDate.toISOString(),
        targetEndDate: targetEndDate.toISOString()
      });
      NotificationsService.success(
        'Percorso educativo assegnato con successo allo studente.',
        'Percorso assegnato'
      );
      return result; // ApiService.post restituisce direttamente il risultato, non una risposta AxiosResponse
    } catch (error) {
      console.error("Errore durante l'assegnazione del percorso:", error);
      throw error;
    }
  }

  /**
   * Aggiorna lo stato di un percorso
   */
  public async updatePathStatus(pathId: string, status: Path['status']): Promise<Path> {
    try {
      const response = await this.api.put<Path>(`/${pathId}/status`, { status });
      
      let message = '';
      let title = 'Stato percorso aggiornato';
      
      switch(status) {
        case 'in_corso':
          message = 'Il percorso è stato avviato con successo.';
          title = 'Percorso avviato';
          break;
        case 'completato':
          message = 'Congratulazioni! Il percorso è stato completato con successo.';
          title = 'Percorso completato';
          break;
        default:
          message = `Lo stato del percorso è stato aggiornato a: ${status}.`;
      }
      
      NotificationsService.success(message, title);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Aggiorna il progresso di un percorso
   * Chiamato automaticamente quando i quiz vengono completati
   */
  public async updatePathProgress(pathId: string, progress: number): Promise<Path> {
    try {
      const response = await this.api.put<Path>(`/${pathId}/progress`, { progress });
      
      // Mostra notifica solo per progressi significativi (25%, 50%, 75%, 100%)
      if (progress === 100) {
        NotificationsService.success(
          'Congratulazioni! Hai completato il 100% del percorso educativo.',
          'Percorso completato',
          { autoClose: true, duration: 6000 }
        );
      } else if (progress === 75) {
        NotificationsService.info(
          'Ottimo lavoro! Hai completato il 75% del percorso educativo.',
          'Progresso percorso',
          { autoClose: true, duration: 4000 }
        );
      } else if (progress === 50) {
        NotificationsService.info(
          'Buon lavoro! Sei a metà del percorso educativo.',
          'Progresso percorso',
          { autoClose: true, duration: 4000 }
        );
      } else if (progress === 25) {
        NotificationsService.info(
          'Hai completato il 25% del percorso educativo. Continua così!',
          'Progresso percorso',
          { autoClose: true, duration: 4000 }
        );
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Ottiene le statistiche di un percorso specifico
   */
  public async getPathStatistics(pathId: string): Promise<PathStatistics> {
    const response = await this.api.get<PathStatistics>(`/${pathId}/statistics`);
    return response.data;
  }

  /**
   * Ottiene tutti i percorsi assegnati agli studenti di un genitore
   * Solo parent può vedere i percorsi dei propri figli
   */
  public async getStudentPaths(studentId: string): Promise<Path[]> {
    const response = await this.api.get<Path[]>(`/student/${studentId}`);
    return response.data;
  }

  /**
   * Ottiene le statistiche di tutti i percorsi di uno studente
   */
  public async getStudentPathStatistics(studentId: string): Promise<PathStatistics[]> {
    const response = await this.api.get<PathStatistics[]>(`/statistics/student/${studentId}`);
    return response.data;
  }
  /**
   * Ottiene tutti i nodi di un template di percorso
   * @param templateId L'ID del template di percorso
   */
  public async getTemplateNodes(templateId: string): Promise<PathNodeTemplate[]> {
    try {
      console.log(`%c[DEBUG] Richiedo i nodi del template con ID: ${templateId}`, 'background: #222; color: #bada55; font-size: 14px;');
      const url = `/api/path-templates/${templateId}/nodes`;
      console.log(`[DEBUG] URL completo della richiesta: ${url}`);
      
      const response = await ApiService.get(url);
      console.log('%c[DEBUG] RISPOSTA RAW DALL\'API:', 'background: #f00; color: #fff; font-size: 16px;');
      console.log(response);
      console.log('%c[DEBUG] DATI RISPOSTA RAW:', 'background: #f00; color: #fff; font-size: 16px;');
      console.log(JSON.stringify(response.data, null, 2));
      
      if (response.data && Array.isArray(response.data)) {
        console.log(`%c[DEBUG] Numero di nodi trovati: ${response.data.length}`, 'background: #222; color: #bada55;');
        
        // DEBUG: Visualizziamo ogni nodo per tipo
        response.data.forEach((node: any, index: number) => {
          console.log(`%c[DEBUG] NODO #${index+1}:`, 'background: #00f; color: #fff;');
          console.log(`Tipo: ${node.node_type || 'N/A'}, ID: ${node.id || 'N/A'}, Titolo: ${node.title || 'N/A'}`);
          console.log('Contenuto completo del nodo:', node);
          
          // Se è un nodo quiz, evidenziamolo
          if (node.node_type === 'quiz' || (node.content && (node.content.quiz_id || node.content.quiz_template_id))) {
            console.log(`%c[DEBUG] TROVATO NODO QUIZ!`, 'background: #0f0; color: #000; font-size: 16px;');
            console.log('Dettagli nodo quiz:', {
              id: node.id,
              title: node.title,
              type: node.node_type,
              content: node.content
            });
          }
        });
        
        // Normalizza i dati ricevuti dal backend per adattarli al formato del frontend
        const normalizedNodes = response.data.map((node: any) => {
          // Assicuriamoci che l'ID sia sempre una stringa
          const nodeId = node.id?.toString() || node.uuid || '';
          
          // Nel DB i tipi sono in MAIUSCOLO (es. 'QUIZ'), nel frontend usiamo minuscolo ('quiz')
          // Prima controlla esplicitamente per 'QUIZ' dato che è il caso più importante
          let nodeType;
          if (typeof node.node_type === 'string' && node.node_type.toUpperCase() === 'QUIZ') {
            nodeType = 'quiz';
            console.log(`%c[DEBUG] Convertito tipo nodo da QUIZ maiuscolo a 'quiz'`, 'background: #0c0; color: #000;');
          } else {
            // Per gli altri tipi, converti comunque tutto in minuscolo per coerenza
            nodeType = (typeof node.node_type === 'string') 
              ? node.node_type.toLowerCase() 
              : 'content';
          }
          
          // Controllo aggiuntivo per i nodi quiz basato sul contenuto
          if (nodeType !== 'quiz' && node.content) {
            const hasQuizId = node.content.quiz_id || node.content.quiz_template_id;
            if (hasQuizId) {
              console.log(`%c[DEBUG] Rilevato nodo quiz dal contenuto anche se node_type non era quiz:`, 'background: #ff0; color: #000;', node);
              nodeType = 'quiz'; // Forza il tipo a quiz se contiene un ID quiz
            }
          }
          
          // Crea un nodo normalizzato con tutte le proprietà necessarie
          const normalizedNode = {
            ...node,
            id: nodeId,
            node_type: nodeType as 'quiz' | 'content' | 'task' | 'milestone' | 'reward',
            // Assicurati che tutte le proprietà obbligatorie abbiano valori di default
            title: node.title || 'Senza titolo',
            description: node.description || '',
            content: node.content || {},
            additional_data: node.additional_data || {}
          };
          
          // Log speciale per i nodi quiz identificati
          if (normalizedNode.node_type === 'quiz') {
            console.log(`%c[DEBUG] NODO QUIZ NORMALIZZATO:`, 'background: #0c0; color: #fff; font-weight: bold;', {
              id: normalizedNode.id,
              title: normalizedNode.title,
              quiz_id: normalizedNode.content?.quiz_template_id || normalizedNode.content?.quiz_id
            });
          }
          
          return normalizedNode;
        });
        
        // Verifica se ci sono nodi quiz dopo la normalizzazione
        const quizNodes = normalizedNodes.filter((node: PathNodeTemplate) => 
          node.node_type === 'quiz' || (node.content && (node.content.quiz_id || node.content.quiz_template_id))
        );
        
        console.log(`%c[DEBUG] QUIZ TROVATI DOPO NORMALIZZAZIONE: ${quizNodes.length}`, 'background: #0f0; color: #000; font-size: 16px;');
        if (quizNodes.length > 0) {
          console.log(quizNodes);
        }
        
        return normalizedNodes;
      } else {
        console.warn(`[DEBUG] Risposta non valida per i nodi del template. Data ricevuto:`, response.data);
        return [];
      }
    } catch (error: any) {
      console.error(`[DEBUG] Errore nel caricamento dei nodi del template ${templateId}:`, error);
      if (error.response) {
        console.error(`[DEBUG] Dettagli risposta errore:`, {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      throw error;
    }
  }

  /**
   * Crea un nuovo nodo per un template di percorso
   * @param templateId L'ID del template di percorso
   * @param node I dati del nodo da creare
   */
  public async createTemplateNode(templateId: string, node: Omit<PathNodeTemplate, 'id' | 'path_template_id'>): Promise<PathNodeTemplate> {
    try {
      const response = await ApiService.post(`/api/path-templates/${templateId}/nodes`, node);
      return response.data;
    } catch (error) {
      console.error(`Errore nella creazione del nodo per il template ${templateId}:`, error);
      NotificationsService.error('Impossibile creare il nodo. Riprova più tardi.');
      throw error;
    }
  }

  /**
   * Aggiorna un nodo di un template di percorso
   * @param nodeId L'ID del nodo da aggiornare
   * @param nodeData I dati aggiornati del nodo
   */
  public async updateTemplateNode(nodeId: string, nodeData: Partial<PathNodeTemplate>): Promise<PathNodeTemplate> {
    try {
      const response = await ApiService.put(`/api/path-templates/nodes/${nodeId}`, nodeData);
      return response.data;
    } catch (error) {
      console.error(`Errore nell'aggiornamento del nodo ${nodeId}:`, error);
      NotificationsService.error('Impossibile aggiornare il nodo. Riprova più tardi.');
      throw error;
    }
  }

  /**
   * Elimina un nodo di un template di percorso
   * @param nodeId L'ID del nodo da eliminare
   */
  public async deleteTemplateNode(nodeId: string | number): Promise<void> {
    try {
      console.log(`[DEBUG] deleteTemplateNode chiamato con nodeId: ${nodeId} (tipo: ${typeof nodeId})`);
      
      // Assicuriamoci che l'URL sia costruito correttamente indipendentemente dal tipo di ID
      const url = `/api/path-templates/nodes/${nodeId}`;
      console.log(`[DEBUG] URL per la cancellazione: ${url}`);
      
      await ApiService.delete(url);
      console.log(`[DEBUG] Nodo ${nodeId} eliminato con successo`);
    } catch (error: any) {
      console.error(`[DEBUG] Errore nell'eliminazione del nodo ${nodeId}:`, error);
      if (error.response) {
        console.error(`[DEBUG] Dettagli risposta errore:`, {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      NotificationsService.error('Impossibile eliminare il nodo. Riprova più tardi.');
      throw error;
    }
  }

  /**
   * Crea un nodo quiz collegando un quiz template a un path template
   * @param templateId L'ID del template di percorso
   * @param quizId L'ID del quiz template da collegare
   * @param nodeData Dati aggiuntivi per il nodo (titolo, descrizione, ecc.)
   */
  public async addQuizToPathTemplate(templateId: string, quizId: string, nodeData: Partial<PathNodeTemplate>): Promise<PathNodeTemplate> {
    try {
      console.log(`%c[DEBUG] addQuizToPathTemplate chiamato con:`, 'background: #00c; color: #fff;');
      console.log(`Template ID: ${templateId}, Quiz ID: ${quizId}`);
      console.log('Node data ricevuto:', nodeData);
      
      // Assicurati che l'ID del template sia una stringa
      const normalizedTemplateId = String(templateId);
      const normalizedQuizId = String(quizId);
      
      // Prepara i dati del nodo quiz in base al formato atteso dall'API
      const quizNode = {
        title: nodeData.title || 'Quiz',
        description: nodeData.description || 'Completa questo quiz per procedere',
        // Assicuriamoci che il tipo sia sempre 'quiz' (in minuscolo)
        node_type: 'quiz' as const,
        points: typeof nodeData.points === 'number' ? nodeData.points : 10,
        order: typeof nodeData.order === 'number' ? nodeData.order : 1,
        content: { 
          quiz_template_id: normalizedQuizId, // Nome chiave corretto richiesto dallo schema backend
          type: 'quiz' // Aggiungiamo un campo extra per garantire che sia identificabile come quiz
        },
        estimated_time: typeof nodeData.estimated_time === 'number' ? nodeData.estimated_time : 30, // Tempo stimato in minuti
        dependencies: nodeData.dependencies || {}, // Deve essere un oggetto di array, non un array diretto
        additional_data: {
          ...nodeData.additional_data || {},
          node_subtype: 'quiz', // Campo aggiuntivo per garantire la rilevazione del nodo come quiz
          is_quiz: true // Flag esplicito
        }
      };
      
      console.log('%c[DEBUG] Invio dati nodo quiz:', 'background: #00c; color: #fff;');
      console.log(JSON.stringify(quizNode, null, 2));
      
      // Crea il nodo e ottieni la risposta
      const createdNode = await this.createTemplateNode(normalizedTemplateId, quizNode);
      
      console.log('%c[DEBUG] Nodo quiz creato con successo:', 'background: #0c0; color: #000;');
      console.log(createdNode);
      
      // Recupera tutti i nodi per assicurarci che il quiz sia stato aggiunto correttamente
      const allNodes = await this.getTemplateNodes(normalizedTemplateId);
      const quizNodes = allNodes.filter(n => 
        n.node_type === 'quiz' || 
        (n.content && (n.content.quiz_id || n.content.quiz_template_id))
      );
      
      console.log(`%c[DEBUG] Verifica: ${quizNodes.length} quiz presenti nel template dopo l'aggiunta`, 'background: #00c; color: #fff;');
      
      // Ritorna il nodo creato
      return createdNode;
    } catch (error: any) {
      console.error(`%c[DEBUG] Errore nell'aggiunta del quiz ${quizId} al template ${templateId}:`, 'background: #f00; color: #fff;', error);
      
      // Log dettagliato dell'errore
      if (error.response) {
        console.error('Dettagli errore API:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      
      NotificationsService.error('Impossibile aggiungere il quiz al percorso. Riprova più tardi.');
      throw error;
    }
  }

  /**
   * Rimuove un quiz dal template di percorso
   * @param nodeId L'ID del nodo quiz da rimuovere
   */
  public async removeQuizFromPathTemplate(nodeId: string | number): Promise<void> {
    try {
      console.log(`[DEBUG] removeQuizFromPathTemplate chiamato con nodeId: ${nodeId} (tipo: ${typeof nodeId})`);
      
      // Gestione dell'ID del nodo
      let processedNodeId = nodeId;
      
      // Se l'ID è una stringa che sembra un numero, proviamo a convertirlo in numero
      if (typeof nodeId === 'string' && !isNaN(Number(nodeId))) {
        processedNodeId = Number(nodeId);
        console.log(`[DEBUG] ID convertito da stringa a numero: ${processedNodeId}`);
      }
      
      // Utilizziamo il metodo esistente deleteTemplateNode per rimuovere il nodo quiz
      await this.deleteTemplateNode(processedNodeId);
      console.log(`[DEBUG] Quiz rimosso con successo`);
      NotificationsService.success('Quiz rimosso dal percorso con successo', 'Operazione completata');
    } catch (error) {
      console.error(`[DEBUG] Errore nella rimozione del quiz (nodeId: ${nodeId}):`, error);
      NotificationsService.error('Impossibile rimuovere il quiz dal percorso. Riprova più tardi.');
      throw error;
    }
  }
}

// Esporta una singola istanza del servizio
export default new PathService();
