import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { Typography, Box, Paper, Alert } from '@mui/material';

const AssignPaths: React.FC = () => {
  return (
    <MainLayout title="Assegna Percorsi">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Assegna Percorsi
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Assegna percorsi educativi ai tuoi studenti
        </Typography>
      </Box>
      
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Questa funzionalità è in fase di sviluppo.
        </Alert>
        <Typography paragraph>
          Questa sezione consentirà ai genitori di assegnare percorsi educativi 
          specifici ai propri studenti, impostando eventuali scadenze e monitorando 
          il loro progresso.
        </Typography>
        <Typography>
          Potrai scegliere tra i template di percorsi disponibili o quelli creati da te,
          personalizzare il percorso in base alle esigenze dello studente e stabilire 
          obiettivi di apprendimento specifici.
        </Typography>
      </Paper>
    </MainLayout>
  );
};

export default AssignPaths;
