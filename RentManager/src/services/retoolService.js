import { retoolConfig, db } from '../config/retool';
import { ref, get, set, update, remove, query, orderByChild, equalTo, push } from 'firebase/database';

class RetoolService {
  constructor() {
    this.config = retoolConfig;
  }

  // User operations
  async getUser(userId) {
    try {
      const userRef = ref(db, `users/${userId}`);
      const snapshot = await get(userRef);
      if (!snapshot.exists()) {
        throw new Error('User not found');
      }
      return { id: userId, ...snapshot.val() };
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  async listUsers() {
    try {
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);
      return snapshot.val() ? Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data })) : [];
    } catch (error) {
      console.error('Error listing users:', error);
      throw error;
    }
  }

  async createUser(userData) {
    try {
      const userRef = ref(db, 'users');
      const newUserRef = push(userRef);
      await set(newUserRef, {
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { id: newUserRef.key, ...userData };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(userId, userData) {
    try {
      const userRef = ref(db, `users/${userId}`);
      await update(userRef, {
        ...userData,
        updatedAt: new Date().toISOString()
      });
      return { id: userId, ...userData };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      const userRef = ref(db, `users/${userId}`);
      await remove(userRef);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Property operations
  async getProperty(propertyId) {
    try {
      const propertyRef = ref(db, `properties/${propertyId}`);
      const snapshot = await get(propertyRef);
      if (!snapshot.exists()) {
        throw new Error('Property not found');
      }
      return { id: propertyId, ...snapshot.val() };
    } catch (error) {
      console.error('Error getting property:', error);
      throw error;
    }
  }

  async listProperties() {
    try {
      const propertiesRef = ref(db, 'properties');
      const snapshot = await get(propertiesRef);
      return snapshot.val() ? Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data })) : [];
    } catch (error) {
      console.error('Error listing properties:', error);
      throw error;
    }
  }

  async createProperty(propertyData) {
    try {
      const propertyRef = ref(db, 'properties');
      const newPropertyRef = push(propertyRef);
      await set(newPropertyRef, {
        ...propertyData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { id: newPropertyRef.key, ...propertyData };
    } catch (error) {
      console.error('Error creating property:', error);
      throw error;
    }
  }

  async updateProperty(propertyId, propertyData) {
    try {
      const propertyRef = ref(db, `properties/${propertyId}`);
      await update(propertyRef, {
        ...propertyData,
        updatedAt: new Date().toISOString()
      });
      return { id: propertyId, ...propertyData };
    } catch (error) {
      console.error('Error updating property:', error);
      throw error;
    }
  }

  async deleteProperty(propertyId) {
    try {
      const propertyRef = ref(db, `properties/${propertyId}`);
      await remove(propertyRef);
      return true;
    } catch (error) {
      console.error('Error deleting property:', error);
      throw error;
    }
  }

  // Room operations
  async getRoom(roomId) {
    try {
      const roomRef = ref(db, `rooms/${roomId}`);
      const snapshot = await get(roomRef);
      if (!snapshot.exists()) {
        throw new Error('Room not found');
      }
      return { id: roomId, ...snapshot.val() };
    } catch (error) {
      console.error('Error getting room:', error);
      throw error;
    }
  }

  async listRooms() {
    try {
      const roomsRef = ref(db, 'rooms');
      const snapshot = await get(roomsRef);
      return snapshot.val() ? Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data })) : [];
    } catch (error) {
      console.error('Error listing rooms:', error);
      throw error;
    }
  }

  async createRoom(roomData) {
    try {
      const roomRef = ref(db, 'rooms');
      const newRoomRef = push(roomRef);
      await set(newRoomRef, {
        ...roomData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { id: newRoomRef.key, ...roomData };
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }

  async updateRoom(roomId, roomData) {
    try {
      const roomRef = ref(db, `rooms/${roomId}`);
      await update(roomRef, {
        ...roomData,
        updatedAt: new Date().toISOString()
      });
      return { id: roomId, ...roomData };
    } catch (error) {
      console.error('Error updating room:', error);
      throw error;
    }
  }

  async deleteRoom(roomId) {
    try {
      const roomRef = ref(db, `rooms/${roomId}`);
      await remove(roomRef);
      return true;
    } catch (error) {
      console.error('Error deleting room:', error);
      throw error;
    }
  }
}

export default new RetoolService(); 