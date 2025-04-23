import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addRoom, updateRoom, deleteRoom } from '../store/slices/propertySlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const RoomScreen = ({ route }) => {
  const { propertyId } = route.params;
  const dispatch = useDispatch();
  const property = useSelector((state) =>
    state.properties.properties.find((p) => p.id === propertyId)
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [tenant, setTenant] = useState('');
  const [roomType, setRoomType] = useState('');
  const [status, setStatus] = useState('Vacant');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [occupiedUntil, setOccupiedUntil] = useState(new Date());

  const handleAddRoom = () => {
    if (!tenant || !roomType) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const roomData = {
      propertyId,
      number: tenant, // Using tenant name as room number
      type: roomType,
      tenant: tenant,
      status: status,
      occupiedUntil: status === 'Occupied' ? occupiedUntil.toISOString() : null,
    };

    if (editingRoom) {
      dispatch(
        updateRoom({
          propertyId,
          roomId: editingRoom.id,
          updates: roomData,
        })
      );
    } else {
      dispatch(addRoom(roomData));
    }

    setModalVisible(false);
    resetForm();
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setTenant(room.tenant || '');
    setRoomType(room.type);
    setStatus(room.status);
    setOccupiedUntil(room.occupiedUntil ? new Date(room.occupiedUntil) : new Date());
    setModalVisible(true);
  };

  const handleDeleteRoom = (roomId) => {
    Alert.alert(
      'Delete Room',
      'Are you sure you want to delete this room?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch(deleteRoom({ propertyId, roomId })),
        },
      ]
    );
  };

  const resetForm = () => {
    setEditingRoom(null);
    setTenant('');
    setRoomType('');
    setStatus('Vacant');
    setOccupiedUntil(new Date());
  };

  const renderRoom = ({ item }) => (
    <View style={styles.roomCard}>
      <View style={styles.roomHeader}>
        <Text style={styles.roomNumber}>{item.tenant || 'Vacant'}</Text>
        <View style={styles.roomActions}>
          <TouchableOpacity onPress={() => handleEditRoom(item)}>
            <Icon name="pencil" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteRoom(item.id)}>
            <Icon name="delete" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.roomType}>Type: {item.type}</Text>
      <Text style={styles.roomStatus}>Status: {item.status}</Text>
      {item.occupiedUntil && (
        <Text style={styles.occupiedUntil}>
          Until: {new Date(item.occupiedUntil).toLocaleDateString()}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          resetForm();
          setModalVisible(true);
        }}
      >
        <Text style={styles.addButtonText}>Add Room</Text>
      </TouchableOpacity>

      <FlatList
        data={property?.rooms || []}
        renderItem={renderRoom}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingRoom ? 'Edit Room' : 'Add Room'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Tenant Name"
              value={tenant}
              onChangeText={setTenant}
            />

            <Picker
              selectedValue={roomType}
              onValueChange={setRoomType}
              style={styles.picker}
            >
              <Picker.Item label="Select Room Type" value="" />
              <Picker.Item label="Private bath" value="Private bath" />
              <Picker.Item label="Shared bath" value="Shared bath" />
              <Picker.Item label="Garage" value="Garage" />
            </Picker>

            <Picker
              selectedValue={status}
              onValueChange={setStatus}
              style={styles.picker}
            >
              <Picker.Item label="Vacant" value="Vacant" />
              <Picker.Item label="Occupied" value="Occupied" />
            </Picker>

            {status === 'Occupied' && (
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  Occupied Until: {occupiedUntil.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            )}

            {showDatePicker && (
              <DateTimePicker
                value={occupiedUntil}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) {
                    setOccupiedUntil(date);
                  }
                }}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleAddRoom}
              >
                <Text style={styles.buttonText}>Save</Text>
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
    backgroundColor: '#f5f5f5',
    padding: 15,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  addButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    gap: 15,
  },
  roomCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  roomNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  roomActions: {
    flexDirection: 'row',
    gap: 15,
  },
  roomType: {
    fontSize: 16,
    marginBottom: 5,
  },
  roomStatus: {
    fontSize: 16,
    marginBottom: 5,
  },
  occupiedUntil: {
    fontSize: 14,
    color: '#666',
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
    width: '90%',
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
  dateButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  dateButtonText: {
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 5,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default RoomScreen; 