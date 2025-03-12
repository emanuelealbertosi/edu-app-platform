import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography, useTheme } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface SuccessAnimationProps {
  message?: string;
  duration?: number;
  onComplete?: () => void;
}

/**
 * Componente che mostra un'animazione di successo con particelle
 * Fornisce un feedback visivo gratificante quando un'azione viene completata con successo
 */
const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  message = 'Operazione completata con successo!',
  duration = 2000,
  onComplete
}) => {
  const [visible, setVisible] = useState(true);
  const theme = useTheme();
  
  // Genera particelle casuali per l'animazione
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 200 - 100,
    y: Math.random() * 200 - 100,
    size: Math.random() * 8 + 4,
    color: [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main
    ][Math.floor(Math.random() * 4)]
  }));
  
  useEffect(() => {
    // Nascondi automaticamente l'animazione dopo la durata specificata
    const timer = setTimeout(() => {
      setVisible(false);
      if (onComplete) {
        setTimeout(onComplete, 500); // Chiamare onComplete dopo che l'animazione di uscita è completata
      }
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onComplete]);
  
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(3px)',
            backgroundColor: 'rgba(255, 255, 255, 0.6)'
          }}
        >
          <Box
            sx={{
              position: 'relative',
              textAlign: 'center',
              p: 4
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ 
                scale: [0, 1.2, 1],
                rotate: [0, 10, 0]
              }}
              transition={{ 
                duration: 0.8, 
                ease: "easeOut" 
              }}
            >
              <CheckCircleIcon
                sx={{
                  color: 'success.main',
                  fontSize: 100,
                  filter: 'drop-shadow(0 0 10px rgba(46, 196, 94, 0.5))'
                }}
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Typography 
                variant="h5" 
                sx={{ 
                  mt: 2, 
                  fontWeight: 600,
                  color: 'success.dark'
                }}
              >
                {message}
              </Typography>
            </motion.div>
            
            {/* Particelle che volano */}
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                initial={{ 
                  x: 0, 
                  y: 0, 
                  opacity: 0 
                }}
                animate={{ 
                  x: particle.x, 
                  y: particle.y, 
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0]
                }}
                transition={{ 
                  duration: Math.random() * 1 + 0.5, 
                  delay: Math.random() * 0.3,
                  ease: "easeOut"
                }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: particle.size,
                  height: particle.size,
                  borderRadius: '50%',
                  backgroundColor: particle.color
                }}
              />
            ))}
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SuccessAnimation;
