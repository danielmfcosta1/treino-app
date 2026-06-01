import {
  buildExerciseHistory,
  completedWorkoutDates,
  computeAllRecords,
  muscleHeatmapForPeriod,
} from './aggregate';
import type {
  ExerciseRow,
  SetRow,
  WorkoutExerciseRow,
  WorkoutRow,
} from './types';

// --- builders mínimos (só os campos lidos pelas funções) ---
const wk = (id: string, p: Partial<WorkoutRow> = {}): WorkoutRow =>
  ({ id, deleted: false, started_at: `2026-05-0${id}T10:00:00Z`, ended_at: `2026-05-0${id}T11:00:00Z`, created_at: `2026-05-0${id}T10:00:00Z`, ...p } as WorkoutRow);

const wx = (id: string, workout_id: string, exercise_id: string): WorkoutExerciseRow =>
  ({ id, workout_id, exercise_id, deleted: false, position: 0 } as WorkoutExerciseRow);

const st = (id: string, workout_exercise_id: string, weight: number, reps: number, position: number): SetRow =>
  ({ id, workout_exercise_id, weight, reps, position, deleted: false, is_completed: true, set_type: 'normal', rpe: null, rir: null } as SetRow);

const ex = (id: string, primary: string[], secondary: string[] = []): ExerciseRow =>
  ({ id, name: id, deleted: false, primary_muscles: primary, secondary_muscles: secondary } as ExerciseRow);

const toMap = <T extends { id: string }>(arr: T[]): Record<string, T> =>
  Object.fromEntries(arr.map((x) => [x.id, x]));

describe('buildExerciseHistory', () => {
  const workouts = toMap([wk('1'), wk('2'), wk('3', { ended_at: null })]); // 3 em andamento
  const wxs = toMap([wx('a', '1', 'supino'), wx('b', '2', 'supino'), wx('c', '3', 'supino')]);
  const sets = toMap([
    st('s1', 'a', 100, 5, 0),
    st('s2', 'b', 105, 5, 0),
    st('s3', 'c', 110, 5, 0), // treino em andamento
  ]);

  it('só treinos finalizados, ordenados do mais antigo pro recente', () => {
    const h = buildExerciseHistory('supino', workouts, wxs, sets);
    expect(h).toHaveLength(2);
    expect(h[0].performedAt < h[1].performedAt).toBe(true);
    expect(h[0].sets[0].weight).toBe(100);
  });

  it('inclui treino em andamento quando onlyCompleted=false', () => {
    const h = buildExerciseHistory('supino', workouts, wxs, sets, { onlyCompleted: false });
    expect(h).toHaveLength(3);
  });

  it('ignora exercício sem histórico', () => {
    expect(buildExerciseHistory('agacho', workouts, wxs, sets)).toHaveLength(0);
  });
});

describe('completedWorkoutDates', () => {
  it('retorna só datas de treinos finalizados', () => {
    const workouts = toMap([wk('1'), wk('2', { ended_at: null })]);
    expect(completedWorkoutDates(workouts)).toHaveLength(1);
  });
});

describe('computeAllRecords', () => {
  it('agrega PRs por exercício', () => {
    const workouts = toMap([wk('1'), wk('2')]);
    const wxs = toMap([wx('a', '1', 'supino'), wx('b', '2', 'supino')]);
    const sets = toMap([st('s1', 'a', 100, 5, 0), st('s2', 'b', 110, 3, 0)]);
    const recs = computeAllRecords(workouts, wxs, sets);
    expect(recs.supino.max_weight).toBe(110);
  });

  it('ignora treinos não finalizados', () => {
    const workouts = toMap([wk('1', { ended_at: null })]);
    const wxs = toMap([wx('a', '1', 'supino')]);
    const sets = toMap([st('s1', 'a', 100, 5, 0)]);
    expect(computeAllRecords(workouts, wxs, sets).supino).toBeUndefined();
  });
});

describe('muscleHeatmapForPeriod', () => {
  const workouts = toMap([wk('1'), wk('2')]);
  const wxs = toMap([wx('a', '1', 'supino'), wx('b', '2', 'agacho')]);
  const sets = toMap([
    st('s1', 'a', 100, 5, 0),
    st('s2', 'a', 100, 5, 1),
    st('s3', 'b', 140, 5, 0),
  ]);
  const exercises = toMap([
    ex('supino', ['chest'], ['triceps']),
    ex('agacho', ['quadriceps'], ['glutes']),
  ]);

  it('agrega volume por músculo no período inteiro', () => {
    const h = muscleHeatmapForPeriod(workouts, wxs, sets, exercises);
    expect(h.chest).toBe(2); // 2 séries
    expect(h.triceps).toBe(1); // secundário meia carga
    expect(h.quadriceps).toBe(1);
  });

  it('filtra por período (sinceISO)', () => {
    const h = muscleHeatmapForPeriod(workouts, wxs, sets, exercises, '2026-05-02T00:00:00Z');
    expect(h.chest).toBeUndefined(); // treino 1 (dia 01) fora do período
    expect(h.quadriceps).toBe(1);
  });
});
