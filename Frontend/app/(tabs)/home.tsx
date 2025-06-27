import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { username, age, city } = useUser();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LinearGradient colors={[Colors.app.headerGradientStart, Colors.app.headerGradientEnd]} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Bienvenido</Text>
          {/* Botón para ir al perfil */}
          <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/(tabs)/profile')}>
            <Ionicons name="settings-outline" size={24} color={Colors.app.white} />
          </TouchableOpacity>
          {/* Usar un icono de Ionicons como avatar */}
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle-outline" size={100} color={Colors.app.white} />
          </View>
          <Text style={styles.userName}>{username ?? 'Usuario'}</Text>
          <Text style={styles.userInfo}>{age ? `${age} años` : ''}{age && city ? ' · ' : ''}{city ?? ''}</Text>
        </View>
      </LinearGradient>

      <View style={styles.mainContent}>
        <Text style={styles.sectionTitle}>Mis Funcionalidades</Text>

        <View style={styles.gridContainer}>
          <TouchableOpacity style={styles.functionButton} onPress={() => router.push('/(tabs)/chat')}>
            <Ionicons name="chatbubbles-outline" size={28} color={Colors.app.white} />
            <Text style={styles.buttonText}>Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.functionButton} onPress={() => router.push('/(tabs)/reminders')}>
            <Ionicons name="alarm-outline" size={28} color={Colors.app.white} />
            <Text style={styles.buttonText}>Recordatorios</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.functionButton} onPress={() => router.push('/(tabs)/health')}>
            <Ionicons name="heart-outline" size={28} color={Colors.app.white} />
            <Text style={styles.buttonText}>Salud</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.emergencyButton} onPress={() => router.push('/(tabs)/emergency')}>
          <Ionicons name="warning-outline" size={28} color={Colors.app.white} />
          <Text style={styles.buttonText}>Emergencia</Text>
        </TouchableOpacity>

        <View style={styles.reportCard}>
          <Text style={styles.reportTitle}>🩺 Reporte de Salud</Text>
          <Text style={styles.reportText}>Última medición sin anomalías. ¡Buen trabajo!</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.app.lightBackground,
    alignItems: 'center', // Centra el contenido principal
    paddingBottom: 40,
  },
  header: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 50, // Espacio superior para la barra de estado
    paddingBottom: 30,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerContent: {
    alignItems: 'center',
    maxWidth: 500, // Limita el ancho del contenido del header
    width: '100%',
  },
  headerTitle: {
    fontSize: 24,
    color: Colors.app.white,
    fontWeight: '600',
    marginBottom: 15,
  },
  profileButton: {
    position: 'absolute',
    top: 10, // Ajusta según sea necesario
    right: 10, // Ajusta según sea necesario
    padding: 10,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.app.white,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.app.primary, // Fondo para el icono
  },
  userName: {
    fontSize: 22,
    color: Colors.app.white,
    fontWeight: 'bold',
  },
  userInfo: {
    color: Colors.app.white, // Asegura que el color sea blanco
    // opacity: 0.8, // Eliminado para asegurar visibilidad completa
    fontSize: 16,
  },
  mainContent: {
    width: '100%',
    maxWidth: 500, // Limita el ancho del contenido principal
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    marginTop: 30,
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.app.secondary,
    marginBottom: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'center', // Centra los botones
    width: '100%',
    marginBottom: 15, // Espacio entre la fila de botones y el botón de emergencia
  },
  functionButton: {
    width: 120, // Ancho fijo para asegurar espacio
    aspectRatio: 1, // Mantiene la proporción cuadrada
    backgroundColor: Colors.app.secondary,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    marginHorizontal: 5, // Espacio entre botones
    paddingHorizontal: 5, // Añadido para dar más espacio al texto
  },
  emergencyButton: {
    marginTop: 20,
    width: '100%',
    backgroundColor: Colors.app.danger,
    paddingVertical: 20,
    borderRadius: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  reportCard: {
    marginTop: 30,
    width: '100%',
    backgroundColor: Colors.app.reportCardBackground,
    borderRadius: 15,
    padding: 20,
    shadowColor: Colors.app.black,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: Colors.app.secondary,
  },
  reportText: {
    fontSize: 16,
    color: Colors.app.darkText,
  },
  buttonText: {
    fontSize: 14, // Ligeramente reducido para dar más espacio
    color: Colors.app.white,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
});
