/**
 * Tipologie di notifiche supportate
 */
export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/**
 * Interfaccia per una notifica
 */
export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
  details?: any;
  autoClose?: boolean;
  duration?: number; // millisecondi
  createdAt: Date;
}

/**
 * Interfaccia per la creazione di una notifica
 */
export interface NotificationOptions {
  type: NotificationType;
  message: string;
  title?: string;
  details?: any; 
  autoClose?: boolean; // Se true, la notifica si chiuderà automaticamente dopo duration ms
  duration?: number; // Durata in millisecondi prima della chiusura automatica
}
