import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { Typography, Box, Paper, Alert } from '@mui/material';

const AssignedPaths: React.FC = () => {
  return (
    <MainLayout title="I Miei Percorsi">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          I Miei Percorsi
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Visualizza e completa i percorsi educativi assegnati
        </Typography>
      </Box>
      
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Questa funzionalità è in fase di sviluppo.
        </Alert>
        <Typography paragraph>
          Questa sezione mostrerà tutti i percorsi educativi assegnati a te,
          il tuo progresso attuale e i quiz che devi ancora completare.
        </Typography>
        <Typography>
          Potrai selezionare un percorso per visualizzare maggiori dettagli,
          iniziare un nuovo quiz o riprendere un quiz parzialmente completato.
        </Typography>
      </Paper>
    </MainLayout>
  );
};

export default AssignedPaths;
