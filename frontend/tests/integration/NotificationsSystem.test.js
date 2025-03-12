import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NotificationsProvider, useNotifications } from '../../src/contexts/NotificationsContext';
import { NotificationsService } from '../../src/services/NotificationsService';
import NotificationsList from '../../src/components/Notifications/NotificationsList';

// Componente di test per aggiungere notifiche di test
const TestComponent = () => {
  const { addNotification } = useNotifications();

  const addSuccessNotification = () => {
    addNotification({
      type: 'success',
      title: 'Operazione completata',
      message: 'L\'operazione è stata completata con successo',
      autoClose: true,
      duration: 3000
    });
  };

  const addErrorNotification = () => {
    addNotification({
      type: 'error',
      title: 'Errore',
      message: 'Si è verificato un errore durante l\'operazione',
      autoClose: false
    });
  };

  const addWarningNotification = () => {
    addNotification({
      type: 'warning',
      title: 'Attenzione',
      message: 'Questa operazione potrebbe avere conseguenze',
      autoClose: true,
      duration: 5000
    });
  };

  const addInfoNotification = () => {
    addNotification({
      type: 'info',
      title: 'Informazione',
      message: 'Questa è un\'informazione importante',
      autoClose: true,
      duration: 4000
    });
  };

  return (
    <div>
      <button onClick={addSuccessNotification}>Aggiungi Successo</button>
      <button onClick={addErrorNotification}>Aggiungi Errore</button>
      <button onClick={addWarningNotification}>Aggiungi Avviso</button>
      <button onClick={addInfoNotification}>Aggiungi Info</button>
    </div>
  );
};

// Componente per inizializzare il servizio di notifiche
const NotificationsServiceInitializer = () => {
  const { addNotification } = useNotifications();
  
  React.useEffect(() => {
    // Inizializza il servizio di notifiche con il context
    NotificationsService.setNotificationHandler(addNotification);
  }, [addNotification]);
  
  return null;
};

describe('Sistema di Notifiche - Integrazione', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllTimers();
  });

  test('dovrebbe mostrare e nascondere notifiche con autoClose', async () => {
    render(
      <NotificationsProvider>
        <TestComponent />
        <NotificationsList />
      </NotificationsProvider>
    );

    // Aggiungiamo una notifica di successo
    fireEvent.click(screen.getByText('Aggiungi Successo'));

    // Verifichiamo che la notifica sia visibile
    expect(screen.getByText('Operazione completata')).toBeInTheDocument();
    expect(screen.getByText('L\'operazione è stata completata con successo')).toBeInTheDocument();

    // Avanziamo il timer per simulare l'autoClose
    act(() => {
      jest.advanceTimersByTime(3500);
    });

    // Forza il completamento di eventuali aggiornamenti asincroni
    await act(async () => {
      await null; // Forza un ciclo di render
    });

    // La notifica dovrebbe essere scomparsa dopo l'autoClose
    expect(screen.queryByText('Operazione completata')).not.toBeInTheDocument();
  });

  test('dovrebbe mostrare notifiche di errore senza autoClose', async () => {
    render(
      <NotificationsProvider>
        <TestComponent />
        <NotificationsList />
      </NotificationsProvider>
    );

    // Aggiungiamo una notifica di errore
    fireEvent.click(screen.getByText('Aggiungi Errore'));

    // Verifichiamo che la notifica sia visibile
    expect(screen.getByText('Errore')).toBeInTheDocument();
    expect(screen.getByText('Si è verificato un errore durante l\'operazione')).toBeInTheDocument();

    // Avanziamo il timer
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Forza il completamento di eventuali aggiornamenti asincroni
    await act(async () => {
      await null; // Forza un ciclo di render
    });

    // La notifica di errore dovrebbe essere ancora visibile (non ha autoClose)
    expect(screen.getByText('Errore')).toBeInTheDocument();

    // Cerchiamo il pulsante di chiusura
    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find(button => button.className.includes('notification-close'));
    
    // Chiudiamo manualmente la notifica
    if (closeButton) {
      fireEvent.click(closeButton);

      // Forza il completamento di eventuali aggiornamenti asincroni
      await act(async () => {
        await null; // Forza un ciclo di render
      });

      // Verifichiamo che la notifica sia stata rimossa
      expect(screen.queryByText('Errore')).not.toBeInTheDocument();
    }
  });

  test('dovrebbe gestire più notifiche contemporaneamente', async () => {
    render(
      <NotificationsProvider>
        <TestComponent />
        <NotificationsList />
      </NotificationsProvider>
    );

    // Aggiungiamo tutte e 4 le notifiche
    fireEvent.click(screen.getByText('Aggiungi Successo'));
    fireEvent.click(screen.getByText('Aggiungi Errore'));
    fireEvent.click(screen.getByText('Aggiungi Avviso'));
    fireEvent.click(screen.getByText('Aggiungi Info'));

    // Verifichiamo che tutte le notifiche siano visibili
    expect(screen.getByText('Operazione completata')).toBeInTheDocument();
    expect(screen.getByText('Errore')).toBeInTheDocument();
    expect(screen.getByText('Attenzione')).toBeInTheDocument();
    expect(screen.getByText('Informazione')).toBeInTheDocument();

    // Avanziamo il timer di 3500ms, la notifica di successo dovrebbe scomparire
    act(() => {
      jest.advanceTimersByTime(3500);
    });

    // Forza il completamento di eventuali aggiornamenti asincroni
    await act(async () => {
      await null; // Forza un ciclo di render
    });

    // La notifica di successo dovrebbe essere scomparsa
    expect(screen.queryByText('Operazione completata')).not.toBeInTheDocument();
    expect(screen.getByText('Errore')).toBeInTheDocument();
    expect(screen.getByText('Attenzione')).toBeInTheDocument();
    expect(screen.getByText('Informazione')).toBeInTheDocument();

    // Avanziamo il timer di altri 1000ms, la notifica di info dovrebbe scomparire
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Forza il completamento di eventuali aggiornamenti asincroni
    await act(async () => {
      await null; // Forza un ciclo di render
    });

    expect(screen.queryByText('Informazione')).not.toBeInTheDocument();
    expect(screen.getByText('Errore')).toBeInTheDocument();
    expect(screen.getByText('Attenzione')).toBeInTheDocument();

    // Avanziamo il timer di altri 1000ms, la notifica di avviso dovrebbe scomparire
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Forza il completamento di eventuali aggiornamenti asincroni
    await act(async () => {
      await null; // Forza un ciclo di render
    });

    expect(screen.queryByText('Attenzione')).not.toBeInTheDocument();
    expect(screen.getByText('Errore')).toBeInTheDocument(); // Questa rimane perché non ha autoClose
  });

  test('l\'integrazione con NotificationsService dovrebbe funzionare correttamente', async () => {
    render(
      <NotificationsProvider>
        <NotificationsServiceInitializer />
        <NotificationsList />
      </NotificationsProvider>
    );

    // Utilizziamo il service per mostrare una notifica di successo
    act(() => {
      NotificationsService.success('Operazione completata con successo');
    });

    // Forza il completamento di eventuali aggiornamenti asincroni
    await act(async () => {
      await null; // Forza un ciclo di render
    });

    // Verifichiamo che la notifica sia visibile
    expect(screen.getByText('Successo')).toBeInTheDocument();
    expect(screen.getByText('Operazione completata con successo')).toBeInTheDocument();

    // Utilizziamo il service per mostrare una notifica di errore
    act(() => {
      NotificationsService.error('Si è verificato un errore', 'Errore critico');
    });

    // Forza il completamento di eventuali aggiornamenti asincroni
    await act(async () => {
      await null; // Forza un ciclo di render
    });

    // Verifichiamo che la notifica di errore sia visibile
    expect(screen.getByText('Errore critico')).toBeInTheDocument();
    expect(screen.getByText('Si è verificato un errore')).toBeInTheDocument();

    // Utilizziamo il metodo alternativo per mostrare un avviso
    act(() => {
      NotificationsService.showWarning('Attenzione, operazione in corso', 'Avviso');
    });

    // Forza il completamento di eventuali aggiornamenti asincroni
    await act(async () => {
      await null; // Forza un ciclo di render
    });

    // Verifichiamo che la notifica di avviso sia visibile
    expect(screen.getByText('Avviso')).toBeInTheDocument();
    expect(screen.getByText('Attenzione, operazione in corso')).toBeInTheDocument();

    // Avanziamo il timer per far scomparire le notifiche con autoClose
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    // Forza il completamento di eventuali aggiornamenti asincroni
    await act(async () => {
      await null; // Forza un ciclo di render
    });

    // Le notifiche con autoClose dovrebbero essere scomparse, ma l'errore dovrebbe rimanere
    expect(screen.queryByText('Successo')).not.toBeInTheDocument();
    expect(screen.queryByText('Avviso')).not.toBeInTheDocument();
    expect(screen.getByText('Errore critico')).toBeInTheDocument();
  });
});
