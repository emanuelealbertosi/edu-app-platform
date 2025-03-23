import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Chip,
  Grid,
  Container
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MainLayout from '../../components/layout/MainLayout';
import QuizService from '../../services/QuizService';
import { NotificationsService } from '../../services/NotificationsService';
import { 
  FadeIn, 
  SlideInUp
} from '../../components/animations/Transitions';
import { LoadingIndicator } from '../../components/animations/LoadingAnimations';
import { AnimatedPage } from '../../components/animations/PageTransitions';

interface QuizResultData {
  id: string;
  title: string;
  description?: string;
  score: number;
  maxScore: number;
  percentage: number;
  pointsAwarded?: number;
  alreadyCompleted?: boolean;
  message?: string;
  completedAt?: string;
}

const QuizResults: React.FC = () => {
  const { quizId, pathId } = useParams<{ quizId: string; pathId?: string }>();
  const navigate = useNavigate();
  
  const [result, setResult] = useState<QuizResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (!quizId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Retrieving results for quiz ID: ${quizId}`);
        const data = await QuizService.getQuizResults(quizId);
        
        setResult(data);
      } catch (err: any) {
        console.error('Error fetching quiz results:', err);
        setError('Impossibile caricare i risultati del quiz');
        NotificationsService.error('Errore nel caricamento dei risultati', 'Errore');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [quizId]);

  const handleBackToPath = () => {
    if (pathId) {
      navigate(`/student/path/${pathId}`);
    } else {
      navigate('/student/quizzes');
    }
  };

  if (loading) {
    return (
      <MainLayout title="Risultati Quiz">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <LoadingIndicator text="Caricamento risultati..." size={50} />
        </Box>
      </MainLayout>
    );
  }

  if (error || !result) {
    return (
      <MainLayout title="Errore">
        <Container maxWidth="md">
          <Paper sx={{ p: 3, mt: 3, bgcolor: 'error.light' }}>
            <Typography variant="h5" component="h1" gutterBottom>
              Errore nel caricamento dei risultati
            </Typography>
            <Typography paragraph>
              {error || 'Si è verificato un errore nel caricamento dei risultati del quiz.'}
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<ArrowBackIcon />}
              onClick={handleBackToPath}
            >
              Torna indietro
            </Button>
          </Paper>
        </Container>
      </MainLayout>
    );
  }

  // Calcola il colore in base alla percentuale
  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'primary';
    if (percentage >= 40) return 'warning';
    return 'error';
  };

  return (
    <AnimatedPage transitionType="fade">
      <MainLayout title="Risultati Quiz">
        <Container maxWidth="md">
          <Box sx={{ p: 3 }}>
            <Button 
              startIcon={<ArrowBackIcon />}
              onClick={handleBackToPath}
              sx={{ mb: 3 }}
            >
              Torna al percorso
            </Button>

            <FadeIn>
              <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                <Box textAlign="center" mb={4}>
                  {result.alreadyCompleted ? (
                    <InfoIcon color="warning" sx={{ fontSize: 64, mb: 2 }} />
                  ) : (
                    <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
                  )}
                  
                  <Typography variant="h4" gutterBottom>
                    {result.title}
                  </Typography>
                  
                  {result.description && (
                    <Typography variant="body1" color="text.secondary" paragraph>
                      {result.description}
                    </Typography>
                  )}
                  
                  <Box 
                    sx={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      position: 'relative',
                      my: 3
                    }}
                  >
                    <CircularProgress 
                      variant="determinate" 
                      value={result.percentage} 
                      size={120}
                      thickness={5}
                      color={getScoreColor(result.percentage)}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="h5" component="div" color="text.secondary">
                        {result.percentage}%
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="h5" gutterBottom>
                    Punteggio: <strong>{result.score}/{result.maxScore}</strong>
                  </Typography>
                  
                  {result.pointsAwarded !== undefined && (
                    <Chip 
                      icon={<CheckCircleIcon />} 
                      label={`Punti guadagnati: ${result.pointsAwarded}`}
                      color="success"
                      sx={{ mb: 2 }}
                    />
                  )}
                  
                  {result.alreadyCompleted && (
                    <Paper 
                      sx={{ 
                        p: 2, 
                        mt: 3, 
                        bgcolor: 'warning.light',
                        borderRadius: 2
                      }}
                    >
                      <Typography color="warning.dark">
                        <InfoIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                        {result.message || "Questo quiz è già stato completato in precedenza."}
                      </Typography>
                    </Paper>
                  )}
                </Box>
                
                <SlideInUp delay={0.2}>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      mt: 4, 
                      gap: 2 
                    }}
                  >
                    <Button
                      variant="contained"
                      onClick={handleBackToPath}
                    >
                      Torna al percorso
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/student/dashboard')}
                    >
                      Dashboard
                    </Button>
                  </Box>
                </SlideInUp>
              </Paper>
            </FadeIn>
          </Box>
        </Container>
      </MainLayout>
    </AnimatedPage>
  );
};

export default QuizResults; 