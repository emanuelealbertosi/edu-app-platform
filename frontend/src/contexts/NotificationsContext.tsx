import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Notification, NotificationOptions, NotificationType } from '../types/notifications';
import { NotificationsService } from '../services/NotificationsService';

interface NotificationsContextType {
  notifications: Notification[];
  addNotification: (options: NotificationOptions) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications deve essere utilizzato all\'interno di un NotificationsProvider');
  }
  return context;
};

interface NotificationsProviderProps {
  children: ReactNode;
  maxNotifications?: number;
}

export const NotificationsProvider = ({ 
  children, 
  maxNotifications = 5 
}: NotificationsProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Aggiunge una nuova notifica
  const addNotification = useCallback((options: NotificationOptions): string => {
    const id = uuidv4();
    const newNotification: Notification = {
      id,
      type: options.type,
      message: options.message,
      title: options.title,
      details: options.details,
      autoClose: options.autoClose ?? true,
      duration: options.duration ?? 5000, // Default: 5 secondi
      createdAt: new Date()
    };

    setNotifications(prev => {
      // Rimuovi le notifiche in eccesso se superiamo il massimo
      const updatedNotifications = [newNotification, ...prev];
      return updatedNotifications.slice(0, maxNotifications);
    });

    // Rimuovi automaticamente la notifica dopo la durata specificata
    if (newNotification.autoClose) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, [maxNotifications]);

  // Rimuove una notifica specifica
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Rimuove tutte le notifiche
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications
  };

  // Inizializzazione del servizio di notifiche
  useEffect(() => {
    // Registra l'handler per le notifiche al servizio
    NotificationsService.setNotificationHandler(addNotification);
    console.log('NotificationsService inizializzato');
  }, [addNotification]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};
