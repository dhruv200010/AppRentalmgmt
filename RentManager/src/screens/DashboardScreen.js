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
  FlatList,
  Platform,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { deleteProperty, addProperty } from '../store/slices/propertySlice';
import { addLead, updateLead, deleteLead } from '../store/slices/leadSlice';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Notifications from 'expo-notifications';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Set notification categories
Notifications.setNotificationCategoryAsync('lead', [
  {
    identifier: 'lead',
    options: {
      isDestructive: false,
      isAuthenticationRequired: false,
    },
  },
]);

const DashboardScreen = ({ navigation }) => {
  const properties = useSelector((state) => state.properties.properties);
  const leads = useSelector((state) => state.leads.leads);
  const sources = useSelector((state) => state.leads.sources);
  const categories = useSelector((state) => state.leads.categories);
  const locations = useSelector((state) => state.leads.locations);
  const dispatch = useDispatch();
  const [propertyModalVisible, setPropertyModalVisible] = useState(false);
  const [propertyName, setPropertyName] = useState('');

  // Lead modal state
  const [leadModalVisible, setLeadModalVisible] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [leadName, setLeadName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [source, setSource] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('date');
  const [alertTime, setAlertTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('properties');

  const handleAddProperty = () => {
    if (!propertyName.trim()) {
      Alert.alert('Error', 'Please enter a property name');
      return;
    }

    dispatch(addProperty({ name: propertyName.trim() }));
    setPropertyName('');
    setPropertyModalVisible(false);
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
    if (room.status === 'Vacant') return '#8A2BE2'; // Violet for vacant
    
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

  const getRoomSortOrder = (room) => {
    if (room.status === 'Vacant') return 0; // Vacant rooms first
    
    const remainingDays = getRemainingDays(room.occupiedUntil);
    if (remainingDays <= 15) return 1; // Red (urgent) rooms second
    if (remainingDays <= 30) return 2; // Orange rooms third
    return 3; // Green rooms last
  };

  const renderRoomStatus = (room) => {
    const statusColor = getRoomStatusColor(room);
    const remainingTime = getRemainingTimeText(room);
    const isVacant = room.status === 'Vacant';
    
    return (
      <View 
        key={room.id} 
        style={[
          styles.roomStatus, 
          { 
            borderLeftColor: statusColor, 
            borderLeftWidth: 4,
            backgroundColor: isVacant ? '#f8f8f8' : 'white',
          }
        ]}
      >
        <View style={[
          styles.roomContent,
          isVacant && styles.vacantRoomContent
        ]}>
          <Text style={styles.roomTypeLabel}>
            {room.type === 'Private bath' ? 'P' : room.type === 'Shared bath' ? 'S' : 'G'}
          </Text>
          <Text style={styles.roomNumber}>{room.tenant || 'Vacant'}</Text>
          <Text style={[styles.duration, { color: statusColor }]}>
            {remainingTime}
          </Text>
        </View>
        {isVacant && (
          <View style={styles.stripedBackground}>
            {[...Array(20)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.stripe,
                  { 
                    top: i * 10,
                    transform: [{ rotate: '45deg' }],
                    width: '200%',
                    left: '-50%'
                  }
                ]}
              />
            ))}
          </View>
        )}
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
          {[...property.rooms]
            .sort((a, b) => getRoomSortOrder(a) - getRoomSortOrder(b))
            .map(renderRoomStatus)}
        </View>
      </ScrollView>
    </View>
  );

  const scheduleNotification = async (lead, leadId) => {
    try {
      console.log('Starting notification scheduling...');
      console.log('Lead data:', lead);
      console.log('Lead ID:', leadId);

      const { status } = await Notifications.requestPermissionsAsync();
      console.log('Notification permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert('Error', 'Notification permissions not granted');
        return;
      }

      if (leadId) {
        console.log('Canceling existing notification for ID:', leadId);
        await Notifications.cancelScheduledNotificationAsync(leadId);
      }
      
      const triggerDate = new Date(lead.alertTime);
      const now = new Date();
      
      console.log('Trigger date:', triggerDate.toLocaleString());
      console.log('Current time:', now.toLocaleString());
      console.log('Time difference (ms):', triggerDate.getTime() - now.getTime());
      
      // Only schedule if the date is in the future
      if (triggerDate > now) {
        const trigger = {
          type: 'date',
          date: triggerDate,
        };

        console.log('Scheduling notification with trigger:', trigger);

        const identifier = await Notifications.scheduleNotificationAsync({
          content: {
            title: `${lead.category} ${lead.name}`,
            body: `for ${lead.location}`,
            data: { leadId },
          },
          trigger,
        });

        console.log('Notification scheduled successfully');
        console.log('Notification ID:', identifier);
        console.log('Scheduled for:', triggerDate.toLocaleString());

        // Verify the scheduled notification
        const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
        console.log('All scheduled notifications:', scheduledNotifications);
      } else {
        console.log('Error: Selected time is in the past');
        Alert.alert('Error', 'Please select a future date and time for the alert');
      }
    } catch (error) {
      console.error('Error in scheduleNotification:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
      Alert.alert('Error', 'Failed to schedule notification. Please try again.');
    }
  };

  const handleAddLead = async () => {
    if (!leadName || !contactNo || !source || !category || !location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      console.log('Adding new lead...');
      console.log('Alert time:', alertTime.toLocaleString());

      const leadData = {
        name: leadName,
        contactNo,
        source,
        category,
        location,
        alertTime: alertTime.toISOString(),
      };

      console.log('Lead data to be saved:', leadData);

      if (editingLead) {
        console.log('Updating existing lead:', editingLead.id);
        dispatch(updateLead({ ...leadData, id: editingLead.id }));
        await scheduleNotification(leadData, editingLead.id);
      } else {
        console.log('Creating new lead');
        const newLead = dispatch(addLead(leadData));
        console.log('New lead created:', newLead);
        await scheduleNotification(leadData, newLead.id);
      }

      setLeadModalVisible(false);
      resetLeadForm();
    } catch (error) {
      console.error('Error in handleAddLead:', error);
      Alert.alert('Error', 'Failed to save lead. Please try again.');
    }
  };

  const handleEditLead = (lead) => {
    setEditingLead(lead);
    setLeadName(lead.name);
    setContactNo(lead.contactNo);
    setSource(lead.source);
    setCategory(lead.category);
    setLocation(lead.location);
    setAlertTime(new Date(lead.alertTime));
    setLeadModalVisible(true);
  };

  const handleDeleteLead = async (leadId) => {
    Alert.alert(
      'Delete Lead',
      'Are you sure you want to delete this lead?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelNotification(leadId);
              dispatch(deleteLead(leadId));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete lead. Please try again.');
              console.error('Error deleting lead:', error);
            }
          },
        },
      ]
    );
  };

  const resetLeadForm = () => {
    setEditingLead(null);
    setLeadName('');
    setContactNo('');
    setSource('');
    setCategory('');
    setLocation('');
    setAlertTime(new Date());
  };

  const cancelNotification = async (leadId) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(leadId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  };

  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.contactNo.includes(searchQuery) ||
    lead.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderLead = ({ item }) => (
    <View style={styles.leadCard}>
      <View style={styles.leadHeader}>
        <View style={styles.leadInfo}>
          <Text style={styles.leadName}>{item.name}</Text>
          <Text style={styles.leadContact}>{item.contactNo}</Text>
          <Text style={styles.leadDetails}>
            {item.category} • {item.source} • {item.location}
          </Text>
          <Text style={styles.leadAlert}>
            Alert: {new Date(item.alertTime).toLocaleString()}
          </Text>
        </View>
        <View style={styles.leadActions}>
          <TouchableOpacity onPress={() => handleEditLead(item)}>
            <Icon name="pencil" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteLead(item.id)}>
            <Icon name="delete" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const handleDateChange = (event, selectedDate) => {
    console.log('Date picker event:', event);
    console.log('Selected date:', selectedDate?.toLocaleString());
    
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      setShowTimePicker(true);
    }
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(alertTime.getHours());
      newDate.setMinutes(alertTime.getMinutes());
      console.log('New date after setting time:', newDate.toLocaleString());
      setAlertTime(newDate);
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    console.log('Time picker event:', event);
    console.log('Selected time:', selectedTime?.toLocaleString());
    
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      const newDate = new Date(alertTime);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      console.log('New time after setting:', newDate.toLocaleString());
      setAlertTime(newDate);
    }
  };

  const showPicker = (mode) => {
    if (Platform.OS === 'android') {
      setPickerMode(mode);
      if (mode === 'date') {
        setShowDatePicker(true);
      } else {
        setShowTimePicker(true);
      }
    } else {
      setPickerMode(mode);
      setShowDatePicker(true);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        {activeTab === 'properties' ? (
          <View style={styles.section}>
            <ScrollView style={styles.propertiesSection}>
              {properties.map(renderProperty)}
            </ScrollView>
            <TouchableOpacity
              style={styles.fab}
              onPress={() => setPropertyModalVisible(true)}
            >
              <Icon name="plus" size={24} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Alerts</Text>
            </View>
            <View style={styles.searchContainer}>
              <Icon name="magnify" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search leads..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearButton}
                >
                  <Icon name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={styles.alertsContainer}>
              <FlatList
                data={filteredLeads}
                renderItem={renderLead}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.leadsList}
                nestedScrollEnabled={true}
              />
            </View>
            <TouchableOpacity
              style={styles.fab}
              onPress={() => {
                resetLeadForm();
                setLeadModalVisible(true);
              }}
            >
              <Icon name="plus" size={24} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'properties' && styles.activeTab]}
          onPress={() => setActiveTab('properties')}
        >
          <Icon name="home" size={24} color={activeTab === 'properties' ? '#007AFF' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'properties' && styles.activeTabText]}>Properties</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'alerts' && styles.activeTab]}
          onPress={() => setActiveTab('alerts')}
        >
          <Icon name="bell" size={24} color={activeTab === 'alerts' ? '#007AFF' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'alerts' && styles.activeTabText]}>Alerts</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={propertyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPropertyModalVisible(false)}
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
                  setPropertyModalVisible(false);
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

      <Modal
        visible={leadModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setLeadModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingLead ? 'Edit Lead' : 'Add Lead'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Name"
              value={leadName}
              onChangeText={setLeadName}
            />

            <TextInput
              style={styles.input}
              placeholder="Contact Number"
              value={contactNo}
              onChangeText={setContactNo}
              keyboardType="phone-pad"
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Source</Text>
              <Picker
                selectedValue={source}
                onValueChange={setSource}
                style={styles.picker}
              >
                <Picker.Item label="Select Source" value="" />
                {sources.map((src) => (
                  <Picker.Item key={src} label={src} value={src} />
                ))}
              </Picker>
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Category</Text>
              <Picker
                selectedValue={category}
                onValueChange={setCategory}
                style={styles.picker}
              >
                <Picker.Item label="Select Category" value="" />
                {categories.map((cat) => (
                  <Picker.Item key={cat} label={cat} value={cat} />
                ))}
              </Picker>
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Location</Text>
              <Picker
                selectedValue={location}
                onValueChange={setLocation}
                style={styles.picker}
              >
                <Picker.Item label="Select Location" value="" />
                {locations.map((loc) => (
                  <Picker.Item key={loc} label={loc} value={loc} />
                ))}
              </Picker>
            </View>

            <View style={styles.dateTimeContainer}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => showPicker('date')}
              >
                <Text style={styles.dateButtonText}>
                  Date: {alertTime.toLocaleDateString()}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => showPicker('time')}
              >
                <Text style={styles.dateButtonText}>
                  Time: {alertTime.toLocaleTimeString()}
                </Text>
              </TouchableOpacity>
            </View>

            {(showDatePicker || showTimePicker) && (
              <DateTimePicker
                value={alertTime}
                mode={pickerMode}
                is24Hour={true}
                display="default"
                onChange={pickerMode === 'date' ? handleDateChange : handleTimeChange}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setLeadModalVisible(false);
                  resetLeadForm();
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleAddLead}
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
  },
  contentContainer: {
    flex: 1,
  },
  section: {
    flex: 1,
    padding: 10,
  },
  propertiesSection: {
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingVertical: 5,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    height: 50,
  },
  tabButton: {
    alignItems: 'center',
    padding: 5,
    justifyContent: 'center',
  },
  activeTab: {
    borderTopWidth: 2,
    borderTopColor: '#007AFF',
  },
  tabText: {
    marginTop: 2,
    color: '#666',
    fontSize: 11,
  },
  activeTabText: {
    color: '#007AFF',
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
    margin: 5,
    padding: 10,
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
    borderRadius: 8,
    minWidth: 100,
    borderLeftWidth: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  roomContent: {
    position: 'relative',
    zIndex: 1,
  },
  vacantRoomContent: {
    backgroundColor: 'white',
    padding: 5,
    borderRadius: 4,
  },
  stripedBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    overflow: 'hidden',
  },
  stripe: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#e0e0e0',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addLeadButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 8,
  },
  addLeadButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  alertsContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flex: 1,
  },
  leadsList: {
    padding: 5,
  },
  leadCard: {
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  leadContact: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  leadDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  leadAlert: {
    fontSize: 12,
    color: '#007AFF',
  },
  leadActions: {
    flexDirection: 'row',
    gap: 10,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dateButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  dateButtonText: {
    textAlign: 'center',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  clearButton: {
    padding: 5,
  },
  pickerContainer: {
    marginBottom: 15,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  picker: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    height: 50,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default DashboardScreen; 