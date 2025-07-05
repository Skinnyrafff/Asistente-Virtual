import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUser } from '../../context/UserContext';
import { API_URL } from '../../constants/Api';
import { Colors } from '../../constants/Colors';

const EMERGENCY_CONTACTS_API_URL = `${API_URL}/emergency/contacts/`;

export default function OnboardingEmergencyContactScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { username, token } = useUser();

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [relationship, setRelationship] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddContact = async () => {
    if (!name.trim() || !phoneNumber.trim() || !relationship.trim()) {
      Alert.alert('Error', 'Todos los campos son obligatorios.');
      return;
    }
    if (!username || !token) {
      Alert.alert('Error', 'No hay sesión activa. Por favor, inicie sesión de nuevo.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(EMERGENCY_CONTACTS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, phone_number: phoneNumber, relationship }),
      });

      if (response.ok) {
        setLoading(false);
        router.replace('/(tabs)/home'); // Redirigir al home después de añadir el contacto
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.detail || 'No se pudo añadir el contacto de emergencia.');
        setLoading(false);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar con el servidor para añadir el contacto.');
      setLoading(false);
    } finally {
      // Removed redundant setLoading(false) from here
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Configuración Inicial</Text>
            <Text style={styles.headerSubtitle}>
              Es crucial que añadas al menos un contacto de emergencia para tu seguridad.
            </Text>
          </View>

          <View style={styles.container}>
            <Text style={styles.sectionTitle}>Añadir Contacto de Emergencia</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre del contacto"
              placeholderTextColor={Colors.app.gray2}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Número de teléfono (ej: +56912345678)"
              placeholderTextColor={Colors.app.gray2}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
            <TextInput
              style={styles.input}
              placeholder="Relación (ej: Familiar, Amigo, Vecino)"
              placeholderTextColor={Colors.app.gray2}
              value={relationship}
              onChangeText={setRelationship}
            />

            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddContact}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.buttonText}>Añadiendo...</Text>
              ) : (
                <Text style={styles.buttonText}>Añadir Contacto</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.app.lightGray,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  header: {
    width: '100%',
    backgroundColor: Colors.light.tint,
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingTop: 20, // Ajuste para SafeArea
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderRadius: 10,
  },
  headerTitle: {
    color: Colors.app.white,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  headerSubtitle: {
    color: Colors.app.white,
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.9,
    paddingHorizontal: 10,
  },
  container: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: Colors.app.white,
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.app.darkText,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.app.gray2,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    fontSize: 16,
    color: Colors.app.darkText,
    backgroundColor: Colors.app.gray3,
  },
  addButton: {
    backgroundColor: Colors.app.primary,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: Colors.app.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
