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
    <MainLayout title="Shop Ricompense">
      <Box sx={{ pb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Shop Ricompense
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Usa i tuoi punti per riscattare ricompense speciali
        </Typography>
      </Box>

      {/* Punti utente */}
      <Card sx={{ mb: 4, p: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <StarsIcon sx={{ fontSize: 40, mr: 2 }} />
          <Box>
            <Typography variant="h6">I tuoi punti disponibili:</Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              {loading ? <LinearProgress color="inherit" /> : userPoints}
            </Typography>
          </Box>
        </Box>
      </Card>

      {loading ? (
        <LinearProgress />
      ) : (
        Object.entries(rewardsByCategory).map(([category, categoryRewards]) => (
          <Box key={category} sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ShoppingCartIcon sx={{ mr: 1 }} />
              <Typography variant="h5">{category}</Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              {categoryRewards.map((reward) => (
                <Grid item xs={12} sm={6} md={4} key={reward.id}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      transition: 'transform 0.3s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: 6,
                      }
                    }}
                  >
                    {reward.imageUrl && (
                      <CardMedia
                        component="img"
                        height="140"
                        image={reward.imageUrl}
                        alt={reward.title}
                      />
                    )}
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="div" gutterBottom>
                        {reward.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {reward.description}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                        <Chip 
                          icon={<StarsIcon />} 
                          label={`${reward.cost} punti`}
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button 
                        variant="contained" 
                        fullWidth
                        disabled={userPoints < reward.cost}
                        onClick={() => handleRedeemClick(reward)}
                      >
                        {userPoints >= reward.cost ? 'Riscatta' : 'Punti insufficienti'}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))
      )}

      {/* Dialog di conferma */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      >
        <DialogTitle>Conferma richiesta</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Sei sicuro di voler richiedere la ricompensa "{selectedReward?.title}"? 
            Verranno detratti {selectedReward?.cost} punti dal tuo saldo.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="primary">
            Annulla
          </Button>
          <Button onClick={handleConfirmRedeem} color="primary" variant="contained">
            Conferma
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
};

export default RewardShop;
