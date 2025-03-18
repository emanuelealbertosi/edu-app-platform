import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import StarsIcon from '@mui/icons-material/Stars';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import QuizService, { Quiz, QuizResult, Question } from '../../services/QuizService';
import { NotificationsService } from '../../services/NotificationsService';

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
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
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

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if quizId is defined
        if (!quizId) {
          setError('ID del quiz mancante');
          setLoading(false);
          return;
        }
        
        console.log(`[DEBUG TakeQuiz] Starting to load quiz ID=${quizId} pathId=${pathId || 'none'}`);
        
        let quizData;
        
        // Se il quiz è stato avviato da un percorso, carica l'istanza specifica
        if (pathId) {
          console.log(`[DEBUG TakeQuiz] Loading quiz ${quizId} from path ${pathId}`);
          try {
            // IMPORTANT: Log the API request explicitly to help trace any issues
            console.log(`[DEBUG TakeQuiz] Calling QuizService.getPathQuiz(${pathId}, ${quizId})`);
            quizData = await QuizService.getPathQuiz(pathId, quizId);
            console.log(`[DEBUG TakeQuiz] Successfully loaded quiz from path:`, {
              id: quizData.id,
              templateId: quizData.templateId,
              title: quizData.title,
              questionCount: quizData.questions?.length || 0,
              firstQuestionText: quizData.questions?.[0]?.text?.substring(0, 30) + '...' || 'No questions'
            });
            
            // Verify we have questions
            if (!quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
              console.error(`[DEBUG TakeQuiz] Quiz loaded from path has no questions. Attempting fallback...`);
              throw new Error('Quiz loaded from path has no questions');
            }
          } catch (pathError) {
            console.error('[DEBUG TakeQuiz] Error loading quiz from path:', pathError);
            
            // Fallback: try loading the quiz as a template
            console.log('[DEBUG TakeQuiz] Attempting fallback with template quiz');
            try {
              console.log(`[DEBUG TakeQuiz] Calling QuizService.getQuizTemplateById(${quizId})`);
              quizData = await QuizService.getQuizTemplateById(quizId);
              console.log(`[DEBUG TakeQuiz] Successfully loaded quiz template:`, {
                id: quizData.id,
                title: quizData.title,
                questionCount: quizData.questions?.length || 0,
                firstQuestionText: quizData.questions?.[0]?.text?.substring(0, 30) + '...' || 'No questions'
              });
              
              // Adapt the template format to the quiz format
              if (quizData) {
                quizData = {
                  id: quizData.id,
                  templateId: quizData.id,
                  title: quizData.title,
                  description: quizData.description,
                  isCompleted: false,
                  score: 0,
                  maxScore: (quizData.questions.reduce((sum: number, q: Question) => sum + (q.points || 1), 0) as number),
                  questions: quizData.questions,
                  timeLimit: quizData.timeLimit,
                  pathId: pathId
                };
              }
            } catch (templateError) {
              console.error('[DEBUG TakeQuiz] Error loading quiz template:', templateError);
              throw new Error('Failed to load quiz: both path quiz and template approaches failed');
            }
          }
          
          // Add path info to the quiz
          if (quizData) {
            quizData.pathId = pathId;
          }
        } else {
          // Load the normal quiz (template)
          console.log(`[DEBUG TakeQuiz] Loading template quiz ${quizId}`);
          quizData = await QuizService.getQuiz(quizId);
          console.log(`[DEBUG TakeQuiz] Successfully loaded standard quiz:`, {
            id: quizData.id,
            templateId: quizData.templateId,
            title: quizData.title,
            questionCount: quizData.questions?.length || 0,
            firstQuestionText: quizData.questions?.[0]?.text?.substring(0, 30) + '...' || 'No questions'
          });
        }
        
        if (quizData) {
          console.log('[DEBUG TakeQuiz] Quiz data loaded. Details:', {
            id: quizData.id,
            templateId: quizData.templateId,
            title: quizData.title,
            questionCount: quizData.questions?.length || 0
          });
          
          // Verify we have questions before setting the quiz
          if (!quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
            console.error(`[DEBUG TakeQuiz] Quiz has no questions`);
            setError('Il quiz non contiene domande. Contatta l\'amministratore del sistema.');
            setLoading(false);
            return;
          }
          
          // Normalize the quiz according to frontend conventions
          setQuiz({
            id: quizData.id,
            title: quizData.title || 'Quiz senza titolo',
            description: quizData.description || 'Nessuna descrizione disponibile',
            pathId: quizData.pathId || pathId || '',
            pathTitle: quizData.pathTitle,
            timeLimit: quizData.timeLimit || 0,
            questions: quizData.questions || [],
            maxScore: quizData.maxScore || (quizData.questions?.reduce((sum: number, q: Question) => sum + (q.points || 1), 0) as number) || 0,
            templateId: quizData.templateId || '',
            studentId: quizData.studentId || '',
            isCompleted: quizData.isCompleted || false,
            score: quizData.score || 0
          });
          
          // Set the timer if there's a time limit
          if (quizData.timeLimit && quizData.timeLimit > 0) {
            setRemainingTime(quizData.timeLimit * 60); // convert to seconds
            setStartTime(new Date());
          }
        }
      } catch (err) {
        console.error('[DEBUG TakeQuiz] Error during quiz loading:', err);
        setError('Si è verificato un errore durante il caricamento del quiz. Riprova più tardi.');
        NotificationsService.error(
          'Non è stato possibile caricare il quiz',
          'Errore di caricamento'
        );
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
      
      console.log('Preparazione invio risposte:', answers);
      
      // Preparazione dei dati per l'invio
      const submission: QuizSubmission = {
        answers: Object.entries(answers).map(([questionId, answer]) => {
          // Determiniamo il tipo di domanda per sapere come formattare la risposta
          const question = quiz.questions.find(q => q.id === questionId);
          
          if (question && (question.type === 'text' || question.type === 'numeric')) {
            return {
              questionId,
              textAnswer: typeof answer === 'string' ? answer : 
                         Array.isArray(answer) && answer.length > 0 ? answer[0] : ''
            };
          } else {
            return {
              questionId,
              selectedOptionId: typeof answer === 'string' ? answer : 
                              Array.isArray(answer) && answer.length > 0 ? answer[0] : ''
            };
          }
        }),
        timeSpent: Math.floor((new Date().getTime() - startTime!.getTime()) / 1000) // Tempo impiegato in secondi
      };

      console.log('Invio risposte:', submission);
      
      let result;
      
      // Se il quiz è stato avviato in un percorso, usa l'endpoint specifico per i percorsi
      if (pathId && quiz.pathId) {
        console.log(`Invio risposte al quiz ${quiz.id} nel percorso ${pathId}`);
        try {
          result = await QuizService.submitPathQuiz(pathId, quiz.id, submission);
        } catch (pathError) {
          console.error('Errore invio risposte al percorso:', pathError);
          
          // Fallback: prova con l'endpoint standard
          console.log('Tentativo invio con endpoint standard');
          result = await QuizService.submitQuiz(quiz.id, submission);
        }
      } else {
        console.log(`Invio risposte al quiz standard ${quiz.id}`);
        result = await QuizService.submitQuiz(quiz.id, submission);
      }
      
      console.log('Risultato sottomissione:', result);
      
      // Aggiorna il risultato nella UI
      setResult(result);
      setCompleted(true);
      
      // Messaggio di successo
      NotificationsService.success(
        `Quiz completato con successo! Punteggio: ${result.score}/${result.maxScore}`,
        'Quiz Completato'
      );
      
      // Reindirizzamento dopo un breve ritardo per mostrare il risultato
      setTimeout(() => {
        if (pathId) {
          // Torna alla pagina del percorso
          navigate(`/student/paths/${pathId}`);
        } else {
          // Torna all'elenco dei quiz
          navigate('/student/quizzes');
        }
      }, 5000);
    } catch (error) {
      console.error('Errore durante l\'invio delle risposte:', error);
      
      NotificationsService.error(
        'Si è verificato un errore durante l\'invio delle risposte',
        'Errore'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Gestisce il cambio di opzione nelle domande a scelta multipla
  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleAnswerChange(quiz!.questions[activeStep].id, e.target.value);
  };

  // Gestisce il cambio del testo nelle domande aperte
  const handleTextChange = (questionId: string, value: string) => {
    handleTextAnswerChange(questionId, value);
  };

  // Calcola il numero di domande senza risposta
  const getUnansweredQuestionsCount = (): number => {
    if (!quiz) return 0;
    
    return quiz.questions.reduce((count, question) => {
      if (question.type === 'multiple_choice' && !answers[question.id]) {
        return count + 1;
      } else if (question.type === 'text' && (!textAnswers[question.id] || textAnswers[question.id].trim() === '')) {
        return count + 1;
      }
      return count;
    }, 0);
  };

  // Handle navigating back to the path detail or quiz list
  const handleBackToPath = () => {
    if (pathId) {
      navigate(`/student/path/${pathId}`);
    } else {
      navigate('/student/quizzes');
    }
  };

  if (loading && !quiz) {
    return (
      <AnimatedPage transitionType="fade">
        <MainLayout title="Svolgimento Quiz">
          <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
            <FadeIn>
              <Box display="flex" justifyContent="center" alignItems="center" height="50vh" flexDirection="column">
                <LoadingIndicator text="Caricamento quiz..." />
                <Typography variant="body1" sx={{ mt: 2 }}>
                  Preparazione delle domande in corso...
                </Typography>
              </Box>
            </FadeIn>
          </Box>
        </MainLayout>
      </AnimatedPage>
    );
  }

  if (error) {
    return (
      <AnimatedPage transitionType="fade">
        <MainLayout title="Svolgimento Quiz">
          <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
            <SlideInUp>
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
              <Button variant="contained" onClick={() => navigate(-1)}>
                Torna indietro
              </Button>
            </SlideInUp>
          </Box>
        </MainLayout>
      </AnimatedPage>
    );
  }

  if (completed) {
    return (
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
    <MainLayout title="Quiz">
      <Box sx={{ p: 3, position: 'relative' }}>
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
                    {quiz.questions[activeStep].type === 'multiple_choice' ? (
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
                    ) : (
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="La tua risposta"
                        value={textAnswers[quiz.questions[activeStep].id] || ''}
                        onChange={(e) => handleTextChange(quiz.questions[activeStep].id, e.target.value)}
                        variant="outlined"
                      />
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
