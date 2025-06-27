import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Número de contacto de emergencia (familiar)
const EMERGENCY_CONTACT = '123456789';
export default function EmergencyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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

  const handleCallContact = () => {
    Alert.alert(
      'Llamar a Contacto',
      `¿Deseas llamar a tu contacto de emergencia (${EMERGENCY_CONTACT})?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Llamar', onPress: () => Linking.openURL(`tel:${EMERGENCY_CONTACT}`) }
      ]
    );
  };

  const handleSMS = () => {
    const message = encodeURIComponent('¡Necesito ayuda de emergencia!');
    Linking.openURL(`sms:112?body=${message}`)
      .catch(() => Alert.alert('Error', 'No se pudo abrir la app de SMS.'));
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingBottom: insets.bottom }]}>  
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergencia</Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.instructions}>
          En caso de emergencia, elige una opción:
        </Text>
        <TouchableOpacity style={[styles.button, styles.buttonBomberos]} onPress={handleCallBomberos} accessibilityRole="button">
          <Ionicons name="flame-outline" size={28} color="white" />
          <Text style={styles.buttonText}>Bomberos (131)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.buttonPolice]} onPress={handleCallPolice} accessibilityRole="button">
          <Ionicons name="shield-checkmark-outline" size={28} color="white" />
          <Text style={styles.buttonText}>Carabineros (133)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.buttonContact]} onPress={handleCallContact} accessibilityRole="button">
          <Ionicons name="person-circle-outline" size={28} color="white" />
          <Text style={styles.buttonText}>Contacto</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.buttonSMS]} onPress={handleSMS} accessibilityRole="button">
          <Ionicons name="chatbubble-ellipses-outline" size={28} color="white" />
          <Text style={styles.buttonText}>SMS (112)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

import { Colors } from '../../constants/Colors';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.app.primary, alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.app.secondary, paddingVertical: 20, paddingHorizontal: 16 },
  headerTitle: { flex: 1, color: Colors.app.white, fontSize: 22, fontWeight: '700', marginLeft: 16 },
  contentContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, width: '100%', maxWidth: 500 },
  instructions: { color: Colors.app.white, fontSize: 18, textAlign: 'center', marginBottom: 24 },
  button: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, width: '100%', justifyContent: 'center', marginBottom: 16, maxWidth: 400 },
  buttonBomberos: { backgroundColor: Colors.app.danger },
  buttonPolice: { backgroundColor: Colors.app.success },
  buttonContact: { backgroundColor: Colors.app.info },
  buttonSMS: { backgroundColor: Colors.app.warning },
  buttonText: { color: Colors.app.white, fontSize: 18, marginLeft: 12, fontWeight: '600' },
});