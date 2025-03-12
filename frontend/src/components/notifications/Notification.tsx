import React from 'react';
import { Notification as NotificationType, NotificationType as NotifType } from '../../types/notifications';
import './Notification.css';

interface NotificationProps {
  notification: NotificationType;
  onClose: (id: string) => void;
}

/**
 * Componente per visualizzare una singola notifica
 */
const Notification: React.FC<NotificationProps> = ({ notification, onClose }) => {
  const { id, type, title, message, details } = notification;

  // Funzione per ottenere l'icona in base al tipo di notifica
  const getIcon = () => {
    switch (type) {
      case NotifType.SUCCESS:
        return <i className="fas fa-check-circle"></i>;
      case NotifType.ERROR:
        return <i className="fas fa-times-circle"></i>;
      case NotifType.WARNING:
        return <i className="fas fa-exclamation-triangle"></i>;
      case NotifType.INFO:
        return <i className="fas fa-info-circle"></i>;
      default:
        return null;
    }
  };

  return (
    <div className={`notification notification-${type}`}>
      <div className="notification-icon">
        {getIcon()}
      </div>
      <div className="notification-content">
        {title && <h4 className="notification-title">{title}</h4>}
        <p className="notification-message">{message}</p>
        {details && (
          <details className="notification-details">
            <summary>Dettagli</summary>
            <pre>{typeof details === 'object' ? JSON.stringify(details, null, 2) : details}</pre>
          </details>
        )}
      </div>
      <button className="notification-close" onClick={() => onClose(id)}>
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
};

export default Notification;
