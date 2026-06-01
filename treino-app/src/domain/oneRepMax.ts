// Estimativa de 1RM (uma repetição máxima) e cargas-alvo.
//
// Fórmula de Epley: 1RM = peso * (1 + reps/30).
// É a mais usada e calibra bem na faixa de 1–10 reps. Acima de ~12 reps a
// estimativa perde precisão (qualquer fórmula perde), então sinalizamos via
// `lowConfidence` em vez de mentir um número preciso.

export const EPLEY_DIVISOR = 30;

/** True quando a estimativa de 1RM é pouco confiável (reps altas). */
export function isLowConfidenceReps(reps: number): boolean {
  return reps > 12;
}

/**
 * Estima o 1RM a partir de um peso levantado por N reps.
 * Retorna null para entradas inválidas (peso/reps <= 0).
 * Com 1 rep, o 1RM é o próprio peso.
 */
export function estimateOneRepMax(weight: number, reps: number): number | null {
  if (!Number.isFinite(weight) || !Number.isFinite(reps)) return null;
  if (weight <= 0 || reps <= 0) return null;
  if (reps === 1) return weight;
  return weight * (1 + reps / EPLEY_DIVISOR);
}

/**
 * Dado um 1RM, estima o peso que você deveria conseguir para `targetReps`.
 * Inverso da fórmula de Epley. Retorna null para entradas inválidas.
 */
export function estimateWeightForReps(
  oneRepMax: number,
  targetReps: number,
): number | null {
  if (!Number.isFinite(oneRepMax) || !Number.isFinite(targetReps)) return null;
  if (oneRepMax <= 0 || targetReps <= 0) return null;
  if (targetReps === 1) return oneRepMax;
  return oneRepMax / (1 + targetReps / EPLEY_DIVISOR);
}

/**
 * Arredonda uma carga para o incremento de disco mais próximo (default 2.5kg).
 * Útil para transformar a sugestão teórica em algo carregável na barra.
 */
export function roundToIncrement(weight: number, increment = 2.5): number {
  if (increment <= 0) return weight;
  return Math.round(weight / increment) * increment;
}
