import { observable, syncState } from '@legendapp/state';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { allStores } from './store';

export const session$ = observable<Session | null>(null);
export const authReady$ = observable(false);

supabase.auth.getSession().then(({ data }) => {
  session$.set(data.session);
  authReady$.set(true);
});

supabase.auth.onAuthStateChange((event, session) => {
  session$.set(session);
  authReady$.set(true);

  // Gotcha #453: o pull inicial pode disparar antes da sessão existir. Ao
  // logar, re-acionamos sync() de todos os observables para puxar do servidor
  // com o user_id já resolvido pelo RLS.
  if (event === 'SIGNED_IN') {
    allStores.forEach((store$) => syncState(store$).sync());

    // Seed idempotente: popula o catálogo na primeira vez.
    // Importação lazy evita ciclo: seedExercises → store → supabase → auth.
    import('../seed/seedExercises').then(({ seedExercises }) => {
      seedExercises();
    });
  }
});

export const signIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

export const signOut = () => supabase.auth.signOut();
