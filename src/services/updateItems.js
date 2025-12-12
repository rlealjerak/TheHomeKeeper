import firestore from '@react-native-firebase/firestore';

const updateItems = async (itemId, updatedData) => {
  try {
    const itemRef = firestore().collection('items').doc(itemId);
    await itemRef.update(updatedData);
    console.log('Item updated successfully');
  } catch (e) {
    console.error('Error updating item:', e);
  }
};
export default updateItems;