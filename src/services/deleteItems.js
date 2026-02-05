import firestore from '@react-native-firebase/firestore';
import { cancelNotifications } from './notificationService';

const deleteItem = async (itemId) => {
  try {
    // Cancel scheduled notifications first
    await cancelNotifications(itemId);

    const itemRef = firestore().collection('items').doc(itemId);
    await itemRef.delete();
    return { success: true };
  } catch (e) {
    return { success: false, error: e };
  }
};

export default deleteItem;