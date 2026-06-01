import type { SessionPerformance } from './types';

/**
 * Dada a lista de sessões de um exercício, devolve a sessão mais recente
 * ANTERIOR à sessão atual (para mostrar "da última vez você fez X").
 *
 * - `sessions` pode vir em qualquer ordem; ordenamos por performedAt desc.
 * - `excludeWorkoutId` remove a sessão em andamento da comparação.
 * - Retorna null se não houver histórico.
 */
export function getLastPerformance(
  sessions: SessionPerformance[],
  excludeWorkoutId?: string,
): SessionPerformance | null {
  const candidates = sessions
    .filter((s) => s.workoutId !== excludeWorkoutId)
    .filter((s) => s.sets.length > 0)
    .sort((a, b) => b.performedAt.localeCompare(a.performedAt));
  return candidates[0] ?? null;
}

/**
 * Retorna as N sessões mais recentes (desc) de um exercício, úteis para
 * gráficos de tendência e detecção de estagnação.
 */
export function getRecentSessions(
  sessions: SessionPerformance[],
  limit: number,
): SessionPerformance[] {
  return [...sessions]
    .sort((a, b) => b.performedAt.localeCompare(a.performedAt))
    .slice(0, Math.max(0, limit));
}
