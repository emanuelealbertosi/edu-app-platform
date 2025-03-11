import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  TextField,
  Button,
  Typography,
  Box,
  Link,
  Paper,
  Grid,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

// Importazione componenti di animazione
import { 
  FadeIn, 
  SlideInUp, 
  SlideInRight
} from '../../components/animations/Transitions';
import { LoadingIndicator } from '../../components/animations/LoadingAnimations';
import { AnimatedPage } from '../../components/animations/PageTransitions';

interface FormState {
  email: string;
  password: string;
  errors: {
    email?: string;
    password?: string;
    general?: string;
  };
}

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const [formState, setFormState] = useState<FormState>({
    email: '',
    password: '',
    errors: {},
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Reindirizza se già autenticato
  React.useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'parent') {
        navigate('/parent');
      } else if (user.role === 'student') {
        navigate('/student');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const validateForm = (): boolean => {
    const errors: FormState['errors'] = {};
    let isValid = true;

    if (!formState.email) {
      errors.email = "L'email è obbligatoria";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formState.email)) {
      errors.email = "Inserisci un'email valida";
      isValid = false;
    }

    if (!formState.password) {
      errors.password = "La password è obbligatoria";
      isValid = false;
    }

    setFormState((prev) => ({ ...prev, errors }));
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
      errors: {
        ...prev.errors,
        [name]: undefined, // Rimuovi l'errore quando l'utente inizia a digitare
        general: undefined,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await login(formState.email, formState.password);
      // Il reindirizzamento avviene tramite l'effetto collaterale
    } catch (error) {
      setFormState((prev) => ({
        ...prev,
        errors: {
          ...prev.errors,
          general: 'Credenziali non valide. Riprova.',
        },
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <AnimatedPage transitionType="fade">
      <Grid container component="main" sx={{ height: '100vh' }}>
        <Grid
          item
          xs={false}
          sm={4}
          md={7}
          sx={{
            backgroundImage: 'url(https://source.unsplash.com/random?education)',
            backgroundRepeat: 'no-repeat',
            backgroundColor: (t) =>
              t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
          <Box
            sx={{
              my: 8,
              mx: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <FadeIn>
              <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
                Accedi alla piattaforma
              </Typography>
            </FadeIn>

            {formState.errors.general && (
              <SlideInUp>
                <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                  {formState.errors.general}
                </Alert>
              </SlideInUp>
            )}

            <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
              <SlideInUp delay={0.1}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={formState.email}
                  onChange={handleChange}
                  error={!!formState.errors.email}
                  helperText={formState.errors.email}
                  disabled={loading}
                />
              </SlideInUp>
              
              <SlideInUp delay={0.2}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  value={formState.password}
                  onChange={handleChange}
                  error={!!formState.errors.password}
                  helperText={formState.errors.password}
                  disabled={loading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleToggleShowPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </SlideInUp>
              
              <SlideInUp delay={0.3}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={loading}
                >
                  {loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                      Accesso in corso...
                    </Box>
                  ) : (
                    'Accedi'
                  )}
                </Button>
              </SlideInUp>
              
              <SlideInRight delay={0.4}>
                <Grid container>
                  <Grid item xs>
                    <Link component={RouterLink} to="#" variant="body2">
                      Password dimenticata?
                    </Link>
                  </Grid>
                  <Grid item>
                    <Link component={RouterLink} to="/register" variant="body2">
                      {"Non hai un account? Registrati"}
                    </Link>
                  </Grid>
                </Grid>
              </SlideInRight>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </AnimatedPage>
  );
};

export default LoginForm;
