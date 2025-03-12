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
  CardMedia,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Fab,
  InputAdornment
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  EmojiEvents as TrophyIcon,
  School as SchoolIcon,
  Stars as StarsIcon
} from '@mui/icons-material';
import MainLayout from '../../components/layouts/MainLayout';
import PageTransition from '../../components/animations/PageTransition';
import FadeInLoader from '../../components/animations/FadeInLoader';
import AnimatedCard from '../../components/animations/AnimatedCard';
import HoverAnimation from '../../components/animations/HoverAnimation';
import { ApiErrorHandler } from '../../services/ApiErrorHandler';
import { NotificationsService } from '../../services/NotificationsService';
import RewardService, { RewardTemplate, StudentRewardStats } from '../../services/RewardService';
import StudentService, { Student } from '../../services/StudentService';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

// Interfaccia per il form di creazione/modifica di un template di premio
interface RewardForm {
  title: string;
  description: string;
  category: 'digitale' | 'fisico' | 'privilegio';
  pointsCost: number;
  imageUrl?: string;
  availability: 'illimitato' | 'limitato';
  quantity?: number;
  expiryDate?: Date | null;
}

// Componente per visualizzare i riscatti recenti
const RecentRedemptions: React.FC<{
  selectedStudent: Student | null;
  studentStats: Map<string, StudentRewardStats>;
}> = ({ selectedStudent, studentStats }) => {
  if (!selectedStudent) return null;
  
  const stats = studentStats.get(selectedStudent.id);
  if (!stats || !stats.recentRedemptions || stats.recentRedemptions.length === 0) {
    return null;
  }
  
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle2" gutterBottom>Riscatti recenti:</Typography>
      {stats.recentRedemptions.map((redemption, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Typography variant="body2">
            <strong>{redemption.rewardTitle}</strong> - {redemption.date}
          </Typography>
          {index < (stats.recentRedemptions?.length || 0) - 1 && <Divider sx={{ my: 1 }} />}
        </Box>
      ))}
    </Paper>
  );
};

// Interfaccia per le statistiche di uno studente
interface StudentRewardData {
  studentId: string;
  name: string;
  totalPoints: number;
  availablePoints: number;
  redeemedRewards: number;
}

const ManageRewards: React.FC = () => {
  const { user } = useAuth();
  const [rewardTemplates, setRewardTemplates] = useState<RewardTemplate[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentStats, setStudentStats] = useState<Map<string, StudentRewardStats>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rewardToDelete, setRewardToDelete] = useState<RewardTemplate | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [studentStatsDialogOpen, setStudentStatsDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  
  // Form per nuovo reward template
  const [newReward, setNewReward] = useState<RewardForm>({
    title: '',
    description: '',
    category: 'digitale',
    pointsCost: 100,
    imageUrl: '',
    availability: 'illimitato'
  });

  useEffect(() => {
    fetchRewardTemplates();
    fetchStudents();
  }, []);

  const fetchRewardTemplates = async () => {
    setLoading(true);
    try {
      const templates = await RewardService.getAllRewardTemplates();
      setRewardTemplates(templates);
      setLoading(false);
    } catch (error) {
      ApiErrorHandler.handleApiError(error);
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const studentsData = await StudentService.getStudentsByParent();
      setStudents(studentsData);
      
      // Per ogni studente, carichiamo anche le statistiche relative ai premi
      const statsMap = new Map<string, StudentRewardStats>();
      
      await Promise.all(
        studentsData.map(async (student) => {
          try {
            const stats = await RewardService.getStudentRewardStats(student.id);
            statsMap.set(student.id, stats);
          } catch (error) {
            console.error(`Errore nel caricamento delle statistiche per lo studente ${student.id}`, error);
          }
        })
      );
      
      setStudentStats(statsMap);
    } catch (error) {
      ApiErrorHandler.handleApiError(error);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleCategoryFilterChange = (event: SelectChangeEvent) => {
    setCategoryFilter(event.target.value);
  };

  const handleDeleteClick = (template: RewardTemplate) => {
    setRewardToDelete(template);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!rewardToDelete) return;
    
    try {
      await RewardService.deleteRewardTemplate(rewardToDelete.id);
      
      // Aggiorna la lista dei template di premi rimuovendo quello cancellato
      setRewardTemplates(rewardTemplates.filter(template => template.id !== rewardToDelete.id));
      // La notifica viene già mostrata dal service
    } catch (error) {
      ApiErrorHandler.handleApiError(error);
    } finally {
      setDeleteDialogOpen(false);
      setRewardToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setRewardToDelete(null);
  };

  const handleCreateDialogOpen = () => {
    setCreateDialogOpen(true);
  };

  const handleCreateDialogClose = () => {
    setCreateDialogOpen(false);
    // Reset form
    setNewReward({
      title: '',
      description: '',
      category: 'digitale',
      pointsCost: 100,
      imageUrl: '',
      availability: 'illimitato'
    });
  };

  const handleNewRewardChange = (field: string, value: string | number | Date | null) => {
    setNewReward(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateReward = async () => {
    try {
      // Validazione
      if (!newReward.title.trim() || !newReward.description.trim() || newReward.pointsCost <= 0) {
        NotificationsService.error('Compila tutti i campi obbligatori');
        return;
      }

      // Creazione del template completo per l'API
      const templateData = {
        ...newReward,
        createdBy: user?.id || '',
        // Assicuriamoci che expiryDate sia undefined se è null
        expiryDate: newReward.expiryDate || undefined
      };
      
      // Chiamata al servizio per creare il nuovo template
      const createdTemplate = await RewardService.createRewardTemplate(templateData);
      
      // Aggiorna la lista dei template con il nuovo template
      setRewardTemplates([...rewardTemplates, createdTemplate]);
      
      // Chiudi il dialog
      handleCreateDialogClose();
    } catch (error) {
      ApiErrorHandler.handleApiError(error);
    }
  };

  const handleStudentStatsClick = (student: Student) => {
    setSelectedStudent(student);
    setStudentStatsDialogOpen(true);
  };

  const handleStudentStatsClose = () => {
    setStudentStatsDialogOpen(false);
    setSelectedStudent(null);
  };

  const filteredRewardTemplates = rewardTemplates.filter(template => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      template.title.toLowerCase().includes(searchLower) ||
      template.description.toLowerCase().includes(searchLower);
    
    const matchesCategory = categoryFilter ? template.category === categoryFilter : true;

    return matchesSearch && matchesCategory;
  });
  
  // Helper per ottenere le statistiche di uno studente
  const getStudentStats = (studentId: string): StudentRewardData => {
    const stats = studentStats.get(studentId);
    const student = students.find(s => s.id === studentId);
    
    if (!stats || !student) {
      return {
        studentId,
        name: student ? `${student.name}` : 'Studente',
        totalPoints: 0,
        availablePoints: 0,
        redeemedRewards: 0
      };
    }
    
    return {
      studentId,
      name: student.name,
      totalPoints: stats.totalPointsEarned,
      availablePoints: stats.availablePoints,
      redeemedRewards: stats.redeemedRewards
    };
  };

  const getCategoryChip = (category: string) => {
    switch (category) {
      case 'digitale':
        return <Chip icon={<StarsIcon />} label="Digitale" color="info" size="small" />;
      case 'fisico':
        return <Chip icon={<SchoolIcon />} label="Fisico" color="success" size="small" />;
      case 'privilegio':
        return <Chip icon={<TrophyIcon />} label="Privilegio" color="warning" size="small" />;
      default:
        return <Chip label={category} size="small" />;
    }
  };

  // Utilizziamo l'utility nel categoryUtils.tsx per gestire uniformemente le categorie

  return (
    <MainLayout>
      <PageTransition>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Gestione Premi
          </Typography>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            Crea e gestisci i premi che gli studenti possono ottenere accumulando punti completando attività didattiche.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2">
                  Premi disponibili
                </Typography>
                <HoverAnimation>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    color="primary"
                    onClick={handleCreateDialogOpen}
                  >
                    Nuovo Premio
                  </Button>
                </HoverAnimation>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                  label="Cerca premi"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Cerca per titolo o descrizione..."
                />
                <FormControl sx={{ minWidth: 150 }} size="small">
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    value={categoryFilter}
                    label="Categoria"
                    onChange={handleCategoryFilterChange}
                  >
                    <MenuItem value="">Tutte</MenuItem>
                    <MenuItem value="digitale">Digitale</MenuItem>
                    <MenuItem value="fisico">Fisico</MenuItem>
                    <MenuItem value="privilegio">Privilegio</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <AnimatePresence>
                  <Grid container spacing={2}>
                    {filteredRewardTemplates.length > 0 ? (
                      filteredRewardTemplates.map((template) => (
                        <Grid item xs={12} sm={6} md={4} key={template.id}>
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                          >
                            <AnimatedCard sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                {template.imageUrl && (
                                  <CardMedia
                                    component="img"
                                    height="140"
                                    image={template.imageUrl}
                                    alt={template.title}
                                  />
                                )}
                                <CardContent sx={{ flexGrow: 1 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                    <Typography variant="h6" component="h2" gutterBottom>
                                      {template.title}
                                    </Typography>
                                    {getCategoryChip(template.category)}
                                  </Box>
                                  <Typography color="textSecondary" variant="body2" gutterBottom>
                                    {template.description}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                    <StarsIcon sx={{ color: 'warning.main', mr: 0.5 }} />
                                    <Typography variant="h6" color="warning.main">
                                      {template.pointsCost} punti
                                    </Typography>
                                  </Box>
                                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                    Disponibilità: {template.availability === 'illimitato' ? 'Illimitata' : `${template.quantity || 0} rimasti`}
                                  </Typography>
                                </CardContent>
                                <Divider />
                                <CardActions sx={{ justifyContent: 'space-between' }}>
                                  <Button 
                                    size="small"
                                    startIcon={<EditIcon />}
                                  >
                                    Modifica
                                  </Button>
                                  <IconButton 
                                    aria-label="elimina" 
                                    color="error"
                                    size="small"
                                    onClick={() => handleDeleteClick(template)}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </CardActions>
                            </AnimatedCard>
                          </motion.div>
                        </Grid>
                      ))
                    ) : (
                      <Grid item xs={12}>
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <Typography variant="h6" color="textSecondary">
                            Nessun premio trovato
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Prova a modificare i criteri di ricerca o crea un nuovo premio
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </AnimatePresence>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Statistiche Studenti
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Monitora i punti accumulati e i premi riscattati dai tuoi studenti.
              </Typography>

              {students.length > 0 ? (
                <Box>
                  {students.map((student) => {
                    const studentData = getStudentStats(student.id);
                    return (
                      <HoverAnimation key={student.id}>
                        <Card sx={{ mb: 2 }}>
                          <CardContent>
                            <Typography variant="h6" component="h3">
                              {student.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                              <StarsIcon sx={{ color: 'warning.main', mr: 0.5, fontSize: 20 }} />
                              <Typography variant="body1">
                                {studentData.availablePoints} / {studentData.totalPoints} punti
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="textSecondary">
                              {studentData.redeemedRewards} premi riscattati
                            </Typography>
                          </CardContent>
                          <CardActions>
                            <Button 
                              size="small" 
                              onClick={() => handleStudentStatsClick(student)}
                            >
                              Dettagli
                            </Button>
                          </CardActions>
                        </Card>
                      </HoverAnimation>
                    );
                  })}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="textSecondary">
                    Nessuno studente trovato
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* FAB per aggiungere velocemente un nuovo premio */}
        <Fab 
          color="primary" 
          aria-label="add"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
          onClick={handleCreateDialogOpen}
        >
          <AddIcon />
        </Fab>

        {/* Dialog di creazione nuovo premio */}
        <Dialog
          open={createDialogOpen}
          onClose={handleCreateDialogClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Crea Nuovo Premio</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 1 }}>
              <TextField
                label="Titolo"
                variant="outlined"
                fullWidth
                margin="normal"
                value={newReward.title}
                onChange={(e) => handleNewRewardChange('title', e.target.value)}
                required
              />
              <TextField
                label="Descrizione"
                variant="outlined"
                fullWidth
                margin="normal"
                multiline
                rows={3}
                value={newReward.description}
                onChange={(e) => handleNewRewardChange('description', e.target.value)}
                required
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={newReward.category}
                  label="Categoria"
                  onChange={(e) => handleNewRewardChange('category', e.target.value)}
                >
                  <MenuItem value="digitale">Digitale</MenuItem>
                  <MenuItem value="fisico">Fisico</MenuItem>
                  <MenuItem value="privilegio">Privilegio</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Punti necessari"
                variant="outlined"
                fullWidth
                margin="normal"
                type="number"
                InputProps={{ 
                  endAdornment: <InputAdornment position="end">punti</InputAdornment>
                }}
                value={newReward.pointsCost}
                onChange={(e) => handleNewRewardChange('pointsCost', parseInt(e.target.value) || 0)}
                required
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Disponibilità</InputLabel>
                <Select
                  value={newReward.availability}
                  label="Disponibilità"
                  onChange={(e) => handleNewRewardChange('availability', e.target.value)}
                >
                  <MenuItem value="illimitato">Illimitata</MenuItem>
                  <MenuItem value="limitato">Limitata</MenuItem>
                </Select>
              </FormControl>
              {newReward.availability === 'limitato' && (
                <TextField
                  label="Quantità disponibile"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  type="number"
                  value={newReward.quantity || 1}
                  onChange={(e) => handleNewRewardChange('quantity', parseInt(e.target.value) || 1)}
                />
              )}
              <TextField
                label="URL Immagine (opzionale)"
                variant="outlined"
                fullWidth
                margin="normal"
                value={newReward.imageUrl || ''}
                onChange={(e) => handleNewRewardChange('imageUrl', e.target.value)}
                placeholder="https://esempio.com/immagine.jpg"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCreateDialogClose}>
              Annulla
            </Button>
            <Button 
              onClick={handleCreateReward} 
              color="primary" 
              variant="contained"
            >
              Crea Premio
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog per i dettagli dello studente */}
        <Dialog
          open={studentStatsDialogOpen}
          onClose={handleStudentStatsClose}
          maxWidth="sm"
          fullWidth
        >
          {selectedStudent && (
            <>
              <DialogTitle>
                Dettagli di {selectedStudent.name}
              </DialogTitle>
              <DialogContent>
                {studentStats.has(selectedStudent.id) ? (
                  <>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Riepilogo Punti
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                            <Typography variant="body2">Punti Totali Guadagnati</Typography>
                            <Typography variant="h4">{studentStats.get(selectedStudent.id)?.totalPointsEarned || 0}</Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={6}>
                          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
                            <Typography variant="body2">Punti Disponibili</Typography>
                            <Typography variant="h4">{studentStats.get(selectedStudent.id)?.availablePoints || 0}</Typography>
                          </Paper>
                        </Grid>
                      </Grid>
                    </Box>
                    
                    <Typography variant="h6" gutterBottom>
                      Premi Riscattati
                    </Typography>
                    {(studentStats.get(selectedStudent.id)?.redeemedRewards || 0) > 0 ? (
                      <>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          Lo studente ha riscattato {studentStats.get(selectedStudent.id)?.redeemedRewards || 0} premi.
                        </Typography>
                        <RecentRedemptions 
                          selectedStudent={selectedStudent} 
                          studentStats={studentStats} 
                        />
                      </>
                    ) : (
                      <Typography variant="body1" color="textSecondary">
                        Nessun premio riscattato finora.
                      </Typography>
                    )}
                  </>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <FadeInLoader message="Caricamento statistiche studente..." />
                  </Box>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={handleStudentStatsClose} color="primary">
                  Chiudi
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Dialog di conferma eliminazione */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
        >
          <DialogTitle>Conferma eliminazione</DialogTitle>
          <DialogContent>
            <Typography>
              Sei sicuro di voler eliminare il premio "{rewardToDelete?.title}"?
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
      </PageTransition>
    </MainLayout>
  );
};

export default ManageRewards;
