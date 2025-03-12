import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationsList } from '../../../src/components/common/NotificationsList';
import { NotificationsProvider, useNotifications } from '../../../src/contexts/NotificationsContext';
import { NotificationType } from '../../../src/types/notifications';

// Un componente wrapper per poter aggiungere notifiche durante il test
const TestWrapper = ({ children, initialNotifications = [] }) => {
  const { addNotification } = useNotifications();
  
  React.useEffect(() => {
    initialNotifications.forEach(notif => {
      addNotification(notif);
    });
  }, [addNotification, initialNotifications]);
  
  return children;
};

describe('NotificationsList', () => {
  test('non dovrebbe renderizzare nulla se non ci sono notifiche', () => {
    render(
      <NotificationsProvider>
        <NotificationsList />
      </NotificationsProvider>
    );
    
    // Non dovrebbero esserci elementi nel DOM con ruolo 'alert'
    const alerts = screen.queryAllByRole('alert');
    expect(alerts).toHaveLength(0);
  });
  
  test('dovrebbe renderizzare correttamente la lista di notifiche', () => {
    const initialNotifications = [
      {
        type: NotificationType.SUCCESS,
        message: 'Operazione completata con successo',
        title: 'Successo'
      },
      {
        type: NotificationType.ERROR,
        message: 'Si è verificato un errore',
        title: 'Errore'
      }
    ];
    
    render(
      <NotificationsProvider>
        <TestWrapper initialNotifications={initialNotifications}>
          <NotificationsList />
        </TestWrapper>
      </NotificationsProvider>
    );
    
    // Dovrebbero esserci due notifiche
    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(2);
    
    // Verifica il contenuto delle notifiche
    expect(screen.getByText('Successo')).toBeInTheDocument();
    expect(screen.getByText('Operazione completata con successo')).toBeInTheDocument();
    expect(screen.getByText('Errore')).toBeInTheDocument();
    expect(screen.getByText('Si è verificato un errore')).toBeInTheDocument();
  });
  
  test('dovrebbe rimuovere una notifica quando si clicca sul pulsante di chiusura', () => {
    const initialNotifications = [
      {
        type: NotificationType.INFO,
        message: 'Informazione importante',
        title: 'Info'
      }
    ];
    
    render(
      <NotificationsProvider>
        <TestWrapper initialNotifications={initialNotifications}>
          <NotificationsList />
        </TestWrapper>
      </NotificationsProvider>
    );
    
    // Verifica che ci sia una notifica
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    
    // Clicca sul pulsante di chiusura (carattere ×)
    const closeButton = screen.getByLabelText('Close notification');
    fireEvent.click(closeButton);
    
    // Verifica che la notifica sia stata rimossa
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
  });
  
  test('dovrebbe visualizzare i dettagli se presenti', () => {
    const initialNotifications = [
      {
        type: NotificationType.WARNING,
        message: 'Attenzione',
        title: 'Avviso',
        details: 'Questi sono dettagli aggiuntivi importanti'
      }
    ];
    
    render(
      <NotificationsProvider>
        <TestWrapper initialNotifications={initialNotifications}>
          <NotificationsList />
        </TestWrapper>
      </NotificationsProvider>
    );
    
    // Verifica che ci siano i dettagli
    expect(screen.getByText('Questi sono dettagli aggiuntivi importanti')).toBeInTheDocument();
  });
  
  test('dovrebbe applicare le classi CSS corrette per i diversi tipi di notifica', () => {
    const initialNotifications = [
      {
        type: NotificationType.SUCCESS,
        message: 'Successo',
        title: 'Operazione riuscita'
      },
      {
        type: NotificationType.ERROR,
        message: 'Errore',
        title: 'Operazione fallita'
      },
      {
        type: NotificationType.WARNING,
        message: 'Avviso',
        title: 'Attenzione'
      },
      {
        type: NotificationType.INFO,
        message: 'Informazione',
        title: 'Info'
      }
    ];
    
    render(
      <NotificationsProvider>
        <TestWrapper initialNotifications={initialNotifications}>
          <NotificationsList />
        </TestWrapper>
      </NotificationsProvider>
    );
    
    // Verifica che vengano applicate le classi CSS corrette
    const successAlert = screen.getByText('Operazione riuscita').closest('.notification');
    const errorAlert = screen.getByText('Operazione fallita').closest('.notification');
    const warningAlert = screen.getByText('Attenzione').closest('.notification');
    const infoAlert = screen.getByText('Info').closest('.notification');
    
    expect(successAlert).toHaveClass('notification');
    expect(successAlert).toHaveClass('notification-success');
    
    expect(errorAlert).toHaveClass('notification');
    expect(errorAlert).toHaveClass('notification-error');
    
    expect(warningAlert).toHaveClass('notification');
    expect(warningAlert).toHaveClass('notification-warning');
    
    expect(infoAlert).toHaveClass('notification');
    expect(infoAlert).toHaveClass('notification-info');
  });
});
