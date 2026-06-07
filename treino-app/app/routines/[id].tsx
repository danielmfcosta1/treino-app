import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { use$ } from '@legendapp/state/react';

import { routines$, routineExercises$, exercises$ } from '@/src/state/store';
import { useColors, type ThemeColors } from '@/src/lib/theme';
import type { ExerciseRow } from '@/src/domain/types';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Peito', lats: 'Costas', 'middle back': 'Costas méd.', 'lower back': 'Lombar',
  shoulders: 'Ombros', biceps: 'Bíceps', triceps: 'Tríceps', forearms: 'Antebraço',
  quadriceps: 'Quadríceps', hamstrings: 'Posterior', glutes: 'Glúteo',
  calves: 'Panturrilha', abdominals: 'Abdômen', traps: 'Trapézio',
};

interface RoutineExerciseRow {
  id: string;
  routine_id: string;
  exercise_id: string;
  position: number;
  deleted?: boolean;
}

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const c = useColors();
  const s = makeStyles(c);

  const routinesMap = use$(routines$);
  const rxMap = (use$(routineExercises$) ?? {}) as Record<string, RoutineExerciseRow | undefined>;
  const exercisesMap = (use$(exercises$) ?? {}) as Record<string, ExerciseRow | undefined>;

  const routine = routinesMap?.[id];

  const items = Object.values(rxMap)
    .filter((rx): rx is RoutineExerciseRow => !!rx && rx.routine_id === id && !rx.deleted)
    .sort((a, b) => a.position - b.position);

  const addExercise = () => {
    router.push(`/exercises/picker?routineId=${id}&position=${items.length}`);
  };

  const removeExercise = (rxId: string, name: string) => {
    Alert.alert('Remover exercício', `Remover "${name}" da rotina?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => routineExercises$[rxId].deleted.set(true),
      },
    ]);
  };

  const muscleTag = (ex?: ExerciseRow) => {
    const m = ex?.primary_muscles?.[0];
    return m ? (MUSCLE_LABELS[m] ?? m) : '';
  };

  if (!routine) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={s.backBtn}>
            <Text style={s.backText}>‹ Voltar</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ color: c.text, padding: 20 }}>Rotina não encontrada.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={s.backBtn}>
          <Text style={s.backText}>‹ Voltar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>{routine.name}</Text>
        {routine.notes ? <Text style={s.notes}>{routine.notes}</Text> : null}
        <Text style={s.count}>
          {items.length} {items.length === 1 ? 'exercício' : 'exercícios'}
        </Text>

        <View style={s.listWrap}>
          {items.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyText}>Nenhum exercício nesta rotina ainda.</Text>
              <Text style={s.emptyHint}>
                Toque em “+ Adicionar exercício” para montar o template.
              </Text>
            </View>
          ) : (
            items.map((rx, i) => {
              const ex = exercisesMap[rx.exercise_id];
              const name = ex?.name ?? 'Exercício';
              return (
                <View key={rx.id} style={s.row}>
                  <Text style={s.rowNum}>{i + 1}</Text>
                  <View style={s.rowBody}>
                    <Text style={s.rowName}>{name}</Text>
                    {muscleTag(ex) ? <Text style={s.rowMuscle}>{muscleTag(ex)}</Text> : null}
                  </View>
                  <TouchableOpacity
                    style={s.removeBtn}
                    hitSlop={8}
                    onPress={() => removeExercise(rx.id, name)}>
                    <Text style={s.removeText}>✕</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        <TouchableOpacity style={s.addBtn} onPress={addExercise}>
          <Text style={s.addBtnText}>+ Adicionar exercício</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
    backBtn: { paddingVertical: 6, alignSelf: 'flex-start' },
    backText: { color: c.accent, fontSize: 16, fontWeight: '600' },
    content: { padding: 20, paddingTop: 8, paddingBottom: 40 },
    title: { fontSize: 28, fontWeight: '700', color: c.text },
    notes: { fontSize: 15, color: c.textDim, marginTop: 4 },
    count: { fontSize: 13, color: c.accent, marginTop: 8, marginBottom: 16 },
    listWrap: { gap: 10 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
      gap: 12,
    },
    rowNum: { width: 22, textAlign: 'center', color: c.textFaint, fontSize: 15, fontWeight: '700' },
    rowBody: { flex: 1 },
    rowName: { fontSize: 15, fontWeight: '600', color: c.text },
    rowMuscle: { fontSize: 12, color: c.textFaint, marginTop: 2 },
    removeBtn: { padding: 6 },
    removeText: { color: c.textFaint, fontSize: 18 },
    empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
    emptyText: { fontSize: 15, color: c.textFaint, fontWeight: '500' },
    emptyHint: { fontSize: 13, color: c.textFaint, textAlign: 'center', lineHeight: 18 },
    addBtn: {
      backgroundColor: c.accentBg,
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
      marginTop: 16,
      borderWidth: 1,
      borderColor: c.accent,
    },
    addBtnText: { color: c.accentSoft, fontSize: 15, fontWeight: '600' },
  });
