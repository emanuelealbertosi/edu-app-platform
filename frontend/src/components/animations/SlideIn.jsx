import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * Componente di animazione che fa apparire i suoi figli con un effetto di scivolamento
 * @param {object} props - Le proprietà del componente
 * @param {React.ReactNode} props.children - I componenti figli da animare
 * @param {number} props.duration - Durata dell'animazione in secondi
 * @param {number} props.delay - Ritardo prima dell'inizio dell'animazione in secondi
 * @param {string} props.direction - Direzione dello scivolamento ('left', 'right', 'top', 'bottom')
 * @returns {JSX.Element} Componente animato
 */
const SlideIn = ({ 
  children, 
  duration = 0.5, 
  delay = 0, 
  direction = 'left' 
}) => {
  // Configura la posizione iniziale in base alla direzione
  const getInitialPosition = () => {
    switch (direction) {
      case 'left':
        return { x: '-100%', y: 0 };
      case 'right':
        return { x: '100%', y: 0 };
      case 'top':
        return { x: 0, y: '-100%' };
      case 'bottom':
        return { x: 0, y: '100%' };
      default:
        return { x: '-100%', y: 0 };
    }
  };

  return (
    <motion.div
      initial={getInitialPosition()}
      animate={{ x: 0, y: 0 }}
      exit={getInitialPosition()}
      transition={{ 
        duration, 
        delay, 
        type: 'spring', 
        stiffness: 100, 
        damping: 20 
      }}
    >
      {children}
    </motion.div>
  );
};

SlideIn.propTypes = {
  children: PropTypes.node.isRequired,
  duration: PropTypes.number,
  delay: PropTypes.number,
  direction: PropTypes.oneOf(['left', 'right', 'top', 'bottom'])
};

export default SlideIn;
