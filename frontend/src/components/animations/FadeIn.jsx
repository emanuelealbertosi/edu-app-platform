import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * Componente di animazione che fa apparire gradualmente i suoi figli con un effetto fade-in
 * @param {object} props - Le proprietà del componente
 * @param {React.ReactNode} props.children - I componenti figli da animare
 * @param {number} props.duration - Durata dell'animazione in secondi
 * @param {number} props.delay - Ritardo prima dell'inizio dell'animazione in secondi
 * @returns {JSX.Element} Componente animato
 */
const FadeIn = ({ children, duration = 0.5, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration, delay }}
    >
      {children}
    </motion.div>
  );
};

FadeIn.propTypes = {
  children: PropTypes.node.isRequired,
  duration: PropTypes.number,
  delay: PropTypes.number
};

export default FadeIn;
