import { NotificationType, NotificationOptions } from '../types/notifications';

/**
 * Servizio singleton per la gestione delle notifiche
 * Deve essere inizializzato con setNotificationHandler prima dell'uso
 */
class NotificationsServiceClass {
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
      title: title || 'Successo',
      autoClose: true,
      duration: 5000,
      ...options
    });
  }

  /**
   * Metodo alternativo per mostrare una notifica di successo (per compatibilità)
   */
  showSuccess(message: string, title?: string, autoClose?: boolean, duration?: number): string | undefined {
    return this.success(message, title, { autoClose, duration });
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
   * Metodo alternativo per mostrare una notifica di errore (per compatibilità)
   */
  showError(message: string, details?: string, autoClose?: boolean, duration?: number): string | undefined {
    return this.error(message, 'Errore', { details, autoClose, duration });
  }

  /**
   * Mostra una notifica di avviso
   */
  warning(message: string, title?: string, options?: Partial<NotificationOptions>): string | undefined {
    return this.notify({
      type: NotificationType.WARNING,
      message,
      title: title || 'Avviso',
      autoClose: true,
      duration: 7000,
      ...options
    });
  }

  /**
   * Metodo alternativo per mostrare una notifica di avviso (per compatibilità)
   */
  showWarning(message: string, title?: string, autoClose?: boolean, duration?: number): string | undefined {
    return this.warning(message, title, { autoClose, duration });
  }

  /**
   * Mostra una notifica informativa
   */
  info(message: string, title?: string, options?: Partial<NotificationOptions>): string | undefined {
    return this.notify({
      type: NotificationType.INFO,
      message,
      title: title || 'Info',
      autoClose: true,
      duration: 5000,
      ...options
    });
  }

  /**
   * Metodo alternativo per mostrare una notifica informativa (per compatibilità)
   */
  showInfo(message: string, title?: string, autoClose?: boolean, duration?: number): string | undefined {
    return this.info(message, title, { autoClose, duration });
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
export const NotificationsService = new NotificationsServiceClass();
