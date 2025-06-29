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
import { useRouter } from 'expo-router';
import { useUser } from '../../context/UserContext';

const { width } = Dimensions.get('window');
import { API_URL } from '../../constants/Api';

const REMINDERS_API_URL = `${API_URL}/reminders`;

type Reminder = { id: string; text: string; datetime: string; };

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
        const data = await res.json();
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

  useEffect(() => { fetchReminders(); }, [selectedDate, username, token]);

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
        try { await fetch(`${REMINDERS_API_URL}/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); fetchReminders(); }
        catch { Alert.alert('Error', 'No se pudo eliminar'); }
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
  const filtered = reminders.filter(r => r.datetime.split('T')[0] === selectedDate);

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
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recordatorios</Text>
      </View>

      <View style={styles.contentContainer}>
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
            ListFooterComponent={<View style={{ height: insets.bottom + 16 }} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + 20 }]} onPress={openModal}>
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView style={styles.modalContainer} behavior={Platform.OS==='ios'?'padding':'height'}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{editingId ? 'Editar' : 'Nuevo'} Recordatorio</Text>
                <TextInput style={styles.input} placeholder="Mensaje" value={message} onChangeText={setMessage} />
                
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
  header: { width: '100%', flexDirection:'row', alignItems:'center', backgroundColor: Colors.app.primary, paddingVertical:20, paddingHorizontal:16 },
  headerTitle: { flex:1, color: Colors.app.white, fontSize:22, fontWeight:'700', marginLeft:16 },
  contentContainer: { flex: 1, width: '100%', maxWidth: 800 },
  calendarContainer: { backgroundColor: Colors.app.white, padding:8, margin: 16, borderRadius: 8 },
  calendar: { borderRadius:8 },
  itemRow: { flexDirection:'row', alignItems:'center', backgroundColor: Colors.app.white, padding:12, borderRadius:8, marginHorizontal:16, marginVertical:4 },
  itemTitle: { fontSize:16, fontWeight:'600', color: Colors.app.darkText },
  itemDetail: { fontSize:14, color: Colors.app.mediumText, marginTop:4 },
  itemTime: { fontSize:12, color: Colors.app.primary, marginLeft:8, alignSelf:'flex-end' },
  actionIcon: { marginHorizontal:8 },
  fab: { position: 'absolute', right: 20, backgroundColor: Colors.app.primary, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', alignItems:'center' },
  modalContainer: { width:'90%', maxHeight:'80%', maxWidth: 500 },
  modalContent: { backgroundColor: Colors.app.white, borderRadius:8, padding:16 },
  modalTitle: { fontSize:18, fontWeight:'600', marginBottom:12, color: Colors.app.secondary },
  input: { borderWidth:1, borderColor: Colors.app.gray2, borderRadius:8, paddingHorizontal:12, paddingVertical:8, marginBottom:12, backgroundColor: Colors.app.gray3 },
  modalButtons: { flexDirection:'row', justifyContent:'flex-end' },
  cancelButton: { marginRight:12 },
  cancelText: { color: Colors.app.danger, fontSize:16 },
  saveButton: { backgroundColor: Colors.app.primary, paddingHorizontal:16, paddingVertical:8, borderRadius:8 },
  saveText: { color: Colors.app.white, fontSize:16, fontWeight:'600' },
});
