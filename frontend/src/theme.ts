import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// Crea un tema personalizzato per l'applicazione educativa
let theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5', // Blu indaco - colore principale
      light: '#757de8',
      dark: '#002984',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f50057', // Rosa - colore secondario, adatto per highlight
      light: '#ff5983',
      dark: '#bb002f',
      contrastText: '#ffffff',
    },
    success: {
      main: '#4caf50', // Verde - per conferma e successo
      light: '#80e27e',
      dark: '#087f23',
    },
    info: {
      main: '#2196f3', // Blu chiaro - per informazioni
      light: '#6ec6ff',
      dark: '#0069c0',
    },
    warning: {
      main: '#ff9800', // Arancione - per avvisi
      light: '#ffc947',
      dark: '#c66900',
    },
    error: {
      main: '#f44336', // Rosso - per errori
      light: '#ff7961',
      dark: '#ba000d',
    },
    background: {
      default: '#f5f5f5', // Sfondo chiaro per l'applicazione
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 500,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
        containedPrimary: {
          boxShadow: '0 4px 6px rgba(63, 81, 181, 0.2)',
        },
        containedSecondary: {
          boxShadow: '0 4px 6px rgba(245, 0, 87, 0.2)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 6px 12px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        },
      },
    },
  },
});

// Applica il responsive font size per adattare il testo alle dimensioni dello schermo
theme = responsiveFontSizes(theme);

export default theme;
