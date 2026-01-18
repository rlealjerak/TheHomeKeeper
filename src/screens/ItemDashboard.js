import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import deleteItems from '../services/deleteItems';
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import { SafeAreaView } from 'react-native-safe-area-context';

const ItemDashboard = () => {
  const [uid, setUid] = useState(null);
  const [items, setItems] = useState([]);
  const navigation = useNavigation();

  // Get current user UID
  useEffect(() => {
    const user = auth().currentUser;
    if (user) setUid(user.uid);
  }, []);

  // Real-time listener for user items
  useEffect(() => {
    if (!uid) return;

    const unsubscribe = firestore()
      .collection('items')
      .where('uid', '==', uid)
      .onSnapshot(snapshot => {
        const userItems = [];
        snapshot.forEach(doc => userItems.push({ id: doc.id, ...doc.data() }));
        setItems(userItems); 
      }, error => {
        console.error('Error fetching items in real-time:', error);
      });

    return unsubscribe; 
  }, [uid]);

  // Delete item
  const handleDeleteItem = (item) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete ${item.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
            await deleteItems(item.id); // delete from firestore
          } 
        },
      ]
    );
  };

  // Edit item
  const handleEditItem = (item) => {
    navigation.navigate('AddItem', { item }); // pass item to prefill form

  };

  const nextMaintenanceItem = items.reduce((next, item) => {
    const itemDate = new Date(item.lastMaintenanceDate);
    if (!next) return item;
    const nextDate = new Date(next.lastMaintenanceDate);
    return itemDate < nextDate ? item : next;
  }, null);


  // Currently Implementing safe area view for better UI on different devices
  return (
    <SafeAreaView style={styles.container}>
      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryText}>Total items: {items.length}</Text>
        {nextMaintenanceItem && (
          <Text style={styles.summaryText}>
            Next maintenance: {nextMaintenanceItem.name} –{' '}
            {dayjs(nextMaintenanceItem.lastMaintenanceDate).format('YYYY-MM-DD')}
          </Text>
        )}
      </View>

      {/* Item list */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text>Last: {dayjs(item.lastMaintenanceDate).format('YYYY-MM-DD')}</Text>
                <Text>Frequency: {item.frequency} days</Text>
                {item.notes ? <Text>Notes: {item.notes}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => showItemMenu(item)}>
                <Text style={styles.threeDots}>⋮</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Add Item button */}
      <TouchableOpacity 
        style={styles.addButton} 
        onPress={() => navigation.navigate('AddItem')}
      >
        <Text style={styles.addButtonText}>+ Add Item</Text>
      </TouchableOpacity>
    </SafeAreaView>
  
  );

  // Menu for Edit/Delete
  function showItemMenu(item) {
    Alert.alert(
      item.name,
      'Select an action',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => handleEditItem(item) },
        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteItem(item) },
      ]
    );
  }
};

export default ItemDashboard;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  summaryCard: { padding: 12, backgroundColor: '#4CAF50', borderRadius: 8, marginBottom: 16 },
  summaryText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  itemCard: { padding: 12, backgroundColor: '#F5F5F5', borderRadius: 8, marginBottom: 12 },
  itemName: { fontSize: 16, fontWeight: 'bold' },
  threeDots: { fontSize: 24, paddingHorizontal: 8 },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 3,
  },
  addButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
