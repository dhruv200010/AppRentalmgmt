import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import firebaseService from '../../services/firebaseService';

// Add this thunk action to load properties
export const loadProperties = createAsyncThunk(
  'properties/loadProperties',
  async (userId, { dispatch }) => {
    console.log('=== Loading Properties from Firebase ===');
    console.log('User ID:', userId);
    
    try {
      dispatch(setLoading(true));
      const properties = await firebaseService.getProperties(userId);
      console.log('✅ Properties loaded from Firebase:', properties);
      dispatch(setProperties(properties));
      return properties;
    } catch (error) {
      console.error('❌ Error loading properties:', error);
      dispatch(setError(error.message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const propertySlice = createSlice({
  name: 'properties',
  initialState: {
    properties: [],
    loading: false,
    error: null
  },
  reducers: {
    setProperties: (state, action) => {
      state.properties = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    addProperty: (state, action) => {
      console.log('=== Redux: Adding Property ===');
      console.log('Property data:', action.payload);
      
      const newProperty = {
        id: state.nextPropertyId,
        name: action.payload.name,
        rooms: [],
        userId: action.payload.userId
      };
      
      state.properties.push(newProperty);
      state.nextPropertyId += 1;
      
      // Also save to Firebase
      console.log('Attempting to save to Firebase...');
      firebaseService.createProperty(newProperty)
        .then(result => {
          console.log('✅ Property saved to Firebase:', result);
        })
        .catch(error => {
          console.error('❌ Error saving to Firebase:', error);
          state.error = error.message;
        });
    },
    updateProperty: (state, action) => {
      console.log('=== Redux: Updating Property ===');
      console.log('Update data:', action.payload);
      
      const index = state.properties.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.properties[index] = {
          ...state.properties[index],
          ...action.payload,
        };
        
        // Also update in Firebase
        console.log('Attempting to update in Firebase...');
        firebaseService.setProperty(
          action.payload.userId,
          action.payload.id,
          action.payload
        )
        .then(() => {
          console.log('✅ Property updated in Firebase');
        })
        .catch(error => {
          console.error('❌ Error updating in Firebase:', error);
          state.error = error.message;
        });
      }
    },
    deleteProperty: (state, action) => {
      console.log('=== Redux: Deleting Property ===');
      console.log('Property ID to delete:', action.payload);
      
      const property = state.properties.find(p => p.id === action.payload);
      if (property) {
        // Delete from Firebase first
        console.log('Attempting to delete from Firebase...');
        firebaseService.deleteProperty(action.payload, property.userId)
          .then(() => {
            console.log('✅ Property deleted from Firebase');
            state.properties = state.properties.filter(
              (property) => property.id !== action.payload
            );
          })
          .catch(error => {
            console.error('❌ Error deleting from Firebase:', error);
            state.error = error.message;
          });
      }
    },
    addRoom: (state, action) => {
      console.log('=== Redux: Adding Room ===');
      console.log('Room data:', action.payload);
      
      const { propertyId, ...roomData } = action.payload;
      const property = state.properties.find((p) => p.id === propertyId);
      if (property) {
        const newRoom = {
          ...roomData,
          id: (property.rooms.length + 1).toString(),
          status: roomData.status || 'Vacant',
          tenant: roomData.tenant || null,
          occupiedUntil: roomData.occupiedUntil || null,
        };
        property.rooms.push(newRoom);
        
        // Also save to Firebase
        console.log('Attempting to save room to Firebase...');
        firebaseService.createRoom({
          ...newRoom,
          propertyId,
          userId: property.userId
        })
        .then(result => {
          console.log('✅ Room saved to Firebase:', result);
        })
        .catch(error => {
          console.error('❌ Error saving room to Firebase:', error);
          state.error = error.message;
        });
      }
    },
    updateRoom: (state, action) => {
      console.log('=== Redux: Updating Room ===');
      console.log('Update data:', action.payload);
      
      const { propertyId, roomId, updates } = action.payload;
      const property = state.properties.find((p) => p.id === propertyId);
      if (property) {
        const roomIndex = property.rooms.findIndex((r) => r.id === roomId);
        if (roomIndex !== -1) {
          property.rooms[roomIndex] = {
            ...property.rooms[roomIndex],
            ...updates,
          };
          
          // Also update in Firebase
          console.log('Attempting to update room in Firebase...');
          firebaseService.setRoom(
            propertyId,
            roomId,
            updates,
            property.userId
          )
          .then(() => {
            console.log('✅ Room updated in Firebase');
          })
          .catch(error => {
            console.error('❌ Error updating room in Firebase:', error);
            state.error = error.message;
          });
        }
      }
    },
    deleteRoom: (state, action) => {
      console.log('=== Redux: Deleting Room ===');
      console.log('Delete data:', action.payload);
      
      const { propertyId, roomId } = action.payload;
      const property = state.properties.find((p) => p.id === propertyId);
      if (property) {
        const room = property.rooms.find(r => r.id === roomId);
        if (room) {
          // Delete from Firebase first
          console.log('Attempting to delete room from Firebase...');
          firebaseService.deleteRoom(roomId, property.userId)
            .then(() => {
              console.log('✅ Room deleted from Firebase');
              property.rooms = property.rooms.filter((room) => room.id !== roomId);
            })
            .catch(error => {
              console.error('❌ Error deleting room from Firebase:', error);
              state.error = error.message;
            });
        }
      }
    }
  }
});

export const {
  setProperties,
  setLoading,
  setError,
  addProperty,
  updateProperty,
  deleteProperty,
  addRoom,
  updateRoom,
  deleteRoom
} = propertySlice.actions;

export default propertySlice.reducer; 