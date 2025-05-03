import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Retool configuration
const retoolConfig = {
  // Firebase configuration
  firebaseConfig: {
    apiKey: "AIzaSyCXlisiV-xSOZIka1SuOWPfIZ1oxhF18M8",
    authDomain: "ntmanager-d8562.firebaseapp.com",
    projectId: "ntmanager-d8562",
    storageBucket: "ntmanager-d8562.firebasestorage.app",
    messagingSenderId: "640916639753",
    appId: "1:640916639753:web:1c58de4d6baac4918428d8",
    measurementId: "G-H6L7N6KLWM",
    databaseURL: "https://ntmanager-d8562-default-rtdb.firebaseio.com"
  },

  // Retool API endpoints
  endpoints: {
    // Users
    users: {
      list: '/api/users',
      get: '/api/users/:id',
      create: '/api/users',
      update: '/api/users/:id',
      delete: '/api/users/:id'
    },
    // Properties
    properties: {
      list: '/api/properties',
      get: '/api/properties/:id',
      create: '/api/properties',
      update: '/api/properties/:id',
      delete: '/api/properties/:id'
    },
    // Rooms
    rooms: {
      list: '/api/rooms',
      get: '/api/rooms/:id',
      create: '/api/rooms',
      update: '/api/rooms/:id',
      delete: '/api/rooms/:id'
    }
  },

  // Retool query templates
  queries: {
    // User queries
    getUser: `
      const userRef = ref(db, 'users/{{userId}}');
      const snapshot = await get(userRef);
      return snapshot.val();
    `,
    listUsers: `
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);
      return snapshot.val() ? Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data })) : [];
    `,
    // Property queries
    getProperty: `
      const propertyRef = ref(db, 'properties/{{propertyId}}');
      const snapshot = await get(propertyRef);
      return snapshot.val();
    `,
    listProperties: `
      const propertiesRef = ref(db, 'properties');
      const snapshot = await get(propertiesRef);
      return snapshot.val() ? Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data })) : [];
    `,
    // Room queries
    getRoom: `
      const roomRef = ref(db, 'rooms/{{roomId}}');
      const snapshot = await get(roomRef);
      return snapshot.val();
    `,
    listRooms: `
      const roomsRef = ref(db, 'rooms');
      const snapshot = await get(roomsRef);
      return snapshot.val() ? Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data })) : [];
    `
  }
};

// Initialize Firebase for Retool
const app = initializeApp(retoolConfig.firebaseConfig);
const db = getDatabase(app);

export { retoolConfig, db }; 