import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useNavigation } from '@react-navigation/native';

const SignOutButton = () => {
  const { isLoaded, signOut } = useAuth();
  const navigation = useNavigation();
  
  if (!isLoaded) {
    return null;
  }
  
  const handleSignOut = async () => {
    try {
      console.log('Starting sign out process...');
      await signOut();
      console.log('Sign out successful');
      // Navigate to Login screen after successful sign out
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert(
        'Error',
        'Failed to sign out. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };
  
  return (
    <TouchableOpacity 
      onPress={handleSignOut}
      style={styles.button}
      activeOpacity={0.7}
    >
      <Text style={styles.buttonText}>Sign Out</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
  },
  buttonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  }
});

export default SignOutButton; 