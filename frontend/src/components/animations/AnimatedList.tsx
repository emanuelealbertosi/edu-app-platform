import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, BoxProps } from '@mui/material';

export interface AnimatedListProps extends BoxProps {
  children: ReactNode | ReactNode[]; // Accetta sia un singolo elemento che un array
  delay?: number;      // Ritardo tra l'animazione di ogni elemento (in secondi)
  staggerDelay?: number; // Ritardo tra l'animazione di ogni elemento (in secondi)
  direction?: 'left' | 'right' | 'up' | 'down'; // Direzione dell'animazione
  duration?: number;   // Durata dell'animazione (in secondi)
  distance?: number;   // Distanza dell'animazione (in pixel)
}

/**
 * Componente che anima un elenco di elementi con un effetto di entrata a cascata
 */
const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  delay = 0,
  staggerDelay = 0.1,
  direction = 'up',
  duration = 0.5,
  distance = 20,
  ...boxProps
}) => {
  // Configurazione delle varianti di animazione in base alla direzione
  const directionMap = {
    left: { x: -distance, y: 0 },
    right: { x: distance, y: 0 },
    up: { x: 0, y: -distance },
    down: { x: 0, y: distance }
  };

  const initialPosition = directionMap[direction];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      ...initialPosition 
    },
    show: { 
      opacity: 1, 
      x: 0, 
      y: 0,
      transition: {
        duration: duration,
        ease: "easeOut"
      }
    }
  };

  // Funzione per avvolgere ogni figlio in un elemento animato
  const renderAnimatedChildren = () => {
    return React.Children.map(children, (child, index) => (
      <motion.div
        key={index}
        variants={itemVariants}
        initial="hidden"
        animate="show"
        exit={{ opacity: 0, ...initialPosition, transition: { duration: 0.3 } }}
      >
        {child}
      </motion.div>
    ));
  };

  return (
    <Box {...boxProps}>
      <AnimatePresence>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {renderAnimatedChildren()}
        </motion.div>
      </AnimatePresence>
    </Box>
  );
};

export default AnimatedList;
