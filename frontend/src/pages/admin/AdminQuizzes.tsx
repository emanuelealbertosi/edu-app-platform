import React, { useState, useEffect } from 'react';
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
  Tab
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  QuestionAnswer as QuestionIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import MainLayout from '../../components/layouts/MainLayout';
import HoverAnimation from '../../components/animations/HoverAnimation';
import { ApiErrorHandler } from '../../services/ApiErrorHandler';
import { NotificationsService } from '../../services/NotificationsService';
import { motion } from 'framer-motion';

interface Question {
  id: string;
  text: string;
  type: 'multiple' | 'single' | 'text';
  options?: string[];
  correctAnswer: string | string[];
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  subject: string;
  grade: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  timeLimit: number; // in minuti
  questions: Question[];
  completionCount: number;
  averageScore: number;
}

const AdminQuizzes: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      // Simulazione chiamata API
      // const response = await QuizService.getAllQuizzes();
      // setQuizzes(response.data);
      
      // Dati di esempio
      setTimeout(() => {
        const mockQuizzes: Quiz[] = [
          { 
            id: '1', 
            title: 'Addizione e sottrazione', 
            description: 'Quiz base sulle operazioni di addizione e sottrazione',
            subject: 'Matematica',
            grade: 'Primaria',
            difficulty: 'easy',
            questionCount: 10,
            timeLimit: 15,
            questions: [
              {
                id: 'q1',
                text: 'Quanto fa 5 + 3?',
                type: 'single',
                options: ['7', '8', '9', '10'],
                correctAnswer: '8'
              },
              {
                id: 'q2',
                text: 'Quanto fa 10 - 4?',
                type: 'single',
                options: ['4', '5', '6', '7'],
                correctAnswer: '6'
              }
            ],
            completionCount: 42,
            averageScore: 85
          },
          { 
            id: '2', 
            title: 'Verbi irregolari inglesi', 
            description: 'Quiz sui principali verbi irregolari inglesi',
            subject: 'Inglese',
            grade: 'Secondaria',
            difficulty: 'medium',
            questionCount: 15,
            timeLimit: 20,
            questions: [
              {
                id: 'q1',
                text: 'Qual è il past simple di "go"?',
                type: 'single',
                options: ['goed', 'went', 'gone', 'going'],
                correctAnswer: 'went'
              },
              {
                id: 'q2',
                text: 'Qual è il past participle di "see"?',
                type: 'single',
                options: ['saw', 'seen', 'seed', 'sawn'],
                correctAnswer: 'seen'
              }
            ],
            completionCount: 28,
            averageScore: 72
          },
          { 
            id: '3', 
            title: 'Leggi di Newton', 
            description: 'Quiz sulle tre leggi fondamentali della dinamica',
            subject: 'Fisica',
            grade: 'Liceo',
            difficulty: 'hard',
            questionCount: 12,
            timeLimit: 25,
            questions: [
              {
                id: 'q1',
                text: 'Quale delle seguenti è la prima legge di Newton?',
                type: 'single',
                options: [
                  'Un corpo persevera nel suo stato di quiete o di moto rettilineo uniforme a meno che non sia costretto a mutare tale stato da forze impresse.',
                  'L\'accelerazione di un corpo è direttamente proporzionale alla forza risultante agente su di esso e inversamente proporzionale alla sua massa.',
                  'Ad ogni azione corrisponde una reazione uguale e contraria.',
                  'La forza di gravità tra due corpi è direttamente proporzionale al prodotto delle masse e inversamente proporzionale al quadrato della loro distanza.'
                ],
                correctAnswer: 'Un corpo persevera nel suo stato di quiete o di moto rettilineo uniforme a meno che non sia costretto a mutare tale stato da forze impresse.'
              }
            ],
            completionCount: 18,
            averageScore: 65
          }
        ];
        setQuizzes(mockQuizzes);
        setLoading(false);
      }, 1000);
    } catch (error) {
      ApiErrorHandler.handleApiError(error);
      setLoading(false);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleExpandClick = (quizId: string) => {
    setExpandedQuizId(expandedQuizId === quizId ? null : quizId);
  };

  const handleDeleteClick = (quiz: Quiz) => {
    setQuizToDelete(quiz);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!quizToDelete) return;
    
    try {
      // Simulazione chiamata API
      // await QuizService.deleteQuiz(quizToDelete.id);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Aggiorna la lista dei quiz rimuovendo quello cancellato
      setQuizzes(quizzes.filter(quiz => quiz.id !== quizToDelete.id));
      NotificationsService.success(`Quiz "${quizToDelete.title}" eliminato con successo`);
    } catch (error) {
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

  const filteredQuizzes = quizzes.filter(quiz => {
    const searchLower = searchQuery.toLowerCase();
    return (
      quiz.title.toLowerCase().includes(searchLower) ||
      quiz.description.toLowerCase().includes(searchLower) ||
      quiz.subject.toLowerCase().includes(searchLower) ||
      quiz.grade.toLowerCase().includes(searchLower)
    );
  });

  const getFilteredQuizzesByTab = () => {
    switch (tabValue) {
      case 0: // Tutti
        return filteredQuizzes;
      case 1: // Facile
        return filteredQuizzes.filter(quiz => quiz.difficulty === 'easy');
      case 2: // Medio
        return filteredQuizzes.filter(quiz => quiz.difficulty === 'medium');
      case 3: // Difficile
        return filteredQuizzes.filter(quiz => quiz.difficulty === 'hard');
      default:
        return filteredQuizzes;
    }
  };

  const getDifficultyChip = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return <Chip label="Facile" color="success" size="small" />;
      case 'medium':
        return <Chip label="Intermedio" color="primary" size="small" />;
      case 'hard':
        return <Chip label="Avanzato" color="error" size="small" />;
      default:
        return <Chip label={difficulty} size="small" />;
    }
  };

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Gestione Quiz
          </Typography>
          <HoverAnimation>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              color="primary"
            >
              Nuovo Quiz
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
            <Tab label={`Facile (${filteredQuizzes.filter(q => q.difficulty === 'easy').length})`} />
            <Tab label={`Medio (${filteredQuizzes.filter(q => q.difficulty === 'medium').length})`} />
            <Tab label={`Difficile (${filteredQuizzes.filter(q => q.difficulty === 'hard').length})`} />
          </Tabs>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
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
                              </Typography>
                              <Typography color="textSecondary" sx={{ mb: 1 }}>
                                {quiz.description}
                              </Typography>
                            </Box>
                            {getDifficultyChip(quiz.difficulty)}
                          </Box>
                          
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                            <Chip 
                              icon={<SchoolIcon />} 
                              label={`${quiz.subject} - ${quiz.grade}`} 
                              variant="outlined" 
                            />
                            <Chip 
                              icon={<QuestionIcon />} 
                              label={`${quiz.questionCount} domande`} 
                              variant="outlined" 
                            />
                            <Chip 
                              label={`${quiz.timeLimit} minuti`} 
                              variant="outlined" 
                            />
                            <Chip 
                              label={`Media: ${quiz.averageScore}%`} 
                              variant="outlined" 
                              color={quiz.averageScore >= 70 ? "success" : quiz.averageScore >= 50 ? "warning" : "error"}
                            />
                          </Box>
                        </CardContent>
                        <Divider />
                        <CardActions sx={{ justifyContent: 'space-between' }}>
                          <Box>
                            <Badge badgeContent={quiz.questions.length} color="primary">
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
                              aria-label="modifica"
                              color="primary"
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
                          <Box component={motion.div} 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                          >
                            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                              {quiz.questions.map((question, index) => (
                                <ListItem key={question.id} alignItems="flex-start" sx={{ flexDirection: 'column' }}>
                                  <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                                    <ListItemText
                                      primary={`Domanda ${index + 1}: ${question.text}`}
                                      secondary={`Tipo: ${question.type === 'multiple' ? 'Risposta multipla' : 
                                        question.type === 'single' ? 'Risposta singola' : 'Risposta testuale'}`}
                                    />
                                    <Chip label={question.type} size="small" />
                                  </Box>
                                  {question.options && (
                                    <Box sx={{ mt: 1, ml: 2 }}>
                                      <Typography variant="body2" color="textSecondary" gutterBottom>
                                        Opzioni:
                                      </Typography>
                                      <List dense>
                                        {question.options.map((option, optIdx) => (
                                          <ListItem key={optIdx} sx={{ py: 0 }}>
                                            <ListItemText
                                              primary={option}
                                              sx={{ 
                                                ...(Array.isArray(question.correctAnswer) 
                                                  ? question.correctAnswer.includes(option)
                                                  : question.correctAnswer === option)
                                                  ? { color: 'success.main', fontWeight: 'bold' } : {}
                                              }}
                                            />
                                            {(Array.isArray(question.correctAnswer) 
                                              ? question.correctAnswer.includes(option)
                                              : question.correctAnswer === option) && (
                                              <Chip 
                                                label="Risposta corretta" 
                                                color="success" 
                                                size="small"
                                                sx={{ ml: 1 }}
                                              />
                                            )}
                                          </ListItem>
                                        ))}
                                      </List>
                                    </Box>
                                  )}
                                  {!question.options && (
                                    <Box sx={{ mt: 1, ml: 2 }}>
                                      <Typography variant="body2" color="textSecondary">
                                        Risposta corretta: {Array.isArray(question.correctAnswer) 
                                          ? question.correctAnswer.join(', ') 
                                          : question.correctAnswer}
                                      </Typography>
                                    </Box>
                                  )}
                                  {index < quiz.questions.length - 1 && <Divider sx={{ width: '100%', my: 1 }} />}
                                </ListItem>
                              ))}
                            </List>
                          </Box>
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
              Sei sicuro di voler eliminare il quiz "{quizToDelete?.title}"?
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
  );
};

export default AdminQuizzes;
