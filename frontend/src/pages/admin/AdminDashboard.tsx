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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  ListItemAvatar,
  IconButton,
  Paper,
  Alert,
  Chip,
  Badge,
  Stack,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import QuizIcon from '@mui/icons-material/Quiz';
import RouteIcon from '@mui/icons-material/Route';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PeopleIcon from '@mui/icons-material/People';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';

// Importazione dei servizi
import UserService, { User, SystemStats, AdminActivity } from '../../services/UserService';
import PathService, { PathTemplate } from '../../services/PathService';
import QuizService, { QuizTemplate } from '../../services/QuizService';
import { NotificationsService } from '../../services/NotificationsService';

// Importazione componenti di animazione
import { LoadingIndicator, CardSkeleton } from '../../components/animations/LoadingAnimations';
import { FadeIn, SlideInUp } from '../../components/animations/Transitions';
import { AnimatedPage, AnimatedList } from '../../components/animations/PageTransitions';

// Tipo per le statistiche del sistema
interface SystemStat {
  name: string;
  value: number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [quizTemplates, setQuizTemplates] = useState<QuizTemplate[]>([]);
  const [pathTemplates, setPathTemplates] = useState<PathTemplate[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStat[]>([]);
  const [recentActivities, setRecentActivities] = useState<AdminActivity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState({
    users: true,
    quizTemplates: true,
    pathTemplates: true,
    systemStats: true,
    recentActivities: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Recupero degli utenti
        try {
          const usersData = await UserService.getAllUsers();
          setUsers(usersData);
        } catch (err) {
          console.error('Errore nel recupero degli utenti:', err);
        } finally {
          setLoading(prev => ({ ...prev, users: false }));
        }

        // Recupero dei template dei quiz
        try {
          const quizzesData = await QuizService.getAllQuizTemplates();
          setQuizTemplates(quizzesData);
        } catch (err) {
          console.error('Errore nel recupero dei template dei quiz:', err);
        } finally {
          setLoading(prev => ({ ...prev, quizTemplates: false }));
        }

        // Recupero dei template dei percorsi
        try {
          const pathsData = await PathService.getAllPathTemplates();
          setPathTemplates(pathsData);
        } catch (err) {
          console.error('Errore nel recupero dei template dei percorsi:', err);
        } finally {
          setLoading(prev => ({ ...prev, pathTemplates: false }));
        }

        // Recupero delle statistiche di sistema
        try {
          const statsData = await UserService.getSystemStats();
          
          // Trasforma le statistiche nel formato richiesto per la UI
          const formattedStats: SystemStat[] = [
            {
              name: 'Utenti totali',
              value: statsData.totalUsers,
              icon: <PeopleIcon />,
              color: 'primary.main',
            },
            {
              name: 'Studenti attivi',
              value: statsData.activeStudents,
              icon: <SchoolIcon />,
              color: 'success.main',
            },
            {
              name: 'Genitori',
              value: statsData.activeParents,
              icon: <FamilyRestroomIcon />,
              color: 'info.main',
            },
            {
              name: 'Percorsi completati',
              value: statsData.completedPaths,
              change: statsData.completedPaths / (statsData.totalPaths || 1) * 100,
              icon: <RouteIcon />,
              color: 'success.main',
            },
            {
              name: 'Quiz completati',
              value: statsData.completedQuizzes,
              change: statsData.completedQuizzes / (statsData.totalQuizzes || 1) * 100,
              icon: <QuizIcon />,
              color: 'warning.main',
            },
            {
              name: 'Ricompense riscattate',
              value: statsData.redeemedRewards,
              change: statsData.redeemedRewards / (statsData.totalRewards || 1) * 100,
              icon: <EmojiEventsIcon />,
              color: 'secondary.main',
            },
          ];
          
          setSystemStats(formattedStats);
        } catch (err) {
          console.error('Errore nel recupero delle statistiche di sistema:', err);
        } finally {
          setLoading(prev => ({ ...prev, systemStats: false }));
        }

        // Recupero delle attività recenti
        try {
          const activitiesData = await UserService.getSystemActivities();
          setRecentActivities(activitiesData);
        } catch (err) {
          console.error('Errore nel recupero delle attività recenti:', err);
        } finally {
          setLoading(prev => ({ ...prev, recentActivities: false }));
        }

      } catch (err) {
        setError('Si è verificato un errore durante il recupero dei dati. Riprova più tardi.');
        console.error('Errore generale:', err);
      }
    };

    fetchData();
  }, []);

  const handleDeactivateUser = async (userId: string) => {
    try {
      await UserService.deactivateUser(userId);
      // Aggiorna la lista degli utenti
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, active: false } 
          : user
      ));
      NotificationsService.success('Utente disattivato con successo');
    } catch (err) {
      console.error('Errore nella disattivazione dell\'utente:', err);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'parent':
        return 'primary';
      case 'student':
        return 'success';
      default:
        return 'default';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Amministratore';
      case 'parent':
        return 'Genitore';
      case 'student':
        return 'Studente';
      default:
        return role;
    }
  };

  return (
    <AnimatedPage transitionType="fade">
      <MainLayout title="Dashboard Amministratore">
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <FadeIn>
            <Typography variant="h4" gutterBottom>
              Dashboard Amministratore
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Gestisci gli utenti, i percorsi educativi e monitora le statistiche del sistema.
            </Typography>
          </FadeIn>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Statistiche */}
          <SlideInUp delay={0.1}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                <AdminPanelSettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Statistiche del sistema
              </Typography>
              <Grid container spacing={2}>
                {loading.systemStats ? (
                  <>
                    {[1, 2, 3, 4, 5, 6].map((item) => (
                      <Grid item xs={6} md={4} lg={2} key={item}>
                        <CardSkeleton height={120} />
                      </Grid>
                    ))}
                  </>
                ) : (
                  <>
                    {systemStats.map((stat, index) => (
                      <Grid item xs={6} md={4} lg={2} key={index}>
                        <Card sx={{ height: '100%' }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Typography variant="subtitle2" color="text.secondary">
                                {stat.name}
                              </Typography>
                              <Avatar sx={{ bgcolor: stat.color, width: 30, height: 30 }}>
                                {stat.icon}
                              </Avatar>
                            </Box>
                            <Typography variant="h4" sx={{ mt: 2, fontWeight: 'bold' }}>
                              {stat.value.toLocaleString()}
                            </Typography>
                            {stat.change !== undefined && (
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: stat.change >= 0 ? 'success.main' : 'error.main',
                                  display: 'flex',
                                  alignItems: 'center',
                                  mt: 1
                                }}
                              >
                                {stat.change.toFixed(1)}%
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </>
                )}
              </Grid>
            </Box>
          </SlideInUp>

          <Grid container spacing={3}>
            {/* Utenti */}
            <Grid item xs={12} md={6}>
              <SlideInUp delay={0.2}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        <PeopleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Utenti
                      </Typography>
                      <Button
                        startIcon={<AddIcon />}
                        variant="outlined"
                        size="small"
                        onClick={() => navigate('/admin/users/new')}
                      >
                        Aggiungi
                      </Button>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    
                    {loading.users ? (
                      <Box sx={{ mt: 2 }}>
                        <CardSkeleton count={4} height={80} />
                      </Box>
                    ) : users.length === 0 ? (
                      <Alert severity="info">
                        Non ci sono utenti da visualizzare.
                      </Alert>
                    ) : (
                      <List>
                        <AnimatedList>
                          {users.slice(0, 5).map((user) => (
                            <ListItem key={user.id}>
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: user.active ? 'primary.main' : 'grey.500' }}>
                                  <PersonIcon />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {user.firstName} {user.lastName}
                                    <Chip 
                                      size="small" 
                                      label={getRoleName(user.role)} 
                                      color={getRoleColor(user.role) as any}
                                      sx={{ ml: 1 }}
                                    />
                                    {!user.active && (
                                      <Chip 
                                        size="small" 
                                        label="Inattivo" 
                                        color="default"
                                        sx={{ ml: 1 }}
                                      />
                                    )}
                                  </Box>
                                }
                                secondary={
                                  <>
                                    <Typography component="span" variant="body2" color="text.primary">
                                      {user.email}
                                    </Typography>
                                    <br />
                                    <Typography component="span" variant="body2" color="text.secondary">
                                      Ultimo accesso: {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Mai'}
                                    </Typography>
                                  </>
                                }
                              />
                              <Box>
                                <IconButton
                                  edge="end"
                                  aria-label="visualizza"
                                  onClick={() => navigate(`/admin/users/${user.id}`)}
                                  sx={{ mr: 1 }}
                                >
                                  <VisibilityIcon />
                                </IconButton>
                                <IconButton
                                  edge="end"
                                  aria-label="modifica"
                                  onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                                  sx={{ mr: 1 }}
                                >
                                  <EditIcon />
                                </IconButton>
                                {user.active && (
                                  <IconButton
                                    edge="end"
                                    aria-label="disattiva"
                                    onClick={() => handleDeactivateUser(user.id)}
                                    color="error"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                )}
                              </Box>
                            </ListItem>
                          ))}
                        </AnimatedList>
                      </List>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button 
                      fullWidth 
                      variant="contained" 
                      onClick={() => navigate('/admin/users')}
                    >
                      Gestisci utenti
                    </Button>
                  </CardActions>
                </Card>
              </SlideInUp>
            </Grid>

            {/* Quiz Templates */}
            <Grid item xs={12} md={6}>
              <SlideInUp delay={0.3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        <QuizIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Quiz
                      </Typography>
                      <Button
                        startIcon={<AddIcon />}
                        variant="outlined"
                        size="small"
                        onClick={() => navigate('/admin/quizzes/new')}
                      >
                        Crea nuovo
                      </Button>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    
                    {loading.quizTemplates ? (
                      <Box sx={{ mt: 2 }}>
                        <CardSkeleton count={4} height={80} />
                      </Box>
                    ) : quizTemplates.length === 0 ? (
                      <Alert severity="info">
                        Non ci sono template di quiz da visualizzare.
                      </Alert>
                    ) : (
                      <List>
                        <AnimatedList>
                          {quizTemplates.slice(0, 5).map((quiz) => (
                            <ListItem key={quiz.id}>
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: 'warning.main' }}>
                                  <QuizIcon />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {quiz.title}
                                    {quiz.isPublic && (
                                      <Chip 
                                        size="small" 
                                        label="Pubblico" 
                                        color="success"
                                        sx={{ ml: 1 }}
                                      />
                                    )}
                                  </Box>
                                }
                                secondary={
                                  <>
                                    <Typography component="span" variant="body2" noWrap>
                                      {quiz.description && quiz.description.length > 60
                                        ? `${quiz.description.substring(0, 60)}...`
                                        : quiz.description}
                                    </Typography>
                                    <br />
                                    <Typography component="span" variant="body2" color="text.secondary">
                                      Domande: {quiz.questions ? quiz.questions.length : 0}
                                    </Typography>
                                  </>
                                }
                              />
                              <Box>
                                <IconButton
                                  edge="end"
                                  aria-label="visualizza"
                                  onClick={() => navigate(`/admin/quizzes/${quiz.id}`)}
                                >
                                  <VisibilityIcon />
                                </IconButton>
                              </Box>
                            </ListItem>
                          ))}
                        </AnimatedList>
                      </List>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button 
                      fullWidth 
                      variant="contained" 
                      onClick={() => navigate('/admin/quizzes')}
                    >
                      Gestisci quiz
                    </Button>
                  </CardActions>
                </Card>
              </SlideInUp>
            </Grid>

            {/* Percorsi Educativi */}
            <Grid item xs={12} md={6}>
              <SlideInUp delay={0.4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        <RouteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Percorsi educativi
                      </Typography>
                      <Button
                        startIcon={<AddIcon />}
                        variant="outlined"
                        size="small"
                        onClick={() => navigate('/admin/paths/new')}
                      >
                        Crea nuovo
                      </Button>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    
                    {loading.pathTemplates ? (
                      <Box sx={{ mt: 2 }}>
                        <CardSkeleton count={4} height={80} />
                      </Box>
                    ) : pathTemplates.length === 0 ? (
                      <Alert severity="info">
                        Non ci sono template di percorsi da visualizzare.
                      </Alert>
                    ) : (
                      <List>
                        <AnimatedList>
                          {pathTemplates.slice(0, 5).map((path) => (
                            <ListItem key={path.id}>
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                  <RouteIcon />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={path.title}
                                secondary={
                                  <>
                                    <Typography component="span" variant="body2" noWrap>
                                      {path.description && path.description.length > 60
                                        ? `${path.description.substring(0, 60)}...`
                                        : path.description}
                                    </Typography>
                                    <br />
                                    <Typography component="span" variant="body2" color="text.secondary">
                                      Quiz: {path.quizIds ? path.quizIds.length : 0} • Difficoltà: {path.difficulty}
                                    </Typography>
                                  </>
                                }
                              />
                              <Box>
                                <IconButton
                                  edge="end"
                                  aria-label="visualizza"
                                  onClick={() => navigate(`/admin/paths/${path.id}`)}
                                >
                                  <VisibilityIcon />
                                </IconButton>
                              </Box>
                            </ListItem>
                          ))}
                        </AnimatedList>
                      </List>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button 
                      fullWidth 
                      variant="contained" 
                      onClick={() => navigate('/admin/paths')}
                    >
                      Gestisci percorsi
                    </Button>
                  </CardActions>
                </Card>
              </SlideInUp>
            </Grid>

            {/* Attività recenti */}
            <Grid item xs={12} md={6}>
              <SlideInUp delay={0.5}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      <AdminPanelSettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Attività recenti
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    {loading.recentActivities ? (
                      <Box sx={{ mt: 2 }}>
                        <CardSkeleton count={4} height={80} />
                      </Box>
                    ) : recentActivities.length === 0 ? (
                      <Alert severity="info">
                        Non ci sono attività recenti da visualizzare.
                      </Alert>
                    ) : (
                      <List>
                        <AnimatedList>
                          {recentActivities.slice(0, 5).map((activity) => (
                            <ListItem key={activity.id}>
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: getRoleActivityColor(activity.userRole) }}>
                                  {getActivityIcon(activity.action)}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={activity.action}
                                secondary={
                                  <>
                                    <Typography component="span" variant="body2">
                                      {activity.username} ({getRoleName(activity.userRole)})
                                    </Typography>
                                    <br />
                                    <Typography component="span" variant="body2" color="text.secondary">
                                      {new Date(activity.timestamp).toLocaleString()}
                                    </Typography>
                                  </>
                                }
                              />
                            </ListItem>
                          ))}
                        </AnimatedList>
                      </List>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button 
                      fullWidth 
                      variant="contained" 
                      onClick={() => navigate('/admin/activities')}
                    >
                      Vedi tutte le attività
                    </Button>
                  </CardActions>
                </Card>
              </SlideInUp>
            </Grid>
          </Grid>
        </Box>
      </MainLayout>
    </AnimatedPage>
  );
};

// Funzioni di utilità
const getRoleActivityColor = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'error.main';
    case 'parent':
      return 'primary.main';
    case 'student':
      return 'success.main';
    default:
      return 'grey.500';
  }
};

const getActivityIcon = (action: string) => {
  if (action.includes('login') || action.includes('accesso')) {
    return <PersonIcon />;
  } else if (action.includes('quiz')) {
    return <QuizIcon />;
  } else if (action.includes('percorso') || action.includes('path')) {
    return <RouteIcon />;
  } else if (action.includes('ricompensa') || action.includes('reward')) {
    return <EmojiEventsIcon />;
  } else if (action.includes('utente') || action.includes('user')) {
    return <PeopleIcon />;
  } else {
    return <AdminPanelSettingsIcon />;
  }
};

export default AdminDashboard;
