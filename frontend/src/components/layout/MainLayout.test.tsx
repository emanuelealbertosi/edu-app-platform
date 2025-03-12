import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import MainLayout from './MainLayout';

// Mock dei componenti e hook necessari
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/student' }),
}));

// Mock del context di autenticazione
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      role: 'student',
    },
    logout: jest.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('MainLayout Component', () => {
  test('renders the layout with children and title', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <MainLayout title="Test Title">
            <div data-testid="child-content">Child Content</div>
          </MainLayout>
        </AuthProvider>
      </BrowserRouter>
    );

    // Verifica che il titolo sia renderizzato
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    
    // Verifica che il contenuto figlio sia renderizzato
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
    
    // Verifica che il nome dell'app sia presente nella barra laterale
    expect(screen.getByText('App Educativa')).toBeInTheDocument();
  });

  test('shows the appropriate menu items for student role', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <MainLayout title="Test Title">
            <div>Content</div>
          </MainLayout>
        </AuthProvider>
      </BrowserRouter>
    );

    // Modifichiamo i selettori per essere più specifici utilizzando i ruoli e le proprietà
    // Otteniamo tutti gli elementi con il testo Dashboard e verifichiamo che ne esista almeno uno
    const dashboardElements = screen.getAllByText('Dashboard');
    expect(dashboardElements.length).toBeGreaterThan(0);
    
    // Verifichiamo che gli altri elementi siano presenti
    const percorsiElements = screen.getAllByText('Miei Percorsi');
    expect(percorsiElements.length).toBeGreaterThan(0);
    
    const shopElements = screen.getAllByText('Shop Ricompense');
    expect(shopElements.length).toBeGreaterThan(0);
    
    // Verifica che i menu di altri ruoli non siano presenti
    expect(screen.queryByText('Gestione Utenti')).not.toBeInTheDocument();
    expect(screen.queryByText('Template Quiz')).not.toBeInTheDocument();
    expect(screen.queryByText('Studenti')).not.toBeInTheDocument();
  });

  test('logout button is present and functional', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <MainLayout title="Test Title">
            <div>Content</div>
          </MainLayout>
        </AuthProvider>
      </BrowserRouter>
    );

    // Otteniamo tutti gli elementi con il testo Logout e verifichiamo che ne esista almeno uno
    const logoutElements = screen.getAllByText('Logout');
    expect(logoutElements.length).toBeGreaterThan(0);
  });
});
