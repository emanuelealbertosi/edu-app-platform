import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { Typography, Box, Paper, Alert } from '@mui/material';

const ManageUsers: React.FC = () => {
  return (
    <MainLayout title="Gestione Utenti">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Gestione Utenti
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Amministra gli account utente della piattaforma
        </Typography>
      </Box>
      
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Questa funzionalità è in fase di sviluppo.
        </Alert>
        <Typography>
          Questa sezione permetterà all'amministratore di gestire tutti gli utenti della piattaforma,
          inclusa la creazione di nuovi account, la modifica dei ruoli e la disattivazione degli account esistenti.
        </Typography>
      </Paper>
    </MainLayout>
  );
};

export default ManageUsers;
