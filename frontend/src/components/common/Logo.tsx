import React from 'react';
import { Box, Typography } from '@mui/material';
import { SvgIcon, SvgIconProps } from '@mui/material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';

interface LogoProps {
  height?: number;
  variant?: 'full' | 'icon' | 'text';
  color?: 'primary' | 'secondary' | 'white';
}

/**
 * Componente Logo per l'applicazione educativa
 */
const Logo: React.FC<LogoProps> = ({ 
  height = 40, 
  variant = 'full',
  color = 'primary'
}) => {
  const iconSize = height;
  const textSize = height * 0.5;
  
  const getColor = () => {
    switch(color) {
      case 'primary': return 'primary.main';
      case 'secondary': return 'secondary.main';
      case 'white': return '#ffffff';
      default: return 'primary.main';
    }
  };
  
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: height,
      }}
    >
      {(variant === 'full' || variant === 'icon') && (
        <AutoStoriesIcon 
          sx={{ 
            fontSize: iconSize,
            color: getColor(),
            mr: variant === 'full' ? 1 : 0 
          }} 
        />
      )}
      
      {(variant === 'full' || variant === 'text') && (
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            fontSize: textSize,
            fontWeight: 700,
            color: getColor(),
            lineHeight: 1
          }}
        >
          App Educativa
        </Typography>
      )}
    </Box>
  );
};

export default Logo;
