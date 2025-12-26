import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import auth from '@react-native-firebase/auth';
import addItem from '../services/addItems';
import getItems from '../services/getItems';
import updateItems from '../services/updateItems';
import deleteItems from '../services/deleteItems';
import dayjs from 'dayjs';
import DatePicker from 'react-native-ui-datepicker';

const ItemManagementScreen = () => {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [lastMaintenanceDate, setLastMaintenanceDate] = useState(new Date());
  const [frequency, setFrequency] = useState('');
  const [editingItemId, setEditingItemId] = useState(null);
  const [uid, setUid] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Get the current user's id to fetch their data 
  useEffect(() => {
    const user = auth().currentUser;

    if (user) {
      setUid(user.uid);
    }
  }, []);

  // fetch the user items from the database when the user id is available
  useEffect(() => {
    if (uid) {
      fetchItems();
    }
  }, [uid]);

  const fetchItems = async () => {
    const fetchedItems = await getItems(uid);
    setItems(fetchedItems);
  };

  // Add new item
  const handleAddItem = async () => {
    if (!name.trim() || !uid || !lastMaintenanceDate || !frequency) return;

    await addItem(
      uid, 
      name,
      notes,
      lastMaintenanceDate,
      Number(frequency)
    );

    setName('');
    setNotes('');
    setLastMaintenanceDate(new Date());
    setFrequency('');
    fetchItems();
  };

  // Update existing item
  const handleUpdateItem = async () => {
    if (!name.trim() || !editingItemId || !uid) return;

    await updateItems(editingItemId, name);
    setName('');
    setEditingItemId(null);
    fetchItems();
  }; 
  // Delete item
  const handleDeleteItem = async (id) => {
    await deleteItems(id);
    fetchItems();
  };

  // Start editing
  const handleEditItem = (item) => {
    setEditingItemId(item.id);
    setName(item.name);
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Enter item name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput 
      placeholder="Notes"
      value={notes}
      onChangeText={setNotes}
      style={styles.input}
      />
      <TouchableOpacity
      style={styles.input}
      onPress={() => setShowDatePicker(true)}
      >
        <Text> 
          { lastMaintenanceDate
            ? dayjs(lastMaintenanceDate).format('YYYY-MM-DD')
            : 'Select Last Maintenance Date of the Item'} 
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DatePicker
          mode="single"
          date={lastMaintenanceDate}
          onChange={event => { 
            setLastMaintenanceDate(event.date);
            setShowDatePicker(false);
          }}
          style={styles.input}
          
        />
      )}
      <TextInput
      placeholder="Maintenance Frequency in days"
      value={frequency}
      onChangeText={setFrequency}
      keyboardType="numeric"
      style={styles.input}
      />
      {editingItemId ? (
        <Button title="Update Item" onPress={handleUpdateItem} />
      ) : (
        <Button title="Add Item" onPress={handleAddItem} />
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Text style={styles.itemText}>{item.name}</Text>

            <View style={styles.buttons}>
              <TouchableOpacity
                onPress={() => handleEditItem(item)}
                style={styles.editButton}
              >
                <Text>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleDeleteItem(item.id)}
                style={styles.deleteButton}
              >
                <Text>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemText: { fontSize: 16 },
  buttons: { flexDirection: 'row' },
  editButton: {
    marginRight: 10,
    backgroundColor: '#ddd',
    padding: 5,
  },
  deleteButton: {
    backgroundColor: '#f88',
    padding: 5,
  },
});

export default ItemManagementScreen;


