import { roundToIncrement } from './oneRepMax';
import { computeRecords } from './records';
import { isWorkingSet, type PerformedSet, type SessionPerformance } from './types';

export interface ProgressionConfig {
  /** Faixa de reps alvo, ex. 8–12. */
  repRange: { min: number; max: number };
  /** RIR alvo (reps in reserve). Default 2. */
  targetRir: number;
  /** Incremento de carga carregável (kg). Default 2.5. */
  increment: number;
}

export const DEFAULT_PROGRESSION: ProgressionConfig = {
  repRange: { min: 8, max: 12 },
  targetRir: 2,
  increment: 2.5,
};

export type SuggestionReason =
  | 'increase_weight'
  | 'add_rep'
  | 'consolidate'
  | 'reduce_weight';

export interface LoadSuggestion {
  weight: number;
  reps: number;
  reason: SuggestionReason;
}

/** RIR efetivo: usa rir; senão deriva do rpe (rir ≈ 10 - rpe); senão null. */
function effectiveRir(s: PerformedSet): number | null {
  if (s.rir != null) return s.rir;
  if (s.rpe != null) return Math.max(0, 10 - s.rpe);
  return null;
}

/** Melhor set de trabalho: maior peso, desempatando por mais reps. */
function topSet(sets: PerformedSet[]): PerformedSet | null {
  const working = sets.filter(isWorkingSet);
  if (working.length === 0) return null;
  return working.reduce((best, s) => {
    const bw = best.weight ?? 0;
    const sw = s.weight ?? 0;
    if (sw > bw) return s;
    if (sw === bw && (s.reps ?? 0) > (best.reps ?? 0)) return s;
    return best;
  });
}

/**
 * Sugere a próxima carga via dupla progressão:
 * - Bateu o topo da faixa de reps com folga (RIR >= alvo) → sobe a carga e
 *   volta pro fundo da faixa.
 * - Bateu o topo mas no limite (RIR < alvo) → mantém e consolida.
 * - Abaixo do topo → mantém carga e tenta +1 rep.
 * - Não atingiu nem o mínimo no talo (RIR 0) → reduz a carga.
 * Retorna null se não há sessão anterior (primeira vez no exercício).
 */
export function suggestNextLoad(
  lastSets: PerformedSet[],
  config: ProgressionConfig = DEFAULT_PROGRESSION,
): LoadSuggestion | null {
  const top = topSet(lastSets);
  if (!top) return null;

  const weight = top.weight ?? 0;
  const reps = top.reps ?? 0;
  const rir = effectiveRir(top);
  const { repRange, targetRir, increment } = config;

  if (reps < repRange.min && rir === 0) {
    return {
      weight: roundToIncrement(Math.max(increment, weight - increment), increment),
      reps: repRange.min,
      reason: 'reduce_weight',
    };
  }

  if (reps >= repRange.max) {
    if (rir == null || rir >= targetRir) {
      return {
        weight: roundToIncrement(weight + increment, increment),
        reps: repRange.min,
        reason: 'increase_weight',
      };
    }
    return { weight, reps, reason: 'consolidate' };
  }

  return { weight, reps: reps + 1, reason: 'add_rep' };
}

export interface StagnationConfig {
  /** Quantas sessões recentes analisar. Default 3. */
  window: number;
  /** Fração da carga para o deload sugerido. Default 0.9 (-10%). */
  deloadFactor: number;
  /** Incremento para arredondar o deload. Default 2.5. */
  increment: number;
}

export const DEFAULT_STAGNATION: StagnationConfig = {
  window: 3,
  deloadFactor: 0.9,
  increment: 2.5,
};

export interface StagnationResult {
  isStagnant: boolean;
  sessionsAnalyzed: number;
  /** 1RM estimado de cada sessão analisada (ordem cronológica). */
  e1rmTrend: number[];
  /** Carga de deload sugerida, só quando isStagnant. */
  deloadWeight: number | null;
}

/**
 * Detecta estagnação: se nas últimas `window` sessões o 1RM estimado não
 * superou o da primeira sessão da janela, está estagnado e sugere deload.
 */
export function detectStagnation(
  sessions: SessionPerformance[],
  config: StagnationConfig = DEFAULT_STAGNATION,
): StagnationResult {
  const chrono = [...sessions].sort((a, b) =>
    a.performedAt.localeCompare(b.performedAt),
  );
  const window = chrono.slice(-config.window);
  const e1rmTrend = window.map((s) => computeRecords(s.sets).estimated_1rm);

  if (window.length < config.window) {
    return {
      isStagnant: false,
      sessionsAnalyzed: window.length,
      e1rmTrend,
      deloadWeight: null,
    };
  }

  const baseline = e1rmTrend[0];
  const improvedAfter = e1rmTrend.slice(1).some((v) => v > baseline);
  const isStagnant = !improvedAfter;

  let deloadWeight: number | null = null;
  if (isStagnant) {
    const bestWeight = Math.max(
      ...window.map((s) => computeRecords(s.sets).max_weight),
    );
    deloadWeight = roundToIncrement(
      bestWeight * config.deloadFactor,
      config.increment,
    );
  }

  return {
    isStagnant,
    sessionsAnalyzed: window.length,
    e1rmTrend,
    deloadWeight,
  };
}

/** Série de 1RM estimado por sessão (cronológico) — alimenta o gráfico. */
export function oneRepMaxTrend(
  sessions: SessionPerformance[],
): { performedAt: string; e1rm: number }[] {
  return [...sessions]
    .sort((a, b) => a.performedAt.localeCompare(b.performedAt))
    .map((s) => ({
      performedAt: s.performedAt,
      e1rm: computeRecords(s.sets).estimated_1rm,
    }));
}
