import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const SpinnerContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: ${props => props.fullscreen ? '100vh' : 'inherit'};
  width: 100%;
`;

const Spinner = styled(motion.div)`
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  border-radius: 50%;
  border: ${props => props.thickness}px solid rgba(0, 0, 0, 0.1);
  border-top-color: #007bff;
  box-sizing: border-box;
`;

/**
 * Componente spinner di caricamento animato
 * @param {object} props - Le proprietà del componente
 * @param {number} props.size - Dimensione dello spinner in pixel
 * @param {number} props.thickness - Spessore del bordo in pixel
 * @param {number} props.duration - Durata di una rotazione completa in secondi
 * @param {boolean} props.fullscreen - Se lo spinner deve occupare l'altezza dello schermo
 * @returns {JSX.Element} Spinner animato
 */
const LoadingSpinner = ({ 
  size = 40, 
  thickness = 4, 
  duration = 1.2, 
  fullscreen = false 
}) => {
  return (
    <SpinnerContainer fullscreen={fullscreen}>
      <Spinner
        size={size}
        thickness={thickness}
        animate={{ rotate: 360 }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear"
        }}
        data-testid="loading-spinner"
      />
    </SpinnerContainer>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.number,
  thickness: PropTypes.number,
  duration: PropTypes.number,
  fullscreen: PropTypes.bool
};

export default LoadingSpinner;
