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
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  ListItemAvatar,
  IconButton,
  Paper,
  Alert,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RouteIcon from '@mui/icons-material/Route';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AssignmentIcon from '@mui/icons-material/Assignment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarsIcon from '@mui/icons-material/Stars';
import PendingIcon from '@mui/icons-material/Pending';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';

// Interfacce TypeScript
interface Student {
  id: string;
  name: string;
  username: string;
  points: number;
  avatar?: string;
  pendingRewards: number;
}

interface PathTemplate {
  id: string;
  title: string;
  description: string;
  quizCount: number;
  isPublic: boolean;
}

interface RewardTemplate {
  id: string;
  title: string;
  description: string;
  cost: number;
  category: string;
}

interface PendingReward {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  cost: number;
  requestDate: string;
}

interface RecentActivity {
  id: string;
  studentId: string;
  studentName: string;
  type: 'path_completed' | 'quiz_completed' | 'reward_requested' | 'reward_approved';
  title: string;
  date: string;
}

const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [pathTemplates, setPathTemplates] = useState<PathTemplate[]>([]);
  const [rewardTemplates, setRewardTemplates] = useState<RewardTemplate[]>([]);
  const [pendingRewards, setPendingRewards] = useState<PendingReward[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState({
    students: true,
    pathTemplates: true,
    rewardTemplates: true,
    pendingRewards: true,
    recentActivities: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // In un'implementazione reale, queste sarebbero chiamate API reali
        // Per ora utilizziamo dati di esempio
        
        // Simula il caricamento degli studenti
        setTimeout(() => {
          const mockStudents: Student[] = [
            {
              id: '1',
              name: 'Marco Rossi',
              username: 'marco',
              points: 250,
              avatar: 'https://mui.com/static/images/avatar/1.jpg',
              pendingRewards: 2,
            },
            {
              id: '2',
              name: 'Giulia Bianchi',
              username: 'giulia',
              points: 180,
              avatar: 'https://mui.com/static/images/avatar/3.jpg',
              pendingRewards: 0,
            },
            {
              id: '3',
              name: 'Luca Verdi',
              username: 'luca',
              points: 320,
              avatar: 'https://mui.com/static/images/avatar/2.jpg',
              pendingRewards: 1,
            },
          ];
          setStudents(mockStudents);
          setLoading(prev => ({ ...prev, students: false }));
        }, 500);

        // Simula il caricamento dei template dei percorsi
        setTimeout(() => {
          const mockPathTemplates: PathTemplate[] = [
            {
              id: '101',
              title: 'Matematica Base',
              description: 'Percorso di matematica per principianti',
              quizCount: 5,
              isPublic: true,
            },
            {
              id: '102',
              title: 'Scienze Naturali',
              description: 'Introduzione alle scienze naturali',
              quizCount: 7,
              isPublic: false,
            },
            {
              id: '103',
              title: 'Inglese Livello 1',
              description: 'Fondamenti di inglese',
              quizCount: 10,
              isPublic: true,
            },
          ];
          setPathTemplates(mockPathTemplates);
          setLoading(prev => ({ ...prev, pathTemplates: false }));
        }, 700);

        // Simula il caricamento dei template delle ricompense
        setTimeout(() => {
          const mockRewardTemplates: RewardTemplate[] = [
            {
              id: '201',
              title: 'Tempo Extra Videogiochi',
              description: '30 minuti extra per giocare',
              cost: 100,
              category: 'Tempo libero',
            },
            {
              id: '202',
              title: 'Uscita al Parco',
              description: 'Pomeriggio al parco con gli amici',
              cost: 200,
              category: 'Attività',
            },
            {
              id: '203',
              title: 'Film a Scelta',
              description: 'Scegli un film da vedere in famiglia',
              cost: 150,
              category: 'Intrattenimento',
            },
            {
              id: '204',
              title: 'Libro nuovo',
              description: 'Un libro a scelta da acquistare',
              cost: 250,
              category: 'Educazione',
            },
          ];
          setRewardTemplates(mockRewardTemplates);
          setLoading(prev => ({ ...prev, rewardTemplates: false }));
        }, 900);

        // Simula il caricamento delle ricompense in attesa di approvazione
        setTimeout(() => {
          const mockPendingRewards: PendingReward[] = [
            {
              id: '301',
              studentId: '1',
              studentName: 'Marco Rossi',
              title: 'Tempo Extra Videogiochi',
              cost: 100,
              requestDate: '2025-03-10T14:32:00',
            },
            {
              id: '302',
              studentId: '1',
              studentName: 'Marco Rossi',
              title: 'Film a Scelta',
              cost: 150,
              requestDate: '2025-03-11T09:15:00',
            },
            {
              id: '303',
              studentId: '3',
              studentName: 'Luca Verdi',
              title: 'Libro nuovo',
              cost: 250,
              requestDate: '2025-03-11T10:45:00',
            },
          ];
          setPendingRewards(mockPendingRewards);
          setLoading(prev => ({ ...prev, pendingRewards: false }));
        }, 600);

        // Simula il caricamento delle attività recenti
        setTimeout(() => {
          const mockActivities: RecentActivity[] = [
            {
              id: '401',
              studentId: '2',
              studentName: 'Giulia Bianchi',
              type: 'quiz_completed',
              title: 'Quiz Addizione e Sottrazione completato',
              date: '2025-03-11T14:30:00',
            },
            {
              id: '402',
              studentId: '1',
              studentName: 'Marco Rossi',
              type: 'reward_requested',
              title: 'Richiesta: Film a Scelta',
              date: '2025-03-11T09:15:00',
            },
            {
              id: '403',
              studentId: '3',
              studentName: 'Luca Verdi',
              type: 'path_completed',
              title: 'Percorso Matematica Base completato',
              date: '2025-03-10T16:45:00',
            },
            {
              id: '404',
              studentId: '2',
              studentName: 'Giulia Bianchi',
              type: 'reward_approved',
              title: 'Approvata: Uscita al Parco',
              date: '2025-03-09T11:20:00',
            },
          ];
          setRecentActivities(mockActivities);
          setLoading(prev => ({ ...prev, recentActivities: false }));
        }, 800);

      } catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
        // Gestione degli errori
        setLoading({
          students: false,
          pathTemplates: false,
          rewardTemplates: false,
          pendingRewards: false,
          recentActivities: false,
        });
      }
    };

    fetchData();
  }, []);

  const handleApproveReward = (rewardId: string) => {
    // In un'implementazione reale, qui ci sarebbe una chiamata API
    console.log(`Approvata ricompensa con ID: ${rewardId}`);
    
    // Aggiorna lo stato locale rimuovendo la ricompensa approvata
    setPendingRewards(prevRewards => 
      prevRewards.filter(reward => reward.id !== rewardId)
    );
    
    // Aggiorna il numero di ricompense in attesa per lo studente
    setStudents(prevStudents => 
      prevStudents.map(student => {
        const reward = pendingRewards.find(r => r.id === rewardId);
        if (reward && student.id === reward.studentId) {
          return { ...student, pendingRewards: student.pendingRewards - 1 };
        }
        return student;
      })
    );
    
    // Aggiungi l'attività alle attività recenti
    const approvedReward = pendingRewards.find(r => r.id === rewardId);
    if (approvedReward) {
      const newActivity: RecentActivity = {
        id: `new-${Date.now()}`,
        studentId: approvedReward.studentId,
        studentName: approvedReward.studentName,
        type: 'reward_approved',
        title: `Approvata: ${approvedReward.title}`,
        date: new Date().toISOString(),
      };
      
      setRecentActivities(prev => [newActivity, ...prev]);
    }
  };

  const handleRejectReward = (rewardId: string) => {
    // In un'implementazione reale, qui ci sarebbe una chiamata API
    console.log(`Rifiutata ricompensa con ID: ${rewardId}`);
    
    // Aggiorna lo stato locale rimuovendo la ricompensa rifiutata
    setPendingRewards(prevRewards => 
      prevRewards.filter(reward => reward.id !== rewardId)
    );
    
    // Aggiorna il numero di ricompense in attesa per lo studente
    setStudents(prevStudents => 
      prevStudents.map(student => {
        const reward = pendingRewards.find(r => r.id === rewardId);
        if (reward && student.id === reward.studentId) {
          return { ...student, pendingRewards: student.pendingRewards - 1 };
        }
        return student;
      })
    );
  };

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

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'path_completed':
        return <RouteIcon color="primary" />;
      case 'quiz_completed':
        return <CheckCircleIcon color="success" />;
      case 'reward_requested':
        return <PendingIcon color="warning" />;
      case 'reward_approved':
        return <ThumbUpIcon color="info" />;
      default:
        return <StarsIcon />;
    }
  };

  return (
    <MainLayout title="Dashboard Genitore">
      <Box sx={{ pb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Benvenuto, {user?.firstName || user?.username}!
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Gestisci gli studenti, i percorsi e le ricompense
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Studenti */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ mr: 1 }} />
                  I tuoi studenti
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<PersonAddIcon />}
                  size="small"
                  onClick={() => navigate('/parent/students')}
                >
                  Aggiungi
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {loading.students ? (
                <LinearProgress />
              ) : students.length > 0 ? (
                <List>
                  {students.map((student) => (
                    <ListItem 
                      key={student.id}
                      sx={{ 
                        mb: 1, 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 1,
                        bgcolor: student.pendingRewards > 0 ? 'rgba(255, 152, 0, 0.05)' : 'transparent',
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar src={student.avatar}>
                          {student.name[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {student.name}
                            {student.pendingRewards > 0 && (
                              <Chip 
                                size="small" 
                                color="warning" 
                                label={`${student.pendingRewards} in attesa`}
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>
                        }
                        secondary={`${student.points} punti`} 
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          aria-label="view"
                          onClick={() => navigate(`/parent/students/${student.id}`)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  Non hai ancora aggiunto studenti. Clicca su "Aggiungi" per creare un nuovo account studente.
                </Alert>
              )}
            </CardContent>
            <Box sx={{ flexGrow: 1 }} />
            <CardActions>
              <Button 
                size="small" 
                color="primary"
                onClick={() => navigate('/parent/students')}
              >
                Gestisci studenti
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Percorsi e Template */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <RouteIcon sx={{ mr: 1 }} />
                  I tuoi percorsi
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddCircleIcon />}
                  size="small"
                  onClick={() => navigate('/parent/path-templates')}
                >
                  Crea nuovo
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {loading.pathTemplates ? (
                <LinearProgress />
              ) : pathTemplates.length > 0 ? (
                <List>
                  {pathTemplates.map((path) => (
                    <ListItem 
                      key={path.id}
                      sx={{ 
                        mb: 1, 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 1 
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.light' }}>
                          <RouteIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {path.title}
                            {path.isPublic && (
                              <Chip 
                                size="small" 
                                color="success" 
                                label="Pubblico"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>
                        }
                        secondary={`${path.quizCount} quiz`} 
                      />
                      <ListItemSecondaryAction>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => navigate(`/parent/assign-paths?template=${path.id}`)}
                        >
                          Assegna
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  Non hai ancora creato percorsi educativi. Clicca su "Crea nuovo" per iniziare.
                </Alert>
              )}
            </CardContent>
            <Box sx={{ flexGrow: 1 }} />
            <CardActions>
              <Button 
                size="small" 
                color="primary"
                onClick={() => navigate('/parent/path-templates')}
              >
                Gestisci percorsi
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Ricompense in attesa di approvazione */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <EmojiEventsIcon sx={{ mr: 1 }} />
                Ricompense da approvare
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {loading.pendingRewards ? (
                <LinearProgress />
              ) : pendingRewards.length > 0 ? (
                <List>
                  {pendingRewards.map((reward) => (
                    <ListItem 
                      key={reward.id}
                      sx={{ 
                        mb: 1, 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 1,
                        bgcolor: 'rgba(255, 152, 0, 0.05)',
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'warning.light' }}>
                          <EmojiEventsIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={reward.title}
                        secondary={
                          <>
                            <Typography component="span" variant="body2">
                              {reward.studentName} • {reward.cost} punti
                            </Typography>
                            <br />
                            <Typography component="span" variant="body2" color="text.secondary">
                              Richiesta: {formatDate(reward.requestDate)}
                            </Typography>
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleApproveReward(reward.id)}
                          sx={{ mr: 1 }}
                        >
                          Approva
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleRejectReward(reward.id)}
                        >
                          Rifiuta
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  Non ci sono ricompense in attesa di approvazione.
                </Alert>
              )}
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                color="primary"
                onClick={() => navigate('/parent/reward-templates')}
              >
                Gestisci template ricompense
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Attività recenti */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AssignmentIcon sx={{ mr: 1 }} />
                Attività recenti
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
                          {getActivityIcon(activity.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={activity.title}
                        secondary={
                          <>
                            <Typography component="span" variant="body2">
                              {activity.studentName}
                            </Typography>
                            <br />
                            <Typography component="span" variant="body2" color="text.secondary">
                              {formatDate(activity.date)}
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
          </Card>
        </Grid>
      </Grid>
    </MainLayout>
  );
};

export default ParentDashboard;
