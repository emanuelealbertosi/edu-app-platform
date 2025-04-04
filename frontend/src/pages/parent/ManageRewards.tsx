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
  InputAdornment,
  Tabs,
  Tab,
  Badge,
  Alert,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  ListItemSecondaryAction
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  EmojiEvents as TrophyIcon,
  School as SchoolIcon,
  Stars as StarsIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Cancel as CancelIcon,
  AssignmentTurnedIn as AssignIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Refresh as RefreshIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import MainLayout from '../../components/layout/MainLayout';
import PageTransition from '../../components/animations/PageTransition';
import FadeInLoader from '../../components/animations/FadeInLoader';
import AnimatedCard from '../../components/animations/AnimatedCard';
import HoverAnimation from '../../components/animations/HoverAnimation';
import { ApiErrorHandler } from '../../services/ApiErrorHandler';
import { NotificationsService } from '../../services/NotificationsService';
import RewardService, { RewardTemplate, StudentRewardStats, PendingReward } from '../../services/RewardService';
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
function RecentRedemptions({ selectedStudent, studentStats }: {
  selectedStudent: Student | null;
  studentStats: Map<string, StudentRewardStats>;
}) {
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
}

// Interfaccia per le statistiche di uno studente
interface StudentRewardData {
  studentId: string;
  name: string;
  totalPoints: number;
  availablePoints: number;
  redeemedRewards: number;
}

function ManageRewards() {
  const { user } = useAuth();
  const [rewardTemplates, setRewardTemplates] = useState<RewardTemplate[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentStats, setStudentStats] = useState<Map<string, StudentRewardStats>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rewardToDelete, setRewardToDelete] = useState<RewardTemplate | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  // Stati per le tab e le richieste in sospeso
  const [tabValue, setTabValue] = useState<number>(0);
  const [assignedRewards, setAssignedRewards] = useState<any[]>([]);
  // Utilizziamo un tipo esteso di PendingReward per la UI
  interface ExtendedPendingReward extends PendingReward {
    category?: string;
    description?: string;
  }
  const [pendingRewards, setPendingRewards] = useState<ExtendedPendingReward[]>([]);
  const [pendingLoading, setPendingLoading] = useState<boolean>(false);
  
  // Stati per l'assegnazione dei premi
  const [assignDialogOpen, setAssignDialogOpen] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<RewardTemplate | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentStatsDialogOpen, setStudentStatsDialogOpen] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [assignLoading, setAssignLoading] = useState<boolean>(false);
  
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
    
    // Caricamento dei dati in base alla tab attiva
    if (tabValue === 1) {
      fetchPendingRewards();
    } else if (tabValue === 2) {
      // Carica le statistiche degli studenti se siamo nella tab statistiche
      fetchStudentsWithStats();
    } else if (tabValue === 3) {
      // Carica le ricompense assegnate
      fetchAssignedRewards();
    }
  }, [tabValue]);
  
  // Funzione per caricare le ricompense assegnate (non ancora riscattate)
  const fetchAssignedRewards = async () => {
    console.log('Inizio fetchAssignedRewards');
    setLoading(true);
    try {
      if (students.length === 0) {
        console.log('Nessuno studente trovato, impossibile caricare le ricompense assegnate');
        setLoading(false);
        return;
      }

      console.log('Studenti trovati:', students);
      
      // Ottieni tutte le ricompense assegnate e non ancora riscattate per gli studenti di questo genitore
      const assignedRewardsData = await Promise.all(
        students.map(async (student) => {
          console.log(`Caricamento ricompense per studente: ${student.name} (${student.id})`);
          try {
            // Utilizziamo getUnredeemedRewards invece di recentRedemptions per ottenere i premi assegnati
            // ma non ancora riscattati
            console.log(`Chiamata a getUnredeemedRewards per lo studente ${student.id}`);
            const unredeemed = await RewardService.getUnredeemedRewards(student.id);
            console.log(`Ricompense non riscattate per ${student.name}:`, unredeemed);
            
            // Aggiungiamo il nome dello studente per la visualizzazione
            return unredeemed.map(reward => ({
              ...reward,
              studentName: student.name,
              // Aggiungiamo un campo per l'etichetta di stato
              statusLabel: reward.status === 'disponibile' ? 'Disponibile' : 
                         reward.status === 'riscattato' ? 'Riscattato' : 
                         reward.status === 'consegnato' ? 'Consegnato' : 'Scaduto'
            }));
          } catch (error) {
            console.error(`Errore nel caricamento delle ricompense per lo studente ${student.id}`, error);
            return [];
          }
        })
      );
      
      // Unisci tutti i dati in un unico array
      const allAssignedRewards = assignedRewardsData.flat();
      console.log('Tutte le ricompense assegnate trovate:', allAssignedRewards);
        
      setAssignedRewards(allAssignedRewards);
      setLoading(false);
    } catch (error) {
      console.error('Errore generale in fetchAssignedRewards:', error);
      ApiErrorHandler.handleApiError(error);
      setLoading(false);
    }
  };
  
  // Funzione per revocare un premio assegnato
  const handleRevokeReward = async (rewardId: string) => {
    // Chiede conferma prima di procedere
    if (!window.confirm('Sei sicuro di voler revocare questo premio? I punti verranno restituiti allo studente.')) {
      return;
    }
    
    setLoading(true);
    try {
      // Chiamata al servizio per revocare il premio
      const success = await RewardService.revokeReward(rewardId);
      
      if (success) {
        // Rimuove il premio dalla lista locale senza dover ricaricare tutto
        setAssignedRewards(prev => prev.filter(reward => reward.id !== rewardId));
        
        // In un'implementazione reale, dovremmo anche aggiornare le statistiche dello studente
        // per riflettere i punti restituiti, ma per questa implementazione di esempio
        // ci limitiamo a rimuovere visivamente il premio dalla lista
      }
    } catch (error) {
      console.error('Errore durante la revoca del premio:', error);
      ApiErrorHandler.handleApiError(error);
    } finally {
      setLoading(false);
    }
  };
  
  // Funzione per caricare studenti con tutte le loro statistiche
  const fetchStudentsWithStats = async () => {
    setLoading(true);
    try {
      await Promise.all(
        students.map(student => fetchStudentStats(student.id))
      );
      setLoading(false);
    } catch (error) {
      ApiErrorHandler.handleApiError(error);
      setLoading(false);
    }
  };
  
  // Funzione per recuperare le richieste di premio in attesa di approvazione
  const fetchPendingRewards = async () => {
    setPendingLoading(true);
    try {
      const rewards = await RewardService.getPendingRewards();
      // Aggiungiamo al tipo PendingReward le proprietà aggiuntive necessarie per la visualizzazione
      // senza modificare l'originale
      setPendingRewards(rewards.map(reward => ({
        ...reward,
        // Aggiungiamo proprietà per la visualizzazione nella UI
        category: 'digitale',
        description: '' // Placeholder vuoto per compatibilità con l'interfaccia UI
      })));
      setPendingLoading(false);
    } catch (error) {
      ApiErrorHandler.handleApiError(error);
      setPendingLoading(false);
    }
  };
  
  // Funzione per ottenere le statistiche di uno studente specifico
  const fetchStudentStats = async (studentId: string) => {
    try {
      const stats = await RewardService.getStudentRewardStats(studentId);
      setStudentStats(prev => {
        const newMap = new Map(prev);
        newMap.set(studentId, stats);
        return newMap;
      });
    } catch (error) {
      console.error(`Errore nel caricamento delle statistiche per lo studente ${studentId}`, error);
      ApiErrorHandler.handleApiError(error);
    }
  };

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

  const handleEditClick = (template: RewardTemplate) => {
    // Imposta i dati del template selezionato nel form di modifica
    setNewReward({
      title: template.title,
      description: template.description,
      category: template.category as 'digitale' | 'fisico' | 'privilegio',
      pointsCost: template.pointsCost,
      imageUrl: template.imageUrl || '',
      availability: template.quantity ? 'limitato' : 'illimitato',
      quantity: template.quantity || undefined,
      expiryDate: template.expiryDate ? new Date(template.expiryDate) : null
    });
    
    // Imposta la modalità di modifica
    setIsEditMode(true);
    setEditingRewardId(template.id);
    
    // Apre il dialog
    setCreateDialogOpen(true);
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
    setIsEditMode(false);
    setCreateDialogOpen(true);
  };

  const handleCreateDialogClose = () => {
    setCreateDialogOpen(false);
    setIsEditMode(false);
    setEditingRewardId(null);
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

  const handleCreateOrUpdateReward = async () => {
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
      
      if (isEditMode && editingRewardId) {
        // Aggiornamento di un template esistente
        const updatedTemplate = await RewardService.updateRewardTemplate(editingRewardId, templateData);
        
        // Aggiorna la lista dei template sostituendo quello modificato
        const updatedTemplates = rewardTemplates.map(template => 
          template.id === editingRewardId ? updatedTemplate : template
        );
        setRewardTemplates(updatedTemplates);
        
        NotificationsService.success('Premio aggiornato con successo');
      } else {
        // Chiamata al servizio per creare il nuovo template
        const createdTemplate = await RewardService.createRewardTemplate(templateData);
        
        // Aggiorna la lista dei template con il nuovo template
        setRewardTemplates([...rewardTemplates, createdTemplate]);
        
        NotificationsService.success('Nuovo premio creato con successo');
      }
      
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
  
  // Funzione per aprire il dialog di assegnazione premio
  const handleAssignClick = (template: RewardTemplate) => {
    setSelectedTemplate(template);
    setSelectedStudentId(students.length > 0 ? students[0].id : '');
    setAssignDialogOpen(true);
  };
  
  // Funzione per chiudere il dialog di assegnazione premio
  const handleAssignDialogClose = () => {
    setAssignDialogOpen(false);
    setSelectedTemplate(null);
    setSelectedStudentId('');
  };
  
  // Funzione per assegnare un premio a uno studente
  const handleAssignReward = async () => {
    if (!selectedTemplate || !selectedStudentId) {
      NotificationsService.error('Seleziona un template e uno studente validi');
      return;
    }
    
    setAssignLoading(true);
    
    try {
      console.log('Assegnazione premio:', {
        template: selectedTemplate,
        studentId: selectedStudentId
      });
      
      // Se l'ID del template inizia con 'temp_', mostro un messaggio che spiega cosa sta succedendo
      if (selectedTemplate.id.startsWith('temp_')) {
        NotificationsService.info(
          'Il premio è temporaneo e deve essere prima salvato sul server. Attendere per favore.',
          'Salvataggio premio in corso'
        );
      }
      
      const result = await RewardService.assignRewardToStudent(selectedStudentId, selectedTemplate);
      
      if (result) {
        // Aggiorniamo le statistiche dello studente
        await fetchStudentStats(selectedStudentId);
        
        // Aggiorna anche la lista dei template in caso fosse stato creato un nuovo template sul backend
        await fetchRewardTemplates();
        
        // Aggiorna la lista delle ricompense assegnate
        await fetchAssignedRewards();
        
        NotificationsService.success(
          `Premio "${selectedTemplate.title}" assegnato con successo allo studente`,
          'Premio assegnato'
        );
        
        handleAssignDialogClose();
      } else {
        // RewardService.assignRewardToStudent già mostra una notifica di errore
        console.error('Impossibile assegnare il premio: nessun risultato restituito');
        
        NotificationsService.error(
          'Non è stato possibile completare l\'assegnazione del premio. Controlla i log per maggiori dettagli.',
          'Errore di assegnazione'
        );
      }
    } catch (error: any) {
      console.error('Errore durante l\'assegnazione del premio:', error);
      
      // Mostra informazioni più dettagliate sull'errore
      if (error.response?.data?.detail) {
        NotificationsService.error(
          `Errore durante l'assegnazione: ${error.response.data.detail}`,
          'Errore dal server'
        );
      } else {
        ApiErrorHandler.handleApiError(error);
      }
    } finally {
      setAssignLoading(false);
    }
  };
  
  // Funzione per approvare un premio in attesa
  const handleApproveReward = async (rewardId: string) => {
    try {
      await RewardService.approveReward(rewardId);
      // Aggiorniamo la lista rimuovendo il premio approvato
      setPendingRewards(pendingRewards.filter(reward => reward.id !== rewardId));
      NotificationsService.success('Premio approvato con successo', 'Approvato');
      // Aggiorniamo anche le statistiche degli studenti
      fetchStudents();
    } catch (error) {
      ApiErrorHandler.handleApiError(error);
    }
  };
  
  // Funzione per rifiutare un premio in attesa
  const handleRejectReward = async (rewardId: string) => {
    try {
      await RewardService.rejectReward(rewardId);
      // Aggiorniamo la lista rimuovendo il premio rifiutato
      setPendingRewards(pendingRewards.filter(reward => reward.id !== rewardId));
      NotificationsService.success('Premio rifiutato con successo', 'Rifiutato');
      // Aggiorniamo anche le statistiche degli studenti
      fetchStudents();
    } catch (error) {
      ApiErrorHandler.handleApiError(error);
    }
  };
  
  // Gestione del cambio di tab
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Se passiamo alla tab delle richieste, aggiorniamo la lista
    if (newValue === 1) {
      fetchPendingRewards();
    }
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
    <MainLayout title="Gestione Premi">
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

        <Box sx={{ width: '100%', mb: 3 }}>
          <Paper sx={{ p: 0 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
              aria-label="gestione premi tabs"
            >
              <Tab 
                label="Template" 
                icon={<StarsIcon />} 
                iconPosition="start" 
              />
              <Tab 
                label={
                  <Badge badgeContent={pendingRewards.length} color="error" max={99}>
                    Richieste in sospeso
                  </Badge>
                } 
                icon={<ApproveIcon />} 
                iconPosition="start" 
              />
              <Tab 
                label="Statistiche" 
                icon={<BarChartIcon />} 
                iconPosition="start" 
              />
              <Tab 
                label="Premi Assegnati" 
                icon={<AssignmentTurnedInIcon />} 
                iconPosition="start" 
              />
            </Tabs>
          </Paper>
        </Box>
        
        <Grid container spacing={3}>
          {tabValue === 0 ? (
            // TAB 1: Template premi
            <Grid item xs={12}>
              <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" component="h2">
                    Template premi
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
                                    <Box>
                                      <Button 
                                        size="small"
                                        startIcon={<EditIcon />}
                                        onClick={() => handleEditClick(template)}
                                        sx={{ mr: 1 }}
                                      >
                                        Modifica
                                      </Button>
                                      <Button
                                        size="small"
                                        startIcon={<AssignIcon />}
                                        color="success"
                                        onClick={() => handleAssignClick(template)}
                                      >
                                        Assegna
                                      </Button>
                                    </Box>
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
          ) : tabValue === 1 ? (
            // TAB 2: Richieste in sospeso
            <Grid item xs={12}>
              <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" component="h2">
                    Richieste in sospeso
                  </Typography>
                  <Button 
                    variant="outlined"
                    color="primary"
                    onClick={fetchPendingRewards}
                    startIcon={<RefreshIcon />}
                  >
                    Aggiorna
                  </Button>
                </Box>
                
                {pendingLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    {pendingRewards.length > 0 ? (
                      <List>
                        {pendingRewards.map((reward) => (
                          <Paper key={reward.id} elevation={1} sx={{ mb: 2 }}>
                            <ListItem>
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: 'warning.main' }}>
                                  <StarsIcon />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="subtitle1">{reward.title}</Typography>
                                    {getCategoryChip('digitale')}
                                  </Box>
                                }
                                secondary={
                                  <>
                                    <Typography variant="body2" component="span">
                                      Richiesto da: <strong>{reward.studentName}</strong> - {reward.cost} punti
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      Richiesto il: {reward.requestDate}
                                    </Typography>
                                  </>
                                }
                              />
                              <ListItemSecondaryAction>
                                <Tooltip title="Approva richiesta">
                                  <IconButton 
                                    edge="end" 
                                    color="success" 
                                    onClick={() => handleApproveReward(reward.id)}
                                    sx={{ mr: 1 }}
                                  >
                                    <ApproveIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Rifiuta richiesta">
                                  <IconButton 
                                    edge="end" 
                                    color="error"
                                    onClick={() => handleRejectReward(reward.id)}
                                  >
                                    <RejectIcon />
                                  </IconButton>
                                </Tooltip>
                              </ListItemSecondaryAction>
                            </ListItem>
                          </Paper>
                        ))}
                      </List>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h6" color="textSecondary">
                          Nessuna richiesta in sospeso
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Al momento non ci sono richieste di riscatto da approvare
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
              </Paper>
            </Grid>
          ) : tabValue === 2 ? (
            // TAB 3: Statistiche studenti
            <Grid item xs={12}>
              <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" component="h2">
                    Statistiche Studenti
                  </Typography>
                  <Button 
                    variant="outlined"
                    color="primary"
                    onClick={fetchStudentsWithStats}
                    startIcon={<RefreshIcon />}
                  >
                    Aggiorna
                  </Button>
                </Box>
                
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    {students.length > 0 ? (
                      <Grid container spacing={3}>
                        {students.map((student) => {
                          const studentData = getStudentStats(student.id);
                          return (
                            <Grid item xs={12} md={6} lg={4} key={student.id}>
                              <HoverAnimation>
                                <Card sx={{ height: '100%' }}>
                                  <CardContent>
                                    <Typography variant="h6" component="h3" gutterBottom>
                                      {student.name}
                                    </Typography>
                                    
                                    <Grid container spacing={2} sx={{ mb: 2 }}>
                                      <Grid item xs={6}>
                                        <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                                          <Typography variant="body2">Punti totali</Typography>
                                          <Typography variant="h5">{studentData.totalPoints}</Typography>
                                        </Paper>
                                      </Grid>
                                      
                                      <Grid item xs={6}>
                                        <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
                                          <Typography variant="body2">Disponibili</Typography>
                                          <Typography variant="h5">{studentData.availablePoints}</Typography>
                                        </Paper>
                                      </Grid>
                                    </Grid>
                                    
                                    <Divider sx={{ my: 2 }} />
                                    
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <Typography variant="body1">
                                        Premi riscattati:
                                      </Typography>
                                      <Chip 
                                        label={studentData.redeemedRewards} 
                                        color="primary" 
                                        variant="outlined"
                                      />
                                    </Box>
                                    
                                    {(() => {
                                      // Get student stats and redemptions safely
                                      const stats = studentStats.get(student.id);
                                      const redemptions = stats?.recentRedemptions || [];
                                      
                                      return redemptions.length > 0 && (
                                        <Box sx={{ mt: 2 }}>
                                          <Typography variant="subtitle2" gutterBottom>
                                            Riscatti recenti:
                                          </Typography>
                                          {redemptions.slice(0, 2).map((redemption, idx) => (
                                          <Box key={idx} sx={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between',
                                            bgcolor: 'background.default',
                                            p: 1,
                                            borderRadius: 1,
                                            mb: 1,
                                          }}>
                                            <Typography variant="body2" noWrap sx={{ maxWidth: '70%' }}>
                                              {redemption.rewardTitle}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                              {redemption.date}
                                            </Typography>
                                          </Box>
                                        ))}
                                      </Box>
                                    );
                                    })()}
                                  </CardContent>
                                  <CardActions>
                                    <Button 
                                      size="small" 
                                      onClick={() => handleStudentStatsClick(student)}
                                      color="primary"
                                    >
                                      Dettagli completi
                                    </Button>
                                  </CardActions>
                                </Card>
                              </HoverAnimation>
                            </Grid>
                          );
                        })}
                      </Grid>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h6" color="textSecondary">
                          Nessuno studente trovato
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Non ci sono studenti registrati al momento.
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
              </Paper>
            </Grid>
          ) : (
            // TAB 4: Premi assegnati
            <Grid item xs={12}>
              <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" component="h2">
                    Premi Assegnati
                  </Typography>
                  <Button 
                    variant="outlined"
                    color="primary"
                    onClick={fetchAssignedRewards}
                    startIcon={<RefreshIcon />}
                  >
                    Aggiorna
                  </Button>
                </Box>
                
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    {assignedRewards.length > 0 ? (
                      <List>
                        {assignedRewards.map((reward, index) => (
                          <HoverAnimation key={index}>
                            <Paper elevation={1} sx={{ mb: 2 }}>
                              <ListItem
                                secondaryAction={
                                  <Tooltip title="Revoca Premio">
                                    <IconButton 
                                      edge="end" 
                                      aria-label="revoca" 
                                      color="error"
                                      onClick={() => handleRevokeReward(reward.id)}
                                      disabled={loading}
                                    >
                                      <CancelIcon />
                                    </IconButton>
                                  </Tooltip>
                                }
                              >
                                <ListItemAvatar>
                                  <Avatar sx={{ bgcolor: 'success.main' }}>
                                    <AssignmentTurnedInIcon />
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="subtitle1">{reward.title}</Typography>
                                      <Chip 
                                        size="small" 
                                        color={reward.status === 'disponibile' ? 'success' : 'default'}
                                        label={reward.statusLabel || 'Assegnato'} 
                                      />
                                    </Box>
                                  }
                                  secondary={
                                    <>
                                      <Typography variant="body2" component="span">
                                        Assegnato a: <strong>{reward.studentName}</strong>
                                      </Typography>
                                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                        <StarsIcon sx={{ color: 'warning.main', mr: 0.5, fontSize: 16 }} />
                                        <Typography variant="caption" color="textSecondary">
                                          {reward.pointsCost} punti
                                        </Typography>
                                      </Box>
                                    </>
                                  }
                                />
                              </ListItem>
                            </Paper>
                          </HoverAnimation>
                        ))}
                      </List>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h6" color="textSecondary">
                          Nessun premio assegnato
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Non hai ancora assegnato premi ai tuoi studenti.
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
              </Paper>
            </Grid>
          )}
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

        {/* Dialog per assegnare un premio a uno studente */}
        <Dialog
          open={assignDialogOpen}
          onClose={handleAssignDialogClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Assegna Premio</DialogTitle>
          <DialogContent>
            {selectedTemplate && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Stai per assegnare il premio: <strong>{selectedTemplate.title}</strong>
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {selectedTemplate.description}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
                  <StarsIcon sx={{ color: 'warning.main', mr: 0.5 }} />
                  <Typography variant="subtitle2" color="warning.main">
                    {selectedTemplate.pointsCost} punti
                  </Typography>
                </Box>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Studente</InputLabel>
                  <Select
                    value={selectedStudentId}
                    label="Studente"
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    disabled={assignLoading}
                  >
                    {students.map(student => (
                      <MenuItem key={student.id} value={student.id}>
                        {student.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}
            {assignLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleAssignDialogClose} disabled={assignLoading}>Annulla</Button>
            <Button 
              onClick={handleAssignReward} 
              color="primary" 
              variant="contained"
              disabled={!selectedTemplate || !selectedStudentId || assignLoading}
            >
              {assignLoading ? 'Assegnazione in corso...' : 'Assegna'}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Dialog di creazione nuovo premio */}
        <Dialog
          open={createDialogOpen}
          onClose={handleCreateDialogClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{isEditMode ? 'Modifica Premio' : 'Crea Nuovo Premio'}</DialogTitle>
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
              onClick={handleCreateOrUpdateReward} 
              color="primary" 
              variant="contained"
            >
              {isEditMode ? 'Aggiorna Premio' : 'Crea Premio'}
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
}

export default ManageRewards;