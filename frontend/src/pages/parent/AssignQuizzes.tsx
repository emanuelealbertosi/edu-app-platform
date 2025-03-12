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
  Divider,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Checkbox,
  FormGroup,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Search as SearchIcon,
  FilterList as FilterIcon,
  Assignment as AssignmentIcon,
  Clear as ClearIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import MainLayout from '../../components/layouts/MainLayout';
import HoverAnimation from '../../components/animations/HoverAnimation';
import { ApiErrorHandler } from '../../services/ApiErrorHandler';
import { NotificationsService } from '../../services/NotificationsService';
import { motion } from 'framer-motion';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  avatar?: string;
}

interface Quiz {
  id: string;
  title: string;
  subject: string;
  grade: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  timeLimit: number; // in minuti
  description: string;
}

const AssignQuizzes: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuizzes, setSelectedQuizzes] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState<string>('');
  const [gradeFilter, setGradeFilter] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchQuizzes();
    fetchStudents();
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
            subject: 'Matematica',
            grade: 'Primaria',
            difficulty: 'easy',
            questionCount: 10,
            timeLimit: 15,
            description: 'Quiz base sulle operazioni di addizione e sottrazione'
          },
          { 
            id: '2', 
            title: 'Verbi irregolari inglesi', 
            subject: 'Inglese',
            grade: 'Secondaria',
            difficulty: 'medium',
            questionCount: 15,
            timeLimit: 20,
            description: 'Quiz sui principali verbi irregolari inglesi'
          },
          { 
            id: '3', 
            title: 'Leggi di Newton', 
            subject: 'Fisica',
            grade: 'Liceo',
            difficulty: 'hard',
            questionCount: 12,
            timeLimit: 25,
            description: 'Quiz sulle tre leggi fondamentali della dinamica'
          },
          { 
            id: '4', 
            title: 'Moltiplicazione e divisione', 
            subject: 'Matematica',
            grade: 'Primaria',
            difficulty: 'medium',
            questionCount: 8,
            timeLimit: 20,
            description: 'Quiz sulle tabelline e operazioni di divisione semplice'
          },
          { 
            id: '5', 
            title: 'Geografia italiana', 
            subject: 'Geografia',
            grade: 'Secondaria',
            difficulty: 'easy',
            questionCount: 15,
            timeLimit: 15,
            description: 'Quiz sulle regioni, capoluoghi e caratteristiche geografiche dell\'Italia'
          }
        ];
        setQuizzes(mockQuizzes);
        setLoading(false);
      }, 800);
    } catch (error) {
      ApiErrorHandler.handleApiError(error);
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      // Simulazione chiamata API
      // const response = await StudentService.getMyStudents();
      // setStudents(response.data);
      
      // Dati di esempio
      setTimeout(() => {
        const mockStudents: Student[] = [
          { 
            id: '1', 
            firstName: 'Marco', 
            lastName: 'Rossi',
            grade: 'Primaria'
          },
          { 
            id: '2', 
            firstName: 'Giulia', 
            lastName: 'Bianchi',
            grade: 'Primaria'
          },
          { 
            id: '3', 
            firstName: 'Luca', 
            lastName: 'Verdi',
            grade: 'Secondaria'
          }
        ];
        setStudents(mockStudents);
      }, 500);
    } catch (error) {
      ApiErrorHandler.handleApiError(error);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleQuizSelect = (quizId: string) => {
    setSelectedQuizzes(prev => 
      prev.includes(quizId) 
        ? prev.filter(id => id !== quizId)
        : [...prev, quizId]
    );
  };

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAllQuizzes = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedQuizzes(filteredQuizzes.map(quiz => quiz.id));
    } else {
      setSelectedQuizzes([]);
    }
  };

  const handleSelectAllStudents = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedStudents(students.map(student => student.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleAssignDialogOpen = () => {
    if (selectedQuizzes.length === 0) {
      NotificationsService.error('Seleziona almeno un quiz da assegnare');
      return;
    }
    setAssignDialogOpen(true);
  };

  const handleAssignDialogClose = () => {
    setAssignDialogOpen(false);
  };

  const handleAssignQuizzes = async () => {
    if (selectedQuizzes.length === 0 || selectedStudents.length === 0) {
      NotificationsService.error('Seleziona almeno un quiz e uno studente');
      return;
    }

    try {
      // Simulazione chiamata API
      // await QuizService.assignQuizzes(selectedQuizzes, selectedStudents);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccessMessage(`${selectedQuizzes.length} quiz assegnati con successo a ${selectedStudents.length} studenti`);
      NotificationsService.success('Quiz assegnati con successo');
      
      // Reset delle selezioni
      setSelectedQuizzes([]);
      setSelectedStudents([]);
      setAssignDialogOpen(false);
    } catch (error) {
      ApiErrorHandler.handleApiError(error);
    }
  };

  const handleSubjectFilterChange = (event: SelectChangeEvent) => {
    setSubjectFilter(event.target.value);
  };

  const handleGradeFilterChange = (event: SelectChangeEvent) => {
    setGradeFilter(event.target.value);
  };

  const handleDifficultyFilterChange = (event: SelectChangeEvent) => {
    setDifficultyFilter(event.target.value);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSubjectFilter('');
    setGradeFilter('');
    setDifficultyFilter('');
  };

  const handleSuccessAlertClose = () => {
    setSuccessMessage('');
  };

  const getUniqueSubjects = () => {
    return Array.from(new Set(quizzes.map(quiz => quiz.subject)));
  };

  const getUniqueGrades = () => {
    return Array.from(new Set(quizzes.map(quiz => quiz.grade)));
  };

  const filteredQuizzes = quizzes.filter(quiz => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      quiz.title.toLowerCase().includes(searchLower) ||
      quiz.description.toLowerCase().includes(searchLower) ||
      quiz.subject.toLowerCase().includes(searchLower);
    
    const matchesSubject = subjectFilter ? quiz.subject === subjectFilter : true;
    const matchesGrade = gradeFilter ? quiz.grade === gradeFilter : true;
    const matchesDifficulty = difficultyFilter ? quiz.difficulty === difficultyFilter : true;

    return matchesSearch && matchesSubject && matchesGrade && matchesDifficulty;
  });

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
        <Typography variant="h4" component="h1" gutterBottom>
          Assegna Quiz
        </Typography>

        <Paper sx={{ p: 2, mb: 3, overflow: 'hidden' }}>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, mr: 2 }}>
              <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
              <TextField
                label="Cerca quiz"
                variant="outlined"
                size="small"
                fullWidth
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Cerca per titolo, descrizione o materia..."
                InputProps={{
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton 
                        size="small"
                        onClick={() => setSearchQuery('')}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Box>
            <Button
              startIcon={<FilterIcon />}
              onClick={() => setFiltersOpen(!filtersOpen)}
              variant={filtersOpen ? "contained" : "outlined"}
              size="small"
            >
              Filtri
            </Button>
          </Box>

          <Box
            component={motion.div}
            initial={{ height: 0, opacity: 0 }}
            animate={{ 
              height: filtersOpen ? 'auto' : 0,
              opacity: filtersOpen ? 1 : 0
            }}
            transition={{ duration: 0.3 }}
            sx={{ 
              overflow: 'hidden',
              mb: filtersOpen ? 2 : 0
            }}
          >
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Materia</InputLabel>
                  <Select
                    value={subjectFilter}
                    label="Materia"
                    onChange={handleSubjectFilterChange}
                  >
                    <MenuItem value="">Tutte</MenuItem>
                    {getUniqueSubjects().map(subject => (
                      <MenuItem key={subject} value={subject}>{subject}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Grado</InputLabel>
                  <Select
                    value={gradeFilter}
                    label="Grado"
                    onChange={handleGradeFilterChange}
                  >
                    <MenuItem value="">Tutti</MenuItem>
                    {getUniqueGrades().map(grade => (
                      <MenuItem key={grade} value={grade}>{grade}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Difficoltà</InputLabel>
                  <Select
                    value={difficultyFilter}
                    label="Difficoltà"
                    onChange={handleDifficultyFilterChange}
                  >
                    <MenuItem value="">Tutte</MenuItem>
                    <MenuItem value="easy">Facile</MenuItem>
                    <MenuItem value="medium">Intermedio</MenuItem>
                    <MenuItem value="hard">Avanzato</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="text" 
                size="small"
                onClick={handleResetFilters}
              >
                Reset filtri
              </Button>
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={selectedQuizzes.length > 0 && selectedQuizzes.length === filteredQuizzes.length}
                  indeterminate={selectedQuizzes.length > 0 && selectedQuizzes.length < filteredQuizzes.length}
                  onChange={handleSelectAllQuizzes}
                  disabled={filteredQuizzes.length === 0}
                />
              }
              label={`Seleziona tutti i quiz (${filteredQuizzes.length})`}
            />
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {filteredQuizzes.length > 0 ? (
                filteredQuizzes.map((quiz) => (
                  <Grid item xs={12} sm={6} md={4} key={quiz.id}>
                    <HoverAnimation>
                      <Card 
                        sx={{ 
                          height: '100%', 
                          display: 'flex', 
                          flexDirection: 'column',
                          position: 'relative',
                          border: selectedQuizzes.includes(quiz.id) ? 2 : 0,
                          borderColor: 'primary.main',
                        }}
                      >
                        {selectedQuizzes.includes(quiz.id) && (
                          <Box 
                            component={motion.div}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            sx={{ 
                              position: 'absolute', 
                              top: 8, 
                              right: 8,
                              zIndex: 1
                            }}
                          >
                            <CheckCircleIcon color="primary" />
                          </Box>
                        )}
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="h6" component="h2" gutterBottom noWrap>
                              {quiz.title}
                            </Typography>
                            {getDifficultyChip(quiz.difficulty)}
                          </Box>
                          <Typography color="textSecondary" variant="body2" sx={{ mb: 2 }} gutterBottom>
                            {quiz.description}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            <Chip 
                              label={quiz.subject} 
                              size="small" 
                              variant="outlined" 
                            />
                            <Chip 
                              label={quiz.grade} 
                              size="small" 
                              variant="outlined" 
                            />
                            <Chip 
                              label={`${quiz.questionCount} domande`} 
                              size="small" 
                              variant="outlined" 
                            />
                            <Chip 
                              label={`${quiz.timeLimit} minuti`} 
                              size="small" 
                              variant="outlined" 
                            />
                          </Box>
                        </CardContent>
                        <CardActions>
                          <Button 
                            fullWidth
                            variant={selectedQuizzes.includes(quiz.id) ? "outlined" : "contained"}
                            color={selectedQuizzes.includes(quiz.id) ? "secondary" : "primary"}
                            onClick={() => handleQuizSelect(quiz.id)}
                          >
                            {selectedQuizzes.includes(quiz.id) ? "Deseleziona" : "Seleziona"}
                          </Button>
                        </CardActions>
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
                      Prova a modificare i criteri di ricerca
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <HoverAnimation scale={1.05}>
            <Button 
              variant="contained" 
              color="primary"
              size="large"
              startIcon={<AssignmentIcon />}
              onClick={handleAssignDialogOpen}
              disabled={selectedQuizzes.length === 0}
            >
              Assegna {selectedQuizzes.length > 0 ? `(${selectedQuizzes.length})` : ''}
            </Button>
          </HoverAnimation>
        </Box>

        {/* Dialog per l'assegnazione dei quiz */}
        <Dialog
          open={assignDialogOpen}
          onClose={handleAssignDialogClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Assegna Quiz agli Studenti</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Hai selezionato {selectedQuizzes.length} quiz. Seleziona a quali studenti vuoi assegnarli:
            </DialogContentText>
            
            <FormGroup sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={selectedStudents.length === students.length}
                    indeterminate={selectedStudents.length > 0 && selectedStudents.length < students.length}
                    onChange={handleSelectAllStudents}
                  />
                }
                label="Seleziona tutti gli studenti"
              />
            </FormGroup>
            
            <Box sx={{ mb: 2 }}>
              {students.map(student => (
                <FormControlLabel
                  key={student.id}
                  control={
                    <Checkbox 
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => handleStudentSelect(student.id)}
                    />
                  }
                  label={`${student.firstName} ${student.lastName} (${student.grade})`}
                />
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleAssignDialogClose}>
              Annulla
            </Button>
            <Button 
              onClick={handleAssignQuizzes} 
              color="primary" 
              variant="contained"
              disabled={selectedStudents.length === 0}
            >
              Assegna
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar per messaggio di successo */}
        <Snackbar 
          open={Boolean(successMessage)} 
          autoHideDuration={6000} 
          onClose={handleSuccessAlertClose}
        >
          <Alert 
            onClose={handleSuccessAlertClose} 
            severity="success"
            variant="filled"
          >
            {successMessage}
          </Alert>
        </Snackbar>
      </Container>
    </MainLayout>
  );
};

export default AssignQuizzes;
