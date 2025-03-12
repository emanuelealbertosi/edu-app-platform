import React, { useEffect } from 'react';
// Importazione alternativa di canvas-confetti per evitare problemi con TypeScript
// @ts-ignore
const confetti = require('canvas-confetti').default || require('canvas-confetti');

interface SuccessConfettiProps {
  duration?: number;
  particleCount?: number;
  spread?: number;
  colors?: string[];
}

/**
 * Componente che mostra un'animazione di coriandoli per celebrare un evento di successo
 */
const SuccessConfetti: React.FC<SuccessConfettiProps> = ({
  duration = 3000,
  particleCount = 100,
  spread = 70,
  colors = ['#FFD700', '#FF0000', '#00FF00', '#0000FF', '#FF00FF', '#00FFFF']
}) => {
  useEffect(() => {
    const end = Date.now() + duration;

    // Funzione per lanciare i coriandoli
    const launchConfetti = () => {
      confetti({
        particleCount: Math.floor(particleCount / 2),
        angle: 60,
        spread,
        origin: { x: 0, y: 0.8 },
        colors
      });

      confetti({
        particleCount: Math.floor(particleCount / 2),
        angle: 120,
        spread,
        origin: { x: 1, y: 0.8 },
        colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(launchConfetti);
      }
    };

    launchConfetti();

    // Pulizia quando il componente viene smontato
    return () => {
      confetti.reset();
    };
  }, [duration, particleCount, spread, colors]);

  return null; // Questo componente non renderizza nulla nel DOM
};

export default SuccessConfetti;
