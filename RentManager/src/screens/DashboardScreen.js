import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  PanResponder,
  Linking,
  ToastAndroid,
  Image,
  Dimensions,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { deleteProperty, addProperty } from '../store/slices/propertySlice';
import { addLead, updateLead, deleteLead, addResponse, rescheduleAlert, deleteResponse } from '../store/slices/leadSlice';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Notifications from 'expo-notifications';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { PinchGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuth } from '@clerk/clerk-expo';

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
  const { signOut } = useAuth();
  const properties = useSelector((state) => state.properties.properties);
  const leads = useSelector((state) => state.leads.leads);
  const sources = useSelector((state) => state.leads.sources);
  const categories = useSelector((state) => state.leads.categories);
  const locations = useSelector((state) => state.leads.locations);
  const dispatch = useDispatch();
  const [propertyModalVisible, setPropertyModalVisible] = useState(false);
  const [propertyName, setPropertyName] = useState('');
  const [completedAlerts, setCompletedAlerts] = useState({}); // Track completed alerts
  const [archivedAlerts, setArchivedAlerts] = useState([]); // Track archived alerts
  const [showArchived, setShowArchived] = useState(false); // Track if we're showing archived alerts

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
  const [chatMessage, setChatMessage] = useState('');
  const [showChatBox, setShowChatBox] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [showResponseInput, setShowResponseInput] = useState(null);
  const [showReschedulePicker, setShowReschedulePicker] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(new Date());
  const [selectedLeadForReschedule, setSelectedLeadForReschedule] = useState(null);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [showResponsesDialog, setShowResponsesDialog] = useState(false);
  const [selectedLeadResponses, setSelectedLeadResponses] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const scale = useRef(new Animated.Value(1)).current;
  const lastScale = useRef(1);
  const pinchRef = useRef(null);
  const [alertFilter, setAlertFilter] = useState('all'); // Add this line for alert filter state

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
    
    if (room.occupiedUntil === 'Month to Month') return '#34C759'; // Green for month to month
    
    const remainingDays = getRemainingDays(room.occupiedUntil);
    if (remainingDays <= 15) return '#FF3B30'; // Red for less than 15 days
    if (remainingDays <= 30) return '#FF9500'; // Orange for 15-30 days
    return '#34C759'; // Green for more than 30 days
  };

  const getRemainingTimeText = (room) => {
    if (room.status === 'Vacant') return 'Vacant';
    
    if (room.occupiedUntil === 'Month to Month') return 'Month to Month';
    
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
    
    if (room.occupiedUntil === 'Month to Month') return 3; // Month to month after urgent rooms
    
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
            {room.type}
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
      console.log('\n=== Starting notification scheduling ===');
      console.log('Lead data:', JSON.stringify(lead, null, 2));
      console.log('Lead ID:', leadId);
      console.log('Lead ID type:', typeof leadId);

      // Debug 1: Check notification permissions
      const { status } = await Notifications.requestPermissionsAsync();
      console.log('Debug 1 - Notification permission status:', status);
      
      if (status !== 'granted') {
        console.log('Error: Notification permissions not granted');
        Alert.alert('Error', 'Notification permissions not granted');
        return;
      }

      // Debug 2: Check if we need to cancel existing notification
      if (leadId) {
        console.log('Debug 2 - Checking for existing notification with ID:', leadId.toString());
        const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
        const existingNotification = existingNotifications.find(n => 
          n.identifier === leadId.toString() || 
          (n.content.data && n.content.data.leadId === leadId.toString())
        );
        
        if (existingNotification) {
          console.log('Debug 2 - Found existing notification:', JSON.stringify(existingNotification, null, 2));
          try {
            await Notifications.cancelScheduledNotificationAsync(existingNotification.identifier);
            console.log('Debug 2 - Successfully canceled existing notification');
          } catch (cancelError) {
            console.log('Debug 2 - Error canceling existing notification:', cancelError);
          }
        } else {
          console.log('Debug 2 - No existing notification found to cancel');
        }
      }
      
      // Debug 3: Parse and validate the alert time
      const triggerDate = new Date(lead.alertTime);
      const now = new Date();
      
      console.log('Debug 3 - Alert time string:', lead.alertTime);
      console.log('Debug 3 - Parsed trigger date:', triggerDate.toLocaleString());
      console.log('Debug 3 - Current time:', now.toLocaleString());
      console.log('Debug 3 - Time difference (ms):', triggerDate.getTime() - now.getTime());
      
      // Only schedule if the date is in the future
      if (triggerDate > now) {
        // Debug 4: Create and validate trigger object
        const trigger = {
          type: 'date',
          date: triggerDate,
          repeats: false,
          channelId: Platform.OS === 'android' ? 'default' : null
        };

        console.log('Debug 4 - Trigger object before scheduling:', JSON.stringify(trigger, null, 2));
        console.log('Debug 4 - Trigger date type:', typeof trigger.date);
        console.log('Debug 4 - Trigger date instance of Date:', trigger.date instanceof Date);
        console.log('Debug 4 - Trigger date value:', trigger.date.toISOString());
        console.log('Debug 4 - Trigger date local time:', trigger.date.toLocaleString());

        // Debug 5: Prepare notification content
        const notificationContent = {
          title: `${lead.category} ${lead.name}`,
          body: `for ${lead.location}`,
          data: { leadId: leadId.toString() },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          channelId: Platform.OS === 'android' ? 'default' : null
        };

        console.log('Debug 5 - Notification content:', JSON.stringify(notificationContent, null, 2));
        
        // Debug 6: Attempt to schedule notification
        console.log('Debug 6 - Attempting to schedule notification...');
        const identifier = await Notifications.scheduleNotificationAsync({
          content: notificationContent,
          trigger,
          identifier: leadId.toString()
        });
        console.log('Debug 6 - Notification scheduling result:', {
          identifier,
          success: !!identifier,
          expectedIdentifier: leadId.toString()
        });

        // Debug 7: Verify the scheduled notification
        console.log('Debug 7 - Fetching all scheduled notifications...');
        const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
        console.log('Debug 7 - All scheduled notifications:', JSON.stringify(scheduledNotifications, null, 2));
        
        // Debug 8: Verify our specific notification
        const ourNotification = scheduledNotifications.find(n => 
          n.identifier === leadId.toString() || 
          (n.content.data && n.content.data.leadId === leadId.toString())
        );
        
        if (ourNotification) {
          console.log('Debug 8 - Found our scheduled notification:', JSON.stringify(ourNotification, null, 2));
          console.log('Debug 8 - Scheduled time:', new Date(ourNotification.trigger.value).toLocaleString());
          console.log('Debug 8 - Trigger configuration:', JSON.stringify(ourNotification.trigger, null, 2));
          console.log('Debug 8 - Notification identifier:', ourNotification.identifier);
          console.log('Debug 8 - Notification data:', JSON.stringify(ourNotification.content.data, null, 2));
          
          // Store the notification identifier in the lead data
          return ourNotification.identifier;
        } else {
          console.error('Debug 8 - Could not find our scheduled notification in the list');
          console.error('Debug 8 - Expected identifier:', leadId.toString());
          console.error('Debug 8 - Available identifiers:', scheduledNotifications.map(n => n.identifier));
          console.error('Debug 8 - Available lead IDs:', scheduledNotifications.map(n => n.content.data?.leadId).filter(id => id));
          throw new Error('Notification was not properly scheduled');
        }
        
        console.log('=== Notification scheduling completed successfully ===\n');
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
    if (!leadName || !contactNo) {
      Alert.alert('Error', 'Please enter name and contact number');
      return;
    }

    try {
      console.log('Adding new lead...');
      
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 2);
      defaultDate.setHours(10, 0, 0, 0);
      
      const leadData = {
        name: leadName,
        contactNo,
        source: source || '',
        category: category || 'Follow up with',
        location: location || '',
        alertTime: alertTime ? alertTime.toISOString() : defaultDate.toISOString(),
        photo: selectedPhoto,
      };

      console.log('Lead data to be saved:', leadData);
      console.log('Alert time:', leadData.alertTime);

      if (editingLead) {
        console.log('Updating existing lead:', editingLead.id);
        const notificationId = await scheduleNotification(leadData, editingLead.id);
        dispatch(updateLead({ ...leadData, id: editingLead.id, notificationId }));
      } else {
        console.log('Creating new lead');
        const tempId = Date.now().toString();
        const notificationId = await scheduleNotification(leadData, tempId);
        dispatch(addLead({ ...leadData, id: tempId, notificationId }));
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
    setSelectedPhoto(lead.photo);
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
              console.log('\n=== Starting lead deletion ===');
              console.log('Lead ID to delete:', leadId);
              
              // Get the lead from Redux store to ensure we have the correct ID and notificationId
              const lead = leads.find(l => l.id === leadId);
              if (!lead) {
                console.error('Lead not found in Redux store');
                return;
              }
              
              console.log('Found lead in Redux store:', lead);
              
              // Use the stored notificationId for cancellation
              if (lead.notificationId) {
                await cancelNotification(lead.notificationId);
              }
              
              dispatch(deleteLead(leadId));
              
              console.log('=== Lead deletion completed ===\n');
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
    setSelectedPhoto(null);
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 2);
    defaultDate.setHours(10, 0, 0, 0);
    setAlertTime(defaultDate);
  };

  const getFilteredLeads = () => {
    // If showing archived alerts, return filtered archived alerts
    if (showArchived) {
      return archivedAlerts
        .filter(lead => {
          // Apply the search filter
          return lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.contactNo.includes(searchQuery) ||
            lead.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.location.toLowerCase().includes(searchQuery.toLowerCase());
        })
        .sort((a, b) => {
          const dateA = new Date(a.alertTime);
          const dateB = new Date(b.alertTime);
          return dateB - dateA; // Sort by most recent first
        });
    }
    
    // Otherwise, return filtered active leads
    const now = new Date();
    return leads
      .filter(lead => {
        // First apply the search filter
        const matchesSearch = 
          lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.contactNo.includes(searchQuery) ||
          lead.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.location.toLowerCase().includes(searchQuery.toLowerCase());

        // Then apply the alert status filter
        const alertTime = new Date(lead.alertTime);
        const isTriggered = alertTime < now || completedAlerts[lead.id];
        
        switch (alertFilter) {
          case 'pending':
            return matchesSearch && !isTriggered;
          case 'triggered':
            return matchesSearch && isTriggered;
          default:
            return matchesSearch;
        }
      })
      .sort((a, b) => {
        const dateA = new Date(a.alertTime);
        const dateB = new Date(b.alertTime);
        return dateA - dateB;
      });
  };

  const handleAddResponse = async (leadId) => {
    if (!responseText.trim()) {
      Alert.alert('Error', 'Please enter a response');
      return;
    }

    try {
      console.log('Starting handleAddResponse for lead:', leadId);
      
      // Get the lead from Redux store
      const lead = leads.find(l => l.id === leadId);
      if (!lead) {
        console.error('Lead not found:', leadId);
        Alert.alert('Error', 'Lead not found');
        return;
      }

      console.log('Current lead data:', lead);
      console.log('Current alert time:', lead.alertTime);

      // Calculate new alert time (1 day from now at 10 AM)
      const newAlertTime = new Date();
      newAlertTime.setDate(newAlertTime.getDate() + 1);
      newAlertTime.setHours(10, 0, 0, 0);
      console.log('New alert time:', newAlertTime.toISOString());

      // Cancel existing notification if it exists
      if (lead.notificationId) {
        console.log('Canceling existing notification:', lead.notificationId);
        await cancelNotification(lead.notificationId);
      }

      // Schedule new notification
      console.log('Scheduling new notification...');
      const notificationId = await scheduleNotification(
        { ...lead, alertTime: newAlertTime.toISOString() },
        leadId
      );
      console.log('New notification scheduled with ID:', notificationId);

      // Update lead with new response and alert time
      console.log('Dispatching updates...');
      dispatch(addResponse({ leadId, response: responseText.trim() }));
      dispatch(rescheduleAlert({ 
        leadId, 
        newAlertTime: newAlertTime.toISOString(),
        notificationId 
      }));

      // Clear the response input and close the input box
      setResponseText('');
      setShowResponseInput(null);

      // Show success message
      if (Platform.OS === 'android') {
        ToastAndroid.show('Response added and alert rescheduled', ToastAndroid.SHORT);
      } else {
        Alert.alert('Success', 'Response added and alert rescheduled');
      }

      console.log('handleAddResponse completed successfully');
    } catch (error) {
      console.error('Error in handleAddResponse:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
      Alert.alert('Error', 'Failed to add response. Please try again.');
    }
  };

  const handleReschedule = async (lead) => {
    try {
      if (rescheduleDate <= new Date()) {
        Alert.alert('Error', 'Please select a future date and time');
        return;
      }

      // Cancel existing notification
      if (lead.notificationId) {
        await cancelNotification(lead.notificationId);
      }

      // Schedule new notification
      const notificationId = await scheduleNotification(
        { ...lead, alertTime: rescheduleDate.toISOString() },
        lead.id
      );

      // Update lead with new alert time and notification ID
      dispatch(rescheduleAlert({ 
        leadId: lead.id, 
        newAlertTime: rescheduleDate.toISOString(),
        notificationId 
      }));

      setShowReschedulePicker(false);
      setSelectedLeadForReschedule(null);
      setShowDatePicker(false);
      setShowTimePicker(false);
    } catch (error) {
      console.error('Error rescheduling alert:', error);
      Alert.alert('Error', 'Failed to reschedule alert. Please try again.');
    }
  };

  const handleReschedulePress = (lead) => {
    setSelectedLeadForReschedule(lead);
    setRescheduleDate(new Date(lead.alertTime));
    setShowReschedulePicker(true);
  };

  const handleDateTimeChange = (event, selectedDate) => {
    setShowDateTimePicker(false);
    if (selectedDate) {
      setRescheduleDate(selectedDate);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (showReschedulePicker) {
        const newDate = new Date(rescheduleDate);
        newDate.setFullYear(selectedDate.getFullYear());
        newDate.setMonth(selectedDate.getMonth());
        newDate.setDate(selectedDate.getDate());
        setRescheduleDate(newDate);
      } else {
        const newDate = new Date(alertTime);
        newDate.setFullYear(selectedDate.getFullYear());
        newDate.setMonth(selectedDate.getMonth());
        newDate.setDate(selectedDate.getDate());
        setAlertTime(newDate);
      }
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      if (showReschedulePicker) {
        const newDate = new Date(rescheduleDate);
        newDate.setHours(selectedTime.getHours());
        newDate.setMinutes(selectedTime.getMinutes());
        setRescheduleDate(newDate);
      } else {
        const newDate = new Date(alertTime);
        newDate.setHours(selectedTime.getHours());
        newDate.setMinutes(selectedTime.getMinutes());
        setAlertTime(newDate);
      }
    }
  };

  const showPicker = (mode) => {
    if (Platform.OS === 'android') {
      setPickerMode(mode);
      if (mode === 'date') {
        setShowDatePicker(true);
        setShowTimePicker(false);
      } else {
        setShowTimePicker(true);
        setShowDatePicker(false);
      }
    } else {
      setPickerMode(mode);
      setShowDatePicker(true);
      setShowTimePicker(false);
    }
  };

  // Function to parse natural language message
  const parseMessage = (message) => {
    console.log('Starting message parsing...');
    console.log('Original message:', message);

    const timeRegex = /(?:^|\s)(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)(?:\s|$)/i;
    const callRegex = /(?:to\s+)?call\s+(?:with\s+)?([a-zA-Z]+)/i;
    const todayRegex = /(?:^|\s)(today)(?:\s|$)/i;
    const tomorrowRegex = /(?:^|\s)(tomorrow)(?:\s|$)/i;
    const phoneRegex = /(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4,})(?: *x\d+)?/;
    const hashtagRegex = /#(\w+)/g;
    
    // Add day-related regex patterns
    const dayRegex = /(?:^|\s)(mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?|weekend)(?:\s|$)/i;
    const nextWeekRegex = /next\s+week/i;

    let date = new Date();
    let name = '';
    let contactNo = '';
    let category = 'Follow up with';
    let source = '';
    let location = '';
    let timeSpecified = false;
    let daySpecified = false;
    let processedMessage = message;

    console.log('Initial date:', date.toLocaleString());

    // Extract time first
    const timeMatch = message.match(timeRegex);
    if (timeMatch) {
      console.log('Time match found:', timeMatch);
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const period = timeMatch[3]?.toLowerCase();

      // Convert to 24-hour format
      if (period === 'pm') {
        if (hours !== 12) {
          hours += 12;
        }
      } else if (period === 'am' && hours === 12) {
        hours = 0;
      }

      date.setHours(hours, minutes, 0, 0);
      timeSpecified = true;
      // Remove time from the message
      processedMessage = processedMessage.replace(timeRegex, ' ').trim();
      console.log('Time specified, final date:', date.toLocaleString());
    }

    // Check for today
    const todayMatch = message.match(todayRegex);
    if (todayMatch) {
      console.log('Today specified');
      daySpecified = true;
      // Remove 'today' from the message
      processedMessage = processedMessage.replace(todayRegex, ' ').trim();
      console.log('Today specified, final date:', date.toLocaleString());
    }

    // Check for tomorrow
    const tomorrowMatch = message.match(tomorrowRegex);
    if (tomorrowMatch && !daySpecified) {
      console.log('Tomorrow specified');
      date.setDate(date.getDate() + 1);
      daySpecified = true;
      // Remove 'tomorrow' from the message
      processedMessage = processedMessage.replace(tomorrowRegex, ' ').trim();
      console.log('Tomorrow specified, final date:', date.toLocaleString());
    }

    // Check for day-related patterns
    const dayMatch = message.match(dayRegex);
    if (dayMatch && !daySpecified) {
      const dayStr = dayMatch[1].toLowerCase();
      console.log('Day match found:', dayStr);
      
      // Get current day of week (0-6, where 0 is Sunday)
      const currentDay = date.getDay();
      let targetDay;
      
      if (dayStr === 'weekend') {
        // If it's already weekend, set for next weekend
        if (currentDay === 0 || currentDay === 6) {
          targetDay = 6; // Next Saturday
          date.setDate(date.getDate() + (6 - currentDay + 7));
        } else {
          targetDay = 6; // This Saturday
          date.setDate(date.getDate() + (6 - currentDay));
        }
      } else {
        // Map day names to numbers (0-6)
        const dayMap = {
          'sun': 0, 'sunday': 0,
          'mon': 1, 'monday': 1,
          'tue': 2, 'tuesday': 2,
          'wed': 3, 'wednesday': 3,
          'thu': 4, 'thursday': 4,
          'fri': 5, 'friday': 5,
          'sat': 6, 'saturday': 6
        };
        
        targetDay = dayMap[dayStr];
        
        // Calculate days to add
        let daysToAdd = targetDay - currentDay;
        if (daysToAdd <= 0) {
          daysToAdd += 7; // Move to next week
        }
        date.setDate(date.getDate() + daysToAdd);
      }
      
      daySpecified = true;
      // Remove day specification from the message
      processedMessage = processedMessage.replace(dayRegex, ' ').trim();
      console.log('Day specified, final date:', date.toLocaleString());
    }

    // Check for next week
    const nextWeekMatch = message.match(nextWeekRegex);
    if (nextWeekMatch && !daySpecified) {
      date.setDate(date.getDate() + 7);
      daySpecified = true;
      // Remove next week from the message
      processedMessage = processedMessage.replace(nextWeekRegex, ' ').trim();
      console.log('Next week specified, final date:', date.toLocaleString());
    }

    // If no time was specified, set default to 10 AM
    if (!timeSpecified) {
      date.setHours(10, 0, 0, 0);
      console.log('No time specified, setting default to 10 AM');
    }

    // Only set default 2-day schedule if no day was specified
    if (!daySpecified) {
      date.setDate(date.getDate() + 2);
      console.log('No day specified, setting default reminder for 2 days later at 10 AM:', date.toLocaleString());
    }

    // Clean up the processed message by removing any remaining time/date patterns
    processedMessage = processedMessage
      .replace(/\d{1,2}(?::\d{2})?\s*(?:am|pm)/gi, '') // Remove any remaining time patterns
      .replace(/\b(today|tomorrow|next week|weekend|mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b/gi, '') // Remove any remaining day patterns
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim(); // Remove leading/trailing spaces

    // Check if message contains a phone number
    const trimmedMessage = processedMessage.trim();
    const phoneMatch = trimmedMessage.match(phoneRegex);
    
    if (phoneMatch) {
      console.log('Phone number detected:', phoneMatch[0]);
      // Format the phone number by removing non-digit characters and preserving all digits
      contactNo = phoneMatch[0].replace(/\D/g, '');
      
      // Extract name and categories from the message
      let remainingText = trimmedMessage.replace(phoneMatch[0], '').trim();
      
      // Check for hashtags that match available categories
      const hashtagMatches = [...remainingText.matchAll(hashtagRegex)];
      for (const match of hashtagMatches) {
        const hashtagValue = match[1].toLowerCase();
        
        // Check if the hashtag matches any available source
        const matchingSource = sources.find(s => s.toLowerCase() === hashtagValue);
        if (matchingSource) {
          source = matchingSource;
          remainingText = remainingText.replace(match[0], '').trim();
          continue;
        }
        
        // Check if the hashtag matches any available category
        const matchingCategory = categories.find(c => c.toLowerCase() === hashtagValue);
        if (matchingCategory) {
          category = matchingCategory;
          remainingText = remainingText.replace(match[0], '').trim();
          continue;
        }
        
        // Check if the hashtag matches any available location
        const matchingLocation = locations.find(l => l.toLowerCase() === hashtagValue);
        if (matchingLocation) {
          location = matchingLocation;
          remainingText = remainingText.replace(match[0], '').trim();
          continue;
        }
      }

      // Check for categories without hashtags
      for (const cat of categories) {
        if (remainingText.toLowerCase().includes(cat.toLowerCase())) {
          category = cat;
          remainingText = remainingText.replace(new RegExp(cat, 'i'), '').trim();
          break;
        }
      }
      
      // Check for sources without hashtags
      for (const src of sources) {
        if (remainingText.toLowerCase().includes(src.toLowerCase())) {
          source = src;
          remainingText = remainingText.replace(new RegExp(src, 'i'), '').trim();
          break;
        }
      }
      
      // Clean up the remaining text for the name
      name = remainingText
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim(); // Remove leading/trailing spaces
      
      // If no name remains after cleaning, use the phone number as name
      if (!name) {
        name = contactNo;
      }

      return {
        name,
        contactNo,
        date,
        category,
        source,
        location,
        isPhoneNumber: true
      };
    }

    // Extract name and category from call pattern
    const nameMatch = processedMessage.match(callRegex);
    if (nameMatch) {
      name = nameMatch[1];
      category = 'Call';
      console.log('Name extracted:', name);
      console.log('Category set to Call');
    }

    // Process the message to extract sources and categories
    // Check for category patterns
    const categoryPatterns = [
      { pattern: /call\s+(?:with\s+)?/i, category: 'Call' },
      { pattern: /follow\s+up\s+(?:with\s+)?/i, category: 'Follow up with' },
      { pattern: /send\s+lease\s+(?:to\s+)?/i, category: 'Send lease to' },
      { pattern: /landed/i, category: 'landed' },
      { pattern: /nuh-uh/i, category: 'Nuh-uh' }
    ];
    
    for (const { pattern, category: cat } of categoryPatterns) {
      if (pattern.test(processedMessage)) {
        category = cat;
        processedMessage = processedMessage.replace(pattern, '').trim();
        break;
      }
    }
    
    // Check for sources anywhere in the message
    for (const src of sources) {
      const srcRegex = new RegExp(`\\b${src}\\b`, 'i');
      if (srcRegex.test(processedMessage)) {
        source = src;
        processedMessage = processedMessage.replace(srcRegex, '').trim();
        break;
      }
    }
    
    // Check for locations anywhere in the message
    for (const loc of locations) {
      const locRegex = new RegExp(`\\b${loc}\\b`, 'i');
      if (locRegex.test(processedMessage)) {
        location = loc;
        processedMessage = processedMessage.replace(locRegex, '').trim();
        break;
      }
    }

    // If no name was extracted from call regex, use the processed message
    if (!name) {
      name = processedMessage.trim();
    }

    // If no time was specified, set default to 10 AM
    if (!timeSpecified) {
      date.setHours(10, 0, 0, 0);
    }

    // Only set default 2-day schedule if no day was specified
    if (!daySpecified && !timeSpecified) {
      date.setDate(date.getDate() + 2);
      console.log('No day specified, setting default reminder for 2 days later at 10 AM:', date.toLocaleString());
    }

    console.log('Final parsed data:', {
      name: name || trimmedMessage,
      contactNo,
      date,
      category,
      source,
      location
    });

    return {
      name: name || trimmedMessage,
      contactNo,
      date,
      category,
      source,
      location
    };
  };

  const handleChatSubmit = async () => {
    if (!chatMessage.trim() && !selectedPhoto) return;

    console.log('\n=== Starting chat message processing ===');
    console.log('Original message:', chatMessage);

    const parsedData = parseMessage(chatMessage);
    console.log('Parsed data:', {
      name: parsedData.name,
      contactNo: parsedData.contactNo,
      date: parsedData.date.toLocaleString(),
      category: parsedData.category,
      source: parsedData.source,
      location: parsedData.location
    });

    if (!parsedData.name) {
      console.log('Error: No name found in message');
      Alert.alert('Error', 'Could not identify the person to call. Please include a name in your message.');
      return;
    }

    // Create a date string that preserves local time
    const localDate = new Date(parsedData.date);
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const hours = String(localDate.getHours()).padStart(2, '0');
    const minutes = String(localDate.getMinutes()).padStart(2, '0');
    const seconds = String(localDate.getSeconds()).padStart(2, '0');
    
    // Create ISO string with local time (no timezone offset)
    const localDateString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

    const leadData = {
      name: parsedData.name,
      contactNo: parsedData.contactNo,
      source: parsedData.source || 'chat',
      category: parsedData.category,
      location: parsedData.location || '',
      alertTime: localDateString,
      photo: selectedPhoto,
    };

    console.log('Lead data to be created:', leadData);
    console.log('Alert time in local format:', localDateString);

    try {
      // Generate a temporary ID for the notification
      const tempId = Date.now().toString();
      console.log('Temporary ID for notification:', tempId);
      
      // Schedule notification first with the temporary ID
      console.log('Scheduling notification...');
      const notificationId = await scheduleNotification(leadData, tempId);

      // Then create the lead with the same ID
      console.log('Creating lead in Redux store...');
      dispatch(addLead({ ...leadData, id: tempId, notificationId }));

      setChatMessage('');
      setSelectedPhoto(null);
      setShowChatBox(false);
      console.log('=== Chat message processing completed ===\n');
    } catch (error) {
      console.error('Error in handleChatSubmit:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
      Alert.alert('Error', 'Failed to create alert. Please try again.');
    }
  };

  const cancelNotification = async (notificationId) => {
    try {
      console.log('\n=== Starting notification cancellation ===');
      console.log('Notification ID to cancel:', notificationId);
      console.log('Notification ID type:', typeof notificationId);
      
      // First, get all scheduled notifications
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log('Current scheduled notifications count:', scheduledNotifications.length);
      
      // Find our specific notification by looking for the exact identifier
      const notificationToCancel = scheduledNotifications.find(n => 
        n.identifier === notificationId.toString()
      );
      
      if (notificationToCancel) {
        console.log('Found notification to cancel:', JSON.stringify(notificationToCancel, null, 2));
        console.log('Notification identifier:', notificationToCancel.identifier);
        console.log('Notification data:', JSON.stringify(notificationToCancel.content.data, null, 2));
        
        await Notifications.cancelScheduledNotificationAsync(notificationToCancel.identifier);
        console.log('Successfully canceled notification');
        
        // Verify cancellation by checking all scheduled notifications again
        const updatedNotifications = await Notifications.getAllScheduledNotificationsAsync();
        const isStillScheduled = updatedNotifications.some(n => 
          n.identifier === notificationId.toString()
        );
        
        if (isStillScheduled) {
          console.error('Notification still exists after cancellation attempt');
          console.error('Remaining notifications:', JSON.stringify(updatedNotifications, null, 2));
          throw new Error('Failed to cancel notification');
        } else {
          console.log('Verification successful: Notification has been removed from scheduled notifications');
        }
      } else {
        console.log('No notification found with identifier:', notificationId);
        console.log('Available identifiers:', scheduledNotifications.map(n => n.identifier));
        console.log('Available lead IDs:', scheduledNotifications.map(n => n.content.data?.leadId).filter(id => id));
      }
      
      console.log('=== Notification cancellation completed ===\n');
    } catch (error) {
      console.error('Error in cancelNotification:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }
  };

  // Add notification listener
  useEffect(() => {
    console.log('Setting up notification listeners...');

    // This listener is called when a notification is received while the app is in the foreground
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('\n=== Notification received ===');
      console.log('Notification object:', JSON.stringify(notification, null, 2));
      console.log('Notification date:', new Date(notification.date).toLocaleString());
      console.log('Notification content:', JSON.stringify(notification.request.content, null, 2));
      console.log('Notification trigger:', JSON.stringify(notification.request.trigger, null, 2));
      console.log('Trigger date:', notification.request.trigger?.date?.toLocaleString());
      console.log('Current time when received:', new Date().toLocaleString());
      console.log('Time difference:', new Date().getTime() - notification.date);
      console.log('=== End of notification details ===\n');
      
      // Mark the alert as completed when notification is triggered
      const leadId = notification.request.content.data?.leadId;
      if (leadId) {
        setCompletedAlerts(prev => ({
          ...prev,
          [leadId]: true
        }));
      }
    });

    // This listener is called when a user taps on a notification
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('\n=== Notification response received ===');
      console.log('Response object:', JSON.stringify(response, null, 2));
      console.log('Notification date:', new Date(response.notification.date).toLocaleString());
      console.log('Action identifier:', response.actionIdentifier);
      console.log('User text:', response.userText);
      console.log('=== End of response details ===\n');
      
      // Mark the alert as completed when user interacts with notification
      const leadId = response.notification.request.content.data?.leadId;
      if (leadId) {
        setCompletedAlerts(prev => ({
          ...prev,
          [leadId]: true
        }));
      }
    });

    // Get initial notification
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        console.log('Last notification response:', JSON.stringify(response, null, 2));
        
        // Mark the alert as completed if it was the last notification
        const leadId = response.notification.request.content.data?.leadId;
        if (leadId) {
          setCompletedAlerts(prev => ({
            ...prev,
            [leadId]: true
          }));
        }
      }
    });

    // List all scheduled notifications on startup
    Notifications.getAllScheduledNotificationsAsync().then(notifications => {
      console.log('Initial scheduled notifications:', JSON.stringify(notifications, null, 2));
      notifications.forEach(notification => {
        console.log('Scheduled notification:', {
          id: notification.identifier,
          trigger: notification.trigger,
          scheduledTime: notification.trigger?.date?.toLocaleString() || 'N/A'
        });
      });
    });

    return () => {
      console.log('Cleaning up notification listeners...');
      subscription.remove();
      responseSubscription.remove();
    };
  }, []);

  const handleShowResponses = (lead) => {
    setSelectedLeadResponses(lead);
    setShowResponsesDialog(true);
  };

  const handleDeleteResponse = (leadId, responseIndex) => {
    Alert.alert(
      'Delete Response',
      'Are you sure you want to delete this response?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          onPress: () => {
            // Update the local state first
            if (selectedLeadResponses) {
              const updatedResponses = [...selectedLeadResponses.responses];
              updatedResponses.splice(responseIndex, 1);
              setSelectedLeadResponses({
                ...selectedLeadResponses,
                responses: updatedResponses
              });
            }
            
            // Then dispatch the Redux action
            dispatch(deleteResponse({ leadId, responseIndex }));
            
            if (Platform.OS === 'android') {
              ToastAndroid.show('Response deleted', ToastAndroid.SHORT);
            } else {
              Alert.alert('', 'Response deleted', [{ text: 'OK' }]);
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const renderLead = ({ item }) => {
    const swipeX = new Animated.Value(0);

    // Sort responses from latest to oldest
    const sortedResponses = item.responses ? [...item.responses].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    ) : [];

    // Determine if alert is completed or pending - only for active alerts
    const isCompleted = showArchived ? false : (completedAlerts[item.id] || new Date(item.alertTime) < new Date());
    const statusColor = isCompleted ? '#808080' : '#4CAF50'; // gray for completed, green for pending

    const handleLongPress = async () => {
      if (item.contactNo) {
        try {
          await Clipboard.setStringAsync(item.contactNo);
          if (Platform.OS === 'android') {
            ToastAndroid.show('Copied!', ToastAndroid.SHORT);
          } else {
            Alert.alert('', 'Copied!', [{ text: 'OK' }]);
          }
        } catch (error) {
          console.error('Error copying to clipboard:', error);
          if (Platform.OS === 'android') {
            ToastAndroid.show('Failed to copy', ToastAndroid.SHORT);
          } else {
            Alert.alert('', 'Failed to copy', [{ text: 'OK' }]);
          }
        }
      }
    };

    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) { // Only allow left swipe
          swipeX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -100) { // Swipe left more than 100 units
          Animated.timing(swipeX, {
            toValue: showArchived ? -100 : -200, // Different swipe distance for archived vs active
            duration: 200,
            useNativeDriver: true,
          }).start();
        } else {
          Animated.spring(swipeX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 5,
          }).start();
        }
      },
    });

    const handleCall = () => {
      if (item.contactNo) {
        Linking.openURL(`tel:${item.contactNo}`);
      }
    };

    return (
      <View style={styles.leadCardContainer}>
        <Animated.View
          style={[
            styles.swipeActionsContainer,
            showArchived && styles.archivedSwipeActionsContainer,
            {
              opacity: swipeX.interpolate({
                inputRange: showArchived ? [-100, -50, 0] : [-200, -100, 0],
                outputRange: [1, 0.5, 0],
              }),
            }
          ]}
        >
          {showArchived ? (
            <TouchableOpacity 
              style={[styles.swipeActionButton, styles.deleteButton, styles.archivedDeleteButton]}
              onPress={() => handleDeleteArchivedAlert(item.id)}
            >
              <Text style={styles.swipeActionText}>Delete</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity 
                style={[styles.swipeActionButton, styles.archiveButton]}
                onPress={() => handleArchiveAlert(item)}
              >
                <Text style={styles.swipeActionText}>Archive</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.swipeActionButton, styles.deleteButton]}
                onPress={() => handleDeleteLead(item.id)}
              >
                <Text style={styles.swipeActionText}>Delete</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.leadCard,
            {
              transform: [{ translateX: swipeX }],
              borderLeftWidth: showArchived ? 0 : 4, // Remove the colored border for archived alerts
              borderLeftColor: statusColor,
              opacity: showArchived ? 0.8 : 1,
            },
          ]}
        >
          <TouchableOpacity 
            style={styles.leadHeader}
            onPress={() => showArchived ? null : handleEditLead(item)}
            onLongPress={handleLongPress}
            activeOpacity={0.7}
          >
            <View style={styles.leadInfo}>
              <Text style={styles.leadName}>{item.name}</Text>
              {item.contactNo ? (
                <Text style={styles.leadContact}>{item.contactNo}</Text>
              ) : null}
              <View style={styles.leadDetails}>
                {item.category && (
                  <Text style={[styles.categoryTag, styles.categoryTagCategory]}>
                    {item.category}
                  </Text>
                )}
                {item.source && (
                  <Text style={[styles.categoryTag, styles.categoryTagSource]}>
                    {item.source}
                  </Text>
                )}
                {item.location && (
                  <Text style={[styles.categoryTag, styles.categoryTagLocation]}>
                    {item.location}
                  </Text>
                )}
              </View>
              {!showArchived && (
                <View style={styles.leadAlert}>
                  <Icon name="bell" size={14} color="#007AFF" />
                  <Text style={{ color: '#007AFF' }}>
                    {(() => {
                      const alertDate = new Date(item.alertTime);
                      const today = new Date();
                      
                      // Reset time components to compare only dates
                      const alertDateOnly = new Date(alertDate.getFullYear(), alertDate.getMonth(), alertDate.getDate());
                      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                      
                      const diffDays = Math.floor((alertDateOnly - todayOnly) / (1000 * 60 * 60 * 24));
                      
                      if (diffDays === 0) {
                        return `Today ${alertDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                      } else if (diffDays === 1) {
                        return `Tomorrow ${alertDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                      } else if (diffDays >= 2 && diffDays <= 7) {
                        // For dates within the next week, show day name
                        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        const dayName = dayNames[alertDate.getDay()];
                        return `${dayName} ${alertDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                      } else {
                        // For dates beyond next week, show full date
                        return alertDate.toLocaleString([], { 
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                      }
                    })()}
                  </Text>
                </View>
              )}
            </View>
            {item.photo && (
              <TouchableOpacity
                onPress={() => {
                  setPreviewPhoto(item.photo);
                  setShowPhotoPreview(true);
                }}
              >
                <Image
                  source={{ uri: item.photo }}
                  style={styles.leadPhoto}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* Response Section - Show only latest response */}
          {sortedResponses.length > 0 && (
            <TouchableOpacity 
              style={styles.responsesContainer}
              onPress={() => handleShowResponses(item)}
            >
              <View style={styles.responseItem}>
                <Text style={styles.responseText}>{sortedResponses[0].text}</Text>
                <Text style={styles.responseTime}>
                  {new Date(sortedResponses[0].timestamp).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </Text>
                {sortedResponses.length > 1 && (
                  <Text style={styles.moreResponsesText}>
                    +{sortedResponses.length - 1} more
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}

          {/* Response Input */}
          {showResponseInput === item.id && (
            <View style={styles.responseInputContainer}>
              <TextInput
                style={styles.responseInput}
                placeholder="Type your response..."
                value={responseText}
                onChangeText={setResponseText}
                multiline
              />
              <View style={styles.responseButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setResponseText('');
                    setShowResponseInput(null);
                  }}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={() => handleAddResponse(item.id)}
                >
                  <Text style={styles.buttonText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {showArchived ? (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => handleRestoreAlert(item)}
              >
                <Icon name="restore" size={24} color="#007AFF" />
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setShowResponseInput(item.id)}
                >
                  <Icon name="message-reply" size={24} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleReschedulePress(item)}
                >
                  <Icon name="calendar-clock" size={24} color="#FF9500" />
                </TouchableOpacity>
                {item.contactNo && (
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleCall(item.contactNo)}
                  >
                    <Icon name="phone" size={24} color="#34C759" />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </Animated.View>
      </View>
    );
  };

  const renderPhotoPreviewModal = () => (
    <Modal
      visible={showPhotoPreview}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {
        setShowPhotoPreview(false);
        scale.setValue(1);
        lastScale.current = 1;
      }}
    >
      <GestureHandlerRootView style={styles.photoPreviewModal}>
        <TouchableOpacity
          style={styles.closePhotoPreview}
          onPress={() => {
            setShowPhotoPreview(false);
            scale.setValue(1);
            lastScale.current = 1;
          }}
        >
          <Icon name="close" size={24} color="white" />
        </TouchableOpacity>
        <PinchGestureHandler
          ref={pinchRef}
          onGestureEvent={Animated.event(
            [{ nativeEvent: { scale: scale } }],
            { useNativeDriver: true }
          )}
          onHandlerStateChange={event => {
            if (event.nativeEvent.oldState === State.ACTIVE) {
              const newScale = lastScale.current * event.nativeEvent.scale;
              lastScale.current = Math.min(Math.max(newScale, 1), 5);
              scale.setValue(lastScale.current);
            }
          }}
        >
          <Animated.View style={styles.zoomContainer}>
            <Animated.Image
              source={{ uri: previewPhoto }}
              style={[
                styles.fullPhoto,
                {
                  transform: [{ scale: scale }]
                }
              ]}
              resizeMode="contain"
            />
          </Animated.View>
        </PinchGestureHandler>
      </GestureHandlerRootView>
    </Modal>
  );

  // Add photo picker function
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Disable cropping/editing
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleQuickTimeSelect = (option) => {
    const now = new Date();
    let newDate = new Date(now);

    switch (option) {
      case 'evening':
        newDate.setHours(17, 30, 0, 0);
        break;
      case 'tomorrow':
        newDate.setDate(now.getDate() + 1);
        newDate.setHours(10, 0, 0, 0);
        break;
      case 'after2days':
        newDate.setDate(now.getDate() + 2);
        newDate.setHours(10, 0, 0, 0);
        break;
      case 'nextweek':
        newDate.setDate(now.getDate() + 7);
        newDate.setHours(10, 0, 0, 0);
        break;
    }

    setRescheduleDate(newDate);
    setShowDatePicker(false);
    setShowTimePicker(false);
  };

  // Add this function before the return statement
  const getFilterIcon = () => {
    switch (alertFilter) {
      case 'pending':
        return 'clock-outline';
      case 'triggered':
        return 'check-circle-outline';
      default:
        return 'filter-variant';
    }
  };

  // Add this function before the return statement
  const getFilterLabel = () => {
    switch (alertFilter) {
      case 'pending':
        return 'Pending Alerts';
      case 'triggered':
        return 'Triggered Alerts';
      default:
        return 'All Alerts';
    }
  };

  // Add this function before the return statement
  const handleFilterToggle = () => {
    switch (alertFilter) {
      case 'all':
        setAlertFilter('pending');
        break;
      case 'pending':
        setAlertFilter('triggered');
        break;
      case 'triggered':
        setAlertFilter('all');
        break;
      default:
        setAlertFilter('all');
    }
  };

  // Add this function to handle archiving alerts
  const handleArchiveAlert = async (lead) => {
    try {
      // Cancel notification if it exists
      if (lead.notificationId) {
        await cancelNotification(lead.notificationId);
      }
      
      // Add to archived alerts
      setArchivedAlerts(prev => [...prev, lead]);
      
      // Remove from active leads
      dispatch(deleteLead(lead.id));
      
      // Show success message
      if (Platform.OS === 'android') {
        ToastAndroid.show('Alert archived', ToastAndroid.SHORT);
      } else {
        Alert.alert('Success', 'Alert archived');
      }
    } catch (error) {
      console.error('Error archiving alert:', error);
      Alert.alert('Error', 'Failed to archive alert. Please try again.');
    }
  };

  // Add this function to handle restoring archived alerts
  const handleRestoreAlert = (lead) => {
    // Remove from archived alerts
    setArchivedAlerts(prev => prev.filter(item => item.id !== lead.id));
    
    // Add back to active leads
    dispatch(addLead(lead));
    
    // Show success message
    if (Platform.OS === 'android') {
      ToastAndroid.show('Alert restored', ToastAndroid.SHORT);
    } else {
      Alert.alert('Success', 'Alert restored');
    }
  };

  // Add this function to handle deleting archived alerts
  const handleDeleteArchivedAlert = (leadId) => {
    Alert.alert(
      'Delete Archived Alert',
      'Are you sure you want to permanently delete this archived alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setArchivedAlerts(prev => prev.filter(item => item.id !== leadId));
            
            if (Platform.OS === 'android') {
              ToastAndroid.show('Alert deleted', ToastAndroid.SHORT);
            } else {
              Alert.alert('Success', 'Alert deleted');
            }
          },
        },
      ]
    );
  };

  // Add this function to toggle between active and archived alerts
  const toggleArchivedView = () => {
    setShowArchived(!showArchived);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigation.replace('Login');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Dashboard</Text>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Icon name="logout" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
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
              <Text style={styles.sectionTitle}>
                {showArchived ? 'Archived Alerts' : 'Alerts'}
              </Text>
              <View style={styles.headerButtons}>
                {!showArchived && (
                  <TouchableOpacity 
                    style={styles.filterIconButton}
                    onPress={handleFilterToggle}
                  >
                    <Icon name={getFilterIcon()} size={24} color="#007AFF" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={[styles.filterIconButton, showArchived && styles.activeFilterButton]}
                  onPress={toggleArchivedView}
                >
                  <Icon name="archive" size={24} color={showArchived ? "#007AFF" : "#007AFF"} />
                </TouchableOpacity>
              </View>
            </View>

            {showChatBox && (
              <View style={styles.chatBox}>
                <View style={styles.chatInputContainer}>
                  <TextInput
                    style={styles.chatInput}
                    placeholder="Type your alert message (e.g., 'call Justin tomorrow 8pm')"
                    value={chatMessage}
                    onChangeText={setChatMessage}
                    multiline
                  />
                  <TouchableOpacity
                    style={styles.photoButton}
                    onPress={pickImage}
                  >
                    <Icon name="paperclip" size={22} color="#666" />
                  </TouchableOpacity>
                </View>
                {selectedPhoto && (
                  <View style={styles.selectedPhotoContainer}>
                    <Image
                      source={{ uri: selectedPhoto }}
                      style={styles.selectedPhoto}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => setSelectedPhoto(null)}
                    >
                      <Icon name="close" size={18} color="white" />
                    </TouchableOpacity>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.chatSubmitButton}
                  onPress={handleChatSubmit}
                >
                  <Text style={styles.chatSubmitText}>Create Alert</Text>
                </TouchableOpacity>
              </View>
            )}

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
                data={getFilteredLeads()}
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
            <TouchableOpacity
              style={[styles.fab, styles.chatFab]}
              onPress={() => setShowChatBox(!showChatBox)}
            >
              <Icon name={showChatBox ? "close" : "chat"} size={24} color="white" />
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

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter name"
                  value={leadName}
                  onChangeText={setLeadName}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Contact</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter contact"
                  value={contactNo}
                  onChangeText={setContactNo}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Source</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={source}
                    onValueChange={setSource}
                    style={styles.picker}
                    itemStyle={{ fontSize: 14, height: 55 }}
                  >
                    <Picker.Item label="Select Source" value="" />
                    {sources.map((src) => (
                      <Picker.Item 
                        key={src} 
                        label={src.split(' ')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                          .join(' ')} 
                        value={src} 
                      />
                    ))}
                  </Picker>
                </View>
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={category}
                    onValueChange={setCategory}
                    style={styles.picker}
                    itemStyle={{ fontSize: 14, height: 55 }}
                  >
                    <Picker.Item label="Select Category" value="" />
                    {categories.map((cat) => (
                      <Picker.Item key={cat} label={cat} value={cat} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={location}
                  onValueChange={setLocation}
                  style={styles.picker}
                  itemStyle={{ fontSize: 14, height: 55 }}
                >
                  <Picker.Item label="Select Location" value="" />
                  {locations.map((loc) => (
                    <Picker.Item key={loc} label={loc} value={loc} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.dateTimeContainer}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  setPickerMode('date');
                  if (Platform.OS === 'android') {
                    setShowDatePicker(true);
                    setShowTimePicker(false);
                  } else {
                    setShowDateTimePicker(true);
                  }
                }}
              >
                <Text style={styles.dateButtonText}>
                  {alertTime.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  setPickerMode('time');
                  if (Platform.OS === 'android') {
                    setShowTimePicker(true);
                    setShowDatePicker(false);
                  } else {
                    setShowDateTimePicker(true);
                  }
                }}
              >
                <Text style={styles.dateButtonText}>
                  {alertTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            {(showDatePicker || showTimePicker) && Platform.OS === 'android' && (
              <DateTimePicker
                value={alertTime}
                mode={pickerMode}
                is24Hour={true}
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  setShowTimePicker(false);
                  if (selectedDate) {
                    setAlertTime(selectedDate);
                  }
                }}
              />
            )}

            {showDateTimePicker && Platform.OS === 'ios' && (
              <DateTimePicker
                value={alertTime}
                mode={pickerMode}
                display="spinner"
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setAlertTime(selectedDate);
                  }
                  setShowDateTimePicker(false);
                }}
              />
            )}

            <View style={styles.photoUploadContainer}>
              <TouchableOpacity
                style={styles.photoUploadButton}
                onPress={pickImage}
              >
                <Icon name="camera" size={24} color="#007AFF" />
                <Text style={styles.photoUploadText}>
                  {selectedPhoto ? 'Change Photo' : 'Add Photo'}
                </Text>
              </TouchableOpacity>
              {selectedPhoto && (
                <Image
                  source={{ uri: selectedPhoto }}
                  style={styles.photoPreview}
                  resizeMode="cover"
                />
              )}
            </View>

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

      {/* Reschedule Modal */}
      <Modal
        visible={showReschedulePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowReschedulePicker(false);
          setSelectedLeadForReschedule(null);
          setShowDatePicker(false);
          setShowTimePicker(false);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reschedule Alert</Text>
            
            <View style={styles.quickTimeOptions}>
              <TouchableOpacity
                style={styles.quickTimeButton}
                onPress={() => handleQuickTimeSelect('evening')}
              >
                <Text style={styles.quickTimeText}>Evening (5:30 PM)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickTimeButton}
                onPress={() => handleQuickTimeSelect('tomorrow')}
              >
                <Text style={styles.quickTimeText}>Tomorrow (10 AM)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickTimeButton}
                onPress={() => handleQuickTimeSelect('after2days')}
              >
                <Text style={styles.quickTimeText}>After 2 Days (10 AM)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickTimeButton}
                onPress={() => handleQuickTimeSelect('nextweek')}
              >
                <Text style={styles.quickTimeText}>Next Week (10 AM)</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dateTimeContainer}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  Date: {rescheduleDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  Time: {rescheduleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={rescheduleDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={rescheduleDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setShowReschedulePicker(false);
                  setSelectedLeadForReschedule(null);
                  setShowDatePicker(false);
                  setShowTimePicker(false);
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={() => {
                  if (selectedLeadForReschedule) {
                    handleReschedule(selectedLeadForReschedule);
                  }
                  setShowDatePicker(false);
                  setShowTimePicker(false);
                }}
              >
                <Text style={styles.buttonText}>Reschedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Responses Dialog */}
      <Modal
        visible={showResponsesDialog}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowResponsesDialog(false);
          setSelectedLeadResponses(null);
        }}
      >
        <View style={styles.dialogContainer}>
          <View style={styles.dialogContent}>
            <View style={styles.dialogHeader}>
              <Text style={styles.dialogTitle}>Responses</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowResponsesDialog(false);
                  setSelectedLeadResponses(null);
                }}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dialogResponses}>
              {selectedLeadResponses?.responses && [...selectedLeadResponses.responses]
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .map((response, index) => {
                  // Calculate the original index in the unsorted array
                  const originalIndex = selectedLeadResponses.responses.findIndex(r => 
                    r.timestamp === response.timestamp && r.text === response.text
                  );
                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.dialogResponseItem}
                      onLongPress={() => handleDeleteResponse(selectedLeadResponses.id, originalIndex)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.dialogResponseText}>{response.text}</Text>
                      <Text style={styles.dialogResponseTime}>
                        {new Date(response.timestamp).toLocaleString([], {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </View>
        </View>
      </Modal>
      {renderPhotoPreviewModal()}
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
    // Remove the border properties entirely
  },
  tabText: {
    marginTop: 2,
    color: '#666',
    fontSize: 11,
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '500',
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
    margin: 8,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  propertyInfo: {
    flex: 1,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  roomCount: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    borderRadius: 6,
    fontSize: 14,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  picker: {
    height: 55,
    width: '100%',
    marginVertical: -8,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 6,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
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
  leadCardContainer: {
    position: 'relative',
    marginBottom: 5,
  },
  leadCard: {
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 8,
    position: 'relative',
    zIndex: 1,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '500',
  },
  categoryTagLocation: {
    backgroundColor: '#E3F2FD',
    color: '#1976D2',
  },
  categoryTagSource: {
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
  },
  categoryTagCategory: {
    backgroundColor: '#FFF3E0',
    color: '#E65100',
  },
  leadAlert: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  responsesContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
  },
  responseItem: {
    backgroundColor: '#f5f5f5',
    padding: 6,
    borderRadius: 6,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  responseText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  responseTime: {
    fontSize: 11,
    color: '#666',
    minWidth: 50,
    textAlign: 'right',
  },
  responseInputContainer: {
    marginTop: 8,
  },
  responseInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    minHeight: 50,
    marginBottom: 8,
    fontSize: 13,
  },
  responseButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  chatBox: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
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
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
  },
  chatInput: {
    flex: 1,
    padding: 10,
    minHeight: 60,
  },
  photoButton: {
    padding: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#ddd',
    opacity: 0.8,
  },
  selectedPhotoContainer: {
    position: 'relative',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  selectedPhoto: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF3B30',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatSubmitButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  chatSubmitText: {
    color: 'white',
    fontWeight: 'bold',
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
  chatFab: {
    bottom: 86,
    backgroundColor: '#34C759',
  },
  swipeDeleteContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
    borderRadius: 8,
  },
  swipeDeleteText: {
    color: 'white',
    fontWeight: 'bold',
  },
  moreResponsesText: {
    fontSize: 11,
    color: '#007AFF',
    marginLeft: 8,
  },
  dialogContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
    padding: 16,
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  dialogResponses: {
    maxHeight: '80%',
  },
  dialogResponseItem: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  dialogResponseText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  dialogResponseTime: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    padding: 10,
  },
  clearButton: {
    padding: 10,
  },
  photoUploadContainer: {
    marginBottom: 12,
  },
  photoUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 6,
    borderStyle: 'dashed',
  },
  photoUploadText: {
    marginLeft: 8,
    color: '#007AFF',
    fontSize: 14,
  },
  photoPreview: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'center',
  },
  leadPhoto: {
    width: 60,
    height: 60,
    borderRadius: 5,
    marginLeft: 10,
  },
  photoPreviewModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closePhotoPreview: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  zoomContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPhoto: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },
  chatActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectedPhotoContainer: {
    position: 'relative',
    marginRight: 10,
  },
  selectedPhoto: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF3B30',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quickTimeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  quickTimeButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    width: '48%',
    alignItems: 'center',
  },
  quickTimeText: {
    color: '#007AFF',
    fontSize: 14,
    textAlign: 'center',
  },
  filterContainer: {
    marginHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  filterPicker: {
    height: 50,
    width: '100%',
    color: '#333',
    backgroundColor: 'transparent',
  },
  filterIconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterOption: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterOptionSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  filterOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '500',
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  activeFilterButton: {
    backgroundColor: '#E3F2FD',
  },
  swipeActionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 200,
    flexDirection: 'row',
    zIndex: 0,
    borderRadius: 8,
    overflow: 'hidden',
  },
  archivedSwipeActionsContainer: {
    width: 100, // Reduced width for archived alerts
  },
  swipeActionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  archivedDeleteButton: {
    width: 100, // Fixed width for archived delete button
  },
  archiveButton: {
    backgroundColor: '#8A2BE2',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  swipeActionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  signOutButton: {
    padding: 8,
  },
  roomStatus: {
    backgroundColor: 'white',
    padding: 6, // Reduced from 8
    borderRadius: 8,
    marginHorizontal: 4, // Reduced from 6
    marginBottom: 6, // Reduced from 8
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    minWidth: 120,
    overflow: 'hidden',
  },
  roomContent: {
    flexDirection: 'column',
    gap: 2, // Reduced from 4
    position: 'relative',
  },
  roomTypeLabel: {
    fontSize: 13, // Reduced from 14
    fontWeight: '600',
    color: '#333',
  },
  roomNumber: {
    fontSize: 15, // Reduced from 16
    fontWeight: 'bold',
    color: '#000',
  },
  duration: {
    fontSize: 12, // Reduced from 13
    fontWeight: '500',
  },
  vacantRoomContent: {
    opacity: 0.8,
  },
  stripedBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  stripe: {
    position: 'absolute',
    height: 1,
    backgroundColor: '#007AFF',
  },
  roomsContainer: {
    flexDirection: 'row',
    paddingVertical: 4, // Reduced from 8
    paddingHorizontal: 2, // Reduced from 4
  },
});

export default DashboardScreen; 