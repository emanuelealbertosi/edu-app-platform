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

  if (loading && !quiz) {
    return (
      <MainLayout title="Svolgimento Quiz">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Svolgimento Quiz">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <Alert severity="error">{error}</Alert>
        </Box>
      </MainLayout>
    );
  }

  if (!quiz) {
    return (
      <MainLayout title="Svolgimento Quiz">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <Alert severity="error">Quiz non trovato</Alert>
        </Box>
      </MainLayout>
    );
  }

  if (quizCompleted) {
    return (
      <MainLayout title="Quiz Completato">
        <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto', my: 4, borderRadius: 2 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 60 }} />
            <Typography variant="h4" sx={{ mt: 2 }}>
              Quiz Completato!
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Hai completato con successo il quiz "{quiz.title}"
            </Typography>
          </Box>

          <Box sx={{ mb: 4, p: 3, bgcolor: 'primary.light', color: 'white', borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6} sx={{ textAlign: 'center' }}>
                <Typography variant="h6">Il tuo punteggio</Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <StarsIcon sx={{ mr: 1 }} />
                  {score}/{quiz.maxScore}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6} sx={{ textAlign: 'center' }}>
                <Typography variant="h6">Punti guadagnati</Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                  +{earnedPoints}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 4 }}>
            <Button 
              variant="outlined" 
              size="large"
              onClick={() => navigate('/student/dashboard')}
            >
              Dashboard
            </Button>
            <Button 
              variant="contained" 
              size="large"
              onClick={() => navigate('/student/quizzes')}
            >
              Torna ai Quiz
            </Button>
          </Box>
        </Paper>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Svolgimento Quiz">
      <Paper elevation={3} sx={{ p: 3, maxWidth: 800, mx: 'auto', my: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            {quiz.title}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            {quiz.description}
          </Typography>
          
          {remainingTime !== null && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <AccessTimeIcon color="action" sx={{ mr: 1 }} />
              <Typography variant="body2" color={remainingTime < 300 ? 'error' : 'text.secondary'}>
                Tempo rimanente: {formatTime(remainingTime)}
              </Typography>
            </Box>
          )}
          
          <LinearProgress 
            variant="determinate" 
            value={(activeStep / quiz.questions.length) * 100} 
            sx={{ mt: 2, height: 8, borderRadius: 4 }}
          />
        </Box>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {quiz.questions.map((question, index) => (
            <Step key={question.id}>
              <StepLabel>{`Domanda ${index + 1}`}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mb: 4 }}>
          {activeStep < quiz.questions.length ? (
            <Box>
              <FormControl component="fieldset" sx={{ width: '100%' }}>
                <FormLabel component="legend" sx={{ mb: 2 }}>
                  <Typography variant="h6">
                    {quiz.questions[activeStep].text}
                  </Typography>
                </FormLabel>
                
                {quiz.questions[activeStep].type === 'multiple_choice' && quiz.questions[activeStep].options ? (
                  <RadioGroup
                    value={answers[quiz.questions[activeStep].id] || ''}
                    onChange={(e) => handleAnswerChange(quiz.questions[activeStep].id, e.target.value)}
                  >
                    {quiz.questions[activeStep].options.map((option) => (
                      <FormControlLabel
                        key={option.id}
                        value={option.id}
                        control={<Radio />}
                        label={option.text}
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </RadioGroup>
                ) : (
                  <TextField
                    multiline
                    rows={4}
                    fullWidth
                    placeholder="Scrivi la tua risposta qui..."
                    value={textAnswers[quiz.questions[activeStep].id] || ''}
                    onChange={(e) => handleTextAnswerChange(quiz.questions[activeStep].id, e.target.value)}
                  />
                )}
              </FormControl>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Hai risposto a tutte le domande!
              </Typography>
              <Typography variant="body1">
                Puoi rivedere le tue risposte utilizzando i pulsanti di navigazione o inviare il quiz.
              </Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<NavigateBeforeIcon />}
          >
            Precedente
          </Button>
          
          <Box>
            {activeStep === quiz.questions.length - 1 || activeStep === quiz.questions.length ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpenConfirmSubmit}
                disabled={loading}
              >
                Invia quiz
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<NavigateNextIcon />}
                disabled={
                  quiz.questions[activeStep].type === 'multiple_choice' && 
                  !answers[quiz.questions[activeStep].id]
                }
              >
                Successiva
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Dialog conferma invio */}
      <Dialog
        open={confirmSubmit}
        onClose={handleCloseConfirmSubmit}
      >
        <DialogTitle>Conferma invio</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Sei sicuro di voler inviare il quiz? Questa azione non può essere annullata.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmSubmit} color="primary">
            Annulla
          </Button>
          <Button onClick={handleSubmitQuiz} color="primary" variant="contained" autoFocus>
            Invia
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog avviso tempo */}
      <Dialog
        open={timeWarning}
        onClose={handleCloseTimeWarning}
      >
        <DialogTitle>Tempo quasi scaduto!</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Hai ancora 2 minuti per completare il quiz. Dopo questo tempo, il quiz verrà inviato automaticamente.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTimeWarning} color="primary" autoFocus>
            Ho capito
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
};

export default TakeQuiz;
