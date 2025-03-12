import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  Divider,
  Grid
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { ApiErrorHandler } from '../../services/ApiErrorHandler';
import { NotificationsService } from '../../services/NotificationsService';
import Logo from '../../components/common/Logo';
import HoverAnimation from '../../components/animations/HoverAnimation';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'admin' | 'parent' | 'student'>('parent');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validazione base
    if (!email || !password || !confirmPassword || !firstName || !lastName) {
      NotificationsService.error('Completa tutti i campi richiesti');
      return;
    }
    
    if (password !== confirmPassword) {
      NotificationsService.error('Le password non corrispondono');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await register({ 
        email, 
        password, 
        firstName, 
        lastName, 
        role,
        username: username || email.split('@')[0]  // Se non viene fornito username, usa la parte prima della @ nell'email
      });
      NotificationsService.success('Registrazione completata con successo');
      navigate('/login');
    } catch (error) {
      ApiErrorHandler.handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="md">
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
        
        <Typography component="h1" variant="h4" sx={{ mt: 3, mb: 4, fontWeight: 700 }}>
          Crea il tuo account
        </Typography>
        
        <Card 
          sx={{ 
            width: '100%', 
            borderRadius: 2,
            boxShadow: 3
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="firstName"
                    label="Nome"
                    name="firstName"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="lastName"
                    label="Cognome"
                    name="lastName"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    margin="normal"
                    fullWidth
                    id="username"
                    label="Username (opzionale)"
                    name="username"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    variant="outlined"
                    helperText="Se non specificato, verrà utilizzata la parte dell'email prima della @"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    id="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
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
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl component="fieldset" sx={{ mt: 2 }}>
                    <FormLabel component="legend">Tipo di account</FormLabel>
                    <RadioGroup
                      row
                      aria-label="role"
                      name="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'admin' | 'parent' | 'student')}
                    >
                      <FormControlLabel 
                        value="parent" 
                        control={<Radio />} 
                        label="Genitore" 
                      />
                      <FormControlLabel 
                        value="student" 
                        control={<Radio />} 
                        label="Studente" 
                      />
                    </RadioGroup>
                  </FormControl>
                </Grid>
              </Grid>
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                disabled={isLoading}
                sx={{ 
                  py: 1.5,
                  mt: 3,
                  mb: 2,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600
                }}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Registrati'}
              </Button>
              
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Link component={RouterLink} to="/login" variant="body2" color="primary">
                  Hai già un account? Accedi
                </Link>
              </Box>
            </Box>
          </CardContent>
        </Card>
        
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
          App Educativa - Piattaforma educativa per scuole e famiglie
        </Typography>
      </Box>
    </Container>
  );
};

export default Register;
