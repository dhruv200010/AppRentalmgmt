import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

const DashboardScreen = () => {
  const navigation = useNavigation();
  const properties = useSelector((state) => state.properties.properties);
  const rooms = useSelector((state) => state.rooms.rooms);

  const renderPropertyItem = ({ item }) => (
    <TouchableOpacity
      style={styles.propertyCard}
      onPress={() => navigation.navigate('Property', { propertyId: item.id })}
    >
      <Text style={styles.propertyName}>{item.name}</Text>
      <Text style={styles.roomCount}>
        {rooms.filter(room => room.propertyId === item.id).length} Rooms
      </Text>
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Vacant: {rooms.filter(room => room.propertyId === item.id && room.status === 'vacant').length}
        </Text>
        <Text style={styles.statusText}>
          Occupied: {rooms.filter(room => room.propertyId === item.id && room.status === 'occupied').length}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rent Manager</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('Property', { isNew: true })}
        >
          <Text style={styles.addButtonText}>Add Property</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={properties}
        renderItem={renderPropertyItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  propertyCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  propertyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  roomCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
});

export default DashboardScreen; 