import { configureSynced } from '@legendapp/state/sync';
import { syncedSupabase } from '@legendapp/state/sync-plugins/supabase';
import { observablePersistSqlite } from '@legendapp/state/persist-plugins/expo-sqlite';
import Storage from 'expo-sqlite/kv-store';
import { supabase } from './supabase';
import { newId } from '../lib/ids';

// Fonte da verdade local = SQLite (kv-store). Sync incremental com Supabase via
// changesSince=last-sync + soft-delete (coluna `deleted`). Timestamps são
// controlados pelo trigger no Postgres — o cliente NUNCA seta updated_at.
export const customSynced = configureSynced(syncedSupabase, {
  supabase,
  persist: {
    plugin: observablePersistSqlite(Storage),
  },
  generateId: newId,
  changesSince: 'last-sync',
  fieldId: 'id',
  fieldCreatedAt: 'created_at',
  fieldUpdatedAt: 'updated_at',
  fieldDeleted: 'deleted',
});
