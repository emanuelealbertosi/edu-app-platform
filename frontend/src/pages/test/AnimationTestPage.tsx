import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  useTheme
} from '@mui/material';

// Importiamo i componenti di animazione
import { 
  FadeIn,
  SlideInLeft, 
  SlideInRight, 
  SlideInUp, 
  HoverAnimation, 
  StaggerContainer 
} from '../../components/animations/Transitions';
import { 
  LoadingIndicator, 
  PulseLoader,
  SkeletonLoader, 
  CardSkeleton,
  ProgressBar
} from '../../components/animations/LoadingAnimations';
import { 
  AnimatedPage, 
  AnimatedList,
  TransitionType
} from '../../components/animations/PageTransitions';

// Importiamo le notifiche per integrarle con le animazioni
import NotificationsService from '../../services/NotificationsService';

// Componente di test per mostrare le diverse animazioni disponibili
const AnimationTestPage: React.FC = () => {
  const theme = useTheme();
  
  // Stato per simulare vari stati di caricamento e progresso
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [listItems, setListItems] = useState<string[]>([]);
  const [selectedTransition, setSelectedTransition] = useState<TransitionType>('fade');
  
  // Simulazione caricamento
  useEffect(() => {
    // Simuliamo un caricamento
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Simulazione di un progresso
  useEffect(() => {
    if (progress < 100 && !loading) {
      const timer = setTimeout(() => {
        setProgress(prev => Math.min(prev + 5, 100));
      }, 300);
      
      return () => clearTimeout(timer);
    }
    
    if (progress === 100) {
      NotificationsService.success('Progress completato!', 'Successo');
    }
  }, [progress, loading]);
  
  // Simulazione aggiunta elementi alla lista
  useEffect(() => {
    if (!loading && listItems.length < 5) {
      const interval = setInterval(() => {
        setListItems(prev => [...prev, `Elemento ${prev.length + 1}`]);
      }, 800);
      
      return () => clearInterval(interval);
    }
  }, [loading, listItems.length]);

  // Funzione per simulare un caricamento
  const handleReload = () => {
    NotificationsService.info('Ricaricamento in corso...', 'Attendere');
    setLoading(true);
    setProgress(0);
    setListItems([]);
    
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  // Funzione per mostrare le notifiche
  const showNotification = (type: 'success' | 'error' | 'warning' | 'info') => {
    const messages = {
      success: 'Operazione completata con successo!',
      error: 'Si è verificato un errore durante l\'operazione.',
      warning: 'Attenzione: questa è una notifica di avviso.',
      info: 'Informazione: questa è una notifica informativa.'
    };
    
    const titles = {
      success: 'Successo',
      error: 'Errore',
      warning: 'Avviso',
      info: 'Informazione'
    };
    
    switch (type) {
      case 'success':
        NotificationsService.success(messages.success, titles.success);
        break;
      case 'error':
        NotificationsService.error(messages.error, titles.error);
        break;
      case 'warning':
        NotificationsService.warning(messages.warning, titles.warning);
        break;
      case 'info':
        NotificationsService.info(messages.info, titles.info);
        break;
    }
  };

  // Array di transizioni disponibili
  const transitions: TransitionType[] = [
    'fade', 
    'slideInLeft', 
    'slideInRight', 
    'slideInUp', 
    'slideInDown', 
    'zoomIn', 
    'zoomOut'
  ];

  return (
    <AnimatedPage transitionType={selectedTransition}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <FadeIn>
          <Typography variant="h4" gutterBottom>
            Test Animazioni e Transizioni
          </Typography>
          <Typography variant="body1" paragraph>
            Questa pagina dimostra le varie animazioni e transizioni disponibili nell'applicazione.
          </Typography>
        </FadeIn>

        {/* Selezione tipo di transizione */}
        <SlideInUp delay={0.2}>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Seleziona tipo di transizione di pagina
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                {transitions.map(transition => (
                  <Button 
                    key={transition}
                    variant={selectedTransition === transition ? 'contained' : 'outlined'}
                    color="primary"
                    onClick={() => {
                      setSelectedTransition(transition);
                      NotificationsService.info(`Transizione cambiata a: ${transition}`, 'Transizione');
                    }}
                    sx={{ mb: 1 }}
                  >
                    {transition}
                  </Button>
                ))}
              </Box>
            </CardContent>
          </Card>
        </SlideInUp>

        {loading ? (
          // Mostra animazioni di caricamento
          <SlideInUp delay={0.3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Indicatori di caricamento
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Caricamento standard
                      </Typography>
                      <LoadingIndicator text="Caricamento componenti..." />
                    </Box>
                    
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Pulse Loader
                      </Typography>
                      <PulseLoader />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Skeleton Loaders
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Skeleton di testo
                      </Typography>
                      <SkeletonLoader count={3} />
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        Skeleton card
                      </Typography>
                      <CardSkeleton count={1} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </SlideInUp>
        ) : (
          // Mostra contenuto con animazioni
          <>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <SlideInLeft delay={0.3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Transizioni di base
                      </Typography>
                      <Divider sx={{ mb: 3 }} />
                      
                      <Box sx={{ mb: 2 }}>
                        <HoverAnimation>
                          <Paper 
                            elevation={2} 
                            sx={{ 
                              p: 2, 
                              bgcolor: theme.palette.primary.light,
                              color: theme.palette.primary.contrastText
                            }}
                          >
                            <Typography>
                              Questo elemento ha un'animazione al passaggio del mouse (hover)
                            </Typography>
                          </Paper>
                        </HoverAnimation>
                      </Box>
                      
                      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                        Progresso: {progress}%
                      </Typography>
                      <ProgressBar progress={progress} height={12} />
                      
                      <Button 
                        variant="outlined" 
                        color="primary" 
                        onClick={handleReload}
                        sx={{ mt: 3 }}
                      >
                        Ricarica animazioni
                      </Button>
                    </CardContent>
                  </Card>
                </SlideInLeft>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <SlideInRight delay={0.4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Animazioni di lista
                      </Typography>
                      <Divider sx={{ mb: 3 }} />
                      
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Gli elementi vengono aggiunti con animazione staggered:
                      </Typography>
                      
                      <List>
                        <AnimatedList>
                          {listItems.map((item, index) => (
                            <ListItem
                              key={index}
                              divider={index < listItems.length - 1}
                            >
                              <ListItemText primary={item} />
                            </ListItem>
                          ))}
                        </AnimatedList>
                      </List>
                      
                      {listItems.length === 0 && (
                        <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                          Gli elementi appariranno presto...
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </SlideInRight>
              </Grid>
            </Grid>
            
            <SlideInUp delay={0.5}>
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Integrazione con notifiche
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Typography variant="body2" paragraph>
                    Le animazioni si integrano perfettamente con il sistema di notifiche già implementato.
                    Prova a visualizzare diversi tipi di notifiche:
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Button 
                      variant="contained" 
                      color="success" 
                      onClick={() => showNotification('success')}
                    >
                      Notifica Successo
                    </Button>
                    <Button 
                      variant="contained" 
                      color="error" 
                      onClick={() => showNotification('error')}
                    >
                      Notifica Errore
                    </Button>
                    <Button 
                      variant="contained" 
                      color="warning" 
                      onClick={() => showNotification('warning')}
                    >
                      Notifica Avviso
                    </Button>
                    <Button 
                      variant="contained" 
                      color="info" 
                      onClick={() => showNotification('info')}
                    >
                      Notifica Info
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </SlideInUp>
          </>
        )}
      </Container>
    </AnimatedPage>
  );
};

export default AnimationTestPage;
