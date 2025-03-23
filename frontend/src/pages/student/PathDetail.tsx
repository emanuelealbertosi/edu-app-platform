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
  Chip,
  Paper,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MainLayout from '../../components/layout/MainLayout';
import PathService from '../../services/PathService';
import { NotificationsService } from '../../services/NotificationsService';
import ApiService from '../../services/ApiService';
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

// API URL
const API_URL = 'http://localhost:8001';

interface Quiz {
  id: string;
  templateId?: string;
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
  const [runDiagnosticLoading, setRunDiagnosticLoading] = useState<boolean>(false);
  const [refreshCount, setRefreshCount] = useState<number>(0);

  useEffect(() => {
    const fetchPathDetail = async () => {
      if (!pathId) return;
      
      try {
        setLoading(true);
        setError(null);
        console.log(`[DEBUG PathDetail] Fetching path details for ID: ${pathId}`);
        
        // Tenta di ottenere i dettagli del percorso
        let response;
        try {
          response = await PathService.getPathDetail(pathId);
          console.log(`[DEBUG PathDetail] Raw response from PathService:`, response);
        } catch (err) {
          console.error('[DEBUG PathDetail] Error from PathService:', err);
          
          // Se c'è un errore, creiamo un oggetto percorso minimo per evitare crash
          const defaultResponse: PathDetail = {
            id: pathId,
            title: 'Percorso (dettagli non disponibili)',
            description: 'Non è stato possibile caricare i dettagli completi del percorso, ma puoi comunque visualizzare i quiz disponibili.',
            progress: 0,
            subject: 'Non disponibile',
            difficulty: 'medio',
            status: 'non_iniziato',
            quizzes: []
          };
          
          response = defaultResponse;
          
          // Tentiamo comunque di caricare i quiz dai nodi
          try {
            console.log('[DEBUG PathDetail] Attempting to fetch only nodes for quiz data');
            const nodesResponse = await ApiService.get(`${API_URL}/api/paths/${pathId}/nodes`);
            
            if (Array.isArray(nodesResponse) && nodesResponse.length > 0) {
              console.log(`[DEBUG PathDetail] Successfully retrieved ${nodesResponse.length} nodes`);
              
              // Estrai i nodi quiz
              const quizNodes = nodesResponse.filter(node => 
                node.node_type === 'quiz' || 
                node.content?.quiz_id ||
                node.title?.toLowerCase().includes('quiz')
              );
              
              console.log(`[DEBUG PathDetail] Found ${quizNodes.length} potential quiz nodes`);
              
              // Converti in formato Quiz
              if (quizNodes.length > 0) {
                const mappedQuizzes = quizNodes.map(node => ({
                  id: node.id?.toString() || '',
                  templateId: node.content?.quiz_id?.toString() || node.id?.toString() || '',
                  title: node.title || 'Quiz senza titolo',
                  description: node.description || 'Nessuna descrizione disponibile',
                  status: node.status?.toLowerCase().includes('complet') ? 'completed' :
                          node.status?.toLowerCase().includes('lock') ? 'locked' : 'available'
                } as Quiz));
                
                response.quizzes = mappedQuizzes;
              }
            }
          } catch (nodesError) {
            console.error('[DEBUG PathDetail] Failed to retrieve nodes as fallback:', nodesError);
            // Se anche il caricamento dei nodi fallisce, mostriamo l'errore originale
            throw err;
          }
        }
        
        // Check if quizzes array exists
        if (!response || !response.quizzes) {
          console.error(`[DEBUG PathDetail] Response missing quizzes array:`, response);
          // Create dummy quizzes for testing
          response.quizzes = [{
            id: 'test1',
            templateId: 'test1',
            title: 'Test Quiz 1',
            description: 'This is a test quiz for debugging',
            status: 'available'
          }];
          console.log(`[DEBUG PathDetail] Added test quiz to response`);
        } else {
          console.log(`[DEBUG PathDetail] Quizzes found in response: ${response.quizzes.length}`);
        }
        
        // Deduplicate quizzes before setting state
        if (response && response.quizzes && Array.isArray(response.quizzes)) {
          console.log(`[DEBUG PathDetail] Deduplicating quizzes: ${response.quizzes.length} quizzes found`);
          
          // Create a unique lookup based on both node ID and template ID
          const processedTemplateIds = new Set<string>();
          const processedNodeIds = new Set<string>();
          const uniqueQuizzes: Quiz[] = [];
          
          for (const quiz of response.quizzes) {
            console.log(`[DEBUG PathDetail] Processing quiz: nodeId=${quiz.id}, templateId=${quiz.templateId || 'none'}`);
            
            // Skip if we've already seen this node or template
            if (quiz.id && processedNodeIds.has(quiz.id)) {
              console.log(`[DEBUG PathDetail] Skipping quiz with duplicate node ID: ${quiz.id}`);
              continue;
            }
            
            if (quiz.templateId && processedTemplateIds.has(quiz.templateId)) {
              console.log(`[DEBUG PathDetail] Skipping quiz with duplicate template ID: ${quiz.templateId}`);
              continue;
            }
            
            // Track that we've processed this ID
            if (quiz.id) processedNodeIds.add(quiz.id);
            if (quiz.templateId) processedTemplateIds.add(quiz.templateId);
            
            // Add to our unique quizzes list
            uniqueQuizzes.push(quiz);
            console.log(`[DEBUG PathDetail] Added unique quiz: ${quiz.title}`);
          }
          
          // Replace the quizzes array with our deduplicated version
          response.quizzes = uniqueQuizzes;
          
          console.log(`[DEBUG PathDetail] Final quiz count after deduplication: ${response.quizzes.length}`);
        }
        
        setPath(response);
      } catch (err) {
        console.error('[DEBUG PathDetail] Error fetching path details:', err);
        setError('Si è verificato un errore durante il caricamento dei dettagli del percorso. Riprova più tardi.');
        NotificationsService.error('Errore di caricamento', 'Non è stato possibile caricare i dettagli del percorso');
      } finally {
        setLoading(false);
      }
    };

    fetchPathDetail();
  }, [pathId, refreshCount]);

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

  const handleStartQuiz = async (quiz: Quiz) => {
    try {
      console.log(`Starting quiz with ID: ${quiz.id}, template ID: ${quiz.templateId}`);
      
      // Determina l'ID da usare per il quiz (template_id o id diretto)
      const quizId = quiz.templateId || quiz.id;
      if (!quizId) {
        throw new Error('ID Quiz o ID Template non disponibile');
      }
      
      // Se il quiz è completato, vai alla pagina di riepilogo
      if (quiz.status === 'completed') {
        console.log(`Quiz ${quizId} is already completed, navigating to review page`);
        navigate(`/student/path/${pathId}/quiz/${quizId}/results`);
        return;
      }
      
      // Altrimenti, avvia il quiz
      console.log(`Navigating to quiz page for quiz ID: ${quizId}`);
      navigate(`/student/path/${pathId}/quiz/${quizId}`);
      
      // Imposta un timer per controllare lo stato del percorso dopo un po' di tempo
      // Questo aiuterà ad aggiornare la UI se il quiz viene completato
      setTimeout(() => {
        checkPathStatus();
      }, 10000); // Controlla dopo 10 secondi
      
    } catch (error) {
      console.error('Error navigating to quiz:', error);
      NotificationsService.error('Errore durante l\'avvio del quiz. Riprova più tardi.', 'Errore');
    }
  };

  // Funzione per controllare lo stato aggiornato del percorso
  const checkPathStatus = () => {
    console.log("Controllando lo stato aggiornato del percorso...");
    setRefreshCount(prevCount => prevCount + 1);
  };

  // Add function to run API diagnostic
  const runApiDiagnostic = async () => {
    console.log(`[DEBUG] Running API diagnostic for path ${pathId}`);
    try {
      // Chiamare il metodo di diagnostica
      const result = await ApiService.get(`${API_URL}/api/debug/verify-token`);
      console.log('[DEBUG] API diagnostic result:', result);
      
      // Tenta di recuperare direttamente i nodi del percorso
      try {
        const nodes = await ApiService.get(`${API_URL}/api/paths/${pathId}/nodes`);
        console.log(`[DEBUG] Path nodes (${nodes.length}):`, nodes);
      } catch (nodesError) {
        console.error('[DEBUG] Failed to get path nodes:', nodesError);
      }
      
      NotificationsService.success('API diagnostic completed. Check console for details.', 'Diagnostic');
    } catch (err) {
      console.error('[DEBUG] API diagnostic error:', err);
      NotificationsService.error('API diagnostic failed', 'Error');
    }
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
            
            {/* Banner di completamento del percorso */}
            {path.status === 'completato' && (
              <Paper 
                sx={{ 
                  mt: 2, 
                  p: 3, 
                  bgcolor: 'success.light', 
                  color: 'success.dark',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <CheckCircleIcon sx={{ fontSize: 36 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Percorso Completato!
                  </Typography>
                  <Typography variant="body1">
                    Hai completato con successo tutti i quiz di questo percorso. Il punteggio è stato aggiunto al tuo profilo.
                  </Typography>
                </Box>
              </Paper>
            )}
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
            {path.quizzes && path.quizzes.length > 0 ? (
              path.quizzes.map((quiz, index) => (
                <Grid item xs={12} md={6} key={quiz.id}>
                  <HoverAnimation delay={index * 0.1}>
                    <Card 
                      elevation={3} 
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        opacity: quiz.status === 'locked' ? 0.7 : 1,
                        borderTop: quiz.status === 'completed' ? '4px solid' : 'none',
                        borderColor: 'success.main',
                        position: 'relative'
                      }}
                    >
                      {quiz.status === 'completed' && (
                        <Chip
                          label="Completato"
                          color="success"
                          size="small"
                          icon={<CheckCircleIcon />}
                          sx={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            fontWeight: 'bold'
                          }}
                        />
                      )}
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
                          <Box sx={{ 
                            mt: 2, 
                            p: 1.5, 
                            bgcolor: 'success.light', 
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'success.main' 
                          }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.dark' }}>
                              Completato il: {new Date(quiz.completedAt!).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'success.dark' }}>
                              Punti guadagnati: {quiz.pointsAwarded || 0}
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
                          onClick={() => handleStartQuiz(quiz)}
                          startIcon={quiz.status === 'completed' ? <CheckCircleIcon /> : undefined}
                        >
                          {quiz.status === 'completed' ? 'Rivedi Quiz' : quiz.status === 'locked' ? 'Bloccato' : 'Inizia Quiz'}
                        </Button>
                      </CardActions>
                    </Card>
                  </HoverAnimation>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Paper elevation={2} sx={{ p: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
                  <Typography variant="h6" align="center" gutterBottom>
                    Nessun quiz disponibile per questo percorso
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={runApiDiagnostic}
                    >
                      Esegui diagnostica API
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            )}
          </Grid>
          
          {/* Debug controls */}
          <Box sx={{ mt: 4, pt: 2, borderTop: '1px dashed #ccc' }}>
            <Typography variant="subtitle2" color="text.secondary">Strumenti di debug</Typography>
            <Button 
              variant="outlined" 
              size="small" 
              color="secondary" 
              onClick={runApiDiagnostic}
              sx={{ mt: 1 }}
            >
              Test API Connection
            </Button>
          </Box>
        </Box>
      </MainLayout>
    </AnimatedPage>
  );
};

export default PathDetail;
