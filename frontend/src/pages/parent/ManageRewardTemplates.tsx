import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { Typography, Box, Paper, Alert } from '@mui/material';

const ManageRewardTemplates: React.FC = () => {
  return (
    <MainLayout title="Gestione Template Ricompense">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Gestione Template Ricompense
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Crea e personalizza ricompense per motivare i tuoi studenti
        </Typography>
      </Box>
      
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Questa funzionalità è in fase di sviluppo.
        </Alert>
        <Typography paragraph>
          Questa sezione permetterà ai genitori di creare e gestire ricompense personalizzate
          che gli studenti potranno riscattare in cambio dei punti guadagnati completando quiz e percorsi.
        </Typography>
        <Typography>
          Le ricompense possono includere privilegi, attività speciali o oggetti reali,
          creando un sistema di incentivi motivante per il processo di apprendimento.
        </Typography>
      </Paper>
    </MainLayout>
  );
};

export default ManageRewardTemplates;
