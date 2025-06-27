import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUser } from '../../context/UserContext';
import { Colors } from '../../constants/Colors';
import { API_URL } from '../../constants/Api';

export default function ProfileScreen() {
  const router = useRouter();
  const { username, age, city, setUsername } = useUser();

  const [editAge, setEditAge] = useState(age ? age.toString() : '');
  const [editCity, setEditCity] = useState(city || '');

  useEffect(() => {
    setEditAge(age ? age.toString() : '');
    setEditCity(city || '');
  }, [age, city]);

  const handleSave = async () => {
    if (!username) {
      Alert.alert('Error', 'No hay usuario logueado.');
      return;
    }

    if (!editAge.trim() || !editCity.trim()) {
      Alert.alert('Error', 'Por favor, completa todos los campos.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/profile/${username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ age: parseInt(editAge.trim()), city: editCity.trim() }),
      });

      if (response.ok) {
        Alert.alert('Éxito', 'Perfil actualizado correctamente.');
        // Actualizar el contexto del usuario con los nuevos datos
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color={Colors.app.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
      </View>

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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.app.lightGray, alignItems: 'center' },
  header: { width: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.app.primary, paddingVertical: 20, paddingHorizontal: 16 },
  headerTitle: { flex: 1, color: Colors.app.white, fontSize: 22, fontWeight: '700', marginLeft: 16 },
  contentContainer: { flex: 1, width: '100%', maxWidth: 500, padding: 20 },
  label: { fontSize: 16, fontWeight: 'bold', color: Colors.app.darkText, marginTop: 15, marginBottom: 5 },
  value: { fontSize: 18, color: Colors.app.mediumText, marginBottom: 15 },
  input: { width: '100%', borderWidth: 1, borderColor: Colors.app.gray1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Colors.app.white, fontSize: 18, color: Colors.app.black },
  saveButton: { backgroundColor: Colors.app.primary, paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 30 },
  saveButtonText: { color: Colors.app.white, fontSize: 18, fontWeight: '600' },
});
