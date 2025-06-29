import React, { useState, useRef, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useUser } from '../../context/UserContext'; // Importar useUser

const { width } = Dimensions.get('window');
const FOOTER_HEIGHT = 60;
import { API_URL } from '../../constants/Api';

const CHAT_API_URL = `${API_URL}/chat/`;

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  time?: string;
};

export default function ChatScreen() {
  const router = useRouter();
  const { username, token } = useUser(); // Obtener el username y el token del contexto
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationHistory, setConversationHistory] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;
    if (!username) {
      Alert.alert('Error', 'Debes iniciar sesión para usar el chat.');
      return;
    }
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = { id: Date.now().toString(), text: input, sender: 'user', time: now };
    
    // Actualizar el historial de conversación con el mensaje del usuario
    const newConversationHistory = [...conversationHistory, { role: 'user', content: input.trim() }];
    setConversationHistory(newConversationHistory);

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: userMsg.text, conversation_history: newConversationHistory }) // Enviar historial
      });
      const data = await res.json();
      // Log del JSON recibido para verificar la clave correcta
console.log('💬 Response data:', data);
// Tomar propiedad 'respuesta' según tu API FastAPI
const replyText = data.respuesta ?? data.reply ?? data.message ?? JSON.stringify(data);
const botMsg: Message = { id: (Date.now()+1).toString(), text: replyText, sender: 'bot' };
      setMessages(prev => [...prev, botMsg]);
      // Actualizar el historial de conversación con la respuesta del bot
      setConversationHistory(prev => [...prev, { role: 'assistant', content: replyText }]);
    } catch (error) {
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), text: 'Error conectando al servidor.', sender: 'bot' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (text: string) => {
    Speech.speak(text, { language: 'es-ES' });
  };

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const renderItem = ({ item }: { item: Message }) => (
    <View style={item.sender === 'user' ? styles.userMessageRow : styles.botMessageRow}>
      {item.sender === 'bot' && <View style={styles.botAvatar}><Ionicons name="person-outline" size={24} color={Colors.app.accent} /></View>}
      <View style={[styles.bubbleContainer, item.sender === 'user' ? styles.userBubble : styles.botBubble]}>
        <Text style={[styles.bubbleText, item.sender === 'user' && styles.userText]}>{item.text}</Text>
        <View style={styles.messageFooter}>
          {item.time && <Text style={styles.timestamp}>{item.time}</Text>}
          {item.sender === 'bot' && (
            <TouchableOpacity onPress={() => handleSpeak(item.text)} style={styles.speakerButton}>
              <Ionicons name="volume-high-outline" size={18} color={Colors.app.mediumText} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header de Chat */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Senior Assist</Text>
      </View>
      <StatusBar style="light" />
      <View style={styles.container}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : FOOTER_HEIGHT}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
          />
          {loading && <ActivityIndicator style={styles.loader} size="large" color="#00529B" />}
          <View style={[styles.footer, { paddingBottom: 0 }]}>  
            <TextInput
              style={styles.textInput}
              placeholder="Escribe un mensaje..."
              placeholderTextColor="#555"
              value={input}
              onChangeText={setInput}
              multiline
            />
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={loading}>
              <Ionicons name="send" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

import { Colors } from '../../constants/Colors';

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.app.primary, paddingVertical: 16, paddingHorizontal: 12 },
  headerTitle: { flex: 1, color: Colors.app.white, fontSize: 20, fontWeight: '600', textAlign: 'center', marginRight: 32 },
  safeArea: { flex: 1, backgroundColor: Colors.app.lightGray, alignItems: 'center' }, // Centra el contenedor principal
  container: { flex: 1, width: '100%', maxWidth: 800 }, // Contenedor con ancho máximo
  flex: { flex: 1 },
  messageList: { paddingHorizontal: 12, paddingBottom: FOOTER_HEIGHT },
  botMessageRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 6, marginLeft: 16 },
  userMessageRow: { flexDirection: 'row', justifyContent: 'flex-end', marginVertical: 6, marginRight: 16 },
  botAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.app.white, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  bubbleContainer: { maxWidth: '80%', borderRadius: 20, padding: 12 }, // Usar % para el maxWidth de la burbuja
  userBubble: { backgroundColor: Colors.app.accent, borderTopRightRadius: 0 },
  botBubble: { backgroundColor: Colors.app.white, borderTopLeftRadius: 0 },
  bubbleText: { fontSize: 16, color: Colors.app.darkText },
  userText: { color: Colors.app.white },
  timestamp: { fontSize: 10, color: Colors.app.mediumText, alignSelf: 'flex-end', marginTop: 4 },
  messageFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4 },
  speakerButton: { marginLeft: 8, padding: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', padding: 8, borderTopWidth: 1, borderColor: Colors.app.gray1, backgroundColor: Colors.app.white },
  textInput: { flex: 1, maxHeight: 100, borderWidth: 1, borderColor: Colors.app.gray2, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.app.gray3, marginRight: 8 },
  sendButton: { backgroundColor: Colors.app.primary, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  loader: { position: 'absolute', top: '50%', left: '50%', marginLeft: -20, marginTop: -20 }
});
