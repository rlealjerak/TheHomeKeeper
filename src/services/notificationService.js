import notifee, { AndroidImportance, TriggerType } from '@notifee/react-native';
import dayjs from 'dayjs';

// Request notification permission from user
export const requestNotificationPermission = async () => {
  try {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus >= 1; // 1 = authorized, 2 = provisional
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Create notification channel for Android
const createChannel = async () => {
  try {
    await notifee.createChannel({
      id: 'maintenance-reminders',
      name: 'Maintenance Reminders',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });
  } catch (error) {
    console.error('Error creating notification channel:', error);
  }
};

// Schedule maintenance notifications for an item
export const scheduleMaintenanceNotifications = async (item) => {
  try {
    // Ensure channel exists (Android)
    await createChannel();

    // Calculate next maintenance date
    const lastMaintenance = dayjs(item.lastMaintenanceDate);
    const nextMaintenance = lastMaintenance.add(item.frequency, 'day');

    // Calculate notification dates
    const sevenDaysBefore = nextMaintenance.subtract(7, 'day');
    const oneDayBefore = nextMaintenance.subtract(1, 'day');
    const dayOf = nextMaintenance;

    const now = dayjs();

    // Schedule 7 days before notification
    if (sevenDaysBefore.isAfter(now)) {
      await notifee.createTriggerNotification(
        {
          id: `${item.id}-7days`,
          title: 'Maintenance Due Soon',
          body: `${item.name} needs maintenance in 7 days`,
          data: { itemId: item.id, itemName: item.name },
          android: {
            channelId: 'maintenance-reminders',
            smallIcon: 'ic_launcher',
            pressAction: { id: 'default' },
          },
          ios: {
            sound: 'default',
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: sevenDaysBefore.valueOf(),
        }
      );
    }

    // Schedule 1 day before notification
    if (oneDayBefore.isAfter(now)) {
      await notifee.createTriggerNotification(
        {
          id: `${item.id}-1day`,
          title: 'Maintenance Due Tomorrow',
          body: `${item.name} needs maintenance tomorrow`,
          data: { itemId: item.id, itemName: item.name },
          android: {
            channelId: 'maintenance-reminders',
            smallIcon: 'ic_launcher',
            pressAction: { id: 'default' },
          },
          ios: {
            sound: 'default',
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: oneDayBefore.valueOf(),
        }
      );
    }

    // Schedule day of notification
    if (dayOf.isAfter(now)) {
      await notifee.createTriggerNotification(
        {
          id: `${item.id}-today`,
          title: 'Maintenance Due Today!',
          body: `${item.name} needs maintenance today`,
          data: { itemId: item.id, itemName: item.name },
          android: {
            channelId: 'maintenance-reminders',
            smallIcon: 'ic_launcher',
            pressAction: { id: 'default' },
          },
          ios: {
            sound: 'default',
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: dayOf.valueOf(),
        }
      );
    }

    return { success: true };
  } catch (error) {
    console.error('Error scheduling notifications:', error);
    return { success: false, error };
  }
};

// Cancel all notifications for an item
export const cancelNotifications = async (itemId) => {
  try {
    await notifee.cancelNotification(`${itemId}-7days`);
    await notifee.cancelNotification(`${itemId}-1day`);
    await notifee.cancelNotification(`${itemId}-today`);
    return { success: true };
  } catch (error) {
    console.error('Error canceling notifications:', error);
    return { success: false, error };
  }
};

// Update notifications (cancel old, schedule new)
export const updateNotifications = async (item) => {
  try {
    await cancelNotifications(item.id);
    await scheduleMaintenanceNotifications(item);
    return { success: true };
  } catch (error) {
    console.error('Error updating notifications:', error);
    return { success: false, error };
  }
};

// Get all scheduled notifications (for debugging)
export const getScheduledNotifications = async () => {
  try {
    const notifications = await notifee.getTriggerNotifications();
    return notifications;
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

// Cancel all notifications (for settings toggle)
export const cancelAllNotifications = async () => {
  try {
    await notifee.cancelAllNotifications();
    return { success: true };
  } catch (error) {
    console.error('Error canceling all notifications:', error);
    return { success: false, error };
  }
};
