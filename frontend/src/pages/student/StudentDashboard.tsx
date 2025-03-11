import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../../components/layout/MainLayout';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  LinearProgress,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Paper,
  Chip,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import QuizIcon from '@mui/icons-material/Quiz';
import axios from 'axios';

// Interfacce TypeScript
interface Path {
  id: string;
  title: string;
  description: string;
  progress: number;
  due_date?: string;
}

interface Quiz {
  id: string;
  title: string;
  path_title: string;
  completed: boolean;
}

interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number;
  image_url?: string;
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paths, setPaths] = useState<Path[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [points, setPoints] = useState<number>(0);
  const [loading, setLoading] = useState({
    paths: true,
    quizzes: true,
    rewards: true,
    points: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // In un'implementazione reale, queste sarebbero chiamate API reali
        // Per ora utilizziamo dati di esempio
        
        // Simula il caricamento dei percorsi assegnati
        setTimeout(() => {
          const mockPaths: Path[] = [
            {
              id: '1',
              title: 'Matematica Base',
              description: 'Percorso di matematica per principianti',
              progress: 75,
              due_date: '2025-04-15',
            },
            {
              id: '2',
              title: 'Scienze Naturali',
              description: 'Introduzione alle scienze naturali',
              progress: 30,
              due_date: '2025-04-30',
            },
            {
              id: '3',
              title: 'Inglese Livello 1',
              description: 'Fondamenti di inglese',
              progress: 10,
              due_date: '2025-05-10',
            },
          ];
          setPaths(mockPaths);
          setLoading(prev => ({ ...prev, paths: false }));
        }, 500);

        // Simula il caricamento dei quiz prossimi/in corso
        setTimeout(() => {
          const mockQuizzes: Quiz[] = [
            {
              id: '101',
              title: 'Addizione e Sottrazione',
              path_title: 'Matematica Base',
              completed: false,
            },
            {
              id: '102',
              title: 'Animali e Habitat',
              path_title: 'Scienze Naturali',
              completed: false,
            },
            {
              id: '103',
              title: 'Vocabolario Base',
              path_title: 'Inglese Livello 1',
              completed: false,
            },
          ];
          setQuizzes(mockQuizzes);
          setLoading(prev => ({ ...prev, quizzes: false }));
        }, 700);

        // Simula il caricamento delle ricompense disponibili
        setTimeout(() => {
          const mockRewards: Reward[] = [
            {
              id: '201',
              title: 'Tempo Extra Videogiochi',
              description: '30 minuti extra per giocare',
              cost: 100,
              image_url: 'https://via.placeholder.com/150',
            },
            {
              id: '202',
              title: 'Uscita al Parco',
              description: 'Pomeriggio al parco con gli amici',
              cost: 200,
              image_url: 'https://via.placeholder.com/150',
            },
            {
              id: '203',
              title: 'Film a Scelta',
              description: 'Scegli un film da vedere in famiglia',
              cost: 150,
              image_url: 'https://via.placeholder.com/150',
            },
          ];
          setRewards(mockRewards);
          setLoading(prev => ({ ...prev, rewards: false }));
        }, 900);

        // Simula il caricamento dei punti dell'utente
        setTimeout(() => {
          setPoints(320);
          setLoading(prev => ({ ...prev, points: false }));
        }, 600);

      } catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
        // Gestione degli errori
        setLoading({
          paths: false,
          quizzes: false,
          rewards: false,
          points: false,
        });
      }
    };

    fetchData();
  }, []);

  return (
    <MainLayout title="Dashboard Studente">
      <Box sx={{ pb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Ciao, {user?.firstName || user?.username}!
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Ecco il riepilogo del tuo progresso educativo
        </Typography>
      </Box>

      {/* Punti e statistiche */}
      <Paper
        elevation={3}
        sx={{ p: 3, mb: 4, borderRadius: 2, bgcolor: 'primary.light', color: 'white' }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h5">I tuoi punti</Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', my: 1 }}>
              {loading.points ? <LinearProgress color="inherit" /> : points}
            </Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Badge 
                badgeContent={paths.length} 
                color="secondary" 
                sx={{ '& .MuiBadge-badge': { fontSize: 16, height: 24, minWidth: 24 } }}
              >
                <SchoolIcon sx={{ fontSize: 40 }} />
              </Badge>
              <Typography variant="body1" sx={{ mt: 1 }}>Percorsi attivi</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Badge 
                badgeContent={quizzes.filter(q => !q.completed).length} 
                color="secondary"
                sx={{ '& .MuiBadge-badge': { fontSize: 16, height: 24, minWidth: 24 } }}
              >
                <EmojiEventsIcon sx={{ fontSize: 40 }} />
              </Badge>
              <Typography variant="body1" sx={{ mt: 1 }}>Quiz da completare</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={4}>
        {/* Percorsi in corso */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <SchoolIcon sx={{ mr: 1 }} />
                I tuoi percorsi
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              {loading.paths ? (
                <LinearProgress />
              ) : paths.length > 0 ? (
                <List sx={{ width: '100%' }}>
                  {paths.map((path) => (
                    <Box key={path.id} sx={{ mb: 2, border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {path.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {path.description}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 2 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={path.progress} 
                          sx={{ flexGrow: 1, mr: 2, height: 8, borderRadius: 5 }} 
                        />
                        <Typography variant="body2" color="text.secondary">
                          {path.progress}%
                        </Typography>
                      </Box>
                      {path.due_date && (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Chip 
                            icon={<AccessTimeIcon />} 
                            label={`Scadenza: ${new Date(path.due_date).toLocaleDateString()}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Button 
                            size="small" 
                            variant="contained" 
                            startIcon={<PlayArrowIcon />}
                            onClick={() => navigate(`/student/paths/${path.id}`)}
                          >
                            Continua
                          </Button>
                        </Box>
                      )}
                    </Box>
                  ))}
                </List>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ py: 2 }}>
                  Non hai ancora percorsi assegnati.
                </Typography>
              )}
            </CardContent>
            <Box sx={{ flexGrow: 1 }} />
            <CardActions>
              <Button 
                size="small" 
                color="primary"
                onClick={() => navigate('/student/paths')}
              >
                Vedi tutti i percorsi
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Quiz prossimi */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <PlayArrowIcon sx={{ mr: 1 }} />
                Quiz da completare
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              {loading.quizzes ? (
                <LinearProgress />
              ) : quizzes.filter(q => !q.completed).length > 0 ? (
                <List sx={{ width: '100%' }}>
                  {quizzes.filter(q => !q.completed).map((quiz) => (
                    <ListItem 
                      key={quiz.id}
                      secondaryAction={
                        <Button 
                          variant="contained" 
                          size="small"
                          onClick={() => navigate(`/student/quiz/${quiz.id}`)}
                        >
                          Inizia
                        </Button>
                      }
                      sx={{ 
                        mb: 1, 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 1 
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.light' }}>
                          <QuizIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={quiz.title} 
                        secondary={`Da: ${quiz.path_title}`} 
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ py: 2 }}>
                  Non hai quiz da completare al momento.
                </Typography>
              )}
            </CardContent>
            <Box sx={{ flexGrow: 1 }} />
            <CardActions>
              <Button 
                size="small" 
                color="primary"
                onClick={() => navigate('/student/paths')}
              >
                Vedi tutti i quiz
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Ricompense disponibili */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <ShoppingCartIcon sx={{ mr: 1 }} />
                Ricompense in evidenza
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              {loading.rewards ? (
                <LinearProgress />
              ) : rewards.length > 0 ? (
                <Grid container spacing={2}>
                  {rewards.slice(0, 3).map((reward) => (
                    <Grid item xs={12} sm={6} md={4} key={reward.id}>
                      <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {reward.image_url && (
                          <Box
                            sx={{
                              height: 140,
                              bgcolor: 'grey.200',
                              backgroundImage: `url(${reward.image_url})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }}
                          />
                        )}
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" component="div">
                            {reward.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {reward.description}
                          </Typography>
                          <Chip 
                            label={`${reward.cost} punti`}
                            color="primary"
                            sx={{ mt: 2 }}
                          />
                        </CardContent>
                        <CardActions>
                          <Button 
                            size="small" 
                            variant="contained" 
                            fullWidth
                            disabled={points < reward.cost}
                            onClick={() => navigate(`/student/rewards`)}
                          >
                            {points >= reward.cost ? 'Riscatta' : 'Punti insufficienti'}
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ py: 2 }}>
                  Non ci sono ricompense disponibili al momento.
                </Typography>
              )}
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                color="primary"
                onClick={() => navigate('/student/rewards')}
              >
                Visita lo shop
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </MainLayout>
  );
};

export default StudentDashboard;
