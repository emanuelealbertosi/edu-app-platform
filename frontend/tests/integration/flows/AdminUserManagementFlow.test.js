import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../../src/contexts/AuthContext';
import { NotificationsProvider } from '../../../src/contexts/NotificationsContext';
import AdminDashboard from '../../../src/pages/admin/AdminDashboard';
import UserManagementPage from '../../../src/pages/admin/UserManagementPage';
import UserService from '../../../src/services/UserService';

// Mocks
jest.mock('../../../src/contexts/AuthContext', () => {
  const originalModule = jest.requireActual('../../../src/contexts/AuthContext');
  return {
    ...originalModule,
    useAuth: jest.fn()
  };
});

jest.mock('../../../src/services/UserService', () => ({
  getAllUsers: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  default: {
    getAllUsers: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn()
  }
}));

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Admin User Management Flow', () => {
  const mockAdminUser = {
    id: 'admin-1',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin'
  };

  const mockUsers = [
    {
      id: 'user-1',
      email: 'parent1@example.com',
      firstName: 'Parent',
      lastName: 'One',
      role: 'parent',
      createdAt: '2023-01-01T00:00:00.000Z'
    },
    {
      id: 'user-2',
      email: 'parent2@example.com',
      firstName: 'Parent',
      lastName: 'Two',
      role: 'parent',
      createdAt: '2023-01-02T00:00:00.000Z'
    },
    {
      id: 'user-3',
      email: 'student1@example.com',
      firstName: 'Student',
      lastName: 'One',
      role: 'student',
      createdAt: '2023-01-03T00:00:00.000Z'
    }
  ];

  const newUser = {
    email: 'newparent@example.com',
    firstName: 'New',
    lastName: 'Parent',
    password: 'securepassword',
    role: 'parent'
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Auth
    const useAuthMock = jest.requireMock('../../../src/contexts/AuthContext').useAuth;
    useAuthMock.mockReturnValue({
      user: mockAdminUser,
      isAuthenticated: true,
    });

    // Mock API calls
    UserService.default.getAllUsers.mockResolvedValue(mockUsers);
    UserService.default.createUser.mockResolvedValue({
      id: 'new-user-1',
      ...newUser,
      password: undefined,
      createdAt: new Date().toISOString()
    });
    UserService.default.updateUser.mockResolvedValue({
      id: 'user-1',
      email: 'updated@example.com',
      firstName: 'Updated',
      lastName: 'User',
      role: 'parent',
      createdAt: '2023-01-01T00:00:00.000Z'
    });
    UserService.default.deleteUser.mockResolvedValue({ success: true });
  });

  test('complete flow: admin views, creates, updates, and deletes a user', async () => {
    // Render admin dashboard
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <NotificationsProvider>
          <AuthProvider>
            <Routes>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagementPage />} />
            </Routes>
          </AuthProvider>
        </NotificationsProvider>
      </MemoryRouter>
    );

    // Verify dashboard loads
    await waitFor(() => {
      expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument();
    });

    // Click on User Management in menu
    const userManagementButton = await screen.findByText('Gestione Utenti');
    fireEvent.click(userManagementButton);

    // Verify navigation
    expect(mockNavigate).toHaveBeenCalledWith('/admin/users');

    // Render user management page
    render(
      <MemoryRouter initialEntries={['/admin/users']}>
        <NotificationsProvider>
          <AuthProvider>
            <UserManagementPage />
          </AuthProvider>
        </NotificationsProvider>
      </MemoryRouter>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(UserService.default.getAllUsers).toHaveBeenCalled();
    });

    // Verify users are displayed
    await waitFor(() => {
      expect(screen.getByText(/parent1@example.com/i)).toBeInTheDocument();
      expect(screen.getByText(/parent2@example.com/i)).toBeInTheDocument();
      expect(screen.getByText(/student1@example.com/i)).toBeInTheDocument();
    });

    // Test create user flow
    const addUserButton = screen.getByText(/Aggiungi Utente/i);
    fireEvent.click(addUserButton);

    // Fill in form fields
    const emailInput = screen.getByLabelText(/Email/i);
    const firstNameInput = screen.getByLabelText(/Nome/i);
    const lastNameInput = screen.getByLabelText(/Cognome/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const roleSelect = screen.getByLabelText(/Ruolo/i);

    fireEvent.change(emailInput, { target: { value: newUser.email } });
    fireEvent.change(firstNameInput, { target: { value: newUser.firstName } });
    fireEvent.change(lastNameInput, { target: { value: newUser.lastName } });
    fireEvent.change(passwordInput, { target: { value: newUser.password } });
    fireEvent.change(roleSelect, { target: { value: newUser.role } });

    // Submit form
    const submitButton = screen.getByText(/Salva/i);
    fireEvent.click(submitButton);

    // Verify API call
    await waitFor(() => {
      expect(UserService.default.createUser).toHaveBeenCalledWith(newUser);
    });

    // Verify success notification
    await waitFor(() => {
      expect(screen.getByText(/Utente creato con successo/i)).toBeInTheDocument();
    });

    // Test update user flow
    // Find edit button for the first user
    const editButtons = screen.getAllByText(/Modifica/i);
    fireEvent.click(editButtons[0]);

    // Update form fields
    fireEvent.change(emailInput, { target: { value: 'updated@example.com' } });
    fireEvent.change(firstNameInput, { target: { value: 'Updated' } });
    fireEvent.change(lastNameInput, { target: { value: 'User' } });

    // Submit form
    fireEvent.click(submitButton);

    // Verify API call
    await waitFor(() => {
      expect(UserService.default.updateUser).toHaveBeenCalledWith('user-1', {
        email: 'updated@example.com',
        firstName: 'Updated',
        lastName: 'User',
        role: 'parent',
      });
    });

    // Verify success notification
    await waitFor(() => {
      expect(screen.getByText(/Utente aggiornato con successo/i)).toBeInTheDocument();
    });

    // Test delete user flow
    // Find delete button for the first user
    const deleteButtons = screen.getAllByText(/Elimina/i);
    fireEvent.click(deleteButtons[0]);

    // Confirm deletion
    const confirmButton = screen.getByText(/Conferma/i);
    fireEvent.click(confirmButton);

    // Verify API call
    await waitFor(() => {
      expect(UserService.default.deleteUser).toHaveBeenCalledWith('user-1');
    });

    // Verify success notification
    await waitFor(() => {
      expect(screen.getByText(/Utente eliminato con successo/i)).toBeInTheDocument();
    });
  });

  test('shows error notification if user creation fails', async () => {
    // Mock API failure
    UserService.default.createUser.mockRejectedValue(new Error('Email already exists'));

    render(
      <MemoryRouter initialEntries={['/admin/users']}>
        <NotificationsProvider>
          <AuthProvider>
            <UserManagementPage />
          </AuthProvider>
        </NotificationsProvider>
      </MemoryRouter>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(UserService.default.getAllUsers).toHaveBeenCalled();
    });

    // Open create user form
    const addUserButton = screen.getByText(/Aggiungi Utente/i);
    fireEvent.click(addUserButton);

    // Fill in form fields
    const emailInput = screen.getByLabelText(/Email/i);
    const firstNameInput = screen.getByLabelText(/Nome/i);
    const lastNameInput = screen.getByLabelText(/Cognome/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const roleSelect = screen.getByLabelText(/Ruolo/i);

    fireEvent.change(emailInput, { target: { value: newUser.email } });
    fireEvent.change(firstNameInput, { target: { value: newUser.firstName } });
    fireEvent.change(lastNameInput, { target: { value: newUser.lastName } });
    fireEvent.change(passwordInput, { target: { value: newUser.password } });
    fireEvent.change(roleSelect, { target: { value: newUser.role } });

    // Submit form
    const submitButton = screen.getByText(/Salva/i);
    fireEvent.click(submitButton);

    // Verify API call
    await waitFor(() => {
      expect(UserService.default.createUser).toHaveBeenCalledWith(newUser);
    });

    // Verify error notification
    await waitFor(() => {
      expect(screen.getByText(/Impossibile creare l'utente/i)).toBeInTheDocument();
    });
  });

  test('shows error notification if user update fails', async () => {
    // Mock API failure
    UserService.default.updateUser.mockRejectedValue(new Error('Email already exists'));

    render(
      <MemoryRouter initialEntries={['/admin/users']}>
        <NotificationsProvider>
          <AuthProvider>
            <UserManagementPage />
          </AuthProvider>
        </NotificationsProvider>
      </MemoryRouter>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(UserService.default.getAllUsers).toHaveBeenCalled();
    });

    // Find edit button for the first user
    const editButtons = screen.getAllByText(/Modifica/i);
    fireEvent.click(editButtons[0]);

    // Update form fields
    const emailInput = screen.getByLabelText(/Email/i);
    const firstNameInput = screen.getByLabelText(/Nome/i);
    const lastNameInput = screen.getByLabelText(/Cognome/i);

    fireEvent.change(emailInput, { target: { value: 'updated@example.com' } });
    fireEvent.change(firstNameInput, { target: { value: 'Updated' } });
    fireEvent.change(lastNameInput, { target: { value: 'User' } });

    // Submit form
    const submitButton = screen.getByText(/Salva/i);
    fireEvent.click(submitButton);

    // Verify API call
    await waitFor(() => {
      expect(UserService.default.updateUser).toHaveBeenCalledWith('user-1', {
        email: 'updated@example.com',
        firstName: 'Updated',
        lastName: 'User',
        role: 'parent',
      });
    });

    // Verify error notification
    await waitFor(() => {
      expect(screen.getByText(/Impossibile aggiornare l'utente/i)).toBeInTheDocument();
    });
  });

  test('shows error notification if user deletion fails', async () => {
    // Mock API failure
    UserService.default.deleteUser.mockRejectedValue(new Error('Cannot delete admin user'));

    render(
      <MemoryRouter initialEntries={['/admin/users']}>
        <NotificationsProvider>
          <AuthProvider>
            <UserManagementPage />
          </AuthProvider>
        </NotificationsProvider>
      </MemoryRouter>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(UserService.default.getAllUsers).toHaveBeenCalled();
    });

    // Find delete button for the first user
    const deleteButtons = screen.getAllByText(/Elimina/i);
    fireEvent.click(deleteButtons[0]);

    // Confirm deletion
    const confirmButton = screen.getByText(/Conferma/i);
    fireEvent.click(confirmButton);

    // Verify API call
    await waitFor(() => {
      expect(UserService.default.deleteUser).toHaveBeenCalledWith('user-1');
    });

    // Verify error notification
    await waitFor(() => {
      expect(screen.getByText(/Impossibile eliminare l'utente/i)).toBeInTheDocument();
    });
  });
});
