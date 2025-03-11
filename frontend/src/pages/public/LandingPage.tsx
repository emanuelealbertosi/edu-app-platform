import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  Button,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  AppBar,
  Toolbar,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import QuizIcon from '@mui/icons-material/Quiz';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const redirectToUserDashboard = () => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'parent') {
        navigate('/parent');
      } else if (user.role === 'student') {
        navigate('/student');
      }
    }
  };

  React.useEffect(() => {
    // Redirect if already authenticated
    redirectToUserDashboard();
  }, []);

  const features = [
    {
      icon: <QuizIcon fontSize="large" color="primary" />,
      title: 'Quiz Personalizzati',
      description: 'Quiz interattivi progettati per rendere l\'apprendimento coinvolgente e divertente.',
    },
    {
      icon: <SchoolIcon fontSize="large" color="primary" />,
      title: 'Percorsi Educativi',
      description: 'Percorsi di apprendimento personalizzati per guidare gli studenti verso il successo.',
    },
    {
      icon: <EmojiEventsIcon fontSize="large" color="primary" />,
      title: 'Sistema di Ricompense',
      description: 'Ricompense e badge per motivare gli studenti a raggiungere i loro obiettivi.',
    },
    {
      icon: <FamilyRestroomIcon fontSize="large" color="primary" />,
      title: 'Coinvolgimento dei Genitori',
      description: 'Strumenti per i genitori per monitorare e supportare il percorso educativo dei loro figli.',
    },
  ];

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            App Educativa
          </Typography>
          <Button 
            color="inherit" 
            onClick={() => navigate('/login')}
            sx={{ mr: 2 }}
          >
            Accedi
          </Button>
          <Button 
            color="inherit" 
            variant="outlined"
            onClick={() => navigate('/register')}
          >
            Registrati
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          bgcolor: 'background.paper',
          pt: 8,
          pb: 6,
        }}
      >
        <Container maxWidth="sm">
          <Typography
            component="h1"
            variant="h2"
            align="center"
            color="text.primary"
            gutterBottom
          >
            Impara. Cresci. Ottieni ricompense.
          </Typography>
          <Typography variant="h5" align="center" color="text.secondary" paragraph>
            La nostra piattaforma educativa aiuta gli studenti a imparare in modo divertente e interattivo,
            mentre i genitori possono monitorare e guidare il loro percorso educativo.
          </Typography>
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => navigate('/register')}
              sx={{ minWidth: 200 }}
            >
              Inizia Ora
            </Button>
          </Box>
        </Container>
      </Box>

      <Container sx={{ py: 8 }} maxWidth="md">
        <Typography
          component="h2"
          variant="h3"
          align="center"
          color="text.primary"
          gutterBottom
        >
          Caratteristiche Principali
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }}>
          {features.map((feature, index) => (
            <Grid item key={index} xs={12} sm={6} md={3}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 2,
                  transition: '0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  },
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {feature.icon}
                </Box>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h3" align="center">
                    {feature.title}
                  </Typography>
                  <Typography align="center">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[200]
              : theme.palette.grey[800],
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="body1" align="center">
            © {new Date().getFullYear()} App Educativa. Tutti i diritti riservati.
          </Typography>
        </Container>
      </Box>
    </>
  );
};

export default LandingPage;
