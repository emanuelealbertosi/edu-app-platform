import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { Typography, Box, Paper, Alert } from '@mui/material';

const ManagePathTemplates: React.FC = () => {
  return (
    <MainLayout title="Gestione Template Percorsi">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Gestione Template Percorsi
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Crea e personalizza percorsi educativi per i tuoi studenti
        </Typography>
      </Box>
      
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Questa funzionalità è in fase di sviluppo.
        </Alert>
        <Typography paragraph>
          Questa sezione permetterà ai genitori di creare percorsi educativi personalizzati,
          utilizzando i quiz disponibili nella piattaforma o creando nuovi quiz specifici.
        </Typography>
        <Typography>
          I percorsi potranno includere quiz di diverse materie e livelli di difficoltà,
          organizzati in sequenza logica per favorire l'apprendimento progressivo.
        </Typography>
      </Paper>
    </MainLayout>
  );
};

export default ManagePathTemplates;
