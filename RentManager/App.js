import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
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
  const { isSignedIn } = useAuth();

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
  return (
    <ClerkProvider 
      publishableKey={Constants.expoConfig.extra.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
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