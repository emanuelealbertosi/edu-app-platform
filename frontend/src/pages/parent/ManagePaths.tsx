import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import PathService, { PathTemplate, PathNodeTemplate } from '../../services/PathService';
import StudentService, { Student } from '../../services/StudentService';
import QuizService, { QuizTemplate } from '../../services/QuizService';
import { NotificationsService } from '../../services/NotificationsService';
import AddQuizToPathDialog from '../../components/path/AddQuizToPathDialog';
import { 
  Typography, Box, Paper, Alert, CircularProgress, Grid, Card, CardContent, 
  CardActions, Button, TextField, Dialog, DialogTitle, DialogContent, 
  DialogActions, FormControl, InputLabel, Select, MenuItem, Chip, 
  Divider, Tab, Tabs, IconButton, FormHelperText, Stack, SelectChangeEvent,
  Switch, FormControlLabel, Tooltip, CardHeader
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  School as SchoolIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  Psychology as PsychologyIcon,
  Public as PublicIcon,
  AssignmentInd as AssignIcon,
  Quiz as QuizIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

// TabPanel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function PathTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`path-tabpanel-${index}`}
      aria-labelledby={`path-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Difficoltà disponibili
const DIFFICULTIES = [
  { value: 'facile', label: 'Facile' },
  { value: 'medio', label: 'Medio' },
  { value: 'difficile', label: 'Difficile' }
];

// Materie disponibili
const SUBJECTS = [
  { value: 'matematica', label: 'Matematica' },
  { value: 'italiano', label: 'Italiano' },
  { value: 'storia', label: 'Storia' },
  { value: 'geografia', label: 'Geografia' },
  { value: 'scienze', label: 'Scienze' },
  { value: 'inglese', label: 'Inglese' },
  { value: 'arte', label: 'Arte' },
  { value: 'musica', label: 'Musica' },
  { value: 'informatica', label: 'Informatica' }
];

const ManagePaths: React.FC = () => {
  // State per i template di percorsi
  const [pathTemplates, setPathTemplates] = useState<PathTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // State per gli studenti
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState<boolean>(false);

  // State per il form di creazione/modifica
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string>('');
  
  // State per l'assegnazione del percorso
  const [openAssignDialog, setOpenAssignDialog] = useState<boolean>(false);
  const [selectedTemplateForAssign, setSelectedTemplateForAssign] = useState<PathTemplate | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  
  // State per l'assegnazione di quiz al percorso
  const [openQuizDialog, setOpenQuizDialog] = useState<boolean>(false);
  const [selectedTemplateForQuiz, setSelectedTemplateForQuiz] = useState<PathTemplate | null>(null);
  const [availableQuizzes, setAvailableQuizzes] = useState<QuizTemplate[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [loadingQuizzes, setLoadingQuizzes] = useState<boolean>(false);
  const [quizNodeData, setQuizNodeData] = useState({
    title: '',
    description: '',
    points: 10,
    order: 1,
    estimated_time: 30
  });
  
  // State per il valore della tab
  const [tabValue, setTabValue] = useState(0);

  // State per il form
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    difficulty: '',
    estimatedDays: 0,
    skills: [] as string[],
    currentSkill: ''
  });
  
  // State per gli errori di validazione
  const [formErrors, setFormErrors] = useState({
    title: '',
    description: '',
    subject: '',
    difficulty: '',
    estimatedDays: '',
    skills: ''
  });

  // Carica i template di percorsi all'avvio
  useEffect(() => {
    loadPathTemplates();
    loadStudents();
  }, []);
  
  // Carica i quiz disponibili quando viene aperto il dialog di assegnazione quiz
  useEffect(() => {
    if (openQuizDialog) {
      loadAvailableQuizzes();
    }
  }, [openQuizDialog]);

  // Funzione per visualizzare i dati di debug in una finestra modale
  const showDebugModal = (data: any, title = 'Debug Data') => {
    // Crea un div per il debug
    const debugModal = document.createElement('div');
    debugModal.id = 'debug-modal';
    debugModal.style.position = 'fixed';
    debugModal.style.top = '50%';
    debugModal.style.left = '50%';
    debugModal.style.transform = 'translate(-50%, -50%)';
    debugModal.style.width = '80%';
    debugModal.style.maxHeight = '80vh';
    debugModal.style.backgroundColor = 'rgba(0,0,0,0.9)';
    debugModal.style.zIndex = '9999';
    debugModal.style.padding = '20px';
    debugModal.style.borderRadius = '10px';
    debugModal.style.boxShadow = '0 0 20px rgba(0,255,0,0.5)';
    debugModal.style.color = '#0f0';
    debugModal.style.fontFamily = 'monospace';
    debugModal.style.fontSize = '14px';
    debugModal.style.overflow = 'auto';
    
    // Intestazione
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.marginBottom = '15px';
    header.style.borderBottom = '1px solid #0f0';
    header.style.paddingBottom = '10px';
    
    const titleEl = document.createElement('h2');
    titleEl.textContent = title;
    titleEl.style.margin = '0';
    titleEl.style.color = '#0f0';
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'X';
    closeBtn.style.backgroundColor = '#f00';
    closeBtn.style.color = 'white';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '50%';
    closeBtn.style.width = '30px';
    closeBtn.style.height = '30px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.onclick = () => document.body.removeChild(debugModal);
    
    header.appendChild(titleEl);
    header.appendChild(closeBtn);
    debugModal.appendChild(header);
    
    // Contenuto
    const content = document.createElement('pre');
    content.textContent = JSON.stringify(data, null, 2);
    content.style.whiteSpace = 'pre-wrap';
    debugModal.appendChild(content);
    
    // Rimuovi modali di debug esistenti
    const existingModal = document.getElementById('debug-modal');
    if (existingModal) {
      document.body.removeChild(existingModal);
    }
    
    document.body.appendChild(debugModal);
  };
  
  // Forza il caricamento diretto dei nodi di un template specifico, saltando PathService
  const forceLoadTemplateNodes = async (templateId: number | string, showNotification = true) => {
    try {
      // Ottieni i nodi direttamente dall'API
      const getApiUrl = () => {
        const configuredUrl = process.env.REACT_APP_API_URL;
        if (configuredUrl) return configuredUrl;
        
        const currentHost = window.location.hostname;
        return `http://${currentHost}:8000`;
      };
      
      const apiUrl = `${getApiUrl()}/api/path-templates/${templateId}/nodes`;
      
      // Token di autenticazione
      const token = localStorage.getItem('accessToken');
      const requestHeaders: Record<string, string> = {};
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
      
      // Eseguiamo la fetch diretta
      const response = await fetch(apiUrl, { headers: requestHeaders });
      if (!response.ok) {
        throw new Error(`Errore API: ${response.status}`);
      }
      
      const jsonResponse = await response.json();
      
      // Aggiorna il template nella lista dei template
      setPathTemplates(prevTemplates => {
        return prevTemplates.map(template => {
          if (template.id?.toString() === templateId.toString()) {
            // Usa SOLO la risposta JSON diretta, ignorando completamente PathService
            return { ...template, nodes: jsonResponse };
          }
          return template;
        });
      });
      
      // Mostra notifica solo se richiesto
      if (showNotification) {
        NotificationsService.success(
          'Nodi caricati', 
          `Caricati ${jsonResponse?.length || 0} nodi per il template`
        );
      }
      
      return jsonResponse;
    } catch (error) {
      console.error(`Errore nel caricamento dei nodi:`, error);
      if (showNotification) {
        NotificationsService.error('Errore', 'Impossibile caricare i nodi del template');
      }
      return [];
    }
  };

  // Funzione per caricare i template di percorsi
  const loadPathTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      // Ottieni tutti i template
      const templates = await PathService.getAllPathTemplates();
      
      // Salviamo i templates
      setPathTemplates(templates);
      
      // Carichiamo anche i nodi direttamente per ogni template
      templates.forEach(template => {
        if (template.id !== undefined && template.id !== null) {
          // Utilizziamo setTimeout per non sovraccaricare l'API
          setTimeout(() => {
            forceLoadTemplateNodes(template.id!, false); // Non mostrare notifiche per il caricamento iniziale
          }, 300 * Math.random()); // Leggero delay casuale per ridurre il carico
        }
      });
      
      // Per ogni template, carica i nodi (inclusi i quiz)
      const templatesWithNodes = await Promise.all(
        templates.map(async (template) => {
          if (template.id) {
            try {
              const nodes = await PathService.getTemplateNodes(template.id);
              
              // Assicuriamoci che i nodi vengano correttamente formattati
              if (nodes.length > 0) {
                // Correggi i valori degli ID per evitare problemi di rendering e assicurati che node_type sia in minuscolo
                const formattedNodes = nodes.map(n => {
                  // Cerca di rilevare nodi quiz anche tramite il contenuto
                  let nodeType = (n.node_type || '').toLowerCase();
                  
                  // Se il contenuto contiene informazioni su un quiz ma il tipo non è 'quiz', forziamolo a 'quiz'
                  if (nodeType !== 'quiz' && n.content) {
                    const hasQuizId = n.content.quiz_id || n.content.quiz_template_id;
                    const contentString = JSON.stringify(n.content).toLowerCase();
                    const mentionsQuiz = contentString.includes('quiz');
                    
                    if (hasQuizId || mentionsQuiz) {
                      console.log(`%c[DEBUG] Rilevato nodo quiz tramite contenuto anziché tipo:`, 'background: #ff0; color: #000;', n);
                      nodeType = 'quiz';
                    }
                  }
                  
                  return {
                    ...n,
                    id: n.id?.toString() || n.uuid || `temp-${Math.random().toString(36).substring(2, 9)}`, // Assicura che l'id sia una stringa
                    node_type: nodeType, // Normalizza il tipo di nodo in minuscolo
                    title: n.title || 'Nodo senza titolo',
                    description: n.description || '',
                    content: n.content || {},
                    // Mantieni gli altri campi invariati
                  };
                });
                
                // Log visivo migliorato
                console.log(`%c[DEBUG] Dettagli nodi per ${template.title}:`, 'color: #0066cc;');
                formattedNodes.forEach((n, index) => {
                  console.log(`Nodo #${index+1}: ${n.title} (${n.node_type})`, n);
                });
                
                // Verifica quanti quiz ci sono con criteri estesi di rilevamento
                const quizNodes = formattedNodes.filter(node => 
                  node.node_type === 'quiz' || // Tipo esplicito
                  (node.content && (node.content.quiz_id || node.content.quiz_template_id)) // Rilevamento dal contenuto
                );
                
                // Debug migliorato per i quiz
                if (quizNodes.length > 0) {
                  console.log(`%c[DEBUG] ${quizNodes.length} QUIZ TROVATI per ${template.title}:`, 'background: #0c0; color: #000; font-size: 14px;');
                  quizNodes.forEach((quiz, idx) => {
                    console.log(`Quiz #${idx+1}: ${quiz.title}`, {
                      id: quiz.id,
                      type: quiz.node_type,
                      content: quiz.content
                    });
                  });
                } else {
                  console.log(`%c[DEBUG] NESSUN QUIZ trovato per ${template.title}`, 'color: #f00;');
                }
                
                // Log del numero di quiz trovati ma senza alterare la struttura dati
                if (quizNodes.length > 0) {
                  console.log(`%c[DEBUG] ${quizNodes.length} quiz registrati per ${template.title}`, 'background: #0c0; color: #000;');
                }
                
                // Manteniamo la struttura originale di PathTemplate senza estensioni
                return { 
                  ...template, 
                  nodes: formattedNodes.map(node => ({
                    ...node,
                    // Forzare il tipo corretto per node_type per non alterare il tipo PathNodeTemplate
                    node_type: (node.node_type === 'quiz' ? 'quiz' : 
                               node.node_type === 'content' ? 'content' : 
                               node.node_type === 'task' ? 'task' : 
                               node.node_type === 'milestone' ? 'milestone' : 
                               node.node_type === 'reward' ? 'reward' : 'content') as 'quiz' | 'content' | 'task' | 'milestone' | 'reward'
                  }))
                };
              }
              
              // CORREZIONE CRITICA: Assicuriamoci che i nodi siano correttamente assegnati al template
              const templateWithNodes = {
                ...template,
                nodes: nodes || [] // Usa un array vuoto se nodes è null/undefined
              };
              console.log(`%c[DEBUG] Template con nodi assegnati: ${templateWithNodes.title}`, 'background: #0066cc; color: #fff;');
              console.log(`Nodi totali: ${templateWithNodes.nodes.length}, Node count dal DB: ${template.node_count || 0}`);
              return templateWithNodes;
            } catch (nodeErr) {
              console.error(`[DEBUG] Errore nel caricamento dei nodi per il template ${template.id}:`, nodeErr);
              return template; // Restituisci il template anche senza nodi in caso di errore
            }
          }
          return template;
        })
      );
      
      console.log('%c[DEBUG] RIEPILOGO TEMPLATES CON NODI:', 'background: #333; color: #fff; font-size: 14px;');
      templatesWithNodes.forEach((t, idx) => {
        const totalNodes = t.nodes?.length || 0;
        
        // Conteggio sicuro dei quiz usando reduce per evitare problemi di tipo
        let quizNodes = 0;
        const quizNodesList: PathNodeTemplate[] = [];
        
        if (t.nodes && t.nodes.length > 0) {
          // Identifichiamo i quiz con criteri multipli
          t.nodes.forEach(node => {
            let isQuiz = false;
            
            // Criterio 1: Tipo nodo è 'quiz' (case insensitive)
            if (typeof node.node_type === 'string' && node.node_type.toLowerCase() === 'quiz') {
              isQuiz = true;
            } 
            // Criterio 2: Contenuto ha riferimenti a quiz
            else if (node.content) {
              if (node.content.quiz_id || node.content.quiz_template_id) {
                isQuiz = true;
              } else {
                // Criterio 3: Il contenuto menziona quiz come stringa
                const contentString = JSON.stringify(node.content).toLowerCase();
                if (contentString.includes('quiz')) {
                  isQuiz = true;
                }
              }
            }
            
            if (isQuiz) {
              quizNodes++;
              quizNodesList.push(node);
            }
          });
        }
        
        const color = quizNodes > 0 ? '#0c0' : '#f66';
        console.log(`%cTemplate #${idx+1}: ${t.title}`, `color: ${color}; font-weight: bold;`, {
          id: t.id,
          nodi: totalNodes,
          quiz: quizNodes
        });
      });
      
      setPathTemplates(templatesWithNodes);
    } catch (err) {
      console.error('%c[DEBUG] Errore nel caricamento dei template di percorsi:', 'background: #f00; color: #fff;', err);
      setError('Si è verificato un errore nel caricamento dei template di percorsi. Riprova più tardi.');
      NotificationsService.error(
        'Impossibile caricare i template di percorsi. Riprova più tardi.',
        'Errore'
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Funzione per caricare gli studenti associati al genitore
  const loadStudents = async () => {
    setLoadingStudents(true);
    try {
      const studentsList = await StudentService.getStudentsByParent();
      setStudents(studentsList);
    } catch (err) {
      console.error('Errore nel caricamento degli studenti:', err);
      NotificationsService.error(
        'Impossibile caricare la lista degli studenti. Riprova più tardi.',
        'Errore'
      );
    } finally {
      setLoadingStudents(false);
    }
  };

  // Gestisce il cambio di tab
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Apre il dialog per creare un nuovo template
  const handleOpenDialog = () => {
    setIsEditMode(false);
    setEditingTemplateId('');
    resetForm();
    setOpenDialog(true);
  };

  // Apre il dialog per modificare un template esistente
  const handleEditTemplate = (template: PathTemplate) => {
    setIsEditMode(true);
    setEditingTemplateId(template.id || '');
    
    // Estrai i dati dalle proprietà aggiornate del template
    const subject = template.additional_data?.subject || '';
    const skills = template.additional_data?.skills || [];
    
    // Converti il livello di difficoltà numerico in stringa
    let difficulty = 'facile';
    if (template.difficulty_level >= 4) {
      difficulty = 'difficile';
    } else if (template.difficulty_level >= 2) {
      difficulty = 'medio';
    }
    
    setFormData({
      title: template.title,
      description: template.description,
      subject: subject,
      difficulty: difficulty,
      estimatedDays: template.estimated_days,
      skills: [...skills],
      currentSkill: ''
    });
    setOpenDialog(true);
  };

  // Chiude il dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Gestisce i cambiamenti nei campi del form per input di testo
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Gestisce i cambiamenti nei campi select
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    if (name) {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Gestisce l'aggiunta di una skill
  const handleAddSkill = () => {
    if (formData.currentSkill.trim() && !formData.skills.includes(formData.currentSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, formData.currentSkill.trim()],
        currentSkill: ''
      });
    }
  };

  // Gestisce la rimozione di una skill
  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  // Resetta il form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      subject: '',
      difficulty: '',
      estimatedDays: 0,
      skills: [],
      currentSkill: ''
    });
    setFormErrors({
      title: '',
      description: '',
      subject: '',
      difficulty: '',
      estimatedDays: '',
      skills: ''
    });
  };

  // Valida il form
  const validateForm = () => {
    let isValid = true;
    const errors = {
      title: '',
      description: '',
      subject: '',
      difficulty: '',
      estimatedDays: '',
      skills: ''
    };

    if (!formData.title.trim()) {
      errors.title = 'Il titolo è obbligatorio';
      isValid = false;
    }

    if (!formData.description.trim()) {
      errors.description = 'La descrizione è obbligatoria';
      isValid = false;
    }

    if (!formData.subject) {
      errors.subject = 'La materia è obbligatoria';
      isValid = false;
    }

    if (!formData.difficulty) {
      errors.difficulty = 'La difficoltà è obbligatoria';
      isValid = false;
    }

    if (formData.estimatedDays <= 0) {
      errors.estimatedDays = 'Inserisci un numero di giorni valido';
      isValid = false;
    }

    if (formData.skills.length === 0) {
      errors.skills = 'Aggiungi almeno una competenza';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Gestisce il salvataggio del form
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Ottieni l'utente corrente dal localStorage
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      // Mapping dalle proprietà del nostro form al formato API atteso
      const templateData = {
        title: formData.title,
        description: formData.description,
        instructions: formData.description, // Utilizziamo la descrizione anche come istruzioni
        difficulty_level: formData.difficulty === 'facile' ? 1 : formData.difficulty === 'medio' ? 3 : 5,
        estimated_days: formData.estimatedDays,
        is_active: true,
        is_public: false,
        additional_data: {
          subject: formData.subject,
          skills: formData.skills
        },
        nodes: [], // Per ora, nessun nodo
        created_by: user?.id || user?.userId || '', // Questo verrà sovrascritto dal backend
        created_by_role: user?.role || 'parent' // Questo verrà sovrascritto dal backend
      };

      if (isEditMode && editingTemplateId) {
        await PathService.updatePathTemplate(editingTemplateId, templateData);
        NotificationsService.success('Il template del percorso è stato aggiornato con successo', 'Aggiornamento Completato');
      } else {
        await PathService.createPathTemplate(templateData);
        NotificationsService.success('Il template del percorso è stato creato con successo', 'Creazione Completata');
      }
      
      handleCloseDialog();
      loadPathTemplates();
    } catch (err) {
      console.error('Errore durante il salvataggio del template:', err);
      NotificationsService.error(
        'Si è verificato un errore durante il salvataggio del template. Riprova più tardi.',
        'Errore'
      );
    }
  };

  // Gestisce l'eliminazione di un template
  const handleDeleteTemplate = async (templateId: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo template di percorso? Questa azione non può essere annullata.')) {
      try {
        await PathService.deletePathTemplate(templateId);
        NotificationsService.success(
          'Il template del percorso è stato eliminato con successo',
          'Eliminazione Completata'
        );
        loadPathTemplates();
      } catch (err) {
        console.error('Errore durante l\'eliminazione del template:', err);
        NotificationsService.error(
          'Si è verificato un errore durante l\'eliminazione del template. Riprova più tardi.',
          'Errore'
        );
      }
    }
  };
  
  // Gestisce la modifica della visibilità di un template (pubblico/privato)
  const handleToggleVisibility = async (template: PathTemplate) => {
    try {
      const isCurrentlyPublic = template.is_public || false;
      await PathService.toggleTemplateVisibility(template.id || '', !isCurrentlyPublic);
      NotificationsService.success(
        `Il percorso è stato reso ${!isCurrentlyPublic ? 'pubblico' : 'privato'}.`,
        'Visibilità aggiornata'
      );
      loadPathTemplates();
    } catch (err) {
      console.error('Errore durante la modifica della visibilità:', err);
      NotificationsService.error(
        'Si è verificato un errore durante la modifica della visibilità del percorso. Riprova più tardi.',
        'Errore'
      );
    }
  };
  
  // Apre il dialog per assegnare un percorso
  const handleOpenAssignDialog = (template: PathTemplate) => {
    setSelectedTemplateForAssign(template);
    setSelectedStudents([]);
    setOpenAssignDialog(true);
  };
  
  // Chiude il dialog di assegnazione
  const handleCloseAssignDialog = () => {
    setOpenAssignDialog(false);
    setSelectedTemplateForAssign(null);
    setSelectedStudents([]);
  };
  
  // Gestisce l'apertura del dialog per assegnare quiz a un percorso
  const handleOpenQuizDialog = (template: PathTemplate) => {
    setSelectedTemplateForQuiz(template);
    
    // Controlla i token di autenticazione prima di aprire il dialog
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    console.log('[DEBUG AUTH] Token disponibili:', { 
      accessToken: accessToken ? 'presente' : 'mancante',
      refreshToken: refreshToken ? 'presente' : 'mancante'
    });
    
    // Carica i quiz disponibili quando si apre il dialog
    loadAvailableQuizzes();
    setOpenQuizDialog(true);
  };
  
  // Chiude il dialog per l'assegnazione di quiz
  const handleCloseQuizDialog = () => {
    setOpenQuizDialog(false);
    setSelectedTemplateForQuiz(null);
  };
  
  // Carica i quiz disponibili
  const loadAvailableQuizzes = async () => {
    console.log('[DEBUG] Inizio caricamento quiz disponibili');
    setLoadingQuizzes(true);
    try {
      // Aggiunta log prima della chiamata API
      console.log('[DEBUG] Chiamata a QuizService.getAllQuizTemplates()');
      
      const quizzes = await QuizService.getAllQuizTemplates();
      
      // Verifica se ci sono quiz ritornati
      console.log('[DEBUG] Quiz ricevuti:', quizzes?.length || 0);
      
      if (!quizzes || quizzes.length === 0) {
        console.warn('[DEBUG] Nessun quiz trovato dal servizio');
        NotificationsService.info(
          'Non ci sono quiz disponibili da aggiungere ai percorsi. Crea prima alcuni quiz nel sistema.',
          'Nessun quiz disponibile'
        );
      }
      
      // Dettagli dei quiz per debug
      if (quizzes && quizzes.length > 0) {
        console.log('[DEBUG] Dettagli quiz ricevuti:', quizzes.map(q => ({
          id: q.id,
          title: q.title,
          subject: q.subject,
          questions: q.totalQuestions
        })));
      }
      
      setAvailableQuizzes(quizzes);
    } catch (err) {
      console.error('[DEBUG] Errore nel caricamento dei quiz:', err);
      NotificationsService.error(
        'Impossibile caricare la lista dei quiz disponibili. Riprova più tardi.',
        'Errore di caricamento'
      );
    } finally {
      console.log('[DEBUG] Fine caricamento quiz disponibili');
      setLoadingQuizzes(false);
    }
  };
  
  // Aggiunge un quiz a un template di percorso
  const handleAddQuizToPath = async (templateId: string, quizId: string, nodeData: Partial<PathNodeTemplate>) => {
    try {
      // Chiama il metodo del PathService per aggiungere il quiz al percorso
      const response = await PathService.addQuizToPathTemplate(templateId, quizId, nodeData);
      console.log('Risposta addQuizToPathTemplate:', response);
      
      // Mostriamo una notifica di successo
      NotificationsService.success(
        `Quiz aggiunto al percorso. I cambiamenti saranno visibili dopo il ricaricamento.`,
        'Operazione completata'
      );
      
      // Attendiamo un breve momento e poi ricarichiamo i dati
      setTimeout(() => {
        // Ricarica completa dei template
        loadPathTemplates();
        
        // Mostriamo una seconda notifica dopo il ricaricamento
        setTimeout(() => {
          NotificationsService.info(
            `I dati sono stati ricaricati. Verifica che il quiz sia visibile nel percorso.`,
            'Aggiornamento completato'
          );
        }, 1000);
      }, 1500);
    } catch (err) {
      console.error('Errore nell\'aggiunta del quiz al percorso:', err);
      NotificationsService.error(
        'Impossibile aggiungere il quiz al percorso. Riprova più tardi.',
        'Errore'
      );
      throw err; // Rilancia l'errore per gestirlo nel componente
    }
  };
  
  // Gestisce i cambiamenti nella selezione degli studenti
  const handleStudentSelectionChange = (event: SelectChangeEvent<string[]>) => {
    const { value } = event.target;
    setSelectedStudents(typeof value === 'string' ? value.split(',') : value);
  };
  
  // Gestisce l'assegnazione di un percorso a più studenti
  const handleAssignPath = async () => {
    if (!selectedTemplateForAssign) {
      return;
    }
    
    if (selectedStudents.length === 0) {
      NotificationsService.warning(
        'Seleziona almeno uno studente a cui assegnare il percorso',
        'Dati mancanti'
      );
      return;
    }
    
    try {
      const startDate = new Date();
      const targetEndDate = new Date();
      targetEndDate.setDate(targetEndDate.getDate() + (selectedTemplateForAssign.estimated_days || 7));
      
      // Creiamo un array di promesse per assegnare il percorso a più studenti
      // Verifica che selectedTemplateForAssign.id sia definito e non vuoto
      if (!selectedTemplateForAssign.id) {
        NotificationsService.error(
          'ID del template del percorso non valido.',
          'Errore'
        );
        return;
      }
      
      // Assicuriamoci che l'ID sia davvero un numero (o convertibile a numero)
      const templateId = selectedTemplateForAssign.id.toString();
      const templateIdNum = parseInt(templateId, 10);
      
      if (isNaN(templateIdNum) || templateIdNum <= 0) {
        NotificationsService.error(
          `ID del template non valido: ${templateId}`,
          'Errore'
        );
        return;
      }
      
      console.log("Template ID da assegnare:", templateId, "come numero:", templateIdNum);
      
      const assignPromises = selectedStudents.map(studentId => 
        PathService.assignPath(
          selectedTemplateForAssign.id!, 
          studentId, 
          startDate, 
          targetEndDate
        )
      );
      
      // Attendiamo che tutte le promesse siano risolte
      await Promise.all(assignPromises);
      
      NotificationsService.success(
        `Percorso "${selectedTemplateForAssign.title}" assegnato con successo a ${selectedStudents.length} student${selectedStudents.length === 1 ? 'e' : 'i'}`,
        'Assegnazione completata'
      );
      
      handleCloseAssignDialog();
    } catch (err) {
      console.error('Errore durante l\'assegnazione del percorso:', err);
      NotificationsService.error(
        'Si è verificato un errore durante l\'assegnazione del percorso. Riprova più tardi.',
        'Errore'
      );
    }
  };

  // Gestisce la rimozione di un quiz da un template di percorso
  const handleRemoveQuizFromPath = async (templateId: string, nodeId: string) => {
    try {
      console.log(`[DEBUG] Rimozione quiz: templateId=${templateId}, nodeId=${nodeId}`);
      
      // Conferma prima di rimuovere
      if (window.confirm('Sei sicuro di voler rimuovere questo quiz dal percorso? Questa azione non può essere annullata.')) {
        // Assicuriamoci che nodeId sia una stringa
        const normalizedNodeId = String(nodeId);
        
        console.log(`[DEBUG] Chiamata a removeQuizFromPathTemplate con nodeId: ${normalizedNodeId}`);
        await PathService.removeQuizFromPathTemplate(normalizedNodeId);
        
        // Mostriamo una notifica di successo
        NotificationsService.success(
          `Quiz rimosso dal percorso.`,
          'Operazione completata'
        );
        
        // Ricarichiamo i dati dei template
        console.log(`[DEBUG] Ricaricamento template dopo rimozione quiz`);
        // Ricarica immediatamente
        loadPathTemplates();
      }
    } catch (err) {
      console.error('[DEBUG] Errore nella rimozione del quiz dal percorso:', err);
      NotificationsService.error(
        'Impossibile rimuovere il quiz dal percorso. Riprova più tardi.',
        'Errore'
      );
    }
  };

  // Renderizza una card per un template
  const renderTemplateCard = (template: PathTemplate) => {
    // Assicuriamoci che template.nodes sia sempre definito
    if (!template.nodes) {
      template.nodes = [];
    }
    
    // Applica un titolo con un formato più chiaro
    const templateTitle = template.title || 'Template senza titolo';
    
    // Filtriamo i nodi di tipo quiz dal template con criteri ancora più estesi
    const quizNodes = template.nodes.filter(node => {
      // Verifica esplicita per il tipo 'QUIZ' in maiuscolo dal DB
      if (typeof node.node_type === 'string') {
        const nodeTypeUppercase = node.node_type.toUpperCase();
        if (nodeTypeUppercase === 'QUIZ') {
          console.log(`%c[DEBUG] Trovato nodo QUIZ con node_type in MAIUSCOLO`, 'background: #f0f; color: #fff;', node);
          return true;
        }
      }
      
      // Verifica case-insensitive per 'quiz' (già normalizzato)
      if (node.node_type && node.node_type.toLowerCase() === 'quiz') {
        console.log(`%c[DEBUG] Trovato nodo quiz con node_type normalizzato`, 'background: #0c0; color: #000;', node);
        return true;
      }
      
      // Verifica che il contenuto abbia riferimenti a quiz
      if (node.content) {
        if (node.content.quiz_id || node.content.quiz_template_id) {
          console.log(`%c[DEBUG] Trovato nodo quiz tramite content.quiz_template_id`, 'background: #00f; color: #fff;', node);
          return true;
        }
        
        // Cerca altre possibili proprietà relative ai quiz
        const contentStr = JSON.stringify(node.content).toLowerCase();
        if (contentStr.includes('quiz')) {
          console.log(`%c[DEBUG] Trovato nodo quiz tramite content (stringa)`, 'background: #ff0; color: #000;', node);
          return true;
        }
      }
      
      return false;
    });
    
    // Debug completo con stile
    console.log(`%c[DEBUG] Rendering template: ${templateTitle}`, 'color: #0066cc; font-weight: bold;');
    console.log(`[DEBUG] Template ha nodi?`, template.nodes.length > 0 ? 'Sì' : 'No');
    console.log(`[DEBUG] Numero totale nodi:`, template.nodes.length);
    
    // Visualizziamo tutti i tipi di nodi presenti
    const nodeTypes = template.nodes.map(n => n.node_type).filter((type, index, self) => 
      self.indexOf(type) === index
    );
    console.log(`[DEBUG] Tipi nodi presenti:`, nodeTypes);
    
    // Debug quiz nodes con stile migliorato
    const quizCount = quizNodes.length;
    const logStyle = quizCount > 0 ? 'background: #0c0; color: #000;' : 'color: #f00;';
    console.log(`%c[DEBUG] Quiz nodes trovati: ${quizCount}`, logStyle);
    
    if (quizCount > 0) {
      console.log('%c[DEBUG] Dettagli quiz nodes:', 'background: #0c0; color: #000;');
      quizNodes.forEach((q, idx) => {
        console.log(`Quiz #${idx+1}: ${q.title || 'Senza titolo'}`, {
          id: q.id,
          type: q.node_type,
          title: q.title,
          content: q.content
        });
      });
    }
    
    return (
      <Card 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: 6
          },
          position: 'relative'
        }}
      >
        {/* Rimossi pulsanti di debug */}
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h6" component="div" gutterBottom>
              {template.title}
            </Typography>
            <Chip 
              label={
                template.difficulty_level >= 4 ? 'Difficile' :
                template.difficulty_level >= 2 ? 'Medio' : 'Facile'
              } 
              color={
                template.difficulty_level <= 1 ? 'success' : 
                template.difficulty_level <= 3 ? 'warning' : 'error'
              } 
              size="small" 
            />
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {template.description}
          </Typography>
          
          <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
            <SchoolIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="body2">
              Materia: {SUBJECTS.find(s => s.value === template.additional_data?.subject)?.label || template.additional_data?.subject || 'Non specificata'}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
            <CalendarIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="body2">
              Durata stimata: {template.estimated_days} giorni
            </Typography>
          </Box>
          
          {/* Sezione Quiz - Mostra stile di debug temporaneo se non ci sono quiz */}
          {quizNodes.length > 0 ? (
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <QuizIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
                Quiz assegnati ({quizNodes.length}):
              </Typography>
              <Box sx={{ pl: 1 }}>
                {quizNodes.map((node) => {
                  // Assicuriamoci che node.id sia sempre definito
                  const nodeId = node.id?.toString() || node.uuid || 'unknown';
                  const nodeTitle = node.title || 'Quiz senza titolo';
                  const quizContent = node.content && typeof node.content === 'object' ? 
                    Object.entries(node.content).map(([k,v]) => `${k}: ${v}`).join(', ') : 'Nessun contenuto';
                  
                  return (
                    <Box 
                      key={nodeId} 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 0.5,
                        p: 1,
                        bgcolor: 'rgba(66, 165, 245, 0.08)',
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: 'rgba(66, 165, 245, 0.15)'
                        } 
                      }}
                    >
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {nodeTitle}
                        <Typography variant="caption" display="block" color="text.secondary">
                          ID: {nodeId} | Contenuto: {quizContent}
                        </Typography>
                      </Typography>
                      <Tooltip title="Rimuovi quiz">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleRemoveQuizFromPath(template.id || '', nodeId)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          ) : (
            /* Indicatore visivo temporaneo per debug */
            <Box sx={{ mt: 2, p: 1, border: '1px dashed #ccc', borderRadius: 1, bgcolor: 'rgba(255, 0, 0, 0.05)' }}>
              <Typography variant="caption" color="error" sx={{ display: 'flex', alignItems: 'center' }}>
                <InfoIcon fontSize="small" sx={{ mr: 0.5 }} />
                Nessun quiz assegnato a questo percorso
              </Typography>
            </Box>
          )}
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <PsychologyIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
              Competenze:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {(template.additional_data?.skills || []).map((skill: string, index: number) => (
                <Chip 
                  key={index} 
                  label={skill} 
                  size="small" 
                  variant="outlined" 
                  sx={{ mb: 0.5 }} 
                />
              ))}
            </Box>
          </Box>
        </CardContent>
        <CardActions sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'space-between' }}>
          <Box>
            <Button 
              size="small" 
              startIcon={<EditIcon />} 
              onClick={() => handleEditTemplate(template)}
            >
              Modifica
            </Button>
            <Button 
              size="small" 
              color="error" 
              startIcon={<DeleteIcon />} 
              onClick={() => handleDeleteTemplate(template.id || '')}
            >
              Elimina
            </Button>
          </Box>
          
          <Box>
            <Tooltip title={template.is_public ? "Rendi privato" : "Rendi pubblico"}>
              <Button
                size="small"
                color={template.is_public ? "success" : "info"}
                startIcon={<PublicIcon />}
                onClick={() => handleToggleVisibility(template)}
              >
                {template.is_public ? "Pubblico" : "Privato"}
              </Button>
            </Tooltip>
            
            <Tooltip title="Assegna a studenti">
              <IconButton
                color="secondary"
                size="small"
                onClick={() => handleOpenAssignDialog(template)}
              >
                <AssignIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Aggiungi quiz al percorso">
              <IconButton
                color="primary"
                size="small"
                onClick={() => handleOpenQuizDialog(template)}
              >
                <QuizIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </CardActions>
      </Card>
    );
  };

  return (
    <MainLayout title="Gestione Percorsi">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">
            Gestione Percorsi
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />} 
            onClick={handleOpenDialog}
          >
            Nuovo Percorso
          </Button>
        </Box>
        <Typography variant="subtitle1" color="text.secondary">
          Crea e gestisci template di percorsi didattici da assegnare ai tuoi studenti
        </Typography>
      </Box>
      
      <Paper sx={{ borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="gestione percorsi tabs">
            <Tab label="I Miei Percorsi" id="path-tab-0" aria-controls="path-tabpanel-0" />
            <Tab label="Percorsi Comuni" id="path-tab-1" aria-controls="path-tabpanel-1" />
          </Tabs>
        </Box>
        
        <PathTabPanel value={tabValue} index={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
          ) : pathTemplates.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Non hai ancora creato nessun template di percorso.
              </Alert>
              <Typography variant="body1" gutterBottom>
                Inizia creando un nuovo template di percorso cliccando sul pulsante "Nuovo Percorso".
              </Typography>
            </Box>
          ) : (
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {pathTemplates.map((template) => (
                  <Grid item xs={12} sm={6} md={4} key={template.id}>
                    {renderTemplateCard(template)}
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </PathTabPanel>
        
        <PathTabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Qui verranno mostrati i template di percorsi creati dalla piattaforma e dagli altri genitori, che potrai riutilizzare per i tuoi studenti.
            </Alert>
            {/* Implementazione futura per i percorsi comuni */}
            <Typography variant="body1">
              La visualizzazione dei percorsi comuni sarà disponibile a breve.
            </Typography>
          </Box>
        </PathTabPanel>
      </Paper>
      
      {/* Dialog per creare/modificare template */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {isEditMode ? 'Modifica Template di Percorso' : 'Crea Nuovo Template di Percorso'}
        </DialogTitle>
        
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Titolo"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                error={!!formErrors.title}
                helperText={formErrors.title}
                margin="normal"
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrizione"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                error={!!formErrors.description}
                helperText={formErrors.description}
                margin="normal"
                multiline
                rows={3}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal" error={!!formErrors.subject} required>
                <InputLabel id="subject-label">Materia</InputLabel>
                <Select
                  labelId="subject-label"
                  name="subject"
                  value={formData.subject}
                  onChange={handleSelectChange}
                  label="Materia"
                >
                  {SUBJECTS.map((subject) => (
                    <MenuItem key={subject.value} value={subject.value}>
                      {subject.label}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.subject && <FormHelperText>{formErrors.subject}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal" error={!!formErrors.difficulty} required>
                <InputLabel id="difficulty-label">Difficoltà</InputLabel>
                <Select
                  labelId="difficulty-label"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleSelectChange}
                  label="Difficoltà"
                >
                  {DIFFICULTIES.map((difficulty) => (
                    <MenuItem key={difficulty.value} value={difficulty.value}>
                      {difficulty.label}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.difficulty && <FormHelperText>{formErrors.difficulty}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Durata stimata (giorni)"
                name="estimatedDays"
                type="number"
                value={formData.estimatedDays}
                onChange={handleInputChange}
                error={!!formErrors.estimatedDays}
                helperText={formErrors.estimatedDays}
                margin="normal"
                inputProps={{ min: 1 }}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Competenze
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TextField
                  label="Aggiungi una competenza"
                  name="currentSkill"
                  value={formData.currentSkill}
                  onChange={handleInputChange}
                  sx={{ flexGrow: 1, mr: 1 }}
                />
                <Button variant="outlined" onClick={handleAddSkill} disabled={!formData.currentSkill.trim()}>
                  Aggiungi
                </Button>
              </Box>
              
              {formErrors.skills && (
                <FormHelperText error>{formErrors.skills}</FormHelperText>
              )}
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {formData.skills.map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    onDelete={() => handleRemoveSkill(skill)}
                    sx={{ mb: 1, mr: 1 }}
                  />
                ))}
              </Box>
              
              {formData.skills.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Nessuna competenza aggiunta. Aggiungi almeno una competenza per salvare il percorso.
                </Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annulla</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            color="primary"
          >
            {isEditMode ? 'Aggiorna' : 'Crea'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Dialog per assegnare un percorso a più studenti contemporaneamente */}
      <Dialog open={openAssignDialog} onClose={handleCloseAssignDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Assegna percorso a studenti
        </DialogTitle>
        <DialogContent>
          {selectedTemplateForAssign && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Percorso: {selectedTemplateForAssign.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedTemplateForAssign.description}
              </Typography>
              
              <Box sx={{ mt: 3, mb: 1 }}>
                <FormControl fullWidth required>
                  <InputLabel id="students-select-label">Seleziona studenti</InputLabel>
                  <Select
                    labelId="students-select-label"
                    multiple
                    value={selectedStudents}
                    onChange={handleStudentSelectionChange}
                    label="Seleziona studenti"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => {
                          const student = students.find(s => s.id === value);
                          return (
                            <Chip key={value} label={student ? student.name : value} size="small" />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {loadingStudents ? (
                      <MenuItem disabled>
                        <CircularProgress size={20} /> Caricamento...
                      </MenuItem>
                    ) : students.length === 0 ? (
                      <MenuItem disabled>
                        Nessuno studente disponibile
                      </MenuItem>
                    ) : (
                      students.map((student) => (
                        <MenuItem key={student.id} value={student.id}>
                          {student.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  <FormHelperText>
                    Ogni studente riceverà una copia separata del percorso e di tutti i quiz in esso contenuti
                  </FormHelperText>
                </FormControl>
              </Box>
              
              <Box sx={{ mt: 2, mb: 1 }}>
                {selectedStudents.length > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    {selectedStudents.length} student{selectedStudents.length === 1 ? 'e' : 'i'} selezionat{selectedStudents.length === 1 ? 'o' : 'i'}
                  </Typography>
                )}
              </Box>
              
              <Typography variant="body2" sx={{ mt: 2 }}>
                <strong>Nota:</strong> I percorsi inizieranno oggi e avranno una durata stimata di {selectedTemplateForAssign.estimated_days || 7} giorni.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignDialog}>Annulla</Button>
          <Button 
            onClick={handleAssignPath} 
            variant="contained" 
            color="primary"
            disabled={selectedStudents.length === 0}
          >
            Assegna
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog per aggiungere quiz al percorso */}
      <AddQuizToPathDialog
        open={openQuizDialog}
        onClose={handleCloseQuizDialog}
        selectedTemplate={selectedTemplateForQuiz}
        availableQuizzes={availableQuizzes}
        loadingQuizzes={loadingQuizzes}
        onAddQuiz={handleAddQuizToPath}
      />
    </MainLayout>
  );
};

export default ManagePaths;
