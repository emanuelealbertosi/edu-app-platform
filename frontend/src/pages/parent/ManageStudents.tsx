import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { Typography, Box, Paper, Alert } from '@mui/material';

const ManageStudents: React.FC = () => {
  return (
    <MainLayout title="Gestione Studenti">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Gestione Studenti
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Crea e gestisci gli account degli studenti associati al tuo profilo
        </Typography>
      </Box>
      
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Questa funzionalità è in fase di sviluppo.
        </Alert>
        <Typography>
          Questa sezione permetterà ai genitori di creare e gestire gli account per i propri figli,
          visualizzare il loro progresso educativo e monitorare le attività completate.
        </Typography>
      </Paper>
    </MainLayout>
  );
};

export default ManageStudents;
