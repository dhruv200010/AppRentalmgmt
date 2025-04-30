import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence, collection, doc, getDoc, initializeFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Debug Firebase initialization
console.log('Initializing Firebase...');

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCXlisiV-xSOZIka1SuOWPfIZ1oxhF18M8",
  authDomain: "ntmanager-d8562.firebaseapp.com",
  projectId: "ntmanager-d8562",
  storageBucket: "ntmanager-d8562.firebasestorage.app",
  messagingSenderId: "640916639753",
  appId: "1:640916639753:web:1c58de4d6baac4918428d8",
  measurementId: "G-H6L7N6KLWM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log('Firebase app initialized');

// Initialize Firestore with memory cache
const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  experimentalForceLongPolling: true
});
console.log('Firestore initialized with memory cache');

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
console.log('Firebase Auth initialized with AsyncStorage');

// Initialize Analytics only if supported
let analytics = null;
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

// Test Firestore connection
const testDoc = doc(collection(db, 'test'), 'test');
getDoc(testDoc)
  .then(() => {
    console.log('Firestore connection test successful');
  })
  .catch(err => {
    console.error('Firestore connection test failed:', err);
  });

export { app, db, auth, analytics }; 