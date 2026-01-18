import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, TouchableOpacity, StyleSheet } from 'react-native';
import auth from '@react-native-firebase/auth';
import addItem from '../services/addItems';
import dayjs from 'dayjs';
import DatePicker from 'react-native-ui-datepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import updateItem from '../services/updateItems';
import { SafeAreaView } from 'react-native-safe-area-context';

const AddItemScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [lastMaintenanceDate, setLastMaintenanceDate] = useState(new Date());
  const [frequency, setFrequency] = useState('');
  const [uid, setUid] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const isEditing = !!route.params?.item;

  // Get current user id
  useEffect(() => {
    const user = auth().currentUser;
    if (user) setUid(user.uid);
  }, []);

  // Check if an Item is being passed for editing
  useEffect(() => { 
    /* item*/
    const editItem = route.params?.item ?? null;
    if (editItem) {
      setName (editItem.name || '');
      setNotes (editItem.notes || '');
      setLastMaintenanceDate (editItem.lastMaintenanceDate ? new Date(editItem.lastMaintenanceDate) : new Date());
      setFrequency (editItem.frequency ? String (editItem.frequency) : '');
    }
  }, [route.params?.item]);

  const handleAddItem = async () => {
    if (!name.trim() || !uid || !lastMaintenanceDate || !frequency) return;

    if (isEditing) {
      await updateItem( route.params.item.id, { 
        name, 
        notes,
        lastMaintenanceDate,
        frequency: Number(frequency),
      });
      navigation.navigate('ItemDashboard');
      return;
      }

    await addItem(uid, name, notes, lastMaintenanceDate, Number(frequency));
    navigation.navigate('ItemDashboard'); 
  };

  return (
    <SafeAreaView style={styles.container}>
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
            : 'Select Last Maintenance Date'}
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
      <Button title={isEditing ? 'Save Changes' : 'Add Item'} onPress={handleAddItem} />
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('ItemDashboard')}
      >
        <Text style={styles.backButtonText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default AddItemScreen;

// Example basic styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 12,
    borderRadius: 6,
  },
   backButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 3,
  },
  backButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

});
