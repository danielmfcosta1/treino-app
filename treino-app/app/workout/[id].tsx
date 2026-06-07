import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
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
import { useColors, type ThemeColors } from '@/src/lib/theme';
import { buildExerciseHistory } from '@/src/domain/aggregate';
import { getLastPerformance } from '@/src/domain/lastPerformance';
import { suggestNextLoad, type SuggestionReason } from '@/src/domain/progression';
import type { ExerciseRow, SetRow, WorkoutExerciseRow, WorkoutRow } from '@/src/domain/types';

type RowMap<T> = Record<string, T | undefined>;

// ---------- helpers ----------

function useElapsed(startedAt: string | null) {
  // Recalcula SEMPRE a partir do horário absoluto (started_at), nunca por
  // acumular ticks. Assim, mesmo se o app for pro background e voltar, o
  // cronômetro mostra o tempo real (não "pausa" junto com o app).
  const [, force] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  if (!startedAt) return '0:00';
  const secs = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
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

function isIsometric(ex?: ExerciseRow): boolean {
  return ex?.force === 'static';
}

// ---------- set row (inputs com ESTADO LOCAL → sem bug de cursor) ----------

interface SetRowProps {
  set: SetRow;
  index: number;
  isometric: boolean;
  onCommit: (patch: Partial<SetRow>) => void;
  onToggleComplete: () => void;
  onRemove: () => void;
}

function SetRowItem({ set, index, isometric, onCommit, onToggleComplete, onRemove }: SetRowProps) {
  const c = useColors();
  const srs = makeSrs(c);
  const done = set.is_completed;
  // Estado local: o que você digita fica aqui e só grava no banco ao SAIR do
  // campo (onBlur) ou ao concluir a série. Isso elimina o cursor pulando e o
  // re-render da tela a cada tecla.
  const [w, setW] = useState(set.weight != null ? String(set.weight) : '');
  const [r, setR] = useState(set.reps != null ? String(set.reps) : '');
  const [rpe, setRpe] = useState(set.rpe != null ? String(set.rpe) : '');
  const [dur, setDur] = useState(set.duration_seconds != null ? String(set.duration_seconds) : '');
  const [note, setNote] = useState(set.notes ?? '');
  const [noteOpen, setNoteOpen] = useState(false);

  const commit = () =>
    onCommit({
      weight: parseNum(w),
      reps: parseNum(r),
      rpe: parseNum(rpe),
      duration_seconds: dur ? Math.round(parseNum(dur) ?? 0) : null,
      notes: note.trim() ? note.trim() : null,
    });

  const toggle = () => {
    commit();
    onToggleComplete();
  };

  return (
    <View>
      <View style={[srs.row, done && srs.rowDone]}>
        <Text style={srs.num}>{index + 1}</Text>

        {isometric ? (
          <>
            <TextInput
              style={[srs.input, srs.timeInput]}
              value={dur}
              onChangeText={setDur}
              onBlur={commit}
              keyboardType="number-pad"
              placeholder="tempo (s)"
              placeholderTextColor={c.textFaint}
            />
            <Text style={srs.timeHint}>segundos</Text>
          </>
        ) : (
          <>
            <TextInput
              style={[srs.input, srs.weightInput]}
              value={w}
              onChangeText={setW}
              onBlur={commit}
              keyboardType="decimal-pad"
              placeholder="kg"
              placeholderTextColor={c.textFaint}
            />
            <Text style={srs.x}>×</Text>
            <TextInput
              style={[srs.input, srs.repsInput]}
              value={r}
              onChangeText={setR}
              onBlur={commit}
              keyboardType="number-pad"
              placeholder="reps"
              placeholderTextColor={c.textFaint}
            />
            <TextInput
              style={[srs.input, srs.rpeInput]}
              value={rpe}
              onChangeText={setRpe}
              onBlur={commit}
              keyboardType="decimal-pad"
              placeholder="RPE"
              placeholderTextColor={c.textFaint}
            />
          </>
        )}

        <TouchableOpacity
          style={[srs.noteBtn, (note.trim() || noteOpen) && srs.noteBtnOn]}
          hitSlop={6}
          onPress={() => setNoteOpen((o) => !o)}>
          <Text style={[srs.noteIcon, (note.trim() || noteOpen) && srs.noteIconOn]}>✎</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[srs.check, done && srs.checkDone]}
          hitSlop={6}
          onLongPress={onRemove}
          onPress={toggle}>
          <Text style={srs.checkText}>{done ? '✓' : ''}</Text>
        </TouchableOpacity>
      </View>

      {noteOpen && (
        <View style={srs.noteBox}>
          <TextInput
            style={srs.noteInput}
            value={note}
            onChangeText={setNote}
            onBlur={commit}
            placeholder="Obs.: improvisei, dropset, sem aparelho…"
            placeholderTextColor={c.textFaint}
            multiline
            autoFocus
          />
          <TouchableOpacity
            style={srs.noteDone}
            onPress={() => {
              commit();
              setNoteOpen(false);
            }}>
            <Text style={srs.noteDoneText}>OK</Text>
          </TouchableOpacity>
        </View>
      )}
      {!noteOpen && note.trim() ? (
        <Text style={srs.notePreview} numberOfLines={1}>
          ✎ {note.trim()}
        </Text>
      ) : null}
    </View>
  );
}

const makeSrs = (c: ThemeColors) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  rowDone: { opacity: 0.55 },
  num: { width: 18, color: c.textFaint, fontSize: 13, textAlign: 'center' },
  input: {
    backgroundColor: c.inputBg,
    borderRadius: 8,
    padding: 8,
    color: c.text,
    fontSize: 15,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: c.border,
  },
  weightInput: { width: 58 },
  repsInput: { width: 48 },
  rpeInput: { width: 46 },
  timeInput: { width: 90 },
  timeHint: { color: c.textDim, fontSize: 12 },
  x: { color: c.textFaint, fontSize: 14 },
  noteBtn: { width: 30, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  noteBtnOn: {},
  noteIcon: { color: c.textFaint, fontSize: 16 },
  noteIconOn: { color: c.warn },
  check: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: c.textFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  checkDone: { backgroundColor: c.success, borderColor: c.success },
  checkText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  noteBox: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginLeft: 24, marginBottom: 6 },
  noteInput: {
    flex: 1,
    backgroundColor: c.inputBg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: c.text,
    fontSize: 13,
    borderWidth: 1,
    borderColor: c.border,
  },
  noteDone: { backgroundColor: c.accent, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
  noteDoneText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  notePreview: { color: c.warn, fontSize: 12, marginLeft: 24, marginBottom: 6 },
});

// ---------- exercise card ----------

interface ExCardProps {
  wx: WorkoutExerciseRow;
  workoutId: string;
  exercise?: ExerciseRow;
  allWorkouts: RowMap<WorkoutRow>;
  allWx: RowMap<WorkoutExerciseRow>;
  allSets: RowMap<SetRow>;
  onRemove: () => void;
}

function ExerciseCard({ wx, workoutId, exercise, allWorkouts, allWx, allSets, onRemove }: ExCardProps) {
  const c = useColors();
  const ecs = makeEcs(c);
  const [collapsed, setCollapsed] = useState(false);
  const isometric = isIsometric(exercise);
  const exName = exercise?.name ?? 'Exercício';

  const wxSets = Object.values(allSets)
    .filter((s): s is SetRow => !!s && s.workout_exercise_id === wx.id && !s.deleted)
    .sort((a, b) => a.position - b.position);
  const doneCount = wxSets.filter((s) => s.is_completed).length;

  const history = buildExerciseHistory(wx.exercise_id, allWorkouts, allWx, allSets, {
    onlyCompleted: true,
  });
  const last = getLastPerformance(history, workoutId);
  const suggestion = !isometric && last ? suggestNextLoad(last.sets) : null;
  const lastTop = last
    ? last.sets
        .filter((s) => (s.weight ?? 0) > 0)
        .reduce<{ w: number; r: number } | null>((best, s) => {
          const w = s.weight ?? 0;
          if (!best || w > best.w) return { w, r: s.reps ?? 0 };
          return best;
        }, null)
    : null;

  const addSet = () => {
    const lastSet = wxSets[wxSets.length - 1];
    const id = newId();
    sets$[id].set({
      id,
      workout_exercise_id: wx.id,
      position: (lastSet?.position ?? 0) + 1,
      weight: isometric ? null : lastSet?.weight ?? suggestion?.weight ?? null,
      reps: isometric ? null : lastSet?.reps ?? suggestion?.reps ?? null,
      duration_seconds: isometric ? lastSet?.duration_seconds ?? null : null,
      rpe: null,
      rir: null,
      set_type: 'normal',
      is_completed: false,
      notes: null,
    } as never);
  };

  const commitSet = (setId: string, patch: Partial<SetRow>) => {
    sets$[setId].set((prev: SetRow) => ({ ...prev, ...patch }));
  };

  const toggleComplete = (setId: string, wasCompleted: boolean) => {
    sets$[setId].is_completed.set(!wasCompleted);
    if (!wasCompleted) startRest(defaultRestSeconds$.get());
  };

  return (
    <View style={ecs.card}>
      <TouchableOpacity
        style={ecs.cardHeader}
        activeOpacity={0.7}
        onPress={() => setCollapsed((c) => !c)}>
        <Text style={ecs.chevron}>{collapsed ? '▸' : '▾'}</Text>
        <Text style={ecs.exName} numberOfLines={1}>
          {exName}
        </Text>
        {collapsed && wxSets.length > 0 ? (
          <Text style={ecs.summary}>{doneCount}/{wxSets.length} séries</Text>
        ) : null}
        <TouchableOpacity onPress={onRemove} hitSlop={8} style={ecs.removeBtn}>
          <Text style={ecs.removeBtnText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {!collapsed && (
        <>
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

          {wxSets.map((s, i) => (
            <SetRowItem
              key={s.id}
              set={s}
              index={i}
              isometric={isometric}
              onCommit={(patch) => commitSet(s.id, patch)}
              onToggleComplete={() => toggleComplete(s.id, s.is_completed)}
              onRemove={() => sets$[s.id].deleted.set(true)}
            />
          ))}

          <TouchableOpacity style={ecs.addSet} onPress={addSet}>
            <Text style={ecs.addSetText}>+ Série</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const makeEcs = (c: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: c.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: c.border,
    gap: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chevron: { color: c.textDim, fontSize: 14, width: 16 },
  exName: { fontSize: 16, fontWeight: '700', color: c.text, flex: 1 },
  summary: { color: c.accent, fontSize: 13 },
  removeBtn: { padding: 4 },
  removeBtnText: { color: c.textFaint, fontSize: 18 },
  intel: {
    backgroundColor: c.accentBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    gap: 2,
  },
  intelText: { color: c.textDim, fontSize: 12 },
  intelSuggestion: { color: c.successSoft, fontSize: 12, fontWeight: '600' },
  addSet: { marginTop: 8, paddingVertical: 8, alignItems: 'center' },
  addSetText: { color: c.accent, fontSize: 14, fontWeight: '600' },
});

// ---------- main screen ----------

export default function WorkoutScreen() {
  const c = useColors();
  const ws = makeWs(c);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const workoutsMap = use$(workouts$);
  const wxMap = (use$(workoutExercises$) ?? {}) as RowMap<WorkoutExerciseRow>;
  const setsMap = (use$(sets$) ?? {}) as RowMap<SetRow>;
  const exercisesMap = (use$(exercises$) ?? {}) as RowMap<ExerciseRow>;

  const workout = workoutsMap?.[id];
  const elapsed = useElapsed(workout?.started_at ?? null);

  const wxList = Object.values(wxMap)
    .filter((wx): wx is WorkoutExerciseRow => !!wx && wx.workout_id === id && !wx.deleted)
    .sort((a, b) => a.position - b.position);

  const minimize = () => router.back();

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
        <Text style={{ color: c.text, padding: 20 }}>Treino não encontrado.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={ws.safe} edges={['top']}>
      <View style={ws.header}>
        <TouchableOpacity style={ws.headerBtn} hitSlop={8} onPress={minimize}>
          <Text style={ws.minimize}>‹ Voltar</Text>
        </TouchableOpacity>
        <View style={ws.headerCenter}>
          <Text style={ws.headerTitle} numberOfLines={1}>
            {workout.name ?? 'Treino'}
          </Text>
          <Text style={ws.timer}>{elapsed}</Text>
        </View>
        <TouchableOpacity style={[ws.headerBtn, ws.finishBtn]} hitSlop={8} onPress={finishWorkout}>
          <Text style={ws.finishText}>Finalizar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={ws.scroll}
        contentContainerStyle={ws.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets>
        {wxList.map((wx) => (
          <ExerciseCard
            key={wx.id}
            wx={wx}
            workoutId={id}
            exercise={exercisesMap[wx.exercise_id]}
            allWorkouts={workoutsMap ?? {}}
            allWx={wxMap}
            allSets={setsMap}
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

      <RestTimerBar />
    </SafeAreaView>
  );
}

const makeWs = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  headerBtn: { minWidth: 80 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: c.text, fontSize: 16, fontWeight: '700' },
  timer: { color: c.accent, fontSize: 13, marginTop: 2 },
  minimize: { color: c.accent, fontSize: 15 },
  finishBtn: { alignItems: 'flex-end' },
  finishText: { color: c.accent, fontSize: 15, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 160 },
  addEx: {
    borderWidth: 1,
    borderColor: c.border,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  addExText: { color: c.accent, fontSize: 16, fontWeight: '600' },
  discard: { padding: 14, alignItems: 'center' },
  discardText: { color: c.danger, fontSize: 14, fontWeight: '600' },
});
