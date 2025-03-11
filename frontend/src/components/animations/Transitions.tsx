import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box } from '@mui/material';

export interface FadeProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}

// Componente per animazione fade-in
export const FadeIn: React.FC<FadeProps> = ({ 
  children, 
  duration = 0.5, 
  delay = 0,
  className,
  style
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration, delay }}
    className={className}
    style={style}
  >
    {children}
  </motion.div>
);

// Componente per animazione slide-in da destra
export const SlideInRight: React.FC<FadeProps> = ({ 
  children, 
  duration = 0.5, 
  delay = 0,
  className,
  style
}) => (
  <motion.div
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 50 }}
    transition={{ duration, delay }}
    className={className}
    style={style}
  >
    {children}
  </motion.div>
);

// Componente per animazione slide-in da sinistra
export const SlideInLeft: React.FC<FadeProps> = ({ 
  children, 
  duration = 0.5, 
  delay = 0,
  className,
  style
}) => (
  <motion.div
    initial={{ opacity: 0, x: -50 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -50 }}
    transition={{ duration, delay }}
    className={className}
    style={style}
  >
    {children}
  </motion.div>
);

// Componente per animazione slide-in dal basso
export const SlideInUp: React.FC<FadeProps> = ({ 
  children, 
  duration = 0.5, 
  delay = 0,
  className,
  style
}) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 50 }}
    transition={{ duration, delay }}
    className={className}
    style={style}
  >
    {children}
  </motion.div>
);

// Componente per animazione slide-in dall'alto
export const SlideInDown: React.FC<FadeProps> = ({ 
  children, 
  duration = 0.5, 
  delay = 0,
  className,
  style
}) => (
  <motion.div
    initial={{ opacity: 0, y: -50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -50 }}
    transition={{ duration, delay }}
    className={className}
    style={style}
  >
    {children}
  </motion.div>
);

// Wrapper per animazioni con AnimatePresence
export interface PageTransitionProps {
  children: React.ReactNode;
  id: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, id }) => (
  <AnimatePresence mode="wait">
    <motion.div
      key={id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);

// Componente Stagger per lista di elementi
export interface StaggerContainerProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  duration?: number;
  initialDelay?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  staggerDelay = 0.1,
  duration = 0.5,
  initialDelay = 0,
  className,
  style
}) => (
  <Box className={className} style={style}>
    {React.Children.map(children, (child, index) => (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{
          duration,
          delay: initialDelay + index * staggerDelay
        }}
      >
        {child}
      </motion.div>
    ))}
  </Box>
);

// Componente per animazioni al passaggio del mouse (hover)
export interface HoverAnimationProps {
  children: React.ReactNode;
  scale?: number;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Componente per animazioni al passaggio del mouse (hover)
 */
export const HoverAnimation: React.FC<HoverAnimationProps> = ({
  children,
  scale = 1.05,
  delay = 0,
  className,
  style
}) => {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ 
        duration: 0.3, 
        delay,
        type: "spring", 
        stiffness: 300 
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
};
