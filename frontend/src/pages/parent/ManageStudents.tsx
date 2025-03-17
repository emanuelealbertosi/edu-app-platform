import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import StudentService, { Student, StudentPath, StudentQuiz } from '../../services/StudentService';
import ParentService from '../../services/ParentService';
import { NotificationsService } from '../../services/NotificationsService';
import { 
  Typography, Box, Paper, Alert, CircularProgress, Grid, Card, CardContent, 
  CardActions, Button, Avatar, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Chip, Divider, Tab, Tabs, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Collapse, List, ListItem, ListItemText, ListItemIcon,
  LinearProgress, Tooltip, Fade, Zoom
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Person as PersonIcon,
  School as SchoolIcon,
  Quiz as QuizIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  DonutLarge as DonutLargeIcon,
  NewReleases as NewReleasesIcon
} from '@mui/icons-material';

// Custom TabPanel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function StudentTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`student-tabpanel-${index}`}
      aria-labelledby={`student-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ManageStudents: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editingStudentId, setEditingStudentId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Stato per i dettagli dello studente
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState<string>('');
  const [studentPaths, setStudentPaths] = useState<StudentPath[]>([]);
  const [studentQuizzes, setStudentQuizzes] = useState<StudentQuiz[]>([]);
  const [detailsTabValue, setDetailsTabValue] = useState(0);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [expandedPathId, setExpandedPathId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    initializeAndFetchStudents();
  }, []);

  // Inizializza il profilo genitore se necessario e poi recupera gli studenti
  const initializeAndFetchStudents = async () => {
    setLoading(true);
    try {
      // Assicurati che esista un profilo genitore prima di recuperare gli studenti
      await ParentService.ensureParentProfileExists();
      // Ora recupera gli studenti
      await fetchStudents();
    } catch (err) {
      console.error('Errore nell\'inizializzazione:', err);
      setError('Si è verificato un problema con il tuo profilo genitore. Riprova più tardi.');
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const fetchedStudents = await StudentService.getStudentsByParent();
      setStudents(fetchedStudents);
      setError(null);
    } catch (err) {
      console.error('Errore nel recupero degli studenti:', err);
      setError('Non è stato possibile caricare gli studenti. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Reset error for this field
    setFormErrors({
      ...formErrors,
      [name]: ''
    });
  };

  const validateForm = () => {
    let valid = true;
    const errors = {
      name: '',
      username: '',
      password: '',
      confirmPassword: ''
    };

    if (!formData.name.trim()) {
      errors.name = 'Il nome è obbligatorio';
      valid = false;
    }

    if (!formData.username.trim()) {
      errors.username = 'Il nome utente è obbligatorio';
      valid = false;
    } else if (formData.username.length < 4) {
      errors.username = 'Il nome utente deve essere di almeno 4 caratteri';
      valid = false;
    }

    // Password is required only for new students
    if (!isEditMode) {
      if (!formData.password) {
        errors.password = 'La password è obbligatoria';
        valid = false;
      } else if (formData.password.length < 6) {
        errors.password = 'La password deve essere di almeno 6 caratteri';
        valid = false;
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Le password non corrispondono';
        valid = false;
      }
    } else {
      // In edit mode, password fields are optional but if provided must match
      if (formData.password && formData.password.length < 6) {
        errors.password = 'La password deve essere di almeno 6 caratteri';
        valid = false;
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Le password non corrispondono';
        valid = false;
      }
    }

    setFormErrors(errors);
    return valid;
  };

  const handleOpenDialog = () => {
    setIsEditMode(false);
    setFormData({
      name: '',
      username: '',
      password: '',
      confirmPassword: ''
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormErrors({
      name: '',
      username: '',
      password: '',
      confirmPassword: ''
    });
  };

  const handleEditClick = (student: Student) => {
    setIsEditMode(true);
    setEditingStudentId(student.id);
    setFormData({
      name: student.name,
      username: student.username,
      password: '',
      confirmPassword: ''
    });
    setOpenDialog(true);
  };

  const handleCreateOrUpdateStudent = async () => {
    if (!validateForm()) return;

    try {
      if (isEditMode) {
        // Update existing student
        const data: any = {
          name: formData.name,
          username: formData.username,
        };
        // Only include password if it was provided
        if (formData.password) {
          data.password = formData.password;
        }
        
        await StudentService.updateStudent(editingStudentId, data);
        NotificationsService.success(`Studente ${formData.name} aggiornato con successo`);
      } else {
        // Prima di creare un nuovo studente, assicurati che esista un profilo genitore
        await ParentService.ensureParentProfileExists();
        
        // Create new student
        await StudentService.createStudent({
          name: formData.name,
          username: formData.username,
          password: formData.password
        });
        NotificationsService.success(`Studente ${formData.name} creato con successo`);
      }
      
      // Refresh student list
      fetchStudents();
      handleCloseDialog();
    } catch (err) {
      console.error('Errore durante il salvataggio dello studente:', err);
      NotificationsService.error('Si è verificato un errore durante il salvataggio dello studente');
    }
  };

  const handleViewDetails = async (student: Student) => {
    setSelectedStudent(student);
    setSelectedStudentName(student.name);
    setOpenDetailsDialog(true);
    setLoadingDetails(true);
    setExpandedPathId(null);
    await loadStudentDetails(student.id);
  };

  const loadStudentDetails = async (studentId: string) => {
    try {
      console.log(`%c[DEBUG ManageStudents] Caricamento dettagli studente: ${studentId}`, 'background: #FF5722; color: white; padding: 2px 4px; border-radius: 2px;');
      
      // Load paths and quizzes in parallel
      const [paths, quizzes] = await Promise.all([
        StudentService.getStudentPaths(studentId),
        StudentService.getStudentQuizzes(studentId)
      ]);
      
      console.log(`%c[DEBUG ManageStudents] Percorsi caricati:`, 'background: #FF5722; color: white; padding: 2px 4px; border-radius: 2px;', paths);
      console.log(`%c[DEBUG ManageStudents] Quiz caricati:`, 'background: #FF5722; color: white; padding: 2px 4px; border-radius: 2px;', quizzes);
      
      setStudentPaths(paths);
      setStudentQuizzes(quizzes);
    } catch (error) {
      console.error('Errore nel caricamento dei dettagli dello studente:', error);
      NotificationsService.error('Errore nel caricamento dei dettagli dello studente');
    } finally {
      setLoadingDetails(false);
    }
  };
  
  const handleDetailsTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setDetailsTabValue(newValue);
  };
  
  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
    setSelectedStudent(null);
    setSelectedStudentName('');
    setStudentPaths([]);
    setStudentQuizzes([]);
  };
  
  const handleRemovePath = async (pathId: string) => {
    if (!selectedStudent) return;
    
    const confirmed = window.confirm('Sei sicuro di voler rimuovere questo percorso?');
    if (!confirmed) return;
    
    try {
      setLoadingDetails(true);
      const success = await StudentService.removeStudentPath(selectedStudent.id, pathId);
      
      if (success) {
        // Aggiorna la lista dei percorsi immediatamente per l'interfaccia
        setStudentPaths(prevPaths => prevPaths.filter(path => path.id !== pathId));
        
        // Ricarica i dati per assicurarsi che corrispondano ai dati sul server
        await loadStudentDetails(selectedStudent.id);
        
        NotificationsService.success('Percorso rimosso con successo');
      }
    } catch (error) {
      console.error('Errore nella rimozione del percorso:', error);
      NotificationsService.error('Errore nella rimozione del percorso');
    } finally {
      setLoadingDetails(false);
    }
  };
  
  const handleRemoveQuiz = async (quizId: string) => {
    if (!selectedStudent) return;
    
    const confirmed = window.confirm('Sei sicuro di voler rimuovere questo quiz?');
    if (!confirmed) return;
    
    try {
      const success = await StudentService.removeStudentQuiz(selectedStudent.id, quizId);
      if (success) {
        // Aggiorna la lista dei quiz
        setStudentQuizzes(prevQuizzes => prevQuizzes.filter(quiz => quiz.id !== quizId));
      }
    } catch (error) {
      console.error('Errore nella rimozione del quiz:', error);
    }
  };
  
  const toggleExpandPath = (pathId: string) => {
    setExpandedPathId(expandedPathId === pathId ? null : pathId);
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'in_progress':
        return <DonutLargeIcon color="primary" />;
      case 'new':
      default:
        return <NewReleasesIcon color="info" />;
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completato';
      case 'in_progress':
        return 'In corso';
      case 'new':
      default:
        return 'Nuovo';
    }
  };
  
  const renderStudentCard = (student: Student) => (
    <Card key={student.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar 
            src={student.avatar || undefined} 
            sx={{ mr: 2, bgcolor: 'primary.main' }}
          >
            {student.name.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="h6" component="div">
            {student.name}
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Username: {student.username}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Chip 
            label={`${student.points} punti`} 
            color="primary" 
            size="small" 
            sx={{ mr: 1 }} 
          />
          <Chip 
            label={`Livello ${student.level}`} 
            color="secondary" 
            size="small" 
          />
        </Box>
        
        {student.pendingRewards > 0 && (
          <Chip 
            label={`${student.pendingRewards} ricompense in attesa`} 
            color="warning" 
            size="small" 
            sx={{ mt: 1 }} 
          />
        )}
      </CardContent>
      
      <Divider />
      
      <CardActions>
        <Button 
          size="small" 
          variant="outlined" 
          startIcon={<EditIcon />}
          onClick={() => handleEditClick(student)}
        >
          Modifica
        </Button>
        <Button 
          size="small" 
          color="secondary"
          variant="outlined"
          startIcon={<PersonIcon />}
          onClick={() => handleViewDetails(student)}
        >
          Dettagli
        </Button>
      </CardActions>
    </Card>
  );

  // Componente per mostrare i percorsi assegnati allo studente
  const renderPathsTab = () => (
    <Box sx={{ mt: 2 }}>
      {loadingDetails ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : studentPaths.length === 0 ? (
        <Fade in={true} timeout={500}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Non ci sono percorsi assegnati a questo studente.
          </Alert>
        </Fade>
      ) : (
        <Fade in={true} timeout={800}>
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Percorso</TableCell>
                  <TableCell>Stato</TableCell>
                  <TableCell>Progresso</TableCell>
                  <TableCell>Assegnato il</TableCell>
                  <TableCell>Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {studentPaths.map((path, index) => (
                  <TableRow 
                    key={path.id}
                    hover 
                    sx={{ 
                      '& > *': { borderBottom: 'unset' },
                      backgroundColor: expandedPathId === path.id ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                      animation: `fadeIn 300ms ease-in-out ${index * 100}ms forwards`,
                      opacity: 0,
                      '@keyframes fadeIn': {
                        '0%': {
                          opacity: 0,
                          transform: 'translateY(10px)'
                        },
                        '100%': {
                          opacity: 1,
                          transform: 'translateY(0)'
                        }
                      }
                    }}
                  >
                    <TableCell component="th" scope="row">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body1">{path.title}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(path.status)}
                        label={getStatusLabel(path.status)}
                        color={
                          path.status === 'completed' ? 'success' : 
                          path.status === 'in_progress' ? 'primary' : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress variant="determinate" value={path.progress} />
                        </Box>
                        <Box sx={{ minWidth: 35 }}>
                          <Typography variant="body2" color="text.secondary">
                            {`${Math.round(path.progress)}%`}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="caption">
                        {path.completedNodes} di {path.totalNodes} nodi completati
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(path.assignedAt).toLocaleDateString('it-IT')}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex' }}>
                        <Tooltip title="Espandi">
                          <IconButton 
                            size="small" 
                            onClick={() => toggleExpandPath(path.id)}
                            aria-expanded={expandedPathId === path.id}
                            aria-label="espandi dettagli percorso"
                          >
                            {expandedPathId === path.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Rimuovi percorso">
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleRemovePath(path.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {studentPaths.map((path) => (
                  <TableRow key={`details-${path.id}`}>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                      <Collapse in={expandedPathId === path.id} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1, py: 2 }}>
                          <Typography variant="h6" gutterBottom component="div">
                            Dettagli Percorso
                          </Typography>
                          {path.description && (
                            <Typography variant="body2" paragraph>
                              {path.description}
                            </Typography>
                          )}
                          {path.lastActivity && (
                            <Typography variant="body2" color="text.secondary">
                              Ultima attività: {new Date(path.lastActivity).toLocaleString('it-IT')}
                            </Typography>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Fade>
      )}
    </Box>
  );

  // Componente per mostrare i quiz assegnati allo studente
  const renderQuizzesTab = () => (
    <Box sx={{ mt: 2 }}>
      {loadingDetails ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : studentQuizzes.length === 0 ? (
        <Fade in={true} timeout={500}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Non ci sono quiz assegnati a questo studente.
          </Alert>
        </Fade>
      ) : (
        <Fade in={true} timeout={800}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Quiz</TableCell>
                  <TableCell>Stato</TableCell>
                  <TableCell>Punteggio</TableCell>
                  <TableCell>Assegnato il</TableCell>
                  <TableCell>Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {studentQuizzes.map((quiz, index) => (
                  <TableRow 
                    key={quiz.id} 
                    hover
                    sx={{
                      animation: `fadeIn 300ms ease-in-out ${index * 100}ms forwards`,
                      opacity: 0,
                      '@keyframes fadeIn': {
                        '0%': {
                          opacity: 0,
                          transform: 'translateY(10px)'
                        },
                        '100%': {
                          opacity: 1,
                          transform: 'translateY(0)'
                        }
                      }
                    }}
                  >
                    <TableCell component="th" scope="row">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <QuizIcon sx={{ mr: 1, color: 'secondary.main' }} />
                        <Box>
                          <Typography variant="body1">{quiz.title}</Typography>
                          {quiz.pathId && (
                            <Typography variant="caption" color="text.secondary">
                              Parte di un percorso
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(quiz.status)}
                        label={getStatusLabel(quiz.status)}
                        color={
                          quiz.status === 'completed' ? 'success' : 
                          quiz.status === 'in_progress' ? 'primary' : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {quiz.score !== undefined && quiz.maxScore !== undefined ? (
                        <Typography>
                          {quiz.score} / {quiz.maxScore} 
                          <Typography component="span" color="text.secondary" variant="caption" sx={{ ml: 1 }}>
                            ({Math.round((quiz.score / quiz.maxScore) * 100)}%)
                          </Typography>
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Non completato
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(quiz.assignedAt).toLocaleDateString('it-IT')}
                    </TableCell>
                    <TableCell>
                      {!quiz.pathId && (
                        <Tooltip title="Rimuovi quiz">
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleRemoveQuiz(quiz.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {quiz.pathId && (
                        <Tooltip title="Non è possibile rimuovere quiz che fanno parte di un percorso">
                          <span>
                            <IconButton 
                              size="small" 
                              color="error" 
                              disabled
                            >
                              <DeleteIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Fade>
      )}
    </Box>
  );

  // Event listener per aggiornamenti dai dati degli studenti
  useEffect(() => {
    // Funzione per gestire gli eventi di aggiornamento dati
    const handleStudentDataUpdated = (event: CustomEvent<any>) => {
      const { studentId, action, timestamp } = event.detail;
      
      // Se abbiamo uno studente selezionato e l'evento riguarda questo studente
      if (selectedStudent && selectedStudent.id === studentId) {
        console.log(`Ricevuto evento di aggiornamento dati per lo studente ${studentId}, azione: ${action}`);
        
        // Ricarica i dettagli dello studente
        loadStudentDetails(studentId);
      }
    };
    
    // Aggiungi il listener come CustomEvent
    window.addEventListener('student-data-updated', handleStudentDataUpdated as EventListener);
    
    // Rimuovi il listener quando il componente viene smontato
    return () => {
      window.removeEventListener('student-data-updated', handleStudentDataUpdated as EventListener);
    };
  }, [selectedStudent]); // Dipendenza da selectedStudent

  return (
    <MainLayout title="Gestione Studenti">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">
            Gestione Studenti
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />} 
            onClick={handleOpenDialog}
          >
            Nuovo Studente
          </Button>
        </Box>
        <Typography variant="subtitle1" color="text.secondary">
          Crea e gestisci gli account degli studenti associati al tuo profilo
        </Typography>
      </Box>
      
      <Paper sx={{ borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="gestione studenti tabs">
            <Tab label="Studenti" id="student-tab-0" aria-controls="student-tabpanel-0" />
            <Tab label="Attività Recenti" id="student-tab-1" aria-controls="student-tabpanel-1" />
          </Tabs>
        </Box>
        
        <StudentTabPanel value={tabValue} index={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
          ) : students.length === 0 ? (
            <Fade in={true} timeout={500}>
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Non hai ancora creato nessun account studente.
                </Alert>
                <Typography variant="body1" gutterBottom>
                  Inizia creando un nuovo account studente cliccando sul pulsante "Nuovo Studente".
                </Typography>
              </Box>
            </Fade>
          ) : (
            <Fade in={true} timeout={800}>
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  {students.map((student, index) => (
                    <Grid 
                      item 
                      xs={12} 
                      sm={6} 
                      md={4}
                      key={student.id}
                      sx={{
                        animation: `fadeIn 300ms ease-in-out ${index * 150}ms forwards`,
                        opacity: 0,
                        '@keyframes fadeIn': {
                          '0%': {
                            opacity: 0,
                            transform: 'translateY(20px)'
                          },
                          '100%': {
                            opacity: 1,
                            transform: 'translateY(0)'
                          }
                        }
                      }}
                    >
                      {renderStudentCard(student)}
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Fade>
          )}
        </StudentTabPanel>
        
        <StudentTabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Qui verranno mostrate le attività recenti dei tuoi studenti, come quiz completati, percorsi terminati e richieste di ricompense.
            </Alert>
            {/* Implementazione futura per le attività recenti */}
            <Typography variant="body1">
              La visualizzazione dettagliata delle attività sarà disponibile a breve.
            </Typography>
          </Box>
        </StudentTabPanel>
      </Paper>
      
      {/* Dialog per creare/modificare studenti */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditMode ? 'Modifica Studente' : 'Crea Nuovo Studente'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            name="name"
            label="Nome completo"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={handleInputChange}
            error={!!formErrors.name}
            helperText={formErrors.name}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            id="username"
            name="username"
            label="Nome utente"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.username}
            onChange={handleInputChange}
            error={!!formErrors.username}
            helperText={formErrors.username || 'Lo studente userà questo nome per accedere'}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="password"
            name="password"
            label={isEditMode ? 'Nuova password (opzionale)' : 'Password'}
            type="password"
            fullWidth
            variant="outlined"
            value={formData.password}
            onChange={handleInputChange}
            error={!!formErrors.password}
            helperText={formErrors.password}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="confirmPassword"
            name="confirmPassword"
            label="Conferma password"
            type="password"
            fullWidth
            variant="outlined"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            error={!!formErrors.confirmPassword}
            helperText={formErrors.confirmPassword}
            sx={{ mb: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Annulla
          </Button>
          <Button 
            onClick={handleCreateOrUpdateStudent} 
            color="primary" 
            variant="contained"
          >
            {isEditMode ? 'Aggiorna Studente' : 'Crea Studente'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog per dettagli studente, percorsi e quiz */}
      <Dialog 
        open={openDetailsDialog} 
        onClose={handleCloseDetailsDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {selectedStudent && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar 
                src={selectedStudent.avatar || undefined} 
                sx={{ mr: 2, bgcolor: 'primary.main' }}
              >
                {selectedStudent.name.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h6">
                Dettagli di {selectedStudentName}
              </Typography>
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Box>
              <Tabs 
                value={detailsTabValue} 
                onChange={handleDetailsTabChange} 
                aria-label="dettagli studente tabs"
                sx={{ mb: 2 }}
              >
                <Tab 
                  label="Percorsi" 
                  icon={<SchoolIcon />} 
                  iconPosition="start" 
                  id="details-tab-0" 
                  aria-controls="details-tabpanel-0" 
                />
                <Tab 
                  label="Quiz" 
                  icon={<QuizIcon />} 
                  iconPosition="start" 
                  id="details-tab-1" 
                  aria-controls="details-tabpanel-1" 
                />
              </Tabs>
              <Divider sx={{ mb: 3 }} />
              
              <StudentTabPanel value={detailsTabValue} index={0}>
                {renderPathsTab()}
              </StudentTabPanel>
              
              <StudentTabPanel value={detailsTabValue} index={1}>
                {renderQuizzesTab()}
              </StudentTabPanel>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsDialog}>Chiudi</Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
};

export default ManageStudents;
