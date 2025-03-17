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

// Importazione componenti di animazione
import { 
  FadeIn, 
  SlideInUp, 
  SlideInLeft, 
  SlideInRight,
  HoverAnimation 
} from '../../components/animations/Transitions';
import { 
  LoadingIndicator, 
  ProgressBar,
  CardSkeleton 
} from '../../components/animations/LoadingAnimations';
import { AnimatedPage, AnimatedList } from '../../components/animations/PageTransitions';

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
          targetEndDate: path.targetEndDate ? path.targetEndDate.toISOString() : undefined,
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
          (path.description && path.description.toLowerCase().includes(query))
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

  const getActionButtonLabel = (status: string) => {
    switch (status) {
      case 'non_iniziato':
        return 'Inizia';
      case 'in_corso':
        return 'Continua';
      case 'completato':
        return 'Visualizza';
      default:
        return 'Inizia';
    }
  };

  return (
    <AnimatedPage transitionType="fade">
      <MainLayout title="Percorsi Assegnati">
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <FadeIn>
            <Typography variant="h4" component="h1" gutterBottom>
              I Tuoi Percorsi Assegnati
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Esplora i percorsi assegnati e monitora i tuoi progressi
            </Typography>
          </FadeIn>

          {/* Filtri e ricerca */}
          <SlideInUp delay={0.2}>
            <Box sx={{ mb: 4, mt: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Cerca percorsi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Filtra per materia</InputLabel>
                    <Select
                      value={filterSubject}
                      label="Filtra per materia"
                      onChange={(e) => setFilterSubject(e.target.value)}
                    >
                      <MenuItem value="">Tutte le materie</MenuItem>
                      {getUniqueSubjects().map((subject) => (
                        <MenuItem key={subject} value={subject}>
                          {subject}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Filtra per stato</InputLabel>
                    <Select
                      value={filterStatus}
                      label="Filtra per stato"
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <MenuItem value="">Tutti gli stati</MenuItem>
                      <MenuItem value="non_iniziato">Non iniziato</MenuItem>
                      <MenuItem value="in_corso">In corso</MenuItem>
                      <MenuItem value="completato">Completato</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </SlideInUp>

          {/* Risultati della ricerca */}
          {loading ? (
            <Grid container spacing={3}>
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item}>
                  <CardSkeleton height={280} />
                </Grid>
              ))}
            </Grid>
          ) : error ? (
            <SlideInLeft>
              <Box sx={{ p: 3, bgcolor: 'error.light', borderRadius: 2, color: 'error.dark' }}>
                <Typography variant="h6">{error}</Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  sx={{ mt: 2 }}
                  onClick={() => window.location.reload()}
                >
                  Riprova
                </Button>
              </Box>
            </SlideInLeft>
          ) : filteredPaths.length === 0 ? (
            <SlideInUp>
              <Box 
                sx={{ 
                  p: 5, 
                  textAlign: 'center', 
                  bgcolor: 'background.paper', 
                  borderRadius: 2,
                  boxShadow: 1
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Nessun percorso trovato
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Nessun percorso corrisponde ai criteri di ricerca selezionati.
                </Typography>
                <Button 
                  variant="contained" 
                  sx={{ mt: 2 }}
                  onClick={() => {
                    setSearchQuery('');
                    setFilterSubject('');
                    setFilterStatus('');
                  }}
                >
                  Cancella filtri
                </Button>
              </Box>
            </SlideInUp>
          ) : (
            <Grid container spacing={4} sx={{ mt: 2, px: 1 }}>
              <AnimatedList>
                {filteredPaths.map((path, index) => (
                  <Grid item xs={12} sm={12} md={8} lg={6} key={path.id}>
                    <HoverAnimation delay={index * 0.1}>
                      <Card 
                        elevation={3} 
                        sx={{ 
                          height: '100%', 
                          display: 'flex', 
                          flexDirection: 'column',
                          position: 'relative',
                          overflow: 'visible',
                          minHeight: '224px',
                          minWidth: '375px'
                        }}
                      >
                        {path.status === 'completato' && (
                          <Box 
                            sx={{ 
                              position: 'absolute', 
                              top: -10, 
                              right: -10, 
                              bgcolor: 'success.main', 
                              color: 'white',
                              px: 2,
                              py: 0.5,
                              borderRadius: 1,
                              zIndex: 1,
                              transform: 'rotate(5deg)',
                              boxShadow: 2
                            }}
                          >
                            Completato
                          </Box>
                        )}
                        <CardContent sx={{ flexGrow: 1, p: 3 }}>
                          <Typography variant="h5" component="h2" gutterBottom>
                            {path.title}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                            <Chip 
                              size="small" 
                              label={path.subject} 
                              color="primary" 
                              variant="outlined" 
                            />
                            <Chip
                              size="small"
                              label={getStatusLabel(path.difficulty)}
                              color={getDifficultyColor(path.difficulty)}
                            />
                            {path.targetEndDate && (
                              <Chip
                                size="small"
                                label={`Scadenza: ${new Date(path.targetEndDate).toLocaleDateString()}`}
                                color="secondary"
                                variant="outlined"
                              />
                            )}
                          </Box>
                          <Typography variant="body1" color="text.secondary" paragraph>
                            {path.description && (
                              path.description.length > 100
                              ? `${path.description.substring(0, 100)}...`
                              : path.description
                            )}
                          </Typography>
                          <Box sx={{ mb: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2" fontWeight="medium">Progresso</Typography>
                              <Typography variant="body2" fontWeight="medium">{path.progress}%</Typography>
                            </Box>
                            <ProgressBar 
                              progress={path.progress}
                              height={12}
                              showLabel={false}
                            />
                          </Box>
                        </CardContent>
                        <CardActions sx={{ p: 2 }}>
                          <Button 
                            component={Link} 
                            to={`/student/path/${path.id}`} 
                            variant="contained" 
                            fullWidth
                            size="large"
                            disabled={path.status === 'completato'}
                          >
                            {getActionButtonLabel(path.status)}
                          </Button>
                        </CardActions>
                      </Card>
                    </HoverAnimation>
                  </Grid>
                ))}
              </AnimatedList>
            </Grid>
          )}
        </Box>
      </MainLayout>
    </AnimatedPage>
  );
};

export default AssignedPaths;
