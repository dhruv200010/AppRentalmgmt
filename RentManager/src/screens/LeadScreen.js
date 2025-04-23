import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Picker } from '@react-native-picker/picker';
import { addLead, updateLead, deleteLead } from '../store/slices/propertySlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const LEAD_SOURCES = [
  'Roomies',
  'Facebook',
  'Roomster',
  'Telegram',
  'Sulekha',
  'WhatsApp',
  'Others',
];

const LeadScreen = ({ route }) => {
  const { propertyId } = route.params;
  const dispatch = useDispatch();
  const property = useSelector((state) =>
    state.properties.properties.find((p) => p.id === propertyId)
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [source, setSource] = useState('');

  const handleAddLead = () => {
    if (!name || !contact || !source) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const leadData = {
      name,
      contact,
      source,
    };

    if (editingLead) {
      dispatch(
        updateLead({
          propertyId,
          leadId: editingLead.id,
          leadData,
        })
      );
    } else {
      dispatch(
        addLead({
          propertyId,
          ...leadData,
        })
      );
    }

    setModalVisible(false);
    resetForm();
  };

  const handleEditLead = (lead) => {
    setEditingLead(lead);
    setName(lead.name);
    setContact(lead.contact);
    setSource(lead.source);
    setModalVisible(true);
  };

  const handleDeleteLead = (leadId) => {
    Alert.alert(
      'Delete Lead',
      'Are you sure you want to delete this lead?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch(deleteLead({ propertyId, leadId })),
        },
      ]
    );
  };

  const resetForm = () => {
    setEditingLead(null);
    setName('');
    setContact('');
    setSource('');
  };

  const renderLead = ({ item }) => (
    <View style={styles.leadCard}>
      <View style={styles.leadHeader}>
        <Text style={styles.leadName}>{item.name}</Text>
        <View style={styles.leadActions}>
          <TouchableOpacity onPress={() => handleEditLead(item)}>
            <Icon name="pencil" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteLead(item.id)}>
            <Icon name="delete" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.leadContact}>Contact: {item.contact}</Text>
      <Text style={styles.leadSource}>Source: {item.source}</Text>
      <Text style={styles.leadDate}>
        Added: {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          resetForm();
          setModalVisible(true);
        }}
      >
        <Text style={styles.addButtonText}>Add Lead</Text>
      </TouchableOpacity>

      <FlatList
        data={property?.leads || []}
        renderItem={renderLead}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingLead ? 'Edit Lead' : 'Add Lead'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Name"
              value={name}
              onChangeText={setName}
            />

            <TextInput
              style={styles.input}
              placeholder="Contact Number"
              value={contact}
              onChangeText={setContact}
              keyboardType="phone-pad"
            />

            <Picker
              selectedValue={source}
              onValueChange={setSource}
              style={styles.picker}
            >
              <Picker.Item label="Select Source" value="" />
              {LEAD_SOURCES.map((src) => (
                <Picker.Item key={src} label={src} value={src} />
              ))}
            </Picker>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleAddLead}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  addButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    gap: 15,
  },
  leadCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  leadName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  leadActions: {
    flexDirection: 'row',
    gap: 15,
  },
  leadContact: {
    fontSize: 16,
    marginBottom: 5,
  },
  leadSource: {
    fontSize: 16,
    marginBottom: 5,
  },
  leadDate: {
    fontSize: 14,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 5,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default LeadScreen; 