import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useUser } from '../../context/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
import { API_URL } from '../../constants/Api';

const REMINDERS_API_URL = `${API_URL}/reminders`;

type Reminder = { id: string; text: string; datetime: string; notificationId?: string };

export default function RemindersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { username, token } = useUser();

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [timeString, setTimeString] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTime, setPickerTime] = useState(new Date());
  const [editingId, setEditingId] = useState<string | null>(null);

  // Request notification permissions and set up notification handler
  useEffect(() => {
    (async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert('Permiso de Notificaciones', 'Necesitamos tu permiso para mostrar recordatorios.');
        return;
      }

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    })();
  }, []);

  const scheduleNotification = async (reminder: Reminder) => {
    const trigger = new Date(reminder.datetime);
    if (isNaN(trigger.getTime())) {
      console.error("Invalid date for notification trigger:", reminder.datetime);
      return;
    }

    // Ensure the trigger is in the future
    if (trigger.getTime() < Date.now()) {
      console.warn("Attempted to schedule a notification for a past date:", reminder.datetime);
      return;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Recordatorio",
        body: reminder.text,
        sound: 'default', // Use default notification sound
      },
      trigger: {
        date: trigger,
      },
    });
    console.log("Notification scheduled with ID:", notificationId);
    return notificationId;
  };

  const cancelNotification = async (notificationId: string) => {
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log("Notification cancelled with ID:", notificationId);
    }
  };

  // AsyncStorage functions
  const NOTIFICATION_IDS_KEY = 'notificationIds';

  const saveNotificationId = async (reminderId: string, notificationId: string) => {
    try {
      const storedIds = await AsyncStorage.getItem(NOTIFICATION_IDS_KEY);
      const ids = storedIds ? JSON.parse(storedIds) : {};
      ids[reminderId] = notificationId;
      await AsyncStorage.setItem(NOTIFICATION_IDS_KEY, JSON.stringify(ids));
    } catch (error) {
      console.error("Error saving notification ID:", error);
    }
  };

  const getNotificationIds = async (): Promise<Record<string, string>> => {
    try {
      const storedIds = await AsyncStorage.getItem(NOTIFICATION_IDS_KEY);
      return storedIds ? JSON.parse(storedIds) : {};
    } catch (error) {
      console.error("Error getting notification IDs:", error);
      return {};
    }
  };

  const removeNotificationId = async (reminderId: string) => {
    try {
      const storedIds = await AsyncStorage.getItem(NOTIFICATION_IDS_KEY);
      const ids = storedIds ? JSON.parse(storedIds) : {};
      delete ids[reminderId];
      await AsyncStorage.setItem(NOTIFICATION_IDS_KEY, JSON.stringify(ids));
    } catch (error) {
      console.error("Error removing notification ID:", error);
    }
  };

  const fetchReminders = async () => {
    if (!username || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`${REMINDERS_API_URL}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.status === 404) {
        setReminders([]);
      } else if (res.ok) {
        const data: Reminder[] = await res.json();
        const storedNotificationIds = await getNotificationIds();

        // Re-schedule notifications for existing reminders if they are in the future
        for (const reminder of data) {
          const trigger = new Date(reminder.datetime);
          if (trigger.getTime() > Date.now()) { // Only re-schedule if in the future
            const existingNotificationId = storedNotificationIds[reminder.id];
            if (existingNotificationId) {
              // Optionally, cancel and re-schedule to ensure it's up-to-date
              await cancelNotification(existingNotificationId);
            }
            const newNotificationId = await scheduleNotification(reminder);
            if (newNotificationId) {
              await saveNotificationId(reminder.id, newNotificationId);
            }
          } else { // If reminder is in the past, remove its notification ID
            await removeNotificationId(reminder.id);
          }
        }
        setReminders(data);
      } else {
        throw new Error('Error del servidor');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los recordatorios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReminders(); }, [username, token]);

  const resetForm = () => {
    setMessage('');
    setTimeString('');
    setEditingId(null);
  };

  const openModal = () => { resetForm(); setShowModal(true); };
  const closeModal = () => { setShowModal(false); resetForm(); };

  const onSubmit = async () => {
    if (!username || !token) return;
    if (!message.trim()) return Alert.alert('Error', 'El mensaje es requerido');

    let reminderDateTime = `${selectedDate}T00:00:00`; // Default to midnight if no time selected
    if (timeString) {
      reminderDateTime = `${selectedDate}T${timeString}:00`;
    }

    const body = {
      text: message.trim(),
      datetime: reminderDateTime,
    };

    const url = editingId ? `${REMINDERS_API_URL}/${editingId}` : `${REMINDERS_API_URL}/`;
    const method = editingId ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const data = await res.json(); // Assuming backend returns the created/updated reminder
      
      // Schedule notification and save ID
      const notificationId = await scheduleNotification(data);
      if (notificationId) {
        await saveNotificationId(data.id, notificationId);
      }

      closeModal();
      fetchReminders();
    } catch {
      Alert.alert('Error', editingId ? 'No se pudo actualizar' : 'No se pudo crear');
    }
  };

  const onDelete = (id: string) => {
    Alert.alert('Eliminar', '¿Eliminar este recordatorio?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'OK', onPress: async () => {
        try {
          const notificationIds = await getNotificationIds();
          const notificationId = notificationIds[id];
          if (notificationId) {
            await cancelNotification(notificationId);
            await removeNotificationId(id);
          }
          await fetch(`${REMINDERS_API_URL}/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
          fetchReminders();
        }
        catch (error) {
          console.error("Error deleting reminder:", error);
          Alert.alert('Error', 'No se pudo eliminar');
        }
      }},
    ]);
  };

  const onEdit = (item: Reminder) => {
    setEditingId(item.id);
    setMessage(item.text);

    const dt = new Date(item.datetime);
    setSelectedDate(dt.toISOString().split('T')[0]);
    setTimeString(dt.toTimeString().substring(0, 5));

    setPickerTime(dt);
    setShowModal(true);
  };

  const onTimeChange = (_: any, selected?: Date) => {
    setShowPicker(false);
    if (selected) {
      const hh = selected.getHours().toString().padStart(2, '0');
      const mm = selected.getMinutes().toString().padStart(2, '0');
      setTimeString(`${hh}:${mm}`);
    }
  };

  const markedDates: Record<string, any> = {};
  reminders.forEach(r => { markedDates[r.datetime.split('T')[0]] = { ...(markedDates[r.datetime.split('T')[0]]||{}), marked:true, dotColor:'#00B2A9' }; });
  markedDates[selectedDate] = { ...(markedDates[selectedDate]||{}), selected:true, selectedColor:'#00529B' };
  const filtered = reminders; // Ahora 'filtered' contiene todos los recordatorios

  const renderItem = ({ item }: { item: Reminder }) => (
    <View style={styles.itemRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitle}>{item.text}</Text>
      </View>
      {!!item.datetime && <Text style={styles.itemTime}>{new Date(item.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>}
      <TouchableOpacity onPress={() => onEdit(item)} style={styles.actionIcon}>
        <Ionicons name="pencil-outline" size={22} color="#007e99" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.actionIcon}>
        <Ionicons name="trash-outline" size={22} color="#d9534f" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/home')}>
          <Ionicons name="arrow-back" size={26} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recordatorios</Text>
      </View>
      <Text style={styles.screenDescription}>Tus recordatorios, citas y medicamentos, organizados para ti.</Text>

      <View style={styles.contentContainer}>
        <TouchableOpacity style={styles.fabTextButton} onPress={openModal}>
          <Text style={styles.fabButtonText}>Haz click aquí para agregar un recordatorio.</Text>
        </TouchableOpacity>
        <View style={styles.calendarContainer}>
          <Calendar
            current={selectedDate}
            onDayPress={day => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            theme={{ selectedDayTextColor:'white', todayTextColor:'#00B2A9', arrowColor:'#00529B' }}
            style={styles.calendar}
          />
        </View>
        {loading ? (
          <ActivityIndicator style={{ flex: 1 }} size="large" />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 120 }}
            showsVerticalScrollIndicator={false}
          />
        )}
        {!loading && reminders.length === 0 && (
          <View style={styles.emptyListContainer}>
            <Text style={styles.emptyListText}>No hay recordatorios.</Text>
          </View>
        )}
      </View>

      

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView style={styles.modalContainer} behavior={Platform.OS==='ios'?'padding':'height'}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{editingId ? 'Editar' : 'Nuevo'} Recordatorio</Text>
                <TextInput style={styles.input} placeholder="Ej: Cita con el médico a las 10 AM" value={message} onChangeText={setMessage} />
                
                <TouchableOpacity onPress={() => setShowPicker(true)} style={[styles.input, { justifyContent: 'center' }]}>  
                  <Text style={{ color: timeString ? '#000' : '#888' }}>{timeString || 'Selecciona hora'}</Text>
                </TouchableOpacity>
                {showPicker && (
                  <DateTimePicker
                    value={pickerTime}
                    mode="time"
                    display={Platform.OS==='android'?'compact':'spinner'}
                    onChange={onTimeChange}
                    textColor="#000"
                  />
                )}
                <View style={styles.modalButtons}>
                  <TouchableOpacity onPress={closeModal} style={styles.cancelButton}><Text style={styles.cancelText}>Cancelar</Text></TouchableOpacity>
                  <TouchableOpacity onPress={onSubmit} style={styles.saveButton}><Text style={styles.saveText}>{editingId?'Guardar':'Crear'}</Text></TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

import { Colors } from '../../constants/Colors';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.app.lightGray, alignItems: 'center' },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.tint,
    paddingVertical: 20,
    paddingHorizontal: 16,
    minHeight: 70,
  },
  headerTitle: { flex: 1, color: Colors.app.white, fontSize: 22, fontWeight: '700', marginLeft: 16 },
  headerSubtitle: { color: Colors.app.white, fontSize: 14, marginLeft: 16, marginTop: 4 },
  screenDescription: {
    fontSize: 18, // Increased font size
    color: Colors.app.darkText, // Changed to black
    textAlign: 'center',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    opacity: 0.7,
  },
  contentContainer: { flex: 1, width: '100%', maxWidth: 800 },
  calendarContainer: { backgroundColor: Colors.app.white, padding:8, margin: 16, borderRadius: 8 },
  calendar: { borderRadius:8 },
  itemRow: { flexDirection:'row', alignItems:'center', backgroundColor: Colors.app.white, padding:12, borderRadius:8, marginHorizontal:16, marginVertical:4 },
  itemTitle: { fontSize:16, fontWeight:'600', color: Colors.app.darkText },
  itemDetail: { fontSize:14, color: Colors.app.mediumText, marginTop:4 },
  itemTime: { fontSize:12, color: Colors.app.primary, marginLeft:8, alignSelf:'flex-end' },
  actionIcon: { marginHorizontal:8 },
  fab: { position: 'absolute', right: 20, backgroundColor: Colors.app.primary, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  fabTextButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8, // Reduced border radius
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    maxWidth: '90%', // Increased width
    alignSelf: 'center', // Center horizontally
    marginBottom: 15, // Add margin below the button
  },
  fabButtonText: {
    color: Colors.app.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', alignItems:'center' },
  modalContainer: { width:'90%', maxHeight:'80%', maxWidth: 500 },
  modalContent: { backgroundColor: Colors.app.white, borderRadius:8, padding:16 },
  modalTitle: { fontSize:18, fontWeight:'600', marginBottom:12, color: Colors.app.secondary },
  input: { 
    borderWidth:1, 
    borderColor: Colors.app.gray2, 
    borderRadius:8, 
    paddingHorizontal:12, 
    paddingVertical:8, 
    marginBottom:12, 
    backgroundColor: Colors.app.gray3, 
    color: Colors.app.darkText, // Asegurar que el texto sea visible
  },
  modalButtons: { flexDirection:'row', justifyContent:'flex-end' },
  cancelButton: { marginRight:12 },
  cancelText: { color: Colors.app.danger, fontSize:16 },
  saveButton: { backgroundColor: Colors.app.primary, paddingHorizontal:16, paddingVertical:8, borderRadius:8 },
  saveText: { color: Colors.app.white, fontSize:16, fontWeight:'600' },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyListText: {
    fontSize: 18,
    color: Colors.app.mediumText,
    textAlign: 'center',
    marginTop: 10,
  },
  emptyListSubText: {
    fontSize: 14,
    color: Colors.app.gray2,
    textAlign: 'center',
    marginTop: 5,
  },
});
