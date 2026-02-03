import firestore from '@react-native-firebase/firestore';

// Adds a new item to Firestore
async function addItem(uid, name, category, notes, lastMaintenanceDate, frequency) {
  try {
    const docRef = await firestore().collection('items').add({
      uid,
      name,
      category: category || 'other',
      notes: notes || '',
      lastMaintenanceDate: lastMaintenanceDate ?? null, // store as JS Date
      frequency: Number(frequency),
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding item:', error);
    return { success: false, error };
  }
}

export default addItem;
