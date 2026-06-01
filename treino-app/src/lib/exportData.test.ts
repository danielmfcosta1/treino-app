import {
  buildSetsCSV,
  csvCell,
  flattenSets,
  type FlatSetRow,
} from './exportData';
import type { ExerciseRow, SetRow, WorkoutExerciseRow, WorkoutRow } from '../domain/types';

describe('csvCell', () => {
  it('passa valores simples', () => {
    expect(csvCell('supino')).toBe('supino');
    expect(csvCell(100)).toBe('100');
  });
  it('vazio para null/undefined', () => {
    expect(csvCell(null)).toBe('');
    expect(csvCell(undefined)).toBe('');
  });
  it('escapa vírgula, aspas e quebra de linha', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('diz "oi"')).toBe('"diz ""oi"""');
    expect(csvCell('linha1\nlinha2')).toBe('"linha1\nlinha2"');
  });
});

describe('buildSetsCSV', () => {
  it('inclui cabeçalho e uma linha por set', () => {
    const rows: FlatSetRow[] = [
      { date: '2026-05-01', workout: 'Push', exercise: 'Supino', setNumber: 1, weight: 100, reps: 5, rpe: 8, rir: 2, type: 'normal' },
    ];
    const csv = buildSetsCSV(rows);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('data,treino,exercicio,serie,peso,reps,rpe,rir,tipo');
    expect(lines[1]).toBe('2026-05-01,Push,Supino,1,100,5,8,2,normal');
  });
});

describe('flattenSets', () => {
  const wk = (id: string, p: Partial<WorkoutRow> = {}): WorkoutRow =>
    ({ id, name: 'Treino', deleted: false, ended_at: '2026-05-01T11:00:00Z', started_at: '2026-05-01T10:00:00Z', created_at: '2026-05-01T10:00:00Z', ...p } as WorkoutRow);
  const wx = (id: string, workout_id: string, exercise_id: string): WorkoutExerciseRow =>
    ({ id, workout_id, exercise_id, deleted: false, position: 0 } as WorkoutExerciseRow);
  const st = (id: string, wxId: string, completed: boolean, pos: number): SetRow =>
    ({ id, workout_exercise_id: wxId, weight: 100, reps: 5, rpe: null, rir: null, set_type: 'normal', is_completed: completed, position: pos, deleted: false } as SetRow);
  const toMap = <T extends { id: string }>(a: T[]) => Object.fromEntries(a.map((x) => [x.id, x]));

  it('só inclui sets completos de treinos finalizados', () => {
    const workouts = toMap([wk('1'), wk('2', { ended_at: null })]);
    const wxs = toMap([wx('a', '1', 'sup'), wx('b', '2', 'sup')]);
    const sets = toMap([st('s1', 'a', true, 0), st('s2', 'a', false, 1), st('s3', 'b', true, 0)]);
    const exercises = toMap([{ id: 'sup', name: 'Supino', deleted: false } as ExerciseRow]);
    const flat = flattenSets(workouts, wxs, sets, exercises);
    expect(flat).toHaveLength(1); // só s1 (s2 incompleto, s3 treino não finalizado)
    expect(flat[0].exercise).toBe('Supino');
  });
});
