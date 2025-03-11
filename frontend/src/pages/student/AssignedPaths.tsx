import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  LinearProgress,
  Chip,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import { Link } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import SearchIcon from '@mui/icons-material/Search';
import PathService from '../../services/PathService';

interface Path {
  id: string;
  title: string;
  description: string;
  progress: number;
  subject: string;
  difficulty: 'facile' | 'medio' | 'difficile';
  status: 'non_iniziato' | 'in_corso' | 'completato';
  targetEndDate?: string;
}

const AssignedPaths: React.FC = () => {
  const [paths, setPaths] = useState<Path[]>([]);
  const [filteredPaths, setFilteredPaths] = useState<Path[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const fetchPaths = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await PathService.getAssignedPaths();
        
        // Mappa i campi del servizio al formato richiesto dal componente
        const mappedPaths = response.map((path) => ({
          id: path.id,
          title: path.title,
          description: path.description,
          progress: path.progress,
          subject: path.subject || 'Non specificata',
          difficulty: path.difficulty as 'facile' | 'medio' | 'difficile',
          status: path.status as 'non_iniziato' | 'in_corso' | 'completato',
          targetEndDate: path.targetEndDate,
        }));
        
        setPaths(mappedPaths);
        setFilteredPaths(mappedPaths);
      } catch (err) {
        console.error('Errore durante il recupero dei percorsi:', err);
        setError('Si è verificato un errore durante il caricamento dei percorsi. Riprova più tardi.');
      } finally {
        setLoading(false);
      }
    };

    fetchPaths();
  }, []);

  useEffect(() => {
    // Filtra i percorsi in base ai criteri di ricerca e filtro
    let filtered = [...paths];

    // Filtra per query di ricerca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (path) =>
          path.title.toLowerCase().includes(query) ||
          path.description.toLowerCase().includes(query)
      );
    }

    // Filtra per materia
    if (filterSubject) {
      filtered = filtered.filter((path) => path.subject === filterSubject);
    }

    // Filtra per stato
    if (filterStatus) {
      filtered = filtered.filter((path) => path.status === filterStatus);
    }

    setFilteredPaths(filtered);
  }, [searchQuery, filterSubject, filterStatus, paths]);

  const getUniqueSubjects = () => {
    const subjects = new Set(paths.map((path) => path.subject));
    return Array.from(subjects);
  };

  if (loading) {
    return (
      <MainLayout title="Percorsi Assegnati">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Percorsi Assegnati">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <Typography color="error">{error}</Typography>
        </Box>
      </MainLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'non_iniziato':
        return 'default';
      case 'in_corso':
        return 'primary';
      case 'completato':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'non_iniziato':
        return 'Non iniziato';
      case 'in_corso':
        return 'In corso';
      case 'completato':
        return 'Completato';
      default:
        return status;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'facile':
        return 'success';
      case 'medio':
        return 'warning';
      case 'difficile':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <MainLayout title="Percorsi Assegnati">
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          I Tuoi Percorsi Educativi
        </Typography>

        {/* Filtri e ricerca */}
        <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            label="Cerca percorsi"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Materia</InputLabel>
            <Select
              value={filterSubject}
              label="Materia"
              onChange={(e) => setFilterSubject(e.target.value)}
            >
              <MenuItem value="">Tutte</MenuItem>
              {getUniqueSubjects().map((subject) => (
                <MenuItem key={subject} value={subject}>
                  {subject}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Stato</InputLabel>
            <Select
              value={filterStatus}
              label="Stato"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="">Tutti</MenuItem>
              <MenuItem value="non_iniziato">Non iniziato</MenuItem>
              <MenuItem value="in_corso">In corso</MenuItem>
              <MenuItem value="completato">Completato</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Lista percorsi */}
        {filteredPaths.length === 0 ? (
          <Typography variant="body1">
            Nessun percorso trovato con i criteri di ricerca specificati.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {filteredPaths.map((path) => (
              <Grid item xs={12} sm={6} md={4} key={path.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="div" gutterBottom>
                      {path.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {path.description}
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">Progresso</Typography>
                        <Typography variant="body2">{path.progress}%</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={path.progress} 
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Chip 
                        label={path.subject} 
                        size="small" 
                        color="primary"
                        variant="outlined"
                      />
                      <Chip 
                        label={path.difficulty} 
                        size="small" 
                        color={getDifficultyColor(path.difficulty) as any}
                      />
                      <Chip 
                        label={getStatusLabel(path.status)} 
                        size="small" 
                        color={getStatusColor(path.status) as any}
                      />
                    </Box>
                    
                    {path.targetEndDate && (
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Data obiettivo: {new Date(path.targetEndDate).toLocaleDateString()}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button 
                      component={Link} 
                      to={`/student/path/${path.id}`} 
                      size="small" 
                      variant="contained" 
                      fullWidth
                      disabled={path.status === 'completato'}
                    >
                      {path.status === 'non_iniziato' ? 'Inizia' : path.status === 'in_corso' ? 'Continua' : 'Visualizza'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </MainLayout>
  );
};

export default AssignedPaths;
