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
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import StarsIcon from '@mui/icons-material/Stars';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Interfacce TypeScript
interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'text';
  options?: {
    id: string;
    text: string;
  }[];
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  pathId: string;
  pathTitle: string;
  timeLimit?: number; // in minuti
  questions: Question[];
}

const TakeQuiz: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [timeWarning, setTimeWarning] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        // In un'implementazione reale, questa sarebbe una chiamata API
        // Per ora utilizziamo dati di esempio
        setTimeout(() => {
          const mockQuiz: Quiz = {
            id: quizId || '1',
            title: 'Addizione e Sottrazione',
            description: 'Quiz sulle operazioni base di addizione e sottrazione',
            pathId: '1',
            pathTitle: 'Matematica Base',
            timeLimit: 10, // 10 minuti
            questions: [
              {
                id: '1',
                text: 'Quanto fa 5 + 3?',
                type: 'multiple_choice',
                options: [
                  { id: 'a', text: '7' },
                  { id: 'b', text: '8' },
                  { id: 'c', text: '9' },
                  { id: 'd', text: '10' },
                ],
              },
              {
                id: '2',
                text: 'Quanto fa 10 - 4?',
                type: 'multiple_choice',
                options: [
                  { id: 'a', text: '4' },
                  { id: 'b', text: '5' },
                  { id: 'c', text: '6' },
                  { id: 'd', text: '7' },
                ],
              },
              {
                id: '3',
                text: 'Quanto fa 7 + 5?',
                type: 'multiple_choice',
                options: [
                  { id: 'a', text: '10' },
                  { id: 'b', text: '11' },
                  { id: 'c', text: '12' },
                  { id: 'd', text: '13' },
                ],
              },
              {
                id: '4',
                text: 'Quanto fa 15 - 7?',
                type: 'multiple_choice',
                options: [
                  { id: 'a', text: '6' },
                  { id: 'b', text: '7' },
                  { id: 'c', text: '8' },
                  { id: 'd', text: '9' },
                ],
              },
              {
                id: '5',
                text: 'Spiega con parole tue come si esegue una sottrazione.',
                type: 'text',
              },
            ],
          };
          
          setQuiz(mockQuiz);
          
          // Imposta il timer se esiste un time limit
          if (mockQuiz.timeLimit) {
            setRemainingTime(mockQuiz.timeLimit * 60); // converti in secondi
          }
          
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Errore nel caricamento del quiz:', error);
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
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmitQuiz = () => {
    // In un'implementazione reale, qui ci sarebbe una chiamata API
    // per inviare le risposte e ricevere il punteggio
    
    // Simuliamo un risultato
    const totalQuestions = quiz?.questions.length || 0;
    const correctAnswers = 4; // Simulato
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const points = Math.round((percentage / 100) * 50); // 50 punti massimi per quiz
    
    setScore(percentage);
    setEarnedPoints(points);
    setQuizCompleted(true);
    
    // Chiudi il dialog di conferma se aperto
    setConfirmSubmit(false);
    setTimeWarning(false);
  };

  if (loading) {
    return (
      <MainLayout title="Caricamento Quiz...">
        <Box sx={{ width: '100%', mt: 4 }}>
          <LinearProgress />
        </Box>
      </MainLayout>
    );
  }

  if (!quiz) {
    return (
      <MainLayout title="Quiz non trovato">
        <Alert severity="error" sx={{ mt: 4 }}>
          Il quiz richiesto non è stato trovato o non è disponibile.
        </Alert>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }}
          onClick={() => navigate('/student/paths')}
        >
          Torna ai percorsi
        </Button>
      </MainLayout>
    );
  }

  // Se il quiz è completato mostra il risultato
  if (quizCompleted && score !== null && earnedPoints !== null) {
    return (
      <MainLayout title="Quiz Completato">
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          textAlign: 'center',
          py: 4 
        }}>
          <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Quiz Completato!
          </Typography>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            {quiz.title}
          </Typography>
          
          <Box sx={{ width: '100%', maxWidth: 600, mt: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="text.secondary">
                      Punteggio
                    </Typography>
                    <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>
                      {score}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6">
                      Punti Guadagnati
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <StarsIcon sx={{ mr: 1 }} /> {earnedPoints}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 4 }}>
              <Typography variant="body1" paragraph>
                Grazie per aver completato questo quiz! I punti sono stati aggiunti al tuo profilo.
              </Typography>
              
              <Button 
                variant="contained" 
                color="primary"
                size="large"
                onClick={() => navigate(`/student/paths/${quiz.pathId}`)}
                sx={{ mr: 2 }}
              >
                Torna al percorso
              </Button>
              
              <Button 
                variant="outlined" 
                onClick={() => navigate('/student')}
              >
                Dashboard
              </Button>
            </Box>
          </Box>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={`Quiz: ${quiz.title}`}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {quiz.title}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" color="text.secondary">
            Da: {quiz.pathTitle}
          </Typography>
          {remainingTime !== null && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              color: remainingTime < 120 ? 'error.main' : 'text.secondary'
            }}>
              <AccessTimeIcon sx={{ mr: 1 }} />
              <Typography variant="subtitle1" fontWeight="bold">
                Tempo: {formatTime(remainingTime)}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {quiz.questions.map((question, index) => (
            <Step key={question.id}>
              <StepLabel>Domanda {index + 1}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Paper sx={{ p: 4, borderRadius: 2 }}>
        {activeStep < quiz.questions.length && (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Domanda {activeStep + 1} di {quiz.questions.length}
              </Typography>
              <Divider />
            </Box>
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom>
                {quiz.questions[activeStep].text}
              </Typography>
              
              {quiz.questions[activeStep].type === 'multiple_choice' && (
                <FormControl component="fieldset" sx={{ width: '100%', mt: 2 }}>
                  <RadioGroup
                    value={answers[quiz.questions[activeStep].id] || ''}
                    onChange={(e) => handleAnswerChange(quiz.questions[activeStep].id, e.target.value)}
                  >
                    {quiz.questions[activeStep].options?.map((option) => (
                      <FormControlLabel
                        key={option.id}
                        value={option.id}
                        control={<Radio />}
                        label={option.text}
                        sx={{ 
                          mb: 1,
                          p: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          width: '100%',
                          '&:hover': {
                            bgcolor: 'action.hover',
                          }
                        }}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              )}
              
              {quiz.questions[activeStep].type === 'text' && (
                <TextField
                  multiline
                  rows={4}
                  fullWidth
                  placeholder="Scrivi la tua risposta qui..."
                  value={answers[quiz.questions[activeStep].id] || ''}
                  onChange={(e) => handleAnswerChange(quiz.questions[activeStep].id, e.target.value)}
                  variant="outlined"
                  sx={{ mt: 2 }}
                />
              )}
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
              <Button
                variant="outlined"
                onClick={handleBack}
                startIcon={<NavigateBeforeIcon />}
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
                  Termina il quiz
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<NavigateNextIcon />}
                  disabled={!answers[quiz.questions[activeStep].id]}
                >
                  Avanti
                </Button>
              )}
            </Box>
          </>
        )}
      </Paper>

      {/* Dialog di conferma per l'invio del quiz */}
      <Dialog
        open={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
      >
        <DialogTitle>Conferma invio</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Sei sicuro di voler terminare e inviare il quiz? 
            {
              Object.keys(answers).length < quiz.questions.length && 
              ` Nota: hai risposto a ${Object.keys(answers).length} domande su ${quiz.questions.length}.`
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmSubmit(false)} color="primary">
            Annulla
          </Button>
          <Button onClick={handleSubmitQuiz} color="primary" variant="contained">
            Conferma invio
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog di avviso per il tempo che sta scadendo */}
      <Dialog
        open={timeWarning}
        onClose={() => setTimeWarning(false)}
      >
        <DialogTitle sx={{ color: 'warning.main' }}>Attenzione: tempo quasi scaduto!</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Hai meno di 2 minuti per completare il quiz. Assicurati di inviare le tue risposte prima della scadenza del tempo.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTimeWarning(false)} color="primary" variant="contained">
            Ho capito
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
};

export default TakeQuiz;
