import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import { NotificationsProvider, useNotifications } from '../../../src/contexts/NotificationsContext';
import { NotificationType } from '../../../src/types/notifications';

// Componente di test che utilizza il hook useNotifications
const TestConsumer = ({ onMount = () => {} }) => {
  const { 
    notifications, 
    addNotification, 
    removeNotification,
    clearAllNotifications 
  } = useNotifications();
  
  React.useEffect(() => {
    onMount({ 
      notifications, 
      addNotification, 
      removeNotification,
      clearAllNotifications 
    });
  }, [onMount, notifications, addNotification, removeNotification, clearAllNotifications]);
  
  return (
    <div data-testid="test-consumer">
      <div data-testid="notifications-count">{notifications.length}</div>
      {notifications.map(notif => (
        <div key={notif.id} data-testid={`notification-${notif.id}`}>
          {notif.title}: {notif.message}
          <button 
            data-testid={`remove-${notif.id}`} 
            onClick={() => removeNotification(notif.id)}
          >
            Remove
          </button>
        </div>
      ))}
      <button 
        data-testid="clear-all" 
        onClick={clearAllNotifications}
      >
        Clear All
      </button>
    </div>
  );
};

describe('NotificationsContext', () => {
  test('dovrebbe generare un errore se useNotifications è usato fuori dal Provider', () => {
    // Silenzio gli errori nella console durante questo test
    const originalError = console.error;
    console.error = jest.fn();
    
    // Utilizzo di useNotifications fuori dal Provider dovrebbe generare un errore
    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useNotifications deve essere utilizzato all\'interno di un NotificationsProvider');
    
    // Ripristino console.error
    console.error = originalError;
  });
  
  test('dovrebbe aggiungere e rimuovere notifiche correttamente', async () => {
    let contextValues;
    const onMount = (values) => {
      contextValues = values;
    };
    
    render(
      <NotificationsProvider>
        <TestConsumer onMount={onMount} />
      </NotificationsProvider>
    );
    
    // Verifica che inizialmente non ci siano notifiche
    expect(screen.getByTestId('notifications-count').textContent).toBe('0');
    
    let notificationId;
    
    // Aggiungi una notifica
    act(() => {
      notificationId = contextValues.addNotification({
        type: NotificationType.SUCCESS,
        message: 'Test notifica',
        title: 'Test Titolo',
        autoClose: false // Disattiva la chiusura automatica per il test
      });
      
      // Salva l'ID per uso successivo
      contextValues.lastAddedId = notificationId;
    });
    
    // Verifica che la notifica sia stata aggiunta
    expect(screen.getByTestId('notifications-count').textContent).toBe('1');
    expect(contextValues.notifications).toHaveLength(1);
    expect(contextValues.notifications[0].message).toBe('Test notifica');
    
    // Ottieni un riferimento al pulsante di rimozione per la notifica
    const removeButton = screen.getByTestId(`remove-${notificationId}`);
    
    // Rimuovi la notifica utilizzando il pulsante invece di chiamare direttamente removeNotification
    act(() => {
      fireEvent.click(removeButton);
    });
    
    // Verifica che la notifica sia stata rimossa
    await waitFor(() => {
      expect(contextValues.notifications).toHaveLength(0);
      expect(screen.queryByTestId('notifications-count').textContent).toBe('0');
    }, { timeout: 1000 });
  });
  
  test('dovrebbe rimuovere automaticamente le notifiche con autoClose', async () => {
    jest.useFakeTimers();
    
    let contextValues;
    const onMount = (values) => {
      contextValues = values;
    };
    
    render(
      <NotificationsProvider>
        <TestConsumer onMount={onMount} />
      </NotificationsProvider>
    );
    
    // Aggiungi una notifica con autoClose a 500ms
    act(() => {
      contextValues.addNotification({
        type: NotificationType.INFO,
        message: 'Notifica auto-close',
        autoClose: true,
        duration: 500
      });
    });
    
    // Verifica che la notifica sia stata aggiunta
    expect(screen.getByTestId('notifications-count').textContent).toBe('1');
    
    // Avanza il timer di 600ms
    act(() => {
      jest.advanceTimersByTime(600);
    });
    
    // Verifica che la notifica sia stata rimossa automaticamente
    await waitFor(() => {
      expect(contextValues.notifications).toHaveLength(0);
      expect(screen.queryByTestId('notifications-count').textContent).toBe('0');
    });
    
    jest.useRealTimers();
  });
  
  test('dovrebbe rispettare il limite massimo di notifiche', () => {
    let contextValues;
    const onMount = (values) => {
      contextValues = values;
    };
    
    // Imposta un massimo di 3 notifiche
    render(
      <NotificationsProvider maxNotifications={3}>
        <TestConsumer onMount={onMount} />
      </NotificationsProvider>
    );
    
    // Aggiungi 5 notifiche
    act(() => {
      for (let i = 1; i <= 5; i++) {
        contextValues.addNotification({
          type: NotificationType.INFO,
          message: `Notifica ${i}`,
          autoClose: false
        });
      }
    });
    
    // Verifica che ci siano solo 3 notifiche (le ultime 3 aggiunte)
    expect(contextValues.notifications).toHaveLength(3);
    expect(screen.queryByTestId('notifications-count').textContent).toBe('3');
    expect(contextValues.notifications[0].message).toBe('Notifica 5');
    expect(contextValues.notifications[1].message).toBe('Notifica 4');
    expect(contextValues.notifications[2].message).toBe('Notifica 3');
  });
  
  test('dovrebbe pulire tutte le notifiche', () => {
    let contextValues;
    const onMount = (values) => {
      contextValues = values;
    };
    
    render(
      <NotificationsProvider>
        <TestConsumer onMount={onMount} />
      </NotificationsProvider>
    );
    
    // Aggiungi 3 notifiche
    act(() => {
      for (let i = 1; i <= 3; i++) {
        contextValues.addNotification({
          type: NotificationType.INFO,
          message: `Notifica ${i}`,
          autoClose: false
        });
      }
    });
    
    // Verifica che ci siano 3 notifiche
    expect(contextValues.notifications).toHaveLength(3);
    expect(screen.queryByTestId('notifications-count').textContent).toBe('3');
    
    // Pulisci tutte le notifiche
    act(() => {
      contextValues.clearAllNotifications();
    });
    
    // Verifica che non ci siano più notifiche
    expect(contextValues.notifications).toHaveLength(0);
    expect(screen.queryByTestId('notifications-count').textContent).toBe('0');
  });
});
