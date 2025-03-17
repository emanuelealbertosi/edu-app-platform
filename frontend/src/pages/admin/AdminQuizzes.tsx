import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Chip,
  IconButton,
  Divider,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Badge,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  QuestionAnswer as QuestionIcon,
  Timer as TimerIcon,
  Subject as SubjectIcon,
  Public as PublicIcon,
  FitnessCenter as DifficultyIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import MainLayout from '../../components/layout/MainLayout';
import HoverAnimation from '../../components/animations/HoverAnimation';
import { ApiErrorHandler } from '../../services/ApiErrorHandler';
import { NotificationsService } from '../../services/NotificationsService';
import QuizService, { QuizTemplate } from '../../services/QuizService';
import { motion } from 'framer-motion';
import { AnimatedPage } from '../../components/animations/PageTransitions';
import { FadeIn } from '../../components/animations/Transitions';

const AdminQuizzes: React.FC = () => {
  const navigate = useNavigate();
  const [quizTemplates, setQuizTemplates] = useState<QuizTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<QuizTemplate | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizTemplates();
  }, []);

  const fetchQuizTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const templates: QuizTemplate[] = await QuizService.getAllQuizTemplates();
      
      // Debug: analizziamo la struttura dei dati ricevuti dal backend
      console.log('DATI QUIZ RICEVUTI:', templates);
      
      // Debug: mostriamo dettagli sui campi difficultyLevel nei quiz
      templates.forEach((quiz, index) => {
        console.log(`Quiz ${index + 1}: "${quiz.title}" - difficultyLevel:`, 
          quiz.difficultyLevel,
          '- tipo:', typeof quiz.difficultyLevel,
          '- difficultyLevel esiste:', 'difficultyLevel' in quiz,
          '- difficulty_level esiste:', 'difficulty_level' in quiz
        );
      });
      
      // Debug: conteggio quiz per difficoltà
      const easyCount = templates.filter(q => matchesDifficulty(q, 'easy')).length;
      const mediumCount = templates.filter(q => matchesDifficulty(q, 'medium')).length;
      const hardCount = templates.filter(q => matchesDifficulty(q, 'hard')).length;
      
      console.log('Conteggio quiz per difficoltà:', {
        facile: easyCount,
        medio: mediumCount,
        difficile: hardCount,
        totale: templates.length
      });
      
      setQuizTemplates(templates);
    } catch (error: any) {
      console.error('Errore nel recupero dei template quiz:', error);
      setError('Si è verificato un errore durante il recupero dei template quiz.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleExpandClick = (quizId: string) => {
    setExpandedQuizId(expandedQuizId === quizId ? null : quizId);
  };

  const handleDeleteClick = (quiz: QuizTemplate) => {
    setQuizToDelete(quiz);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!quizToDelete) return;
    
    try {
      await QuizService.deleteQuizTemplate(quizToDelete.id);
      // Aggiorna la lista dei quiz rimuovendo quello cancellato
      setQuizTemplates(quizTemplates.filter(quiz => quiz.id !== quizToDelete.id));
      NotificationsService.success(`Quiz "${quizToDelete.title}" eliminato con successo`);
    } catch (error: any) {
      ApiErrorHandler.handleApiError(error);
    } finally {
      setDeleteDialogOpen(false);
      setQuizToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setQuizToDelete(null);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const filteredQuizzes = quizTemplates.filter(quiz => {
    const searchLower = searchQuery.toLowerCase();
    return (
      quiz.title.toLowerCase().includes(searchLower) ||
      (quiz.description && quiz.description.toLowerCase().includes(searchLower)) ||
      (quiz.subject && quiz.subject.toLowerCase().includes(searchLower))
    );
  });

  /**
   * Verifica la corrispondenza alla difficoltà specificata, supportando sia
   * i valori stringa ('easy', 'medium', 'hard') che numerici (1, 2, 3)
   */
  const matchesDifficulty = (quiz: QuizTemplate, difficulty: string): boolean => {
    // Se il campo è una stringa, confronta direttamente
    if (typeof quiz.difficultyLevel === 'string') {
      return quiz.difficultyLevel === difficulty;
    }
    
    // Se il campo è un numero, confronta con la mappatura numerica
    if (typeof quiz.difficultyLevel === 'number') {
      switch (difficulty) {
        case 'easy': return quiz.difficultyLevel === 1;
        case 'medium': return quiz.difficultyLevel === 2;
        case 'hard': return quiz.difficultyLevel === 3;
        default: return false;
      }
    }
    
    // Se manca il campo difficultyLevel, trattalo come non corrispondente
    return false;
  };
  
  const getFilteredQuizzesByTab = () => {
    switch (tabValue) {
      case 0: // Tutti
        return filteredQuizzes;
      case 1: // Facile
        return filteredQuizzes.filter(quiz => matchesDifficulty(quiz, 'easy'));
      case 2: // Medio
        return filteredQuizzes.filter(quiz => matchesDifficulty(quiz, 'medium'));
      case 3: // Difficile
        return filteredQuizzes.filter(quiz => matchesDifficulty(quiz, 'hard'));
      default:
        return filteredQuizzes;
    }
  };

  const getDifficultyChip = (difficulty: string | number) => {
    // Gestione per valori di difficoltà numerici
    if (typeof difficulty === 'number') {
      switch (difficulty) {
        case 1:
          return <Chip icon={<DifficultyIcon fontSize="small" />} label="Facile" color="success" size="small" />;
        case 2:
          return <Chip icon={<DifficultyIcon fontSize="small" />} label="Intermedio" color="primary" size="small" />;
        case 3:
          return <Chip icon={<DifficultyIcon fontSize="small" />} label="Avanzato" color="error" size="small" />;
        default:
          return <Chip icon={<DifficultyIcon fontSize="small" />} label={`Livello ${difficulty}`} size="small" />;
      }
    }
    
    // Gestione per valori di difficoltà stringa
    switch (difficulty) {
      case 'easy':
        return <Chip icon={<DifficultyIcon fontSize="small" />} label="Facile" color="success" size="small" />;
      case 'medium':
        return <Chip icon={<DifficultyIcon fontSize="small" />} label="Intermedio" color="primary" size="small" />;
      case 'hard':
        return <Chip icon={<DifficultyIcon fontSize="small" />} label="Avanzato" color="error" size="small" />;
      default:
        return <Chip icon={<DifficultyIcon fontSize="small" />} label={difficulty || 'Non specificato'} size="small" />;
    }
  };

  return (
    <AnimatedPage transitionType="fade">
      <MainLayout title="Gestione Template Quiz">
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Gestione Template Quiz
            </Typography>
            <HoverAnimation>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                color="primary"
                onClick={() => navigate('/admin/quizzes/new')}
              >
                Nuovo Template Quiz
              </Button>
            </HoverAnimation>
          </Box>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
            <TextField
              label="Cerca quiz"
              variant="outlined"
              size="small"
              fullWidth
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Cerca per titolo, materia o grado..."
            />
          </Box>

          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            sx={{ mb: 2 }}
          >
            <Tab label={`Tutti (${filteredQuizzes.length})`} />
            <Tab label={`Facile (${filteredQuizzes.filter(q => matchesDifficulty(q, 'easy')).length})`} />
            <Tab label={`Medio (${filteredQuizzes.filter(q => matchesDifficulty(q, 'medium')).length})`} />
            <Tab label={`Difficile (${filteredQuizzes.filter(q => matchesDifficulty(q, 'hard')).length})`} />
          </Tabs>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
              <Button 
                sx={{ ml: 2 }} 
                size="small" 
                variant="outlined" 
                color="error"
                onClick={fetchQuizTemplates}
              >
                Riprova
              </Button>
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {getFilteredQuizzesByTab().length > 0 ? (
                getFilteredQuizzesByTab().map((quiz) => (
                  <Grid item xs={12} key={quiz.id}>
                    <HoverAnimation>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                              <Typography variant="h6" component="h2" gutterBottom>
                                {quiz.title}
                                {quiz.isPublic && (
                                  <Chip 
                                    icon={<PublicIcon fontSize="small" />}
                                    label="Pubblico" 
                                    color="success" 
                                    size="small"
                                    sx={{ ml: 1, verticalAlign: 'middle' }}
                                  />
                                )}
                              </Typography>
                              <Typography color="textSecondary" sx={{ mb: 1 }}>
                                {quiz.description || 'Nessuna descrizione disponibile'}
                              </Typography>
                            </Box>
                            {quiz.difficultyLevel && getDifficultyChip(quiz.difficultyLevel)}
                          </Box>
                          
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                            {quiz.subject && (
                              <Chip 
                                icon={<SubjectIcon />} 
                                label={quiz.subject} 
                                variant="outlined" 
                              />
                            )}
                            <Chip 
                              icon={<QuestionIcon />} 
                              label={`${quiz.totalQuestions || 0} domande`} 
                              variant="outlined" 
                            />
                            {quiz.timeLimit && (
                              <Chip 
                                icon={<TimerIcon />}
                                label={`${quiz.timeLimit} minuti`} 
                                variant="outlined" 
                              />
                            )}
                          </Box>
                        </CardContent>
                        <Divider />
                        <CardActions sx={{ justifyContent: 'space-between' }}>
                          <Box>
                            <Badge badgeContent={quiz.totalQuestions || 0} color="primary">
                              <Button 
                                onClick={() => handleExpandClick(quiz.id)}
                                startIcon={expandedQuizId === quiz.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                              >
                                {expandedQuizId === quiz.id ? 'Nascondi domande' : 'Mostra domande'}
                              </Button>
                            </Badge>
                          </Box>
                          <Box>
                            <IconButton 
                              aria-label="visualizza"
                              color="info"
                              onClick={() => navigate(`/admin/quizzes/${quiz.id}`)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                            <IconButton 
                              aria-label="modifica"
                              color="primary"
                              onClick={() => navigate(`/admin/quizzes/${quiz.id}/edit`)}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton 
                              aria-label="elimina" 
                              color="error"
                              onClick={() => handleDeleteClick(quiz)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </CardActions>
                        <Collapse in={expandedQuizId === quiz.id} timeout="auto" unmountOnExit>
                          <FadeIn>
                            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                              {quiz.questions?.length > 0 ? (
                                quiz.questions.map((question, index) => (
                                  <ListItem key={question.id || index} alignItems="flex-start" sx={{ flexDirection: 'column' }}>
                                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                                      <ListItemText
                                        primary={`Domanda ${index + 1}: ${question.text}`}
                                        secondary={`Tipo: ${question.type === 'multiple_choice' ? 'Risposta multipla' : 
                                          question.type === 'single_choice' ? 'Risposta singola' : 
                                          question.type === 'true_false' ? 'Vero/Falso' : 'Risposta numerica'}`}
                                      />
                                      <Chip label={`${question.score || 1} ${(question.score || 1) === 1 ? 'punto' : 'punti'}`} size="small" color="secondary" />
                                    </Box>
                                    {index < (quiz.questions?.length || 0) - 1 && <Divider sx={{ width: '100%', my: 1 }} />}
                                  </ListItem>
                                ))
                              ) : (
                                <ListItem>
                                  <Alert severity="info" sx={{ width: '100%' }}>
                                    Questo quiz non contiene ancora domande
                                  </Alert>
                                </ListItem>
                              )}
                            </List>
                          </FadeIn>
                        </Collapse>
                      </Card>
                    </HoverAnimation>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="textSecondary">
                      Nessun quiz trovato
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Prova a modificare i criteri di ricerca o crea un nuovo quiz
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </Paper>

        {/* Dialog di conferma eliminazione */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
        >
          <DialogTitle>Conferma eliminazione</DialogTitle>
          <DialogContent>
            <Typography>
              Sei sicuro di voler eliminare il template quiz "{quizToDelete?.title}"?
              Questa azione non può essere annullata.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel} color="primary">
              Annulla
            </Button>
            <Button onClick={handleDeleteConfirm} color="error" autoFocus>
              Elimina
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </MainLayout>
    </AnimatedPage>
  );
};

export default AdminQuizzes;
