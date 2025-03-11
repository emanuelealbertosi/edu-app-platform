import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

// Varianti di animazione per le transizioni di pagina
const pageVariants = {
  initial: {
    opacity: 0
  },
  in: {
    opacity: 1
  },
  out: {
    opacity: 0
  }
};

// Varianti per diverse direzioni di transizione
export const slideVariants = {
  // Slide da destra
  slideInRight: {
    initial: { opacity: 0, x: 100 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -100 }
  },
  // Slide da sinistra
  slideInLeft: {
    initial: { opacity: 0, x: -100 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: 100 }
  },
  // Slide dal basso
  slideInUp: {
    initial: { opacity: 0, y: 100 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -100 }
  },
  // Slide dall'alto
  slideInDown: {
    initial: { opacity: 0, y: -100 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: 100 }
  },
  // Fade semplice
  fade: {
    initial: { opacity: 0 },
    in: { opacity: 1 },
    out: { opacity: 0 }
  },
  // Zoom in
  zoomIn: {
    initial: { opacity: 0, scale: 0.8 },
    in: { opacity: 1, scale: 1 },
    out: { opacity: 0, scale: 1.2 }
  },
  // Zoom out
  zoomOut: {
    initial: { opacity: 0, scale: 1.2 },
    in: { opacity: 1, scale: 1 },
    out: { opacity: 0, scale: 0.8 }
  }
};

// Durate di transizione
const pageDuration = {
  slow: 0.8,
  normal: 0.5,
  fast: 0.3
};

// Tipo di transizione
export type TransitionType = keyof typeof slideVariants;

interface AnimatedPageProps {
  children: React.ReactNode;
  transitionType?: TransitionType;
  duration?: keyof typeof pageDuration | number;
}

/**
 * Componente che applica animazioni di transizione a pagine
 * Utilizzalo per avvolgere il contenuto di una pagina e applicare un'animazione
 */
export const AnimatedPage: React.FC<AnimatedPageProps> = ({
  children,
  transitionType = 'fade',
  duration = 'normal'
}) => {
  const variants = slideVariants[transitionType];
  const transitionDuration = typeof duration === 'string' ? pageDuration[duration] : duration;

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={variants}
      transition={{ duration: transitionDuration, type: 'tween' }}
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </motion.div>
  );
};

/**
 * Componente che gestisce le transizioni tra pagine in base al percorso
 * Usa questo componente come wrapper per Route in App.tsx
 */
export const AnimatedRoutes: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={{ duration: 0.3 }}
        style={{ width: '100%', height: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Gestione animazioni per lista di elementi con effetto stagger
export const listItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3
    }
  }),
  removed: { 
    opacity: 0,
    y: -20,
    transition: { duration: 0.2 }
  }
};

interface AnimatedListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  duration?: number;
}

/**
 * Componente che anima una lista di elementi con effetto staggered
 */
export const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  staggerDelay = 0.1,
  duration = 0.3
}) => {
  return (
    <AnimatePresence>
      {React.Children.map(children, (child, i) => (
        <motion.div
          key={i}
          custom={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            transition: { delay: i * staggerDelay, duration }
          }}
          exit={{ 
            opacity: 0, 
            y: -20,
            transition: { duration: 0.2 } 
          }}
        >
          {child}
        </motion.div>
      ))}
    </AnimatePresence>
  );
};
