import { EXERCISE_SEED, type SeedExercise } from './exercises.seed';

/** Normaliza nome para comparação idempotente (caixa/acentos/espaços). */
export function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Lógica PURA de idempotência: dado o conjunto de nomes já existentes, devolve
 * só os exercícios do seed que ainda faltam. Sem dependência de store/Supabase,
 * então é testável isoladamente.
 */
export function selectMissingExercises(
  existingNames: Iterable<string>,
  seed: SeedExercise[] = EXERCISE_SEED,
): SeedExercise[] {
  const have = new Set([...existingNames].map(normalizeName));
  return seed.filter((s) => !have.has(normalizeName(s.name)));
}
