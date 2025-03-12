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
  Fab
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  Assignment as AssignmentIcon 
} from '@mui/icons-material';
import MainLayout from '../../components/layouts/MainLayout';
import HoverAnimation from '../../components/animations/HoverAnimation';
import { ApiErrorHandler } from '../../services/ApiErrorHandler';
import { NotificationsService } from '../../services/NotificationsService';
import ProgressBar from '../../components/common/ProgressBar';

interface Path {
  id: string;
  title: string;
  description: string;
  quizCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  assignedCount: number;
  completionRate: number;
}

const AdminPaths: React.FC = () => {
  const [paths, setPaths] = useState<Path[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pathToDelete, setPathToDelete] = useState<Path | null>(null);

  useEffect(() => {
    fetchPaths();
  }, []);

  const fetchPaths = async () => {
    setLoading(true);
    try {
      // Simulazione chiamata API
      // const response = await PathService.getAllPaths();
      // setPaths(response.data);
      
      // Dati di esempio
      setTimeout(() => {
        const mockPaths: Path[] = [
          { 
            id: '1', 
            title: 'Matematica base', 
            description: 'Aritmetica, frazioni e decimali per scuola primaria',
            quizCount: 12,
            difficulty: 'easy',
            tags: ['matematica', 'primaria', 'aritmetica'],
            assignedCount: 45,
            completionRate: 78
          },
          { 
            id: '2', 
            title: 'Inglese intermedio', 
            description: 'Grammatica e vocabolario per scuola secondaria',
            quizCount: 18,
            difficulty: 'medium',
            tags: ['inglese', 'secondaria', 'grammatica'],
            assignedCount: 32,
            completionRate: 65
          },
          { 
            id: '3', 
            title: 'Scienze avanzate', 
            description: 'Fisica e chimica per liceo',
            quizCount: 24,
            difficulty: 'hard',
            tags: ['scienze', 'liceo', 'fisica', 'chimica'],
            assignedCount: 22,
            completionRate: 42
          },
          { 
            id: '4', 
            title: 'Storia dell\'arte', 
            description: 'Arte italiana dal Rinascimento al Barocco',
            quizCount: 15,
            difficulty: 'medium',
            tags: ['arte', 'storia', 'rinascimento'],
            assignedCount: 18,
            completionRate: 54
          },
          { 
            id: '5', 
            title: 'Programmazione per ragazzi', 
            description: 'Concetti di base di coding e algoritmi',
            quizCount: 10,
            difficulty: 'medium',
            tags: ['tecnologia', 'coding', 'informatica'],
            assignedCount: 28,
            completionRate: 72
          }
        ];
        setPaths(mockPaths);
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

  const handleDeleteClick = (path: Path) => {
    setPathToDelete(path);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!pathToDelete) return;
    
    try {
      // Simulazione chiamata API
      // await PathService.deletePath(pathToDelete.id);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Aggiorna la lista dei percorsi rimuovendo quello cancellato
      setPaths(paths.filter(path => path.id !== pathToDelete.id));
      NotificationsService.success(`Percorso "${pathToDelete.title}" eliminato con successo`);
    } catch (error) {
      ApiErrorHandler.handleApiError(error);
    } finally {
      setDeleteDialogOpen(false);
      setPathToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPathToDelete(null);
  };

  const filteredPaths = paths.filter(path => {
    const searchLower = searchQuery.toLowerCase();
    return (
      path.title.toLowerCase().includes(searchLower) ||
      path.description.toLowerCase().includes(searchLower) ||
      path.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Percorsi di Apprendimento
          </Typography>
          <HoverAnimation>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              color="primary"
            >
              Nuovo Percorso
            </Button>
          </HoverAnimation>
        </Box>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
            <TextField
              label="Cerca percorsi"
              variant="outlined"
              size="small"
              fullWidth
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Cerca per titolo, descrizione o tag..."
            />
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filteredPaths.length > 0 ? (
                filteredPaths.map((path) => (
                  <Grid item xs={12} md={6} key={path.id}>
                    <HoverAnimation>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Typography variant="h6" component="h2" gutterBottom>
                              {path.title}
                            </Typography>
                            {getDifficultyChip(path.difficulty)}
                          </Box>
                          <Typography color="textSecondary" sx={{ mb: 2 }}>
                            {path.description}
                          </Typography>
                          <Box sx={{ display: 'flex', mb: 1 }}>
                            <AssignmentIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" color="textSecondary">
                              {path.quizCount} quiz
                            </Typography>
                          </Box>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" gutterBottom>
                              Tasso di completamento: {path.completionRate}%
                            </Typography>
                            <ProgressBar progress={path.completionRate} />
                          </Box>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {path.tags.map((tag) => (
                              <Chip 
                                key={tag} 
                                label={tag} 
                                size="small" 
                                variant="outlined" 
                              />
                            ))}
                          </Box>
                        </CardContent>
                        <Divider />
                        <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                          <Typography variant="body2" color="textSecondary">
                            Assegnato a {path.assignedCount} studenti
                          </Typography>
                          <Box>
                            <IconButton 
                              aria-label="modifica"
                              color="primary"
                              size="small"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              aria-label="elimina" 
                              color="error"
                              size="small"
                              onClick={() => handleDeleteClick(path)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </CardActions>
                      </Card>
                    </HoverAnimation>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="textSecondary">
                      Nessun percorso trovato
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Prova a modificare i criteri di ricerca o crea un nuovo percorso
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </Paper>

        {/* FAB per aggiungere velocemente un nuovo percorso */}
        <Fab 
          color="primary" 
          aria-label="add"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
        >
          <AddIcon />
        </Fab>

        {/* Dialog di conferma eliminazione */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
        >
          <DialogTitle>Conferma eliminazione</DialogTitle>
          <DialogContent>
            <Typography>
              Sei sicuro di voler eliminare il percorso "{pathToDelete?.title}"?
              Questa azione non può essere annullata e rimuoverà tutte le assegnazioni associate.
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

export default AdminPaths;
