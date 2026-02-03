# Push Notifications Implementation Guide

## Overview
TheHomeKeeper now includes local push notifications to remind users about upcoming maintenance tasks. Notifications are scheduled at three intervals:
- **7 days before** maintenance is due
- **1 day before** maintenance is due
- **Day of** maintenance

## Technology Stack
- **@notifee/react-native** v9.1.8 - Local notification library for React Native
- **AsyncStorage** - For storing notification preferences
- **Firebase Firestore** - Stores item data with maintenance schedules

## Architecture

### Notification Service (`src/services/notificationService.js`)
Central service managing all notification operations:

#### Functions:
1. **`requestNotificationPermission()`**
   - Requests user permission for notifications
   - Returns: `boolean` (true if authorized)

2. **`scheduleMaintenanceNotifications(item)`**
   - Schedules 3 notifications for an item (7 days, 1 day, day of)
   - Parameters: `{ id, name, lastMaintenanceDate, frequency }`
   - Returns: `{ success: boolean }`

3. **`cancelNotifications(itemId)`**
   - Cancels all notifications for a specific item
   - Called when item is deleted
   - Returns: `{ success: boolean }`

4. **`updateNotifications(item)`**
   - Cancels old notifications and reschedules new ones
   - Called when item is updated
   - Returns: `{ success: boolean }`

5. **`cancelAllNotifications()`**
   - Cancels all scheduled notifications
   - Called when user disables notifications in settings
   - Returns: `{ success: boolean }`

6. **`getScheduledNotifications()`**
   - Returns list of all scheduled notifications
   - Useful for debugging
   - Returns: `array` of notification objects

### Integration Points

#### 1. AddItem Screen (`src/screens/AddItem.js`)
- Checks notification preference from AsyncStorage
- Requests permission when adding/editing items
- Schedules notifications for new items
- Updates notifications for edited items

**Flow:**
```javascript
// Check if notifications are enabled
const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');

if (notificationsEnabled !== 'false') {
  const hasPermission = await requestNotificationPermission();

  if (hasPermission && result.id) {
    await scheduleMaintenanceNotifications({
      id: result.id,
      name,
      lastMaintenanceDate,
      frequency: Number(frequency),
    });
  }
}
```

#### 2. Delete Service (`src/services/deleteItems.js`)
- Cancels notifications before deleting item from Firestore

**Flow:**
```javascript
// Cancel notifications first
await cancelNotifications(itemId);

// Then delete from Firestore
await firestore().collection('items').doc(itemId).delete();
```

#### 3. Settings Screen (`src/screens/Settings.js`)
- Displays notification toggle switch
- Loads preference from AsyncStorage on mount
- Handles enabling/disabling notifications
- Requests permission when enabling
- Cancels all notifications when disabling

**Features:**
- Switch component for toggle
- Shows description: "Get notified before items need maintenance"
- Persists preference to AsyncStorage
- Shows alert if permission denied

#### 4. App.tsx
- Sets up notification event listeners
- Handles foreground notification taps
- Handles background/quit state notification taps

**Event Handlers:**
```javascript
// Foreground events
notifee.onForegroundEvent(({ type, detail }) => {
  if (type === EventType.PRESS) {
    // User tapped notification while app is open
  }
});

// Background events
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    // User tapped notification from background
  }
});
```

## Notification Format

### 7 Days Before
- **ID**: `{itemId}-7days`
- **Title**: "Maintenance Due Soon"
- **Body**: "{itemName} needs maintenance in 7 days"

### 1 Day Before
- **ID**: `{itemId}-1day`
- **Title**: "Maintenance Due Tomorrow"
- **Body**: "{itemName} needs maintenance tomorrow"

### Day Of
- **ID**: `{itemId}-today`
- **Title**: "Maintenance Due Today!"
- **Body**: "{itemName} needs maintenance today"

### Notification Data
Each notification includes:
```javascript
{
  data: {
    itemId: 'abc123',
    itemName: 'Air Filter'
  }
}
```

## Platform Configuration

### Android
- **Permission**: `POST_NOTIFICATIONS` added to `AndroidManifest.xml`
- **Channel**: "maintenance-reminders" with HIGH importance
- **Icon**: Uses `ic_launcher` (app icon)
- **Sound**: Default notification sound

### iOS
- **Permission**: Requested at runtime via `requestNotificationPermission()`
- **Sound**: Default notification sound
- **Badge**: Not currently implemented
- **Critical Alerts**: Not currently implemented

## User Flow

### First Time Using App
1. User adds first item
2. App checks AsyncStorage for `notificationsEnabled` (defaults to `true`)
3. App requests notification permission
4. If granted: Schedules 3 notifications for the item
5. If denied: Shows alert, continues without notifications

### Managing Notifications
1. User navigates to Settings screen
2. Sees "Maintenance Reminders" toggle (ON by default)
3. Toggling OFF:
   - Cancels all scheduled notifications
   - Saves preference to AsyncStorage
4. Toggling ON:
   - Requests permission
   - Saves preference to AsyncStorage
   - Future items will have notifications scheduled

### Editing Items
1. User edits an item's maintenance schedule
2. App checks notification preference
3. If enabled: Cancels old notifications, schedules new ones with updated dates

### Deleting Items
1. User deletes an item
2. Service automatically cancels all 3 notifications for that item
3. Item is removed from Firestore

## Edge Cases Handled

### Past Due Notifications
- Only schedules notifications for future dates
- If next maintenance is in 3 days, only schedules "1 day" and "day of" notifications
- If next maintenance is today, only schedules "day of" notification

### Permission Denied
- Shows helpful alert: "Please enable notifications in your device settings..."
- App continues to function normally
- User can enable in Settings app later

### Notifications Disabled in Settings
- AddItem/EditItem screens respect the preference
- No notification scheduling occurs
- No permission requests

### App Uninstalled/Reinstalled
- AsyncStorage cleared
- Notifications default to enabled
- User will be prompted for permission again

## Testing Notifications

### Manual Testing
1. Add an item with frequency = 7 days
2. Set last maintenance date = today
3. Check scheduled notifications:
   ```javascript
   import { getScheduledNotifications } from './src/services/notificationService';
   const scheduled = await getScheduledNotifications();
   console.log('Scheduled:', scheduled);
   ```

### Testing Different States
- **7 days before**: Set last maintenance to 7 days ago, frequency = 14 days
- **1 day before**: Set last maintenance to 6 days ago, frequency = 7 days
- **Day of**: Set last maintenance to 7 days ago, frequency = 7 days

### Testing Permission Flow
1. Deny permission initially
2. Check that app continues normally
3. Enable in Settings
4. Verify permission request appears again
5. Grant permission
6. Add item and verify notifications scheduled

## Future Enhancements

### Deep Linking
- Tapping notification could navigate to specific item detail screen
- Requires navigation ref setup in App.tsx
- Would use notification data.itemId

### Custom Notification Times
- Allow users to choose when to receive notifications
- E.g., "7am every day" for day-of reminders
- Would require time picker in Settings

### Notification Categories (iOS)
- Quick actions: "Mark Complete", "Snooze", "View Item"
- Would require action handlers in App.tsx

### Badge Count
- Show count of overdue items on app icon
- Update badge when notifications are shown
- Clear badge when items are completed

### Sound Customization
- Allow users to choose notification sound
- Custom sound files in native projects

### Quiet Hours
- Don't send notifications during user-defined hours
- E.g., "No notifications between 10pm - 7am"

## Troubleshooting

### Notifications Not Appearing
1. Check AsyncStorage value: `await AsyncStorage.getItem('notificationsEnabled')`
2. Check permission status: `await requestNotificationPermission()`
3. Check scheduled notifications: `await getScheduledNotifications()`
4. Verify Android: Settings > Apps > TheHomeKeeper > Notifications
5. Verify iOS: Settings > TheHomeKeeper > Notifications

### Permission Always Denied
- User may have permanently denied in system settings
- Guide user to: Settings > Apps > TheHomeKeeper > Permissions > Notifications

### Notifications Not Canceling
- Check that `cancelNotifications()` is being called
- Verify notification IDs match format: `{itemId}-7days`, etc.
- Check console logs for errors

### Build Errors
- Ensure `@notifee/react-native` is installed: `npm ls @notifee/react-native`
- Run pod install for iOS: `cd ios && pod install`
- Clean build: Android - `cd android && ./gradlew clean`

## Dependencies

```json
{
  "@notifee/react-native": "^9.1.8",
  "@react-native-async-storage/async-storage": "^2.1.0",
  "@react-native-firebase/firestore": "^21.7.2"
}
```

## File Changes Summary

### New Files
- `src/services/notificationService.js` - Core notification logic

### Modified Files
- `src/screens/AddItem.js` - Schedule/update notifications
- `src/screens/Settings.js` - Notification toggle UI
- `src/services/deleteItems.js` - Cancel notifications on delete
- `App.tsx` - Notification event handlers
- `android/app/src/main/AndroidManifest.xml` - POST_NOTIFICATIONS permission

## Conclusion

The notification system is fully integrated and production-ready. Users will automatically receive timely reminders about their home maintenance tasks, with full control over notification preferences in the Settings screen.
