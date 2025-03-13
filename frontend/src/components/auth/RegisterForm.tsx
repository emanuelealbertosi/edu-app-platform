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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

interface FormState {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'parent' | 'student' | '';
  errors: {
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    general?: string;
  };
}

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const [formState, setFormState] = useState<FormState>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: '',
    errors: {},
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Reindirizza se già autenticato
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const validateForm = (): boolean => {
    const errors: FormState['errors'] = {};
    let isValid = true;

    if (!formState.username) {
      errors.username = "Il nome utente è obbligatorio";
      isValid = false;
    } else if (formState.username.length < 3) {
      errors.username = "Il nome utente deve contenere almeno 3 caratteri";
      isValid = false;
    }

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
    } else if (formState.password.length < 8) {
      errors.password = "⚠️ La password deve contenere almeno 8 caratteri";
      isValid = false;
    }

    if (formState.password !== formState.confirmPassword) {
      errors.confirmPassword = "Le password non corrispondono";
      isValid = false;
    }

    if (!formState.firstName) {
      errors.firstName = "Il nome è obbligatorio";
      isValid = false;
    }

    if (!formState.lastName) {
      errors.lastName = "Il cognome è obbligatorio";
      isValid = false;
    }

    if (!formState.role) {
      errors.role = "Seleziona un ruolo";
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
        [name]: undefined,
        general: undefined,
      },
    }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
      errors: {
        ...prev.errors,
        [name]: undefined,
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
      await register({
        username: formState.username,
        email: formState.email,
        password: formState.password,
        role: formState.role as 'admin' | 'parent' | 'student', // Cast per garantire che non sia vuoto
        firstName: formState.firstName, // Utilizziamo camelCase come previsto dall'interfaccia
        lastName: formState.lastName, // Utilizziamo camelCase come previsto dall'interfaccia
      });
      
      setRegistrationSuccess(true);
      
      // Pulizia form dopo registrazione riuscita
      setFormState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        role: '',
        errors: {},
      });
      
      // Reindirizzamento dopo 2 secondi
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error: any) {
      if (error.response && error.response.status === 409) {
        setFormState((prev) => ({
          ...prev,
          errors: {
            ...prev.errors,
            email: "Questa email è già registrata",
          },
        }));
      } else {
        setFormState((prev) => ({
          ...prev,
          errors: {
            ...prev.errors,
            general: "Errore durante la registrazione. Riprova più tardi.",
          },
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  if (registrationSuccess) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          p: 4,
        }}
      >
        <Alert severity="success" sx={{ mb: 2 }}>
          Registrazione completata con successo! Sarai reindirizzato alla pagina di login.
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/login')}
        >
          Vai al login
        </Button>
      </Box>
    );
  }

  return (
    <Grid container component="main" sx={{ height: '100vh' }}>
      <Grid
        item
        xs={false}
        sm={4}
        md={7}
        sx={{
          backgroundImage: 'url(https://source.unsplash.com/random?education,learning)',
          backgroundRepeat: 'no-repeat',
          backgroundColor: (t) =>
            t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <Grid 
        item 
        xs={12} 
        sm={8} 
        md={5} 
        component={Paper} 
        elevation={6} 
        square
        sx={{
          overflow: 'auto',
          maxHeight: '100vh'
        }}
      >
        <Box
          sx={{
            my: 4,
            mx: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            Registrazione
          </Typography>

          {formState.errors.general && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {formState.errors.general}
            </Alert>
          )}

          <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Nome utente"
              name="username"
              autoComplete="username"
              autoFocus
              value={formState.username}
              onChange={handleChange}
              error={!!formState.errors.username}
              helperText={formState.errors.username}
              disabled={loading}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              value={formState.email}
              onChange={handleChange}
              error={!!formState.errors.email}
              helperText={formState.errors.email}
              disabled={loading}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              value={formState.password}
              onChange={handleChange}
              error={!!formState.errors.password}
              helperText={formState.errors.password || 'La password deve contenere almeno 8 caratteri'}
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
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Conferma Password"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              value={formState.confirmPassword}
              onChange={handleChange}
              error={!!formState.errors.confirmPassword}
              helperText={formState.errors.confirmPassword}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={handleToggleShowConfirmPassword}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <FormControl 
              fullWidth 
              margin="normal" 
              error={!!formState.errors.role}
              required
            >
              <InputLabel id="role-label">Ruolo</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                name="role"
                value={formState.role}
                label="Ruolo"
                onChange={handleSelectChange}
                disabled={loading}
              >
                <MenuItem value="admin">Amministratore</MenuItem>
                <MenuItem value="parent">Genitore</MenuItem>
                <MenuItem value="student">Studente</MenuItem>
              </Select>
              {formState.errors.role && (
                <FormHelperText>{formState.errors.role}</FormHelperText>
              )}
            </FormControl>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  id="firstName"
                  label="Nome"
                  name="firstName"
                  autoComplete="given-name"
                  value={formState.firstName}
                  onChange={handleChange}
                  error={!!formState.errors.firstName}
                  helperText={formState.errors.firstName}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  id="lastName"
                  label="Cognome"
                  name="lastName"
                  autoComplete="family-name"
                  value={formState.lastName}
                  onChange={handleChange}
                  error={!!formState.errors.lastName}
                  helperText={formState.errors.lastName}
                  disabled={loading}
                />
              </Grid>
            </Grid>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Registrazione in corso...' : 'Registrati'}
            </Button>
            
            <Grid container justifyContent="flex-end">
              <Grid item>
                <Link component={RouterLink} to="/login" variant="body2">
                  {"Hai già un account? Accedi"}
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
};

export default RegisterForm;
