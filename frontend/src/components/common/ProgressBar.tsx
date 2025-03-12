import React from 'react';
import { Box, LinearProgress, LinearProgressProps, styled, BoxProps } from '@mui/material';

// Interfaccia per le proprietà del componente ProgressBar
interface ProgressBarProps extends BoxProps {
  progress: number;
  height?: number;
  animated?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error';
  label?: string;
  showPercentage?: boolean;
  // Non è necessario aggiungere 'sx' qui perché è già incluso in BoxProps
}

// Interfaccia estesa per lo styled LinearProgress
interface StyledLinearProgressProps extends LinearProgressProps {
  height?: number;
  animated?: boolean;
}

// Creazione di un LinearProgress con stile personalizzato
const StyledLinearProgress = styled(LinearProgress)<StyledLinearProgressProps>(
  ({ theme, height = 10, animated = false }) => ({
    height: height,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.default,
    '& .MuiLinearProgress-bar': {
      transition: animated ? 'transform 0.4s ease' : 'none',
    },
  })
);

/**
 * Componente ProgressBar che mostra una barra di progresso stilizzata
 */
const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 10,
  animated = false,
  color = 'primary',
  label,
  showPercentage = false,
}) => {
  // Assicura che il progresso sia tra 0 e 100
  const normalizedProgress = Math.min(100, Math.max(0, progress));

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      {label && (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mb: 0.5 
          }}
        >
          <span>{label}</span>
          {showPercentage && <span>{normalizedProgress}%</span>}
        </Box>
      )}
      <StyledLinearProgress
        variant="determinate"
        value={normalizedProgress}
        height={height}
        color={color}
        animated={animated}
        sx={{ width: '100%' }}
      />
    </Box>
  );
};

export default ProgressBar;
