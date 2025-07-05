import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUser } from '../context/UserContext';
import { Colors } from '../constants/Colors';
import { API_URL } from '../constants/Api';

interface EmergencyContact {
  id: number;
  name: string;
  phone_number: string;
  relationship: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { username, age, city, setUsername, token } = useUser();

  const [editAge, setEditAge] = useState(age ? age.toString() : '');
  const [editCity, setEditCity] = useState(city || '');
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentContact, setCurrentContact] = useState<EmergencyContact | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelationship, setContactRelationship] = useState('');

  useEffect(() => {
    setEditAge(age ? age.toString() : '');
    setEditCity(city || '');
  }, [age, city]);

  const fetchEmergencyContacts = useCallback(async () => {
    if (!username || !token) {
      console.log('No username or token available to fetch contacts.');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/emergency/contacts/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data: EmergencyContact[] = await response.json();
        setEmergencyContacts(data);
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.detail || 'No se pudieron cargar los contactos de emergencia.');
      }
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor para cargar contactos.');
    }
  }, [username, token]);

  useEffect(() => {
    fetchEmergencyContacts();
  }, [fetchEmergencyContacts]);

  const handleLogout = async () => {
    await clearUser();
    router.replace('/(auth)/index');
  };

  const handleSave = async () => {
    if (!username || !token) {
      Alert.alert('Error', 'No hay usuario logueado o token.');
      return;
    }

    if (!editAge.trim() || !editCity.trim()) {
      Alert.alert('Error', 'Por favor, completa todos los campos.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/profile/${username}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ age: parseInt(editAge.trim()), city: editCity.trim() }),
      });

      if (response.ok) {
        Alert.alert('Éxito', 'Perfil actualizado correctamente.');
        setUsername(username, parseInt(editAge.trim()), editCity.trim());
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.detail || 'No se pudo actualizar el perfil.');
      }
    } catch (error) {
      console.error('Error de red o servidor:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor. Inténtalo de nuevo más tarde.');
    }
  };

  const handleAddContact = () => {
    setCurrentContact(null);
    setContactName('');
    setContactPhone('');
    setContactRelationship('');
    setIsModalVisible(true);
  };

  const handleEditContact = (contact: EmergencyContact) => {
    setCurrentContact(contact);
    setContactName(contact.name);
    setContactPhone(contact.phone_number);
    setContactRelationship(contact.relationship);
    setIsModalVisible(true);
  };

  const handleDeleteContact = async (contactId: number) => {
    if (!username || !token) {
      Alert.alert('Error', 'No hay usuario logueado o token.');
      return;
    }
    Alert.alert(
      'Confirmar Eliminación',
      '¿Estás seguro de que quieres eliminar este contacto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/emergency/contacts/${contactId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              if (response.status === 204) {
                Alert.alert('Éxito', 'Contacto eliminado correctamente.');
                fetchEmergencyContacts(); // Recargar la lista
              } else {
                const errorData = await response.json();
                Alert.alert('Error', errorData.detail || 'No se pudo eliminar el contacto.');
              }
            } catch (error) {
              console.error('Error deleting contact:', error);
              Alert.alert('Error', 'No se pudo conectar con el servidor para eliminar el contacto.');
            }
          },
        },
      ]
    );
  };

  const handleSaveContact = async () => {
    if (!username || !token) {
      Alert.alert('Error', 'No hay usuario logueado o token.');
      return;
    }
    if (!contactName.trim() || !contactPhone.trim() || !contactRelationship.trim()) {
      Alert.alert('Error', 'Por favor, completa todos los campos del contacto.');
      return;
    }

    const contactData = {
      name: contactName.trim(),
      phone_number: contactPhone.trim(),
      relationship: contactRelationship.trim(),
    };

    try {
      let response;
      if (currentContact) {
        // Editar contacto existente
        response = await fetch(`${API_URL}/emergency/contacts/${currentContact.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(contactData),
        });
      } else {
        // Añadir nuevo contacto
        response = await fetch(`${API_URL}/emergency/contacts/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(contactData),
        });
      }

      if (response.ok) {
        Alert.alert('Éxito', `Contacto ${currentContact ? 'actualizado' : 'añadido'} correctamente.`);
        setIsModalVisible(false);
        fetchEmergencyContacts(); // Recargar la lista
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.detail || `No se pudo ${currentContact ? 'actualizar' : 'añadir'} el contacto.`);
      }
    } catch (error) {
      console.error('Error saving contact:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor para guardar el contacto.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/home')}>
          <Ionicons name="arrow-back" size={26} color={Colors.app.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
      </View>

      <ScrollView style={styles.scrollViewContent}>
        <View style={styles.contentContainer}>
          <Text style={styles.label}>Nombre de Usuario:</Text>
          <Text style={styles.value}>{username}</Text>

          <Text style={styles.label}>Edad:</Text>
          <TextInput
            style={styles.input}
            value={editAge}
            onChangeText={setEditAge}
            keyboardType="numeric"
            maxLength={3}
          />

          <Text style={styles.label}>Ciudad:</Text>
          <TextInput
            style={styles.input}
            value={editCity}
            onChangeText={setEditCity}
            autoCapitalize="words"
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
          </TouchableOpacity>

          {/* Sección de Contactos de Emergencia */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Contactos de Emergencia</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddContact}>
              <Text style={styles.addButtonText}>Añadir Contacto</Text>
            </TouchableOpacity>

            {emergencyContacts.length === 0 ? (
              <Text style={styles.noContactsText}>No hay contactos de emergencia registrados.</Text>
            ) : (
              emergencyContacts.map((contact) => (
                <View key={contact.id} style={styles.contactItem}>
                  <View>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactDetail}>Teléfono: {contact.phone_number}</Text>
                    <Text style={styles.contactDetail}>Relación: {contact.relationship}</Text>
                  </View>
                  <View style={styles.contactActions}>
                    <TouchableOpacity onPress={() => handleEditContact(contact)}>
                      <Ionicons name="create-outline" size={24} color={Colors.app.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteContact(contact.id)}>
                      <Ionicons name="trash-outline" size={24} color={Colors.app.red} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal para Añadir/Editar Contacto */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{currentContact ? 'Editar Contacto' : 'Añadir Nuevo Contacto'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              placeholderTextColor={Colors.app.mediumText}
              value={contactName}
              onChangeText={setContactName}
            />
            <TextInput
              style={styles.input}
              placeholder="Número de Teléfono"
              placeholderTextColor={Colors.app.mediumText}
              value={contactPhone}
              onChangeText={setContactPhone}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Relación (ej. Hijo, Vecino)"
              placeholderTextColor={Colors.app.mediumText}
              value={contactRelationship}
              onChangeText={setContactRelationship}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveContactButton]} onPress={handleSaveContact}>
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.app.lightGray },
  header: { width: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.light.tint, paddingVertical: 20, paddingHorizontal: 16, minHeight: 70 },
  headerTitle: { flex: 1, color: Colors.app.white, fontSize: 22, fontWeight: '700', marginLeft: 16 },
  scrollViewContent: { flex: 1, width: '100%' },
  contentContainer: { flex: 1, width: '100%', maxWidth: 500, padding: 20, alignSelf: 'center' },
  label: { fontSize: 16, fontWeight: 'bold', color: Colors.app.darkText, marginTop: 15, marginBottom: 5 },
  value: { fontSize: 18, color: Colors.app.mediumText, marginBottom: 15 },
  input: { width: '100%', borderWidth: 1, borderColor: Colors.app.gray1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Colors.app.white, fontSize: 18, color: Colors.app.black, marginBottom: 10 },
  saveButton: { backgroundColor: Colors.app.primary, paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 30 },
  saveButtonText: { color: Colors.app.white, fontSize: 18, fontWeight: '600' },

  // Estilos para Contactos de Emergencia
  sectionContainer: { marginTop: 40, borderTopWidth: 1, borderTopColor: Colors.app.gray1, paddingTop: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.app.darkText, marginBottom: 15 },
  addButton: { backgroundColor: Colors.app.secondary, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
  addButtonText: { color: Colors.app.white, fontSize: 16, fontWeight: '600' },
  noContactsText: { textAlign: 'center', color: Colors.app.mediumText, fontSize: 16, marginTop: 10 },
  contactItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.app.white, padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: Colors.app.gray1 },
  contactName: { fontSize: 18, fontWeight: 'bold', color: Colors.app.black },
  contactDetail: { fontSize: 14, color: Colors.app.mediumText },
  contactActions: { flexDirection: 'row', gap: 15 },

  // Estilos para el Modal
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', maxWidth: 400, backgroundColor: Colors.app.white, borderRadius: 10, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: Colors.app.darkText },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 20 },
  modalButton: { paddingVertical: 12, paddingHorizontal: 25, borderRadius: 8, alignItems: 'center', flex: 1, marginHorizontal: 5 },
  cancelButton: { backgroundColor: Colors.app.gray1 },
  saveContactButton: { backgroundColor: Colors.app.primary },
  modalButtonText: { color: Colors.app.white, fontSize: 16, fontWeight: '600' },

  logoutButton: {
    backgroundColor: Colors.app.red,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  logoutButtonText: {
    color: Colors.app.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
