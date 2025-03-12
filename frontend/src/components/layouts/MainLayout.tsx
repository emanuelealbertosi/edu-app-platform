import React, { ReactNode } from 'react';
import { Box, Container, CssBaseline } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Header from '../header/Header';
import SideNav from '../navigation/SideNav';
import { useAuth } from '../../contexts/AuthContext';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const { user } = useAuth();
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Header */}
      <Header />
      
      {/* Side Navigation */}
      <SideNav />
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: 8, // Padding top to account for the fixed header
          pb: 4,
          px: 2,
          width: '100%',
          backgroundColor: theme.palette.background.default,
          overflowX: 'hidden',
          marginLeft: { xs: 0, md: '240px' }, // Account for sidenav width
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;
