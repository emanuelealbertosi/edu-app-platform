import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline, CircularProgress, Container, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';

// Contesti e Provider
import { AuthProvider } from './contexts/AuthContext';
import { NotificationsProvider } from './contexts/NotificationsContext';

// Temi
import theme from './theme';

// Componenti di animazione
import FadeInLoader from './components/animations/FadeInLoader';
import NotificationsList from './components/notifications/NotificationsList';

// Pagine principali
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import LandingPage from './pages/public/LandingPage';

// Layout protetti
import ProtectedRoute from './components/common/ProtectedRoute';

// Pagine admin con caricamento lazy
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = React.lazy(() => import('./pages/admin/AdminUsers'));
const AdminPaths = React.lazy(() => import('./pages/admin/AdminPaths'));
const AdminQuizzes = React.lazy(() => import('./pages/admin/AdminQuizzes'));

// Pagine genitore con caricamento lazy
const ParentDashboard = React.lazy(() => import('./pages/parent/ParentDashboard'));
const ManageStudents = React.lazy(() => import('./pages/parent/ManageStudents'));
const AssignQuizzes = React.lazy(() => import('./pages/parent/AssignQuizzes'));
const ManageRewards = React.lazy(() => import('./pages/parent/ManageRewards'));

// Pagine studente con caricamento lazy
const StudentDashboard = React.lazy(() => import('./pages/student/StudentDashboard'));
const AssignedPaths = React.lazy(() => import('./pages/student/AssignedPaths'));
const TakeQuiz = React.lazy(() => import('./pages/student/TakeQuiz'));
const RewardsStore = React.lazy(() => import('./pages/student/RewardsStore'));



// Componente di caricamento migliorato
const LoadingComponent = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <FadeInLoader message="Caricamento in corso..." size={50} />
  </Box>
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <NotificationsProvider>
          <NotificationsList />
          <BrowserRouter>
            <Suspense fallback={<LoadingComponent />}>
              <Routes>
                {/* Rotte pubbliche */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Rotte Admin */}
                <Route path="/admin" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/users" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminUsers />
                  </ProtectedRoute>
                } />
                <Route path="/admin/paths" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminPaths />
                  </ProtectedRoute>
                } />
                <Route path="/admin/quizzes" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminQuizzes />
                  </ProtectedRoute>
                } />

                {/* Rotte Genitore */}
                <Route path="/parent" element={
                  <ProtectedRoute requiredRole="parent">
                    <ParentDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/parent/students" element={
                  <ProtectedRoute requiredRole="parent">
                    <ManageStudents />
                  </ProtectedRoute>
                } />
                <Route path="/parent/quizzes" element={
                  <ProtectedRoute requiredRole="parent">
                    <AssignQuizzes />
                  </ProtectedRoute>
                } />
                <Route path="/parent/rewards" element={
                  <ProtectedRoute requiredRole="parent">
                    <ManageRewards />
                  </ProtectedRoute>
                } />

                {/* Rotte Studente */}
                <Route path="/student" element={
                  <ProtectedRoute requiredRole="student">
                    <StudentDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/student/paths" element={
                  <ProtectedRoute requiredRole="student">
                    <AssignedPaths />
                  </ProtectedRoute>
                } />
                <Route path="/student/quiz/:quizId" element={
                  <ProtectedRoute requiredRole="student">
                    <TakeQuiz />
                  </ProtectedRoute>
                } />
                <Route path="/student/rewards" element={
                  <ProtectedRoute requiredRole="student">
                    <RewardsStore />
                  </ProtectedRoute>
                } />

                {/* Rotta di fallback - Rimuoviamo il redirect automatico a /login */}
                
                {/* Fallback per rotte non trovate */}
                <Route path="*" element={
                  <Container>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 10 }}>
                      <Typography variant="h4" gutterBottom>
                        Pagina non trovata
                      </Typography>
                      <Typography variant="body1">
                        La pagina che stai cercando non esiste o è stata spostata.
                      </Typography>
                    </Box>
                  </Container>
                } />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </NotificationsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
