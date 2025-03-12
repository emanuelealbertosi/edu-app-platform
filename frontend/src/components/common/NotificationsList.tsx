import React from 'react';
import { useNotifications } from '../../contexts/NotificationsContext';
import './NotificationsList.css';

export const NotificationsList: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="notifications-container">
      {notifications.map(notification => (
        <div 
          key={notification.id} 
          className={`notification notification-${notification.type}`}
          role="alert"
        >
          <div className="notification-header">
            <h4 className="notification-title">{notification.title || notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}</h4>
            <button 
              className="notification-close"
              onClick={() => removeNotification(notification.id)}
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
          <div className="notification-body">
            <p className="notification-message">{notification.message}</p>
            {notification.details && (
              <div className="notification-details">
                <p>{notification.details}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
