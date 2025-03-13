import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import StudentService, { Student } from '../../services/StudentService';
import { NotificationsService } from '../../services/NotificationsService';
import { 
  Typography, Box, Paper, Alert, CircularProgress, Grid, Card, CardContent, 
  CardActions, Button, Avatar, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Chip, Divider, Tab, Tabs
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Person as PersonIcon } from '@mui/icons-material';

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
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
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
        >
          Dettagli
        </Button>
      </CardActions>
    </Card>
  );

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
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Non hai ancora creato nessun account studente.
              </Alert>
              <Typography variant="body1" gutterBottom>
                Inizia creando un nuovo account studente cliccando sul pulsante "Nuovo Studente".
              </Typography>
            </Box>
          ) : (
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {students.map((student) => (
                  <Grid item xs={12} sm={6} md={4} key={student.id}>
                    {renderStudentCard(student)}
                  </Grid>
                ))}
              </Grid>
            </Box>
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
    </MainLayout>
  );
};

export default ManageStudents;
