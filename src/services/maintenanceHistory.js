import firestore from '@react-native-firebase/firestore';
import { logError } from './errorLogging';

/**
 * Maintenance History Service
 * Tracks when maintenance was performed on items
 */

// Add a maintenance completion record
export const addMaintenanceRecord = async (itemId, userId, notes = '') => {
  try {
    if (!itemId || !userId) {
      logError(new Error('Missing itemId or userId'), { itemId, userId });
      return { success: false, error: 'Missing required parameters' };
    }

    const record = {
      itemId,
      userId,
      completedAt: firestore.FieldValue.serverTimestamp(),
      notes: notes.trim(),
      createdAt: firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await firestore().collection('maintenanceHistory').add(record);

    // Also increment the maintenance count on the item
    try {
      await firestore()
        .collection('items')
        .doc(itemId)
        .update({
          maintenanceCount: firestore.FieldValue.increment(1),
        });
    } catch (updateError) {
      // Item update failed but history was recorded - non-critical
      logError(updateError, { context: 'incrementMaintenanceCount', itemId });
    }

    return { success: true, id: docRef.id };
  } catch (error) {
    logError(error, { context: 'addMaintenanceRecord', itemId, userId });
    return { success: false, error };
  }
};

// Get maintenance history for a specific item
export const getMaintenanceHistory = async (itemId) => {
  try {
    if (!itemId) {
      return { success: false, error: 'Missing itemId', history: [] };
    }

    // Query without orderBy to avoid requiring composite index
    // Sort in memory instead for better compatibility
    const snapshot = await firestore()
      .collection('maintenanceHistory')
      .where('itemId', '==', itemId)
      .get();

    const history = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      history.push({
        id: doc.id,
        ...data,
        completedAt: data.completedAt?.toDate() || new Date(),
      });
    });

    // Sort by completedAt descending (most recent first)
    history.sort((a, b) => b.completedAt - a.completedAt);

    return { success: true, history };
  } catch (error) {
    logError(error, { context: 'getMaintenanceHistory', itemId });
    return { success: false, error, history: [] };
  }
};

// Get recent maintenance across all user's items
export const getRecentMaintenance = async (userId, limit = 10) => {
  try {
    if (!userId) {
      return { success: false, error: 'Missing userId', history: [] };
    }

    // Query without orderBy to avoid requiring composite index
    const snapshot = await firestore()
      .collection('maintenanceHistory')
      .where('userId', '==', userId)
      .get();

    const history = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      history.push({
        id: doc.id,
        ...data,
        completedAt: data.completedAt?.toDate() || new Date(),
      });
    });

    // Sort by completedAt descending and apply limit
    history.sort((a, b) => b.completedAt - a.completedAt);
    const limitedHistory = history.slice(0, limit);

    return { success: true, history: limitedHistory };
  } catch (error) {
    logError(error, { context: 'getRecentMaintenance', userId });
    return { success: false, error, history: [] };
  }
};

// Delete all history for an item (when item is deleted)
export const deleteItemHistory = async (itemId) => {
  try {
    if (!itemId) {
      return { success: false, error: 'Missing itemId' };
    }

    const snapshot = await firestore()
      .collection('maintenanceHistory')
      .where('itemId', '==', itemId)
      .get();

    if (snapshot.empty) {
      return { success: true }; // No history to delete
    }

    const batch = firestore().batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    logError(error, { context: 'deleteItemHistory', itemId });
    return { success: false, error };
  }
};

// Calculate average days between maintenance for an item
export const calculateAverageFrequency = (history) => {
  if (history.length < 2) return null;

  let totalDays = 0;
  for (let i = 0; i < history.length - 1; i++) {
    const current = new Date(history[i].completedAt);
    const previous = new Date(history[i + 1].completedAt);
    const diffDays = Math.abs((current - previous) / (1000 * 60 * 60 * 24));
    totalDays += diffDays;
  }

  return Math.round(totalDays / (history.length - 1));
};

// Update notes for a maintenance history record
export const updateMaintenanceNote = async (recordId, notes) => {
  try {
    if (!recordId) {
      return { success: false, error: 'Missing recordId' };
    }

    await firestore()
      .collection('maintenanceHistory')
      .doc(recordId)
      .update({
        notes: notes.trim(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

    return { success: true };
  } catch (error) {
    logError(error, { context: 'updateMaintenanceNote', recordId });
    return { success: false, error };
  }
};
