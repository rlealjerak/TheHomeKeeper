import firestore from '@react-native-firebase/firestore';

const deleteItem = async (itemId) => {
  try {
    const itemRef = firestore().collection('items').doc(itemId);
    await itemRef.delete();
    console.log('Item deleted successfully');
  } catch (e) {
    console.error('Error deleting item:', e);
  }
};

export default deleteItem;