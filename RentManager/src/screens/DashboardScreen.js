import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { deleteProperty, addProperty } from '../store/slices/propertySlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const DashboardScreen = ({ navigation }) => {
  const properties = useSelector((state) => state.properties.properties);
  const dispatch = useDispatch();
  const [modalVisible, setModalVisible] = useState(false);
  const [propertyName, setPropertyName] = useState('');

  const handleAddProperty = () => {
    if (!propertyName.trim()) {
      Alert.alert('Error', 'Please enter a property name');
      return;
    }

    dispatch(addProperty({ name: propertyName.trim() }));
    setPropertyName('');
    setModalVisible(false);
  };

  const handleDeleteProperty = (propertyId) => {
    Alert.alert(
      'Delete Property',
      'Are you sure you want to delete this property?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch(deleteProperty(propertyId)),
        },
      ]
    );
  };

  const getRemainingDays = (occupiedUntil) => {
    if (!occupiedUntil) return null;
    const today = new Date();
    const endDate = new Date(occupiedUntil);
    const diffTime = endDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getRoomStatusColor = (room) => {
    if (room.status === 'Vacant') return '#34C759'; // Green for vacant
    
    const remainingDays = getRemainingDays(room.occupiedUntil);
    if (remainingDays <= 15) return '#FF3B30'; // Red for less than 15 days
    if (remainingDays <= 30) return '#FF9500'; // Orange for 15-30 days
    return '#34C759'; // Green for more than 30 days
  };

  const getRemainingTimeText = (room) => {
    if (room.status === 'Vacant') return 'Vacant';
    
    const remainingDays = getRemainingDays(room.occupiedUntil);
    if (remainingDays < 0) return 'Lease Expired';
    if (remainingDays === 0) return 'Last Day';
    if (remainingDays <= 30) return `${remainingDays} days left`;
    
    const months = Math.floor(remainingDays / 30);
    const days = remainingDays % 30;
    return days > 0 ? `${months}m ${days}d left` : `${months} months left`;
  };

  const renderRoomStatus = (room) => {
    const statusColor = getRoomStatusColor(room);
    const remainingTime = getRemainingTimeText(room);
    
    return (
      <View key={room.id} style={[styles.roomStatus, { borderLeftColor: statusColor, borderLeftWidth: 4 }]}>
        <Text style={styles.roomTypeLabel}>
          {room.type === 'Private bath' ? 'P' : room.type === 'Shared bath' ? 'S' : 'G'}
        </Text>
        <Text style={styles.roomNumber}>Room {room.number}</Text>
        {room.tenant && (
          <Text style={styles.tenantName} numberOfLines={1}>
            {room.tenant}
          </Text>
        )}
        <Text style={[styles.duration, { color: statusColor }]}>
          {remainingTime}
        </Text>
      </View>
    );
  };

  const renderProperty = (property) => (
    <View key={property.id} style={styles.propertyCard}>
      <View style={styles.propertyHeader}>
        <View style={styles.propertyInfo}>
          <Text style={styles.propertyName}>{property.name}</Text>
          <Text style={styles.roomCount}>
            {property.rooms.length} room{property.rooms.length !== 1 ? 's' : ''} • {
              property.rooms.filter(r => r.status === 'Vacant').length
            } vacant
          </Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Room', { propertyId: property.id })}
          >
            <Icon name="pencil" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteProperty(property.id)}>
            <Icon name="delete" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.roomsContainer}>
          {property.rooms.map(renderRoomStatus)}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addPropertyButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addPropertyButtonText}>Add Property</Text>
      </TouchableOpacity>

      <ScrollView style={styles.scrollView}>
        {properties.map(renderProperty)}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Property</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Property Name"
              value={propertyName}
              onChangeText={setPropertyName}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setPropertyName('');
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleAddProperty}
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
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  addPropertyButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    margin: 10,
    borderRadius: 10,
  },
  addPropertyButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  propertyCard: {
    backgroundColor: 'white',
    margin: 10,
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
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  roomCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  roomsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  roomStatus: {
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    minWidth: 100,
    borderLeftWidth: 4,
  },
  roomTypeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  roomNumber: {
    fontSize: 14,
    fontWeight: '500',
  },
  tenantName: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  duration: {
    fontSize: 12,
    marginTop: 5,
    fontWeight: '500',
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

export default DashboardScreen; 