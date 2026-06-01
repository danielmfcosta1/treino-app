import { observable } from '@legendapp/state';
import { cancelScheduled, scheduleInSeconds } from '../lib/notifications';

// Estado do timer de descanso (local, não sincronizado).
// endsAt = timestamp (ms) em que o descanso termina; null = parado.
export const restTimer$ = observable<{
  endsAt: number | null;
  total: number;
}>({ endsAt: null, total: 0 });

// Duração padrão de descanso, em segundos (persistida via SQLite kv-store
// seria ideal; por ora fica em memória com default sensato).
export const defaultRestSeconds$ = observable(90);

let notifId: string | null = null;

export async function startRest(seconds: number): Promise<void> {
  await stopRest();
  restTimer$.set({ endsAt: Date.now() + seconds * 1000, total: seconds });
  notifId = await scheduleInSeconds(
    seconds,
    '💪 Descanso acabou!',
    'Hora da próxima série.',
  );
}

export async function addRestSeconds(delta: number): Promise<void> {
  const cur = restTimer$.endsAt.get();
  if (cur == null) return;
  const remaining = Math.max(0, Math.round((cur - Date.now()) / 1000)) + delta;
  if (remaining <= 0) {
    await stopRest();
    return;
  }
  await startRest(remaining);
}

export async function stopRest(): Promise<void> {
  await cancelScheduled(notifId);
  notifId = null;
  restTimer$.set({ endsAt: null, total: 0 });
}
