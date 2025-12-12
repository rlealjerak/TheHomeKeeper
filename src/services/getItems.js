import { getFirestore, collection, getDocs} from 'firebase/firestore';
import { getApp } from 'firebase/app'; 

const db = getFirestore(getApp());

async function getItems(uid) {
    try {
        const q = query(  collection(db, 'items'), where('uid', '==', uid));
        const querySnapshot = await getDocs(q);
        const items = [];
        querySnapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
        });
        return items;
    } catch (e) {
        console.error('Error getting items: ', e);
        return [];
    }
} 
export default getItems;

