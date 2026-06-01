import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { use$ } from '@legendapp/state/react';

import { workouts$, workoutExercises$, sets$, exercises$ } from '@/src/state/store';
import { activeWorkoutId$ } from '@/src/state/workout';
import { newId } from '@/src/lib/ids';
import type { SetRow, WorkoutExerciseRow } from '@/src/domain/types';

// ---------- helpers ----------

function useElapsed(startedAt: string | null) {
  const [secs, setSecs] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!startedAt) return;
    const base = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    setSecs(base);
    ref.current = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [startedAt]);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}

function fmtWeight(v: number | null) { return v != null ? String(v) : ''; }
function fmtReps(v: number | null) { return v != null ? String(v) : ''; }
function parseNum(s: string): number | null {
  const n = parseFloat(s.replace(',', '.'));
  return isNaN(n) ? null : n;
}

// ---------- set row component ----------

interface SetRowProps {
  set: SetRow;
  index: number;
  onUpdate: (patch: Partial<SetRow>) => void;
}

function SetRowItem({ set, index, onUpdate }: SetRowProps) {
  const isCompleted = set.is_completed;
  return (
    <View style={[srs.row, isCompleted && srs.rowDone]}>
      <Text style={srs.num}>{index + 1}</Text>

      <TextInput
        style={[srs.input, srs.weightInput]}
        value={fmtWeight(set.weight)}
        onChangeText={(v) => onUpdate({ weight: parseNum(v) })}
        keyboardType="decimal-pad"
        placeholder="kg"
        placeholderTextColor="#444"
        editable={!isCompleted}
      />
      <Text style={srs.x}>×</Text>
      <TextInput
        style={[srs.input, srs.repsInput]}
        value={fmtReps(set.reps)}
        onChangeText={(v) => onUpdate({ reps: parseNum(v) })}
        keyboardType="number-pad"
        placeholder="reps"
        placeholderTextColor="#444"
        editable={!isCompleted}
      />

      {/* RPE opcional */}
      {(set.rpe != null || !isCompleted) && (
        <TextInput
          style={[srs.input, srs.rpeInput]}
          value={set.rpe != null ? String(set.rpe) : ''}
          onChangeText={(v) => onUpdate({ rpe: parseNum(v) })}
          keyboardType="decimal-pad"
          placeholder="RPE"
          placeholderTextColor="#333"
          editable={!isCompleted}
        />
      )}

      <TouchableOpacity
        style={[srs.check, isCompleted && srs.checkDone]}
        onPress={() => onUpdate({ is_completed: !isCompleted })}>
        <Text style={srs.checkText}>{isCompleted ? '✓' : ''}</Text>
      </TouchableOpacity>
    </View>
  );
}

const srs = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  rowDone: { opacity: 0.5 },
  num: { width: 20, color: '#555', fontSize: 13, textAlign: 'center' },
  input: {
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 8,
    color: '#fff',
    fontSize: 15,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  weightInput: { width: 64 },
  repsInput: { width: 52 },
  rpeInput: { width: 52 },
  x: { color: '#444', fontSize: 14 },
  check: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  checkDone: { backgroundColor: '#2d7a3a', borderColor: '#2d7a3a' },
  checkText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

// ---------- exercise card component ----------

interface ExCardProps {
  wx: WorkoutExerciseRow;
  allSets: Record<string, SetRow>;
  allExercises: Record<string, { name: string }>;
  workoutId: string;
  onRemove: () => void;
}

function ExerciseCard({ wx, allSets, allExercises, workoutId, onRemove }: ExCardProps) {
  const wxSets = Object.values(allSets)
    .filter((s) => s.workout_exercise_id === wx.id && !s.deleted)
    .sort((a, b) => a.position - b.position);

  const exName = allExercises[wx.exercise_id]?.name ?? 'Exercício';

  // Último desempenho (de treinos anteriores)
  const pastSets = Object.entries(allSets)
    .filter(([, s]) => {
      if (s.workout_exercise_id === wx.id || s.deleted) return false;
      const parentWx = Object.values({} as Record<string, WorkoutExerciseRow>);
      void parentWx;
      return false; // simplificado; ver comentário abaixo
    });
  void pastSets; // TODO: integrar lastPerformance aqui na Fase 6 UI

  const addSet = () => {
    const last = wxSets[wxSets.length - 1];
    const id = newId();
    sets$[id].set({
      id,
      workout_exercise_id: wx.id,
      position: (last?.position ?? 0) + 1,
      weight: last?.weight ?? null,
      reps: last?.reps ?? null,
      rpe: null,
      rir: null,
      set_type: 'normal',
      is_completed: false,
    } as never);
  };

  const updateSet = (setId: string, patch: Partial<SetRow>) => {
    sets$[setId].set((prev: SetRow) => ({ ...prev, ...patch }));
  };

  // removeSet: disponível para swipe-to-delete (Fase futura)
  // const removeSet = (setId: string) => { sets$[setId].deleted.set(true); };

  return (
    <View style={ecs.card}>
      <View style={ecs.cardHeader}>
        <Text style={ecs.exName}>{exName}</Text>
        <TouchableOpacity onPress={onRemove} style={ecs.removeBtn}>
          <Text style={ecs.removeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Cabeçalho da tabela */}
      {wxSets.length > 0 && (
        <View style={ecs.tableHeader}>
          <Text style={[ecs.th, { width: 20 }]}>#</Text>
          <Text style={[ecs.th, { width: 64 }]}>Peso</Text>
          <Text style={[ecs.th, { width: 52 }]}>Reps</Text>
          <Text style={[ecs.th, { width: 52 }]}>RPE</Text>
          <Text style={[ecs.th, { marginLeft: 'auto', width: 36 }]}>✓</Text>
        </View>
      )}

      {wxSets.map((s, i) => (
        <SetRowItem
          key={s.id}
          set={s}
          index={i}
          onUpdate={(patch) => updateSet(s.id, patch)}
        />
      ))}

      <TouchableOpacity style={ecs.addSet} onPress={addSet}>
        <Text style={ecs.addSetText}>+ Série</Text>
      </TouchableOpacity>
    </View>
  );
}

const ecs = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  exName: { fontSize: 16, fontWeight: '700', color: '#fff', flex: 1 },
  removeBtn: { padding: 4 },
  removeBtnText: { color: '#444', fontSize: 18 },
  tableHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  th: { color: '#444', fontSize: 11, textAlign: 'center' },
  addSet: { marginTop: 8, paddingVertical: 8, alignItems: 'center' },
  addSetText: { color: '#4f9cf9', fontSize: 14, fontWeight: '600' },
});

// ---------- main workout screen ----------

export default function WorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const workoutsMap = use$(workouts$);
  const wxMap = use$(workoutExercises$) ?? {};
  const setsMap = use$(sets$) ?? {};
  const exercisesMap = use$(exercises$) ?? {};

  const workout = workoutsMap?.[id];
  const elapsed = useElapsed(workout?.started_at ?? null);

  const wxList = Object.values(wxMap)
    .filter((wx) => wx.workout_id === id && !wx.deleted)
    .sort((a, b) => a.position - b.position);

  const finishWorkout = () => {
    const completedSets = Object.values(setsMap).filter(
      (s) => !s.deleted && wxList.some((wx) => wx.id === s.workout_exercise_id) && s.is_completed,
    );
    if (wxList.length === 0 || completedSets.length === 0) {
      Alert.alert(
        'Finalizar treino',
        'Você não registrou nenhuma série. Deseja mesmo finalizar?',
        [
          { text: 'Continuar treinando', style: 'cancel' },
          { text: 'Finalizar', onPress: doFinish },
        ],
      );
      return;
    }
    doFinish();
  };

  const doFinish = () => {
    workouts$[id].ended_at.set(new Date().toISOString());
    activeWorkoutId$.set(null);
    router.back();
  };

  const discardWorkout = () => {
    Alert.alert('Descartar treino', 'Descartar este treino sem salvar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => {
          // Soft-delete sets + workout_exercises + workout
          wxList.forEach((wx) => {
            Object.values(setsMap)
              .filter((s) => s.workout_exercise_id === wx.id)
              .forEach((s) => sets$[s.id].deleted.set(true));
            workoutExercises$[wx.id].deleted.set(true);
          });
          workouts$[id].deleted.set(true);
          activeWorkoutId$.set(null);
          router.back();
        },
      },
    ]);
  };

  const addExercise = () => {
    router.push(`/exercises/picker?workoutId=${id}&position=${wxList.length}`);
  };

  const removeExercise = (wxId: string) => {
    Object.values(setsMap)
      .filter((s) => s.workout_exercise_id === wxId)
      .forEach((s) => sets$[s.id].deleted.set(true));
    workoutExercises$[wxId].deleted.set(true);
  };

  if (!workout) {
    return (
      <SafeAreaView style={ws.safe}>
        <Text style={{ color: '#fff', padding: 20 }}>Treino não encontrado.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={ws.safe} edges={['top']}>
      {/* Header */}
      <View style={ws.header}>
        <TouchableOpacity style={ws.headerBtn} onPress={discardWorkout}>
          <Text style={ws.discard}>Descartar</Text>
        </TouchableOpacity>
        <View style={ws.headerCenter}>
          <Text style={ws.headerTitle} numberOfLines={1}>{workout.name ?? 'Treino'}</Text>
          <Text style={ws.timer}>{elapsed}</Text>
        </View>
        <TouchableOpacity style={[ws.headerBtn, ws.finishBtn]} onPress={finishWorkout}>
          <Text style={ws.finishText}>Finalizar</Text>
        </TouchableOpacity>
      </View>

      {/* Corpo */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <ScrollView
          style={ws.scroll}
          contentContainerStyle={ws.content}
          keyboardShouldPersistTaps="handled">
          {wxList.map((wx) => (
            <ExerciseCard
              key={wx.id}
              wx={wx}
              allSets={setsMap}
              allExercises={exercisesMap}
              workoutId={id}
              onRemove={() => removeExercise(wx.id)}
            />
          ))}

          <TouchableOpacity style={ws.addEx} onPress={addExercise}>
            <Text style={ws.addExText}>+ Adicionar exercício</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const ws = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f0f' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  headerBtn: { minWidth: 80 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  timer: { color: '#4f9cf9', fontSize: 13, marginTop: 2 },
  discard: { color: '#666', fontSize: 15 },
  finishBtn: { alignItems: 'flex-end' },
  finishText: { color: '#4f9cf9', fontSize: 15, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 60 },
  addEx: {
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  addExText: { color: '#4f9cf9', fontSize: 16, fontWeight: '600' },
});
