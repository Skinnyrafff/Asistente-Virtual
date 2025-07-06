import React, { useState } from 'react';
import {
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Text,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useUser } from '../../context/UserContext';
import { API_URL } from '../../constants/Api';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const EMERGENCY_CONTACTS_API_URL = `${API_URL}/emergency/contacts/`;

const { width, height } = Dimensions.get('window');

export default function OnboardingEmergencyContactScreen() {
  const router = useRouter();
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
        router.replace('/(tabs)/home');
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.detail || 'No se pudo añadir el contacto de emergencia.');
        setLoading(false);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar con el servidor para añadir el contacto.');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="accessibility-outline" size={80} color={Colors.light.tint} style={{ marginBottom: 16 }} />
          <Text style={styles.title}>Configuración Inicial</Text>
          <Text style={styles.subtitle}>Es crucial que añadas al menos un contacto de emergencia para tu seguridad.</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Nombre del contacto"
            placeholderTextColor="#000"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Número de teléfono (ej: +56912345678)"
            placeholderTextColor="#000"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
          <TextInput
            style={styles.input}
            placeholder="Relación (ej: Familiar, Amigo, Vecino)"
            placeholderTextColor="#000"
            value={relationship}
            onChangeText={setRelationship}
          />

          <TouchableOpacity style={styles.button} onPress={handleAddContact} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Añadiendo...' : 'Añadir Contacto'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: height > 700 ? 120 : 100,
    paddingHorizontal: 24,
    paddingBottom: 24,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: width > 400 ? 32 : 26,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#555555',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: height > 700 ? 14 : (height > 600 ? 10 : 8),
    borderRadius: 8,
    fontSize: 18,
    marginBottom: height > 700 ? 16 : (height > 600 ? 10 : 8),
    borderColor: '#B0B0B0',
    borderWidth: 1,
    color: '#000000',
  },
  button: {
    backgroundColor: Colors.light.tint,
    paddingVertical: height > 700 ? 16 : 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
