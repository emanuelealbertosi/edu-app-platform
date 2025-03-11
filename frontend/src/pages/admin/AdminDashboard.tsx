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

// Interfacce TypeScript
interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'parent' | 'student';
  createdAt: string;
  lastLogin?: string;
  active: boolean;
}

interface QuizTemplate {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  createdBy: string;
  createdAt: string;
  isPublic: boolean;
}

interface SystemStat {
  name: string;
  value: number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

interface RecentActivity {
  id: string;
  action: string;
  user: string;
  role: string;
  timestamp: string;
  details: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [quizTemplates, setQuizTemplates] = useState<QuizTemplate[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStat[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState({
    users: true,
    quizTemplates: true,
    systemStats: true,
    recentActivities: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // In un'implementazione reale, queste sarebbero chiamate API reali
        // Per ora utilizziamo dati di esempio
        
        // Simula il caricamento degli utenti
        setTimeout(() => {
          const mockUsers: User[] = [
            {
              id: '1',
              username: 'admin',
              email: 'admin@example.com',
              role: 'admin',
              createdAt: '2025-01-15T10:00:00',
              lastLogin: '2025-03-11T08:30:00',
              active: true,
            },
            {
              id: '2',
              username: 'genitore1',
              email: 'genitore1@example.com',
              role: 'parent',
              createdAt: '2025-01-20T14:25:00',
              lastLogin: '2025-03-10T19:45:00',
              active: true,
            },
            {
              id: '3',
              username: 'genitore2',
              email: 'genitore2@example.com',
              role: 'parent',
              createdAt: '2025-02-05T09:15:00',
              lastLogin: '2025-03-09T20:30:00',
              active: true,
            },
            {
              id: '4',
              username: 'studente1',
              email: 'studente1@example.com',
              role: 'student',
              createdAt: '2025-02-10T16:30:00',
              lastLogin: '2025-03-11T15:20:00',
              active: true,
            },
            {
              id: '5',
              username: 'studente2',
              email: 'studente2@example.com',
              role: 'student',
              createdAt: '2025-02-12T11:45:00',
              lastLogin: '2025-03-10T16:10:00',
              active: true,
            },
          ];
          setUsers(mockUsers);
          setLoading(prev => ({ ...prev, users: false }));
        }, 500);

        // Simula il caricamento dei template di quiz
        setTimeout(() => {
          const mockQuizTemplates: QuizTemplate[] = [
            {
              id: '101',
              title: 'Matematica: Addizione e Sottrazione',
              description: 'Quiz base sulle operazioni di addizione e sottrazione',
              questionCount: 10,
              createdBy: 'admin',
              createdAt: '2025-02-01T09:30:00',
              isPublic: true,
            },
            {
              id: '102',
              title: 'Scienze: Animali e habitat',
              description: 'Quiz sugli animali e i loro habitat naturali',
              questionCount: 15,
              createdBy: 'admin',
              createdAt: '2025-02-10T14:15:00',
              isPublic: true,
            },
            {
              id: '103',
              title: 'Storia: Antica Roma',
              description: 'Quiz sulla storia dell\'antica Roma',
              questionCount: 12,
              createdBy: 'genitore1',
              createdAt: '2025-02-20T16:45:00',
              isPublic: false,
            },
            {
              id: '104',
              title: 'Geografia: Capitali Europee',
              description: 'Quiz sulle capitali dei paesi europei',
              questionCount: 8,
              createdBy: 'admin',
              createdAt: '2025-03-05T10:20:00',
              isPublic: true,
            },
          ];
          setQuizTemplates(mockQuizTemplates);
          setLoading(prev => ({ ...prev, quizTemplates: false }));
        }, 700);

        // Simula il caricamento delle statistiche di sistema
        setTimeout(() => {
          const mockSystemStats: SystemStat[] = [
            {
              name: 'Utenti totali',
              value: 55,
              change: 12,
              icon: <PeopleIcon />,
              color: 'primary.main',
            },
            {
              name: 'Quiz completati',
              value: 243,
              change: 38,
              icon: <QuizIcon />,
              color: 'success.main',
            },
            {
              name: 'Template percorsi',
              value: 18,
              change: 5,
              icon: <RouteIcon />,
              color: 'info.main',
            },
            {
              name: 'Ricompense riscattate',
              value: 86,
              change: 14,
              icon: <EmojiEventsIcon />,
              color: 'warning.main',
            },
          ];
          setSystemStats(mockSystemStats);
          setLoading(prev => ({ ...prev, systemStats: false }));
        }, 600);

        // Simula il caricamento delle attività recenti
        setTimeout(() => {
          const mockRecentActivities: RecentActivity[] = [
            {
              id: '201',
              action: 'Nuovo quiz creato',
              user: 'admin',
              role: 'admin',
              timestamp: '2025-03-11T10:15:00',
              details: 'Quiz "Geografia: Capitali del Mondo" creato',
            },
            {
              id: '202',
              action: 'Nuovo utente registrato',
              user: 'genitore3',
              role: 'parent',
              timestamp: '2025-03-10T16:30:00',
              details: 'Nuovo account genitore creato',
            },
            {
              id: '203',
              action: 'Template percorso modificato',
              user: 'genitore1',
              role: 'parent',
              timestamp: '2025-03-10T14:45:00',
              details: 'Modificato percorso "Matematica Avanzata"',
            },
            {
              id: '204',
              action: 'Quiz completato',
              user: 'studente1',
              role: 'student',
              timestamp: '2025-03-10T12:20:00',
              details: 'Quiz "Scienze: Animali e habitat" completato con 90%',
            },
            {
              id: '205',
              action: 'Ricompensa riscattata',
              user: 'studente2',
              role: 'student',
              timestamp: '2025-03-09T18:10:00',
              details: 'Ricompensa "Tempo Extra Videogiochi" riscattata',
            },
          ];
          setRecentActivities(mockRecentActivities);
          setLoading(prev => ({ ...prev, recentActivities: false }));
        }, 800);

      } catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
        // Gestione degli errori
        setLoading({
          users: false,
          quizTemplates: false,
          systemStats: false,
          recentActivities: false,
        });
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <AdminPanelSettingsIcon color="error" />;
      case 'parent':
        return <FamilyRestroomIcon color="primary" />;
      case 'student':
        return <SchoolIcon color="success" />;
      default:
        return <PersonIcon />;
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

  return (
    <MainLayout title="Dashboard Admin">
      <Box sx={{ pb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Gestione della piattaforma educativa
        </Typography>
      </Box>

      {/* Statistiche generali */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {loading.systemStats ? (
          <Grid item xs={12}>
            <LinearProgress />
          </Grid>
        ) : (
          systemStats.map((stat) => (
            <Grid item xs={12} sm={6} md={3} key={stat.name}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Avatar sx={{ bgcolor: stat.color, width: 56, height: 56 }}>
                    {stat.icon}
                  </Avatar>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {stat.value}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="success.main"
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'flex-end',
                        fontWeight: 'bold', 
                      }}
                    >
                      +{stat.change} <span style={{ fontSize: '0.8rem', marginLeft: '4px' }}>ultimo mese</span>
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="subtitle1" color="text.secondary">
                  {stat.name}
                </Typography>
              </Paper>
            </Grid>
          ))
        )}
      </Grid>

      <Grid container spacing={4}>
        {/* Utenti recenti */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <PeopleIcon sx={{ mr: 1 }} />
                  Utenti recenti
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  size="small"
                  onClick={() => navigate('/admin/users/new')}
                >
                  Nuovo utente
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {loading.users ? (
                <LinearProgress />
              ) : users.length > 0 ? (
                <List>
                  {users.map((userItem) => (
                    <ListItem 
                      key={userItem.id}
                      sx={{ 
                        mb: 1, 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 1 
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar>
                          {getRoleIcon(userItem.role)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {userItem.username}
                            <Chip 
                              size="small" 
                              color={getRoleColor(userItem.role) as any}
                              label={userItem.role}
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography component="span" variant="body2">
                              {userItem.email}
                            </Typography>
                            <br />
                            <Typography component="span" variant="body2" color="text.secondary">
                              Ultimo accesso: {userItem.lastLogin ? formatDate(userItem.lastLogin) : 'Mai'}
                            </Typography>
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          aria-label="edit"
                          onClick={() => navigate(`/admin/users/${userItem.id}`)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  Non ci sono utenti nel sistema.
                </Alert>
              )}
            </CardContent>
            <Box sx={{ flexGrow: 1 }} />
            <CardActions>
              <Button 
                size="small" 
                color="primary"
                onClick={() => navigate('/admin/users')}
              >
                Vedi tutti gli utenti
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Template Quiz */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <QuizIcon sx={{ mr: 1 }} />
                  Template Quiz
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  size="small"
                  onClick={() => navigate('/admin/quiz-templates/new')}
                >
                  Nuovo Quiz
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {loading.quizTemplates ? (
                <LinearProgress />
              ) : quizTemplates.length > 0 ? (
                <List>
                  {quizTemplates.map((quiz) => (
                    <ListItem 
                      key={quiz.id}
                      sx={{ 
                        mb: 1, 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 1 
                      }}
                    >
                      <ListItemAvatar>
                        <Badge 
                          badgeContent={quiz.questionCount} 
                          color="primary"
                          anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                          }}
                        >
                          <Avatar sx={{ bgcolor: 'secondary.light' }}>
                            <QuizIcon />
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {quiz.title}
                            {quiz.isPublic && (
                              <Chip 
                                size="small" 
                                color="success" 
                                label="Pubblico"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography component="span" variant="body2">
                              {quiz.description}
                            </Typography>
                            <br />
                            <Typography component="span" variant="body2" color="text.secondary">
                              Creato da: {quiz.createdBy} • {formatDate(quiz.createdAt)}
                            </Typography>
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Stack direction="row" spacing={1}>
                          <IconButton 
                            aria-label="edit"
                            onClick={() => navigate(`/admin/quiz-templates/${quiz.id}`)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            aria-label="delete"
                            color="error"
                            onClick={() => {
                              // In un'implementazione reale, qui ci sarebbe una dialog di conferma
                              console.log(`Delete quiz template with ID: ${quiz.id}`);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  Non ci sono template di quiz nel sistema.
                </Alert>
              )}
            </CardContent>
            <Box sx={{ flexGrow: 1 }} />
            <CardActions>
              <Button 
                size="small" 
                color="primary"
                onClick={() => navigate('/admin/quiz-templates')}
              >
                Gestisci tutti i quiz
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Attività recenti */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AdminPanelSettingsIcon sx={{ mr: 1 }} />
                Attività di sistema recenti
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {loading.recentActivities ? (
                <LinearProgress />
              ) : recentActivities.length > 0 ? (
                <List>
                  {recentActivities.map((activity) => (
                    <ListItem 
                      key={activity.id}
                      sx={{ 
                        mb: 1, 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 1 
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar>
                          {getRoleIcon(activity.role)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={activity.action}
                        secondary={
                          <>
                            <Typography component="span" variant="body2">
                              {activity.details}
                            </Typography>
                            <br />
                            <Typography component="span" variant="body2" color="text.secondary">
                              Utente: {activity.user} • {formatDate(activity.timestamp)}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  Non ci sono attività recenti da visualizzare.
                </Alert>
              )}
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                color="primary"
                onClick={() => navigate('/admin/logs')}
              >
                Vedi tutti i log di sistema
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </MainLayout>
  );
};

export default AdminDashboard;
