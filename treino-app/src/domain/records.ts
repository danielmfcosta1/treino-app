import { estimateOneRepMax } from './oneRepMax';
import { isWorkingSet, type PerformedSet, type RecordType } from './types';

export interface RecordSnapshot {
  max_weight: number;
  estimated_1rm: number;
  max_volume_set: number;
  max_reps: number;
}

const EMPTY: RecordSnapshot = {
  max_weight: 0,
  estimated_1rm: 0,
  max_volume_set: 0,
  max_reps: 0,
};

/**
 * Calcula o melhor de cada métrica a partir de uma lista de sets.
 * Ignora warmups e sets incompletos. Tudo zero se não houver set válido.
 */
export function computeRecords(sets: PerformedSet[]): RecordSnapshot {
  return sets.filter(isWorkingSet).reduce<RecordSnapshot>((acc, s) => {
    const weight = s.weight ?? 0;
    const reps = s.reps ?? 0;
    const orm = estimateOneRepMax(weight, reps) ?? 0;
    const volume = weight * reps;
    return {
      max_weight: Math.max(acc.max_weight, weight),
      estimated_1rm: Math.max(acc.estimated_1rm, orm),
      max_volume_set: Math.max(acc.max_volume_set, volume),
      max_reps: Math.max(acc.max_reps, reps),
    };
  }, { ...EMPTY });
}

export interface NewRecord {
  type: RecordType;
  value: number;
  previous: number;
}

/**
 * Compara os sets de uma sessão contra os recordes prévios e retorna só os que
 * foram batidos (estritamente maiores). Use para disparar "novo PR!".
 */
export function findNewRecords(
  previous: RecordSnapshot,
  sessionSets: PerformedSet[],
): NewRecord[] {
  const current = computeRecords(sessionSets);
  const types: RecordType[] = [
    'max_weight',
    'estimated_1rm',
    'max_volume_set',
    'max_reps',
  ];
  const out: NewRecord[] = [];
  for (const type of types) {
    if (current[type] > previous[type]) {
      out.push({ type, value: current[type], previous: previous[type] });
    }
  }
  return out;
}
