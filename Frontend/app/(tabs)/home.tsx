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

// Placeholder for survey links - REPLACE WITH ACTUAL LINKS
const SURVEY_LINK_1 = 'https://forms.gle/W6icQwQKzMRRZPqR7';
const SURVEY_LINK_2 = 'https://forms.gle/vdSayargaEwQpB9i7';

interface EmergencyContact {
  id: number;
  name: string;
  phone_number: string;
  relationship: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const { username, city, token } = useUser();
  const [queryCity] = useState<string>(city && city.trim() !== '' ? city : 'Chile');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [showFirstAidGuide, setShowFirstAidGuide] = useState(false);
  const [currentWidgetIndex, setCurrentWidgetIndex] = useState(0); // New state for widget index

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('avatarUri');
      if (saved) setAvatarUri(saved);
    })();
  }, []);

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

  // Automatic widget rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWidgetIndex(prevIndex => (prevIndex + 1) % 3); // Assuming 3 widgets: weather, survey1, survey2
    }, 10000); // Change every 10 seconds
    return () => clearInterval(interval);
  }, []);

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
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
      await AsyncStorage.setItem('avatarUri', result.assets[0].uri);
    }
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

  interface ActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  isEmergency?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onPress, isEmergency = false }) => (
  <TouchableOpacity 
    style={[styles.actionButton, isEmergency && styles.emergencyButton]} 
    onPress={onPress}
  >
    <Ionicons name={icon} size={32} color={isEmergency ? '#fff' : Colors.light.tint} />
    <Text style={[styles.actionButtonLabel, isEmergency && styles.emergencyButtonLabel]}>{label}</Text>
  </TouchableOpacity>
);

interface SurveyCardProps {
  title: string;
  description: string;
  link: string;
}

// Survey Card Component
const SurveyCard: React.FC<SurveyCardProps> = ({ title, description, link }) => (
  <TouchableOpacity style={styles.surveyCard} onPress={() => Linking.openURL(link)}>
    <View style={styles.surveyInfo}>
      <Text style={styles.surveyTitle}>{title}</Text>
      <Text style={styles.surveyDescription}>{description}</Text>
    </View>
    <Ionicons name="open-outline" size={32} color="#fff" />
  </TouchableOpacity>
);

const widgetContent = [
  // Weather Widget
  <View key="weather">
    {loading && !weather ? (
      <ActivityIndicator size="large" color={Colors.light.tint} style={{ marginVertical: 20 }} />
    ) : weather && (
      <View style={styles.weatherCard}>
          <View style={styles.weatherInfo}>
            <Text style={styles.weatherCity}>{weather.city ?? 'Cargando...'}</Text>
            <Text style={styles.weatherTemp}>{weather.temp_c ? `${weather.temp_c}°C` : '--'}</Text>
            <Text style={styles.weatherCondition}>{weather.condition}</Text>
          </View>
          <Ionicons name={getWeatherIcon(weather.condition)} size={60} color="#fff" style={styles.weatherIcon} />
      </View>
    )}
  </View>,
  // Survey 1 Widget
  <SurveyCard
    key="survey1"
    title="Encuesta de Satisfacción"
    description="Ayúdanos a mejorar tu experiencia con la aplicación."
    link={SURVEY_LINK_1}
  />,
  // Survey 2 Widget
  <SurveyCard
    key="survey2"
    title="Encuesta de Usabilidad"
    description="Tu opinión es importante para el desarrollo futuro."
    link={SURVEY_LINK_2}
  />,
].filter(Boolean); // Filter out null/undefined from loading state

const handleNextWidget = () => {
  setCurrentWidgetIndex(prevIndex => (prevIndex + 1) % widgetContent.length);
};

const handlePrevWidget = () => {
  setCurrentWidgetIndex(prevIndex => (prevIndex - 1 + widgetContent.length) % widgetContent.length);
};

return (
  <ScrollView style={styles.container}>
    <View style={styles.header}>
      <View>
        <Text style={styles.headerGreeting}>Hola de nuevo,</Text>
        <Text style={styles.headerUsername}>{username ?? 'Usuario'}!</Text>
      </View>
      <TouchableOpacity onPress={() => router.push('/profile')} style={styles.avatarContainer}>
        <Image source={require('../../assets/images/abuelos.png')} style={styles.avatar} />
      </TouchableOpacity>
    </View>

    <View style={styles.widgetContainer}>
      {widgetContent[currentWidgetIndex]}
      <View style={styles.widgetNavigation}>
        <TouchableOpacity onPress={handlePrevWidget} style={styles.navButton}>
          <Ionicons name="chevron-back-outline" size={24} color={Colors.app.black} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNextWidget} style={styles.navButton}>
          <Ionicons name="chevron-forward-outline" size={24} color={Colors.app.black} />
        </TouchableOpacity>
      </View>
    </View>

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
  // New styles for dynamic widget
  widgetContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  weatherCard: {
    backgroundColor: Colors.light.tint,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 50,
    height: 130, // Fixed height for consistency
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  weatherInfo: {
    flex: 1,
    marginRight: 10,
  },
  weatherCity: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  weatherTemp: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: 'bold',
  },
  weatherCondition: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
  },
  weatherIcon: {
    marginLeft: 10,
  },
  surveyCard: {
    backgroundColor: Colors.light.tint,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 50,
    height: 130, // Fixed height for consistency
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  surveyInfo: {
    flex: 1,
    marginRight: 10,
  },
  surveyTitle: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  surveyDescription: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
  },
  widgetNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    marginTop: -12, // Half of icon size to center vertically
    paddingHorizontal: 5,
  },
  navButton: {
    padding: 10,
  },
  paginationDots: {
    flexDirection: 'row',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.tint,
    opacity: 0.3,
    marginHorizontal: 4,
  },
  activeDot: {
    opacity: 1,
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
