import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  CircularProgress,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import { ApiErrorHandler } from '../../services/ApiErrorHandler';
import { NotificationsService } from '../../services/NotificationsService';
import Logo from '../../components/common/Logo';
import HoverAnimation from '../../components/animations/HoverAnimation';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    // Verifica che il token sia presente nell'URL
    if (!token) {
      setIsError(true);
      setErrorMessage('Token di reset non valido o mancante');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validazione
    if (!password || !confirmPassword) {
      NotificationsService.error('Inserisci la nuova password');
      return;
    }
    
    if (password !== confirmPassword) {
      NotificationsService.error('Le password non corrispondono');
      return;
    }
    
    if (password.length < 8) {
      NotificationsService.error('La password deve essere di almeno 8 caratteri');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulazione della chiamata API per il reset della password
      // await AuthService.resetPassword(token, password);
      
      // Per ora simuliamo con un timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsSuccess(true);
      NotificationsService.success('Password reimpostata con successo');
      
      // Redirect al login dopo 3 secondi
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error) {
      ApiErrorHandler.handleApiError(error);
      setIsError(true);
      setErrorMessage('Impossibile reimpostare la password. Il token potrebbe essere scaduto.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
        <HoverAnimation>
          <Logo height={80} />
        </HoverAnimation>
        
        <Typography component="h1" variant="h4" sx={{ mt: 3, mb: 2, fontWeight: 700 }}>
          Reimposta la tua password
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
          Inserisci una nuova password per il tuo account
        </Typography>
        
        <Card 
          sx={{ 
            width: '100%', 
            borderRadius: 2,
            boxShadow: 3
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {isSuccess ? (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Alert severity="success" sx={{ mb: 3 }}>
                  Password reimpostata con successo!
                </Alert>
                <Typography variant="body1" paragraph>
                  La tua password è stata aggiornata correttamente.
                </Typography>
                <Typography variant="body2" paragraph>
                  Verrai reindirizzato alla pagina di login tra pochi secondi...
                </Typography>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="contained"
                  color="primary"
                  sx={{ mt: 2 }}
                >
                  Vai al login
                </Button>
              </Box>
            ) : isError ? (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Alert severity="error" sx={{ mb: 3 }}>
                  {errorMessage}
                </Alert>
                <Typography variant="body1" paragraph>
                  Si è verificato un errore durante il reset della password.
                </Typography>
                <Typography variant="body2" paragraph>
                  Prova a richiedere un nuovo link di reset password o contatta il supporto.
                </Typography>
                <Button
                  component={RouterLink}
                  to="/forgot-password"
                  variant="contained"
                  color="primary"
                  sx={{ mt: 2 }}
                >
                  Richiedi nuovo link
                </Button>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Nuova Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Conferma Password"
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Reimposta Password'}
                </Button>
                
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Link component={RouterLink} to="/login" variant="body2" color="primary">
                    Torna alla pagina di login
                  </Link>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
        
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
          App Educativa - Piattaforma educativa per scuole e famiglie
        </Typography>
      </Box>
    </Container>
  );
};

export default ResetPassword;
