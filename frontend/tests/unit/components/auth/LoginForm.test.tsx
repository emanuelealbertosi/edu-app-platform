import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import LoginForm from '../../../../src/components/auth/LoginForm';

// Mock del contesto di autenticazione
jest.mock('../../../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    login: jest.fn().mockImplementation((email, password) => {
      if (email === 'test@example.com' && password === 'password123') {
        return Promise.resolve();
      } else {
        return Promise.reject(new Error('Invalid credentials'));
      }
    }),
    isAuthenticated: false,
    isLoading: false,
  }),
}));

describe('LoginForm Component', () => {
  test('renders login form with all fields and buttons', () => {
    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    );
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /accedi/i })).toBeInTheDocument();
    expect(screen.getByText(/non hai un account/i)).toBeInTheDocument();
  });
  
  test('validates form inputs correctly', async () => {
    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    );
    
    // Clicca sul pulsante di accesso senza compilare campi
    fireEvent.click(screen.getByRole('button', { name: /accedi/i }));
    
    // Verifica i messaggi di errore
    await waitFor(() => {
      expect(screen.getByText(/l'email è obbligatoria/i)).toBeInTheDocument();
      expect(screen.getByText(/la password è obbligatoria/i)).toBeInTheDocument();
    });
    
    // Inserisci email non valida
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'invalid-email' },
    });
    
    // Clicca di nuovo sul pulsante
    fireEvent.click(screen.getByRole('button', { name: /accedi/i }));
    
    // Verifica messaggio di errore per email non valida
    await waitFor(() => {
      expect(screen.getByText(/inserisci un'email valida/i)).toBeInTheDocument();
    });
  });
  
  test('submits the form with valid credentials', async () => {
    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    );
    
    // Inserisci credenziali valide
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    // Clicca sul pulsante di accesso
    fireEvent.click(screen.getByRole('button', { name: /accedi/i }));
    
    // Verifica che non ci siano messaggi di errore
    await waitFor(() => {
      expect(screen.queryByText(/l'email è obbligatoria/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/la password è obbligatoria/i)).not.toBeInTheDocument();
    });
  });
  
  test('shows error message on login failure', async () => {
    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    );
    
    // Inserisci credenziali non valide
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'wrong@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' },
    });
    
    // Clicca sul pulsante di accesso
    fireEvent.click(screen.getByRole('button', { name: /accedi/i }));
    
    // Verifica messaggio di errore
    await waitFor(() => {
      expect(screen.getByText(/credenziali non valide/i)).toBeInTheDocument();
    });
  });
});
