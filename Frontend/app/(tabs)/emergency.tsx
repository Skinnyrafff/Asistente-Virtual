import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Linking, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUser } from '../../context/UserContext';
import { API_URL } from '../../constants/Api';
import { Colors } from '../../constants/Colors';

interface EmergencyContact {
  id: number;
  name: string;
  phone_number: string;
  relationship: string;
}

export default function EmergencyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { username, token } = useUser();
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);

  const fetchEmergencyContacts = useCallback(async () => {
    if (!username || !token) {
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
      Alert.alert('Error', 'No se pudo conectar con el servidor para cargar contactos.');
    }
  }, [username, token]);

  useEffect(() => {
    fetchEmergencyContacts();
  }, [fetchEmergencyContacts]);

  const handleCallBomberos = () => {
    Alert.alert(
      'Llamar a Bomberos',
      '¿Deseas llamar al 131? 📞',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Llamar Bomberos', onPress: () => Linking.openURL('tel:131') }
      ]
    );
  };

  const handleCallPolice = () => {
    Alert.alert(
      'Llamar a Carabineros',
      '¿Deseas llamar al 133? 🚓',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Llamar Carabineros', onPress: () => Linking.openURL('tel:133') }
      ]
    );
  };

  const handleCallAmbulance = () => {
    Alert.alert(
      'Llamar a Ambulancia',
      '¿Deseas llamar al 132 (SAMU)? 🚑',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Llamar Ambulancia', onPress: () => Linking.openURL('tel:132') }
      ]
    );
  };

  const handleCallContact = (phoneNumber: string) => {
    Alert.alert(
      'Llamar a Contacto',
      `¿Deseas llamar a ${phoneNumber}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Llamar', onPress: () => Linking.openURL(`tel:${phoneNumber}`) }
      ]
    );
  };

  const handleSMS = async (phoneNumber: string, messageBody: string = '¡Necesito ayuda de emergencia!') => {
    if (!token) {
      Alert.alert('Error', 'No hay sesión activa para enviar SMS.');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/emergency/send-sms/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          to_phone_number: phoneNumber,
          message_body: messageBody,
        }),
      });

      if (response.ok) {
        // SMS sent successfully
      } else {
        const errorData = await response.json();
        Alert.alert('Error', `No se pudo enviar SMS a ${phoneNumber}: ${errorData.detail || 'Error desconocido'}`);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar con el servidor para enviar SMS.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingBottom: insets.bottom }]}>  
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/home')}>
          <Ionicons name="arrow-back" size={26} color={Colors.app.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergencia</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.container}>
          <Text style={styles.sectionTitle}>Servicios de Emergencia Directos</Text>
          <TouchableOpacity style={[styles.button, styles.buttonBomberos]} onPress={handleCallBomberos} accessibilityRole="button">
            <Ionicons name="flame-outline" size={28} color="white" />
            <Text style={styles.buttonText}>Bomberos (131)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.buttonPolice]} onPress={handleCallPolice} accessibilityRole="button">
            <Ionicons name="shield-checkmark-outline" size={28} color="white" />
            <Text style={styles.buttonText}>Carabineros (133)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.buttonAmbulance]} onPress={handleCallAmbulance} accessibilityRole="button">
            <Ionicons name="medkit-outline" size={28} color="white" />
            <Text style={styles.buttonText}>Ambulancia (132)</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Mis Contactos de Emergencia</Text>
          {emergencyContacts.length === 0 ? (
            <Text style={styles.noContactsText}>No tienes contactos de emergencia registrados.</Text>
          ) : (
            emergencyContacts.map((contact) => (
              <View key={contact.id} style={styles.contactItem}>
                <View>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactDetail}>Teléfono: {contact.phone_number}</Text>
                  <Text style={styles.contactDetail}>Relación: {contact.relationship}</Text>
                </View>
                <View style={styles.contactActions}>
                  <TouchableOpacity onPress={() => handleCallContact(contact.phone_number)} style={styles.actionButton}>
                    <Ionicons name="call-outline" size={24} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleSMS(contact.phone_number)} style={styles.actionButton}>
                    <Ionicons name="chatbubble-ellipses-outline" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.app.lightGray },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.tint,
    paddingVertical: 20,
    paddingHorizontal: 16,
    minHeight: 70,
  },
  headerTitle: { flex: 1, color: Colors.app.white, fontSize: 22, fontWeight: '700', marginLeft: 16 },
  scrollViewContent: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 20 },
  container: { flex: 1, width: '100%', maxWidth: 500, alignSelf: 'center', paddingTop: 20 },
  button: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 20, borderRadius: 12, width: '80%', alignSelf: 'center', justifyContent: 'center', marginBottom: 24 },
  buttonBomberos: { backgroundColor: Colors.app.danger },
  buttonPolice: { backgroundColor: Colors.app.success },
  buttonAmbulance: { backgroundColor: Colors.app.info }, // Style for Ambulance button
  buttonText: { color: Colors.app.white, fontSize: 18, marginLeft: 12, fontWeight: '600' },

  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.app.darkText, marginTop: 30, marginBottom: 15, textAlign: 'center' },
  noContactsText: { textAlign: 'center', color: Colors.app.mediumText, fontSize: 16, marginTop: 10, marginBottom: 20 },
  contactItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.app.white, padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: Colors.app.gray1, width: '100%' },
  contactName: { fontSize: 18, fontWeight: 'bold', color: Colors.app.black },
  contactDetail: { fontSize: 14, color: Colors.app.mediumText },
  contactActions: { flexDirection: 'row', gap: 10 },
  actionButton: { backgroundColor: Colors.app.primary, padding: 8, borderRadius: 5, justifyContent: 'center', alignItems: 'center' },
});
