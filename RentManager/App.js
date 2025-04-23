import React from 'react';
import { SafeAreaView, StatusBar, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider } from 'react-redux';
import { store } from './src/store';
import DashboardScreen from './src/screens/DashboardScreen';
import PropertyScreen from './src/screens/PropertyScreen';
import RoomScreen from './src/screens/RoomScreen';
import LeadScreen from './src/screens/LeadScreen';
import { enableScreens } from 'react-native-screens';

enableScreens();

const Stack = createNativeStackNavigator();

export default function App() {
  return (
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
              options={({ navigation }) => ({ 
                title: 'Rent Manager',
                headerRight: () => (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Property', { isNew: true })}
                    style={styles.addButton}
                  >
                    <Text style={styles.addButtonText}>Add Property</Text>
                  </TouchableOpacity>
                ),
              })}
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
            <Stack.Screen 
              name="Lead" 
              component={LeadScreen}
              options={{ title: 'Lead Details' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  addButton: {
    marginRight: 15,
  },
  addButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
}); 