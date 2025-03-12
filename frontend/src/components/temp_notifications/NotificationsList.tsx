import React from 'react';
import { motion } from 'framer-motion';
import { Box } from '@mui/material';
import { useNotifications } from '../../contexts/NotificationsContext';
import AnimatedNotification from './AnimatedNotification';

/**
 * Componente che visualizza una lista di notifiche utilizzando animazioni
 * Si integra con il contesto NotificationsContext
 */
const NotificationsList: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  // Varianti di animazione per il container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        width: { xs: '90%', sm: 350 },
        maxWidth: '100%'
      }}
    >
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {notifications.map((notification, index) => (
          <AnimatedNotification
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
            index={index}
          />
        ))}
      </motion.div>
    </Box>
  );
};

export default NotificationsList;
