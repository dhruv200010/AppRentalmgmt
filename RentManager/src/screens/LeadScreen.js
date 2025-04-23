import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { addLead, updateLead } from '../store/slices/leadSlice';

const LeadScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const leads = useSelector((state) => state.leads.leads);
  const properties = useSelector((state) => state.properties.properties);

  const [lead, setLead] = useState({
    id: '',
    propertyId: '',
    name: '',
    contactNo: '',
    source: 'roomies',
    notes: '',
  });

  useEffect(() => {
    if (route.params?.leadId) {
      const existingLead = leads.find(l => l.id === route.params.leadId);
      if (existingLead) {
        setLead(existingLead);
      }
    } else if (route.params?.propertyId) {
      setLead(prev => ({ ...prev, propertyId: route.params.propertyId }));
    }
  }, [route.params?.leadId, route.params?.propertyId, leads]);

  const handleSave = () => {
    if (lead.id) {
      dispatch(updateLead(lead));
    } else {
      const newLead = {
        ...lead,
        id: Date.now().toString(),
      };
      dispatch(addLead(newLead));
    }
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Lead Name</Text>
        <TextInput
          style={styles.input}
          value={lead.name}
          onChangeText={(text) => setLead({ ...lead, name: text })}
          placeholder="Enter lead name"
        />

        <Text style={styles.label}>Contact Number</Text>
        <TextInput
          style={styles.input}
          value={lead.contactNo}
          onChangeText={(text) => setLead({ ...lead, contactNo: text })}
          placeholder="Enter contact number"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Source</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={lead.source}
            onValueChange={(value) => setLead({ ...lead, source: value })}
            style={styles.picker}
          >
            <Picker.Item label="Roomies" value="roomies" />
            <Picker.Item label="Facebook" value="fb" />
            <Picker.Item label="Roomster" value="roomster" />
            <Picker.Item label="Telegram" value="telegram" />
            <Picker.Item label="Sulekha" value="sulekha" />
            <Picker.Item label="WhatsApp" value="whatsapp" />
            <Picker.Item label="Others" value="others" />
          </Picker>
        </View>

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={lead.notes}
          onChangeText={(text) => setLead({ ...lead, notes: text })}
          placeholder="Enter any additional notes"
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Lead</Text>
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
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
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

export default LeadScreen; 