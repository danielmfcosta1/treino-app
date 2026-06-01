import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { use$ } from '@legendapp/state/react';

import { exercises$, workoutExercises$ } from '@/src/state/store';
import { newId } from '@/src/lib/ids';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Peito', lats: 'Costas', 'middle back': 'Costas méd.', 'lower back': 'Lombar',
  shoulders: 'Ombros', biceps: 'Bíceps', triceps: 'Tríceps', forearms: 'Antebraço',
  quadriceps: 'Quadríceps', hamstrings: 'Posterior', glutes: 'Glúteo',
  calves: 'Panturrilha', abdominals: 'Abdômen', traps: 'Trapézio',
};

export default function ExercisePickerScreen() {
  const { workoutId, position } = useLocalSearchParams<{ workoutId: string; position: string }>();
  const router = useRouter();
  const exercisesMap = use$(exercises$);
  const [query, setQuery] = useState('');

  const allExercises = Object.values(exercisesMap ?? {})
    .filter((e) => !e.deleted)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  const filtered = query.trim()
    ? allExercises.filter(
        (e) =>
          e.name.toLowerCase().includes(query.toLowerCase()) ||
          e.primary_muscles?.some((m) =>
            (MUSCLE_LABELS[m] ?? m).toLowerCase().includes(query.toLowerCase()),
          ),
      )
    : allExercises;

  const pickExercise = (exerciseId: string) => {
    const id = newId();
    workoutExercises$[id].set({
      id,
      workout_id: workoutId,
      exercise_id: exerciseId,
      position: parseInt(position ?? '0', 10),
      notes: null,
      superset_group: null,
    } as never);
    router.back();
  };

  const muscleTag = (e: (typeof allExercises)[0]) => {
    const m = e.primary_muscles?.[0];
    return m ? (MUSCLE_LABELS[m] ?? m) : '';
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Buscar por nome ou músculo..."
          placeholderTextColor="#555"
          value={query}
          onChangeText={setQuery}
          autoFocus
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(e) => e.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhum exercício encontrado.</Text>
          </View>
        }
        renderItem={({ item: e }) => (
          <TouchableOpacity style={styles.row} onPress={() => pickExercise(e.id)}>
            <View style={styles.rowBody}>
              <Text style={styles.name}>{e.name}</Text>
              <Text style={styles.muscle}>{muscleTag(e)}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111' },
  searchBar: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
  input: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#fff',
  },
  list: { paddingBottom: 40 },
  sep: { height: 1, backgroundColor: '#1a1a1a', marginLeft: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#111',
  },
  rowBody: { flex: 1 },
  name: { fontSize: 15, color: '#fff', fontWeight: '500' },
  muscle: { fontSize: 12, color: '#555', marginTop: 2 },
  arrow: { color: '#333', fontSize: 22 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#555', fontSize: 15 },
});
