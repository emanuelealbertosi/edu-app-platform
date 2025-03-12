import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Typography, 
  Paper, 
  Box,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Chip,
  Divider,
  Badge
} from '@mui/material';
import { Link } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import QuizIcon from '@mui/icons-material/Quiz';
import PathService from '../../services/PathService';
import QuizService from '../../services/QuizService';
import RewardService from '../../services/RewardService';

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

// Interfacce TypeScript
interface Path {
  id: string;
  title: string;
  description: string;
  progress: number;
  due_date?: string;
  // Altri campi dal servizio vengono ignorati per compatibilità
}

interface Quiz {
  id: string;
  title: string;
  path_title?: string;
  completed: boolean;
  // Altri campi dal servizio vengono ignorati per compatibilità
}

interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number;
  image_url?: string;
  status: string; // Aggiunto il campo status per mostrare se la ricompensa è stata riscattata o meno
  // Altri campi dal servizio vengono ignorati per compatibilità
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [paths, setPaths] = useState<Path[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [points, setPoints] = useState<number>(0);
  const [loading, setLoading] = useState({
    paths: true,
    quizzes: true,
    rewards: true,
    points: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Carica i percorsi assegnati allo studente
        const pathsData = await PathService.getAssignedPaths();
        // Mappa i campi del servizio al formato richiesto dal componente
        const mappedPaths = pathsData.map(path => ({
          id: path.id,
          title: path.title,
          description: path.description,
          progress: path.progress,
          due_date: path.targetEndDate ? new Date(path.targetEndDate).toISOString().split('T')[0] : undefined
        }));
        setPaths(mappedPaths);
        setLoading(prev => ({ ...prev, paths: false }));

        // Carica i quiz assegnati allo studente
        const quizzesData = await QuizService.getAssignedQuizzes();
        // Mappa i campi del servizio al formato richiesto dal componente
        const mappedQuizzes = quizzesData.map(quiz => ({
          id: quiz.id,
          title: quiz.title,
          path_title: paths.find(p => p.id === quiz.templateId)?.title,
          completed: quiz.isCompleted
        }));
        setQuizzes(mappedQuizzes);
        setLoading(prev => ({ ...prev, quizzes: false }));

        // Carica le ricompense disponibili
        const rewardsData = await RewardService.getAvailableRewards();
        // Mappa i campi del servizio al formato richiesto dal componente
        const mappedRewards = rewardsData.map(reward => ({
          id: reward.id,
          title: reward.title,
          description: reward.description,
          cost: reward.pointsCost,
          image_url: reward.imageUrl,
          status: 'disponibile' // Stato predefinito per le ricompense disponibili
        }));
        
        // Ottieni anche le ricompense già riscattate
        const redeemedRewards = await RewardService.getRedeemedRewards();
        const mappedRedeemedRewards = redeemedRewards.map(reward => ({
          id: reward.id,
          title: reward.title,
          description: reward.description,
          cost: reward.pointsCost,
          image_url: reward.imageUrl,
          status: reward.status 
        }));
        
        // Combina le ricompense disponibili e quelle riscattate
        setRewards([...mappedRedeemedRewards, ...mappedRewards].slice(0, 5));
        setLoading(prev => ({ ...prev, rewards: false }));

        // Carica i punti dell'utente
        if (user?.id) {
          const rewardStatsData = await RewardService.getStudentRewardStats(user.id);
          setPoints(rewardStatsData.availablePoints);
          setLoading(prev => ({ ...prev, points: false }));
        }
      } catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
        // Gestione degli errori
        setLoading({
          paths: false,
          quizzes: false,
          rewards: false,
          points: false
        });
      }
    };

    fetchData();
  }, [user?.id]);

  return (
    <AnimatedPage transitionType="fade">
      <MainLayout title="Dashboard Studente">
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <FadeIn>
            <Typography variant="h4" gutterBottom>
              Benvenuto, {user?.firstName || 'Studente'}
            </Typography>
            <Typography variant="body1" paragraph>
              Ecco un riepilogo dei tuoi progressi e delle attività disponibili.
            </Typography>
          </FadeIn>

          {/* Riepilogo punti e ricompense */}
          <SlideInUp delay={0.1}>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <HoverAnimation scale={1.02}>
                  <Paper
                    sx={{
                      p: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      backgroundColor: 'primary.light',
                      color: 'primary.contrastText',
                      borderRadius: 2
                    }}
                  >
                    {loading.points ? (
                      <LoadingIndicator text="Caricamento punti..." color="#fff" />
                    ) : (
                      <>
                        <Box display="flex" alignItems="center">
                          <EmojiEventsIcon sx={{ fontSize: 40, mr: 2 }} />
                          <Box>
                            <Typography variant="h5">I tuoi punti</Typography>
                            <Typography variant="h3">{points}</Typography>
                          </Box>
                        </Box>
                        <Typography sx={{ mt: 2 }}>
                          Puoi utilizzare i tuoi punti per riscattare delle ricompense!
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Button
                            component={Link}
                            to="/student/rewards"
                            variant="contained"
                            color="secondary"
                            startIcon={<ShoppingCartIcon />}
                          >
                            Vai allo Shop
                          </Button>
                        </Box>
                      </>
                    )}
                  </Paper>
                </HoverAnimation>
              </Grid>

              <Grid item xs={12} md={6}>
                <HoverAnimation scale={1.02}>
                  <Paper sx={{ p: 3, borderRadius: 2 }}>
                    {loading.rewards ? (
                      <LoadingIndicator text="Caricamento ricompense recenti..." />
                    ) : (
                      <>
                        <Typography variant="h5" gutterBottom>
                          Ultime ricompense
                        </Typography>
                        <List>
                          {rewards.length > 0 ? (
                            <AnimatedList>
                              {rewards.slice(0, 3).map((reward) => (
                                <ListItem key={reward.id} divider>
                                  <ListItemText
                                    primary={reward.title}
                                    secondary={`Costo: ${reward.cost} punti - ${reward.status}`}
                                  />
                                  <Chip
                                    color={reward.status === 'riscattato' ? 'success' : 'default'}
                                    label={reward.status}
                                    size="small"
                                  />
                                </ListItem>
                              ))}
                            </AnimatedList>
                          ) : (
                            <Typography variant="body2" color="textSecondary">
                              Non hai ancora riscattato nessuna ricompensa.
                            </Typography>
                          )}
                        </List>
                      </>
                    )}
                  </Paper>
                </HoverAnimation>
              </Grid>
            </Grid>
          </SlideInUp>

          {/* Percorsi recenti */}
          <SlideInLeft delay={0.2}>
            <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
              <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                <MenuBookIcon color="primary" sx={{ mr: 1, fontSize: 30 }} />
                <Typography variant="h5">I tuoi percorsi</Typography>
              </Box>
              
              {loading.paths ? (
                <CardSkeleton count={2} />
              ) : (
                <Grid container spacing={3}>
                  {paths.length > 0 ? (
                    paths.slice(0, 3).map((path, index) => (
                      <Grid item xs={12} md={4} key={path.id}>
                        <HoverAnimation>
                          <Card>
                            <CardContent>
                              <Typography variant="h6" gutterBottom>
                                {path.title}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="textSecondary"
                                sx={{
                                  mb: 2,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                }}
                              >
                                {path.description}
                              </Typography>
                              <Box sx={{ mt: 1, mb: 1 }}>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                  Progresso: {path.progress}%
                                </Typography>
                                <ProgressBar 
                                  progress={path.progress} 
                                />
                                {/* Nota: le prop animated e sx sono state rimosse perché causavano errori di tipizzazione */}
                              </Box>
                              {path.due_date && (
                                <Typography variant="caption" color="textSecondary">
                                  Da completare entro: {path.due_date}
                                </Typography>
                              )}
                            </CardContent>
                            <CardActions>
                              <Button
                                component={Link}
                                to={`/student/paths/${path.id}`}
                                size="small"
                                color="primary"
                              >
                                Continua
                              </Button>
                            </CardActions>
                          </Card>
                        </HoverAnimation>
                      </Grid>
                    ))
                  ) : (
                    <Grid item xs={12}>
                      <Typography variant="body1" color="textSecondary">
                        Non hai ancora percorsi assegnati.
                      </Typography>
                    </Grid>
                  )}
                  {paths.length > 0 && (
                    <Grid item xs={12}>
                      <Box display="flex" justifyContent="center" mt={2}>
                        <Button
                          component={Link}
                          to="/student/paths"
                          variant="outlined"
                          color="primary"
                        >
                          Vedi tutti i percorsi
                        </Button>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              )}
            </Paper>
          </SlideInLeft>

          {/* Quiz da completare */}
          <SlideInRight delay={0.3}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                <QuizIcon color="primary" sx={{ mr: 1, fontSize: 30 }} />
                <Typography variant="h5">Quiz disponibili</Typography>
              </Box>
              
              {loading.quizzes ? (
                <CardSkeleton count={2} />
              ) : (
                <Grid container spacing={3}>
                  {quizzes.filter(q => !q.completed).length > 0 ? (
                    quizzes
                      .filter(q => !q.completed)
                      .slice(0, 3)
                      .map((quiz, index) => (
                        <Grid item xs={12} md={4} key={quiz.id}>
                          <HoverAnimation>
                            <Card>
                              <CardContent>
                                <Typography variant="h6" gutterBottom>
                                  {quiz.title}
                                </Typography>
                                {quiz.path_title && (
                                  <Typography variant="body2" color="textSecondary" gutterBottom>
                                    Percorso: {quiz.path_title}
                                  </Typography>
                                )}
                                <Chip
                                  label="Da completare"
                                  color="warning"
                                  size="small"
                                  sx={{ mt: 1 }}
                                />
                              </CardContent>
                              <CardActions>
                                <Button
                                  component={Link}
                                  to={`/student/quiz/${quiz.id}`}
                                  size="small"
                                  color="primary"
                                  variant="contained"
                                >
                                  Inizia
                                </Button>
                              </CardActions>
                            </Card>
                          </HoverAnimation>
                        </Grid>
                      ))
                  ) : (
                    <Grid item xs={12}>
                      <Typography variant="body1" color="textSecondary">
                        Non hai quiz da completare al momento.
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              )}
            </Paper>
          </SlideInRight>
        </Container>
      </MainLayout>
    </AnimatedPage>
  );
};

export default StudentDashboard;
