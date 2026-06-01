import { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { use$ } from '@legendapp/state/react';

import { routines$, routineExercises$ } from '@/src/state/store';
import { newId } from '@/src/lib/ids';

export default function RoutinesScreen() {
  const routinesMap = use$(routines$);
  const rxMap = use$(routineExercises$);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  const routineList = Object.values(routinesMap ?? {})
    .filter((r) => !r.deleted)
    .sort((a, b) => a.position - b.position);

  const exerciseCount = (routineId: string) =>
    Object.values(rxMap ?? {}).filter(
      (rx) => rx.routine_id === routineId && !rx.deleted,
    ).length;

  const createRoutine = () => {
    if (!name.trim()) return;
    const id = newId();
    routines$[id].set({
      id,
      name: name.trim(),
      notes: notes.trim() || null,
      position: routineList.length,
    } as never);
    setName('');
    setNotes('');
    setShowCreate(false);
  };

  const deleteRoutine = (id: string, rName: string) => {
    Alert.alert('Excluir rotina', `Excluir "${rName}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => routines$[id].deleted.set(true),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Rotinas</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
          <Text style={styles.addBtnText}>+ Nova</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={routineList}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhuma rotina criada.</Text>
            <Text style={styles.emptyHint}>
              Crie uma rotina para organizar seus treinos (A/B/C, Push-Pull-Legs, etc.)
            </Text>
          </View>
        }
        renderItem={({ item: r }) => (
          <View style={styles.card}>
            <View style={styles.cardBody}>
              <Text style={styles.cardName}>{r.name}</Text>
              {r.notes ? <Text style={styles.cardNotes}>{r.notes}</Text> : null}
              <Text style={styles.cardCount}>{exerciseCount(r.id)} exercícios</Text>
            </View>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => deleteRoutine(r.id, r.name)}>
              <Text style={styles.deleteBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal
        visible={showCreate}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreate(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Text style={styles.cancel}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nova rotina</Text>
            <TouchableOpacity onPress={createRoutine} disabled={!name.trim()}>
              <Text style={[styles.save, !name.trim() && styles.saveDisabled]}>Salvar</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <TextInput
              style={styles.input}
              placeholder="Nome (ex: Push A, Peito/Tríceps)"
              placeholderTextColor="#555"
              value={name}
              onChangeText={setName}
              autoFocus
            />
            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder="Notas (opcional)"
              placeholderTextColor="#555"
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f0f' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#fff' },
  addBtn: { backgroundColor: '#4f9cf9', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  cardBody: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  cardNotes: { fontSize: 13, color: '#666', marginTop: 2 },
  cardCount: { fontSize: 12, color: '#4f9cf9', marginTop: 6 },
  deleteBtn: { padding: 8 },
  deleteBtnText: { color: '#555', fontSize: 18 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 10, paddingHorizontal: 20 },
  emptyText: { fontSize: 16, color: '#555', fontWeight: '500' },
  emptyHint: { fontSize: 14, color: '#3a3a3a', textAlign: 'center', lineHeight: 20 },
  modal: { flex: 1, backgroundColor: '#111' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#fff' },
  cancel: { fontSize: 16, color: '#888' },
  save: { fontSize: 16, color: '#4f9cf9', fontWeight: '600' },
  saveDisabled: { color: '#333' },
  modalBody: { padding: 20, gap: 12 },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
});
