import firestore from '@react-native-firebase/firestore';

async function addItem(
  uid,
  name,
  notes,
  lastMaintenanceDate,
  frequency
) {
  try {
    let firestoreLastMaintenanceDate = null;

    if (lastMaintenanceDate) {
      firestoreLastMaintenanceDate =
        firestore.Timestamp.fromDate(lastMaintenanceDate);
    }

    await firestore()
      .collection('users')
      .doc(uid)
      .collection('items')
      .add({
        uid,
        name,
        notes: notes || '',
        lastMaintenanceDate: firestoreLastMaintenanceDate,
        frequency: Number(frequency),
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

  } catch (e) {
    console.error('Error adding item:', e.code, e.message);
    throw e;
  }
}

export default addItem;
