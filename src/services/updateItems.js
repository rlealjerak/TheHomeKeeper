import firestore from '@react-native-firebase/firestore';

const updateItems = async (itemId, updatedData) => {
  try {
    const itemRef = firestore().collection('items').doc(itemId);
    await itemRef.update(updatedData);
    return { success: true };
  } catch (e) {
    return { success: false, error: e };
  }
};
export default updateItems;