import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../../src/contexts/AuthContext';
import { NotificationsProvider } from '../../../src/contexts/NotificationsContext';
import ParentDashboard from '../../../src/pages/parent/ParentDashboard';
import AssignPathPage from '../../../src/pages/parent/AssignPathPage';
import PathTemplateService from '../../../src/services/PathTemplateService';
import StudentService from '../../../src/services/StudentService';
import PathService from '../../../src/services/PathService';

// Mocks
jest.mock('../../../src/contexts/AuthContext', () => {
  const originalModule = jest.requireActual('../../../src/contexts/AuthContext');
  return {
    ...originalModule,
    useAuth: jest.fn()
  };
});

jest.mock('../../../src/services/PathTemplateService', () => ({
  getPathTemplates: jest.fn(),
  default: {
    getPathTemplates: jest.fn()
  }
}));

jest.mock('../../../src/services/StudentService', () => ({
  getStudentsByParent: jest.fn(),
  default: {
    getStudentsByParent: jest.fn()
  }
}));

jest.mock('../../../src/services/PathService', () => ({
  assignPathToStudent: jest.fn(),
  default: {
    assignPathToStudent: jest.fn()
  }
}));

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Parent Assign Path Flow', () => {
  const mockParentUser = {
    id: 'parent-1',
    email: 'parent@example.com',
    firstName: 'Parent',
    lastName: 'User',
    role: 'parent'
  };

  const mockStudents = [
    {
      id: 'student-1',
      userId: 'user-student-1',
      firstName: 'Student',
      lastName: 'One',
      age: 10,
      points: 100,
      parentId: 'parent-1'
    },
    {
      id: 'student-2',
      userId: 'user-student-2',
      firstName: 'Student',
      lastName: 'Two',
      age: 8,
      points: 50,
      parentId: 'parent-1'
    }
  ];

  const mockPathTemplates = [
    {
      id: 'path-1',
      title: 'Matematica Base',
      description: 'Percorso base di matematica',
      difficulty: 'easy',
      subject: 'math',
      targetAgeMin: 6,
      targetAgeMax: 10,
      estimatedDays: 14,
      quizzes: [
        { id: 'quiz-1', title: 'Addizioni' },
        { id: 'quiz-2', title: 'Sottrazioni' }
      ],
      createdAt: '2023-01-01T00:00:00.000Z'
    },
    {
      id: 'path-2',
      title: 'Scienze Avanzate',
      description: 'Percorso avanzato di scienze',
      difficulty: 'hard',
      subject: 'science',
      targetAgeMin: 8,
      targetAgeMax: 12,
      estimatedDays: 21,
      quizzes: [
        { id: 'quiz-3', title: 'Ecosistemi' },
        { id: 'quiz-4', title: 'Corpo Umano' }
      ],
      createdAt: '2023-01-01T00:00:00.000Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Auth
    const useAuthMock = jest.requireMock('../../../src/contexts/AuthContext').useAuth;
    useAuthMock.mockReturnValue({
      user: mockParentUser,
      isAuthenticated: true,
    });

    // Mock API calls
    PathTemplateService.default.getPathTemplates.mockResolvedValue(mockPathTemplates);
    StudentService.default.getStudentsByParent.mockResolvedValue(mockStudents);
    PathService.default.assignPathToStudent.mockResolvedValue({
      id: 'assigned-path-1',
      pathTemplateId: 'path-1',
      studentId: 'student-1',
      assignedAt: new Date().toISOString(),
      status: 'assigned',
      progress: 0
    });
  });

  test('complete flow: parent assigns a path to a student', async () => {
    // Render parent dashboard
    render(
      <MemoryRouter initialEntries={['/parent']}>
        <NotificationsProvider>
          <AuthProvider>
            <Routes>
              <Route path="/parent" element={<ParentDashboard />} />
              <Route path="/parent/assign-paths" element={<AssignPathPage />} />
            </Routes>
          </AuthProvider>
        </NotificationsProvider>
      </MemoryRouter>
    );

    // Verify dashboard loads
    await waitFor(() => {
      expect(StudentService.default.getStudentsByParent).toHaveBeenCalled();
    });

    // Verify students are displayed
    await waitFor(() => {
      expect(screen.getByText(/Student One/i)).toBeInTheDocument();
      expect(screen.getByText(/Student Two/i)).toBeInTheDocument();
    });

    // Click on Assign Paths in menu
    const assignPathsButton = await screen.findByText('Assegna Percorsi');
    fireEvent.click(assignPathsButton);

    // Verify navigation
    expect(mockNavigate).toHaveBeenCalledWith('/parent/assign-paths');

    // Render assign paths page
    render(
      <MemoryRouter initialEntries={['/parent/assign-paths']}>
        <NotificationsProvider>
          <AuthProvider>
            <AssignPathPage />
          </AuthProvider>
        </NotificationsProvider>
      </MemoryRouter>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(PathTemplateService.default.getPathTemplates).toHaveBeenCalled();
      expect(StudentService.default.getStudentsByParent).toHaveBeenCalled();
    });

    // Verify path templates are displayed
    await waitFor(() => {
      expect(screen.getByText(/Matematica Base/i)).toBeInTheDocument();
      expect(screen.getByText(/Scienze Avanzate/i)).toBeInTheDocument();
    });

    // Verify students are displayed in dropdown
    const studentSelect = screen.getByLabelText(/Seleziona Studente/i);
    expect(studentSelect).toBeInTheDocument();
    
    // Select a student
    fireEvent.change(studentSelect, { target: { value: 'student-1' } });
    
    // Select a path
    const pathTemplate = screen.getByText(/Matematica Base/i).closest('.path-template-card');
    const selectPathButton = within(pathTemplate).getByText(/Seleziona/i);
    fireEvent.click(selectPathButton);
    
    // Confirm assignment
    const confirmButton = screen.getByText(/Conferma Assegnazione/i);
    fireEvent.click(confirmButton);
    
    // Verify assignment API is called
    await waitFor(() => {
      expect(PathService.default.assignPathToStudent).toHaveBeenCalledWith(
        'path-1',
        'student-1'
      );
    });
    
    // Verify success notification is shown
    await waitFor(() => {
      expect(screen.getByText(/Percorso assegnato con successo/i)).toBeInTheDocument();
    });
  });
  
  test('shows error notification if path assignment fails', async () => {
    // Mock API failure
    PathService.default.assignPathToStudent.mockRejectedValue(new Error('Failed to assign path'));
    
    // Render assign paths page
    render(
      <MemoryRouter initialEntries={['/parent/assign-paths']}>
        <NotificationsProvider>
          <AuthProvider>
            <AssignPathPage />
          </AuthProvider>
        </NotificationsProvider>
      </MemoryRouter>
    );
    
    // Wait for data to load
    await waitFor(() => {
      expect(PathTemplateService.default.getPathTemplates).toHaveBeenCalled();
      expect(StudentService.default.getStudentsByParent).toHaveBeenCalled();
    });
    
    // Select a student
    const studentSelect = screen.getByLabelText(/Seleziona Studente/i);
    fireEvent.change(studentSelect, { target: { value: 'student-1' } });
    
    // Select a path
    const pathTemplate = screen.getByText(/Matematica Base/i).closest('.path-template-card');
    const selectPathButton = within(pathTemplate).getByText(/Seleziona/i);
    fireEvent.click(selectPathButton);
    
    // Confirm assignment
    const confirmButton = screen.getByText(/Conferma Assegnazione/i);
    fireEvent.click(confirmButton);
    
    // Verify assignment API is called
    await waitFor(() => {
      expect(PathService.default.assignPathToStudent).toHaveBeenCalledWith(
        'path-1',
        'student-1'
      );
    });
    
    // Verify error notification is shown
    await waitFor(() => {
      expect(screen.getByText(/Impossibile assegnare il percorso/i)).toBeInTheDocument();
    });
  });
  
  test('validates student selection before allowing path assignment', async () => {
    // Render assign paths page
    render(
      <MemoryRouter initialEntries={['/parent/assign-paths']}>
        <NotificationsProvider>
          <AuthProvider>
            <AssignPathPage />
          </AuthProvider>
        </NotificationsProvider>
      </MemoryRouter>
    );
    
    // Wait for data to load
    await waitFor(() => {
      expect(PathTemplateService.default.getPathTemplates).toHaveBeenCalled();
      expect(StudentService.default.getStudentsByParent).toHaveBeenCalled();
    });
    
    // Try to select a path without selecting a student
    const pathTemplate = screen.getByText(/Matematica Base/i).closest('.path-template-card');
    const selectPathButton = within(pathTemplate).getByText(/Seleziona/i);
    fireEvent.click(selectPathButton);
    
    // Verify error message is shown
    await waitFor(() => {
      expect(screen.getByText(/Seleziona uno studente prima di procedere/i)).toBeInTheDocument();
    });
    
    // Verify assignment API is not called
    expect(PathService.default.assignPathToStudent).not.toHaveBeenCalled();
  });
});
