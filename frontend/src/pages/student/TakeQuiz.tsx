import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../../components/layout/MainLayout';
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
import QuizService, { Quiz as ServiceQuiz, QuizResult, QuizAnswer } from '../../services/QuizService';
import NotificationsService from '../../services/NotificationsService';

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

// Interfacce TypeScript
interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'text';
  options?: {
    id: string;
    text: string;
  }[];
  points: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  pathId?: string;
  pathTitle?: string;
  timeLimit?: number; // in minuti
  questions: Question[];
  maxScore: number;
}

const TakeQuiz: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [timeWarning, setTimeWarning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<Date>(new Date());

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId) {
        setError("ID quiz non valido");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Recupero dei dati del quiz dal servizio
        const quizData = await QuizService.getQuiz(quizId);
        
        // Trasformazione del formato dati dal servizio al formato usato dal componente
        const formattedQuiz: Quiz = {
          id: quizData.id,
          title: quizData.title,
          description: quizData.description,
          questions: quizData.questions.map(q => ({
            id: q.id,
            text: q.text,
            type: q.options ? 'multiple_choice' : 'text',
            options: q.options?.map(opt => ({
              id: opt.id,
              text: opt.text
            })),
            points: q.points
          })),
          maxScore: quizData.maxScore,
          timeLimit: quizData.questions.reduce((total, q) => total + (q.timeLimit || 0), 0) / 60 || 10, // Convertito in minuti
        };
        
        setQuiz(formattedQuiz);
        
        // Imposta il timer
        if (formattedQuiz.timeLimit) {
          setRemainingTime(formattedQuiz.timeLimit * 60); // converti in secondi
        }
        
        // Avvia il quiz sul server
        await QuizService.startQuiz(quizId);
        setStartTime(new Date());
        setQuestionStartTime(new Date());
        
      } catch (err) {
        console.error('Errore nel caricamento del quiz:', err);
        setError('Impossibile caricare il quiz. Riprova più tardi.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  // Timer countdown
  useEffect(() => {
    if (remainingTime === null || quizCompleted) return;

    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev === null) return null;
        
        if (prev <= 0) {
          clearInterval(timer);
          handleSubmitQuiz();
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

  const handleSubmitQuiz = async () => {
    setConfirmSubmit(false);
    
    if (!quiz || !quizId) return;
    
    try {
      setLoading(true);

      // Calcola il tempo trascorso sull'ultima domanda
      const currentQuestion = quiz.questions[activeStep];
      const endTime = new Date();
      const finalTimeSpent = Math.floor((endTime.getTime() - questionStartTime.getTime()) / 1000);
      
      // Prepara le risposte da inviare
      const quizAnswers: QuizAnswer[] = Object.entries(answers).map(([questionId, optionId]) => ({
        questionId,
        selectedOptionId: optionId,
        timeSpent: finalTimeSpent // Idealmente dovremmo tracciare il tempo per ogni domanda
      }));
      
      // Aggiungiamo le risposte testuali (il backend dovrà gestirle in modo diverso)
      Object.entries(textAnswers).forEach(([questionId, textAnswer]) => {
        quizAnswers.push({
          questionId,
          selectedOptionId: textAnswer, // Nel caso di risposta testuale, usiamo il testo come ID
          timeSpent: finalTimeSpent
        });
      });
      
      // Invia le risposte al server
      const result = await QuizService.submitQuiz({
        quizId,
        answers: quizAnswers
      });
      
      // Aggiorna lo stato con i risultati
      setScore(result.score);
      setEarnedPoints(result.score);
      setQuizCompleted(true);
      
    } catch (err) {
      console.error('Errore durante l\'invio del quiz:', err);
      setError('Impossibile inviare il quiz. Riprova più tardi.');
    } finally {
      setLoading(false);
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

  if (quizCompleted) {
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
                  Hai ottenuto: {score} / {quiz?.maxScore} punti
                </Typography>
                <Typography variant="body1" paragraph>
                  {earnedPoints !== null && (
                    <>Hai guadagnato <strong>{earnedPoints}</strong> punti premio!</>
                  )}
                </Typography>
                
                <SlideInUp delay={0.4}>
                  <Box display="flex" justifyContent="center" mt={4} gap={2}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => navigate('/student')}
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
    <AnimatedPage transitionType="fade">
      <MainLayout title={quiz?.title || 'Quiz'}>
        <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
          {loading ? (
            <FadeIn>
              <Box display="flex" justifyContent="center" alignItems="center" height="50vh" flexDirection="column">
                <LoadingIndicator text="Caricamento quiz..." />
                <Typography variant="body1" sx={{ mt: 2 }}>
                  Preparazione delle domande in corso...
                </Typography>
              </Box>
            </FadeIn>
          ) : error ? (
            <SlideInUp>
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
              <Button variant="contained" onClick={() => navigate(-1)}>
                Torna indietro
              </Button>
            </SlideInUp>
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
                            <AnimatedList>
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
                            </AnimatedList>
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
              <Button onClick={handleSubmitQuiz} color="primary" variant="contained" autoFocus>
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
    </AnimatedPage>
  );
};

export default TakeQuiz;
