import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardProps } from '@mui/material';

interface AnimatedCardProps extends CardProps {
  children: React.ReactNode;
  hoverScale?: number;
  hoverElevation?: number;
  transitionDuration?: number;
}

/**
 * Card component with animation effects for hover and click interactions
 * Provides visual feedback when users interact with cards
 */
const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  hoverScale = 1.03,
  hoverElevation = 6,
  transitionDuration = 0.2,
  elevation = 2,
  sx,
  ...props
}) => {
  // Initial shadow based on the elevation prop
  const initialShadow = `0px ${elevation}px ${elevation * 2}px rgba(0, 0, 0, 0.1)`;
  
  // Hover shadow based on the hoverElevation prop
  const hoverShadow = `0px ${hoverElevation}px ${hoverElevation * 2}px rgba(0, 0, 0, 0.15)`;

  return (
    <motion.div
      whileHover={{ 
        scale: hoverScale,
        boxShadow: hoverShadow
      }}
      whileTap={{ 
        scale: hoverScale - 0.02,
      }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20,
        duration: transitionDuration
      }}
      style={{
        boxShadow: initialShadow,
        borderRadius: '4px' // Match Material-UI card border radius
      }}
    >
      <Card 
        elevation={0} // No elevation needed as we're handling it with motion
        sx={{ 
          overflow: 'hidden',
          height: '100%',
          ...sx 
        }}
        {...props}
      >
        {children}
      </Card>
    </motion.div>
  );
};

export default AnimatedCard;
