import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../../components/layout/MainLayout';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Divider,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StarsIcon from '@mui/icons-material/Stars';
import FilterListIcon from '@mui/icons-material/FilterList';

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
interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number;
  imageUrl?: string;
  category: string;
}

const RewardShop: React.FC = () => {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // In un'implementazione reale, queste sarebbero chiamate API reali
        // Per ora utilizziamo dati di esempio
        
        setTimeout(() => {
          const mockRewards: Reward[] = [
            {
              id: '1',
              title: 'Tempo Extra Videogiochi',
              description: '30 minuti extra per giocare ai videogiochi',
              cost: 100,
              imageUrl: 'https://via.placeholder.com/300x200?text=Videogiochi',
              category: 'Tempo Libero',
            },
            {
              id: '2',
              title: 'Film a Scelta',
              description: 'Scegli un film da vedere in famiglia',
              cost: 150,
              imageUrl: 'https://via.placeholder.com/300x200?text=Film',
              category: 'Intrattenimento',
            },
            {
              id: '3',
              title: 'Uscita al Parco',
              description: 'Pomeriggio al parco con gli amici',
              cost: 200,
              imageUrl: 'https://via.placeholder.com/300x200?text=Parco',
              category: 'Attività',
            },
            {
              id: '4',
              title: 'Libro Nuovo',
              description: 'Un libro a tua scelta',
              cost: 250,
              imageUrl: 'https://via.placeholder.com/300x200?text=Libro',
              category: 'Educazione',
            },
            {
              id: '5',
              title: 'Gelato Speciale',
              description: 'Un gelato con tutti i gusti che vuoi',
              cost: 80,
              imageUrl: 'https://via.placeholder.com/300x200?text=Gelato',
              category: 'Cibo',
            },
            {
              id: '6',
              title: 'Serata Pizza',
              description: 'Pizza per cena con la famiglia',
              cost: 180,
              imageUrl: 'https://via.placeholder.com/300x200?text=Pizza',
              category: 'Cibo',
            },
          ];
          
          setRewards(mockRewards);
          setUserPoints(320); // Punti dell'utente simulati
          setLoading(false);
        }, 800);
        
      } catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRedeemClick = (reward: Reward) => {
    setSelectedReward(reward);
    setOpenDialog(true);
  };

  const handleConfirmRedeem = async () => {
    if (!selectedReward) return;
    
    // In un'implementazione reale, qui ci sarebbe una chiamata API
    // per redimere la ricompensa
    console.log(`Richiesta ricompensa: ${selectedReward.title}`);
    
    // Aggiorna i punti dell'utente localmente (simulato)
    setUserPoints(prevPoints => prevPoints - selectedReward.cost);
    
    // Chiudi il dialog
    setOpenDialog(false);
    setSelectedReward(null);
  };

  // Raggruppa ricompense per categoria
  const rewardsByCategory = rewards.reduce((acc, reward) => {
    if (!acc[reward.category]) {
      acc[reward.category] = [];
    }
    acc[reward.category].push(reward);
    return acc;
  }, {} as Record<string, Reward[]>);

  return (
    <AnimatedPage transitionType="fade">
      <MainLayout title="Negozio Premi">
        <Box sx={{ p: { xs: 1, sm: 3 } }}>
          <FadeIn>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                Negozio Premi
              </Typography>
              
              <HoverAnimation>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  bgcolor: 'primary.main', 
                  color: 'white', 
                  py: 1, 
                  px: 2, 
                  borderRadius: 2 
                }}>
                  <StarsIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">{userPoints} punti</Typography>
                </Box>
              </HoverAnimation>
            </Box>
          </FadeIn>

          {loading ? (
            <Grid container spacing={3}>
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item}>
                  <CardSkeleton height={300} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <>
              <SlideInUp>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button 
                    startIcon={<FilterListIcon />}
                    variant="outlined"
                    size="small"
                    onClick={() => alert('Funzionalità di filtro da implementare')}
                  >
                    Filtra per categoria
                  </Button>
                </Box>
              </SlideInUp>
            
              <Grid container spacing={3}>
                <AnimatedList>
                  {rewards.map((reward, index) => (
                    <Grid item xs={12} sm={6} md={4} key={reward.id}>
                      <HoverAnimation delay={index * 0.1}>
                        <Card 
                          elevation={3} 
                          sx={{ 
                            height: '100%', 
                            display: 'flex', 
                            flexDirection: 'column',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-5px)',
                              boxShadow: 6
                            }
                          }}
                        >
                          <CardMedia
                            component="img"
                            height="140"
                            image={reward.imageUrl}
                            alt={reward.title}
                          />
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Typography variant="h6" component="h2">
                                {reward.title}
                              </Typography>
                              <Chip 
                                label={`${reward.cost} pt`} 
                                color={userPoints >= reward.cost ? "primary" : "default"} 
                                size="small" 
                                icon={<StarsIcon />} 
                              />
                            </Box>
                            <Chip 
                              label={reward.category} 
                              size="small" 
                              variant="outlined"
                              sx={{ mb: 2 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {reward.description}
                            </Typography>
                          </CardContent>
                          <CardActions>
                            <Button 
                              variant="contained" 
                              fullWidth
                              startIcon={<ShoppingCartIcon />}
                              disabled={userPoints < reward.cost}
                              onClick={() => handleRedeemClick(reward)}
                              color={userPoints >= reward.cost ? "primary" : "inherit"}
                              sx={{ mt: 'auto' }}
                            >
                              {userPoints >= reward.cost ? "Riscatta" : "Punti insufficienti"}
                            </Button>
                          </CardActions>
                        </Card>
                      </HoverAnimation>
                    </Grid>
                  ))}
                </AnimatedList>
              </Grid>
            </>
          )}
          
          <Dialog
            open={openDialog}
            onClose={() => setOpenDialog(false)}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <SlideInUp>
              <DialogTitle id="alert-dialog-title">
                {`Riscatta "${selectedReward?.title}"`}
              </DialogTitle>
              <DialogContent>
                <DialogContentText id="alert-dialog-description">
                  Sei sicuro di voler riscattare questo premio? Ti verranno addebitati {selectedReward?.cost} punti.
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenDialog(false)} color="primary">
                  Annulla
                </Button>
                <Button onClick={handleConfirmRedeem} color="primary" variant="contained" autoFocus>
                  Conferma
                </Button>
              </DialogActions>
            </SlideInUp>
          </Dialog>
        </Box>
      </MainLayout>
    </AnimatedPage>
  );
};

export default RewardShop;
