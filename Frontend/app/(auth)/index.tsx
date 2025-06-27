import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useUser } from '../../context/UserContext';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { API_URL } from '../../constants/Api';

export default function Login() {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const router = useRouter();
  const { setUsername } = useUser();

  const handleLogin = async () => {
    if (!name.trim() || !pin.trim()) {
      Alert.alert('Error', 'Por favor, ingresa tu nombre y PIN.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name.trim(), pin: pin.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        await setUsername(data.username, data.age, data.city);
        router.replace('/(tabs)/home'); // Redirigir a la pantalla principal con tabs
      } else {
        const errorData = await response.json();
        Alert.alert('Error de inicio de sesión', errorData.detail || 'Nombre de usuario o PIN incorrectos.');
      }
    } catch (error) {
      console.error('Error de red o servidor:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor. Inténtalo de nuevo más tarde.');
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !pin.trim() || !age.trim() || !city.trim()) {
      Alert.alert('Error', 'Por favor, completa todos los campos para registrarte.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name.trim(), pin: pin.trim(), age: parseInt(age.trim()), city: city.trim() }),
      });

      if (response.ok) {
        Alert.alert('Registro Exitoso', 'Usuario registrado. Ahora puedes iniciar sesión.');
        setAge('');
        setCity('');
      } else {
        const errorData = await response.json();
        Alert.alert('Error de Registro', errorData.detail || 'No se pudo registrar el usuario.');
      }
    } catch (error) {
      console.error('Error de red o servidor:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor. Inténtalo de nuevo más tarde.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        <Text style={styles.title}>Bienvenido</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre de Usuario"
          placeholderTextColor={Colors.app.mediumText}
          value={name}
          onChangeText={setName}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="PIN"
          placeholderTextColor={Colors.app.mediumText}
          value={pin}
          onChangeText={setPin}
          keyboardType="numeric"
          secureTextEntry
          maxLength={4} // Limitar a 4 dígitos para un PIN simple
        />
        <TextInput
          style={styles.input}
          placeholder="Edad"
          placeholderTextColor={Colors.app.mediumText}
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
          maxLength={3}
        />
        <TextInput
          style={styles.input}
          placeholder="Ciudad"
          placeholderTextColor={Colors.app.mediumText}
          value={city}
          onChangeText={setCity}
          autoCapitalize="words"
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.registerButton]} onPress={handleRegister}>
          <Text style={styles.buttonText}>Registrarse</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: Colors.app.lightBackground },
  contentWrapper: { width: '100%', maxWidth: 400, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 20, color: Colors.app.secondary },
  input: { width: '100%', borderWidth: 1, borderColor: Colors.app.gray1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Colors.app.white, fontSize: 18, marginBottom: 20, color: Colors.app.black },
  button: { backgroundColor: Colors.app.primary, paddingVertical: 14, borderRadius: 8, width: '100%', marginBottom: 10 },
  registerButton: { backgroundColor: Colors.app.secondary }, // Un color diferente para el botón de registro
  buttonText: { color: Colors.app.white, fontSize: 18, fontWeight: '600', textAlign: 'center', opacity: 1 },
});
