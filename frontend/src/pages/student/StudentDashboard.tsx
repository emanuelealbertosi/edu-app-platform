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
          image_url: reward.imageUrl
        }));
        setRewards(mappedRewards);
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
    <MainLayout title="Dashboard Studente">
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          
          {/* Sezione "I tuoi punti" */}
          <Grid item xs={12} md={4} lg={3}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: 140,
              }}
            >
              <Typography component="h2" variant="h6" color="primary" gutterBottom>
                I tuoi punti
              </Typography>
              <Typography component="p" variant="h4">
                {loading.points ? "Caricamento..." : points}
              </Typography>
              <div>
                <Link to="/student/rewards" style={{ textDecoration: 'none' }}>
                  <Button
                    startIcon={<ShoppingCartIcon />}
                    color="primary"
                    sx={{ mt: 2 }}
                  >
                    Shop Ricompense
                  </Button>
                </Link>
              </div>
            </Paper>
          </Grid>
          
          {/* Sezione Quiz Imminenti */}
          <Grid item xs={12} md={8} lg={9}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: 140,
              }}
            >
              <Typography component="h2" variant="h6" color="primary" gutterBottom>
                Quiz Imminenti
              </Typography>
              {loading.quizzes ? (
                <Typography>Caricamento quiz...</Typography>
              ) : quizzes.length === 0 ? (
                <Typography>Nessun quiz in programma</Typography>
              ) : (
                <List dense>
                  {quizzes.filter(quiz => !quiz.completed).slice(0, 2).map((quiz) => (
                    <ListItem
                      key={quiz.id}
                      secondaryAction={
                        <Button 
                          variant="contained" 
                          size="small"
                          component={Link}
                          to={`/student/quiz/${quiz.id}`}
                        >
                          <QuizIcon fontSize="small" sx={{ mr: 1 }} />
                          Inizia
                        </Button>
                      }
                    >
                      <ListItemText
                        primary={quiz.title}
                        secondary={quiz.path_title || 'Quiz indipendente'}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
              <Box display="flex" justifyContent="flex-end" sx={{ mt: 'auto' }}>
                <Link to="/student/quizzes" style={{ textDecoration: 'none' }}>
                  <Button size="small" color="primary">
                    Vedi tutti
                  </Button>
                </Link>
              </Box>
            </Paper>
          </Grid>

          {/* Sezione I tuoi percorsi */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
              <Typography component="h2" variant="h6" color="primary" gutterBottom>
                I tuoi percorsi educativi
              </Typography>
              
              {loading.paths ? (
                <Typography>Caricamento percorsi...</Typography>
              ) : paths.length === 0 ? (
                <Typography>Nessun percorso assegnato</Typography>
              ) : (
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  {paths.map((path) => (
                    <Grid item xs={12} sm={6} md={4} key={path.id}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" component="div">
                            {path.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {path.description}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress variant="determinate" value={path.progress} />
                            </Box>
                            <Box sx={{ minWidth: 35 }}>
                              <Typography variant="body2" color="text.secondary">
                                {path.progress}%
                              </Typography>
                            </Box>
                          </Box>
                          {path.due_date && (
                            <Typography variant="caption" display="block">
                              Scadenza: {new Date(path.due_date).toLocaleDateString()}
                            </Typography>
                          )}
                        </CardContent>
                        <CardActions>
                          <Button 
                            size="small" 
                            color="primary"
                            component={Link}
                            to={`/student/path/${path.id}`}
                          >
                            <MenuBookIcon fontSize="small" sx={{ mr: 1 }} />
                            Continua
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
              
              <Box display="flex" justifyContent="flex-end" sx={{ mt: 2 }}>
                <Link to="/student/paths" style={{ textDecoration: 'none' }}>
                  <Button size="small" color="primary">
                    Vedi tutti
                  </Button>
                </Link>
              </Box>
            </Paper>
          </Grid>

          {/* Sezione Ricompense Disponibili */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
              <Typography component="h2" variant="h6" color="primary" gutterBottom>
                Ricompense Disponibili
              </Typography>
              
              {loading.rewards ? (
                <Typography>Caricamento ricompense...</Typography>
              ) : rewards.length === 0 ? (
                <Typography>Nessuna ricompensa disponibile</Typography>
              ) : (
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  {rewards.slice(0, 3).map((reward) => (
                    <Grid item xs={12} sm={6} md={4} key={reward.id}>
                      <Card>
                        {reward.image_url && (
                          <CardMedia
                            component="img"
                            height="140"
                            image={reward.image_url}
                            alt={reward.title}
                          />
                        )}
                        <CardContent>
                          <Typography variant="h6" component="div">
                            {reward.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {reward.description}
                          </Typography>
                          <Chip 
                            icon={<EmojiEventsIcon />} 
                            label={`${reward.cost} punti`} 
                            color="primary" 
                            variant="outlined" 
                          />
                        </CardContent>
                        <CardActions>
                          <Button 
                            size="small" 
                            variant={points >= reward.cost ? "contained" : "outlined"}
                            disabled={points < reward.cost}
                            component={Link}
                            to={`/student/rewards`}
                          >
                            <ShoppingCartIcon fontSize="small" sx={{ mr: 1 }} />
                            {points >= reward.cost ? "Riscatta" : "Punti insufficienti"}
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
              
              <Box display="flex" justifyContent="flex-end" sx={{ mt: 2 }}>
                <Link to="/student/rewards" style={{ textDecoration: 'none' }}>
                  <Button size="small" color="primary">
                    Vedi tutte
                  </Button>
                </Link>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </MainLayout>
  );
};

export default StudentDashboard;
