import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * Componente che gestisce le transizioni tra pagine e viste diverse
 * @param {object} props - Le proprietà del componente
 * @param {React.ReactNode} props.children - I componenti figli da animare
 * @param {string} props.keyValue - Chiave unica per identificare la pagina/vista (es. URL path)
 * @param {string} props.type - Tipo di transizione ('fade', 'slide', 'scale', 'none')
 * @param {number} props.duration - Durata dell'animazione in secondi
 * @returns {JSX.Element} Componente di transizione pagina
 */
const PageTransition = ({ 
  children, 
  keyValue, 
  type = 'fade', 
  duration = 0.4 
}) => {
  // Definizione delle diverse animazioni
  const getAnimationVariants = () => {
    switch (type) {
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        };
      case 'slide':
        return {
          initial: { x: '100%', opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: '-100%', opacity: 0 },
        };
      case 'scale':
        return {
          initial: { scale: 0.8, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.8, opacity: 0 },
        };
      case 'none':
        return {
          initial: {},
          animate: {},
          exit: {},
        };
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        };
    }
  };

  const variants = getAnimationVariants();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={keyValue}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        transition={{ 
          duration,
          ease: [0.22, 1, 0.36, 1] // Curva di easing per transizioni più naturali
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

PageTransition.propTypes = {
  children: PropTypes.node.isRequired,
  keyValue: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['fade', 'slide', 'scale', 'none']),
  duration: PropTypes.number
};

export default PageTransition;
