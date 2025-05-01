import { db } from '../config/firebase';
import { collection, doc, setDoc, getDoc, updateDoc, deleteDoc, query, where, getDocs, enableNetwork, disableNetwork, waitForPendingWrites } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

class FirebaseService {
  constructor() {
    console.log('Initializing FirebaseService...');
    this.initializeConnection();
  }

  async initializeConnection() {
    try {
      console.log('Initializing Firestore connection...');
      await enableNetwork(db);
      console.log('Firestore network enabled');
    } catch (error) {
      console.error('Error initializing connection:', error);
    }
  }

  // Get user data
  async getUserData(userId) {
    console.log('Getting user data for:', userId);
    try {
      // Wait for any pending writes to complete
      await waitForPendingWrites(db);

      const userDoc = await getDoc(doc(collection(db, 'users'), userId));
      console.log('User document exists:', userDoc.exists());
      
      if (!userDoc.exists()) {
        console.log('No user data found, creating new user document');
        const initialData = {
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        await this.setUserData(userId, initialData);
        return initialData;
      }
      
      const data = userDoc.data();
      console.log('Retrieved user data:', data);
      
      // Store in local storage for offline access
      await AsyncStorage.setItem(`user_${userId}`, JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Error getting user data:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Try to get data from local storage if offline
      if (error.code === 'unavailable') {
        console.log('Attempting to get data from local storage...');
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
          lastLogin: new Date().toISOString()
        };
      }
      throw error;
    }
  }

  // Create or update user data
  async setUserData(userId, data) {
    console.log('Setting user data for:', userId);
    console.log('Data to set:', data);
    
    try {
      await setDoc(doc(collection(db, 'users'), userId), {
        ...data,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log('User data set successfully');
      
      // Also store in local storage for offline access
      await AsyncStorage.setItem(`user_${userId}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error setting user data:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'unavailable') {
        console.log('Storing data locally due to offline state');
        await AsyncStorage.setItem(`user_${userId}`, JSON.stringify(data));
        return;
      }
      throw error;
    }
  }

  // Get all properties for a user
  async getUserProperties(userId) {
    console.log('Getting properties for user:', userId);
    try {
      const propertiesRef = collection(db, 'properties');
      const q = query(propertiesRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const properties = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Retrieved properties:', properties);
      
      // Store in local storage for offline access
      await AsyncStorage.setItem(`properties_${userId}`, JSON.stringify(properties));
      return properties;
    } catch (error) {
      console.error('Error getting user properties:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'unavailable') {
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
      await setDoc(doc(collection(db, 'properties'), propertyId), {
        ...data,
        userId,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log('Property set successfully');
      
      // Update local storage
      const properties = await this.getUserProperties(userId);
      const updatedProperties = properties.filter(p => p.id !== propertyId);
      updatedProperties.push({ id: propertyId, ...data });
      await AsyncStorage.setItem(`properties_${userId}`, JSON.stringify(updatedProperties));
    } catch (error) {
      console.error('Error setting property:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'unavailable') {
        console.log('Storing property data locally due to offline state');
        const properties = await this.getUserProperties(userId);
        const updatedProperties = properties.filter(p => p.id !== propertyId);
        updatedProperties.push({ id: propertyId, ...data });
        await AsyncStorage.setItem(`properties_${userId}`, JSON.stringify(updatedProperties));
        return;
      }
      throw error;
    }
  }

  // Delete a property
  async deleteProperty(propertyId) {
    console.log('Deleting property:', propertyId);
    try {
      await deleteDoc(doc(collection(db, 'properties'), propertyId));
      console.log('Property deleted successfully');
      
      // Update local storage
      const properties = await this.getUserProperties(userId);
      const updatedProperties = properties.filter(p => p.id !== propertyId);
      await AsyncStorage.setItem(`properties_${userId}`, JSON.stringify(updatedProperties));
    } catch (error) {
      console.error('Error deleting property:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'unavailable') {
        console.log('Property deletion queued for when online');
        const properties = await this.getUserProperties(userId);
        const updatedProperties = properties.filter(p => p.id !== propertyId);
        await AsyncStorage.setItem(`properties_${userId}`, JSON.stringify(updatedProperties));
        return;
      }
      throw error;
    }
  }

  // Get all rooms for a property
  async getPropertyRooms(propertyId) {
    console.log('Getting rooms for property:', propertyId);
    try {
      const roomsRef = collection(db, 'rooms');
      const q = query(roomsRef, where('propertyId', '==', propertyId));
      const querySnapshot = await getDocs(q);
      const rooms = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Retrieved rooms:', rooms);
      
      // Store in local storage for offline access
      await AsyncStorage.setItem(`rooms_${propertyId}`, JSON.stringify(rooms));
      return rooms;
    } catch (error) {
      console.error('Error getting property rooms:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'unavailable') {
        console.log('Attempting to get rooms from local storage...');
        try {
          const localData = await AsyncStorage.getItem(`rooms_${propertyId}`);
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
  async setRoom(propertyId, roomId, data) {
    console.log('Setting room:', roomId);
    console.log('Room data:', data);
    
    try {
      await setDoc(doc(collection(db, 'rooms'), roomId), {
        ...data,
        propertyId,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log('Room set successfully');
      
      // Update local storage
      const rooms = await this.getPropertyRooms(propertyId);
      const updatedRooms = rooms.filter(r => r.id !== roomId);
      updatedRooms.push({ id: roomId, ...data });
      await AsyncStorage.setItem(`rooms_${propertyId}`, JSON.stringify(updatedRooms));
    } catch (error) {
      console.error('Error setting room:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'unavailable') {
        console.log('Storing room data locally due to offline state');
        const rooms = await this.getPropertyRooms(propertyId);
        const updatedRooms = rooms.filter(r => r.id !== roomId);
        updatedRooms.push({ id: roomId, ...data });
        await AsyncStorage.setItem(`rooms_${propertyId}`, JSON.stringify(updatedRooms));
        return;
      }
      throw error;
    }
  }

  // Delete a room
  async deleteRoom(roomId) {
    console.log('Deleting room:', roomId);
    try {
      await deleteDoc(doc(collection(db, 'rooms'), roomId));
      console.log('Room deleted successfully');
      
      // Update local storage
      const rooms = await this.getPropertyRooms(propertyId);
      const updatedRooms = rooms.filter(r => r.id !== roomId);
      await AsyncStorage.setItem(`rooms_${propertyId}`, JSON.stringify(updatedRooms));
    } catch (error) {
      console.error('Error deleting room:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'unavailable') {
        console.log('Room deletion queued for when online');
        const rooms = await this.getPropertyRooms(propertyId);
        const updatedRooms = rooms.filter(r => r.id !== roomId);
        await AsyncStorage.setItem(`rooms_${propertyId}`, JSON.stringify(updatedRooms));
        return;
      }
      throw error;
    }
  }
}

export default new FirebaseService(); 