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

import { exercises$, workoutExercises$, routineExercises$ } from '@/src/state/store';
import { newId } from '@/src/lib/ids';
import { normalizeName } from '@/src/seed/selection';
import { useColors, type ThemeColors } from '@/src/lib/theme';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Peito', lats: 'Costas', 'middle back': 'Costas méd.', 'lower back': 'Lombar',
  shoulders: 'Ombros', biceps: 'Bíceps', triceps: 'Tríceps', forearms: 'Antebraço',
  quadriceps: 'Quadríceps', hamstrings: 'Posterior', glutes: 'Glúteo',
  calves: 'Panturrilha', abdominals: 'Abdômen', traps: 'Trapézio',
};

export default function ExercisePickerScreen() {
  // O picker serve a dois alvos: adicionar exercício a um TREINO ativo
  // (workoutId) ou a uma ROTINA-template (routineId). Quem chama passa um dos
  // dois; o `position` controla a ordem de inserção.
  const { workoutId, routineId, position } = useLocalSearchParams<{
    workoutId?: string;
    routineId?: string;
    position: string;
  }>();
  const router = useRouter();
  const c = useColors();
  const styles = makeStyles(c);
  const exercisesMap = use$(exercises$);
  const [query, setQuery] = useState('');

  // Dedup defensivo por nome normalizado (caso o sync local ainda não tenha
  // removido duplicados soft-deletados no servidor).
  const seen = new Set<string>();
  const allExercises = Object.values(exercisesMap ?? {})
    .filter((e) => !e.deleted)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    .filter((e) => {
      const key = normalizeName(e.name);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

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
    const pos = parseInt(position ?? '0', 10);
    if (routineId) {
      routineExercises$[id].set({
        id,
        routine_id: routineId,
        exercise_id: exerciseId,
        position: pos,
        target_sets: null,
        target_reps: null,
        notes: null,
      } as never);
    } else {
      workoutExercises$[id].set({
        id,
        workout_id: workoutId,
        exercise_id: exerciseId,
        position: pos,
        notes: null,
        superset_group: null,
      } as never);
    }
    router.back();
  };

  const muscleTag = (e: (typeof allExercises)[0]) => {
    const m = e.primary_muscles?.[0];
    return m ? (MUSCLE_LABELS[m] ?? m) : '';
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Escolher exercício</Text>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
          <Text style={styles.closeText}>Fechar</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Buscar por nome ou músculo..."
          placeholderTextColor={c.textFaint}
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

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.surfaceAlt },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 4,
    },
    topTitle: { fontSize: 18, fontWeight: '700', color: c.text },
    closeBtn: { paddingVertical: 6, paddingHorizontal: 8 },
    closeText: { color: c.accent, fontSize: 16, fontWeight: '600' },
    searchBar: { padding: 12, borderBottomWidth: 1, borderBottomColor: c.inputBg },
    input: {
      backgroundColor: c.inputBg,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 15,
      color: c.text,
    },
    list: { paddingBottom: 40 },
    sep: { height: 1, backgroundColor: c.surface, marginLeft: 16 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: c.surfaceAlt,
    },
    rowBody: { flex: 1 },
    name: { fontSize: 15, color: c.text, fontWeight: '500' },
    muscle: { fontSize: 12, color: c.textFaint, marginTop: 2 },
    arrow: { color: c.textFaint, fontSize: 22 },
    empty: { padding: 40, alignItems: 'center' },
    emptyText: { color: c.textFaint, fontSize: 15 },
  });
