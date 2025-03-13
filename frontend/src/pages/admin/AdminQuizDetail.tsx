import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Divider,
  IconButton,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Radio,
  Checkbox,
  FormGroup,
  FormControlLabel,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  QuestionMark as QuestionMarkIcon,
  Timer as TimerIcon,
  Score as ScoreIcon,
  Subject as SubjectIcon,
  Public as PublicIcon,
  FitnessCenter as DifficultyIcon,
} from '@mui/icons-material';
import MainLayout from '../../components/layout/MainLayout';
import QuizService, { QuizTemplate, Question } from '../../services/QuizService';
import { NotificationsService } from '../../services/NotificationsService';
import { AnimatedPage } from '../../components/animations/PageTransitions';
import { FadeIn, SlideInUp } from '../../components/animations/Transitions';
import { SuccessConfetti } from '../../components/animations/Celebrations';

const AdminQuizDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Stati
  const [quizTemplate, setQuizTemplate] = useState<QuizTemplate | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);

  // Recupero dei dati del quiz
  useEffect(() => {
    const fetchQuizTemplate = async () => {
      if (!id) {
        setError('ID quiz non valido');
        setLoading(false);
        return;
      }

      try {
        const data = await QuizService.getQuizTemplateById(id);
        setQuizTemplate(data);
        
        // Mostra coriandoli se il quiz è stato creato di recente (ultimi 5 secondi)
        if (data.createdAt) {
          const createdAt = new Date(data.createdAt);
          const now = new Date();
          if (now.getTime() - createdAt.getTime() < 5000) {
            setShowConfetti(true);
            // Nascondi i coriandoli dopo 3 secondi
            setTimeout(() => setShowConfetti(false), 3000);
          }
        }
      } catch (error) {
        console.error('Errore nel recupero del template del quiz:', error);
        setError('Errore nel recupero del template del quiz');
        NotificationsService.error('Errore nel recupero del template del quiz');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizTemplate();
  }, [id]);

  // Eliminazione del quiz
  const handleDelete = async () => {
    if (!id || !window.confirm('Sei sicuro di voler eliminare questo template quiz? Questa operazione non può essere annullata.')) {
      return;
    }

    setDeleting(true);
    try {
      await QuizService.deleteQuizTemplate(id);
      NotificationsService.success('Template quiz eliminato con successo');
      navigate('/admin/quizzes');
    } catch (error) {
      console.error('Errore durante l\'eliminazione del template:', error);
      NotificationsService.error('Errore durante l\'eliminazione del template');
    } finally {
      setDeleting(false);
    }
  };

  // Ottieni il nome della difficoltà
  const getDifficultyName = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy':
        return 'Facile';
      case 'medium':
        return 'Media';
      case 'hard':
        return 'Difficile';
      default:
        return difficulty;
    }
  };

  // Ottieni il nome del tipo di domanda
  const getQuestionTypeName = (type: string): string => {
    switch (type) {
      case 'single_choice':
        return 'Scelta singola';
      case 'multiple_choice':
        return 'Scelta multipla';
      case 'true_false':
        return 'Vero/Falso';
      case 'numeric':
        return 'Risposta numerica';
      default:
        return type;
    }
  };

  // Calcola il punteggio totale possibile
  const calculateTotalScore = (questions: Question[]): number => {
    return questions.reduce((total, question) => total + (question.score || 0), 0);
  };

  if (loading) {
    return (
      <MainLayout title="Dettagli Template Quiz">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (error || !quizTemplate) {
    return (
      <MainLayout title="Errore">
        <Box p={3}>
          <Alert severity="error">
            {error || 'Template quiz non trovato'}
          </Alert>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/admin/quizzes')}
            sx={{ mt: 2 }}
          >
            Torna alla lista
          </Button>
        </Box>
      </MainLayout>
    );
  }

  return (
    <AnimatedPage transitionType="fade">
      <MainLayout title={`Quiz: ${quizTemplate.title}`}>
        {showConfetti && <SuccessConfetti />}
        
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
              Dettagli Template Quiz
            </Typography>
            <Box flexGrow={1} />
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/admin/quizzes/${id}/edit`)}
              sx={{ mr: 2 }}
            >
              Modifica
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={deleting ? <CircularProgress size={20} color="error" /> : <DeleteIcon />}
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Eliminazione...' : 'Elimina'}
            </Button>
          </Box>

          <FadeIn>
            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Typography variant="h4" gutterBottom>
                    {quizTemplate.title}
                    {quizTemplate.isPublic && (
                      <Chip 
                        label="Pubblico" 
                        color="success" 
                        size="small"
                        icon={<PublicIcon />}
                        sx={{ ml: 2, verticalAlign: 'middle' }}
                      />
                    )}
                  </Typography>
                  
                  {quizTemplate.description && (
                    <Typography variant="body1" paragraph>
                      {quizTemplate.description}
                    </Typography>
                  )}
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <List dense>
                        <ListItem>
                          <ListItemIcon>
                            <SubjectIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Materia"
                            secondary={quizTemplate.subject}
                          />
                        </ListItem>
                        
                        <ListItem>
                          <ListItemIcon>
                            <DifficultyIcon color="warning" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Difficoltà"
                            secondary={getDifficultyName(quizTemplate.difficultyLevel)}
                          />
                        </ListItem>
                        
                        <ListItem>
                          <ListItemIcon>
                            <TimerIcon color="info" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Tempo limite"
                            secondary={`${quizTemplate.timeLimit} minuti`}
                          />
                        </ListItem>
                        
                        <ListItem>
                          <ListItemIcon>
                            <ScoreIcon color="success" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Punteggio di superamento"
                            secondary={`${quizTemplate.passingScore}%`}
                          />
                        </ListItem>
                        
                        <ListItem>
                          <ListItemIcon>
                            <QuestionMarkIcon color="secondary" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Numero di domande"
                            secondary={quizTemplate.questions.length}
                          />
                        </ListItem>
                        
                        <ListItem>
                          <ListItemIcon>
                            <ScoreIcon color="error" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Punteggio totale"
                            secondary={`${calculateTotalScore(quizTemplate.questions)} punti`}
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </FadeIn>

          <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
            Domande
          </Typography>

          {quizTemplate.questions.length === 0 ? (
            <Alert severity="info">
              Questo quiz non contiene ancora domande.
            </Alert>
          ) : (
            quizTemplate.questions.map((question, questionIndex) => (
              <SlideInUp key={question.id || questionIndex} delay={0.1 * questionIndex}>
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Domanda {questionIndex + 1}
                    </Typography>
                    <Box>
                      <Chip 
                        label={getQuestionTypeName(question.type)}
                        color="primary"
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Chip 
                        label={`${question.score} punto/i`}
                        color="secondary"
                        size="small"
                      />
                    </Box>
                  </Box>
                  
                  <Typography variant="body1" paragraph>
                    {question.text}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  {/* Opzioni per domande a scelta singola, multipla e vero/falso */}
                  {question.type !== 'numeric' && question.options && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        Opzioni di risposta:
                      </Typography>
                      
                      <FormGroup>
                        {question.options.map((option, optionIndex) => (
                          <FormControlLabel
                            key={option.id || optionIndex}
                            control={
                              question.type === 'multiple_choice' ? (
                                <Checkbox 
                                  checked={option.isCorrect} 
                                  disabled 
                                  color="success"
                                />
                              ) : (
                                <Radio 
                                  checked={option.isCorrect} 
                                  disabled 
                                  color="success"
                                />
                              )
                            }
                            label={
                              <Box display="flex" alignItems="center">
                                <Typography>
                                  {option.text}
                                </Typography>
                                {option.isCorrect && (
                                  <Chip
                                    icon={<CheckCircleIcon />}
                                    label="Corretta"
                                    color="success"
                                    size="small"
                                    sx={{ ml: 2 }}
                                  />
                                )}
                              </Box>
                            }
                          />
                        ))}
                      </FormGroup>
                    </Box>
                  )}
                  
                  {/* Risposta numerica */}
                  {question.type === 'numeric' && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        Risposta numerica attesa: {question.correctAnswer}
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Spiegazione */}
                  {question.explanation && (
                    <Box mt={2} p={2} bgcolor="rgba(0, 0, 0, 0.03)" borderRadius={1}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Spiegazione:
                      </Typography>
                      <Typography variant="body2">
                        {question.explanation}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </SlideInUp>
            ))
          )}
          
          <Box display="flex" justifyContent="flex-start" mt={3} mb={2}>
            <Button
              variant="contained"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/admin/quizzes')}
            >
              Torna alla lista
            </Button>
          </Box>
        </Box>
      </MainLayout>
    </AnimatedPage>
  );
};

export default AdminQuizDetail;
