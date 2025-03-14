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

// Importazione dei servizi
import StudentService, { Student, StudentActivity } from '../../services/StudentService';
import PathService, { PathTemplate } from '../../services/PathService';
import RewardService, { RewardTemplate, PendingReward } from '../../services/RewardService';
import { NotificationsService } from '../../services/NotificationsService';

// Importazione componenti di animazione
import { LoadingIndicator, CardSkeleton } from '../../components/animations/LoadingAnimations';
import { FadeIn, SlideInUp } from '../../components/animations/Transitions';
import { AnimatedPage, AnimatedList } from '../../components/animations/PageTransitions';

const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [pathTemplates, setPathTemplates] = useState<PathTemplate[]>([]);
  const [rewardTemplates, setRewardTemplates] = useState<RewardTemplate[]>([]);
  const [pendingRewards, setPendingRewards] = useState<PendingReward[]>([]);
  const [recentActivities, setRecentActivities] = useState<StudentActivity[]>([]);
  const [loading, setLoading] = useState({
    students: true,
    pathTemplates: true,
    rewardTemplates: true,
    pendingRewards: true,
    recentActivities: true,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Recupero degli studenti associati al genitore
        try {
          const studentsData = await StudentService.getStudentsByParent();
          setStudents(studentsData);
        } catch (err) {
          console.error('Errore nel recupero degli studenti:', err);
        } finally {
          setLoading(prev => ({ ...prev, students: false }));
        }

        // Recupero dei template dei percorsi
        try {
          const templatesData = await PathService.getAllPathTemplates();
          setPathTemplates(templatesData);
        } catch (err) {
          console.error('Errore nel recupero dei template dei percorsi:', err);
        } finally {
          setLoading(prev => ({ ...prev, pathTemplates: false }));
        }

        // Recupero dei template delle ricompense
        try {
          const rewardsData = await RewardService.getRewardTemplates();
          setRewardTemplates(rewardsData);
        } catch (err) {
          console.error('Errore nel recupero dei template delle ricompense:', err);
        } finally {
          setLoading(prev => ({ ...prev, rewardTemplates: false }));
        }

        // Recupero delle ricompense in attesa di approvazione
        try {
          const pendingRewardsData = await RewardService.getPendingRewards();
          setPendingRewards(pendingRewardsData);
        } catch (err) {
          console.error('Errore nel recupero delle ricompense in attesa:', err);
        } finally {
          setLoading(prev => ({ ...prev, pendingRewards: false }));
        }

        // Recupero delle attività recenti degli studenti
        try {
          const activitiesData = await StudentService.getAllStudentActivities();
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

  const handleApproveReward = async (rewardId: string) => {
    try {
      await RewardService.approveReward(rewardId);
      // Aggiorna la lista dopo l'approvazione
      setPendingRewards(pendingRewards.filter(reward => reward.id !== rewardId));
      NotificationsService.success('Ricompensa approvata con successo');
    } catch (err) {
      console.error('Errore nell\'approvazione della ricompensa:', err);
    }
  };

  const handleRejectReward = async (rewardId: string) => {
    try {
      await RewardService.rejectReward(rewardId);
      // Aggiorna la lista dopo il rifiuto
      setPendingRewards(pendingRewards.filter(reward => reward.id !== rewardId));
      NotificationsService.success('Ricompensa rifiutata');
    } catch (err) {
      console.error('Errore nel rifiuto della ricompensa:', err);
    }
  };

  return (
    <AnimatedPage transitionType="fade">
      <MainLayout title="Dashboard Genitore">
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <FadeIn>
            <Typography variant="h4" gutterBottom>
              Dashboard Genitore
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Benvenuto, {user?.firstName || 'Genitore'}! Gestisci i percorsi educativi e le ricompense per i tuoi studenti.
            </Typography>
          </FadeIn>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Sezione Studenti */}
            <Grid item xs={12} md={6}>
              <SlideInUp delay={0.1}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" component="h2">
                        <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        I tuoi studenti
                      </Typography>
                      <Button
                        startIcon={<PersonAddIcon />}
                        variant="outlined"
                        size="small"
                        onClick={() => navigate('/parent/students/new')}
                      >
                        Aggiungi
                      </Button>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    
                    {loading.students ? (
                      <Box sx={{ mt: 2 }}>
                        <CardSkeleton count={3} height={100} />
                      </Box>
                    ) : students.length === 0 ? (
                      <Alert severity="info">
                        Non hai ancora aggiunto studenti. Clicca su "Aggiungi" per iniziare.
                      </Alert>
                    ) : (
                      <List>
                        <AnimatedList>
                          {students.map((student) => (
                            <ListItem
                              key={student.id}
                              secondaryAction={
                                <IconButton 
                                  edge="end" 
                                  aria-label="visualizza"
                                  onClick={() => navigate(`/parent/students/${student.id}`)}
                                >
                                  <VisibilityIcon />
                                </IconButton>
                              }
                            >
                              <ListItemAvatar>
                                <Avatar src={student.avatar} alt={student.name}>
                                  {student.name.charAt(0)}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={student.name}
                                secondary={
                                  <>
                                    <Typography component="span" variant="body2">
                                      Username: {student.username}
                                    </Typography>
                                    <br />
                                    <Typography component="span" variant="body2">
                                      Punti: {student.points} <StarsIcon sx={{ fontSize: 16, verticalAlign: 'middle', color: 'gold' }} />
                                    </Typography>
                                    {student.pendingRewards > 0 && (
                                      <Chip
                                        size="small"
                                        label={`${student.pendingRewards} richieste`}
                                        color="secondary"
                                        sx={{ ml: 1, verticalAlign: 'middle' }}
                                      />
                                    )}
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
                      onClick={() => navigate('/parent/students')}
                      disabled={students.length === 0}
                    >
                      Gestisci studenti
                    </Button>
                  </CardActions>
                </Card>
              </SlideInUp>
            </Grid>

            {/* Sezione Ricompense in attesa */}
            <Grid item xs={12} md={6}>
              <SlideInUp delay={0.2}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                      <PendingIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Ricompense in attesa
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    {loading.pendingRewards ? (
                      <Box sx={{ mt: 2 }}>
                        <CardSkeleton count={2} height={100} />
                      </Box>
                    ) : pendingRewards.length === 0 ? (
                      <Alert severity="info">
                        Non ci sono ricompense in attesa di approvazione.
                      </Alert>
                    ) : (
                      <List>
                        <AnimatedList>
                          {pendingRewards.map((reward) => (
                            <ListItem key={reward.id}>
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                  <EmojiEventsIcon />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={reward.title}
                                secondary={
                                  <>
                                    <Typography component="span" variant="body2">
                                      Richiesto da: {reward.studentName}
                                    </Typography>
                                    <br />
                                    <Typography component="span" variant="body2">
                                      Costo: {reward.cost} punti
                                    </Typography>
                                    <br />
                                    <Typography component="span" variant="body2" color="text.secondary">
                                      {new Date(reward.requestDate).toLocaleDateString()}
                                    </Typography>
                                  </>
                                }
                              />
                              <Box>
                                <IconButton 
                                  color="success" 
                                  aria-label="approva"
                                  onClick={() => handleApproveReward(reward.id)}
                                >
                                  <CheckCircleIcon />
                                </IconButton>
                                <IconButton 
                                  color="error" 
                                  aria-label="rifiuta"
                                  onClick={() => handleRejectReward(reward.id)}
                                >
                                  <ThumbUpIcon sx={{ transform: 'rotate(180deg)' }} />
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
                      onClick={() => navigate('/parent/manage-rewards')}
                    >
                      Gestisci ricompense
                    </Button>
                  </CardActions>
                </Card>
              </SlideInUp>
            </Grid>

            {/* Sezione percorsi educativi */}
            <Grid item xs={12} md={6}>
              <SlideInUp delay={0.3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" component="h2">
                        <RouteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Percorsi educativi
                      </Typography>
                      <Button
                        startIcon={<AddCircleIcon />}
                        variant="outlined"
                        size="small"
                        onClick={() => navigate('/parent/paths/new')}
                      >
                        Crea nuovo
                      </Button>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    
                    {loading.pathTemplates ? (
                      <Box sx={{ mt: 2 }}>
                        <CardSkeleton count={3} height={80} />
                      </Box>
                    ) : pathTemplates.length === 0 ? (
                      <Alert severity="info">
                        Non hai ancora creato percorsi educativi. Clicca su "Crea nuovo" per iniziare.
                      </Alert>
                    ) : (
                      <List>
                        <AnimatedList>
                          {pathTemplates.slice(0, 3).map((template) => (
                            <ListItem key={template.id}>
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                  <SchoolIcon />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={template.title}
                                secondary={
                                  <>
                                    <Typography component="span" variant="body2" noWrap>
                                      {template.description.substring(0, 60)}
                                      {template.description.length > 60 ? '...' : ''}
                                    </Typography>
                                    <br />
                                    <Typography component="span" variant="body2">
                                      Quiz: {template.additional_data?.quizIds?.length || 0}
                                    </Typography>
                                  </>
                                }
                              />
                              <IconButton 
                                edge="end" 
                                aria-label="visualizza"
                                onClick={() => navigate(`/parent/paths/template/${template.id}`)}
                              >
                                <VisibilityIcon />
                              </IconButton>
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
                      onClick={() => navigate('/parent/paths')}
                    >
                      Gestisci percorsi
                    </Button>
                  </CardActions>
                </Card>
              </SlideInUp>
            </Grid>

            {/* Sezione attività recenti */}
            <Grid item xs={12} md={6}>
              <SlideInUp delay={0.4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                      <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Attività recenti
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    {loading.recentActivities ? (
                      <Box sx={{ mt: 2 }}>
                        <CardSkeleton count={4} height={80} />
                      </Box>
                    ) : recentActivities.length === 0 ? (
                      <Alert severity="info">
                        Non ci sono attività recenti da mostrare.
                      </Alert>
                    ) : (
                      <List>
                        <AnimatedList>
                          {recentActivities.slice(0, 5).map((activity) => (
                            <ListItem key={activity.id}>
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: getActivityColor(activity.type) }}>
                                  {getActivityIcon(activity.type)}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={`${activity.studentName} - ${activity.title}`}
                                secondary={
                                  <>
                                    <Typography component="span" variant="body2">
                                      {getActivityLabel(activity.type)}
                                    </Typography>
                                    <br />
                                    <Typography component="span" variant="body2" color="text.secondary">
                                      {new Date(activity.date).toLocaleString()}
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
                      onClick={() => navigate('/parent/activities')}
                      disabled={recentActivities.length === 0}
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

// Funzioni di utilità per le attività
const getActivityLabel = (type: string): string => {
  switch (type) {
    case 'path_completed':
      return 'Ha completato un percorso';
    case 'quiz_completed':
      return 'Ha completato un quiz';
    case 'reward_requested':
      return 'Ha richiesto una ricompensa';
    case 'reward_approved':
      return 'Ha ottenuto una ricompensa';
    default:
      return 'Attività';
  }
};

const getActivityColor = (type: string): string => {
  switch (type) {
    case 'path_completed':
      return 'success.main';
    case 'quiz_completed':
      return 'primary.main';
    case 'reward_requested':
      return 'warning.main';
    case 'reward_approved':
      return 'secondary.main';
    default:
      return 'grey.500';
  }
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'path_completed':
      return <RouteIcon />;
    case 'quiz_completed':
      return <AssignmentIcon />;
    case 'reward_requested':
      return <PendingIcon />;
    case 'reward_approved':
      return <EmojiEventsIcon />;
    default:
      return <PersonIcon />;
  }
};

export default ParentDashboard;
