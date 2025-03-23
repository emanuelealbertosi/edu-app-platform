import React from 'react';
import { Button, ButtonProps, CircularProgress } from '@mui/material';

interface ProgressButtonProps extends ButtonProps {
  loading?: boolean;
  disabled?: boolean;
  loadingText?: string;
}

export const ProgressButton: React.FC<ProgressButtonProps> = ({
  children,
  loading = false,
  disabled = false,
  loadingText,
  ...props
}) => {
  return (
    <Button
      disabled={loading || disabled}
      {...props}
      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : props.startIcon}
    >
      {loading && loadingText ? loadingText : children}
    </Button>
  );
};

export default ProgressButton; 