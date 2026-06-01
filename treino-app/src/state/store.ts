import { observable, type Observable } from '@legendapp/state';
import { customSynced } from './sync';
import type { Database } from './database.types';

type Tables = Database['public']['Tables'];

// O plugin Supabase do Legend beta.47 foi tipado contra um postgrest-js mais
// antigo (assinatura genérica diferente da 2.106 instalada), o que dispara
// overload-mismatch + TS2589 "instanciação profunda". O runtime é correto;
// contemos o ruído de tipo aqui e reimpomos o tipo certo via genérico T.
function syncedTable<K extends keyof Tables>(collection: K, realtime: boolean) {
  const synced: any = customSynced({
    collection,
    select: (from: any) => from.select('*'),
    actions: ['read', 'create', 'update'],
    realtime,
    persist: { name: collection as string, retrySync: true },
  } as any);
  return observable<any>(synced) as unknown as Observable<
    Record<string, Tables[K]['Row']>
  >;
}

// `realtime: true` só nas tabelas que mudam cross-device durante uma sessão
// (workout ativo). Catálogo, rotinas e métricas não precisam de realtime — o
// pull no login + sync incremental já bastam, e poupa conexões do free tier.
export const exercises$ = syncedTable('exercises', false);
export const routines$ = syncedTable('routines', false);
export const routineExercises$ = syncedTable('routine_exercises', false);
export const workouts$ = syncedTable('workouts', true);
export const workoutExercises$ = syncedTable('workout_exercises', true);
export const sets$ = syncedTable('sets', true);
export const cardioSessions$ = syncedTable('cardio_sessions', false);
export const bodyMetrics$ = syncedTable('body_metrics', false);
export const progressPhotos$ = syncedTable('progress_photos', false);
export const personalRecords$ = syncedTable('personal_records', false);

/** Todos os observables sincronizados — usado para re-pull no SIGNED_IN. */
export const allStores = [
  exercises$,
  routines$,
  routineExercises$,
  workouts$,
  workoutExercises$,
  sets$,
  cardioSessions$,
  bodyMetrics$,
  progressPhotos$,
  personalRecords$,
];
