import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider } from 'react-redux';
import { store } from './src/store';
import DashboardScreen from './src/screens/DashboardScreen';
import PropertyScreen from './src/screens/PropertyScreen';
import RoomScreen from './src/screens/RoomScreen';
import { enableScreens } from 'react-native-screens';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

enableScreens();

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" />
          <NavigationContainer>
            <Stack.Navigator 
              initialRouteName="Dashboard"
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
                name="Dashboard" 
                component={DashboardScreen}
                options={{ title: 'Rent Manager' }}
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
          </NavigationContainer>
        </SafeAreaView>
      </Provider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
}); 