import { NotificationsService } from '../../../src/services/NotificationsService';
import { NotificationType } from '../../../src/types/notifications';

describe('NotificationsService', () => {
  // Mock per l'handler delle notifiche
  let mockHandler;
  
  beforeEach(() => {
    // Crea un nuovo mock handler prima di ogni test
    mockHandler = jest.fn().mockImplementation((options) => {
      return 'notification-id-mock';
    });
    
    // Resetta e imposta l'handler per il servizio
    NotificationsService.setNotificationHandler(mockHandler);
    
    // Spia la console per i warning
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Pulizia delle spy dopo ogni test
    jest.restoreAllMocks();
  });
  
  test('dovrebbe mostrare una notifica di successo', () => {
    const id = NotificationsService.success('Test di successo');
    
    expect(id).toBe('notification-id-mock');
    expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
      type: NotificationType.SUCCESS,
      message: 'Test di successo',
      title: 'Successo',
      autoClose: true
    }));
  });
  
  test('dovrebbe mostrare una notifica di errore', () => {
    const id = NotificationsService.error('Test di errore');
    
    expect(id).toBe('notification-id-mock');
    expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
      type: NotificationType.ERROR,
      message: 'Test di errore',
      title: 'Errore',
      autoClose: false
    }));
  });
  
  test('dovrebbe mostrare una notifica di avviso', () => {
    const id = NotificationsService.warning('Test di avviso');
    
    expect(id).toBe('notification-id-mock');
    expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
      type: NotificationType.WARNING,
      message: 'Test di avviso',
      title: 'Avviso',
      autoClose: true
    }));
  });
  
  test('dovrebbe mostrare una notifica informativa', () => {
    const id = NotificationsService.info('Test informativo');
    
    expect(id).toBe('notification-id-mock');
    expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
      type: NotificationType.INFO,
      message: 'Test informativo',
      title: 'Info',
      autoClose: true
    }));
  });
  
  test('dovrebbe rispettare le opzioni personalizzate', () => {
    const id = NotificationsService.success('Test con opzioni', 'Titolo personalizzato', {
      autoClose: false,
      duration: 10000,
      details: 'Dettagli aggiuntivi'
    });
    
    expect(id).toBe('notification-id-mock');
    expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
      type: NotificationType.SUCCESS,
      message: 'Test con opzioni',
      title: 'Titolo personalizzato',
      autoClose: false,
      duration: 10000,
      details: 'Dettagli aggiuntivi'
    }));
  });
  
  test('dovrebbe avvisare se l\'handler non è impostato', () => {
    // Rimuovi l'handler per simulare un'inizializzazione mancante
    NotificationsService.setNotificationHandler(undefined);
    
    const id = NotificationsService.success('Test senza handler');
    
    expect(id).toBeUndefined();
    expect(console.warn).toHaveBeenCalledWith('NotificationsService: notificationHandler non impostato');
  });
  
  test('dovrebbe funzionare con i metodi alternativi', () => {
    NotificationsService.showSuccess('Test showSuccess');
    expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
      type: NotificationType.SUCCESS,
      message: 'Test showSuccess'
    }));
    
    NotificationsService.showError('Test showError', 'Dettagli errore');
    expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
      type: NotificationType.ERROR,
      message: 'Test showError',
      details: 'Dettagli errore'
    }));
    
    NotificationsService.showWarning('Test showWarning');
    expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
      type: NotificationType.WARNING,
      message: 'Test showWarning'
    }));
    
    NotificationsService.showInfo('Test showInfo');
    expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
      type: NotificationType.INFO,
      message: 'Test showInfo'
    }));
  });
});
