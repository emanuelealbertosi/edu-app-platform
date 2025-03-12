import React from 'react';
import { Button, Typography, Box, Grid, Paper } from '@mui/material';
import { NotificationType } from '../../types/notifications';
import { useNotifications } from '../../contexts/NotificationsContext';
import { NotificationsService } from '../../services/NotificationsService';

/**
 * Componente di test per il sistema di notifiche
 * Utilizzare questo componente per verificare il corretto funzionamento delle notifiche
 */
const NotificationTest: React.FC = () => {
  const { addNotification, notifications, removeNotification, clearAllNotifications } = useNotifications();

  // Inizializza il notification service (in un'app reale questo andrebbe fatto a livello più alto)
  React.useEffect(() => {
    NotificationsService.setNotificationHandler(addNotification);
  }, [addNotification]);

  // Funzioni per mostrare diversi tipi di notifiche
  const showSuccessNotification = () => {
    NotificationsService.success(
      'Operazione completata con successo!',
      'Successo',
      { autoClose: true, duration: 5000 }
    );
  };

  const showErrorNotification = () => {
    NotificationsService.error(
      'Si è verificato un errore durante l\'operazione.',
      'Errore',
      { 
        autoClose: false,
        details: {
          code: 'ERR_SERVER_500',
          timestamp: new Date().toISOString(),
          requestId: 'req_' + Math.random().toString(36).substring(2, 12)
        }
      }
    );
  };

  const showWarningNotification = () => {
    NotificationsService.warning(
      'Questa operazione potrebbe richiedere del tempo.',
      'Attenzione',
      { autoClose: true, duration: 7000 }
    );
  };

  const showInfoNotification = () => {
    NotificationsService.info(
      'Il sistema verrà aggiornato alle ore 22:00.',
      'Informazione',
      { autoClose: true, duration: 6000 }
    );
  };

  // Notifica personalizzata usando direttamente il context
  const showCustomNotification = () => {
    addNotification({
      type: NotificationType.INFO,
      title: 'Notifica personalizzata',
      message: 'Questa è una notifica creata direttamente senza usare il service',
      autoClose: true,
      duration: 4000,
      details: 'Puoi aggiungere qualsiasi dettaglio qui'
    });
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Test del Sistema di Notifiche
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Notifiche attive: {notifications.length}
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item>
            <Button variant="contained" color="success" onClick={showSuccessNotification}>
              Successo
            </Button>
          </Grid>
          <Grid item>
            <Button variant="contained" color="error" onClick={showErrorNotification}>
              Errore
            </Button>
          </Grid>
          <Grid item>
            <Button variant="contained" color="warning" onClick={showWarningNotification}>
              Avviso
            </Button>
          </Grid>
          <Grid item>
            <Button variant="contained" color="info" onClick={showInfoNotification}>
              Info
            </Button>
          </Grid>
          <Grid item>
            <Button variant="contained" onClick={showCustomNotification}>
              Personalizzata
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Gestione delle notifiche
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item>
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={clearAllNotifications}
              disabled={notifications.length === 0}
            >
              Rimuovi tutte le notifiche
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default NotificationTest;
