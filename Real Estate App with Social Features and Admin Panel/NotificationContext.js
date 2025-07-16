import React, { createContext, useContext, useState, useEffect } from 'react';
import PushNotification from 'react-native-push-notification';
import { Platform, Alert } from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { notificationService } from '../services/notificationService';

// Create context
const NotificationContext = createContext();

// Provider component
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushToken, setPushToken] = useState(null);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);

  useEffect(() => {
    initializeNotifications();
    return () => {
      // Cleanup
      PushNotification.unregister();
    };
  }, []);

  const initializeNotifications = async () => {
    try {
      // Request notification permissions
      await requestNotificationPermission();
      
      // Configure push notifications
      configurePushNotifications();
      
      // Load existing notifications
      await loadNotifications();
    } catch (error) {
      console.error('Notification initialization error:', error);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      let permission;
      
      if (Platform.OS === 'ios') {
        permission = await request(PERMISSIONS.IOS.NOTIFICATIONS);
      } else {
        permission = await request(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
      }
      
      const granted = permission === RESULTS.GRANTED;
      setIsPermissionGranted(granted);
      
      if (!granted) {
        Alert.alert(
          'Notification Permission',
          'Please enable notifications to receive updates about your real estate activities.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => {/* Open settings */} },
          ]
        );
      }
      
      return granted;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  };

  const configurePushNotifications = () => {
    PushNotification.configure({
      // Called when token is generated
      onRegister: function (token) {
        console.log('Push token:', token);
        setPushToken(token.token);
        // Send token to backend
        notificationService.registerPushToken(token.token);
      },

      // Called when a remote notification is received
      onNotification: function (notification) {
        console.log('Notification received:', notification);
        
        if (notification.userInteraction) {
          // User tapped on notification
          handleNotificationTap(notification);
        } else {
          // Notification received while app is in foreground
          addNotification({
            id: Date.now().toString(),
            title: notification.title,
            message: notification.message,
            data: notification.data,
            timestamp: new Date().toISOString(),
            read: false,
          });
        }
      },

      // Called when a remote notification is opened
      onAction: function (notification) {
        console.log('Notification action:', notification);
      },

      // Called when registration fails
      onRegistrationError: function (err) {
        console.error('Push notification registration error:', err);
      },

      // IOS only
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      // Should the initial notification be popped automatically
      popInitialNotification: true,

      // Request permissions on app start
      requestPermissions: Platform.OS === 'ios',
    });
  };

  const loadNotifications = async () => {
    try {
      const response = await notificationService.getNotifications();
      if (response.success) {
        setNotifications(response.notifications);
        const unread = response.notifications.filter(n => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Load notifications error:', error);
    }
  };

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await notificationService.markAsRead(notificationId);
      if (response.success) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await notificationService.markAllAsRead();
      if (response.success) {
        setNotifications(prev =>
          prev.map(notification => ({ ...notification, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await notificationService.deleteNotification(notificationId);
      if (response.success) {
        const notification = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (notification && !notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Delete notification error:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const response = await notificationService.clearAllNotifications();
      if (response.success) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Clear all notifications error:', error);
    }
  };

  const handleNotificationTap = (notification) => {
    // Handle navigation based on notification type
    const { data } = notification;
    
    switch (data?.type) {
      case 'new_follower':
        // Navigate to profile
        break;
      case 'post_like':
        // Navigate to post
        break;
      case 'post_comment':
        // Navigate to post comments
        break;
      case 'new_message':
        // Navigate to chat
        break;
      default:
        // Navigate to notifications screen
        break;
    }
  };

  const sendLocalNotification = (title, message, data = {}) => {
    PushNotification.localNotification({
      title,
      message,
      data,
      playSound: true,
      soundName: 'default',
      vibrate: true,
    });
  };

  const scheduleNotification = (title, message, date, data = {}) => {
    PushNotification.localNotificationSchedule({
      title,
      message,
      date,
      data,
      playSound: true,
      soundName: 'default',
      vibrate: true,
    });
  };

  const cancelAllLocalNotifications = () => {
    PushNotification.cancelAllLocalNotifications();
  };

  const value = {
    notifications,
    unreadCount,
    pushToken,
    isPermissionGranted,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    sendLocalNotification,
    scheduleNotification,
    cancelAllLocalNotifications,
    requestNotificationPermission,
    loadNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook to use notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;

