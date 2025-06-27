import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUser } from '../../context/UserContext';

const { width } = Dimensions.get('window');
import { API_URL } from '../../constants/Api';

const HEALTH_API_URL = `${API_URL}/health`;
const PAGE_SIZE = 10;

type HealthRecord = { id: string; parameter: string; value: string; timestamp: string };

export default function HealthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { username } = useUser();

  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [filtered, setFiltered] = useState<HealthRecord[]>([]);
  const [page, setPage] = useState(1);
  const [parameter, setParameter] = useState('');
  const [value, setValue] = useState('');
  const [filterText, setFilterText] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState<HealthRecord | null>(null);
  const paramRef = useRef<TextInput>(null);

  const fetchHealth = async () => {
    if (!username) return;
    setLoading(true);
    try {
      const res = await fetch(`${HEALTH_API_URL}/${encodeURIComponent(username)}`);
      
      // Si la respuesta es 404 (No encontrado), es un caso válido (sin registros)
      if (res.status === 404) {
        setRecords([]);
        setFiltered([]);
      } else if (res.ok) {
        // Si la respuesta es exitosa (ej. 200)
        const data: HealthRecord[] = await res.json();
        setRecords(data);
        setFiltered(data);
      } else {
        // Para otros errores (500, etc.), lanzamos un error para el catch
        throw new Error('Error del servidor');
      }
    } catch (error) {
      // El catch ahora solo se activa para errores de red u otros errores del servidor
      Alert.alert('Error', 'No se pudieron cargar los registros de salud');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHealth(); }, [username]);

  // Pagination slice
  const pageData = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = filtered.length > page * PAGE_SIZE;

  // Filter
  useEffect(() => {
    const lower = filterText.toLowerCase();
    setFiltered(records.filter(r => r.parameter.toLowerCase().includes(lower)));
    setPage(1);
  }, [filterText, records]);

  const openModal = (record?: HealthRecord) => {
    if (record) {
      setEditRecord(record);
      setParameter(record.parameter);
      setValue(record.value);
    } else {
      setEditRecord(null);
      setParameter('');
      setValue('');
    }
    setModalVisible(true);
  };
  const closeModal = () => setModalVisible(false);

  const onSubmit = async () => {
    Keyboard.dismiss();
    if (!parameter.trim() || !value.trim()) {
      return Alert.alert('Error', 'Parámetro y valor son obligatorios');
    }
    const method = editRecord ? 'PUT' : 'POST';
    const url = editRecord ? `${HEALTH_API_URL}/${editRecord.id}` : `${HEALTH_API_URL}/`;
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: username, parameter, value }),
      });
      if (!res.ok) throw new Error();
      closeModal();
      fetchHealth();
    } catch {
      Alert.alert('Error', editRecord ? 'No se pudo actualizar' : 'No se pudo crear');
    }
  };

  /* const onDelete = (id: string) => {
    Alert.alert('Eliminar', '¿Eliminar este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'OK', onPress: async () => {
        try {
          const res = await fetch(`${HEALTH_API_URL}/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error();
          fetchHealth();
        } catch {
          Alert.alert('Error', 'No se pudo eliminar');
        }
      }},
    ]);
  }; */

  const renderItem = ({ item }: { item: HealthRecord }) => (
    <View style={styles.itemRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemParam}>{item.parameter}</Text>
        <Text style={styles.itemValue}>{item.value}</Text>
      </View>
      <Text style={styles.itemTime}>{new Date(item.timestamp).toLocaleString()}</Text>
      <TouchableOpacity onPress={() => openModal(item)} style={styles.actionIcon}>
        <Ionicons name="pencil-outline" size={20} color="#007e99" />
      </TouchableOpacity>
      {/* <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.actionIcon}>
        <Ionicons name="trash-outline" size={20} color="#d9534f" />
      </TouchableOpacity> */}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Salud</Text>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.filterContainer}>
          <TextInput
            style={styles.filterInput}
            placeholder="Filtrar parámetro"
            value={filterText}
            onChangeText={setFilterText}
          />
          <TouchableOpacity style={styles.fab} onPress={() => openModal()}>
            <Ionicons name="add" size={28} color="white" />
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator style={{ flex: 1 }} size="large" />
        ) : (
          <FlatList
            data={pageData}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            ListFooterComponent={
              hasMore ? (
                <TouchableOpacity onPress={() => setPage(prev => prev + 1)} style={styles.loadMore}>
                  <Text style={styles.loadMoreText}>Cargar más</Text>
                </TouchableOpacity>
              ) : null
            }
            contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Modal form */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView style={styles.modalContainer} behavior={Platform.OS==='ios'?'padding':'height'}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{editRecord ? 'Editar' : 'Nuevo'} Registro</Text>
                <TextInput
                  ref={paramRef}
                  style={styles.input}
                  placeholder="Parámetro"
                  value={parameter}
                  onChangeText={setParameter}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Valor"
                  value={value}
                  onChangeText={setValue}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity onPress={closeModal} style={styles.cancelButton}><Text style={styles.cancelText}>Cancelar</Text></TouchableOpacity>
                  <TouchableOpacity onPress={onSubmit} style={styles.saveButton}><Text style={styles.saveText}>{editRecord?'Guardar':'Crear'}</Text></TouchableOpacity>
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
  filterContainer: { flexDirection:'row', alignItems:'center', padding:16, backgroundColor: Colors.app.white },
  filterInput: { flex:1, borderWidth:1, borderColor: Colors.app.gray2, borderRadius:8, paddingHorizontal:12, paddingVertical:8, backgroundColor: Colors.app.gray3 },
  fab: { marginLeft:8, backgroundColor: Colors.app.primary, width:48, height:48, borderRadius:24, justifyContent:'center', alignItems:'center' },
  itemRow: { flexDirection:'row', alignItems:'center', backgroundColor: Colors.app.white, padding:12, borderRadius:8, marginVertical:4 },
  itemParam: { fontSize:16, fontWeight:'600', color: Colors.app.darkText },
  itemValue: { fontSize:14, color: Colors.app.mediumText, marginTop:4 },
  itemTime: { fontSize:12, color: Colors.app.primary, marginLeft:8 },
  actionIcon: { marginHorizontal:8 },
  loadMore: { padding:12, alignItems:'center' },
  loadMoreText: { color: Colors.app.primary, fontSize:16 },
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', alignItems:'center' },
  modalContainer: { width:'90%', maxWidth: 500 },
  modalContent: { backgroundColor: Colors.app.white, borderRadius:8, padding:16 },
  modalTitle: { fontSize:18, fontWeight:'600', marginBottom:12, color: Colors.app.secondary },
  input: { borderWidth:1, borderColor: Colors.app.gray2, borderRadius:8, paddingHorizontal:12, paddingVertical:8, marginBottom:12, backgroundColor: Colors.app.gray3 },
  modalButtons: { flexDirection:'row', justifyContent:'flex-end' },
  cancelButton: { marginRight:12 },
  cancelText: { color: Colors.app.danger, fontSize:16 },
  saveButton: { backgroundColor: Colors.app.primary, paddingHorizontal:16, paddingVertical:8, borderRadius:8 },
  saveText: { color: Colors.app.white, fontSize:16, fontWeight:'600' },
});
