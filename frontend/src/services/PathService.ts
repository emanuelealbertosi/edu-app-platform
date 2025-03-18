import axios, { AxiosInstance } from 'axios';
import { NotificationsService } from './NotificationsService';
import ApiService from './ApiService';

// Fix per errore lint: "Cannot find name 'process'"
declare const process: {
  env: {
    REACT_APP_API_URL?: string;
    NODE_ENV?: string;
  };
};

// Determina l'URL dell'API in base all'ambiente
const getApiUrl = () => {
  // Usa l'URL configurato in .env se disponibile
  const configuredUrl = process.env.REACT_APP_API_URL;
  if (configuredUrl) return configuredUrl;
  
  // Altrimenti, usa l'host corrente con la porta 8000
  const currentHost = window.location.hostname;
  return `http://${currentHost}:8000`;
};

const API_URL = getApiUrl();
const PATH_API_URL = `${API_URL}/api/paths`;

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
  targetEndDate: Date | null; // Aggiornato per rispettare l'interfaccia Path
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
  private apiBaseUrl: string = API_URL;

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
        const token = this.getToken();
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
   * Ottiene tutti i percorsi assegnati a uno studente specifico
   * Questo metodo viene utilizzato sia nel pannello genitore che nel pannello studente
   * per garantire che entrambi visualizzino e modifichino gli stessi percorsi concreti
   */
  public async getPathsForStudentId(studentId: string): Promise<Path[]> {
    try {
      console.log(`%c[DEBUG getPathsForStudentId] Inizio recupero percorsi per studentId:`, 'background: #2196F3; color: white; padding: 2px 4px; border-radius: 2px;', studentId);
      
      if (!studentId) {
        console.log(`%c[DEBUG getPathsForStudentId] studentId mancante o vuoto`, 'background: #F44336; color: white; padding: 2px 4px; border-radius: 2px;');
        throw new Error('ID studente non valido');
      }
      
      // Aggiungiamo un timestamp per evitare problemi di cache
      const timestamp = new Date().getTime();
      
      // Non aggiungiamo /api/paths perché PATH_API_URL contiene già il percorso completo
      const endpoint = `?student_id=${studentId}&include_nodes=true&_t=${timestamp}`;
      
      console.log(`%c[DEBUG getPathsForStudentId] Chiamata API:`, 'background: #2196F3; color: white; padding: 2px 4px; border-radius: 2px;', PATH_API_URL + endpoint);
      
      // Usando this.api.get invece di fetch
      const response = await this.api.get<any[]>(endpoint);
      
      console.log(`%c[DEBUG getPathsForStudentId] Status risposta:`, 'background: #2196F3; color: white; padding: 2px 4px; border-radius: 2px;', response.status, response.statusText);
      
      // Estrazione dati dalla risposta axios
      const data = response.data;
      console.log(`%c[DEBUG getPathsForStudentId] Dati risposta completi:`, 'background: #2196F3; color: white; padding: 2px 4px; border-radius: 2px;', JSON.stringify(data, null, 2));
      
      if (!data || !Array.isArray(data)) {
        console.log(`%c[DEBUG getPathsForStudentId] Dati non validi o vuoti:`, 'background: #F44336; color: white; padding: 2px 4px; border-radius: 2px;', data);
        return [];
      }
      
      console.log(`%c[DEBUG getPathsForStudentId] Numero percorsi ricevuti:`, 'background: #4CAF50; color: white; padding: 2px 4px; border-radius: 2px;', data.length);
      
      // Map per trasformare i dati dal formato API al formato app
      const mappedPaths = data.map((path: any) => {
        console.log(`%c[DEBUG getPathsForStudentId] Elaborazione percorso:`, 'background: #FF9800; color: white; padding: 2px 4px; border-radius: 2px;', path.id, path.title);
        
        // Normalizziamo i valori chiave per garantire coerenza
        const id = path.id?.toString() || path.uuid?.toString() || '';
        const templateId = path.template_id?.toString() || path.template?.id?.toString() || '';
        const title = path.template_title || path.title || 'Percorso senza titolo';
        const description = path.description || '';
        
        // Normalizziamo lo stato del percorso
        let status: 'assegnato' | 'in_corso' | 'completato' = 'assegnato';
        if (path.status) {
          const normalizedStatus = path.status.toLowerCase();
          if (normalizedStatus.includes('complet')) {
            status = 'completato';
          } else if (normalizedStatus.includes('progress') || normalizedStatus.includes('corso')) {
            status = 'in_corso';
          }
        }
        
        // Normalizziamo il progresso
        let progress = 0;
        if (path.completion_percentage !== undefined) {
          progress = path.completion_percentage;
        } else if (path.node_count && path.completed_nodes) {
          // Se abbiamo il conteggio dei nodi dal backend, usiamo quello
          const totalNodes = path.node_count;
          const completedNodes = path.completed_nodes;
          if (totalNodes > 0) {
            progress = Math.round((completedNodes / totalNodes) * 100);
          }
        } else if (path.nodes && Array.isArray(path.nodes)) {
          // Altrimenti contiamo i nodi nella risposta
          const totalNodes = path.nodes.length;
          if (totalNodes > 0) {
            const completedNodes = path.nodes.filter((node: any) => 
              node.status === 'COMPLETED' || 
              node.status?.toLowerCase() === 'completed'
            ).length;
            progress = Math.round((completedNodes / totalNodes) * 100);
          }
        }
        
        // Estrai i quiz dai nodi se disponibili
        const quizzes = [];
        if (path.nodes && Array.isArray(path.nodes)) {
          // Use a Set to track unique quiz IDs
          const processedQuizIds = new Set<string>();
          
          for (const node of path.nodes) {
            if (node.node_type === 'quiz' || node.content?.quiz_id) {
              // Determine the actual quiz ID to use for deduplication
              const quizId = node.content?.quiz_id || node.id.toString();
              
              // Skip if we've already processed this quiz
              if (processedQuizIds.has(quizId)) {
                continue;
              }
              
              // Mark as processed
              processedQuizIds.add(quizId);
              
              // Converti lo stato del nodo al formato richiesto dall'interfaccia Path
              let quizStatus: 'da_iniziare' | 'in_corso' | 'completato' = 'da_iniziare';
              if (node.status) {
                const normalizedNodeStatus = node.status.toLowerCase();
                if (normalizedNodeStatus.includes('complet')) {
                  quizStatus = 'completato';
                } else if (normalizedNodeStatus.includes('progress') || normalizedNodeStatus.includes('corso')) {
                  quizStatus = 'in_corso';
                }
              }
              
              quizzes.push({
                quizId: quizId,
                title: node.title || node.content?.title || 'Quiz senza titolo',
                status: quizStatus,
                score: node.score !== undefined ? node.score : undefined,
                maxScore: node.max_score !== undefined ? node.max_score : 100, // Assegna un valore di default se manca
                completedAt: node.completed_at ? new Date(node.completed_at) : undefined
              });
            }
          }
        }
        
        return {
          id: id,
          templateId: templateId,
          studentId: path.student_id?.toString() || path.student?.id?.toString() || '',
          title: title,
          description: description,
          progress: progress,
          subject: path.subject || 'Non specificata',
          difficulty: this.mapDifficultyLevel(path.difficulty_level),
          status: status,
          startDate: path.started_at ? new Date(path.started_at) : 
                    path.start_date ? new Date(path.start_date) : new Date(),
          targetEndDate: path.target_end_date ? new Date(path.target_end_date) : null, // Aggiornato per rispettare l'interfaccia Path
          quizzes: quizzes
        };
      }) as Path[];
      
      return mappedPaths;
    } catch (error) {
      console.error('Errore nel recupero dei percorsi assegnati:', error);
      NotificationsService.error(
        'Errore nel recupero dei percorsi assegnati',
        'Errore'
      );
      return [];
    }
  }
  
  /**
   * Ottiene tutti i percorsi assegnati allo studente corrente
   */
  public async getAssignedPaths(): Promise<Path[]> {
    try {
      // Otteniamo l'ID dello studente corrente
      const studentId = this.getCurrentStudentId();
      
      console.log(`%c[DEBUG getAssignedPaths] ID studente corrente:`, 'background: #673AB7; color: white; padding: 2px 4px; border-radius: 2px;', studentId);
      
      // Debug: vediamo cosa c'è nel localStorage
      console.log(`%c[DEBUG getAssignedPaths] Contenuto localStorage:`, 'background: #673AB7; color: white; padding: 2px 4px; border-radius: 2px;', {
        user: localStorage.getItem('user'),
        accessToken: localStorage.getItem('accessToken')
      });
      
      if (!studentId) {
        console.error('ID studente non disponibile');
        NotificationsService.error('Impossibile identificare lo studente corrente. Rieffettua il login.', 'Errore');
        return [];
      }
      
      // Utilizziamo il metodo condiviso per garantire coerenza
      return this.getPathsForStudentId(studentId);
    } catch (error) {
      console.error('Errore nel recupero dei percorsi assegnati:', error);
      NotificationsService.error(
        'Errore nel recupero dei percorsi assegnati',
        'Errore'
      );
      return [];
    }
  }

  /**
   * Ottiene l'ID dello studente corrente dal localStorage
   * Per ora forziamo ad usare 1 come ID studente per l'ambiente di sviluppo locale
   */
  private getCurrentStudentId(): string {
    try {
      // DEBUG: Per l'ambiente di sviluppo, forciamo l'ID 1
      if (process.env.NODE_ENV === 'development') {
        console.log(`%c[DEBUG getCurrentStudentId] In ambiente di sviluppo, uso l'ID studente fisso: 1`, 'background: #4CAF50; color: white; padding: 2px 4px; border-radius: 2px;');
        return '1';
      }
      
      const userStr = localStorage.getItem('user');
      console.log(`%c[DEBUG getCurrentStudentId] User dal localStorage:`, 'background: #9C27B0; color: white; padding: 2px 4px; border-radius: 2px;', userStr);
      
      if (!userStr) {
        console.log(`%c[DEBUG getCurrentStudentId] Nessun dato utente trovato in localStorage`, 'background: #F44336; color: white; padding: 2px 4px; border-radius: 2px;');
        return '1'; // Fallback per l'ambiente di sviluppo
      }
      
      const user = JSON.parse(userStr);
      console.log(`%c[DEBUG getCurrentStudentId] User parsato:`, 'background: #9C27B0; color: white; padding: 2px 4px; border-radius: 2px;', user);
      
      if (user.role === 'student') {
        // Se siamo in ambiente di sviluppo, usiamo sempre 1
        if (process.env.NODE_ENV === 'development') {
          return '1';
        }
        console.log(`%c[DEBUG getCurrentStudentId] Utente è studente, ID:`, 'background: #4CAF50; color: white; padding: 2px 4px; border-radius: 2px;', user.id);
        return user.id;
      } else if (user.role === 'parent' && user.activeStudentId) {
        // Se siamo in ambiente di sviluppo, usiamo sempre 1
        if (process.env.NODE_ENV === 'development') {
          return '1';
        }
        console.log(`%c[DEBUG getCurrentStudentId] Utente è genitore con studente attivo, ID:`, 'background: #4CAF50; color: white; padding: 2px 4px; border-radius: 2px;', user.activeStudentId);
        return user.activeStudentId;
      }
      
      console.log(`%c[DEBUG getCurrentStudentId] Nessun ID studente trovato per il ruolo, uso valore di default:`, 'background: #F44336; color: white; padding: 2px 4px; border-radius: 2px;', user.role);
      return '1'; // Fallback per l'ambiente di sviluppo
    } catch (error) {
      console.error('Errore nel recupero dell\'ID studente:', error);
      return '1'; // Fallback per l'ambiente di sviluppo
    }
  }

  /**
   * Converte il livello di difficoltà numerico in una stringa
   */
  private mapDifficultyLevel(level: any): 'facile' | 'medio' | 'difficile' {
    if (!level) return 'medio';
    
    // Se è già una stringa
    if (typeof level === 'string') {
      const normalizedLevel = level.toLowerCase();
      if (normalizedLevel.includes('facil') || normalizedLevel.includes('easy') || normalizedLevel === '1') {
        return 'facile';
      } else if (normalizedLevel.includes('diff') || normalizedLevel.includes('hard') || normalizedLevel === '3') {
        return 'difficile';
      } else {
        return 'medio';
      }
    }
    
    // Se è un numero
    if (typeof level === 'number') {
      if (level === 1) return 'facile';
      if (level === 3) return 'difficile';
      return 'medio';
    }
    
    // Default
    return 'medio';
  }

  /**
   * Converte lo stato di completamento dall'API in una stringa
   */
  private mapCompletionStatus(status?: string): 'non_iniziato' | 'in_corso' | 'completato' {
    if (!status) return 'non_iniziato';
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus.includes('complet')) return 'completato';
    if (normalizedStatus.includes('progress') || normalizedStatus.includes('corso')) return 'in_corso';
    return 'non_iniziato';
  }

  /**
   * Ottiene un percorso specifico per ID
   */
  public async getPath(id: string): Promise<Path> {
    const response = await this.api.get<Path>(`/${id}`);
    return response.data;
  }

  /**
   * Ottiene i dettagli completi di un percorso specifico per ID, inclusi i quiz associati
   * Utilizzato dalla pagina di dettaglio del percorso per lo studente
   */
  public async getPathDetail(pathId: string): Promise<any> {
    try {
      console.log(`[DEBUG-PathService] Starting getPathDetail for path ID: ${pathId}`);
      
      let path: any = null;
      let accessDenied = false;
      
      // Prima proviamo l'endpoint principale del path
      try {
        const response = await this.api.get(`/${pathId}`);
        console.log('[DEBUG-PathService] Path API response:', response.data);
        path = response.data;
      } catch (pathError: any) {
        console.warn('[DEBUG-PathService] Error fetching path details:', pathError.response?.status);
        
        // Se otteniamo un 403, significa che non abbiamo accesso diretto al percorso
        // ma potremmo comunque avere accesso ai nodi
        if (pathError.response?.status === 403) {
          console.log('[DEBUG-PathService] Access forbidden to path details, but we might have access to nodes');
          accessDenied = true;
          
          // Creiamo un oggetto path minimo che verrà completato più avanti
          path = {
            id: pathId,
            title: 'Percorso',
            description: 'Dettagli non disponibili',
            subject: 'Non disponibile',
            difficulty_level: 2,
            status: 'in_corso',
            completion_percentage: 0
          };
        } else {
          // Per altri errori, rilanciamo per essere gestiti dal catch esterno
          throw pathError;
        }
      }
      
      // A questo punto abbiamo un path (o reale o minimo)
      // Ottieni i nodi del percorso (che dovrebbero includere i quiz)
      let quizzes = [];
      
      try {
        // Proviamo a recuperare i nodi del percorso dall'endpoint specifico
        console.log(`[DEBUG-PathService] Calling GET ${API_URL}/api/paths/${pathId}/nodes`);
        const nodesResponse = await ApiService.get(`${API_URL}/api/paths/${pathId}/nodes`);
        console.log('[DEBUG-PathService] Nodes response type:', typeof nodesResponse, 'isArray:', Array.isArray(nodesResponse));
        
        if (Array.isArray(nodesResponse)) {
          console.log(`[DEBUG-PathService] Found ${nodesResponse.length} nodes in path`);
          
          // Se avevamo access denied, possiamo estrarre alcuni dettagli del percorso dai nodi
          if (accessDenied && nodesResponse.length > 0) {
            // Cerchiamo il primo nodo con un titolo decente
            const nodeWithTitle = nodesResponse.find(node => node.title && node.title.length > 3);
            if (nodeWithTitle) {
              path.title = `Percorso: ${nodeWithTitle.title.split(':')[0]}`;
            }
            
            // Calcoliamo la percentuale di completamento in base ai nodi completati
            const completedNodes = nodesResponse.filter(node => 
              node.status?.toLowerCase().includes('complet')
            ).length;
            path.completion_percentage = Math.round((completedNodes / nodesResponse.length) * 100);
          }
          
          // Print full debug of all nodes with their details
          nodesResponse.forEach((node, index) => {
            console.log(`[DEBUG-PathService] Node #${index+1}:`, {
              id: node.id,
              type: node.node_type,
              title: node.title,
              hasContent: !!node.content,
              contentKeys: node.content ? Object.keys(node.content) : [],
              quizId: node.content?.quiz_id
            });
          });
          
          // Extract only quiz nodes that have an associated quiz
          const validQuizNodes = nodesResponse.filter(node => {
            const isValid = (node.node_type === 'quiz' && node.content?.quiz_id) || 
                     (node.content && node.content.quiz_id);
                     
            if (isValid) {
              console.log(`[DEBUG-PathService] Found valid quiz node:`, {
                id: node.id,
                type: node.node_type,
                quizId: node.content?.quiz_id
              });
            }
            
            return isValid;
          });
          
          console.log('[DEBUG-PathService] Valid quiz nodes found:', validQuizNodes.length);
          
          if (validQuizNodes.length === 0) {
            // If no valid nodes found, check all nodes for any quiz-related data
            console.log('[DEBUG-PathService] No valid quiz nodes found, checking all nodes for quiz data');
            
            // Try to find any quiz-like nodes
            const potentialQuizNodes = nodesResponse.filter(node => 
              node.node_type === 'quiz' || 
              node.title?.toLowerCase().includes('quiz') ||
              node.description?.toLowerCase().includes('quiz')
            );
            
            if (potentialQuizNodes.length > 0) {
              console.log(`[DEBUG-PathService] Found ${potentialQuizNodes.length} potential quiz nodes`);
              
              // Create quiz objects from these nodes even if they don't have quiz_id
              validQuizNodes.push(...potentialQuizNodes);
            }
          }
          
          // Create a Map to deduplicate quizzes properly
          // We'll track both template IDs and node IDs to ensure we don't add duplicates
          const processedTemplateIds = new Set<string>();
          const processedNodeIds = new Set<string>();
          const deduplicatedQuizzes: any[] = [];
          
          console.log('[DEBUG-PathService] Starting quiz deduplication with', validQuizNodes.length, 'nodes');
          
          // Create quiz objects for display, with deduplication
          for (const node of validQuizNodes) {
            // Get both IDs for tracking
            const nodeId = node.id?.toString();
            const templateId = node.content?.quiz_id?.toString();
            
            // For deduplication, skip if we've seen this node or template before
            if (nodeId && processedNodeIds.has(nodeId)) {
              console.log(`[DEBUG-PathService] Skipping duplicate node ID ${nodeId}`);
              continue;
            }
            
            if (templateId && processedTemplateIds.has(templateId)) {
              console.log(`[DEBUG-PathService] Skipping duplicate template ID ${templateId}`);
              continue;
            }
            
            // Track that we've processed this node/template
            if (nodeId) processedNodeIds.add(nodeId);
            if (templateId) processedTemplateIds.add(templateId);
            
            // Create a quiz object for this node regardless of whether template exists
            const quizObj = {
              id: nodeId,
              templateId: templateId || nodeId,
              title: node.title || node.content?.title || 'Quiz senza titolo',
              description: node.description || node.content?.description || 'Nessuna descrizione disponibile',
              status: this.mapQuizStatus(node.status),
              completedAt: node.completed_at,
              pointsAwarded: node.points_awarded || node.points || 0
            };
            
            // Add this quiz to our deduplicated list
            console.log(`[DEBUG-PathService] Added unique quiz with nodeId=${nodeId}, templateId=${templateId}`);
            deduplicatedQuizzes.push(quizObj);
          }
          
          // Replace the quizzes array with our deduplicated version
          quizzes = deduplicatedQuizzes;
          
          console.log('[DEBUG-PathService] Final quizzes after deduplication:', quizzes.length);
        } else {
          console.error('[DEBUG-PathService] Nodes response is not an array:', nodesResponse);
        }
      } catch (nodeError) {
        console.warn('[DEBUG-PathService] Error fetching path nodes:', nodeError);
        
        // Se non riusciamo a ottenere i nodi, proviamo a usare i quiz dal percorso stesso
        if (path.quizzes && Array.isArray(path.quizzes)) {
          console.log('[DEBUG-PathService] Using quizzes from path object:', path.quizzes.length);
          quizzes = path.quizzes.map((quiz: any) => ({
            id: quiz.id,
            templateId: quiz.quiz_id || quiz.template_id || quiz.id,
            title: quiz.title || 'Quiz senza titolo',
            description: quiz.description || 'Nessuna descrizione disponibile',
            status: this.mapQuizStatus(quiz.status),
            completedAt: quiz.completed_at,
            pointsAwarded: quiz.points_awarded || 0
          }));
        } else {
          console.warn('[DEBUG-PathService] No quizzes found in path object');
        }
      }
      
      // If we didn't find any quizzes, create a test quiz
      if (quizzes.length === 0) {
        console.log('[DEBUG-PathService] No quizzes found, creating a test quiz');
        quizzes = [{
          id: 'test-quiz-1',
          templateId: 'test-template-1',
          title: 'Quiz di esempio',
          description: 'Questo è un quiz di esempio creato automaticamente perché non ne sono stati trovati altri.',
          status: 'available'
        }];
      }
      
      // Ritorna l'oggetto completo con tutti i dettagli necessari
      const pathDetail = {
        id: path.id || pathId,
        title: path.title || 'Percorso senza titolo',
        description: path.description || 'Nessuna descrizione disponibile',
        progress: path.completion_percentage || 0,
        subject: path.subject || 'Non specificata',
        difficulty: this.mapDifficultyLevel(path.difficulty_level),
        status: this.mapCompletionStatus(path.status),
        quizzes: quizzes
      };
      
      console.log('[DEBUG-PathService] Final path detail object:', pathDetail);
      return pathDetail;
    } catch (error) {
      console.error('[DEBUG-PathService] Error in getPathDetail:', error);
      NotificationsService.error(
        'Non è stato possibile caricare i dettagli del percorso',
        'Errore'
      );
      
      // Creiamo un percorso di fallback per evitare crash dell'interfaccia
      return {
        id: pathId,
        title: 'Percorso non disponibile',
        description: 'Si è verificato un errore nel caricamento del percorso. Riprova più tardi.',
        progress: 0,
        subject: 'Non disponibile',
        difficulty: 'medio',
        status: 'non_iniziato',
        quizzes: [{
          id: 'error-quiz',
          templateId: 'error-template',
          title: 'Quiz di debug',
          description: 'Questo quiz è stato creato automaticamente a causa di un errore.',
          status: 'available'
        }]
      };
    }
  }
  
  /**
   * Mappa lo stato del quiz dall'API al formato del frontend
   */
  private mapQuizStatus(status?: string): 'locked' | 'available' | 'completed' {
    if (!status) return 'available';
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus.includes('complet') || normalizedStatus.includes('completat')) return 'completed';
    if (normalizedStatus.includes('lock') || normalizedStatus.includes('blocc')) return 'locked';
    return 'available';
  }

  /**
   * Assegna un percorso a uno studente
   * Solo parent può assegnare percorsi
   */
  public async assignPath(templateId: string, studentId: string, startDate: Date, targetEndDate: Date): Promise<Path> {
    try {
      console.log("%c[DEBUG] Assegnando percorso", 'background: #1E88E5; color: white; padding: 2px 4px; border-radius: 2px;', {
        templateId,
        studentId,
        startDate: startDate.toISOString(),
        targetEndDate: targetEndDate.toISOString()
      });
      
      // Converti templateId in numero e verifica che sia valido
      const templateIdNum = parseInt(templateId, 10);
      
      if (isNaN(templateIdNum)) {
        throw new Error(`ID template non valido: ${templateId}`);
      }
      
      // Utilizziamo l'API Gateway con il percorso corretto
      const requestBody = {
        templateId: templateIdNum, // Converti da string a int
        studentId,
        startDate: startDate.toISOString(),
        targetEndDate: targetEndDate.toISOString()
      };
      
      console.log("%c[DEBUG] Chiamata API assignPath: POST /api/paths/assign", 'background: #1E88E5; color: white; padding: 2px 4px; border-radius: 2px;', requestBody);
      
      const result = await ApiService.post<Path>(`${API_URL}/api/paths/assign`, requestBody);
      
      console.log("%c[DEBUG] Risposta API assignPath:", 'background: #1E88E5; color: white; padding: 2px 4px; border-radius: 2px;', result);
      
      // Forzare un invalidamento della cache per questo studente
      this.clearPathCache(studentId);
      
      // Emetti l'evento a livello di window per assicurarsi che sia visibile in tutta l'applicazione
      const event = new CustomEvent('student-data-updated', { 
        detail: { 
          studentId,
          action: 'path-assigned',
          timestamp: Date.now()
        } 
      });
      
      // Emetti l'evento a livello di window per assicurarsi che sia visibile in tutta l'applicazione
      window.dispatchEvent(event);
      
      console.log(`%c[DEBUG] Evento student-data-updated inviato per lo studente ${studentId}`, 'background: #1E88E5; color: white; padding: 2px 4px; border-radius: 2px;');
      
      // Facciamo immediatamente una chiamata per ottenere i percorsi aggiornati
      // e verificare che siano stati effettivamente salvati
      console.log(`%c[DEBUG] Verifica aggiornamento percorsi dopo assegnazione`, 'background: #673AB7; color: white; padding: 2px 4px; border-radius: 2px;');
      
      setTimeout(async () => {
        try {
          const updatedPaths = await this.getPathsForStudentId(studentId);
          console.log(`%c[DEBUG] Percorsi aggiornati dopo assegnazione:`, 'background: #673AB7; color: white; padding: 2px 4px; border-radius: 2px;', updatedPaths);
        } catch (error) {
          console.error('Errore nella verifica dei percorsi aggiornati:', error);
        }
      }, 500);
      
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
              quiz_id: node.content?.quiz_template_id || node.content?.quiz_id
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
            additional_data: {
              ...node.additional_data || {},
              node_subtype: 'quiz', // Campo aggiuntivo per garantire la rilevazione del nodo come quiz
              is_quiz: true // Flag esplicito
            }
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
          node.node_type === 'quiz' || 
          (node.content && (node.content.quiz_id || node.content.quiz_template_id))
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
      
      // Log dettagliato dell'errore
      if (error.response) {
        console.error('Dettagli errore API:', {
          status: error.response.status,
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

  /**
   * Cancella la cache dei percorsi per uno studente specifico
   * Questo forza il sistema a recuperare dati freschi dal server alla prossima richiesta
   */
  private clearPathCache(studentId: string): void {
    // Per garantire che i dati vengano rinfrescati, salvare un timestamp nell'archiviazione locale
    // Tutte le richieste future per questo studente confronteranno il loro timestamp con questo
    localStorage.setItem(`path_cache_invalidated_${studentId}`, Date.now().toString());
    
    // Elenco delle chiavi di cache comuni che potrebbero contenere dati dei percorsi
    const cacheKeys = [
      `paths_${studentId}`,
      `assigned_paths_${studentId}`,
      `student_paths_${studentId}`
    ];
    
    // Rimuovere tutte le potenziali chiavi di cache
    cacheKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.log(`Impossibile rimuovere la chiave di cache ${key}`, e);
      }
    });
    
    console.log(`Cache dei percorsi invalidata per lo studente ${studentId}`);
  }

  /**
   * Ottiene il token JWT dal localStorage
   * Prova a recuperarlo da diversi campi possibili
   */
  private getToken(): string {
    try {
      // Prima proviamo dal campo user.token
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.token) {
          console.log(`%c[DEBUG getToken] Token trovato in user.token`, 'background: #4CAF50; color: white; padding: 2px 4px; border-radius: 2px;');
          return user.token;
        }
        if (user.accessToken) {
          console.log(`%c[DEBUG getToken] Token trovato in user.accessToken`, 'background: #4CAF50; color: white; padding: 2px 4px; border-radius: 2px;');
          return user.accessToken;
        }
      }
      
      // Proviamo direttamente dal campo accessToken
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        console.log(`%c[DEBUG getToken] Token trovato in localStorage.accessToken`, 'background: #4CAF50; color: white; padding: 2px 4px; border-radius: 2px;');
        return accessToken;
      }
      
      console.log(`%c[DEBUG getToken] Nessun token trovato in localStorage`, 'background: #F44336; color: white; padding: 2px 4px; border-radius: 2px;');
      return '';
    } catch (error) {
      console.error('Errore nel recupero del token:', error);
      return '';
    }
  }
}

// Esporta una singola istanza del servizio
export default new PathService();
