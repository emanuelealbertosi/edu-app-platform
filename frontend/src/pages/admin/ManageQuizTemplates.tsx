import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { Typography, Box, Paper, Alert } from '@mui/material';

const ManageQuizTemplates: React.FC = () => {
  return (
    <MainLayout title="Gestione Template Quiz">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Gestione Template Quiz
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Crea, modifica e gestisci i template dei quiz
        </Typography>
      </Box>
      
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Questa funzionalità è in fase di sviluppo.
        </Alert>
        <Typography>
          Questa sezione permetterà la creazione e gestione dei template dei quiz, 
          incluse domande a scelta multipla, risposte aperte e altri tipi di quesiti.
        </Typography>
      </Paper>
    </MainLayout>
  );
};

export default ManageQuizTemplates;
