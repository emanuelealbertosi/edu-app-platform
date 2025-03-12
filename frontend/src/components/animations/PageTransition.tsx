import React from 'react';
import { motion } from 'framer-motion';
import { Box } from '@mui/material';

interface PageTransitionProps {
  children: React.ReactNode;
  duration?: number;
}

/**
 * Componente che aggiunge animazioni di transizione alle pagine
 * Utilizza Framer Motion per creare transizioni fluide quando le pagine vengono caricate
 */
const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  duration = 0.5 
}) => {
  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration,
        ease: "easeInOut"
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { 
        duration: duration * 0.75,
        ease: "easeOut"
      }
    }
  };
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={variants}
    >
      <Box sx={{ width: '100%' }}>
        {children}
      </Box>
    </motion.div>
  );
};

export default PageTransition;
