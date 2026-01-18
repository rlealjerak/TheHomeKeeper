import firestore from '@react-native-firebase/firestore';

async function addItem(uid, name, notes, lastMaintenanceDate, frequency) {
  const docRef = await firestore().collection('items').add({
    uid,
    name,
    notes: notes || '',
    lastMaintenanceDate: lastMaintenanceDate ?? null, // store as JS Date
    frequency: Number(frequency),
    createdAt: firestore.FieldValue.serverTimestamp(),
  });

  return docRef.id;
}

export default addItem;
