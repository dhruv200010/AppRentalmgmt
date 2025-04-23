import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

const RoomScreen = () => {
  const [rooms, setRooms] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState('');
  const [roomSize, setRoomSize] = useState('');

  const handleAddRoom = () => {
    if (!roomNumber || !roomType || !roomSize) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const newRoom = {
      id: Date.now().toString(),
      roomNumber,
      roomType,
      roomSize,
      status: 'Available',
      tenant: null,
    };

    const updatedRooms = [...rooms, newRoom];
    setRooms(updatedRooms);
    setRoomNumber('');
    setRoomType('');
    setRoomSize('');
    setModalVisible(false);
  };

  const renderRoomItem = ({ item }) => (
    <View style={styles.roomItem}>
      <Text style={styles.roomNumber}>Room {item.roomNumber}</Text>
      <Text>Type: {item.roomType}</Text>
      <Text>Size: {item.roomSize}</Text>
      <Text>Status: {item.status}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>Add Room</Text>
      </TouchableOpacity>

      <FlatList
        data={rooms}
        renderItem={renderRoomItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Room</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Room Number"
              value={roomNumber}
              onChangeText={setRoomNumber}
              keyboardType="numeric"
            />

            <Picker
              selectedValue={roomType}
              onValueChange={(itemValue) => setRoomType(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select Room Type" value="" />
              <Picker.Item label="Single" value="Single" />
              <Picker.Item label="Double" value="Double" />
              <Picker.Item label="Suite" value="Suite" />
            </Picker>

            <Picker
              selectedValue={roomSize}
              onValueChange={(itemValue) => setRoomSize(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select Room Size" value="" />
              <Picker.Item label="Small" value="Small" />
              <Picker.Item label="Medium" value="Medium" />
              <Picker.Item label="Large" value="Large" />
            </Picker>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.addButton]}
                onPress={handleAddRoom}
              >
                <Text style={styles.buttonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  addButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  roomItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  roomNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  addButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default RoomScreen; 