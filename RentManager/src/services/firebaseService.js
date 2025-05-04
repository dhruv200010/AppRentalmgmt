import { db, auth } from '../config/firebase';
import { ref, set, get, update, remove, query, orderByChild, equalTo, onValue, off, push } from 'firebase/database';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

class FirebaseService {
  constructor() {
    this.connectionState = {
      connected: false,
      lastSync: null
    };
    this.initializeConnection = this.initializeConnection.bind(this);
    this.initializeConnection();
  }

  async initializeConnection() {
    try {
      console.log('Initializing Realtime Database connection...');
      const connectedRef = ref(db, '.info/connected');
      const handleConnectionChange = (snap) => {
        if (this.connectionState) {
          this.connectionState.connected = snap.val() === true;
          this.connectionState.lastSync = new Date().toISOString();
          console.log('Connection state changed:', this.connectionState.connected);
        }
      };
      onValue(connectedRef, handleConnectionChange);
      console.log('Realtime Database connection initialized');
    } catch (error) {
      console.error('Error initializing connection:', error);
    }
  }

  // Authentication methods
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('User signed in successfully:', userCredential.user.uid);
      return userCredential.user;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  async signUp(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created successfully:', userCredential.user.uid);
      return userCredential.user;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      await signOut(auth);
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // Get user data
  async getUserData(userId) {
    console.log('Getting user data for user:', userId);
    try {
      const userRef = ref(db, `users/${userId}`);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        console.log('No user data found, creating new user document');
        const initialData = {
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          userId
        };
        await this.setUserData(userId, initialData);
        return initialData;
      }
      
      const data = snapshot.val();
      console.log('Retrieved user data:', data);
      
      // Store in local storage for offline access
      await AsyncStorage.setItem(`user_${userId}`, JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Error getting user data:', error);
      
      // Try to get data from local storage if offline
      try {
        const localData = await AsyncStorage.getItem(`user_${userId}`);
        if (localData) {
          console.log('Retrieved user data from local storage');
          return JSON.parse(localData);
        }
      } catch (localError) {
        console.error('Error getting data from local storage:', localError);
      }
      
      console.log('Returning default data due to offline state');
      return {
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        userId
      };
    }
  }

  // Create or update user data
  async setUserData(userId, data) {
    console.log('Setting user data for user:', userId);
    console.log('Data to set:', data);
    
    try {
      const userData = {
        ...data,
        userId,
        updatedAt: new Date().toISOString()
      };
      
      await set(ref(db, `users/${userId}`), userData);
      console.log('User data set successfully');
      
      // Also store in local storage for offline access
      await AsyncStorage.setItem(`user_${userId}`, JSON.stringify(userData));
    } catch (error) {
      console.error('Error setting user data:', error);
      
      // Store in local storage if offline
      console.log('Storing data locally due to offline state');
      await AsyncStorage.setItem(`user_${userId}`, JSON.stringify(data));
    }
  }

  // Get properties for a specific user with real-time updates
  async getProperties(userId, callback) {
    console.log('=== Property Retrieval Start ===');
    console.log('User ID:', userId);
    
    try {
      console.log('Setting up real-time listener for properties...');
      const propertiesRef = ref(db, 'properties');
      const propertiesQuery = query(propertiesRef, orderByChild('userId'), equalTo(userId));
      
      // Set up real-time listener with retry logic
      const setupListener = () => {
        const unsubscribe = onValue(propertiesQuery, async (snapshot) => {
          if (!snapshot.exists()) {
            console.log('No properties found in Firebase');
            callback([]);
            return;
          }
          
          const properties = [];
          snapshot.forEach((childSnapshot) => {
            const property = childSnapshot.val();
            if (property && property.userId === userId) {
              properties.push({
                id: childSnapshot.key,
                ...property,
                rooms: property.rooms || [],
                lastSync: new Date().toISOString()
              });
            }
          });
          
          console.log(`✅ Real-time update: ${properties.length} properties`);
          console.log('Properties updated:', JSON.stringify(properties, null, 2));
          
          // Update local storage with fresh data
          console.log('Updating local storage with fresh data...');
          await AsyncStorage.setItem(`properties_${userId}`, JSON.stringify(properties));
          console.log('✅ Successfully updated local storage');
          
          // Call the callback with the updated properties
          callback(properties);
        }, (error) => {
          console.error('❌ Error in real-time listener:', error);
          // Try to reconnect after a delay
          setTimeout(() => {
            console.log('Attempting to reconnect...');
            setupListener();
          }, 5000);
        });
        
        return unsubscribe;
      };
      
      const unsubscribe = setupListener();
      console.log('=== Property Real-time Listener Setup Complete ===');
      return unsubscribe;
    } catch (error) {
      console.error('❌ Error setting up real-time listener:', error);
      // Fall back to local storage
      return this.getPropertiesFromLocalStorage(userId, callback);
    }
  }

  // Helper method to get properties from local storage
  async getPropertiesFromLocalStorage(userId, callback) {
    console.log('Attempting to retrieve properties from local storage...');
    try {
      const localData = await AsyncStorage.getItem(`properties_${userId}`);
      if (localData) {
        const properties = JSON.parse(localData);
        // Ensure each property has a rooms array
        const sanitizedProperties = properties.map(property => ({
          ...property,
          rooms: property.rooms || []
        }));
        console.log(`✅ Successfully retrieved ${sanitizedProperties.length} properties from local storage`);
        callback(sanitizedProperties);
        return () => {}; // Return empty cleanup function
      }
    } catch (localError) {
      console.error('❌ Error getting data from local storage:', localError);
    }
    
    console.log('No properties found in local storage');
    callback([]);
    return () => {}; // Return empty cleanup function
  }

  // Add or update a property with real-time sync
  async setProperty(userId, propertyId, data) {
    console.log('=== Property Creation/Update Start ===');
    console.log('User ID:', userId);
    console.log('Property ID:', propertyId);
    console.log('Property data to be saved:', JSON.stringify(data, null, 2));
    
    try {
      const propertyData = {
        ...data,
        userId,
        updatedAt: new Date().toISOString(),
        lastModifiedBy: userId,
        lastModifiedAt: new Date().toISOString(),
        lastSync: new Date().toISOString()
      };
      
      const propertyRef = ref(db, `properties/${propertyId}`);
      await set(propertyRef, propertyData);
      
      // Update local storage immediately
      await this.updateLocalProperty(userId, propertyId, propertyData);
      
      // Force a sync by triggering a value event
      const propertiesRef = ref(db, 'properties');
      const propertiesQuery = query(propertiesRef, orderByChild('userId'), equalTo(userId));
      const snapshot = await get(propertiesQuery);
      
      console.log('✅ Property saved successfully');
      console.log('=== Property Creation/Update Complete ===');
    } catch (error) {
      console.error('❌ Error saving property:', error);
      throw error;
    }
  }

  // Helper method to update local storage
  async updateLocalProperty(userId, propertyId, propertyData) {
    try {
      const localData = await AsyncStorage.getItem(`properties_${userId}`);
      let properties = [];
      
      if (localData) {
        properties = JSON.parse(localData);
        const index = properties.findIndex(p => p.id === propertyId);
        if (index !== -1) {
          properties[index] = { ...propertyData, id: propertyId };
        } else {
          properties.push({ ...propertyData, id: propertyId });
        }
      } else {
        properties = [{ ...propertyData, id: propertyId }];
      }
      
      await AsyncStorage.setItem(`properties_${userId}`, JSON.stringify(properties));
    } catch (error) {
      console.error('Error updating local storage:', error);
    }
  }

  // Delete a property
  async deleteProperty(propertyId, userId) {
    console.log('=== Property Deletion Start ===');
    console.log('Property ID:', propertyId);
    console.log('User ID:', userId);
    
    // Ensure we're working with plain strings
    const plainPropertyId = String(propertyId);
    const plainUserId = String(userId);
    
    try {
      // Create a plain Firebase reference
      const propertyRef = ref(db, `properties/${plainPropertyId}`);
      
      // Delete from Firebase using the plain reference
      await remove(propertyRef);
      console.log('✅ Property deleted successfully from Firebase');
      
      // Update local storage with plain values
      try {
        const localData = await AsyncStorage.getItem(`properties_${plainUserId}`);
        if (localData) {
          const properties = JSON.parse(localData);
          // Ensure we're comparing plain strings
          const updatedProperties = properties.filter(p => String(p.id) !== plainPropertyId);
          await AsyncStorage.setItem(`properties_${plainUserId}`, JSON.stringify(updatedProperties));
          console.log('✅ Local storage updated successfully');
        }
      } catch (localError) {
        console.error('❌ Error updating local storage:', localError);
      }
    } catch (error) {
      console.error('❌ Error deleting from Firebase:', error);
      
      // If Firebase deletion fails, still try to update local storage
      try {
        const localData = await AsyncStorage.getItem(`properties_${plainUserId}`);
        if (localData) {
          const properties = JSON.parse(localData);
          // Ensure we're comparing plain strings
          const updatedProperties = properties.filter(p => String(p.id) !== plainPropertyId);
          await AsyncStorage.setItem(`properties_${plainUserId}`, JSON.stringify(updatedProperties));
          console.log('✅ Local storage updated for offline deletion');
        }
      } catch (localError) {
        console.error('❌ Error updating local storage for offline deletion:', localError);
      }
    }
    
    console.log('=== Property Deletion Complete ===');
  }

  // Listen to real-time updates for properties
  listenToProperties(userId, callback) {
    console.log('Setting up property listener for user:', userId);
    const propertiesRef = ref(db, 'properties');
    const propertiesQuery = query(propertiesRef, orderByChild('userId'), equalTo(userId));
    
    const listener = onValue(propertiesQuery, async (snapshot) => {
      let properties = [];
      if (snapshot.exists()) {
        properties = Object.entries(snapshot.val()).map(([id, data]) => ({
          id,
          ...data,
          userId,
          lastSync: new Date().toISOString(),
          rooms: data.rooms || [] // Ensure rooms array exists
        }));
      }
      
      // Update local storage
      await AsyncStorage.setItem(`properties_${userId}`, JSON.stringify(properties));
      
      console.log(`Real-time property update received: ${properties.length} properties`);
      console.log('Property details:', JSON.stringify(properties, null, 2));
      callback(properties);
    });
    
    return () => {
      console.log('Cleaning up property listener');
      off(propertiesQuery, listener);
    };
  }

  // Get all properties for a user
  async getUserProperties(userId) {
    console.log('Getting properties for user:', userId);
    try {
      const propertiesRef = ref(db, 'properties');
      const propertiesQuery = query(propertiesRef, orderByChild('userId'), equalTo(userId));
      const snapshot = await get(propertiesQuery);
      
      if (!snapshot.exists()) {
        console.log('No properties found for user');
        return [];
      }
      
      const properties = [];
      snapshot.forEach((childSnapshot) => {
        properties.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      
      console.log(`Found ${properties.length} properties for user`);
      return properties;
    } catch (error) {
      console.error('Error getting user properties:', error);
      throw error;
    }
  }

  // Delete a room
  async deleteRoom(propertyId, roomId) {
    console.log('=== Room Deletion Start ===');
    console.log('Property ID:', propertyId);
    console.log('Room ID:', roomId);
    
    try {
      // Delete the room from the rooms collection
      const roomRef = ref(db, `rooms/${roomId}`);
      await remove(roomRef);
      console.log('✅ Room deleted successfully from Firebase');
      
      // Update the property's rooms array
      const propertyRef = ref(db, `properties/${propertyId}`);
      const propertySnapshot = await get(propertyRef);
      
      if (propertySnapshot.exists()) {
        const propertyData = propertySnapshot.val();
        const updatedRooms = (propertyData.rooms || []).filter(id => id !== roomId);
        await update(propertyRef, {
          rooms: updatedRooms,
          updatedAt: new Date().toISOString(),
          lastSync: new Date().toISOString()
        });
        console.log('✅ Property rooms array updated');
        
        // Update local storage
        try {
          const localData = await AsyncStorage.getItem(`properties_${propertyData.userId}`);
          if (localData) {
            const properties = JSON.parse(localData);
            const propertyIndex = properties.findIndex(p => p.id === propertyId);
            if (propertyIndex !== -1) {
              properties[propertyIndex].rooms = properties[propertyIndex].rooms.filter(id => id !== roomId);
              await AsyncStorage.setItem(`properties_${propertyData.userId}`, JSON.stringify(properties));
              console.log('✅ Local storage updated');
            }
          }
        } catch (localError) {
          console.error('Error updating local storage:', localError);
        }
      }
      
      console.log('=== Room Deletion Complete ===');
    } catch (error) {
      console.error('❌ Error deleting room:', error);
      throw error;
    }
  }

  // Get rooms for a specific property with real-time updates
  async getPropertyRooms(propertyId, userId, callback) {
    console.log('Setting up real-time room listener for property:', propertyId);
    try {
      const roomsRef = ref(db, 'rooms');
      const roomsQuery = query(roomsRef, orderByChild('propertyId'), equalTo(propertyId));
      
      const listener = onValue(roomsQuery, async (snapshot) => {
        if (!snapshot.exists()) {
          console.log('No rooms found for property');
          callback([]);
          return;
        }
        
        const rooms = [];
        snapshot.forEach((childSnapshot) => {
          const room = childSnapshot.val();
          if (room && room.userId === userId) {
            rooms.push({
              id: childSnapshot.key,
              ...room,
              lastSync: new Date().toISOString()
            });
          }
        });
        
        console.log(`Real-time room update: ${rooms.length} rooms for property ${propertyId}`);
        console.log('Rooms data:', JSON.stringify(rooms, null, 2));
        
        // Update local storage
        await AsyncStorage.setItem(`rooms_${propertyId}`, JSON.stringify(rooms));
        
        callback(rooms);
      }, (error) => {
        console.error('Error in room listener:', error);
      });
      
      // Return the unsubscribe function
      return () => {
        console.log('Cleaning up room listener for property:', propertyId);
        off(roomsQuery, listener);
      };
    } catch (error) {
      console.error('Error setting up room listener:', error);
      // Fall back to local storage
      try {
        const localData = await AsyncStorage.getItem(`rooms_${propertyId}`);
        if (localData) {
          const rooms = JSON.parse(localData);
          callback(rooms);
        } else {
          callback([]);
        }
      } catch (localError) {
        console.error('Error getting rooms from local storage:', localError);
        callback([]);
      }
      // Return an empty cleanup function
      return () => {};
    }
  }

  // Add or update a room
  async setRoom(propertyId, roomId, data, userId) {
    console.log('Setting room data:', roomId);
    try {
      const roomData = {
        ...data,
        propertyId,
        userId,
        updatedAt: new Date().toISOString()
      };
      
      await set(ref(db, `rooms/${roomId}`), roomData);
      console.log('Room data set successfully');
    } catch (error) {
      console.error('Error setting room data:', error);
      throw error;
    }
  }

  // Create a new property
  async createProperty(propertyData) {
    console.log('Creating new property');
    try {
      const newPropertyRef = push(ref(db, 'properties'));
      const propertyId = newPropertyRef.key;
      
      const property = {
        ...propertyData,
        id: propertyId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await set(newPropertyRef, property);
      console.log('Property created successfully:', propertyId);
      return property;
    } catch (error) {
      console.error('Error creating property:', error);
      throw error;
    }
  }

  // Create a new room
  async createRoom(roomData) {
    console.log('Creating new room');
    try {
      const newRoomRef = push(ref(db, 'rooms'));
      const roomId = newRoomRef.key;
      
      const room = {
        ...roomData,
        id: roomId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastSync: new Date().toISOString()
      };
      
      await set(newRoomRef, room);
      
      // Update the property's rooms array
      const propertyRef = ref(db, `properties/${roomData.propertyId}`);
      const propertySnapshot = await get(propertyRef);
      if (propertySnapshot.exists()) {
        const property = propertySnapshot.val();
        const updatedRooms = [...(property.rooms || []), roomId];
        await update(propertyRef, {
          rooms: updatedRooms,
          updatedAt: new Date().toISOString(),
          lastSync: new Date().toISOString()
        });
      }
      
      console.log('Room created successfully:', roomId);
      return room;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }
}

export default new FirebaseService();