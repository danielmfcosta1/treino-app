// Agregação PURA: transforma os mapas crus dos stores (workouts /
// workout_exercises / sets / exercises) nas estruturas que as telas de
// análise consomem. Sem dependência de observable — recebe objetos planos,
// então é testável isoladamente.

import { computeRecords, type RecordSnapshot } from './records';
import { computeMuscleHeatmap, type ExerciseVolume } from './heatmap';
import type {
  ExerciseRow,
  PerformedSet,
  SessionPerformance,
  SetRow,
  WorkoutExerciseRow,
  WorkoutRow,
} from './types';

export type RowMap<T> = Record<string, T | undefined>;

function activeRows<T extends { deleted: boolean }>(map: RowMap<T>): T[] {
  return Object.values(map).filter((x): x is T => !!x && !x.deleted);
}

function toPerformedSet(s: SetRow): PerformedSet {
  return {
    weight: s.weight,
    reps: s.reps,
    rpe: s.rpe,
    rir: s.rir,
    set_type: s.set_type,
    is_completed: s.is_completed,
  };
}

export interface HistoryOptions {
  /** Só considera treinos finalizados (ended_at != null). Default true. */
  onlyCompleted?: boolean;
}

/**
 * Histórico de um exercício: uma SessionPerformance por treino que o incluiu,
 * ordenado do mais antigo pro mais recente.
 */
export function buildExerciseHistory(
  exerciseId: string,
  workouts: RowMap<WorkoutRow>,
  workoutExercises: RowMap<WorkoutExerciseRow>,
  sets: RowMap<SetRow>,
  options: HistoryOptions = {},
): SessionPerformance[] {
  const onlyCompleted = options.onlyCompleted ?? true;
  const setsByWx = groupSetsByWorkoutExercise(sets);

  const out: SessionPerformance[] = [];
  for (const wx of activeRows(workoutExercises)) {
    if (wx.exercise_id !== exerciseId) continue;
    const w = workouts[wx.workout_id];
    if (!w || w.deleted) continue;
    if (onlyCompleted && !w.ended_at) continue;

    const wxSets = (setsByWx[wx.id] ?? [])
      .sort((a, b) => a.position - b.position)
      .map(toPerformedSet);
    if (wxSets.length === 0) continue;

    out.push({
      workoutId: w.id,
      exerciseId,
      performedAt: w.started_at ?? w.created_at,
      sets: wxSets,
    });
  }
  return out.sort((a, b) => a.performedAt.localeCompare(b.performedAt));
}

function groupSetsByWorkoutExercise(sets: RowMap<SetRow>): Record<string, SetRow[]> {
  const map: Record<string, SetRow[]> = {};
  for (const s of activeRows(sets)) {
    (map[s.workout_exercise_id] ??= []).push(s);
  }
  return map;
}

/** Datas (ISO) dos treinos finalizados — entrada para o cálculo de streaks. */
export function completedWorkoutDates(workouts: RowMap<WorkoutRow>): string[] {
  return activeRows(workouts)
    .filter((w) => !!w.ended_at)
    .map((w) => w.started_at ?? w.created_at);
}

/** Recordes (PRs) por exercício, sobre todos os sets de trabalho finalizados. */
export function computeAllRecords(
  workouts: RowMap<WorkoutRow>,
  workoutExercises: RowMap<WorkoutExerciseRow>,
  sets: RowMap<SetRow>,
): Record<string, RecordSnapshot> {
  const setsByWx = groupSetsByWorkoutExercise(sets);
  const byExercise: Record<string, PerformedSet[]> = {};

  for (const wx of activeRows(workoutExercises)) {
    const w = workouts[wx.workout_id];
    if (!w || w.deleted || !w.ended_at) continue;
    const arr = (byExercise[wx.exercise_id] ??= []);
    for (const s of setsByWx[wx.id] ?? []) arr.push(toPerformedSet(s));
  }

  const out: Record<string, RecordSnapshot> = {};
  for (const [exerciseId, performed] of Object.entries(byExercise)) {
    out[exerciseId] = computeRecords(performed);
  }
  return out;
}

/**
 * Volume por exercício para o heatmap, opcionalmente filtrado por período
 * (sinceISO inclusivo). Junta os músculos do catálogo com os sets de cada wx.
 */
export function buildHeatmapInput(
  workouts: RowMap<WorkoutRow>,
  workoutExercises: RowMap<WorkoutExerciseRow>,
  sets: RowMap<SetRow>,
  exercises: RowMap<ExerciseRow>,
  sinceISO?: string,
): ExerciseVolume[] {
  const setsByWx = groupSetsByWorkoutExercise(sets);
  const out: ExerciseVolume[] = [];

  for (const wx of activeRows(workoutExercises)) {
    const w = workouts[wx.workout_id];
    if (!w || w.deleted || !w.ended_at) continue;
    const when = w.started_at ?? w.created_at;
    if (sinceISO && when < sinceISO) continue;

    const ex = exercises[wx.exercise_id];
    if (!ex) continue;

    out.push({
      primaryMuscles: ex.primary_muscles ?? [],
      secondaryMuscles: ex.secondary_muscles ?? [],
      sets: (setsByWx[wx.id] ?? []).map(toPerformedSet),
    });
  }
  return out;
}

/** Conveniência: heatmap pronto (mapa músculo → score) para um período. */
export function muscleHeatmapForPeriod(
  workouts: RowMap<WorkoutRow>,
  workoutExercises: RowMap<WorkoutExerciseRow>,
  sets: RowMap<SetRow>,
  exercises: RowMap<ExerciseRow>,
  sinceISO?: string,
): Record<string, number> {
  return computeMuscleHeatmap(
    buildHeatmapInput(workouts, workoutExercises, sets, exercises, sinceISO),
  );
}
