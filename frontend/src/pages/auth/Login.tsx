import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Paper,
  CircularProgress,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { ApiErrorHandler } from '../../services/ApiErrorHandler';
import { NotificationsService } from '../../services/NotificationsService';
import Logo from '../../components/common/Logo';
import HoverAnimation from '../../components/animations/HoverAnimation';
import PageTransition from '../../components/animations/PageTransition';
import FadeInLoader from '../../components/animations/FadeInLoader';
import AnimatedCard from '../../components/animations/AnimatedCard';
import { motion } from 'framer-motion';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Uso useRef per tenere traccia delle chiamate in corso
  const isSubmitting = React.useRef(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[DEBUG PAGE LOGIN] handleSubmit chiamato');
    
    // Prevenzione doppia sottomissione con flag
    if (isSubmitting.current || isLoading) {
      console.log('[DEBUG PAGE LOGIN] Form già in invio, ignoro');
      return;
    }
    
    if (!email || !password) {
      NotificationsService.error('Inserisci email e password per accedere');
      return;
    }
    
    // Imposto flag per prevenire chiamate duplicate
    isSubmitting.current = true;
    setIsLoading(true);
    
    try {
      console.log('[DEBUG PAGE LOGIN] Invio richiesta login');
      await login(email, password);
      console.log('[DEBUG PAGE LOGIN] Login completato con successo');
      // Redirect di base - il componente ProtectedRoute reindirizzerà in base al ruolo
      navigate('/');
    } catch (error) {
      console.log('[DEBUG PAGE LOGIN] Errore login gestito:', error);
      // Disabilitiamo ApiErrorHandler qui perché la notifica di errore è già mostrata da AuthService
      // ApiErrorHandler.handleApiError(error);
    } finally {
      setIsLoading(false);
      isSubmitting.current = false;
    }
  };

  return (
    <PageTransition>
      <Container component="main" maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          py: 8
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <Logo height={80} />
        </motion.div>
        
        <Typography component="h1" variant="h4" sx={{ mt: 3, mb: 4, fontWeight: 700 }}>
          Accedi alla tua area personale
        </Typography>
        
        <AnimatedCard 
          hoverScale={1.02}
          sx={{ 
            width: '100%', 
            borderRadius: 2
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                variant="outlined"
                sx={{ mb: 3 }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                disabled={isLoading}
                sx={{ 
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600
                }}
              >
                {isLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress size={24} color="inherit" />
                  </Box>
                ) : (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    Accedi
                  </motion.span>
                )}
              </Button>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <Link component={RouterLink} to="/forgot-password" variant="body2" color="primary">
                  Password dimenticata?
                </Link>
                <Link component={RouterLink} to="/register" variant="body2" color="primary">
                  Non hai un account? Registrati
                </Link>
              </Box>
            </Box>
          </CardContent>
        </AnimatedCard>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
            App Educativa - Piattaforma educativa per scuole e famiglie
          </Typography>
        </motion.div>
      </Box>
    </Container>
    </PageTransition>
  );
};

export default Login;
