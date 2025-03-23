import React from 'react';
import { Typography, Box } from '@mui/material';

interface PageHeadingProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export const PageHeading: React.FC<PageHeadingProps> = ({ 
  title, 
  subtitle,
  children 
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {title}
      </Typography>
      
      {subtitle && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
          {subtitle}
        </Typography>
      )}
      
      {children}
    </Box>
  );
};

export default PageHeading; 