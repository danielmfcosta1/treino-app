import type { Database } from '../state/database.types';

type Tables = Database['public']['Tables'];

export type ExerciseRow = Tables['exercises']['Row'];
export type WorkoutRow = Tables['workouts']['Row'];
export type WorkoutExerciseRow = Tables['workout_exercises']['Row'];
export type SetRow = Tables['sets']['Row'];
export type PersonalRecordRow = Tables['personal_records']['Row'];
export type CardioSessionRow = Tables['cardio_sessions']['Row'];
export type BodyMetricRow = Tables['body_metrics']['Row'];

export type SetType =
  | 'normal'
  | 'warmup'
  | 'superset'
  | 'dropset'
  | 'failure';

export type RecordType =
  | 'max_weight'
  | 'estimated_1rm'
  | 'max_volume_set'
  | 'max_reps';

/** Conjunto mínimo necessário para os cálculos de progressão/recordes. */
export interface PerformedSet {
  weight: number | null;
  reps: number | null;
  rpe?: number | null;
  rir?: number | null;
  set_type?: string;
  is_completed?: boolean;
}

/** Sets feitos de um exercício numa data específica (uma sessão). */
export interface SessionPerformance {
  workoutId: string;
  exerciseId: string;
  /** ISO string (started_at do workout). */
  performedAt: string;
  sets: PerformedSet[];
}

/** Sets que valem para análise: completos, com peso e reps positivos, não-warmup. */
export function isWorkingSet(s: PerformedSet): boolean {
  if (s.is_completed === false) return false;
  if (s.set_type === 'warmup') return false;
  return (s.weight ?? 0) > 0 && (s.reps ?? 0) > 0;
}
