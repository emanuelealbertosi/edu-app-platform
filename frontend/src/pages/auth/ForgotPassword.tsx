import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      NotificationsService.error('Inserisci la tua email per reimpostare la password');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simuliamo la chiamata all'API per richiedere il reset della password
      // await AuthService.requestPasswordReset(email);
      
      // Per ora lo simuliamo con un timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsSubmitted(true);
      NotificationsService.success('Abbiamo inviato un link per reimpostare la password alla tua email');
    } catch (error) {
      ApiErrorHandler.handleApiError(error);
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
          Password dimenticata?
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
          Inserisci la tua email e ti invieremo un link per reimpostare la password
        </Typography>
        
        <Card 
          sx={{ 
            width: '100%', 
            borderRadius: 2,
            boxShadow: 3
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {isSubmitted ? (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Alert severity="success" sx={{ mb: 3 }}>
                  Abbiamo inviato un link per reimpostare la password a: <strong>{email}</strong>
                </Alert>
                <Typography variant="body1" paragraph>
                  Controlla la tua email e segui le istruzioni per reimpostare la password.
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Se non ricevi l'email entro qualche minuto, controlla anche la cartella spam.
                </Typography>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="contained"
                  color="primary"
                  sx={{ mt: 2 }}
                >
                  Torna al login
                </Button>
              </Box>
            ) : (
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
                  {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Invia link di reset'}
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

export default ForgotPassword;
