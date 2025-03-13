import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { Box, useTheme } from '@mui/material';

interface SuccessConfettiProps {
  active?: boolean;
  duration?: number;
  pieces?: number;
  recycle?: boolean;
}

export const SuccessConfetti: React.FC<SuccessConfettiProps> = ({
  active = true,
  duration = 5000,
  pieces = 200,
  recycle = false
}) => {
  const [isActive, setIsActive] = useState(active);
  const theme = useTheme();
  
  useEffect(() => {
    setIsActive(active);
    
    if (active && !recycle) {
      const timer = setTimeout(() => {
        setIsActive(false);
      }, duration);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [active, duration, recycle]);
  
  if (!isActive) return null;
  
  return (
    <Box sx={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      zIndex: (theme) => theme.zIndex.drawer + 2,
      pointerEvents: 'none' 
    }}>
      <Confetti
        width={window.innerWidth}
        height={window.innerHeight}
        numberOfPieces={pieces}
        recycle={recycle}
        colors={[
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.info.main
        ]}
      />
    </Box>
  );
};

export default SuccessConfetti;
