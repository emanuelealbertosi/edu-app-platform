import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Button,
  TextField,
  Chip,
  Divider,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Badge,
  Tabs,
  Tab,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  ShoppingCart as CartIcon,
  Redeem as RedeemIcon,
  Search as SearchIcon,
  EmojiEvents as TrophyIcon,
  School as SchoolIcon,
  Stars as StarsIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import MainLayout from '../../components/layouts/MainLayout';
import PageTransition from '../../components/animations/PageTransition';
import HoverAnimation from '../../components/animations/HoverAnimation';
import RewardCard from '../../components/animations/RewardCard';
import { ApiErrorHandler } from '../../services/ApiErrorHandler';
import { NotificationsService } from '../../services/NotificationsService';
import RewardService, { RewardTemplate, RedemptionRequest, RedemptionResponse } from '../../services/RewardService';
import { getCategoryChip } from '../../utils/categoryUtils';
import StudentService, { StudentStatistics } from '../../services/StudentService';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import AnimatedNumber from '../../components/animations/AnimatedNumber';
import SuccessConfetti from '../../components/animations/SuccessConfetti';

interface CartItem {
  reward: RewardTemplate;
  quantity: number;
}

const RewardsStore: React.FC = () => {
  const { user } = useAuth();
  const [availableRewards, setAvailableRewards] = useState<RewardTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartDialogOpen, setCartDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [rewardToRedeem, setRewardToRedeem] = useState<RewardTemplate | null>(null);
  const [studentStats, setStudentStats] = useState<StudentStatistics | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [redeemLoading, setRedeemLoading] = useState(false);

  useEffect(() => {
    fetchRewards();
    fetchStudentStats();
  }, []);

  const fetchRewards = async () => {
    console.log('RewardsStore: Inizio fetchRewards');
    setLoading(true);
    try {
      // Utilizziamo il servizio reale per ottenere i premi disponibili
      console.log('RewardsStore: Chiamata a RewardService.getAvailableRewards()');
      const rewards = await RewardService.getAvailableRewards();
      console.log('RewardsStore: Ricevute ricompense:', rewards);
      console.log('RewardsStore: Numero di ricompense ricevute:', rewards.length);
      
      // Verifichiamo che i dati ricevuti siano nel formato corretto
      if (rewards && rewards.length > 0) {
        console.log('RewardsStore: Prima ricompensa:', rewards[0]);
      }
      
      setAvailableRewards(rewards);
      setLoading(false);
    } catch (error) {
      console.error('RewardsStore: Errore in fetchRewards:', error);
      ApiErrorHandler.handleApiError(error);
      setLoading(false);
    }
  };

  const fetchStudentStats = async () => {
    try {
      // Utilizziamo il servizio reale per ottenere le statistiche dello studente
      const stats = await StudentService.getStudentStatistics(user?.id || '');
      setStudentStats(stats);
    } catch (error) {
      ApiErrorHandler.handleApiError(error);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddToCart = (reward: RewardTemplate) => {
    const existingItem = cartItems.find(item => item.reward.id === reward.id);
    
    if (existingItem) {
      // Se l'articolo è già nel carrello, aumenta la quantità
      setCartItems(cartItems.map(item => 
        item.reward.id === reward.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      // Altrimenti, aggiungi l'articolo al carrello
      setCartItems([...cartItems, { reward, quantity: 1 }]);
    }
    
    NotificationsService.success(`${reward.title} aggiunto al carrello`);
  };

  const handleCartDialogOpen = () => {
    setCartDialogOpen(true);
  };

  const handleCartDialogClose = () => {
    setCartDialogOpen(false);
  };

  const handleRemoveFromCart = (rewardId: string) => {
    setCartItems(cartItems.filter(item => item.reward.id !== rewardId));
  };

  const handleUpdateQuantity = (rewardId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(rewardId);
      return;
    }
    
    setCartItems(cartItems.map(item => 
      item.reward.id === rewardId 
        ? { ...item, quantity: newQuantity } 
        : item
    ));
  };

  const handleRedeemClick = (reward: RewardTemplate) => {
    setRewardToRedeem(reward);
    setConfirmDialogOpen(true);
  };

  const handleConfirmDialogClose = () => {
    setConfirmDialogOpen(false);
    setRewardToRedeem(null);
  };

  const handleRedeemReward = async () => {
    if (!rewardToRedeem || !studentStats) return;
    
    if (studentStats.totalPoints < rewardToRedeem.pointsCost) {
      NotificationsService.error('Punti insufficienti per riscattare questo premio');
      handleConfirmDialogClose();
      return;
    }

    setRedeemLoading(true);
    try {
      // Creiamo la richiesta di riscatto
      const redemptionRequest: RedemptionRequest = {
        templateId: rewardToRedeem.id,
        studentId: user?.id || ''
      };
      
      // Chiamata al servizio reale per riscattare il premio
      const response = await RewardService.redeemReward(redemptionRequest);
      
      // Aggiorna le statistiche dello studente
      await fetchStudentStats();
      
      // Il messaggio di successo viene già mostrato dal service nel metodo redeemReward,
      // ma impostiamo anche un messaggio locale per l'interfaccia utente
      setSuccessMessage(`Premio "${rewardToRedeem.title}" riscattato con successo!`);
      
      // Mostra l'animazione di coriandoli
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      
      // Chiudiamo il dialogo di conferma
      handleConfirmDialogClose();
      
      // Aggiorniamo la lista dei premi disponibili
      fetchRewards();
    } catch (error) {
      ApiErrorHandler.handleApiError(error);
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleSuccessAlertClose = () => {
    setSuccessMessage('');
  };
  
  // Funzione per gestire il riscatto di tutti i premi nel carrello
  const handleRedeemAllFromCart = async () => {
    if (cartItems.length === 0 || !studentStats) return;
    
    if (getTotalCartPoints() > studentStats.totalPoints) {
      NotificationsService.error('Punti insufficienti per riscattare tutti questi premi');
      return;
    }
    
    setRedeemLoading(true);
    try {
      // Riscattiamo ogni premio nel carrello
      for (const item of cartItems) {
        const redemptionRequest: RedemptionRequest = {
          templateId: item.reward.id,
          studentId: user?.id || ''
        };
        
        await RewardService.redeemReward(redemptionRequest);
      }
      
      // Aggiorna le statistiche dello studente
      await fetchStudentStats();
      
      // Svuota il carrello
      setCartItems([]);
      
      // Chiudi il dialogo
      handleCartDialogClose();
      
      // Mostra messaggio di successo
      setSuccessMessage('Tutti i premi sono stati riscattati con successo!');
      
      // Aggiorniamo la lista dei premi disponibili
      fetchRewards();
    } catch (error) {
      ApiErrorHandler.handleApiError(error);
    } finally {
      setRedeemLoading(false);
    }
  };

  const getFilteredRewardsByTab = () => {
    let filtered = availableRewards.filter(reward => {
      const searchLower = searchQuery.toLowerCase();
      return (
        reward.title.toLowerCase().includes(searchLower) ||
        reward.description.toLowerCase().includes(searchLower)
      );
    });
    
    switch (tabValue) {
      case 0: // Tutti
        return filtered;
      case 1: // Digitali
        return filtered.filter(reward => reward.category === 'digitale');
      case 2: // Fisici
        return filtered.filter(reward => reward.category === 'fisico');
      case 3: // Privilegi
        return filtered.filter(reward => reward.category === 'privilegio');
      default:
        return filtered;
    }
  };

  const getCategoryChip = (category: string) => {
    switch (category) {
      case 'digitale':
        return <Chip icon={<StarsIcon />} label="Digitale" color="info" size="small" />;
      case 'fisico':
        return <Chip icon={<SchoolIcon />} label="Fisico" color="success" size="small" />;
      case 'privilegio':
        return <Chip icon={<TrophyIcon />} label="Privilegio" color="warning" size="small" />;
      default:
        return <Chip label={category} size="small" />;
    }
  };

  const getTotalCartPoints = () => {
    return cartItems.reduce((total, item) => total + (item.reward.pointsCost * item.quantity), 0);
  };

  const isRewardAffordable = (points: number): boolean => {
    return studentStats ? points <= studentStats.totalPoints : false;
  };

  // Varianti di animazione per Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.05,
        when: "beforeChildren"
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
  };

  const fadeVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  return (
    <MainLayout>
      <PageTransition>
      {showConfetti && <SuccessConfetti />}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Negozio Premi
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Utilizza i tuoi punti per riscattare fantastici premi
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Paper sx={{ p: 1.5, display: 'flex', alignItems: 'center', mr: 2 }}>
              <StarsIcon sx={{ color: 'warning.main', mr: 1 }} />
              <motion.div 
                animate={{ 
                  scale: [1, studentStats?.totalPoints ? 1.1 : 1, 1],
                  rotate: [0, studentStats?.totalPoints ? 5 : 0, 0] 
                }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <AnimatedNumber 
                  value={studentStats?.totalPoints || 0}
                  variant="h6" 
                  color="warning.main"
                  formatValue={(val) => `${val} punti`}
                  duration={0.8}
                />
              </motion.div>
            </Paper>
            <HoverAnimation>
              <Badge badgeContent={cartItems.length} color="secondary">
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CartIcon />}
                  onClick={handleCartDialogOpen}
                  disabled={cartItems.length === 0}
                >
                  Carrello
                </Button>
              </Badge>
            </HoverAnimation>
          </Box>
        </Box>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
            <TextField
              label="Cerca premi"
              variant="outlined"
              size="small"
              fullWidth
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Cerca per titolo o descrizione..."
            />
          </Box>

          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            sx={{ mb: 2 }}
          >
            <Tab label="Tutti" />
            <Tab label="Digitali" />
            <Tab label="Fisici" />
            <Tab label="Privilegi" />
          </Tabs>
          
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3, flexDirection: 'column', alignItems: 'center' }}>
                <CircularProgress size={60} />
                <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
                  Caricamento premi...
                </Typography>
              </Box>
            </motion.div>
          ) : (
            <AnimatePresence>
              <Grid container spacing={3}>
                {getFilteredRewardsByTab().length > 0 ? (
                  getFilteredRewardsByTab().map((reward) => (
                    <Grid item xs={12} sm={6} md={4} key={reward.id}>
                      <RewardCard 
                        reward={reward}
                        onRedeemClick={handleRedeemClick}
                        isRewardAffordable={isRewardAffordable}
                        getCategoryChip={getCategoryChip}
                      />
                    </Grid>
                  ))
                ) : (
                  <Grid item xs={12}>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="h6" color="textSecondary">
                        Nessun premio trovato
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Prova a modificare i criteri di ricerca
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </AnimatePresence>
          )}
        </Paper>

        {/* Dialog per visualizzare il carrello */}
        <AnimatePresence>
          {cartDialogOpen && (
            <Dialog
              open={cartDialogOpen}
              onClose={handleCartDialogClose}
              maxWidth="sm"
              fullWidth
              TransitionComponent={React.forwardRef((props: any, ref: React.Ref<HTMLDivElement>) => (
                <motion.div
                  ref={ref}
                  {...props}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Il tuo carrello</Typography>
              <IconButton onClick={handleCartDialogClose}>
                <ClearIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {cartItems.length > 0 ? (
              <Box>
                {cartItems.map((item) => (
                  <Card key={item.reward.id} sx={{ mb: 2 }}>
                    <CardContent sx={{ pb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="h6">
                          {item.reward.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <StarsIcon sx={{ color: 'warning.main', mr: 0.5 }} />
                          <Typography variant="body1" color="warning.main">
                            {item.reward.pointsCost} punti
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        {item.reward.description}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Button 
                            size="small" 
                            variant="outlined"
                            onClick={() => handleUpdateQuantity(item.reward.id, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <Typography sx={{ mx: 1 }}>
                            {item.quantity}
                          </Typography>
                          <Button 
                            size="small" 
                            variant="outlined"
                            onClick={() => handleUpdateQuantity(item.reward.id, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </Box>
                        <Button 
                          size="small" 
                          color="error"
                          onClick={() => handleRemoveFromCart(item.reward.id)}
                        >
                          Rimuovi
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Totale:</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <StarsIcon sx={{ color: 'warning.main', mr: 0.5 }} />
                    <Typography variant="h6" color="warning.main">
                      {getTotalCartPoints()} punti
                    </Typography>
                  </Box>
                </Box>

                {studentStats && getTotalCartPoints() > studentStats.totalPoints && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    Non hai abbastanza punti per riscattare tutti questi premi
                  </Alert>
                )}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h6" color="textSecondary">
                  Il tuo carrello è vuoto
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Aggiungi dei premi per procedere
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleCartDialogClose}
              color="primary"
            >
              Continua a esplorare
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleRedeemAllFromCart}
              disabled={cartItems.length === 0 || (studentStats && getTotalCartPoints() > studentStats.totalPoints) || redeemLoading}
            >
              {redeemLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, rotate: 360 }}
                  transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                >
                  <CircularProgress size={24} />
                </motion.div>
              ) : 'Procedi al riscatto'}
            </Button>
          </DialogActions>
            </Dialog>
          )}
        </AnimatePresence>

        {/* Dialog di conferma riscatto */}
        <AnimatePresence>
          {confirmDialogOpen && (
            <Dialog
              open={confirmDialogOpen}
              onClose={handleConfirmDialogClose}
              TransitionComponent={React.forwardRef((props: any, ref: React.Ref<HTMLDivElement>) => (
                <motion.div
                  ref={ref}
                  {...props}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            >
          <DialogTitle>Conferma riscatto</DialogTitle>
          <DialogContent>
            {rewardToRedeem && (
              <Box>
                <Typography variant="body1" gutterBottom>
                  Sei sicuro di voler riscattare il premio:
                </Typography>
                <Typography variant="h6" gutterBottom>
                  {rewardToRedeem.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <StarsIcon sx={{ color: 'warning.main', mr: 0.5 }} />
                  <Typography variant="body1" color="warning.main">
                    {rewardToRedeem.pointsCost} punti
                  </Typography>
                </Box>
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    I punti verranno automaticamente detratti dal tuo saldo.
                  </Typography>
                </motion.div>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleConfirmDialogClose}
              disabled={redeemLoading}
            >
              Annulla
            </Button>
            <Button 
              onClick={handleRedeemReward} 
              color="primary" 
              variant="contained"
              disabled={redeemLoading}
            >
              {redeemLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, rotate: 360 }}
                  transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                >
                  <CircularProgress size={24} />
                </motion.div>
              ) : 'Conferma'}
            </Button>
          </DialogActions>
            </Dialog>
          )}
        </AnimatePresence>

        {/* Snackbar per messaggio di successo */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{ position: 'fixed', bottom: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}
            >
              <Snackbar 
                open={Boolean(successMessage)} 
                autoHideDuration={6000} 
                onClose={handleSuccessAlertClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              >
                <Alert 
                  onClose={handleSuccessAlertClose} 
                  severity="success"
                  variant="filled"
                  sx={{ minWidth: '300px' }}
                  icon={<motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  >
                    <StarsIcon />
                  </motion.div>}
                >
                  {successMessage}
                </Alert>
              </Snackbar>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Animazione di coriandoli per il successo */}
        {showConfetti && <SuccessConfetti />}
      </Container>
      </motion.div>
      </PageTransition>
    </MainLayout>
  );
};

export default RewardsStore;
