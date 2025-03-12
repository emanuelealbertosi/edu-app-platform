import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Alert, 
  AlertTitle, 
  IconButton, 
  Box, 
  Typography,
  Collapse
} from '@mui/material';
import { 
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { Notification } from '../../types/notifications';

interface AnimatedNotificationProps {
  notification: Notification;
  onClose: () => void;
  index: number;
}

/**
 * Componente per la visualizzazione animata di una singola notifica
 * Utilizza Framer Motion per animazioni fluide di entrata e uscita
 */
const AnimatedNotification: React.FC<AnimatedNotificationProps> = ({ 
  notification, 
  onClose,
  index
}) => {
  // Ottiene l'icona appropriata per il tipo di notifica
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <SuccessIcon fontSize="inherit" />;
      case 'error':
        return <ErrorIcon fontSize="inherit" />;
      case 'warning':
        return <WarningIcon fontSize="inherit" />;
      case 'info':
      default:
        return <InfoIcon fontSize="inherit" />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={notification.id}
        layout
        initial={{ opacity: 0, y: -50, scale: 0.8 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          scale: 1,
          transition: { 
            type: "spring", 
            damping: 20, 
            stiffness: 300,
            delay: index * 0.1
          }
        }}
        exit={{ 
          opacity: 0, 
          scale: 0.8, 
          x: 100,
          transition: { duration: 0.3 }
        }}
        whileHover={{ 
          scale: 1.02,
          transition: { duration: 0.2 }
        }}
      >
        <Alert
          severity={notification.type}
          icon={getIcon()}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={onClose}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          sx={{ 
            mb: 1.5, 
            boxShadow: 2,
            borderRadius: 2,
            width: '100%'
          }}
        >
          {notification.title && (
            <AlertTitle sx={{ fontWeight: 'bold' }}>{notification.title}</AlertTitle>
          )}
          
          <Typography variant="body2">{notification.message}</Typography>
          
          {notification.details && (
            <Collapse in={true}>
              <Box sx={{ mt: 1, fontSize: '0.875rem', opacity: 0.8 }}>
                <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
                  {notification.details}
                </Typography>
              </Box>
            </Collapse>
          )}
        </Alert>
      </motion.div>
    </AnimatePresence>
  );
};

export default AnimatedNotification;
