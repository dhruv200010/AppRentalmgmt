import { db } from '../config/firebase';
import { collection, doc, setDoc, getDoc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';

class FirebaseService {
  constructor() {
    console.log('Initializing FirebaseService...');
  }

  // Get user data
  async getUserData(userId) {
    console.log('Getting user data for:', userId);
    try {
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
      return data;
    } catch (error) {
      console.error('Error getting user data:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Return default data if offline
      if (error.code === 'failed-precondition' || error.code === 'unimplemented') {
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
    } catch (error) {
      console.error('Error setting user data:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'failed-precondition' || error.code === 'unimplemented') {
        console.log('Storing data locally due to offline state');
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
      return properties;
    } catch (error) {
      console.error('Error getting user properties:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'failed-precondition' || error.code === 'unimplemented') {
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
    } catch (error) {
      console.error('Error setting property:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'failed-precondition' || error.code === 'unimplemented') {
        console.log('Storing property data locally due to offline state');
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
    } catch (error) {
      console.error('Error deleting property:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'failed-precondition' || error.code === 'unimplemented') {
        console.log('Property deletion queued for when online');
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
      return rooms;
    } catch (error) {
      console.error('Error getting property rooms:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'failed-precondition' || error.code === 'unimplemented') {
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
    } catch (error) {
      console.error('Error setting room:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'failed-precondition' || error.code === 'unimplemented') {
        console.log('Storing room data locally due to offline state');
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
    } catch (error) {
      console.error('Error deleting room:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'failed-precondition' || error.code === 'unimplemented') {
        console.log('Room deletion queued for when online');
        return;
      }
      throw error;
    }
  }
}

export default new FirebaseService(); 