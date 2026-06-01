import { exercises$ } from '../state/store';
import { newId } from '../lib/ids';
import { selectMissingExercises } from './selection';
import type { ExerciseRow } from '../domain/types';

export { normalizeName, selectMissingExercises } from './selection';

/**
 * Popula o catálogo no estado local (que sincroniza pro Supabase). Idempotente:
 * roda quantas vezes quiser que só insere o que falta. Deve rodar após o login.
 * Retorna quantos exercícios foram inseridos.
 */
export function seedExercises(): number {
  const current = exercises$.get() ?? {};
  const existingNames = Object.values(current)
    .filter((e): e is ExerciseRow => !!e && !e.deleted)
    .map((e) => e.name);

  const missing = selectMissingExercises(existingNames);

  for (const ex of missing) {
    const id = newId();
    // user_id/created_at/updated_at/deleted são preenchidos pelo
    // default/trigger no Postgres; o cliente só manda os campos de conteúdo.
    exercises$[id].set({
      id,
      name: ex.name,
      category: ex.category,
      equipment: ex.equipment,
      force: ex.force,
      mechanic: ex.mechanic,
      primary_muscles: ex.primary_muscles,
      secondary_muscles: ex.secondary_muscles,
      is_custom: false,
    } as never);
  }

  return missing.length;
}
