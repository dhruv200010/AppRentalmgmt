import { db } from '../config/firebase';
import { ref, set, get, update, remove, query, orderByChild, equalTo, onValue, off } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/clerk-expo';

class FirebaseService {
  constructor() {
    this.initializeConnection();
  }

  async initializeConnection() {
    try {
      console.log('Initializing Realtime Database connection...');
      // Realtime Database automatically handles connection state
      console.log('Realtime Database connection initialized');
    } catch (error) {
      console.error('Error initializing connection:', error);
    }
  }

  // Get user data
  async getUserData(clerkUserId) {
    console.log('Getting user data for Clerk user:', clerkUserId);
    try {
      const userRef = ref(db, `users/${clerkUserId}`);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        console.log('No user data found, creating new user document');
        const initialData = {
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          clerkUserId
        };
        await this.setUserData(clerkUserId, initialData);
        return initialData;
      }
      
      const data = snapshot.val();
      console.log('Retrieved user data:', data);
      
      // Store in local storage for offline access
      await AsyncStorage.setItem(`user_${clerkUserId}`, JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Error getting user data:', error);
      
      // Try to get data from local storage if offline
      try {
        const localData = await AsyncStorage.getItem(`user_${clerkUserId}`);
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
        clerkUserId
      };
    }
  }

  // Create or update user data
  async setUserData(clerkUserId, data) {
    console.log('Setting user data for Clerk user:', clerkUserId);
    console.log('Data to set:', data);
    
    try {
      const userData = {
        ...data,
        clerkUserId,
        updatedAt: new Date().toISOString()
      };
      
      await set(ref(db, `users/${clerkUserId}`), userData);
      console.log('User data set successfully');
      
      // Also store in local storage for offline access
      await AsyncStorage.setItem(`user_${clerkUserId}`, JSON.stringify(userData));
    } catch (error) {
      console.error('Error setting user data:', error);
      
      // Store in local storage if offline
      console.log('Storing data locally due to offline state');
      await AsyncStorage.setItem(`user_${clerkUserId}`, JSON.stringify(data));
    }
  }

  // Get properties for a specific user
  async getProperties(clerkUserId) {
    console.log('Getting properties for Clerk user:', clerkUserId);
    try {
      const propertiesRef = ref(db, 'properties');
      const propertiesQuery = query(propertiesRef, orderByChild('clerkUserId'), equalTo(clerkUserId));
      const snapshot = await get(propertiesQuery);
      
      let properties = [];
      if (snapshot.exists()) {
        properties = Object.entries(snapshot.val()).map(([id, data]) => ({
          id,
          ...data,
          clerkUserId
        }));
      }
      
      console.log('Retrieved properties:', properties);
      
      // Store in local storage for offline access
      await AsyncStorage.setItem(`properties_${clerkUserId}`, JSON.stringify(properties));
      return properties;
    } catch (error) {
      console.error('Error getting properties:', error);
      
      // Try to get data from local storage if offline
      try {
        const localData = await AsyncStorage.getItem(`properties_${clerkUserId}`);
        if (localData) {
          console.log('Retrieved properties from local storage');
          return JSON.parse(localData);
        }
      } catch (localError) {
        console.error('Error getting properties from local storage:', localError);
      }
      
      console.log('Returning empty array due to offline state');
      return [];
    }
  }

  // Add or update a property
  async setProperty(clerkUserId, propertyId, data) {
    console.log('Setting property:', propertyId);
    console.log('Property data:', data);
    
    try {
      const propertyData = {
        ...data,
        clerkUserId,
        updatedAt: new Date().toISOString()
      };
      
      await set(ref(db, `properties/${propertyId}`), propertyData);
      console.log('Property set successfully');
      
      // Update local storage
      const properties = await this.getProperties(clerkUserId);
      const updatedProperties = properties.filter(p => p.id !== propertyId);
      updatedProperties.push({ id: propertyId, ...propertyData });
      await AsyncStorage.setItem(`properties_${clerkUserId}`, JSON.stringify(updatedProperties));
    } catch (error) {
      console.error('Error setting property:', error);
      
      // Store in local storage if offline
      console.log('Storing property data locally due to offline state');
      const properties = await this.getProperties(clerkUserId);
      const updatedProperties = properties.filter(p => p.id !== propertyId);
      updatedProperties.push({ id: propertyId, ...data, clerkUserId });
      await AsyncStorage.setItem(`properties_${clerkUserId}`, JSON.stringify(updatedProperties));
    }
  }

  // Delete a property
  async deleteProperty(propertyId, clerkUserId) {
    console.log('Deleting property:', propertyId);
    try {
      await remove(ref(db, `properties/${propertyId}`));
      console.log('Property deleted successfully');
      
      // Update local storage
      const properties = await this.getProperties(clerkUserId);
      const updatedProperties = properties.filter(p => p.id !== propertyId);
      await AsyncStorage.setItem(`properties_${clerkUserId}`, JSON.stringify(updatedProperties));
    } catch (error) {
      console.error('Error deleting property:', error);
      
      // Update local storage if offline
      console.log('Property deletion queued for when online');
      const properties = await this.getProperties(clerkUserId);
      const updatedProperties = properties.filter(p => p.id !== propertyId);
      await AsyncStorage.setItem(`properties_${clerkUserId}`, JSON.stringify(updatedProperties));
    }
  }

  // Listen to real-time updates for properties
  listenToProperties(clerkUserId, callback) {
    const propertiesRef = ref(db, 'properties');
    const propertiesQuery = query(propertiesRef, orderByChild('clerkUserId'), equalTo(clerkUserId));
    
    const listener = onValue(propertiesQuery, (snapshot) => {
      let properties = [];
      if (snapshot.exists()) {
        properties = Object.entries(snapshot.val()).map(([id, data]) => ({
          id,
          ...data,
          clerkUserId
        }));
      }
      callback(properties);
    });
    
    return () => off(propertiesQuery, listener);
  }

  // Get all properties for a user
  async getUserProperties(userId) {
    console.log('Getting properties for user:', userId);
    try {
      const propertiesRef = ref(db, 'properties');
      const propertiesQuery = query(propertiesRef, orderByChild('userId'), equalTo(userId));
      const snapshot = await get(propertiesQuery);
      
      let properties = [];
      if (snapshot.exists()) {
        properties = Object.entries(snapshot.val()).map(([id, data]) => ({
          id,
          ...data,
          userId
        }));
      }
      
      console.log('Retrieved properties:', properties);
      
      // Store in local storage for offline access
      await AsyncStorage.setItem(`properties_${userId}`, JSON.stringify(properties));
      return properties;
    } catch (error) {
      console.error('Error getting user properties:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'unavailable' || error.code === 'permission-denied') {
        console.log('Attempting to get properties from local storage...');
        try {
          const localData = await AsyncStorage.getItem(`properties_${userId}`);
          if (localData) {
            console.log('Retrieved properties from local storage');
            return JSON.parse(localData);
          }
        } catch (localError) {
          console.error('Error getting properties from local storage:', localError);
        }
        
        console.log('Returning empty array due to offline state');
        return [];
      }
      throw error;
    }
  }

  // Add or update a property
  async setProperty(userId, propertyId, data) {
    console.log('Setting property:', propertyId);
    console.log('Property data:', data);
    
    try {
      await set(ref(db, `properties/${propertyId}/userId`), userId);
      await set(ref(db, `properties/${propertyId}/updatedAt`), new Date().toISOString());
      console.log('Property set successfully');
      
      // Update local storage
      const properties = await this.getUserProperties(userId);
      const updatedProperties = properties.filter(p => p.id !== propertyId);
      updatedProperties.push({ id: propertyId, ...data, userId });
      await AsyncStorage.setItem(`properties_${userId}`, JSON.stringify(updatedProperties));
    } catch (error) {
      console.error('Error setting property:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'unavailable' || error.code === 'permission-denied') {
        console.log('Storing data locally due to offline state');
        const properties = await this.getUserProperties(userId);
        const updatedProperties = properties.filter(p => p.id !== propertyId);
        updatedProperties.push({ id: propertyId, ...data, userId });
        await AsyncStorage.setItem(`properties_${userId}`, JSON.stringify(updatedProperties));
        return;
      }
      throw error;
    }
  }

  // Delete a property
  async deleteProperty(propertyId, userId) {
    console.log('Deleting property:', propertyId);
    try {
      await remove(ref(db, `properties/${propertyId}/userId`));
      await remove(ref(db, `properties/${propertyId}/updatedAt`));
      console.log('Property deleted successfully');
      
      // Update local storage
      const properties = await this.getUserProperties(userId);
      const updatedProperties = properties.filter(p => p.id !== propertyId);
      await AsyncStorage.setItem(`properties_${userId}`, JSON.stringify(updatedProperties));
    } catch (error) {
      console.error('Error deleting property:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'unavailable' || error.code === 'permission-denied') {
        console.log('Property deletion queued for when online');
        const properties = await this.getUserProperties(userId);
        const updatedProperties = properties.filter(p => p.id !== propertyId);
        await AsyncStorage.setItem(`properties_${userId}`, JSON.stringify(updatedProperties));
        return;
      }
      throw error;
    }
  }

  // Get all rooms for a user
  async getUserRooms(userId) {
    console.log('Getting rooms for user:', userId);
    try {
      const roomsRef = ref(db, 'rooms');
      const roomsQuery = query(roomsRef, orderByChild('userId'), equalTo(userId));
      const snapshot = await get(roomsQuery);
      
      let rooms = [];
      if (snapshot.exists()) {
        rooms = Object.entries(snapshot.val()).map(([id, data]) => ({
          id,
          ...data,
          userId
        }));
      }
      
      console.log('Retrieved rooms:', rooms);
      
      // Store in local storage for offline access
      await AsyncStorage.setItem(`rooms_${userId}`, JSON.stringify(rooms));
      return rooms;
    } catch (error) {
      console.error('Error getting user rooms:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'unavailable' || error.code === 'permission-denied') {
        console.log('Attempting to get rooms from local storage...');
        try {
          const localData = await AsyncStorage.getItem(`rooms_${userId}`);
          if (localData) {
            console.log('Retrieved rooms from local storage');
            return JSON.parse(localData);
          }
        } catch (localError) {
          console.error('Error getting rooms from local storage:', localError);
        }
        
        console.log('Returning empty array due to offline state');
        return [];
      }
      throw error;
    }
  }

  // Get all rooms for a property
  async getPropertyRooms(propertyId, userId) {
    console.log('Getting rooms for property:', propertyId);
    try {
      const roomsRef = ref(db, 'rooms');
      const roomsQuery = query(roomsRef, orderByChild('propertyId'), equalTo(propertyId));
      const roomsQueryWithUserId = query(roomsQuery, orderByChild('userId'), equalTo(userId));
      const snapshot = await get(roomsQueryWithUserId);
      
      let rooms = [];
      if (snapshot.exists()) {
        rooms = Object.entries(snapshot.val()).map(([id, data]) => ({
          id,
          ...data,
          userId
        }));
      }
      
      console.log('Retrieved rooms:', rooms);
      
      // Store in local storage for offline access
      await AsyncStorage.setItem(`rooms_${propertyId}_${userId}`, JSON.stringify(rooms));
      return rooms;
    } catch (error) {
      console.error('Error getting property rooms:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'unavailable' || error.code === 'permission-denied') {
        console.log('Attempting to get rooms from local storage...');
        try {
          const localData = await AsyncStorage.getItem(`rooms_${propertyId}_${userId}`);
          if (localData) {
            console.log('Retrieved rooms from local storage');
            return JSON.parse(localData);
          }
        } catch (localError) {
          console.error('Error getting rooms from local storage:', localError);
        }
        
        console.log('Returning empty array due to offline state');
        return [];
      }
      throw error;
    }
  }

  // Add or update a room
  async setRoom(propertyId, roomId, data, userId) {
    console.log('Setting room:', roomId);
    console.log('Room data:', data);
    
    try {
      await set(ref(db, `rooms/${roomId}/propertyId`), propertyId);
      await set(ref(db, `rooms/${roomId}/userId`), userId);
      await set(ref(db, `rooms/${roomId}/updatedAt`), new Date().toISOString());
      console.log('Room set successfully');
      
      // Update local storage for both property-specific and user-specific storage
      const propertyRooms = await this.getPropertyRooms(propertyId, userId);
      const userRooms = await this.getUserRooms(userId);
      
      const updatedPropertyRooms = propertyRooms.filter(r => r.id !== roomId);
      updatedPropertyRooms.push({ id: roomId, ...data, propertyId, userId });
      await AsyncStorage.setItem(`rooms_${propertyId}_${userId}`, JSON.stringify(updatedPropertyRooms));
      
      const updatedUserRooms = userRooms.filter(r => r.id !== roomId);
      updatedUserRooms.push({ id: roomId, ...data, propertyId, userId });
      await AsyncStorage.setItem(`rooms_${userId}`, JSON.stringify(updatedUserRooms));
    } catch (error) {
      console.error('Error setting room:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'unavailable' || error.code === 'permission-denied') {
        console.log('Storing room data locally due to offline state');
        const propertyRooms = await this.getPropertyRooms(propertyId, userId);
        const userRooms = await this.getUserRooms(userId);
        
        const updatedPropertyRooms = propertyRooms.filter(r => r.id !== roomId);
        updatedPropertyRooms.push({ id: roomId, ...data, propertyId, userId });
        await AsyncStorage.setItem(`rooms_${propertyId}_${userId}`, JSON.stringify(updatedPropertyRooms));
        
        const updatedUserRooms = userRooms.filter(r => r.id !== roomId);
        updatedUserRooms.push({ id: roomId, ...data, propertyId, userId });
        await AsyncStorage.setItem(`rooms_${userId}`, JSON.stringify(updatedUserRooms));
        return;
      }
      throw error;
    }
  }

  // Delete a room
  async deleteRoom(roomId, userId) {
    console.log('Deleting room:', roomId);
    try {
      await remove(ref(db, `rooms/${roomId}/propertyId`));
      await remove(ref(db, `rooms/${roomId}/userId`));
      await remove(ref(db, `rooms/${roomId}/updatedAt`));
      console.log('Room deleted successfully');
      
      // Update local storage for both property-specific and user-specific storage
      const propertyRooms = await this.getPropertyRooms(propertyId, userId);
      const userRooms = await this.getUserRooms(userId);
      
      const updatedPropertyRooms = propertyRooms.filter(r => r.id !== roomId);
      await AsyncStorage.setItem(`rooms_${propertyId}_${userId}`, JSON.stringify(updatedPropertyRooms));
      
      const updatedUserRooms = userRooms.filter(r => r.id !== roomId);
      await AsyncStorage.setItem(`rooms_${userId}`, JSON.stringify(updatedUserRooms));
    } catch (error) {
      console.error('Error deleting room:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'unavailable' || error.code === 'permission-denied') {
        console.log('Room deletion queued for when online');
        const propertyRooms = await this.getPropertyRooms(propertyId, userId);
        const userRooms = await this.getUserRooms(userId);
        
        const updatedPropertyRooms = propertyRooms.filter(r => r.id !== roomId);
        await AsyncStorage.setItem(`rooms_${propertyId}_${userId}`, JSON.stringify(updatedPropertyRooms));
        
        const updatedUserRooms = userRooms.filter(r => r.id !== roomId);
        await AsyncStorage.setItem(`rooms_${userId}`, JSON.stringify(updatedUserRooms));
        return;
      }
      throw error;
    }
  }
}

export default new FirebaseService(); 