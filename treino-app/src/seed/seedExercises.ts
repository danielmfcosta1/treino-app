import { exercises$ } from '../state/store';
import { supabase } from '../state/supabase';
import { newId } from '../lib/ids';
import { selectMissingExercises } from './selection';
import { EXERCISE_SEED } from './exercises.seed';

export { normalizeName, selectMissingExercises } from './selection';

/**
 * Popula o catálogo APENAS se ele estiver vazio no servidor.
 *
 * Antes, isto rodava no SIGNED_IN lendo o store local — que pode ainda não ter
 * sincronizado os exercícios existentes, fazendo o seed achar "vazio" e
 * reinserir tudo (bug dos 37 duplicados). Agora consultamos o servidor
 * (autoritativo) e só semeamos se realmente não houver nada. Idempotente e
 * à prova de corrida de sincronização.
 */
export async function seedExercises(): Promise<number> {
  const { count, error } = await supabase
    .from('exercises')
    .select('id', { count: 'exact', head: true })
    .eq('deleted', false);

  if (error) return 0; // sem rede / falha: não arrisca duplicar
  if ((count ?? 0) > 0) return 0; // catálogo já existe

  const missing = selectMissingExercises([], EXERCISE_SEED);
  for (const ex of missing) {
    const id = newId();
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
