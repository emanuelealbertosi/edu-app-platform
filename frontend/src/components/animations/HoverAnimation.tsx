import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Box, BoxProps } from '@mui/material';

export interface HoverAnimationProps extends BoxProps {
  children: ReactNode;
  scale?: number;       // Fattore di scala on hover
  duration?: number;    // Durata dell'animazione in secondi
  translateY?: number;  // Spostamento verticale in px (negativo = verso l'alto)
  shadow?: boolean;     // Aggiungere ombra on hover
  shadowSize?: string;  // Dimensione dell'ombra (es. '0px 8px 15px')
  shadowColor?: string; // Colore dell'ombra (es. 'rgba(0, 0, 0, 0.1)')
  disabled?: boolean;   // Disabilita l'animazione
}

/**
 * Componente per aggiungere animazioni di hover agli elementi
 * 
 * Questo componente utilizza Framer Motion per creare effetti di hover eleganti
 * su qualsiasi elemento figlio.
 */
const HoverAnimation: React.FC<HoverAnimationProps> = ({
  children,
  scale = 1.03,
  duration = 0.3,
  translateY = -3,
  shadow = true,
  shadowSize = '0px 8px 15px',
  shadowColor = 'rgba(0, 0, 0, 0.1)',
  disabled = false,
  sx,
  ...boxProps
}) => {
  // Se l'animazione è disabilitata, restituisci direttamente i children
  if (disabled) {
    return <Box sx={sx} {...boxProps}>{children}</Box>;
  }

  return (
    <Box
      component={motion.div}
      sx={{
        display: 'inline-block',
        ...sx
      }}
      initial={{ 
        boxShadow: 'none', 
        y: 0, 
        scale: 1 
      }}
      whileHover={{
        y: translateY,
        scale: scale,
        boxShadow: shadow ? `${shadowSize} ${shadowColor}` : 'none',
        transition: { 
          duration: duration,
          ease: "easeOut"
        }
      }}
      {...boxProps}
    >
      {children}
    </Box>
  );
};

export default HoverAnimation;
