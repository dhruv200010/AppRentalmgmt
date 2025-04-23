import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { addRoom, updateRoom } from '../store/slices/roomSlice';

const RoomScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const rooms = useSelector((state) => state.rooms.rooms);
  const properties = useSelector((state) => state.properties.properties);

  const [room, setRoom] = useState({
    id: '',
    propertyId: '',
    name: '',
    type: 'Private bath',
    status: 'vacant',
    occupiedUntil: '',
    rent: '',
  });

  useEffect(() => {
    if (route.params?.roomId) {
      const existingRoom = rooms.find(r => r.id === route.params.roomId);
      if (existingRoom) {
        setRoom(existingRoom);
      }
    } else if (route.params?.propertyId) {
      setRoom(prev => ({ ...prev, propertyId: route.params.propertyId }));
    }
  }, [route.params?.roomId, route.params?.propertyId, rooms]);

  const handleSave = () => {
    if (room.id) {
      dispatch(updateRoom(room));
    } else {
      const newRoom = {
        ...room,
        id: Date.now().toString(),
      };
      dispatch(addRoom(newRoom));
    }
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Room Name</Text>
        <TextInput
          style={styles.input}
          value={room.name}
          onChangeText={(text) => setRoom({ ...room, name: text })}
          placeholder="Enter room name"
        />

        <Text style={styles.label}>Room Type</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={room.type}
            onValueChange={(value) => setRoom({ ...room, type: value })}
            style={styles.picker}
          >
            <Picker.Item label="Private bath" value="Private bath" />
            <Picker.Item label="Shared bath" value="Shared bath" />
            <Picker.Item label="Garage" value="Garage" />
          </Picker>
        </View>

        <Text style={styles.label}>Status</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={room.status}
            onValueChange={(value) => setRoom({ ...room, status: value })}
            style={styles.picker}
          >
            <Picker.Item label="Vacant" value="vacant" />
            <Picker.Item label="Occupied" value="occupied" />
          </Picker>
        </View>

        {room.status === 'occupied' && (
          <>
            <Text style={styles.label}>Occupied Until</Text>
            <TextInput
              style={styles.input}
              value={room.occupiedUntil}
              onChangeText={(text) => setRoom({ ...room, occupiedUntil: text })}
              placeholder="Enter date (YYYY-MM-DD)"
            />
          </>
        )}

        <Text style={styles.label}>Rent</Text>
        <TextInput
          style={styles.input}
          value={room.rent}
          onChangeText={(text) => setRoom({ ...room, rent: text })}
          placeholder="Enter rent amount"
          keyboardType="numeric"
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Room</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RoomScreen; 