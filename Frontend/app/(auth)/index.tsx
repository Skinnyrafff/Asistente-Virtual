import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, Dimensions } from 'react-native';
import { useUser } from '../../context/UserContext';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { API_URL } from '../../constants/Api';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

interface SocialButtonProps {
  iconName: keyof typeof Ionicons.glyphMap;
  text: string;
  onPress: () => void;
}

const SocialButton: React.FC<SocialButtonProps> = ({ iconName, text, onPress }) => (
  <TouchableOpacity style={styles.socialButton} onPress={onPress}>
    <Ionicons name={iconName} size={24} color="#000" style={styles.socialIcon} />
    <Text style={styles.socialButtonText}>{text}</Text>
  </TouchableOpacity>
);

export default function Login() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [isGuideExpanded, setIsGuideExpanded] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const router = useRouter();
  const { setUsername } = useUser();

  const speakGuide = () => {
    setIsSpeaking(true);
    const loginSteps = [
      '¡Hola! Para entrar, sigue estos pasos:',
      'Paso 1: Escribe tu nombre de usuario en el primer campo.',
      'Paso 2: Escribe tu clave secreta de 4 números en el segundo campo.',
      'Paso 3: Presiona el botón azul grande que dice Iniciar Sesión.',
      'Si todavía no tienes una cuenta, pulsa en el texto de abajo que dice Regístrate.',
    ].join(' ');

    const registerSteps = [
      '¡Qué bueno tenerte! Para crear tu cuenta, sigue estos pasos:',
      'Paso 1: Inventa un nombre de usuario y escríbelo.',
      'Paso 2: Crea una clave secreta de 4 números. ¡Que no se te olvide!',
      'Paso 3: Dinos tu edad.',
      'Paso 4: Escribe el nombre de tu ciudad.',
      'Paso 5: Presiona el botón azul que dice Crear Cuenta.',
    ].join(' ');

    const stepsToSpeak = isLoginView ? loginSteps : registerSteps;

    Speech.speak(stepsToSpeak, {
      language: 'es-MX',
      rate: 0.6,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
    });
  };

  const stopSpeech = () => {
    Speech.stop();
    setIsSpeaking(false);
  };

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
        await setUsername(data.username, data.age, data.city, data.access_token);
        router.replace('/onboarding');
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
        setIsLoginView(true); // Switch to login view after successful registration
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {isLoginView ? (
        <View style={styles.scrollContent}>
          <View style={styles.header}>
            <Ionicons name="accessibility-outline" size={80} color={Colors.light.tint} style={{ marginBottom: 16 }} />
            <Text style={styles.title}>{'Bienvenido de vuelta!'}</Text>
            <Text style={styles.subtitle}>
              {'Tu compañero diario'}
            </Text>
          </View>

          <View style={styles.guideContainer}>
            <TouchableOpacity onPress={() => setIsGuideExpanded(!isGuideExpanded)} style={styles.guideHeader}>
              <Text style={styles.guideText}>¿Necesitas ayuda para entrar?</Text>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                {isSpeaking ? (
                  <TouchableOpacity onPress={stopSpeech} style={{marginRight: 10}}>
                    <Ionicons name="stop-circle-outline" size={24} color="#000000" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={speakGuide} style={{marginRight: 10}}>
                    <Ionicons name="volume-high-outline" size={24} color="#000000" />
                  </TouchableOpacity>
                )}
                <Ionicons name={isGuideExpanded ? 'chevron-up-outline' : 'chevron-down-outline'} size={24} color="#000000" />
              </View>
            </TouchableOpacity>
            {isGuideExpanded && (
              <View style={styles.guideContent}>
                <>
                  <Text style={styles.guideTitle}>Para Iniciar Sesión:</Text>
                  <Text style={styles.guideStep}>1. <Text style={styles.boldText}>Escribe tu nombre</Text> en el primer espacio.</Text>
                  <Text style={styles.guideStep}>2. <Text style={styles.boldText}>Escribe tu clave</Text> de 4 números en el segundo espacio.</Text>
                  <Text style={styles.guideStep}>3. Pulsa el botón azul que dice <Text style={styles.boldText}>&apos;Iniciar Sesión&apos;</Text>.</Text>
                  <Text style={styles.guideStep}>4. Si no tienes cuenta, pulsa abajo donde dice <Text style={styles.boldText}>&apos;Regístrate&apos;</Text>.</Text>
                </>
              </View>
            )}
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Nombre de Usuario"
              placeholderTextColor="#000000"
              value={name}
              onChangeText={setName}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="PIN (4 digitos)"
              placeholderTextColor="#000000"
              value={pin}
              onChangeText={setPin}
              keyboardType="numeric"
              secureTextEntry
              maxLength={4}
            />
            <TouchableOpacity>
              <Text style={styles.forgotPin}>¿Has olvidado tu PIN?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>{'Iniciar Sesión'}</Text>
            </TouchableOpacity>
          </View>

          <>
            <View style={styles.separatorContainer}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>O continuar con</Text>
              <View style={styles.separatorLine} />
            </View>

            <View style={styles.socialLoginContainer}>
              <SocialButton iconName="logo-google" text="Google" onPress={() => {}} />
              <SocialButton iconName="logo-apple" text="Apple" onPress={() => {}} />
            </View>
          </>

          <TouchableOpacity style={styles.toggleView} onPress={() => setIsLoginView(!isLoginView)}>
            <Text style={styles.toggleText}>
              {'¿No tienes una cuenta? '}
              <Text style={styles.toggleLink}>{'Regístrate'}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Ionicons name="accessibility-outline" size={80} color={Colors.light.tint} style={{ marginBottom: 16 }} />
            <Text style={styles.title}>{'Crear una cuenta'}</Text>
            <Text style={styles.subtitle}>
              {'Comencemos con tu asistente personal.'}
            </Text>
          </View>

          <View style={styles.guideContainer}>
            <TouchableOpacity onPress={() => setIsGuideExpanded(!isGuideExpanded)} style={styles.guideHeader}>
              <Text style={styles.guideText}>¿Necesitas ayuda para entrar?</Text>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                {isSpeaking ? (
                  <TouchableOpacity onPress={stopSpeech} style={{marginRight: 10}}>
                    <Ionicons name="stop-circle-outline" size={24} color="#000000" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={speakGuide} style={{marginRight: 10}}>
                    <Ionicons name="volume-high-outline" size={24} color="#000000" />
                  </TouchableOpacity>
                )}
                <Ionicons name={isGuideExpanded ? 'chevron-up-outline' : 'chevron-down-outline'} size={24} color="#000000" />
              </View>
            </TouchableOpacity>
            {isGuideExpanded && (
              <View style={styles.guideContent}>
                <>
                  <Text style={styles.guideTitle}>Para Crear tu Cuenta:</Text>
                  <Text style={styles.guideStep}>1. <Text style={styles.boldText}>Elige un nombre</Text> y escríbelo.</Text>
                  <Text style={styles.boldText}>2. <Text style={styles.boldText}>Crea una clave</Text> de 4 números.</Text>
                  <Text style={styles.guideStep}>3. <Text style={styles.boldText}>Dinos tu edad</Text>.</Text>
                  <Text style={styles.guideStep}>4. <Text style={styles.boldText}>Escribe tu ciudad</Text>.</Text>
                  <Text style={styles.guideStep}>5. Pulsa el botón azul que dice <Text style={styles.boldText}>&apos;Crear Cuenta&apos;</Text>.</Text>
                </>
              </View>
            )}
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Nombre de Usuario"
              placeholderTextColor="#000000"
              value={name}
              onChangeText={setName}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="PIN (4 digitos)"
              placeholderTextColor="#000000"
              value={pin}
              onChangeText={setPin}
              keyboardType="numeric"
              secureTextEntry
              maxLength={4}
            />
            <>
              <TextInput
                style={styles.input}
                placeholder="Edad"
                placeholderTextColor="#000000"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                maxLength={3}
              />
              <TextInput
                style={styles.input}
                placeholder="Ciudad"
                placeholderTextColor="#000000"
                value={city}
                onChangeText={setCity}
                autoCapitalize="words"
              />
            </>

            <TouchableOpacity style={styles.button} onPress={handleRegister}>
              <Text style={styles.buttonText}>{'Crear Cuenta'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.toggleView} onPress={() => setIsLoginView(!isLoginView)}>
            <Text style={styles.toggleText}>
              {'¿Ya tienes una cuenta? '}
              <Text style={styles.toggleLink}>{'Inicia Sesión'}</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: height > 700 ? 24 : 12,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: height > 700 ? 32 : (height > 600 ? 16 : 8),
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
  forgotPin: {
    textAlign: 'right',
    color: Colors.light.tint,
    fontWeight: '600',
    marginBottom: 16,
    fontSize: 16,
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
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  separatorText: {
    marginHorizontal: 8,
    color: '#555555',
    fontWeight: '600',
    fontSize: 16,
  },
  socialLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 14,
    borderRadius: 8,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    marginHorizontal: 8,
  },
  socialIcon: {
    marginRight: 12,
  },
  socialButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  toggleView: {
    marginTop: height > 700 ? 24 : (height > 600 ? 12 : 8),
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 16,
    color: '#555555',
  },
  toggleLink: {
    color: Colors.light.tint,
    fontWeight: 'bold',
  },
  guideContainer: {
    marginBottom: height > 700 ? 24 : (height > 600 ? 12 : 8),
  },
  guideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  guideText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  guideContent: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  guideStep: {
    fontSize: 16,
    color: '#555555',
    marginBottom: 8,
  },
  guideTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  boldText: {
    fontWeight: 'bold',
  },
});