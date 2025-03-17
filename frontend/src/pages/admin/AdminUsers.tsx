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
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Autocomplete
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon } from '@mui/icons-material';
import MainLayout from '../../components/layouts/MainLayout';
import HoverAnimation from '../../components/animations/HoverAnimation';
import { ApiErrorHandler } from '../../services/ApiErrorHandler';
import { NotificationsService } from '../../services/NotificationsService';
import UserService, { User } from '../../services/UserService';
import ParentService from '../../services/ParentService';

// Utilizzo l'interfaccia User dal UserService, con alcune personalizzazioni per la UI
interface UserDisplay extends Omit<User, 'lastLogin' | 'active' | 'createdAt' | 'role'> {
  lastLogin?: string;
  status: 'active' | 'inactive' | 'pending';
  role: string; // Permettiamo qualsiasi valore di ruolo che verrà poi convertito nella visualizzazione
}

interface ParentOption {
  id: number;
  label: string; // Nome completo del genitore
  value: number; // ID del genitore
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserDisplay | null>(null);
  // Stato per il dialog di modifica
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserDisplay | null>(null);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'student',
    status: 'active' as 'active' | 'inactive' | 'pending'
  });
  
  // Stato per il dialog di creazione nuovo utente
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' as 'admin' | 'parent' | 'student',
    parentId: null as number | null
  });
  const [formErrors, setFormErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [parents, setParents] = useState<ParentOption[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Utilizziamo il servizio API reale per ottenere tutti gli utenti
      const usersData = await UserService.getAllUsers();
      console.log('Utenti ricevuti dal backend:', usersData); // Debug per vedere i dati ricevuti
      
      // Convertiamo i dati degli utenti nel formato richiesto dalla UI
      const formattedUsers: UserDisplay[] = usersData.map(user => {
        console.log('Dati utente completi:', JSON.stringify(user, null, 2)); // Log dettagliato
        
        // Estrai il ruolo, gestendo sia array di ruoli che singoli ruoli
        let userRole = 'student'; // Valore predefinito
        
        // Log dettagliato per il campo ruolo
        console.log('Analisi ruolo per', user.email, ':', { 
          role: user.role, 
          rolesArray: Array.isArray(user.role) ? user.role : 'non è un array',
          roleType: typeof user.role,
          hasRolesProperty: !!(user as any).roles,
          rolesPropertyValue: (user as any).roles
        });
        
        // Gestione di tutte le possibili strutture di ruoli
        if (Array.isArray(user.role)) {
          // Se role è un array di stringhe
          if (user.role.includes('admin')) {
            userRole = 'admin';
          } else if (user.role.includes('parent')) {
            userRole = 'parent';
          } else if (user.role.includes('student')) {
            userRole = 'student';
          }
        } else if (Array.isArray((user as any).roles)) {
          // Se c'è una proprietà roles che è un array
          const rolesArray = (user as any).roles;
          if (rolesArray.some((r: any) => r === 'admin' || r.name === 'admin')) {
            userRole = 'admin';
          } else if (rolesArray.some((r: any) => r === 'parent' || r.name === 'parent')) {
            userRole = 'parent';
          } else if (rolesArray.some((r: any) => r === 'student' || r.name === 'student')) {
            userRole = 'student';
          }
        } else if (typeof user.role === 'string') {
          // Se role è una stringa semplice
          if (user.role === 'admin') {
            userRole = 'admin';
          } else if (user.role === 'parent') {
            userRole = 'parent';
          } else if (user.role === 'student') {
            userRole = 'student';
          }
        }
        
        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName || user.username || '', 
          lastName: user.lastName || '',
          role: userRole, // Usiamo il ruolo estratto
          // Gestiamo correttamente l'ultimo accesso, verificando vari formati possibili
          lastLogin: determineLastLogin(user),
          // Convertiamo correttamente lo stato attivo/inattivo
          status: (user.active === true || (user as any).is_active === true) ? 'active' : 'inactive'
        };
      });
      
      setUsers(formattedUsers);
    } catch (error) {
      ApiErrorHandler.handleApiError(error);
      NotificationsService.error('Impossibile caricare gli utenti', 'Errore');
    } finally {
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

  // Caricamento dei genitori per la selezione
  const fetchParents = async () => {
    setLoadingParents(true);
    try {
      const response = await UserService.getUsersByRole('parent');
      const parentOptions: ParentOption[] = response.map((parent: User) => ({
        id: Number(parent.id), // Converti in numero se necessario
        label: `${parent.firstName || ''} ${parent.lastName || ''} (${parent.email})`,
        value: Number(parent.id) // Converti in numero se necessario
      }));
      setParents(parentOptions);
    } catch (error) {
      ApiErrorHandler.handleApiError(error);
      NotificationsService.error('Impossibile caricare la lista dei genitori');
    } finally {
      setLoadingParents(false);
    }
  };

  // Apre il dialog per creare un nuovo utente
  const handleOpenCreateDialog = () => {
    setCreateFormData({
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'student',
      parentId: null
    });
    setFormErrors({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    // Carica la lista dei genitori per la selezione
    fetchParents();
    setCreateDialogOpen(true);
  };

  // Chiude il dialog di creazione
  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
  };

  // Validazione del form
  const validateForm = () => {
    let valid = true;
    const errors = {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    };

    if (!createFormData.username) {
      errors.username = 'Il nome utente è obbligatorio';
      valid = false;
    }

    if (!createFormData.email) {
      errors.email = "L'email è obbligatoria";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createFormData.email)) {
      errors.email = 'Inserisci un indirizzo email valido';
      valid = false;
    }

    if (!createFormData.password) {
      errors.password = 'La password è obbligatoria';
      valid = false;
    } else if (createFormData.password.length < 8) {
      errors.password = 'La password deve essere di almeno 8 caratteri';
      valid = false;
    }

    if (createFormData.password !== createFormData.confirmPassword) {
      errors.confirmPassword = 'Le password non corrispondono';
      valid = false;
    }

    setFormErrors(errors);
    return valid;
  };

  // Gestisce la creazione di un nuovo utente
  const handleCreateUser = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Dati base per la creazione dell'utente
      const userData = {
        firstName: createFormData.firstName,
        lastName: createFormData.lastName,
        username: createFormData.username,
        email: createFormData.email,
        password: createFormData.password,
        role: createFormData.role
      };

      // Se stiamo creando uno studente e un genitore è stato selezionato
      if (createFormData.role === 'student' && createFormData.parentId) {
        // Creiamo un oggetto specifico per la creazione di uno studente
        const studentData = {
          email: createFormData.email,
          password: createFormData.password,
          firstName: createFormData.firstName,
          lastName: createFormData.lastName,
          username: createFormData.username,
          role: 'student' as const,  // Specifichiamo esplicitamente il tipo
          parentId: createFormData.parentId
        };
        
        await UserService.createStudentWithParent(studentData);
        NotificationsService.success('Studente creato con successo');
      } else {
        // Creazione utente standard
        await UserService.createUser(userData);
        NotificationsService.success('Utente creato con successo');
      }

      // Aggiorna la lista utenti
      await fetchUsers();
      handleCloseCreateDialog();
    } catch (error) {
      ApiErrorHandler.handleApiError(error, 'Errore nella creazione dell\'utente');
    }
  };

  const handleDeleteClick = (user: UserDisplay) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  // Funzione per aprire il dialog di modifica
  const handleEditClick = (user: UserDisplay) => {
    setUserToEdit(user);
    setEditFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      role: user.role,
      status: user.status
    });
    setEditDialogOpen(true);
  };
  
  // Funzione per salvare le modifiche all'utente
  const handleEditConfirm = async () => {
    if (!userToEdit) return;
    
    try {
      // Log per debug
      console.log('Utente da aggiornare:', userToEdit);
      
      // Prepara i dati da inviare al backend
      const userData = {
        id: userToEdit.id,
        first_name: editFormData.firstName,  // Usiamo il formato snake_case per il backend
        last_name: editFormData.lastName,    // Usiamo il formato snake_case per il backend
        email: editFormData.email,
        role: editFormData.role as 'admin' | 'parent' | 'student',
        is_active: editFormData.status === 'active'  // Usiamo il formato snake_case per il backend
      };
      
      console.log('Dati da inviare al backend:', userData);
      
      // Chiamata all'API per aggiornare l'utente
      await UserService.updateUser(userData);
      
      // Chiudi il dialog e aggiorna la lista degli utenti
      setEditDialogOpen(false);
      NotificationsService.success('Utente aggiornato con successo');
      fetchUsers();
    } catch (error) {
      ApiErrorHandler.handleApiError(error);
      NotificationsService.error('Impossibile aggiornare l\'utente', 'Errore');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    try {
      // Utilizziamo la chiamata API reale per disattivare l'utente
      await UserService.deactivateUser(userToDelete.id);
      
      // Aggiorna la lista degli utenti dopo la disattivazione
      fetchUsers();
      NotificationsService.success(`Utente ${userToDelete.firstName} ${userToDelete.lastName} disattivato con successo`);
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

  // Funzione helper per determinare l'ultimo accesso
  const determineLastLogin = (user: any): string | undefined => {
    console.log('Verifica lastLogin per', user.email, ':', {
      lastLogin: user.lastLogin,
      lastLoginType: typeof user.lastLogin,
      last_login: (user as any).last_login,
      last_login_type: typeof (user as any).last_login,
      updated_at: (user as any).updated_at,
      updatedAt: (user as any).updatedAt,
      created_at: (user as any).created_at,
      createdAt: (user as any).createdAt
    });
    
    // Controlliamo vari formati possibili
    if (user.lastLogin) {
      if (typeof user.lastLogin === 'string') {
        return user.lastLogin; // Già stringa ISO
      } else if (user.lastLogin instanceof Date) {
        return user.lastLogin.toISOString();
      } else if (typeof user.lastLogin === 'object') {
        // Potrebbe essere in un formato non standard ma con proprietà date/time
        console.log('lastLogin è un oggetto:', user.lastLogin);
      }
    }
    
    // Controlliamo last_login in snake_case
    if ((user as any).last_login) {
      const lastLogin = (user as any).last_login;
      if (typeof lastLogin === 'string') {
        return lastLogin;
      } else if (lastLogin instanceof Date) {
        return lastLogin.toISOString();
      }
    }
    
    // Controlliamo updated_at/updatedAt come fallback
    if ((user as any).updated_at) {
      return typeof (user as any).updated_at === 'string' 
        ? (user as any).updated_at 
        : new Date((user as any).updated_at).toISOString();
    }
    
    if (user.updatedAt) {
      return typeof user.updatedAt === 'string' 
        ? user.updatedAt 
        : new Date(user.updatedAt).toISOString();
    }
    
    // Usiamo created_at/createdAt come ultimo fallback
    if ((user as any).created_at) {
      return typeof (user as any).created_at === 'string' 
        ? (user as any).created_at 
        : new Date((user as any).created_at).toISOString();
    }
    
    if (user.createdAt) {
      return typeof user.createdAt === 'string' 
        ? user.createdAt 
        : new Date(user.createdAt).toISOString();
    }
    
    // Prova a verificare se esiste una data di creazione nel formato UTC timestamp
    if ((user as any).created_at_utc) {
      return new Date((user as any).created_at_utc * 1000).toISOString();
    }
    
    return undefined; // Nessun accesso trovato
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
              onClick={handleOpenCreateDialog}
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
                          <TableCell>
                            {user.firstName || user.lastName
                              ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                              : user.username || user.email.split('@')[0] || 'Utente'}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{getRoleLabel(user.role)}</TableCell>
                          <TableCell>{getStatusLabel(user.status)}</TableCell>
                          <TableCell>
                            {user.lastLogin 
                              ? (() => {
                                  try {
                                    // Tenta di creare una data valida
                                    const date = new Date(user.lastLogin);
                                    // Verifica che la data sia valida
                                    if (isNaN(date.getTime())) {
                                      console.error('Data non valida:', user.lastLogin);
                                      return 'Data non valida';
                                    }
                                    return date.toLocaleString('it-IT', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    });
                                  } catch (error) {
                                    console.error('Errore nel parsing della data:', error);
                                    return 'Errore data';
                                  }
                                })()
                              : 'Mai'}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton 
                              aria-label="modifica"
                              color="primary"
                              size="small"
                              onClick={() => handleEditClick(user)}
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

        {/* Dialog per la modifica degli utenti */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
          <DialogTitle>Modifica Utente</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Modifica i dati dell'utente
            </DialogContentText>
            <Box sx={{ mt: 2 }}>
              <TextField
                label="Nome"
                fullWidth
                margin="normal"
                value={editFormData.firstName}
                onChange={(e) => setEditFormData({...editFormData, firstName: e.target.value})}
              />
              <TextField
                label="Cognome"
                fullWidth
                margin="normal"
                value={editFormData.lastName}
                onChange={(e) => setEditFormData({...editFormData, lastName: e.target.value})}
              />
              <TextField
                label="Email"
                fullWidth
                margin="normal"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
              />
              <TextField
                select
                label="Ruolo"
                fullWidth
                margin="normal"
                value={editFormData.role}
                onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="admin">Amministratore</option>
                <option value="parent">Genitore</option>
                <option value="student">Studente</option>
              </TextField>
              <TextField
                select
                label="Stato"
                fullWidth
                margin="normal"
                value={editFormData.status}
                onChange={(e) => setEditFormData({
                  ...editFormData, 
                  status: e.target.value as 'active' | 'inactive' | 'pending'
                })}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="active">Attivo</option>
                <option value="inactive">Inattivo</option>
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Annulla</Button>
            <Button 
              onClick={handleEditConfirm} 
              color="primary"
              variant="contained"
            >
              Salva
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
          {/* Dialogo per la creazione di un nuovo utente */}
      <Dialog open={createDialogOpen} onClose={handleCloseCreateDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Crea Nuovo Utente</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Nome"
              fullWidth
              margin="normal"
              value={createFormData.firstName}
              onChange={(e) => setCreateFormData({...createFormData, firstName: e.target.value})}
            />
            <TextField
              label="Cognome"
              fullWidth
              margin="normal"
              value={createFormData.lastName}
              onChange={(e) => setCreateFormData({...createFormData, lastName: e.target.value})}
            />
            <TextField
              label="Nome utente"
              fullWidth
              margin="normal"
              value={createFormData.username}
              onChange={(e) => setCreateFormData({...createFormData, username: e.target.value})}
              error={!!formErrors.username}
              helperText={formErrors.username}
              required
            />
            <TextField
              label="Email"
              fullWidth
              margin="normal"
              type="email"
              value={createFormData.email}
              onChange={(e) => setCreateFormData({...createFormData, email: e.target.value})}
              error={!!formErrors.email}
              helperText={formErrors.email}
              required
            />
            <TextField
              label="Password"
              fullWidth
              margin="normal"
              type="password"
              value={createFormData.password}
              onChange={(e) => setCreateFormData({...createFormData, password: e.target.value})}
              error={!!formErrors.password}
              helperText={formErrors.password}
              required
            />
            <TextField
              label="Conferma Password"
              fullWidth
              margin="normal"
              type="password"
              value={createFormData.confirmPassword}
              onChange={(e) => setCreateFormData({...createFormData, confirmPassword: e.target.value})}
              error={!!formErrors.confirmPassword}
              helperText={formErrors.confirmPassword}
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="role-select-label">Ruolo</InputLabel>
              <Select
                labelId="role-select-label"
                value={createFormData.role}
                label="Ruolo"
                onChange={(e) => setCreateFormData({...createFormData, role: e.target.value as 'admin' | 'parent' | 'student'})}
              >
                <MenuItem value="admin">Amministratore</MenuItem>
                <MenuItem value="parent">Genitore</MenuItem>
                <MenuItem value="student">Studente</MenuItem>
              </Select>
            </FormControl>

            {/* Campo per selezionare un genitore quando si crea uno studente */}
            {createFormData.role === 'student' && (
              <FormControl fullWidth margin="normal">
                <Autocomplete
                  id="parent-select"
                  options={parents}
                  loading={loadingParents}
                  getOptionLabel={(option) => option.label}
                  onChange={(_, newValue) => {
                    setCreateFormData({
                      ...createFormData,
                      parentId: newValue ? newValue.value : null
                    });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Genitore associato"
                      variant="outlined"
                      helperText="Seleziona il genitore a cui associare lo studente"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <React.Fragment>
                            {loadingParents ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </React.Fragment>
                        ),
                      }}
                    />
                  )}
                />
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>Annulla</Button>
          <Button onClick={handleCreateUser} color="primary" variant="contained">
            Crea Utente
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
};

export default AdminUsers;
