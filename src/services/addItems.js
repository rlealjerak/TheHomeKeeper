import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getApp } from 'firebase/app';

const db = getFirestore(getApp());

async function addItem(uid, name, notes, maintenanceDate, frequency) {
    try { 
        const docRef = await addDoc(collection(db, 'items'), {
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