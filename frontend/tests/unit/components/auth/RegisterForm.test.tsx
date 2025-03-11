import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import RegisterForm from '../../../../src/components/auth/RegisterForm';

// Mock del contesto di autenticazione
jest.mock('../../../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    register: jest.fn().mockImplementation((userData) => {
      if (userData.email === 'existing@example.com') {
        return Promise.reject(new Error('Email already exists'));
      }
      return Promise.resolve();
    }),
    isAuthenticated: false,
    isLoading: false,
  }),
}));

describe('RegisterForm Component', () => {
  test('renders registration form with all fields and buttons', () => {
    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>
    );
    
    expect(screen.getByLabelText(/nome utente/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/conferma password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cognome/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /registrati/i })).toBeInTheDocument();
    expect(screen.getByText(/hai già un account/i)).toBeInTheDocument();
  });
  
  test('validates form inputs correctly', async () => {
    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>
    );
    
    // Clicca sul pulsante di registrazione senza compilare campi
    fireEvent.click(screen.getByRole('button', { name: /registrati/i }));
    
    // Verifica i messaggi di errore
    await waitFor(() => {
      expect(screen.getByText(/il nome utente è obbligatorio/i)).toBeInTheDocument();
      expect(screen.getByText(/l'email è obbligatoria/i)).toBeInTheDocument();
      expect(screen.getByText(/la password è obbligatoria/i)).toBeInTheDocument();
    });
    
    // Inserisci email non valida
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'invalid-email' },
    });
    
    // Password troppo corta
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'short' },
    });
    
    // Clicca di nuovo sul pulsante
    fireEvent.click(screen.getByRole('button', { name: /registrati/i }));
    
    // Verifica messaggi di errore specifici
    await waitFor(() => {
      expect(screen.getByText(/inserisci un'email valida/i)).toBeInTheDocument();
      expect(screen.getByText(/la password deve contenere almeno 8 caratteri/i)).toBeInTheDocument();
    });
  });
  
  test('validates password confirmation matches', async () => {
    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>
    );
    
    // Inserisci password diverse
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    fireEvent.change(screen.getByLabelText(/conferma password/i), {
      target: { value: 'different123' },
    });
    
    // Clicca sul pulsante di registrazione
    fireEvent.click(screen.getByRole('button', { name: /registrati/i }));
    
    // Verifica messaggio di errore per password non corrispondenti
    await waitFor(() => {
      expect(screen.getByText(/le password non corrispondono/i)).toBeInTheDocument();
    });
  });
  
  test('submits the form with valid data', async () => {
    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>
    );
    
    // Compila tutti i campi con dati validi
    fireEvent.change(screen.getByLabelText(/nome utente/i), {
      target: { value: 'testuser' },
    });
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    fireEvent.change(screen.getByLabelText(/conferma password/i), {
      target: { value: 'password123' },
    });
    
    fireEvent.change(screen.getByLabelText(/nome/i), {
      target: { value: 'Test' },
    });
    
    fireEvent.change(screen.getByLabelText(/cognome/i), {
      target: { value: 'User' },
    });
    
    // Seleziona il ruolo
    fireEvent.mouseDown(screen.getByRole('button', { name: /ruolo/i }));
    const listitem = await screen.findByText(/genitore/i);
    fireEvent.click(listitem);
    
    // Clicca sul pulsante di registrazione
    fireEvent.click(screen.getByRole('button', { name: /registrati/i }));
    
    // Verifica che non ci siano messaggi di errore
    await waitFor(() => {
      expect(screen.queryByText(/il nome utente è obbligatorio/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/l'email è obbligatoria/i)).not.toBeInTheDocument();
    });
  });
  
  test('shows error message when email already exists', async () => {
    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>
    );
    
    // Compila tutti i campi con email esistente
    fireEvent.change(screen.getByLabelText(/nome utente/i), {
      target: { value: 'existinguser' },
    });
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'existing@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    fireEvent.change(screen.getByLabelText(/conferma password/i), {
      target: { value: 'password123' },
    });
    
    // Seleziona il ruolo
    fireEvent.mouseDown(screen.getByRole('button', { name: /ruolo/i }));
    const listitem = await screen.findByText(/genitore/i);
    fireEvent.click(listitem);
    
    // Clicca sul pulsante di registrazione
    fireEvent.click(screen.getByRole('button', { name: /registrati/i }));
    
    // Verifica messaggio di errore
    await waitFor(() => {
      expect(screen.getByText(/questa email è già registrata/i)).toBeInTheDocument();
    });
  });
});
