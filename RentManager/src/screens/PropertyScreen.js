import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { addProperty, updateProperty } from '../store/slices/propertySlice';

const PropertyScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const properties = useSelector((state) => state.properties.properties);

  const [property, setProperty] = useState({
    id: '',
    name: '',
    address: '',
    description: '',
  });

  useEffect(() => {
    if (route.params?.propertyId) {
      const existingProperty = properties.find(p => p.id === route.params.propertyId);
      if (existingProperty) {
        setProperty(existingProperty);
      }
    }
  }, [route.params?.propertyId, properties]);

  const handleSave = () => {
    if (property.id) {
      dispatch(updateProperty(property));
    } else {
      const newProperty = {
        ...property,
        id: Date.now().toString(),
      };
      dispatch(addProperty(newProperty));
    }
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Property Name</Text>
        <TextInput
          style={styles.input}
          value={property.name}
          onChangeText={(text) => setProperty({ ...property, name: text })}
          placeholder="Enter property name"
        />

        <Text style={styles.label}>Address</Text>
        <TextInput
          style={styles.input}
          value={property.address}
          onChangeText={(text) => setProperty({ ...property, address: text })}
          placeholder="Enter property address"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={property.description}
          onChangeText={(text) => setProperty({ ...property, description: text })}
          placeholder="Enter property description"
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Property</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PropertyScreen; 