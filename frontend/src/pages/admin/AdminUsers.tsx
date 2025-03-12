import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Chip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon } from '@mui/icons-material';
import MainLayout from '../../components/layouts/MainLayout';
import HoverAnimation from '../../components/animations/HoverAnimation';
import { ApiErrorHandler } from '../../services/ApiErrorHandler';
import { NotificationsService } from '../../services/NotificationsService';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'parent' | 'student';
  lastLogin?: string;
  status: 'active' | 'inactive' | 'pending';
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Simulazione chiamata API
      // const response = await UserService.getAllUsers();
      // setUsers(response.data);
      
      // Dati di esempio
      setTimeout(() => {
        const mockUsers: User[] = [
          { 
            id: '1', 
            email: 'admin@example.com', 
            firstName: 'Admin', 
            lastName: 'User', 
            role: 'admin',
            lastLogin: '2023-05-15T10:30:00',
            status: 'active'
          },
          { 
            id: '2', 
            email: 'parent1@example.com', 
            firstName: 'Marco', 
            lastName: 'Rossi', 
            role: 'parent',
            lastLogin: '2023-05-14T14:22:00',
            status: 'active'
          },
          { 
            id: '3', 
            email: 'parent2@example.com', 
            firstName: 'Laura', 
            lastName: 'Bianchi', 
            role: 'parent',
            lastLogin: '2023-05-13T09:15:00',
            status: 'active'
          },
          { 
            id: '4', 
            email: 'student1@example.com', 
            firstName: 'Luca', 
            lastName: 'Verdi', 
            role: 'student',
            lastLogin: '2023-05-12T16:40:00',
            status: 'active'
          },
          { 
            id: '5', 
            email: 'student2@example.com', 
            firstName: 'Sara', 
            lastName: 'Neri', 
            role: 'student',
            lastLogin: '2023-05-10T11:05:00',
            status: 'inactive'
          }
        ];
        setUsers(mockUsers);
        setLoading(false);
      }, 1000);
    } catch (error) {
      ApiErrorHandler.handleApiError(error);
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    try {
      // Simulazione chiamata API
      // await UserService.deleteUser(userToDelete.id);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Aggiorna la lista degli utenti rimuovendo quello cancellato
      setUsers(users.filter(user => user.id !== userToDelete.id));
      NotificationsService.success(`Utente ${userToDelete.firstName} ${userToDelete.lastName} eliminato con successo`);
    } catch (error) {
      ApiErrorHandler.handleApiError(error);
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower)
    );
  });

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return <Chip label="Amministratore" color="primary" size="small" />;
      case 'parent':
        return <Chip label="Genitore" color="secondary" size="small" />;
      case 'student':
        return <Chip label="Studente" color="info" size="small" />;
      default:
        return <Chip label={role} size="small" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return <Chip label="Attivo" color="success" size="small" />;
      case 'inactive':
        return <Chip label="Inattivo" color="default" size="small" />;
      case 'pending':
        return <Chip label="In attesa" color="warning" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Gestione Utenti
          </Typography>
          <HoverAnimation>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              color="primary"
            >
              Nuovo Utente
            </Button>
          </HoverAnimation>
        </Box>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
            <TextField
              label="Cerca utenti"
              variant="outlined"
              size="small"
              fullWidth
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Cerca per nome, email o ruolo..."
            />
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table size="medium">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nome</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Ruolo</TableCell>
                      <TableCell>Stato</TableCell>
                      <TableCell>Ultimo accesso</TableCell>
                      <TableCell align="right">Azioni</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{getRoleLabel(user.role)}</TableCell>
                          <TableCell>{getStatusLabel(user.status)}</TableCell>
                          <TableCell>
                            {user.lastLogin 
                              ? new Date(user.lastLogin).toLocaleString('it-IT', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : 'Mai'}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton 
                              aria-label="modifica"
                              color="primary"
                              size="small"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              aria-label="elimina" 
                              color="error"
                              size="small"
                              onClick={() => handleDeleteClick(user)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    {filteredUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          Nessun utente trovato
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredUsers.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Righe per pagina:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} di ${count}`}
              />
            </>
          )}
        </Paper>

        {/* Dialog di conferma eliminazione */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
        >
          <DialogTitle>Conferma eliminazione</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Sei sicuro di voler eliminare l'utente{' '}
              {userToDelete && `${userToDelete.firstName} ${userToDelete.lastName} (${userToDelete.email})`}?
              Questa azione non può essere annullata.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel} color="primary">
              Annulla
            </Button>
            <Button onClick={handleDeleteConfirm} color="error" autoFocus>
              Elimina
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </MainLayout>
  );
};

export default AdminUsers;
