import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, TouchableOpacity, StyleSheet } from 'react-native';
import auth from '@react-native-firebase/auth';
import addItem from '../services/addItems';
import dayjs from 'dayjs';
import DatePicker from 'react-native-ui-datepicker';
import { useNavigation } from '@react-navigation/native';

const AddItemScreen = () => {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [lastMaintenanceDate, setLastMaintenanceDate] = useState(new Date());
  const [frequency, setFrequency] = useState('');
  const [uid, setUid] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Get current user id
  useEffect(() => {
    const user = auth().currentUser;
    if (user) setUid(user.uid);
  }, []);

  const handleAddItem = async () => {
    if (!name.trim() || !uid || !lastMaintenanceDate || !frequency) return;

    await addItem(uid, name, notes, lastMaintenanceDate, Number(frequency));

    // Reset the form
    setName('');
    setNotes('');
    setLastMaintenanceDate(new Date());
    setFrequency('');

    navigation.navigate('ItemDashboard');
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
      <Button title="Add Item" onPress={handleAddItem} />
    </View>
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
});

  