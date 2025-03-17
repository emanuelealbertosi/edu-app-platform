import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  IconButton,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  Chip,
  Alert,
  CircularProgress,
  FormHelperText,
  SelectChangeEvent,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import MainLayout from '../../components/layout/MainLayout';
import QuizService, { QuizTemplate, Question, Option, normalizeQuestion, normalizeQuestions } from '../../services/QuizService';
import { NotificationsService } from '../../services/NotificationsService';
// Rimosso import AnimatedPage per risolvere il problema di lazy loading
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/ApiService';

// Tipi di domande supportati
const questionTypes = [
  { value: 'single_choice', label: 'Scelta singola' },
  { value: 'multiple_choice', label: 'Scelta multipla' },
  { value: 'true_false', label: 'Vero/Falso' },
  { value: 'numeric', label: 'Risposta numerica' }
];

// Punteggi disponibili
const scores = [1, 2, 3, 5, 10];

// Inizializzazione di una domanda vuota
const emptyQuestion: Question = {
  id: '',
  text: '',
  type: 'single_choice',
  options: [
    { id: '1', text: '', isCorrect: false },
    { id: '2', text: '', isCorrect: false }
  ],
  score: 1,
  points: 0,
  explanation: ''
};

// Inizializzazione di un template vuoto
const emptyTemplate: QuizTemplate = {
  id: '',
  title: '',
  description: '',
  subject: '',
  difficultyLevel: 'medium',
  timeLimit: 10,
  passingScore: 60,
  isPublic: true,
  questions: [{ ...emptyQuestion }],
  createdAt: '',
  updatedAt: '',
  createdBy: '',
  totalQuestions: 0,
  questionsCount: 0,
  estimatedTime: 15
};

const AdminQuizForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditMode = !!id;

  // Stati
  const [quizTemplate, setQuizTemplate] = useState<QuizTemplate>({ ...emptyTemplate });
  const [loading, setLoading] = useState<boolean>(isEditMode);
  const [saving, setSaving] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Recupero dei dati del quiz se in modalità modifica
  useEffect(() => {
    const fetchQuizTemplate = async () => {
      if (isEditMode) {
        try {
          const data: QuizTemplate = await QuizService.getQuizTemplateById(id!);
          
          // Debug: mostriamo dettagli sui dati ricevuti
          console.log('DATI QUIZ RICEVUTI PER MODIFICA:', data);
          console.log('MATERIA RICEVUTA:', data.subject, typeof data.subject);
          
          // SOLUZIONE MATERIA: Assicuriamoci che materia abbia sempre un valore valido
          let normalizedSubject = 'Generale';  // Valore predefinito sicuro
          
          if (data.subject !== undefined && data.subject !== null) {
            if (typeof data.subject === 'object') {
              // Utilizziamo un'asserzione di tipo per evitare errori TypeScript
              const subjectObj = data.subject as { [key: string]: any };
              normalizedSubject = subjectObj.name || subjectObj.title || subjectObj.value || 
                               subjectObj.label || subjectObj.text || subjectObj.id || 
                               'Generale';
            } else {
              normalizedSubject = String(data.subject);
            }
          }
          
          console.log('Materia normalizzata finale:', normalizedSubject);
          
          // SOLUZIONE OPZIONI: Normalizziamo tutte le domande con normalizeQuestions e
          // ci assicuriamo che ogni domanda abbia opzioni valide
          let normalizedQuestions = [];
          
          if (Array.isArray(data.questions) && data.questions.length > 0) {
            // Prenormalizziamo per assicurarci che id e altri campi siano presenti
            const preNormalizedQuestions = data.questions.map(q => ({
              ...q,
              id: q.id || `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              options: Array.isArray(q.options) && q.options.length > 0 ? q.options : 
                      (Array.isArray((q as any).answer_options) && (q as any).answer_options.length > 0 ? 
                        (q as any).answer_options.map((ao: any) => ({
                          id: ao.id || `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                          text: ao.text || '',
                          isCorrect: ao.is_correct === true
                        })) : 
                        [
                          { id: `temp_${Date.now()}_1`, text: 'Opzione 1', isCorrect: true },
                          { id: `temp_${Date.now()}_2`, text: 'Opzione 2', isCorrect: false },
                          { id: `temp_${Date.now()}_3`, text: 'Opzione 3', isCorrect: false },
                          { id: `temp_${Date.now()}_4`, text: 'Opzione 4', isCorrect: false }
                        ])
            }));
            
            normalizedQuestions = normalizeQuestions(preNormalizedQuestions);
          } else {
            // Se non ci sono domande, creiamo una domanda di default
            normalizedQuestions = [
              normalizeQuestion({
                id: `temp_${Date.now()}`,
                text: 'Nuova domanda',
                type: 'single_choice',
                options: [
                  { id: `option-${Date.now()}-1`, text: 'Opzione 1', isCorrect: true },
                  { id: `option-${Date.now()}-2`, text: 'Opzione 2', isCorrect: false },
                  { id: `option-${Date.now()}-3`, text: 'Opzione 3', isCorrect: false },
                  { id: `option-${Date.now()}-4`, text: 'Opzione 4', isCorrect: false }
                ],
                score: 1,
                points: 1
              })
            ];
          }
          
          console.log('DOMANDE NORMALIZZATE:', normalizedQuestions.map(q => ({ 
            id: q.id,
            testo: q.text,
            tipo: q.type,
            opzioni: q.options?.length || 0,
            dettaglioOpzioni: q.options
          })));
          
          // Assicuriamoci che tutti i campi richiesti siano presenti
          const completeData = {
            ...emptyTemplate,
            ...data,
            // Impostiamo la materia normalizzata
            subject: normalizedSubject,
            // Assicuriamoci che i campi critici siano nel formato corretto
            difficultyLevel: data.difficultyLevel || 'medium',
            timeLimit: data.timeLimit || 10,
            passingScore: data.passingScore || 60,
            // Utilizziamo le domande normalizzate
            questions: normalizedQuestions
          };
          
          console.log('DATI QUIZ COMPLETATI PER FORM:', completeData);
          setQuizTemplate(completeData);
        } catch (error: any) {
          console.error('Errore nel recupero del template del quiz:', error);
          NotificationsService.error('Errore nel recupero del template del quiz');
          navigate('/admin/quizzes');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchQuizTemplate();
  }, [id, isEditMode, navigate]);

  // Gestione dei cambiamenti nei campi del template
  const handleTemplateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setQuizTemplate(prev => ({
      ...prev,
      [name]: value
    }));
    // Rimuovi l'errore per il campo che è stato modificato
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Gestione dei cambiamenti nei switch
  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setQuizTemplate(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Gestione del cambio di select
  const handleSelectChange = (e: SelectChangeEvent) => {
    const name = e.target.name as string;
    const value = e.target.value;
    setQuizTemplate(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Aggiunta di una nuova domanda con normalizzazione
  const handleAddQuestion = () => {
    // @ts-ignore - temporary ignore for type issues with normalizeQuestion
const newQuestion = normalizeQuestion({
      id: `temp_${Date.now()}`,
      text: 'Nuova domanda',
      type: 'single_choice',
      options: [
        { id: `option-${Date.now()}-1`, text: 'Opzione 1', isCorrect: true },
        { id: `option-${Date.now()}-2`, text: 'Opzione 2', isCorrect: false },
        { id: `option-${Date.now()}-3`, text: 'Opzione 3', isCorrect: false },
        { id: `option-${Date.now()}-4`, text: 'Opzione 4', isCorrect: false }
      ],
      score: 1,
      points: 1
    });
    
    console.log('Nuova domanda normalizzata:', newQuestion);
    
    setQuizTemplate(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
      totalQuestions: (prev.totalQuestions || 0) + 1
    }));
  };

  // Rimozione di una domanda
  const handleRemoveQuestion = (questionIndex: number) => {
    setQuizTemplate(prev => ({
      ...prev,
      questions: prev.questions.filter((_, index) => index !== questionIndex)
    }));
  };

  // Gestione dei cambiamenti nelle domande
  const handleQuestionChange = (questionIndex: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setQuizTemplate(prev => ({
      ...prev,
      questions: prev.questions.map((question, index) => {
        if (index === questionIndex) {
          return {
            ...question,
            [name]: value
          };
        }
        return question;
      })
    }));
    // Rimuovi l'errore per la domanda che è stata modificata
    const errorKey = `questions[${questionIndex}].${name}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  // Gestione del cambio tipo di domanda
  const handleQuestionTypeChange = (questionIndex: number, e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const value = e.target.value as string;
    
    // Prepara le opzioni in base al tipo di domanda
    let options: Option[] = [];
    
    if (value === 'true_false') {
      options = [
        { id: '1', text: 'Vero', isCorrect: false },
        { id: '2', text: 'Falso', isCorrect: false }
      ];
    } else if (value === 'single_choice' || value === 'multiple_choice') {
      options = [
        { id: '1', text: '', isCorrect: false },
        { id: '2', text: '', isCorrect: false }
      ];
    }
    
    setQuizTemplate(prev => ({
      ...prev,
      questions: prev.questions.map((question, index) => {
        if (index === questionIndex) {
          return {
            ...question,
            type: value as 'single_choice' | 'multiple_choice' | 'true_false' | 'numeric',
            options: value === 'numeric' ? [] : options
          };
        }
        return question;
      })
    }));
  };

  // Gestione del cambio score della domanda
  const handleQuestionScoreChange = (questionIndex: number, e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const value = Number(e.target.value);
    setQuizTemplate(prev => ({
      ...prev,
      questions: prev.questions.map((question, index) => {
        if (index === questionIndex) {
          return {
            ...question,
            score: value
          };
        }
        return question;
      })
    }));
  };

  // Aggiunta di una nuova opzione
  const handleAddOption = (questionIndex: number) => {
    setQuizTemplate(prev => ({
      ...prev,
      questions: prev.questions.map((question, index) => {
        if (index === questionIndex) {
          return {
            ...question,
            options: [...(question.options || []), {
              id: `temp_${Date.now()}`,
              text: '',
              isCorrect: false
            }]
          };
        }
        return question;
      })
    }));
  };

  // Rimozione di un'opzione
  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    setQuizTemplate(prev => ({
      ...prev,
      questions: prev.questions.map((question, index) => {
        if (index === questionIndex) {
          return {
            ...question,
            options: question.options?.filter((_, idx) => idx !== optionIndex) || []
          };
        }
        return question;
      })
    }));
  };

  // Gestione dei cambiamenti nelle opzioni
  const handleOptionChange = (questionIndex: number, optionIndex: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setQuizTemplate(prev => ({
      ...prev,
      questions: prev.questions.map((question, qIndex) => {
        if (qIndex === questionIndex) {
          return {
            ...question,
            options: question.options?.map((option, oIndex) => {
              if (oIndex === optionIndex) {
                return {
                  ...option,
                  [name]: value
                };
              }
              return option;
            }) || []
          };
        }
        return question;
      })
    }));
    // Rimuovi l'errore per l'opzione che è stata modificata
    const errorKey = `questions[${questionIndex}].options[${optionIndex}].${name}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  // Gestione del cambio della correttezza dell'opzione
  const handleCorrectOptionChange = (questionIndex: number, optionIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    const questionType = quizTemplate.questions[questionIndex].type;
    
    setQuizTemplate(prev => ({
      ...prev,
      questions: prev.questions.map((question, qIndex) => {
        if (qIndex === questionIndex) {
          // Se è a scelta singola, bisogna deselezionare le altre opzioni
          if (questionType === 'single_choice' || questionType === 'true_false') {
            return {
              ...question,
              options: question.options?.map((option, oIndex) => ({
                ...option,
                isCorrect: oIndex === optionIndex ? isChecked : false
              })) || []
            };
          }
          // Se è a scelta multipla, si possono selezionare più opzioni
          return {
            ...question,
            options: question.options?.map((option, oIndex) => {
              if (oIndex === optionIndex) {
                return {
                  ...option,
                  isCorrect: isChecked
                };
              }
              return option;
            }) || []
          };
        }
        return question;
      })
    }));
  };

  // Validazione del form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let hasError = false;

    // Validazione dei campi del template
    if (!quizTemplate.title?.trim()) {
      newErrors.title = 'Il titolo è obbligatorio';
      hasError = true;
    }
    
    if (!quizTemplate.subject) {
      newErrors.subject = 'La materia è obbligatoria';
      hasError = true;
    } else if (quizTemplate.subject.trim() === '') {
      newErrors.subject = 'La materia è obbligatoria';
      hasError = true;
    }
    
    if (!quizTemplate.timeLimit || quizTemplate.timeLimit <= 0) {
      newErrors.timeLimit = 'Il tempo limite deve essere maggiore di 0';
      hasError = true;
    }
    
    if (quizTemplate.passingScore === undefined || quizTemplate.passingScore === null || quizTemplate.passingScore < 0 || quizTemplate.passingScore > 100) {
      newErrors.passingScore = 'Il punteggio di superamento deve essere tra 0 e 100';
      hasError = true;
    }
    
    // Validazione delle domande
    quizTemplate.questions.forEach((question, qIndex) => {
      if (!question.text.trim()) {
        newErrors[`questions[${qIndex}].text`] = 'Il testo della domanda è obbligatorio';
      }
      
      // Validazione delle opzioni per domande a scelta
      if (question.type !== 'numeric' && question.options) {
        let hasCorrectOption = false;
        
        question.options?.forEach((option, oIndex) => {
          if (!option.text.trim()) {
            newErrors[`questions[${qIndex}].options[${oIndex}].text`] = 'Il testo dell\'opzione è obbligatorio';
          }
          
          if (option.isCorrect) {
            hasCorrectOption = true;
          }
        });
        
        if (!hasCorrectOption) {
          newErrors[`questions[${qIndex}].options`] = 'Almeno un\'opzione deve essere corretta';
        }
      }
    });
    
    setErrors(newErrors);
    
    // Se ci sono errori, mostra una notifica di errore per dare un feedback visivo immediato
    if (hasError) {
      NotificationsService.warning(
        'Compilare tutti i campi obbligatori',
        'Form incompleto'
      );
    }
    
    return !hasError;
  };

  // Normalizzazione dei dati del quiz prima dell'invio al server
  const normalizeQuizData = (quiz: QuizTemplate): any => {
    // Crea una copia profonda del quiz per evitare mutazioni
    const normalizedQuiz = JSON.parse(JSON.stringify(quiz)) as any;
    
    console.log('Quiz originale da normalizzare per il backend:', normalizedQuiz);
    
    // SOLUZIONE AVANZATA SUBJECT: Forziamo sempre un valore per subject
    let subject = 'Generale'; // Valore predefinito sicuro
    
    if (normalizedQuiz.subject !== undefined && normalizedQuiz.subject !== null) {
      if (typeof normalizedQuiz.subject === 'object' && normalizedQuiz.subject !== null) {
        subject = normalizedQuiz.subject.name || normalizedQuiz.subject.title || normalizedQuiz.subject.value ||
                  normalizedQuiz.subject.label || normalizedQuiz.subject.text || normalizedQuiz.subject.id ||
                  'Generale';
      } else {
        subject = String(normalizedQuiz.subject);
      }
    }
    
    console.log('Subject definitivo inviato al backend:', subject);
    
    // SOLUZIONE OPZIONI: Pre-validiamo tutte le domande e le opzioni
    let validatedQuestions = [];
    
    if (normalizedQuiz.questions && normalizedQuiz.questions.length > 0) {
      validatedQuestions = normalizedQuiz.questions.map((question: any, qIndex: number) => {
        // Crea una domanda completamente validata
        const validatedQuestion = {
          ...question,
          id: question.id || `temp_${Date.now()}_${qIndex}`,
          text: question.text || `Domanda ${qIndex + 1}`,
          type: question.type || 'single_choice',
          score: Number(question.score || question.points) || 1,
          options: [] // Lo popoleremo sotto
        };
        
        // Assicurati che le opzioni siano valide
        const hasOptions = question.options && Array.isArray(question.options);
        const hasValidOptions = hasOptions && (question.options?.length || 0) > 0;
        
        if (hasValidOptions) {
          // Usa le opzioni esistenti ma assicurati che siano complete
          validatedQuestion.options = question.options?.map((opt: any, optIndex: number) => ({
            id: opt.id || `option_${qIndex}_${optIndex}_${Date.now()}`,
            text: opt.text || `Opzione ${optIndex + 1}`,
            isCorrect: typeof opt.isCorrect === 'boolean' ? opt.isCorrect : (optIndex === 0), // Prima opzione corretta di default
            additional_data: opt.additional_data || {}
          }));
        } else {
          // Crea opzioni predefinite in base al tipo di domanda
          if (question.type === 'true_false') {
            validatedQuestion.options = [
              { id: `tf_true_${qIndex}`, text: 'Vero', isCorrect: true, additional_data: {} },
              { id: `tf_false_${qIndex}`, text: 'Falso', isCorrect: false, additional_data: {} }
            ];
          } else {
            validatedQuestion.options = [
              { id: `opt_${qIndex}_1`, text: 'Opzione 1', isCorrect: true, additional_data: {} },
              { id: `opt_${qIndex}_2`, text: 'Opzione 2', isCorrect: false, additional_data: {} },
              { id: `opt_${qIndex}_3`, text: 'Opzione 3', isCorrect: false, additional_data: {} },
              { id: `opt_${qIndex}_4`, text: 'Opzione 4', isCorrect: false, additional_data: {} }
            ];
          }
        }
        
        return validatedQuestion;
      });
    } else {
      // Se non ci sono domande, creiamo una domanda di default
      validatedQuestions = [{
        id: `default_question_${Date.now()}`,
        text: 'Nuova domanda',
        type: 'single_choice',
        score: 1,
        options: [
          { id: `default_opt_1`, text: 'Opzione 1', isCorrect: true, additional_data: {} },
          { id: `default_opt_2`, text: 'Opzione 2', isCorrect: false, additional_data: {} },
          { id: `default_opt_3`, text: 'Opzione 3', isCorrect: false, additional_data: {} },
          { id: `default_opt_4`, text: 'Opzione 4', isCorrect: false, additional_data: {} }
        ]
      }];
    }
    
    // Adatta la struttura per conformarsi al modello QuizTemplateCreate del backend
    const backendFormat: any = {
      title: normalizedQuiz.title || 'Nuovo Quiz',
      description: normalizedQuiz.description || '',
      instructions: normalizedQuiz.description || '', // Utilizziamo la descrizione anche come istruzioni
      // Mappiamo direttamente le stringhe alle difficoltà numeriche attese dal backend
      difficulty_level: (() => {
        // Convertiamo le stringhe 'easy', 'medium', 'hard' nei valori numerici attesi dal backend
        switch(normalizedQuiz.difficultyLevel) {
          case 'easy': return 1;
          case 'medium': return 2;
          case 'hard': return 3;
          default: return 1; // Valore predefinito facile
        }
      })(),
      // Mappa la materia all'ID della categoria (fondamentale per la visualizzazione corretta)
      category_id: (() => {
        // Mappa la materia all'ID numerico della categoria
        const subjectLowerCase = subject.toLowerCase();
        switch(subjectLowerCase) {
          case 'matematica': return 1;
          case 'italiano': return 2;
          case 'scienze': return 3;
          case 'storia': return 4;
          case 'geografia': return 5;
          case 'inglese': return 6;
          default: return 1; // Matematica come default
        }
      })(),
      points: normalizedQuiz.totalPoints || 10,
      time_limit: Number(normalizedQuiz.timeLimit) || 10,
      passing_score: Number(normalizedQuiz.passingScore) || 60,
      is_active: normalizedQuiz.isPublic !== undefined ? normalizedQuiz.isPublic : true,
      subject: subject, // Usiamo la materia normalizzata
      // Fondamentale: il backend richiede il created_by e non lo stiamo fornendo
      // Otteniamo l'userId dal localStorage dove è memorizzato come oggetto JSON
      created_by: (() => {
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            return user.id || '00000000-0000-0000-0000-000000000000';
          }
        } catch (e) {
          console.error('Errore nel recupero dell\'ID utente:', e);
        }
        return '00000000-0000-0000-0000-000000000000'; // ID di fallback
      })(),
      questions: []
    };
    
    // Verifichiamo se il quiz originale ha un ID e lo includiamo (importante per gli aggiornamenti)
    if (normalizedQuiz.id) {
      backendFormat.id = normalizedQuiz.id;
    }
    
    // Converti le domande nel formato atteso dal backend
    backendFormat.questions = validatedQuestions.map((question: any, index: number) => {
      console.log(`[DEBUG] Domanda validata ${index+1}:`, {
        text: question.text,
        options: question.options?.length || 0
      });
      
      // Creiamo la struttura della domanda per il backend
      const questionData: any = {
        text: question.text,
        question_type: question.type,
        points: Number(question.score || question.points) || 1,
        order: index,
        additional_data: question.additional_data || {},
      };
      
      // Preserviamo l'ID della domanda se presente
      if (question.id && !question.id.startsWith('temp_')) {
        questionData.id = question.id;
      }
      
      // Mappiamo le opzioni nel formato corretto per il backend
      questionData.answer_options = question.options?.map((option: any, optIndex: number) => ({
        text: option.text,
        is_correct: option.isCorrect === true,
        order: optIndex,
        additional_data: option.additional_data || {},
        // Preserviamo l'ID dell'opzione se presente (importante per gli aggiornamenti)
        ...(option.id && !option.id.startsWith('opt_') && !option.id.startsWith('temp_') ? { id: option.id } : {})
      }));
      
      return questionData;
    });
    
    console.log('[DEBUG] Dati completi preparati per il backend:', backendFormat);
    return backendFormat;
  };
  
  // Determina l'URL dell'API in base all'ambiente
  const getApiUrl = () => {
    const configuredUrl = process.env.REACT_APP_API_URL;
    if (configuredUrl) return configuredUrl;
    
    const currentHost = window.location.hostname;
    return `http://${currentHost}:8000`;
  };
  
  const API_URL = getApiUrl();
  
  // Salvataggio del quiz
  const handleSave = async () => {
    if (!validateForm()) {
      NotificationsService.error('Correggi gli errori prima di salvare');
      return;
    }
    
    setSaving(true);
    
    try {
      // Notifica all'utente che il salvataggio è in corso
      NotificationsService.info(
        'Salvataggio in corso...',
        'Attendere prego'
      );
      
      // NOTA: Esiste un problema noto con l'aggiornamento dei quiz
      // Vedi CLAUDE.md per maggiori dettagli
      // La soluzione ideale sarebbe eliminare il quiz esistente e crearne uno nuovo
      interface DirectQuizData {
        id?: string;
        title: string;
        description: string;
        instructions: string;
        subject: string;
        category_id: number; // Aggiunto per mappare correttamente la materia al suo ID
        difficulty_level: number;
        time_limit: number;
        passing_score: number;
        is_active: boolean;
        created_by: string;
        questions: Array<{
          text: string;
          question_type: string;
          points: number;
          order: number;
          additional_data: Record<string, any>;
          answer_options: Array<{
            text: string;
            is_correct: boolean;
            order: number;
            additional_data: Record<string, any>;
          }>
        }>;
      }
      
      // Determina la materia corretta per la mappatura al category_id
      let normalizedSubject = typeof quizTemplate.subject === 'object' 
        ? ((quizTemplate.subject as any)?.name || 'Generale') 
        : (quizTemplate.subject || 'Generale');
      
      console.log('[DEBUG] Materia determinata per il quiz:', normalizedSubject);
      
      const directData: DirectQuizData = {
        title: quizTemplate.title || 'Quiz senza titolo',
        description: quizTemplate.description || '',
        instructions: quizTemplate.description || '',
        subject: normalizedSubject,
        // Aggiungi il category_id mappando dalla materia
        category_id: (() => {
          // Mappa la materia all'ID numerico della categoria
          const subjectLowerCase = normalizedSubject.toLowerCase();
          console.log('[DEBUG] Mapping materia a category_id:', subjectLowerCase);
          switch(subjectLowerCase) {
            case 'matematica': return 1;
            case 'italiano': return 2;
            case 'scienze': return 3;
            case 'storia': return 4;
            case 'geografia': return 5;
            case 'inglese': return 6;
            default: return 1; // Matematica come default
          }
        })(),
        difficulty_level: (() => {
          switch(quizTemplate.difficultyLevel) {
            case 'easy': return 1;
            case 'medium': return 2; 
            case 'hard': return 3;
            default: return 2;
          }
        })(),
        time_limit: Number(quizTemplate.timeLimit) || 10,
        passing_score: Number(quizTemplate.passingScore) || 60,
        is_active: quizTemplate.isPublic !== undefined ? quizTemplate.isPublic : true,
        created_by: "3664795c-7353-4ac1-ac76-f25e62b0b249", // ID admin hardcoded
        
        // Prepariamo le domande nel formato esatto che si aspetta il backend
        questions: quizTemplate.questions.map((question, qIndex) => {
          const hasOptions = question.options && Array.isArray(question.options) && (question.options.length || 0) > 0;
          
          return {
            text: question.text || `Domanda ${qIndex + 1}`,
            question_type: question.type || 'single_choice',
            points: Number(question.score) || 1,
            order: qIndex,
            additional_data: {},
            
            // Le opzioni nel formato preciso che si aspetta il backend
            answer_options: hasOptions && question.options 
              ? question.options.map((opt, optIndex) => ({
                text: opt.text || `Opzione ${optIndex + 1}`,
                is_correct: opt.isCorrect === true,
                order: optIndex,
                additional_data: {}
              }))
              : [
                { text: "Opzione 1", is_correct: true, order: 0, additional_data: {} },
                { text: "Opzione 2", is_correct: false, order: 1, additional_data: {} },
                { text: "Opzione 3", is_correct: false, order: 2, additional_data: {} }
              ]
          };
        })
      };
      
      // Se in modalità modifica, aggiungiamo l'ID per l'aggiornamento
      if (isEditMode && id) {
        directData.id = id;
      }
      
      // Debug dettagliato
      console.log('[DEBUG] Invio dati diretti al backend:', JSON.stringify(directData, null, 2));
      
      // URL diretto a cui inviare i dati, senza passare dal QuizService
      const directEndpoint = isEditMode 
        ? `${API_URL}/api/quiz/templates/${id}` 
        : `${API_URL}/api/quiz/templates`;
      
      // Utilizziamo Axios o Fetch direttamente per vedere la risposta completa e gli errori
      console.log(`[DEBUG] Invio richiesta diretta a ${directEndpoint} con metodo ${isEditMode ? 'PUT' : 'POST'}`);
      
      try {
        const axiosConfig = {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        };
        
        // Invia la richiesta direttamente tramite ApiService
        let response;
        if (isEditMode) {
          // Per l'aggiornamento, usiamo l'approccio DELETE + CREATE
          try {
            // Prima eliminiamo il quiz esistente
            console.log(`[DEBUG] Tentativo di eliminare il quiz con ID ${id}`);
            await QuizService.deleteQuizTemplate(id!);
            console.log('[DEBUG] Quiz precedente eliminato con successo');
            
            // Poi creiamo un nuovo quiz (senza ID per forzare la creazione)
            if (directData.id) {
              delete directData.id;
            }
            
            console.log('[DEBUG] Creazione nuovo quiz dopo eliminazione');
            response = await ApiService.post('/api/quiz/templates', directData);
          } catch (e) {
            console.error('[DEBUG] Errore nell\'approccio DELETE+CREATE:', e);
            throw e;
          }
        } else {
          // Per la creazione normale, usiamo semplicemente POST
          console.log('[DEBUG] Creazione di un nuovo quiz');
          response = await ApiService.post('/api/quiz/templates', directData);
        }
        
        console.log('[DEBUG] Risposta ricevuta:', response);
      } catch (apiError: any) {
        console.error('[DEBUG] ERRORE API:', apiError);
        console.error('[DEBUG] Response data:', apiError.response?.data);
        console.error('[DEBUG] Response status:', apiError.response?.status);
        throw apiError;
      }
      
      // Notifica l'utente del successo
      if (isEditMode) {
        NotificationsService.success(
          'Quiz aggiornato con successo tramite sostituzione!',
          'Operazione completata'
        );
      } else {
        NotificationsService.success(
          'Nuovo quiz creato con successo!',
          'Operazione completata'
        );
      }
      
      // Torna alla lista quiz dopo il successo
      setTimeout(() => {
        navigate('/admin/quizzes');
      }, 1500);
    } catch (error: any) {
      console.error('ERRORE DETTAGLIATO:', error);
      
      // Estrai il messaggio di errore più utile possibile
      let errorMessage = 'Errore durante il salvataggio';
      
      if (error.response?.data) {
        // Gestisci API error
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else {
          // Converti l'oggetto di errore in stringa se possibile
          try {
            errorMessage = JSON.stringify(error.response.data);
          } catch (e) {
            // Fallback al messaggio semplice
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Mostra il messaggio di errore
      NotificationsService.error(
        `Errore: ${errorMessage}`,
        'Salvataggio non riuscito'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title={isEditMode ? 'Modifica Template Quiz' : 'Nuovo Template Quiz'}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={isEditMode ? 'Modifica Template Quiz' : 'Nuovo Template Quiz'}>
      <Box p={3}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton 
            color="primary" 
            onClick={() => navigate('/admin/quizzes')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5">
            {isEditMode ? 'Modifica Template Quiz' : 'Nuovo Template Quiz'}
          </Typography>
        </Box>

          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Informazioni Generali
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Titolo"
                  name="title"
                  value={quizTemplate.title}
                  onChange={handleTemplateChange}
                  error={!!errors.title}
                  helperText={errors.title}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.subject} required>
                  <InputLabel id="subject-label">Materia</InputLabel>
                  <Select
                    labelId="subject-label"
                    name="subject"
                    value={quizTemplate.subject || ''}
                    onChange={handleSelectChange}
                    label="Materia"
                  >
                    <MenuItem value="matematica">Matematica</MenuItem>
                    <MenuItem value="italiano">Italiano</MenuItem>
                    <MenuItem value="scienze">Scienze</MenuItem>
                    <MenuItem value="storia">Storia</MenuItem>
                    <MenuItem value="geografia">Geografia</MenuItem>
                    <MenuItem value="inglese">Inglese</MenuItem>
                  </Select>
                  {errors.subject && <FormHelperText>{errors.subject}</FormHelperText>}
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descrizione"
                  name="description"
                  value={quizTemplate.description}
                  onChange={handleTemplateChange}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="difficulty-label">Difficoltà</InputLabel>
                  <Select
                    labelId="difficulty-label"
                    name="difficultyLevel"
                    value={quizTemplate.difficultyLevel}
                    onChange={handleSelectChange}
                    label="Difficoltà"
                  >
                    <MenuItem value="easy">Facile</MenuItem>
                    <MenuItem value="medium">Media</MenuItem>
                    <MenuItem value="hard">Difficile</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Tempo limite (minuti)"
                  name="timeLimit"
                  type="number"
                  value={quizTemplate.timeLimit}
                  onChange={handleTemplateChange}
                  error={!!errors.timeLimit}
                  helperText={errors.timeLimit}
                  InputProps={{ inputProps: { min: 1 } }}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Punteggio di superamento (%)"
                  name="passingScore"
                  type="number"
                  value={quizTemplate.passingScore}
                  onChange={handleTemplateChange}
                  error={!!errors.passingScore}
                  helperText={errors.passingScore}
                  InputProps={{ inputProps: { min: 0, max: 100 } }}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={quizTemplate.isPublic}
                      onChange={handleSwitchChange}
                      name="isPublic"
                      color="primary"
                    />
                  }
                  label="Rendi pubblico questo quiz"
                />
              </Grid>
            </Grid>
          </Paper>

          <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Domande</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddQuestion}
            >
              Aggiungi Domanda
            </Button>
          </Box>

          {quizTemplate.questions.map((question, questionIndex) => (
            <Paper key={question.id || questionIndex} elevation={3} sx={{ p: 3, mb: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Domanda {questionIndex + 1}
                </Typography>
                <IconButton
                  color="error"
                  onClick={() => handleRemoveQuestion(questionIndex)}
                  disabled={quizTemplate.questions.length === 1}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Testo della domanda"
                    name="text"
                    value={question.text}
                    onChange={(e) => handleQuestionChange(questionIndex, e)}
                    error={!!errors[`questions[${questionIndex}].text`]}
                    helperText={errors[`questions[${questionIndex}].text`]}
                    required
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo di domanda</InputLabel>
                    <Select
                      value={question.type}
                      onChange={(e: any) => handleQuestionTypeChange(questionIndex, e)}
                      label="Tipo di domanda"
                    >
                      {questionTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Punteggio</InputLabel>
                    <Select
                      value={question.score}
                      onChange={(e: any) => handleQuestionScoreChange(questionIndex, e)}
                      label="Punteggio"
                    >
                      {scores.map((score) => (
                        <MenuItem key={score} value={score}>
                          {score} {score === 1 ? 'punto' : 'punti'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* Opzioni per domande a scelta singola, multipla e vero/falso */}
                {question.type !== 'numeric' && (
                  <Grid item xs={12}>
                    <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2">
                        Opzioni di risposta
                      </Typography>
                      {question.type !== 'true_false' && (
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => handleAddOption(questionIndex)}
                        >
                          Aggiungi opzione
                        </Button>
                      )}
                    </Box>
                    
                    {!!errors[`questions[${questionIndex}].options`] && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {errors[`questions[${questionIndex}].options`]}
                      </Alert>
                    )}
                    
                    {Array.isArray(question.options) && (question.options.length || 0) > 0 ? question.options.map((option, optionIndex) => (
                      <Box 
                        key={option.id || optionIndex} 
                        display="flex" 
                        alignItems="center"
                        mb={2}
                      >
                        <FormControlLabel
                          control={
                            <Switch
                              checked={option.isCorrect}
                              onChange={(e) => handleCorrectOptionChange(questionIndex, optionIndex, e)}
                              color="success"
                            />
                          }
                          label=""
                          sx={{ mr: 0 }}
                        />
                        <TextField
                          fullWidth
                          label={`Opzione ${optionIndex + 1}`}
                          name="text"
                          value={option.text}
                          onChange={(e) => handleOptionChange(questionIndex, optionIndex, e)}
                          error={!!errors[`questions[${questionIndex}].options[${optionIndex}].text`]}
                          helperText={errors[`questions[${questionIndex}].options[${optionIndex}].text`]}
                          required
                          disabled={question.type === 'true_false'}
                          sx={{ mr: 2 }}
                        />
                        {(question.options?.length || 0) > 2 && question.type !== 'true_false' && (
                          <IconButton 
                            color="error"
                            onClick={() => handleRemoveOption(questionIndex, optionIndex)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                    )) : (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Nessuna opzione disponibile. Aggiungi opzioni per questa domanda.
                      </Alert>
                    )}
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Spiegazione (opzionale)"
                    name="explanation"
                    value={question.explanation || ''}
                    onChange={(e) => handleQuestionChange(questionIndex, e)}
                    multiline
                    rows={2}
                    helperText="La spiegazione sarà mostrata agli studenti dopo che avranno risposto alla domanda"
                  />
                </Grid>
              </Grid>
            </Paper>
          ))}

          <Box display="flex" justifyContent="flex-end" mt={3}>
            <Button
              variant="outlined"
              onClick={() => navigate('/admin/quizzes')}
              sx={{ mr: 2 }}
            >
              Annulla
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              disabled={saving}
            >
              {saving ? 'Salvataggio...' : isEditMode ? 'Aggiorna' : 'Salva'}
            </Button>
          </Box>
        </Box>
      </MainLayout>
  );
};

export default AdminQuizForm;
