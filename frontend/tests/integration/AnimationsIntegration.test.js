import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NotificationsProvider } from '../../src/contexts/NotificationsContext';
import { AuthProvider } from '../../src/contexts/AuthContext';
import LoadingSpinner from '../../src/components/ui/LoadingSpinner';
import FadeTransition from '../../src/components/animations/FadeTransition';
import SlideTransition from '../../src/components/animations/SlideTransition';
import ScaleTransition from '../../src/components/animations/ScaleTransition';

// Componente di test che simula diverse operazioni di caricamento
const AnimationTestComponent = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const [content, setContent] = React.useState(null);

  const simulateLoading = async () => {
    setIsLoading(true);
    // Simulazione di operazione asincrona
    await new Promise(resolve => setTimeout(resolve, 1000));
    setContent('Contenuto caricato');
    setIsLoading(false);
  };

  const toggleVisibility = () => {
    setIsVisible(prev => !prev);
  };

  React.useEffect(() => {
    simulateLoading();
  }, []);

  return (
    <div>
      <button onClick={toggleVisibility} data-testid="toggle-button">
        {isVisible ? 'Nascondi' : 'Mostra'}
      </button>
      
      {isLoading && <LoadingSpinner data-testid="loading-spinner" />}
      
      <FadeTransition in={isVisible} timeout={300} data-testid="fade-transition">
        <div data-testid="fade-content">Contenuto con fade transition</div>
      </FadeTransition>
      
      <SlideTransition in={isVisible} direction="right" timeout={500} data-testid="slide-transition">
        <div data-testid="slide-content">Contenuto con slide transition</div>
      </SlideTransition>
      
      <ScaleTransition in={isVisible} timeout={400} data-testid="scale-transition">
        <div data-testid="scale-content">Contenuto con scale transition</div>
      </ScaleTransition>
      
      {content && (
        <FadeTransition in={true} timeout={300} data-testid="content-transition">
          <div data-testid="loaded-content">{content}</div>
        </FadeTransition>
      )}
    </div>
  );
};

describe('Animazioni UI', () => {
  // Test per LoadingSpinner
  test('LoadingSpinner dovrebbe essere visualizzato durante il caricamento', async () => {
    // Rendering del componente
    render(
      <NotificationsProvider>
        <AuthProvider>
          <AnimationTestComponent />
        </AuthProvider>
      </NotificationsProvider>
    );

    // Verifica che il LoadingSpinner sia inizialmente visibile
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    
    // Attesa del completamento del caricamento
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      expect(screen.getByTestId('loaded-content')).toBeInTheDocument();
      expect(screen.getByTestId('loaded-content')).toHaveTextContent('Contenuto caricato');
    }, { timeout: 2000 });
  });

  // Test per FadeTransition
  test('FadeTransition dovrebbe applicare le classi di animazione corrette', async () => {
    render(
      <NotificationsProvider>
        <FadeTransition in={true} timeout={300} data-testid="test-fade">
          <div data-testid="fade-content">Contenuto</div>
        </FadeTransition>
      </NotificationsProvider>
    );

    const fadeContent = screen.getByTestId('fade-content');
    
    // Verifica che l'elemento abbia la classe di animazione corretta
    expect(fadeContent.parentElement).toHaveClass('fade-enter');
    expect(fadeContent.parentElement).toHaveClass('fade-enter-active');
    
    // Attesa del completamento dell'animazione
    await waitFor(() => {
      expect(fadeContent.parentElement).toHaveClass('fade-enter-done');
    }, { timeout: 400 });
  });

  // Test per SlideTransition
  test('SlideTransition dovrebbe applicare le classi di animazione corrette', async () => {
    render(
      <NotificationsProvider>
        <SlideTransition in={true} direction="right" timeout={500} data-testid="test-slide">
          <div data-testid="slide-content">Contenuto</div>
        </SlideTransition>
      </NotificationsProvider>
    );

    const slideContent = screen.getByTestId('slide-content');
    
    // Verifica che l'elemento abbia la classe di animazione corretta
    expect(slideContent.parentElement).toHaveClass('slide-right-enter');
    expect(slideContent.parentElement).toHaveClass('slide-right-enter-active');
    
    // Attesa del completamento dell'animazione
    await waitFor(() => {
      expect(slideContent.parentElement).toHaveClass('slide-right-enter-done');
    }, { timeout: 600 });
  });

  // Test per ScaleTransition
  test('ScaleTransition dovrebbe applicare le classi di animazione corrette', async () => {
    render(
      <NotificationsProvider>
        <ScaleTransition in={true} timeout={400} data-testid="test-scale">
          <div data-testid="scale-content">Contenuto</div>
        </ScaleTransition>
      </NotificationsProvider>
    );

    const scaleContent = screen.getByTestId('scale-content');
    
    // Verifica che l'elemento abbia la classe di animazione corretta
    expect(scaleContent.parentElement).toHaveClass('scale-enter');
    expect(scaleContent.parentElement).toHaveClass('scale-enter-active');
    
    // Attesa del completamento dell'animazione
    await waitFor(() => {
      expect(scaleContent.parentElement).toHaveClass('scale-enter-done');
    }, { timeout: 500 });
  });

  // Test per il toggle delle animazioni
  test('le animazioni dovrebbero essere attivate/disattivate al click del pulsante', async () => {
    render(
      <NotificationsProvider>
        <AuthProvider>
          <AnimationTestComponent />
        </AuthProvider>
      </NotificationsProvider>
    );

    // Attesa del caricamento iniziale
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    }, { timeout: 2000 });

    // Verifica che i contenuti con transizione non siano visibili inizialmente
    expect(screen.queryByTestId('fade-content')).not.toBeVisible();
    expect(screen.queryByTestId('slide-content')).not.toBeVisible();
    expect(screen.queryByTestId('scale-content')).not.toBeVisible();
    
    // Click sul pulsante per mostrare i contenuti
    await act(async () => {
      screen.getByTestId('toggle-button').click();
    });
    
    // Verifica che i contenuti siano ora visibili
    await waitFor(() => {
      expect(screen.getByTestId('fade-content')).toBeVisible();
      expect(screen.getByTestId('slide-content')).toBeVisible();
      expect(screen.getByTestId('scale-content')).toBeVisible();
    });
    
    // Click sul pulsante per nascondere i contenuti
    await act(async () => {
      screen.getByTestId('toggle-button').click();
    });
    
    // Verifica che i contenuti non siano più visibili
    await waitFor(() => {
      expect(screen.queryByTestId('fade-content')).not.toBeVisible();
      expect(screen.queryByTestId('slide-content')).not.toBeVisible();
      expect(screen.queryByTestId('scale-content')).not.toBeVisible();
    });
  });

  // Test per l'integrazione con le notifiche
  test('le notifiche dovrebbero usare animazioni di entrata e uscita', async () => {
    // Questo test necessita di essere implementato una volta che i componenti
    // di animazione sono integrati nel sistema di notifiche
    // La verifica dovrà controllare che le notifiche appaiano e scompaiano
    // con le animazioni appropriate
  });
});
