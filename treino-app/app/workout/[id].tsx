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
import { defaultRestSeconds$, startRest } from '@/src/state/restTimer';
import { RestTimerBar } from '@/src/components/RestTimerBar';
import { newId } from '@/src/lib/ids';
import { buildExerciseHistory } from '@/src/domain/aggregate';
import { getLastPerformance } from '@/src/domain/lastPerformance';
import { suggestNextLoad, type SuggestionReason } from '@/src/domain/progression';
import type { SetRow, WorkoutExerciseRow, WorkoutRow } from '@/src/domain/types';

type RowMap<T> = Record<string, T | undefined>;

const EQUIPMENT_OPTIONS = [
  'Barra',
  'Halteres',
  'Máquina',
  'Smith',
  'Cabo',
  'Polia',
  'Peso corporal',
  'Kettlebell',
];

// ---------- helpers ----------

function useElapsed(startedAt: string | null) {
  const [secs, setSecs] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!startedAt) return;
    const base = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    setSecs(base);
    ref.current = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [startedAt]);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}

function parseNum(s: string): number | null {
  const n = parseFloat(s.replace(',', '.'));
  return isNaN(n) ? null : n;
}

const REASON_LABEL: Record<SuggestionReason, string> = {
  increase_weight: 'subir carga',
  add_rep: '+1 rep',
  consolidate: 'consolidar',
  reduce_weight: 'reduzir carga',
};

// ---------- set row ----------

interface SetRowProps {
  set: SetRow;
  index: number;
  onUpdate: (patch: Partial<SetRow>) => void;
  onComplete: () => void;
  onRemove: () => void;
}

function SetRowItem({ set, index, onUpdate, onComplete, onRemove }: SetRowProps) {
  const done = set.is_completed;
  const [noteOpen, setNoteOpen] = useState(false);
  const hasNote = !!(set.notes && set.notes.trim());

  return (
    <View>
      <View style={[srs.row, done && srs.rowDone]}>
        <Text style={srs.num}>{index + 1}</Text>
        <TextInput
          style={[srs.input, srs.weightInput]}
          value={set.weight != null ? String(set.weight) : ''}
          onChangeText={(v) => onUpdate({ weight: parseNum(v) })}
          keyboardType="decimal-pad"
          placeholder="kg"
          placeholderTextColor="#444"
        />
        <Text style={srs.x}>×</Text>
        <TextInput
          style={[srs.input, srs.repsInput]}
          value={set.reps != null ? String(set.reps) : ''}
          onChangeText={(v) => onUpdate({ reps: parseNum(v) })}
          keyboardType="number-pad"
          placeholder="reps"
          placeholderTextColor="#444"
        />
        <TextInput
          style={[srs.input, srs.rpeInput]}
          value={set.rpe != null ? String(set.rpe) : ''}
          onChangeText={(v) => onUpdate({ rpe: parseNum(v) })}
          keyboardType="decimal-pad"
          placeholder="RPE"
          placeholderTextColor="#333"
        />
        <TouchableOpacity
          style={[srs.noteBtn, (hasNote || noteOpen) && srs.noteBtnActive]}
          onPress={() => setNoteOpen((o) => !o)}>
          <Text style={[srs.noteIcon, (hasNote || noteOpen) && srs.noteIconActive]}>✎</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[srs.check, done && srs.checkDone]}
          onLongPress={onRemove}
          onPress={() => onComplete()}>
          <Text style={srs.checkText}>{done ? '✓' : ''}</Text>
        </TouchableOpacity>
      </View>

      {(noteOpen || hasNote) && (
        <TextInput
          style={srs.noteInput}
          value={set.notes ?? ''}
          onChangeText={(v) => onUpdate({ notes: v })}
          placeholder="Obs.: improvisei, dropset, sem aparelho…"
          placeholderTextColor="#555"
          multiline
        />
      )}
    </View>
  );
}

const srs = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  rowDone: { opacity: 0.55 },
  num: { width: 18, color: '#555', fontSize: 13, textAlign: 'center' },
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
  weightInput: { width: 58 },
  repsInput: { width: 48 },
  rpeInput: { width: 46 },
  x: { color: '#444', fontSize: 14 },
  noteBtn: {
    width: 30,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteBtnActive: {},
  noteIcon: { color: '#555', fontSize: 16 },
  noteIconActive: { color: '#e0a93f' },
  check: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  checkDone: { backgroundColor: '#2d7a3a', borderColor: '#2d7a3a' },
  checkText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  noteInput: {
    backgroundColor: '#181818',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#ddd',
    fontSize: 13,
    marginLeft: 24,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
});

// ---------- exercise card ----------

interface ExCardProps {
  wx: WorkoutExerciseRow;
  workoutId: string;
  allWorkouts: RowMap<WorkoutRow>;
  allWx: RowMap<WorkoutExerciseRow>;
  allSets: RowMap<SetRow>;
  exName: string;
  onRemove: () => void;
}

function ExerciseCard({ wx, workoutId, allWorkouts, allWx, allSets, exName, onRemove }: ExCardProps) {
  const wxSets = Object.values(allSets)
    .filter((s): s is SetRow => !!s && s.workout_exercise_id === wx.id && !s.deleted)
    .sort((a, b) => a.position - b.position);

  const history = buildExerciseHistory(wx.exercise_id, allWorkouts, allWx, allSets, {
    onlyCompleted: true,
  });
  const last = getLastPerformance(history, workoutId);
  const suggestion = last ? suggestNextLoad(last.sets) : null;
  const lastTop = last
    ? last.sets
        .filter((s) => (s.weight ?? 0) > 0)
        .reduce<{ w: number; r: number } | null>((best, s) => {
          const w = s.weight ?? 0;
          if (!best || w > best.w) return { w, r: s.reps ?? 0 };
          return best;
        }, null)
    : null;

  const setEquipment = (eq: string) => {
    workoutExercises$[wx.id].equipment.set(wx.equipment === eq ? null : eq);
  };

  const addSet = () => {
    const lastSet = wxSets[wxSets.length - 1];
    const id = newId();
    sets$[id].set({
      id,
      workout_exercise_id: wx.id,
      position: (lastSet?.position ?? 0) + 1,
      weight: lastSet?.weight ?? suggestion?.weight ?? null,
      reps: lastSet?.reps ?? suggestion?.reps ?? null,
      rpe: null,
      rir: null,
      set_type: 'normal',
      is_completed: false,
      notes: null,
    } as never);
  };

  const updateSet = (setId: string, patch: Partial<SetRow>) => {
    sets$[setId].set((prev: SetRow) => ({ ...prev, ...patch }));
  };

  const completeSet = (setId: string, wasCompleted: boolean) => {
    updateSet(setId, { is_completed: !wasCompleted });
    if (!wasCompleted) startRest(defaultRestSeconds$.get());
  };

  return (
    <View style={ecs.card}>
      <View style={ecs.cardHeader}>
        <Text style={ecs.exName}>{exName}</Text>
        <TouchableOpacity onPress={onRemove} style={ecs.removeBtn}>
          <Text style={ecs.removeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Equipamento */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ecs.eqRow}>
        {EQUIPMENT_OPTIONS.map((eq) => {
          const active = wx.equipment === eq;
          return (
            <TouchableOpacity
              key={eq}
              style={[ecs.eqChip, active && ecs.eqChipActive]}
              onPress={() => setEquipment(eq)}>
              <Text style={[ecs.eqChipText, active && ecs.eqChipTextActive]}>{eq}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {(lastTop || suggestion) && (
        <View style={ecs.intel}>
          {lastTop ? (
            <Text style={ecs.intelText}>📅 Última vez: {lastTop.w}kg × {lastTop.r}</Text>
          ) : null}
          {suggestion ? (
            <Text style={ecs.intelSuggestion}>
              💡 {suggestion.weight}kg × {suggestion.reps} ({REASON_LABEL[suggestion.reason]})
            </Text>
          ) : null}
        </View>
      )}

      {wxSets.length > 0 && (
        <View style={ecs.tableHeader}>
          <Text style={[ecs.th, { width: 18 }]}>#</Text>
          <Text style={[ecs.th, { width: 58 }]}>Peso</Text>
          <Text style={[ecs.th, { width: 48 }]}>Reps</Text>
          <Text style={[ecs.th, { width: 46 }]}>RPE</Text>
        </View>
      )}

      {wxSets.map((s, i) => (
        <SetRowItem
          key={s.id}
          set={s}
          index={i}
          onUpdate={(patch) => updateSet(s.id, patch)}
          onComplete={() => completeSet(s.id, s.is_completed)}
          onRemove={() => sets$[s.id].deleted.set(true)}
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  exName: { fontSize: 16, fontWeight: '700', color: '#fff', flex: 1 },
  removeBtn: { padding: 4 },
  removeBtnText: { color: '#444', fontSize: 18 },
  eqRow: { flexGrow: 0, marginVertical: 8 },
  eqChip: {
    backgroundColor: '#222',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  eqChipActive: { backgroundColor: '#1f3a52', borderColor: '#4f9cf9' },
  eqChipText: { color: '#888', fontSize: 13 },
  eqChipTextActive: { color: '#9fc8ea', fontWeight: '600' },
  intel: {
    backgroundColor: '#15202b',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    gap: 2,
  },
  intelText: { color: '#8aa0b3', fontSize: 12 },
  intelSuggestion: { color: '#6fcf8e', fontSize: 12, fontWeight: '600' },
  tableHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  th: { color: '#444', fontSize: 11, textAlign: 'center' },
  addSet: { marginTop: 8, paddingVertical: 8, alignItems: 'center' },
  addSetText: { color: '#4f9cf9', fontSize: 14, fontWeight: '600' },
});

// ---------- main screen ----------

export default function WorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const workoutsMap = use$(workouts$);
  const wxMap = (use$(workoutExercises$) ?? {}) as RowMap<WorkoutExerciseRow>;
  const setsMap = (use$(sets$) ?? {}) as RowMap<SetRow>;
  const exercisesMap = use$(exercises$) ?? {};

  const workout = workoutsMap?.[id];
  const elapsed = useElapsed(workout?.started_at ?? null);

  const wxList = Object.values(wxMap)
    .filter((wx): wx is WorkoutExerciseRow => !!wx && wx.workout_id === id && !wx.deleted)
    .sort((a, b) => a.position - b.position);

  const minimize = () => router.back(); // sai SEM encerrar — treino segue ativo

  const doFinish = () => {
    workouts$[id].ended_at.set(new Date().toISOString());
    activeWorkoutId$.set(null);
    router.back();
  };

  const finishWorkout = () => {
    const completedSets = Object.values(setsMap).filter(
      (s) => !!s && !s.deleted && wxList.some((wx) => wx.id === s.workout_exercise_id) && s.is_completed,
    );
    if (wxList.length === 0 || completedSets.length === 0) {
      Alert.alert('Finalizar treino', 'Você não registrou nenhuma série. Finalizar mesmo assim?', [
        { text: 'Continuar treinando', style: 'cancel' },
        { text: 'Finalizar', onPress: doFinish },
      ]);
      return;
    }
    doFinish();
  };

  const discardWorkout = () => {
    Alert.alert('Descartar treino', 'Descartar este treino sem salvar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => {
          wxList.forEach((wx) => {
            Object.values(setsMap)
              .filter((s): s is SetRow => !!s && s.workout_exercise_id === wx.id)
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
      .filter((s): s is SetRow => !!s && s.workout_exercise_id === wxId)
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
      <View style={ws.header}>
        <TouchableOpacity style={ws.headerBtn} onPress={minimize}>
          <Text style={ws.minimize}>‹ Voltar</Text>
        </TouchableOpacity>
        <View style={ws.headerCenter}>
          <Text style={ws.headerTitle} numberOfLines={1}>
            {workout.name ?? 'Treino'}
          </Text>
          <Text style={ws.timer}>{elapsed}</Text>
        </View>
        <TouchableOpacity style={[ws.headerBtn, ws.finishBtn]} onPress={finishWorkout}>
          <Text style={ws.finishText}>Finalizar</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={ws.scroll}
          contentContainerStyle={ws.content}
          keyboardShouldPersistTaps="handled">
          {wxList.map((wx) => (
            <ExerciseCard
              key={wx.id}
              wx={wx}
              workoutId={id}
              allWorkouts={workoutsMap ?? {}}
              allWx={wxMap}
              allSets={setsMap}
              exName={exercisesMap[wx.exercise_id]?.name ?? 'Exercício'}
              onRemove={() => removeExercise(wx.id)}
            />
          ))}

          <TouchableOpacity style={ws.addEx} onPress={addExercise}>
            <Text style={ws.addExText}>+ Adicionar exercício</Text>
          </TouchableOpacity>

          <TouchableOpacity style={ws.discard} onPress={discardWorkout}>
            <Text style={ws.discardText}>Descartar treino</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <RestTimerBar />
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
  minimize: { color: '#4f9cf9', fontSize: 15 },
  finishBtn: { alignItems: 'flex-end' },
  finishText: { color: '#4f9cf9', fontSize: 15, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 140 },
  addEx: {
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  addExText: { color: '#4f9cf9', fontSize: 16, fontWeight: '600' },
  discard: { padding: 14, alignItems: 'center' },
  discardText: { color: '#7a3a3a', fontSize: 14, fontWeight: '600' },
});
