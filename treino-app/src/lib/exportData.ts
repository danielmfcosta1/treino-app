import type {
  BodyMetricRow,
  CardioSessionRow,
  ExerciseRow,
  SetRow,
  WorkoutExerciseRow,
  WorkoutRow,
} from '../domain/types';

export interface BackupData {
  exercises: ExerciseRow[];
  workouts: WorkoutRow[];
  workoutExercises: WorkoutExerciseRow[];
  sets: SetRow[];
  cardioSessions: CardioSessionRow[];
  bodyMetrics: BodyMetricRow[];
}

export interface BackupFile {
  version: 1;
  exportedAt: string;
  data: BackupData;
}

/** Monta o objeto de backup completo (JSON). exportedAt injetado p/ testes. */
export function buildBackup(data: BackupData, exportedAt: string): BackupFile {
  return { version: 1, exportedAt, data };
}

export function backupToJSON(backup: BackupFile): string {
  return JSON.stringify(backup, null, 2);
}

/** Escapa um campo para CSV (aspas + vírgula + quebra de linha). */
export function csvCell(value: unknown): string {
  if (value == null) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export interface FlatSetRow {
  date: string;
  workout: string;
  exercise: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  rir: number | null;
  type: string;
}

const CSV_HEADER = ['data', 'treino', 'exercicio', 'serie', 'peso', 'reps', 'rpe', 'rir', 'tipo'];

/**
 * Achata os treinos finalizados num CSV de séries — uma linha por set
 * completo. Recebe dados já resolvidos (nomes, não ids) para ser puro.
 */
export function buildSetsCSV(rows: FlatSetRow[]): string {
  const lines = [CSV_HEADER.join(',')];
  for (const r of rows) {
    lines.push(
      [
        csvCell(r.date),
        csvCell(r.workout),
        csvCell(r.exercise),
        csvCell(r.setNumber),
        csvCell(r.weight),
        csvCell(r.reps),
        csvCell(r.rpe),
        csvCell(r.rir),
        csvCell(r.type),
      ].join(','),
    );
  }
  return lines.join('\n');
}

type RowMap<T> = Record<string, T | undefined>;

function active<T extends { deleted: boolean }>(m: RowMap<T>): T[] {
  return Object.values(m).filter((x): x is T => !!x && !x.deleted);
}

/** Resolve os mapas crus na lista achatada de séries para o CSV. */
export function flattenSets(
  workouts: RowMap<WorkoutRow>,
  workoutExercises: RowMap<WorkoutExerciseRow>,
  sets: RowMap<SetRow>,
  exercises: RowMap<ExerciseRow>,
): FlatSetRow[] {
  const out: FlatSetRow[] = [];
  const wxList = active(workoutExercises);
  for (const wx of wxList) {
    const w = workouts[wx.workout_id];
    if (!w || w.deleted || !w.ended_at) continue;
    const exName = exercises[wx.exercise_id]?.name ?? '—';
    const wxSets = active(sets)
      .filter((s) => s.workout_exercise_id === wx.id && s.is_completed)
      .sort((a, b) => a.position - b.position);
    wxSets.forEach((s, i) => {
      out.push({
        date: (w.started_at ?? w.created_at).slice(0, 10),
        workout: w.name ?? 'Treino',
        exercise: exName,
        setNumber: i + 1,
        weight: s.weight,
        reps: s.reps,
        rpe: s.rpe,
        rir: s.rir,
        type: s.set_type,
      });
    });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
