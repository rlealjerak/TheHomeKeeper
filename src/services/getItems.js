import firestore from '@react-native-firebase/firestore';

async function getItems(uid) {
    try { 
        const querySnapshot = await firestore()
        .collection('items')
        .where('uid' , '==', uid)
        .get();

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

