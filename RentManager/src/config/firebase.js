import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, update, remove, query, orderByChild, equalTo, onValue, off } from 'firebase/database';
import { getAnalytics, isSupported } from 'firebase/analytics';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Debug Firebase initialization
console.log('Starting Firebase initialization...');

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCXlisiV-xSOZIka1SuOWPfIZ1oxhF18M8",
  authDomain: "ntmanager-d8562.firebaseapp.com",
  projectId: "ntmanager-d8562",
  storageBucket: "ntmanager-d8562.firebasestorage.app",
  messagingSenderId: "640916639753",
  appId: "1:640916639753:web:1c58de4d6baac4918428d8",
  measurementId: "G-H6L7N6KLWM",
  databaseURL: "https://ntmanager-d8562-default-rtdb.firebaseio.com" // Your Realtime Database URL
};

// Initialize Firebase
console.log('Initializing Firebase app...');
const app = initializeApp(firebaseConfig);
console.log('Firebase app initialized successfully');

// Initialize Realtime Database
console.log('Initializing Realtime Database...');
const db = getDatabase(app);
console.log('Realtime Database initialized successfully');

// Initialize Analytics only if supported
let analytics = null;
console.log('Checking Analytics support...');
isSupported()
  .then(yes => {
    if (yes) {
      analytics = getAnalytics(app);
      console.log('Firebase Analytics initialized');
    } else {
      console.log('Firebase Analytics not supported in this environment');
    }
  })
  .catch(err => {
    console.error('Error initializing analytics:', err);
  });

export { app, db, analytics }; 