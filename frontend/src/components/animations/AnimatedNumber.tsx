import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Typography, TypographyProps } from '@mui/material';

interface AnimatedNumberProps extends Omit<TypographyProps, 'children'> {
  value: number;
  duration?: number;
  formatValue?: (value: number) => string;
}

/**
 * Componente che mostra un numero animato che si aggiorna con una transizione fluida
 */
const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ 
  value, 
  duration = 0.5, 
  formatValue = (val) => val.toLocaleString(),
  ...typographyProps 
}) => {
  // Utilizziamo un approccio più semplice con useState e un effetto di animazione
  const [displayValue, setDisplayValue] = useState<string>(formatValue(value));
  const [key, setKey] = useState(0); // Chiave per forzare il re-render dell'animazione

  useEffect(() => {
    // Quando il valore cambia, aggiorniamo il displayValue e incrementiamo la chiave
    setDisplayValue(formatValue(value));
    setKey(prev => prev + 1);
  }, [value, formatValue]);

  return (
    <motion.div 
      key={key}
      style={{ display: 'inline-block' }}
      initial={{ opacity: 0.8, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration, type: 'spring', stiffness: 120, damping: 10 }}
    >
      <Typography {...typographyProps}>
        {displayValue}
      </Typography>
    </motion.div>
  );
};

export default AnimatedNumber;
