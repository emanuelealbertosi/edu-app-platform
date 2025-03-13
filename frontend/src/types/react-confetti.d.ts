declare module 'react-confetti' {
  import React from 'react';
  
  interface ConfettiProps {
    width?: number;
    height?: number;
    numberOfPieces?: number;
    confettiSource?: {
      x: number;
      y: number;
      w: number;
      h: number;
    };
    recycle?: boolean;
    run?: boolean;
    colors?: string[];
    opacity?: number;
    onConfettiComplete?: () => void;
    [key: string]: any;
  }
  
  const Confetti: React.FC<ConfettiProps>;
  
  export default Confetti;
}
