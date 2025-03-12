import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import MainLayout from '../../../../src/components/layout/MainLayout';
import { AuthProvider } from '../../../../src/contexts/AuthContext';
import * as AuthContext from '../../../../src/contexts/AuthContext';

// Mock the useAuth hook
jest.mock('../../../../src/contexts/AuthContext', () => {
  const originalModule = jest.requireActual('../../../../src/contexts/AuthContext');
  return {
    ...originalModule,
    useAuth: jest.fn(),
  };
});

// Mock navigate function
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/' }),
}));

describe('MainLayout Component', () => {
  const mockLogout = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render correctly for admin user', () => {
    // Mock admin user
    AuthContext.useAuth.mockReturnValue({
      user: {
        id: '1',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        username: 'admin'
      },
      logout: mockLogout,
    });

    render(
      <MemoryRouter>
        <MainLayout title="Admin Dashboard">
          <div data-testid="child-content">Admin Content</div>
        </MainLayout>
      </MemoryRouter>
    );

    // Check title is rendered
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    
    // Check child content is rendered
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    
    // Check admin menu items are rendered
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Template Quiz')).toBeInTheDocument();
    expect(screen.getByText('Gestione Utenti')).toBeInTheDocument();
    expect(screen.getByText('Impostazioni')).toBeInTheDocument();
  });

  test('should render correctly for parent user', () => {
    // Mock parent user
    AuthContext.useAuth.mockReturnValue({
      user: {
        id: '2',
        firstName: 'Parent',
        lastName: 'User',
        role: 'parent',
        username: 'parent'
      },
      logout: mockLogout,
    });

    render(
      <MemoryRouter>
        <MainLayout title="Parent Dashboard">
          <div data-testid="child-content">Parent Content</div>
        </MainLayout>
      </MemoryRouter>
    );

    // Check title is rendered
    expect(screen.getByText('Parent Dashboard')).toBeInTheDocument();
    
    // Check parent menu items are rendered
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Studenti')).toBeInTheDocument();
    expect(screen.getByText('Template Percorsi')).toBeInTheDocument();
    expect(screen.getByText('Template Ricompense')).toBeInTheDocument();
    expect(screen.getByText('Assegna Percorsi')).toBeInTheDocument();
  });

  test('should render correctly for student user', () => {
    // Mock student user
    AuthContext.useAuth.mockReturnValue({
      user: {
        id: '3',
        firstName: 'Student',
        lastName: 'User',
        role: 'student',
        username: 'student'
      },
      logout: mockLogout,
    });

    render(
      <MemoryRouter>
        <MainLayout title="Student Dashboard">
          <div data-testid="child-content">Student Content</div>
        </MainLayout>
      </MemoryRouter>
    );

    // Check title is rendered
    expect(screen.getByText('Student Dashboard')).toBeInTheDocument();
    
    // Check student menu items are rendered
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Miei Percorsi')).toBeInTheDocument();
    expect(screen.getByText('Shop Ricompense')).toBeInTheDocument();
  });

  test('should navigate when menu item is clicked', async () => {
    // Mock admin user
    AuthContext.useAuth.mockReturnValue({
      user: {
        id: '1',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        username: 'admin'
      },
      logout: mockLogout,
    });

    render(
      <MemoryRouter>
        <MainLayout title="Admin Dashboard">
          <div>Content</div>
        </MainLayout>
      </MemoryRouter>
    );

    // Click on a menu item
    fireEvent.click(screen.getByText('Template Quiz'));
    
    // Check that navigate was called with the correct path
    expect(mockNavigate).toHaveBeenCalledWith('/admin/quiz-templates');
  });

  test('should handle logout when clicked', async () => {
    // Mock admin user
    AuthContext.useAuth.mockReturnValue({
      user: {
        id: '1',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        username: 'admin'
      },
      logout: mockLogout,
      isAuthenticated: true
    });

    render(
      <MemoryRouter>
        <MainLayout title="Admin Dashboard">
          <div>Content</div>
        </MainLayout>
      </MemoryRouter>
    );

    // Prima è necessario aprire il menu utente
    const avatarButton = screen.getByLabelText('account of current user');
    fireEvent.click(avatarButton);
    
    // Ora dovrebbe essere visibile il pulsante di logout
    const logoutButton = screen.getByText('Logout');
    expect(logoutButton).toBeInTheDocument();
    
    // Click logout button
    fireEvent.click(logoutButton);
    
    // Check that logout was called
    expect(mockLogout).toHaveBeenCalled();
    
    // Check that navigate was called with the login path
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('should open and close profile menu', () => {
    // Mock admin user
    AuthContext.useAuth.mockReturnValue({
      user: {
        id: '1',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        username: 'admin'
      },
      logout: mockLogout,
    });

    render(
      <MemoryRouter>
        <MainLayout title="Admin Dashboard">
          <div>Content</div>
        </MainLayout>
      </MemoryRouter>
    );

    // Check that profile menu is not visible
    expect(screen.queryByText('Profilo')).not.toBeInTheDocument();
    
    // Click on avatar to open profile menu
    const avatarButton = screen.getByLabelText('account of current user');
    fireEvent.click(avatarButton);
    
    // Check that profile menu is visible
    expect(screen.getByText('Profilo')).toBeInTheDocument();
    
    // Click on profile option
    fireEvent.click(screen.getByText('Profilo'));
    
    // Check that navigate was called with the profile path
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  test('should toggle mobile drawer', () => {
    // Mock student user
    AuthContext.useAuth.mockReturnValue({
      user: {
        id: '3',
        firstName: 'Student',
        lastName: 'User',
        role: 'student',
        username: 'student'
      },
      logout: mockLogout,
    });

    // Use a small viewport to test mobile view
    global.innerWidth = 500;
    global.dispatchEvent(new Event('resize'));

    render(
      <MemoryRouter>
        <MainLayout title="Student Dashboard">
          <div>Content</div>
        </MainLayout>
      </MemoryRouter>
    );

    // Click on menu icon to open mobile drawer
    const menuButton = screen.getByLabelText('open drawer');
    fireEvent.click(menuButton);
    
    // Check that drawer is visible and has correct menu items
    expect(screen.getAllByText('App Educativa')[0]).toBeInTheDocument();
    
    // Click again to close drawer
    fireEvent.click(menuButton);
  });
});
