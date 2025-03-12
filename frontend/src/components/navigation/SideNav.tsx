import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  useTheme
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  EmojiEvents as RewardsIcon,
  PlayCircle as QuizzesIcon,
  People as UsersIcon,
  Settings as SettingsIcon,
  Route as PathsIcon,
  BarChart as StatisticsIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

const SideNav: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Determina i menu da mostrare in base al ruolo dell'utente
  const getNavItems = () => {
    const baseItems = [
      {
        text: 'Dashboard',
        icon: <DashboardIcon />,
        path: '/',
        role: ['admin', 'parent', 'student']
      }
    ];

    const adminItems = [
      {
        text: 'Utenti',
        icon: <UsersIcon />,
        path: '/admin/users',
        role: ['admin']
      },
      {
        text: 'Quiz',
        icon: <QuizzesIcon />,
        path: '/admin/quizzes',
        role: ['admin']
      },
      {
        text: 'Percorsi',
        icon: <PathsIcon />,
        path: '/admin/paths',
        role: ['admin']
      },
      {
        text: 'Statistiche',
        icon: <StatisticsIcon />,
        path: '/admin/statistics',
        role: ['admin']
      }
    ];

    const parentItems = [
      {
        text: 'Assegna Quiz',
        icon: <SchoolIcon />,
        path: '/parent/assign-quizzes',
        role: ['parent']
      },
      {
        text: 'Gestisci Premi',
        icon: <RewardsIcon />,
        path: '/parent/manage-rewards',
        role: ['parent']
      },
      {
        text: 'Statistiche',
        icon: <StatisticsIcon />,
        path: '/parent/statistics',
        role: ['parent']
      }
    ];

    const studentItems = [
      {
        text: 'Quiz',
        icon: <QuizzesIcon />,
        path: '/student/quizzes',
        role: ['student']
      },
      {
        text: 'Negozio Premi',
        icon: <RewardsIcon />,
        path: '/student/rewards',
        role: ['student']
      }
    ];

    const settingsItem = [
      {
        text: 'Impostazioni',
        icon: <SettingsIcon />,
        path: '/settings',
        role: ['admin', 'parent', 'student']
      }
    ];

    // Filtra gli elementi in base al ruolo dell'utente
    const role = user?.role || 'student';
    const allItems = [...baseItems, ...adminItems, ...parentItems, ...studentItems, ...settingsItem];
    return allItems.filter(item => item.role.includes(role));
  };

  const navItems = getNavItems();

  const listItemVariants = {
    hover: {
      backgroundColor: theme.palette.action.hover,
      scale: 1.02,
      transition: { duration: 0.2 }
    }
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { 
          width: 240, 
          boxSizing: 'border-box', 
          background: theme.palette.background.paper,
          boxShadow: 1,
          display: { xs: 'none', md: 'block' }
        },
      }}
    >
      <Box sx={{ height: 64 }} /> {/* Spazio per la toolbar */}
      
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
          {user?.role === 'admin' ? 'Amministratore' : 
           user?.role === 'parent' ? 'Genitore' : 'Studente'}
        </Typography>
      </Box>
      
      <Divider />
      
      <Box sx={{ overflow: 'auto', height: '100%' }}>
        <List>
          {navItems.map((item) => (
            <motion.div
              key={item.text}
              variants={listItemVariants}
              whileHover="hover"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ListItem 
                button 
                onClick={() => navigate(item.path)}
                sx={{ 
                  py: 1.5,
                  backgroundColor: location.pathname === item.path ? 
                    theme.palette.action.selected : 'transparent',
                  borderRight: location.pathname === item.path ? 
                    `4px solid ${theme.palette.primary.main}` : 'none'
                }}
              >
                <ListItemIcon sx={{ 
                  color: location.pathname === item.path ? 
                    theme.palette.primary.main : 'inherit'
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    fontWeight: location.pathname === item.path ? 'bold' : 'normal' 
                  }}
                />
              </ListItem>
            </motion.div>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default SideNav;
