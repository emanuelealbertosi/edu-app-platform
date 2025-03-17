import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Paper,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MainLayout from '../../components/layout/MainLayout';
import PathService from '../../services/PathService';
import { NotificationsService } from '../../services/NotificationsService';

// Importazione componenti di animazione
import { 
  FadeIn, 
  SlideInUp, 
  SlideInLeft,
  HoverAnimation 
} from '../../components/animations/Transitions';
import { 
  LoadingIndicator, 
  ProgressBar
} from '../../components/animations/LoadingAnimations';
import { AnimatedPage } from '../../components/animations/PageTransitions';

interface Quiz {
  id: string;
  title: string;
  description: string;
  status: 'locked' | 'available' | 'completed';
  completedAt?: string;
  pointsAwarded?: number;
}

interface PathDetail {
  id: string;
  title: string;
  description: string;
  progress: number;
  subject: string;
  difficulty: 'facile' | 'medio' | 'difficile';
  status: 'non_iniziato' | 'in_corso' | 'completato';
  quizzes: Quiz[];
}

const PathDetail: React.FC = () => {
  const { pathId } = useParams<{ pathId: string }>();
  const navigate = useNavigate();
  const [path, setPath] = useState<PathDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPathDetail = async () => {
      if (!pathId) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await PathService.getPathDetail(pathId);
        setPath(response);
      } catch (err) {
        console.error('Errore durante il recupero dei dettagli del percorso:', err);
        setError('Si è verificato un errore durante il caricamento dei dettagli del percorso. Riprova più tardi.');
        NotificationsService.error('Errore di caricamento', 'Non è stato possibile caricare i dettagli del percorso');
      } finally {
        setLoading(false);
      }
    };

    fetchPathDetail();
  }, [pathId]);

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

  const getQuizStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'locked':
        return <LockIcon color="disabled" />;
      case 'available':
        return <AssignmentIcon color="primary" />;
      default:
        return <AssignmentIcon />;
    }
  };

  const handleStartQuiz = (quizId: string) => {
    if (!pathId) return;
    console.log(`Navigazione al quiz ${quizId} nel percorso ${pathId}`);
    navigate(`/student/path/${pathId}/quiz/${quizId}`);
  };

  if (loading) {
    return (
      <MainLayout title="Dettaglio Percorso">
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <LoadingIndicator text="Caricamento dettagli percorso..." size={50} />
        </Box>
      </MainLayout>
    );
  }

  if (error || !path) {
    return (
      <MainLayout title="Errore">
        <Box sx={{ p: 3 }}>
          <SlideInLeft>
            <Paper sx={{ p: 3, bgcolor: 'error.light', color: 'error.dark', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                {error || 'Percorso non trovato'}
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/student/paths')}
                sx={{ mt: 2 }}
              >
                Torna ai percorsi
              </Button>
            </Paper>
          </SlideInLeft>
        </Box>
      </MainLayout>
    );
  }

  return (
    <AnimatedPage transitionType="fade">
      <MainLayout title={path.title}>
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/student/paths')}
            sx={{ mb: 3 }}
          >
            Torna ai percorsi
          </Button>

          <FadeIn>
            <Typography variant="h4" component="h1" gutterBottom>
              {path.title}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Chip 
                label={path.subject} 
                color="primary" 
                variant="outlined" 
              />
              <Chip
                label={getStatusLabel(path.difficulty)}
                color={getDifficultyColor(path.difficulty)}
              />
              <Chip
                label={getStatusLabel(path.status)}
                color={path.status === 'completato' ? 'success' : 'default'}
              />
            </Box>
            
            <Typography variant="body1" paragraph>
              {path.description}
            </Typography>
          </FadeIn>

          <SlideInUp delay={0.2}>
            <Box sx={{ mt: 4, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6">Progresso totale</Typography>
                <Typography variant="h6">{path.progress}%</Typography>
              </Box>
              <ProgressBar 
                progress={path.progress}
                height={16}
                showLabel={false}
              />
            </Box>
          </SlideInUp>

          <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
            Quiz disponibili
          </Typography>

          <Grid container spacing={3}>
            {path.quizzes.map((quiz, index) => (
              <Grid item xs={12} md={6} key={quiz.id}>
                <HoverAnimation delay={index * 0.1}>
                  <Card 
                    elevation={3} 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      opacity: quiz.status === 'locked' ? 0.7 : 1
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="h6" component="h2">
                          {quiz.title}
                        </Typography>
                        {getQuizStatusIcon(quiz.status)}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {quiz.description}
                      </Typography>
                      
                      {quiz.status === 'completed' && (
                        <Box sx={{ mt: 2, p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                          <Typography variant="body2">
                            Completato il: {new Date(quiz.completedAt!).toLocaleDateString()}
                          </Typography>
                          <Typography variant="body2">
                            Punti guadagnati: {quiz.pointsAwarded}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                    <CardActions sx={{ p: 2 }}>
                      <Button 
                        variant={quiz.status === 'completed' ? 'outlined' : 'contained'} 
                        fullWidth
                        size="large"
                        disabled={quiz.status === 'locked'}
                        onClick={() => handleStartQuiz(quiz.id)}
                      >
                        {quiz.status === 'completed' ? 'Rivedi' : quiz.status === 'locked' ? 'Bloccato' : 'Inizia quiz'}
                      </Button>
                    </CardActions>
                  </Card>
                </HoverAnimation>
              </Grid>
            ))}
          </Grid>
        </Box>
      </MainLayout>
    </AnimatedPage>
  );
};

export default PathDetail;
