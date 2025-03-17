import React from 'react';
import { motion } from 'framer-motion';
import { Box, CircularProgress, Skeleton, Typography, useTheme, LinearProgress } from '@mui/material';

// Interfaccia per le props del componente LoadingIndicator
interface LoadingIndicatorProps {
  size?: number;
  color?: string;
  text?: string;
  fullScreen?: boolean;
}

/**
 * Componente che mostra un indicatore di caricamento animato
 */
export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = 40,
  color,
  text = 'Caricamento in corso...',
  fullScreen = false,
}) => {
  const theme = useTheme();
  const actualColor = color || theme.palette.primary.main;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: fullScreen ? '100vh' : 'auto',
        width: '100%',
        p: 3,
      }}
    >
      <motion.div
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <CircularProgress size={size} sx={{ color: actualColor }} />
      </motion.div>
      {text && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{ mt: 2, textAlign: 'center' }}
          >
            {text}
          </Typography>
        </motion.div>
      )}
    </Box>
  );
};

// Interfaccia per le props del componente PulseLoader
interface PulseLoaderProps {
  count?: number;
  color?: string;
  size?: number;
}

/**
 * Componente che mostra un'animazione di caricamento a pulsazione
 */
export const PulseLoader: React.FC<PulseLoaderProps> = ({
  count = 3,
  color,
  size = 20,
}) => {
  const theme = useTheme();
  const actualColor = color || theme.palette.primary.main;
  
  const dots = Array.from({ length: count });

  return (
    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
      {dots.map((_, index) => (
        <motion.div
          key={index}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            backgroundColor: actualColor,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </Box>
  );
};

// Interfaccia per le props del componente SkeletonLoader
interface SkeletonLoaderProps {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: number | string;
  height?: number | string;
  animation?: 'pulse' | 'wave' | false;
  count?: number;
}

/**
 * Componente che mostra uno o più skeleton loader durante il caricamento di contenuti
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  width = '100%',
  height = 40,
  animation = 'pulse',
  count = 1,
}) => {
  return (
    <Box sx={{ width: '100%' }}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          variant={variant}
          width={width}
          height={height}
          animation={animation}
          sx={{ mb: 1 }}
        />
      ))}
    </Box>
  );
};

// Interfaccia per le props dei CardSkeleton
export interface CardSkeletonProps {
  count?: number;
  height?: number;
}

/**
 * Componente che mostra skeleton loader per card durante il caricamento
 */
export const CardSkeleton: React.FC<CardSkeletonProps> = ({ 
  count = 1,
  height = 200
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Box sx={{ mb: 2 }}>
            <Skeleton 
              variant="rectangular" 
              height={height * 0.5} 
              sx={{ borderRadius: '4px 4px 0 0' }} 
              animation="wave" 
            />
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: '0 0 4px 4px' }}>
              <Skeleton variant="text" height={24} width="70%" animation="wave" />
              <Skeleton variant="text" height={20} animation="wave" />
              <Skeleton variant="text" height={20} width="90%" animation="wave" />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Skeleton variant="rectangular" height={36} width={120} animation="wave" sx={{ borderRadius: 1 }} />
              </Box>
            </Box>
          </Box>
        </motion.div>
      ))}
    </>
  );
};

// Interfaccia per le props di TableSkeleton
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

/**
 * Componente che mostra skeleton loader per tabelle durante il caricamento
 */
export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
}) => {
  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', mb: 1 }}>
        {Array.from({ length: columns }).map((_, index) => (
          <Box key={`header-${index}`} sx={{ flexGrow: 1, p: 1 }}>
            <Skeleton variant="text" height={32} />
          </Box>
        ))}
      </Box>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Box
          key={`row-${rowIndex}`}
          sx={{
            display: 'flex',
            py: 1,
            borderBottom: '1px solid rgba(0,0,0,0.1)',
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Box key={`cell-${rowIndex}-${colIndex}`} sx={{ flexGrow: 1, p: 1 }}>
              <Skeleton variant="text" />
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
};

/**
 * Componente che mostra una barra di progresso animata
 */
export const ProgressBar: React.FC<{ 
  progress: number;
  height?: number;
  showLabel?: boolean;
  color?: string;
}> = ({ 
  progress, 
  height = 8, 
  showLabel = false,
  color
}) => {
  const theme = useTheme();
  const progressColor = color || theme.palette.primary.main;
  
  // Determina il colore in base al progresso
  const getProgressColor = () => {
    if (color) return color;
    if (progress < 30) return theme.palette.warning.main;
    if (progress < 70) return theme.palette.info.main;
    return theme.palette.success.main;
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {showLabel && (
        <Box sx={{ 
          position: 'absolute', 
          right: 0, 
          top: -20, 
          zIndex: 1,
          bgcolor: getProgressColor(),
          color: '#fff',
          px: 1,
          py: 0.2,
          borderRadius: 1,
          fontSize: '0.75rem',
          fontWeight: 'bold'
        }}>
          {progress}%
        </Box>
      )}
      <Box sx={{ background: theme.palette.grey[200], borderRadius: height }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ borderRadius: height }}
        >
          <Box 
            sx={{ 
              height: height, 
              borderRadius: height,
              background: getProgressColor(),
              boxShadow: `0px 0px 8px ${getProgressColor()}40`
            }} 
          />
        </motion.div>
      </Box>
    </Box>
  );
};
