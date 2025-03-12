import React from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, CircularProgress, SxProps, Theme } from '@mui/material';

interface FadeInLoaderProps {
  message?: string;
  color?: string;
  size?: number;
  sx?: SxProps<Theme>;
}

/**
 * Componente di caricamento animato che si dissolve elegantemente
 * Fornisce feedback visivo durante il caricamento dei dati
 */
const FadeInLoader: React.FC<FadeInLoaderProps> = ({
  message = 'Caricamento in corso...',
  color = 'primary',
  size = 40,
  sx = {}
}) => {
  // Varianti per l'animazione del container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  // Varianti per l'animazione dello spinner
  const spinnerVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  // Varianti per l'animazione del testo
  const textVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  // Animazione pulsante per lo spinner
  const pulseAnimation = {
    scale: [1, 1.05, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center',
          p: 3,
          ...sx
        }}
      >
        <motion.div
          variants={spinnerVariants}
          animate={pulseAnimation}
        >
          <CircularProgress 
            color={color as any} 
            size={size} 
          />
        </motion.div>
        
        {message && (
          <motion.div variants={textVariants}>
            <Typography 
              variant="body1" 
              color="textSecondary"
              sx={{ mt: 2 }}
            >
              {message}
            </Typography>
          </motion.div>
        )}
      </Box>
    </motion.div>
  );
};

export default FadeInLoader;
