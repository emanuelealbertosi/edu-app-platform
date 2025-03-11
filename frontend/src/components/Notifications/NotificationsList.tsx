import React from 'react';
import { useNotifications } from '../../contexts/NotificationsContext';
import Notification from './Notification';
import './NotificationsList.css';

/**
 * Componente per visualizzare la lista di tutte le notifiche attive
 */
const NotificationsList: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  // Se non ci sono notifiche, non renderizzare nulla
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="notifications-container">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          onClose={removeNotification}
        />
      ))}
    </div>
  );
};

export default NotificationsList;
