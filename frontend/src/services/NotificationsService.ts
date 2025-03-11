import { NotificationType, NotificationOptions } from '../types/notifications';

/**
 * Servizio singleton per la gestione delle notifiche
 * Deve essere inizializzato con setNotificationHandler prima dell'uso
 */
class NotificationsService {
  private notificationHandler?: (options: NotificationOptions) => string;

  /**
   * Imposta l'handler delle notifiche dal NotificationsContext
   */
  setNotificationHandler(handler: (options: NotificationOptions) => string): void {
    this.notificationHandler = handler;
  }

  /**
   * Mostra una notifica di successo
   */
  success(message: string, title?: string, options?: Partial<NotificationOptions>): string | undefined {
    return this.notify({
      type: NotificationType.SUCCESS,
      message,
      title: title || 'Operazione completata',
      autoClose: true,
      duration: 5000,
      ...options
    });
  }

  /**
   * Mostra una notifica di errore
   */
  error(message: string, title?: string, options?: Partial<NotificationOptions>): string | undefined {
    return this.notify({
      type: NotificationType.ERROR,
      message,
      title: title || 'Errore',
      autoClose: options?.autoClose ?? false, // Gli errori non si chiudono automaticamente di default
      duration: 10000,
      ...options
    });
  }

  /**
   * Mostra una notifica di avviso
   */
  warning(message: string, title?: string, options?: Partial<NotificationOptions>): string | undefined {
    return this.notify({
      type: NotificationType.WARNING,
      message,
      title: title || 'Attenzione',
      autoClose: true,
      duration: 7000,
      ...options
    });
  }

  /**
   * Mostra una notifica informativa
   */
  info(message: string, title?: string, options?: Partial<NotificationOptions>): string | undefined {
    return this.notify({
      type: NotificationType.INFO,
      message,
      title: title || 'Informazione',
      autoClose: true,
      duration: 5000,
      ...options
    });
  }

  /**
   * Metodo interno per creare una notifica
   */
  private notify(options: NotificationOptions): string | undefined {
    if (!this.notificationHandler) {
      console.warn('NotificationsService: notificationHandler non impostato');
      return undefined;
    }
    return this.notificationHandler(options);
  }
}

// Esporta un'istanza singola del servizio
export default new NotificationsService();
