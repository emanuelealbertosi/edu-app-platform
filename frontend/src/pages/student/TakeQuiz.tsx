import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../../components/layout/MainLayout';
import PageTransition from '../../components/animations/PageTransition';
import FadeInLoader from '../../components/animations/FadeInLoader';
import SuccessAnimation from '../../components/animations/SuccessAnimation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Typography,
  Box,
  Paper,
  Button,
  Stepper,
  Step,
  StepLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  TextField,
  Divider,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  FormGroup,
  Checkbox,
  Chip,
  Stack,
  Snackbar,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon,
  AccessTime as AccessTimeIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import StarsIcon from '@mui/icons-material/Stars';
import QuizService, { Quiz, QuizResult, Question } from '../../services/QuizService';
import { NotificationsService } from '../../services/NotificationsService';
import { LOCAL_STORAGE_KEYS } from '../../constants';

// Importazione componenti di animazione
import { 
  FadeIn, 
  SlideInUp, 
  SlideInLeft, 
  SlideInRight,
  HoverAnimation
} from '../../components/animations/Transitions';
import { 
  LoadingIndicator, 
  ProgressBar,
  CardSkeleton
} from '../../components/animations/LoadingAnimations';
import { AnimatedPage, AnimatedList } from '../../components/animations/PageTransitions';

// Interfaccia per la risposta di una singola domanda
interface QuizAnswer {
  questionId: string;
  selectedOptionId?: string;
  textAnswer?: string;
}

// Interfaccia per l'invio delle risposte di un quiz completo
interface QuizSubmission {
  answers: QuizAnswer[];
  timeSpent: number;
  quizUuid?: string; // Campo opzionale per l'UUID
}

const TakeQuiz: React.FC = () => {
  // Aggiungi pathId ai parametri dell'URL
  const { quizId, pathId } = useParams<{ quizId: string; pathId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [multipleChoiceAnswers, setMultipleChoiceAnswers] = useState<Record<string, string[]>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [timeWarning, setTimeWarning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<Date>(new Date());
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [completed, setCompleted] = useState(false);
  const [quizAlreadyReviewed, setQuizAlreadyReviewed] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        console.log(`[DEBUG TakeQuiz] Fetching quiz with ID: ${quizId} for path: ${pathId || 'not specified'}`);
        
        // Ottieni il quiz in base al contesto (percorso o standalone)
        let quizData;
        if (pathId) {
          console.log(`[DEBUG TakeQuiz] Fetching quiz from path context using getPathQuiz`);
          quizData = await QuizService.getPathQuiz(pathId, quizId);
        } else {
          console.log(`[DEBUG TakeQuiz] Fetching standalone quiz using getQuiz`);
          quizData = await QuizService.getQuiz(quizId);
        }
        
        console.log('[DEBUG TakeQuiz] Quiz data received:', quizData);
        
        // Se abbiamo recuperato il quiz con successo
        if (quizData) {
          setQuiz(quizData);
          
          // Se il quiz è già stato completato, mostra una notifica (solo se ha completedAt)
          if (quizData.isCompleted && quizData.completedAt) {
            NotificationsService.warning(
              "Questo quiz è già stato completato in precedenza. Completarlo di nuovo non aggiungerà ulteriori punti.",
              "Quiz già completato"
            );
          }
          
          // Registra il tempo di inizio
          setStartTime(new Date());
          setQuestionStartTime(new Date());
          
          // Se c'è un time limit, calcola il tempo rimanente
          if (quizData.timeLimit) {
            setRemainingTime(quizData.timeLimit * 60); // Converti da minuti a secondi
          }
        } else {
          throw new Error('Quiz non trovato o formato non valido');
        }
      } catch (err: any) {
        console.error('[DEBUG TakeQuiz] Error fetching quiz:', err);
        setError(err.message || 'Si è verificato un errore nel caricamento del quiz');
        NotificationsService.error('Errore nel caricamento del quiz', 'Errore');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, pathId]);

  // Timer countdown
  useEffect(() => {
    if (remainingTime === null || quizCompleted) return;

    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev === null) return null;
        
        if (prev <= 0) {
          clearInterval(timer);
          handleSubmitAnswers();
          return 0;
        }
        
        // Mostra avviso quando mancano 2 minuti
        if (prev === 120) {
          setTimeWarning(true);
        }
        
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingTime, quizCompleted]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleNext = () => {
    // Calcola il tempo trascorso sulla domanda corrente
    const currentQuestion = quiz?.questions[activeStep];
    if (currentQuestion) {
      const endTime = new Date();
      const timeSpent = Math.floor((endTime.getTime() - questionStartTime.getTime()) / 1000);
    }
    
    // Passa alla prossima domanda
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setQuestionStartTime(new Date()); // Resetta il timer per la nuova domanda
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setQuestionStartTime(new Date()); // Resetta il timer per la nuova domanda
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };
  
  const handleTextAnswerChange = (questionId: string, value: string) => {
    setTextAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleCloseTimeWarning = () => {
    setTimeWarning(false);
  };

  const handleOpenConfirmSubmit = () => {
    setConfirmSubmit(true);
  };

  const handleCloseConfirmSubmit = () => {
    setConfirmSubmit(false);
  };

  const handleSubmitAnswers = async () => {
    try {
      if (!quiz) return;
      
      setSubmitting(true);
      
      console.log('[DEBUG TakeQuiz] Preparazione invio risposte:', {
        singleChoice: answers,
        multipleChoice: multipleChoiceAnswers,
        textAnswers: textAnswers,
        quizId: quiz.id,
        quizUuid: quiz.uuid
      });
      
      // STEP 1: Assicuriamoci di avere un UUID valido
      let quizUuid: string = quiz.uuid || '';
      console.log('[DEBUG TakeQuiz] Verifica UUID iniziale:', {
        uuid: quizUuid,
        valid: quizUuid && quizUuid.includes('-')
      });
      
      // Se non abbiamo un UUID valido, dobbiamo ottenerlo
      if (!quizUuid || !quizUuid.includes('-')) {
        console.log('[DEBUG TakeQuiz] UUID non valido, tentativo di ottenerlo');
        
        try {
          // Prova a creare un nuovo tentativo
          console.log('[DEBUG TakeQuiz] Chiamata a getOrCreateQuizAttempt con quiz ID:', quiz.id);
          const newUuid = await QuizService.getOrCreateQuizAttempt(quiz.id);
          console.log('[DEBUG TakeQuiz] Risposta di getOrCreateQuizAttempt:', newUuid);
          
          if (newUuid && typeof newUuid === 'string' && newUuid.includes('-')) {
            console.log('[DEBUG TakeQuiz] Ottenuto UUID valido:', newUuid);
            quizUuid = newUuid;
          } else {
            // Se non siamo riusciti a ottenere un UUID valido, non possiamo procedere
            console.error('[DEBUG TakeQuiz] Impossibile ottenere un UUID valido per il quiz');
            throw new Error('Impossibile ottenere un UUID valido per il quiz. Riprova più tardi.');
          }
        } catch (error) {
          console.error('[DEBUG TakeQuiz] Errore durante il recupero dell\'UUID:', error);
          NotificationsService.error(
            'Impossibile iniziare il quiz. Riprova più tardi.',
            'Errore'
          );
          throw new Error('Impossibile ottenere un UUID valido per il quiz. Riprova più tardi.');
        }
      }
      
      // Preparazione dei dati per l'invio
      const submission: QuizSubmission = {
        answers: quiz.questions.map(question => {
          const questionId = question.id;
          
          // Risposte in base al tipo di domanda
          if (question.type === 'text' || question.type === 'numeric') {
            return {
              questionId,
              textAnswer: textAnswers[questionId] || ''
            };
          } else if (question.type === 'multiple_choice') {
            return {
              questionId,
              selectedOptionId: multipleChoiceAnswers[questionId]?.join(',') || ''
            };
          } else {
            // single_choice, true_false
            return {
              questionId,
              selectedOptionId: answers[questionId] || ''
            };
          }
        }),
        timeSpent: Math.floor((new Date().getTime() - startTime!.getTime()) / 1000), // Tempo impiegato in secondi
        quizUuid: quizUuid // Includi sempre l'UUID che abbiamo ottenuto
      };

      console.log('[DEBUG TakeQuiz] Invio risposte per il quiz:', {
        quizId: quiz.id,
        quizUuid: quizUuid,
        answersCount: submission.answers.length
      });
      
      // Invio del quiz usando il metodo appropriato
      let result;
      
      // Il percorso è solo un dettaglio di contesto, non cambia l'endpoint da utilizzare
      if (pathId && quiz.pathId) {
        console.log(`[DEBUG TakeQuiz] Invio con percorso ${pathId} e UUID ${quizUuid}`);
      } else {
        console.log(`[DEBUG TakeQuiz] Invio senza percorso con UUID ${quizUuid}`);
      }
      
      // Usa submitQuiz che ora utilizza esclusivamente l'endpoint con UUID
      result = await QuizService.submitQuiz(quiz.id, submission);
      
      console.log('[DEBUG TakeQuiz] Risultato sottomissione:', result);
      
      // Aggiorna il risultato nella UI
      setResult(result);
      setCompleted(true);
      
      // Messaggio di successo basato sul risultato
      if (result?.already_completed) {
        // IMPORTANTE: Aggiungi un log forzato per verificare che questa condizione venga raggiunta
        console.warn('[DEBUG TakeQuiz] Quiz già completato rilevato:', {
          alreadyCompleted: result.already_completed,
          message: result.message || "Nessun messaggio fornito",
          score: result.score,
          maxScore: result.maxScore,
          percentage: result.percentage
        });
        
        // Mostra SEMPRE la notifica quando il quiz è già completato
        NotificationsService.warning(
          result.message || "Questo quiz è già stato completato. Il punteggio mostrato è quello del tentativo precedente.",
          'Quiz Già Completato'
        );
        
        // Registra sempre il warning nei log
        console.warn('[DEBUG TakeQuiz] Quiz già completato:', {
          quizId: quiz.id,
          quizUuid: quizUuid,
          alreadyCompleted: true,
          message: result.message
        });
      } else {
        NotificationsService.success(
          `Quiz completato con successo! Punteggio: ${result.score}/${result.maxScore}`,
          'Quiz Completato'
        );
      }
      
      // Reindirizzamento dopo un breve ritardo per mostrare il risultato
      setTimeout(() => {
        if (pathId) {
          // Torna alla pagina del percorso (corretto il percorso)
          navigate(`/student/path/${pathId}`);
        } else {
          // Torna all'elenco dei quiz
          navigate('/student/quizzes');
        }
      }, 5000);
    } catch (error) {
      console.error('[DEBUG TakeQuiz] Errore durante l\'invio delle risposte:', error);
      
      NotificationsService.error(
        'Si è verificato un errore durante l\'invio delle risposte',
        'Errore'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Gestisce il timeout del quiz
  useEffect(() => {
    if (!quiz?.timeLimit || !startTime) return;

    const timeLimitMs = quiz.timeLimit * 60 * 1000; // Converti i minuti in millisecondi
    const endTime = startTime.getTime() + timeLimitMs;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const timeLeft = endTime - now;

      if (timeLeft <= 0) {
        // Il tempo è scaduto, invia automaticamente le risposte
        clearInterval(timer);
        handleSubmitAnswers();
      } else if (timeLeft <= 60000) { // Ultimo minuto
        // Mostra un avviso quando manca un minuto
        setTimeWarning(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz?.timeLimit, startTime]);

  // Gestisce il cambio di opzione nelle domande a scelta singola
  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleAnswerChange(quiz!.questions[activeStep].id, e.target.value);
  };

  // Gestisce il cambio di opzione nelle domande a scelta multipla
  const handleMultipleChoiceChange = (questionId: string, optionId: string, checked: boolean) => {
    setMultipleChoiceAnswers(prev => {
      const currentAnswers = prev[questionId] || [];
      
      if (checked) {
        // Aggiungi l'opzione se non è già presente
        if (!currentAnswers.includes(optionId)) {
          return {
            ...prev,
            [questionId]: [...currentAnswers, optionId]
          };
        }
      } else {
        // Rimuovi l'opzione se è presente
        return {
          ...prev,
          [questionId]: currentAnswers.filter(id => id !== optionId)
        };
      }
      
      return prev;
    });
  };

  // Gestisce il cambio del testo nelle domande aperte
  const handleTextChange = (questionId: string, value: string) => {
    handleTextAnswerChange(questionId, value);
  };

  // Calcola il numero di domande senza risposta
  const getUnansweredQuestionsCount = (): number => {
    if (!quiz) return 0;
    
    return quiz.questions.reduce((count, question) => {
      const questionId = question.id;
      
      switch (question.type) {
        case 'multiple_choice':
          // Verifica se non ci sono risposte multiple o se l'array è vuoto
          if (!multipleChoiceAnswers[questionId] || multipleChoiceAnswers[questionId].length === 0) {
            return count + 1;
          }
          break;
          
        case 'single_choice':
        case 'true_false':
          // Verifica se non c'è una risposta singola
          if (!answers[questionId]) {
            return count + 1;
          }
          break;
          
        case 'text':
        case 'numeric':
          // Verifica se non c'è una risposta testuale o è vuota
          if (!textAnswers[questionId] || textAnswers[questionId].trim() === '') {
            return count + 1;
          }
          break;
          
        default:
          // Per sicurezza, considera non risposte le domande di tipo sconosciuto
          return count + 1;
      }
      
      return count;
    }, 0);
  };

  // Handle navigating back to the path detail or quiz list
  const handleBackToPath = () => {
    if (pathId) {
      navigate(`/student/path/${pathId}`); // Corretto il percorso
    } else {
      navigate('/student/quizzes');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <LoadingIndicator text="Caricamento quiz..." size={50} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ padding: 3, textAlign: 'center' }}>
        <Typography variant="h5" component="h1" color="error" gutterBottom>
          Errore
        </Typography>
        <Typography>{error}</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Torna indietro
        </Button>
      </Box>
    );
  }

  // Mostra un avviso se il quiz è stato completato in precedenza
  if (quiz?.isCompleted && quiz?.completedAt && !quizCompleted && !quizAlreadyReviewed) {
    return (
      <Box sx={{ padding: 3 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            padding: 3, 
            textAlign: 'center',
            border: '2px solid #FFC107',
            backgroundColor: '#FFF8E1'
          }}
        >
          <Typography variant="h5" component="h1" gutterBottom sx={{ color: '#FF8F00' }}>
            Quiz già completato
          </Typography>
          <Typography paragraph>
            Hai già completato questo quiz in precedenza. Se continui, potrai rivedere le domande ma il tuo punteggio precedente rimarrà invariato.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => navigate(-1)}
            >
              Torna indietro
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setQuizAlreadyReviewed(true)}
            >
              Continua comunque
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <Box sx={{ padding: 3, textAlign: 'center' }}>
        <Typography variant="h5" component="h1" color="error" gutterBottom>
          Quiz non valido
        </Typography>
        <Typography>Il quiz non contiene domande o non è correttamente configurato.</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Torna indietro
        </Button>
      </Box>
    );
  }

  if (completed) {
    // Calcola sempre una percentuale di fallback in caso non arrivi dal backend
    const calculatedPercentage = result?.percentage || 
      (result?.maxScore && result?.maxScore > 0 ? 
        Math.round((result?.score / result?.maxScore) * 100) : 0);
    
    return (
      <AnimatedPage transitionType="fade">
        <MainLayout title={result?.already_completed ? "Quiz Già Completato" : "Quiz Completato"}>
          <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
            <FadeIn>
              <Box textAlign="center" py={4}>
                {result?.already_completed ? (
                  <>
                    <InfoIcon color="warning" sx={{ fontSize: 80, mb: 2 }} />
                    <Typography 
                      variant="h5" 
                      bgcolor="warning.light" 
                      color="warning.dark" 
                      p={2} 
                      mb={3} 
                      borderRadius={2}
                    >
                      {result.message || "Questo quiz è già stato completato in precedenza."}
                    </Typography>
                  </>
                ) : (
                  <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
                )}
                <Typography variant="h4" gutterBottom>
                  {result?.already_completed ? "Quiz Già Completato" : "Quiz Completato!"}
                </Typography>
                <Typography variant="h5" color="primary" gutterBottom>
                  Hai ottenuto: {result?.score}/{result?.maxScore} punti
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Percentuale: {calculatedPercentage}%
                </Typography>
                <Typography variant="body1" paragraph>
                  {result?.pointsAwarded !== null && result?.pointsAwarded !== undefined && (
                    <>Hai guadagnato <strong>{result?.pointsAwarded}</strong> punti premio!</>
                  )}
                </Typography>
                
                {/* Messaggio se il quiz era già stato completato */}
                {result?.already_completed && (
                  <Box sx={{ 
                    mt: 2, 
                    p: 2, 
                    backgroundColor: '#FFF8E1', 
                    borderRadius: 1,
                    border: '1px solid #FFC107'
                  }}>
                    <Typography variant="body1" color="warning.dark">
                      <InfoIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                      {result.message || "Questo quiz era già stato completato in precedenza."}
                    </Typography>
                  </Box>
                )}
                
                <SlideInUp delay={0.4}>
                  <Box display="flex" justifyContent="center" mt={4} gap={2}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleBackToPath}
                    >
                      Torna alla Dashboard
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/student/paths')}
                    >
                      Visualizza Percorsi
                    </Button>
                  </Box>
                </SlideInUp>
              </Box>
            </FadeIn>
          </Box>
        </MainLayout>
      </AnimatedPage>
    );
  }

  return (
    <MainLayout title={quiz?.isCompleted && quiz?.completedAt ? "Quiz (Già Completato)" : "Quiz"}>
      <Box sx={{ p: 3, position: 'relative' }}>
        {/* Indicatore per quiz già completato */}
        {quiz?.isCompleted && quiz?.completedAt && (
          <Box 
            sx={{ 
              backgroundColor: 'warning.light',
              color: 'warning.dark',
              p: 2,
              mb: 3,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <InfoIcon />
            <Typography variant="body1">
              <strong>Attenzione:</strong> Questo quiz è già stato completato in precedenza. 
              Il completamento di nuovo non aggiungerà ulteriori punti.
            </Typography>
          </Box>
        )}
        
        {/* Debug Panel - Only shown in development mode */}
        {process.env.NODE_ENV === 'development' && (
          <Paper 
            sx={{ 
              p: 2, 
              mb: 2, 
              bgcolor: '#f5f5f5', 
              border: '1px dashed #999',
              fontSize: '0.85rem',
              fontFamily: 'monospace'
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>DEBUG INFO (dev mode only)</Typography>
            <Box component="pre" sx={{ m: 0, p: 0 }}>
              {JSON.stringify({
                quizId: quizId,
                pathId: pathId,
                loadedQuiz: quiz ? {
                  id: quiz.id,
                  uuid: quiz.uuid,
                  uuidPresent: !!quiz.uuid,
                  uuidLength: quiz.uuid ? quiz.uuid.length : 0,
                  containsDash: quiz.uuid ? quiz.uuid.includes('-') : false,
                  templateId: quiz.templateId,
                  title: quiz.title,
                  description: quiz.description?.substring(0, 50) + '...',
                  questionCount: quiz.questions?.length || 0,
                  questions: quiz.questions?.map(q => ({
                    id: q.id,
                    text: q.text?.substring(0, 30) + '...',
                    type: q.type,
                    optionsCount: q.options?.length || 0,
                    points: q.points
                  }))
                } : 'Not loaded yet'
              }, null, 2)}
            </Box>
            <Button 
              variant="outlined" 
              size="small" 
              color="primary" 
              sx={{ mt: 1 }}
              onClick={() => {
                console.log('Full quiz object for debugging:', quiz);
              }}
            >
              Log Full Quiz to Console
            </Button>
          </Paper>
        )}
        
        {/* Back Button */}
        <Button
          startIcon={<NavigateBeforeIcon />}
          onClick={handleBackToPath}
          sx={{ mb: 2 }}
        >
          Torna indietro
        </Button>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <LoadingIndicator text="Caricamento quiz..." size={50} />
          </Box>
        ) : error ? (
          <AnimatedPage>
            <FadeIn>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="error" gutterBottom>
                  {error}
                </Typography>
                <Button variant="contained" onClick={handleBackToPath} sx={{ mt: 2 }}>
                  Torna indietro
                </Button>
              </Paper>
            </FadeIn>
          </AnimatedPage>
        ) : quizCompleted ? (
          <AnimatedPage transitionType="fade">
            <MainLayout title="Quiz Completato">
              <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
                <FadeIn>
                  <Box textAlign="center" py={4}>
                    <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
                    <Typography variant="h4" gutterBottom>
                      Quiz completato!
                    </Typography>
                    <Typography variant="h5" color="primary" gutterBottom>
                      Hai ottenuto: {result?.score}/{result?.maxScore} punti
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {result?.pointsAwarded !== null && result?.pointsAwarded !== undefined && (
                        <>Hai guadagnato <strong>{result?.pointsAwarded}</strong> punti premio!</>
                      )}
                    </Typography>
                    
                    {/* Messaggio se il quiz era già stato completato */}
                    {result?.already_completed && (
                      <Box sx={{ 
                        mt: 2, 
                        p: 2, 
                        backgroundColor: '#FFF8E1', 
                        borderRadius: 1,
                        border: '1px solid #FFC107'
                      }}>
                        <Typography variant="body1" color="warning.dark">
                          <InfoIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                          {result.message || "Questo quiz era già stato completato in precedenza."}
                        </Typography>
                      </Box>
                    )}
                    
                    <SlideInUp delay={0.4}>
                      <Box display="flex" justifyContent="center" mt={4} gap={2}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleBackToPath}
                        >
                          Torna alla Dashboard
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => navigate('/student/paths')}
                        >
                          Visualizza Percorsi
                        </Button>
                      </Box>
                    </SlideInUp>
                  </Box>
                </FadeIn>
              </Box>
            </MainLayout>
          </AnimatedPage>
        ) : quiz ? (
          <>
            <FadeIn>
              <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box>
                    <Typography variant="h5" component="h1" gutterBottom>
                      {quiz.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {quiz.description}
                    </Typography>
                  </Box>
                  
                  {remainingTime !== null && (
                    <Box display="flex" alignItems="center" sx={{ 
                      p: 1, 
                      borderRadius: 2,
                      bgcolor: timeWarning ? 'error.light' : 'primary.light',
                      color: timeWarning ? 'error.contrastText' : 'primary.contrastText'
                    }}>
                      <AccessTimeIcon sx={{ mr: 1 }} />
                      <Typography>
                        {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')}
                      </Typography>
                    </Box>
                  )}
                </Box>
                
                <Stepper activeStep={activeStep} alternativeLabel sx={{ mt: 3, mb: 3 }}>
                  {quiz.questions.map((_, index) => (
                    <Step key={index}>
                      <StepLabel>{`Domanda ${index + 1}`}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Paper>
            </FadeIn>
            
            {quiz.questions.length > 0 && (
              <SlideInRight key={activeStep}>
                <Paper elevation={3} sx={{ p: 3 }}>
                  <Box mb={3}>
                    <Typography variant="h6" gutterBottom>
                      Domanda {activeStep + 1} di {quiz.questions.length}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {quiz.questions[activeStep].text}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Valore: {quiz.questions[activeStep].points} {quiz.questions[activeStep].points === 1 ? 'punto' : 'punti'}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ mb: 3 }} />
                  
                  <Box mb={4}>
                    {/* Domande a scelta singola */}
                    {quiz.questions[activeStep].type === 'single_choice' && (
                      <FormControl component="fieldset" fullWidth>
                        <RadioGroup
                          name={`question-${quiz.questions[activeStep].id}`}
                          value={answers[quiz.questions[activeStep].id] || ''}
                          onChange={handleOptionChange}
                        >
                          {/* Usa un Box per avvolgere gli elementi singolarmente */}
                          <Box>
                            {quiz.questions[activeStep].options?.map((option) => (
                              <HoverAnimation key={option.id}>
                                <FormControlLabel
                                  value={option.id}
                                  control={<Radio />}
                                  label={option.text}
                                  sx={{ 
                                    mb: 1,
                                    p: 1,
                                    borderRadius: 1,
                                    width: '100%',
                                    '&:hover': {
                                      bgcolor: 'action.hover',
                                    }
                                  }}
                                />
                              </HoverAnimation>
                            ))}
                          </Box>
                        </RadioGroup>
                      </FormControl>
                    )}
                    
                    {/* Domande a scelta multipla */}
                    {quiz.questions[activeStep].type === 'multiple_choice' && (
                      <FormControl component="fieldset" fullWidth>
                        <FormGroup>
                          {quiz.questions[activeStep].options?.map((option) => (
                            <HoverAnimation key={option.id}>
                              <FormControlLabel
                                control={
                                  <Checkbox 
                                    checked={multipleChoiceAnswers[quiz.questions[activeStep].id]?.includes(option.id) || false}
                                    onChange={(e) => handleMultipleChoiceChange(quiz.questions[activeStep].id, option.id, e.target.checked)}
                                  />
                                }
                                label={option.text}
                                sx={{ 
                                  mb: 1,
                                  p: 1,
                                  borderRadius: 1,
                                  width: '100%',
                                  '&:hover': {
                                    bgcolor: 'action.hover',
                                  }
                                }}
                              />
                            </HoverAnimation>
                          ))}
                        </FormGroup>
                      </FormControl>
                    )}
                    
                    {/* Domande vero/falso */}
                    {quiz.questions[activeStep].type === 'true_false' && (
                      <FormControl component="fieldset" fullWidth>
                        <RadioGroup
                          name={`question-${quiz.questions[activeStep].id}`}
                          value={answers[quiz.questions[activeStep].id] || ''}
                          onChange={handleOptionChange}
                        >
                          {/* Usa un Box per avvolgere gli elementi singolarmente */}
                          <Box>
                            {quiz.questions[activeStep].options?.map((option) => (
                              <HoverAnimation key={option.id}>
                                <FormControlLabel
                                  value={option.id}
                                  control={<Radio />}
                                  label={option.text}
                                  sx={{ 
                                    mb: 1,
                                    p: 1,
                                    borderRadius: 1,
                                    width: '100%',
                                    '&:hover': {
                                      bgcolor: 'action.hover',
                                    }
                                  }}
                                />
                              </HoverAnimation>
                            ))}
                          </Box>
                        </RadioGroup>
                      </FormControl>
                    )}
                    
                    {/* Domande a risposta testuale o numerica */}
                    {(quiz.questions[activeStep].type === 'text' || quiz.questions[activeStep].type === 'numeric') && (
                      <TextField
                        fullWidth
                        multiline={quiz.questions[activeStep].type === 'text'}
                        rows={quiz.questions[activeStep].type === 'text' ? 4 : 1}
                        label="La tua risposta"
                        value={textAnswers[quiz.questions[activeStep].id] || ''}
                        onChange={(e) => handleTextChange(quiz.questions[activeStep].id, e.target.value)}
                        variant="outlined"
                        type={quiz.questions[activeStep].type === 'numeric' ? 'number' : 'text'}
                      />
                    )}
                    
                    {/* Messaggio di fallback per tipi sconosciuti */}
                    {!['multiple_choice', 'single_choice', 'true_false', 'text', 'numeric'].includes(quiz.questions[activeStep].type) && (
                      <Alert severity="warning">
                        Tipo di domanda non supportato: {quiz.questions[activeStep].type}. 
                        Contattare l'amministratore.
                      </Alert>
                    )}
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between">
                    <Button
                      variant="outlined"
                      startIcon={<NavigateBeforeIcon />}
                      onClick={handleBack}
                      disabled={activeStep === 0}
                    >
                      Indietro
                    </Button>
                    
                    {activeStep === quiz.questions.length - 1 ? (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setConfirmSubmit(true)}
                      >
                        Completa Quiz
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        endIcon={<NavigateNextIcon />}
                        onClick={handleNext}
                      >
                        Avanti
                      </Button>
                    )}
                  </Box>
                </Paper>
              </SlideInRight>
            )}
          </>
        ) : null}
        
        {/* Dialogo di conferma invio */}
        <Dialog
          open={confirmSubmit}
          onClose={() => setConfirmSubmit(false)}
        >
          <DialogTitle>Conferma Invio</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Sei sicuro di voler inviare le risposte e terminare il quiz?
              {getUnansweredQuestionsCount() > 0 && (
                <Box mt={2}>
                  <Alert severity="warning">
                    Hai {getUnansweredQuestionsCount()} domande a cui non hai risposto.
                  </Alert>
                </Box>
              )}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmSubmit(false)} color="primary">
              Annulla
            </Button>
            <Button onClick={handleSubmitAnswers} color="primary" variant="contained" autoFocus>
              Conferma Invio
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Dialogo di avviso tempo */}
        <Dialog
          open={timeWarning}
          onClose={() => setTimeWarning(false)}
        >
          <DialogTitle>Tempo Quasi Scaduto!</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Hai meno di 2 minuti per completare il quiz!
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTimeWarning(false)} color="primary">
              Continua
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
};

export default TakeQuiz;
