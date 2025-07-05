import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';
import { API_URL } from '../../constants/Api';
import { Colors } from '../../constants/Colors';
import { useExternalSummaries } from '../hooks/useExternalSummaries';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface EmergencyContact {
  id: number;
  name: string;
  phone_number: string;
  relationship: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const { username, city, token } = useUser();
  const [queryCity, setQueryCity] = useState<string>('Chile');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [showFirstAidGuide, setShowFirstAidGuide] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('avatarUri');
      if (saved) setAvatarUri(saved);
    })();
  }, []);

  useEffect(() => {
    if (city && city.trim() !== '') {
      setQueryCity(city);
    }
  }, [city]);

  const { weather, news, loading } = useExternalSummaries(queryCity);

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

  function getWeatherIcon(condition: string): keyof typeof Ionicons.glyphMap {
    const c = condition.toLowerCase();
    if (c.includes('sun') || c.includes('soleado')) return 'sunny';
    if (c.includes('clear') || c.includes('despejado')) return 'sunny';
    if (c.includes('cloud') || c.includes('nublado')) return 'cloudy';
    if (c.includes('rain') || c.includes('lluvia')) return 'rainy';
    if (c.includes('storm') || c.includes('tormenta')) return 'thunderstorm';
    if (c.includes('snow') || c.includes('nieve')) return 'snow';
    if (c.includes('fog') || c.includes('niebla')) return 'cloudy';
    return 'partly-sunny';
  }

  const handlePickAvatar = async () => {
    // Logic for picking avatar remains the same
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
        // SMS sent successfully, no need for console.log here
      } else {
        const errorData = await response.json();
        Alert.alert('Error', `No se pudo enviar SMS a ${phoneNumber}: ${errorData.detail || 'Error desconocido'}`);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar con el servidor para enviar SMS.');
    }
  };

  const activateEmergencyProtocol = () => {
    if (emergencyContacts.length === 0) {
      Alert.alert(
        'Configuración de Emergencia',
        'Para activar el protocolo de emergencia, primero debes añadir al menos un contacto de emergencia.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Añadir Contacto', onPress: () => router.push('/onboarding/emergency-contact') },
        ]
      );
      return;
    }

    Alert.alert(
      'Activar Protocolo de Emergencia',
      '¿Estás seguro de activar el protocolo de emergencia? Esto enviará SMS a tus contactos y llamará a servicios de salud.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, activar',
          onPress: () => {
            // 1. Enviar SMS a todos los contactos de emergencia
            emergencyContacts.forEach(contact => {
              handleSMS(contact.phone_number, `¡ALERTA! ${username} necesita ayuda de emergencia. Por favor, contacta con él/ella.`);
            });
            Alert.alert('SMS Enviados', 'Mensajes de emergencia enviados a tus contactos.');

            // 2. Llamar automáticamente a servicios de salud (SAMU/Ambulancia - 132 en Chile)
            Linking.openURL('tel:132').catch(() => Alert.alert('Error', 'No se pudo iniciar la llamada a servicios de salud.'));

            // 3. Mostrar guía de primeros auxilios (opcional, si se quiere mostrar en el home o en una modal)
            // setShowFirstAidGuide(true); // Si se decide mostrar aquí
          },
        },
      ]
    );
  };

  const ActionButton = ({ icon, label, onPress, isEmergency = false }) => (
    <TouchableOpacity 
      style={[styles.actionButton, isEmergency && styles.emergencyButton]} 
      onPress={onPress}
    >
      <Ionicons name={icon} size={32} color={isEmergency ? '#fff' : Colors.light.tint} />
      <Text style={[styles.actionButtonLabel, isEmergency && styles.emergencyButtonLabel]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {console.log('Home Screen Render - Loading:', loading, 'Weather:', weather, 'News:', news.length)}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Hola de nuevo,</Text>
          <Text style={styles.headerUsername}>{username ?? 'Usuario'}!</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/profile')} style={styles.avatarContainer}>
          <Image source={require('../../assets/images/abuelos.png')} style={styles.avatar} />
        </TouchableOpacity>
      </View>

      {loading && !weather && (
        <ActivityIndicator size="large" color={Colors.light.tint} style={{ marginVertical: 20 }} />
      )}
      {weather && (
        <View style={styles.weatherCard}>
            <View style={styles.weatherInfo}>
              <Text style={styles.weatherCity}>{weather.city ?? 'Cargando...'}</Text>
              <Text style={styles.weatherTemp}>{weather.temp_c ? `${weather.temp_c}°C` : '--'}</Text>
              <Text style={styles.weatherCondition}>{weather.condition}</Text>
            </View>
            <Ionicons name={getWeatherIcon(weather.condition)} size={60} color="#fff" style={styles.weatherIcon} />
        </View>
      )}

      <View style={styles.actionsContainer}>
        <View style={styles.actionRow}>
          <ActionButton icon="chatbubbles" label="Asistente" onPress={() => router.push('/(tabs)/chat')} />
          <ActionButton icon="alarm" label="Recordatorios" onPress={() => router.push('/(tabs)/reminders')} />
        </View>
        <View style={styles.actionRow}>
          <ActionButton icon="heart" label="Salud" onPress={() => router.push('/(tabs)/health')} />
          <ActionButton icon="warning" label="Emergencia" onPress={activateEmergencyProtocol} isEmergency={true} />
        </View>
      </View>

      <View style={styles.newsContainer}>
        <Text style={styles.sectionTitle}>Noticias para ti</Text>
        {loading && !news.length ? (
          <ActivityIndicator color={Colors.light.tint} />
        ) : news && news.length > 0 ? (
          news.slice(0, 3).map((item, idx) => (
            <TouchableOpacity key={idx} style={styles.newsCard} onPress={() => Linking.openURL(item.url)}>
              <View style={styles.newsTextContainer}>
                <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.newsSource}>{item.source_id || 'Noticia'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#94A3B8" />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noNewsText}>No hay noticias disponibles.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60, // Adjust for status bar
    paddingBottom: 20,
  },
  headerGreeting: {
    fontSize: 18,
    color: '#64748B',
  },
  headerUsername: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  weatherCard: {
    backgroundColor: Colors.light.tint,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  weatherInfo: {
    flex: 1,
  },
  weatherCity: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '600',
  },
  weatherTemp: {
    fontSize: 36,
    color: '#FFF',
    fontWeight: 'bold',
    marginVertical: 4,
  },
  weatherCondition: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
  },
  weatherIcon: {
    opacity: 0.8,
  },
  actionsContainer: {
    marginBottom: 30,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
    width: '48%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 100,
    justifyContent: 'space-between',
  },
  actionButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 8,
  },
  emergencyButton: {
    backgroundColor: '#DC2626', // Red color for emergency
  },
  emergencyButtonLabel: {
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  newsContainer: {},
  newsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  newsTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  newsSource: {
    fontSize: 14,
    color: '#64748B',
  },
  noNewsText: {
    textAlign: 'center',
    color: '#64748B',
    marginTop: 10,
  },
});
