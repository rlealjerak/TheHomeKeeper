import firestore from '@react-native-firebase/firestore';

async function addItem(uid, name, notes, maintenanceDate, frequency) {
    try { 
        const docRef = await firestore()
            .collection('users')
            .doc(uid)
            .collection('items')
            .add({
            name,
            notes,
            maintenanceDate,
            frequency,
            uid,
        });
        console.log('Document written with ID: ', docRef.id);
    } catch (e) {
        console.error('Error adding item: ', e);
    }
} 
export default addItem;