import React, { useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider } from 'react-redux';
import { store } from './src/store';
import DashboardScreen from './src/screens/DashboardScreen';
import PropertyScreen from './src/screens/PropertyScreen';
import RoomScreen from './src/screens/RoomScreen';
import LoginScreen from './src/screens/LoginScreen';
import { enableScreens } from 'react-native-screens';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ClerkProvider, SignedIn, SignedOut, useAuth } from '@clerk/clerk-expo';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import 'react-native-gesture-handler';
import { app, auth } from './src/config/firebase';
import firebaseService from './src/services/firebaseService';

// Debug environment variables
console.log('Environment Variables:', {
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  Constants: Constants.expoConfig.extra
});

// Enable native screens for better performance
enableScreens();

const Stack = createNativeStackNavigator();

const tokenCache = {
  async getToken(key) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key, value) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

function NavigationContent() {
  const { isSignedIn, userId } = useAuth();

  // Sync user data with Firebase when signed in
  useEffect(() => {
    if (isSignedIn && userId) {
      const syncUserData = async () => {
        try {
          const userData = await firebaseService.getUserData(userId);
          if (!userData) {
            // Initialize user data in Firebase if it doesn't exist
            await firebaseService.setUserData(userId, {
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString()
            });
          } else {
            // Update last login time
            await firebaseService.setUserData(userId, {
              lastLogin: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Error syncing user data:', error);
        }
      };

      syncUserData();
    }
  }, [isSignedIn, userId]);

  return (
    <Stack.Navigator 
      initialRouteName={isSignedIn ? "Dashboard" : "Login"}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f5f5f5',
        },
        headerTintColor: '#000',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
          backgroundColor: '#f5f5f5',
        },
        animation: 'default',
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ 
          title: 'Rent Manager'
        }}
      />
      <Stack.Screen 
        name="Property" 
        component={PropertyScreen}
        options={{ title: 'Property Details' }}
      />
      <Stack.Screen 
        name="Room" 
        component={RoomScreen}
        options={{ title: 'Room Details' }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  // Get the publishable key from Constants
  const publishableKey = Constants.expoConfig.extra.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  // Debug the key
  console.log('Publishable Key:', publishableKey);
  
  if (!publishableKey) {
    console.error('Clerk publishable key is missing!');
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <Text>Error: Clerk publishable key is missing. Please check your configuration.</Text>
      </SafeAreaView>
    );
  }

  return (
    <ClerkProvider 
      publishableKey={publishableKey}
      tokenCache={tokenCache}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Provider store={store}>
          <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <NavigationContainer>
              <SignedIn>
                <NavigationContent />
              </SignedIn>
              <SignedOut>
                <NavigationContent />
              </SignedOut>
            </NavigationContainer>
          </SafeAreaView>
        </Provider>
      </GestureHandlerRootView>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
}); 