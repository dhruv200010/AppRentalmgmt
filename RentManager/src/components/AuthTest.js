import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../config/firebase';
import firebaseService from '../services/firebaseService';

const AuthTest = () => {
  const [status, setStatus] = useState('');
  const navigation = useNavigation();

  const handleSignOut = async () => {
    try {
      setStatus('Signing out...');
      await firebaseService.signOut();
      setStatus('Sign out successful');
      // Navigate to Login screen after successful sign out
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      console.error('Sign out error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Auth Status: {auth.currentUser ? 'Signed In' : 'Signed Out'}</Text>
      {auth.currentUser && <Text style={styles.text}>User ID: {auth.currentUser.uid}</Text>}
      <Text style={styles.status}>{status}</Text>
      <Button 
        title="Test Sign Out" 
        onPress={handleSignOut} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    margin: 10,
  },
  text: {
    fontSize: 16,
    marginBottom: 8,
  },
  status: {
    fontSize: 16,
    marginTop: 8,
    color: '#666',
  },
});

export default AuthTest; 