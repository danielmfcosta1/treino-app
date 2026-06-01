import { isWorkingSet, type PerformedSet } from './types';

export interface ExerciseVolume {
  primaryMuscles: string[];
  secondaryMuscles: string[];
  sets: PerformedSet[];
}

export interface HeatmapOptions {
  /** 'sets' = nº de séries de trabalho; 'tonnage' = soma de peso×reps. */
  metric: 'sets' | 'tonnage';
  /** Peso do músculo secundário (default 0.5). */
  secondaryWeight: number;
}

export const DEFAULT_HEATMAP: HeatmapOptions = {
  metric: 'sets',
  secondaryWeight: 0.5,
};

/**
 * Agrega volume por grupo muscular. Músculos primários recebem o valor cheio;
 * secundários recebem uma fração (default metade). Retorna um mapa
 * músculo → score, útil para colorir o heatmap.
 */
export function computeMuscleHeatmap(
  exercises: ExerciseVolume[],
  options: HeatmapOptions = DEFAULT_HEATMAP,
): Record<string, number> {
  const out: Record<string, number> = {};
  const add = (muscle: string, value: number) => {
    out[muscle] = (out[muscle] ?? 0) + value;
  };

  for (const ex of exercises) {
    const working = ex.sets.filter(isWorkingSet);
    const value =
      options.metric === 'tonnage'
        ? working.reduce((sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0), 0)
        : working.length;
    if (value === 0) continue;

    for (const m of ex.primaryMuscles ?? []) add(m, value);
    for (const m of ex.secondaryMuscles ?? []) {
      add(m, value * options.secondaryWeight);
    }
  }

  return out;
}

/** Ordena o heatmap do mais trabalhado pro menos (para listas/ranking). */
export function rankMuscles(
  heatmap: Record<string, number>,
): { muscle: string; score: number }[] {
  return Object.entries(heatmap)
    .map(([muscle, score]) => ({ muscle, score }))
    .sort((a, b) => b.score - a.score);
}
