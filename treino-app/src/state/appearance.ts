import { observable } from '@legendapp/state';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme } from 'nativewind';

export type AppearancePref = 'system' | 'light' | 'dark';

const KEY = 'appearance_pref';

// Preferência atual (default 'system' = espelha o aparelho).
export const appearance$ = observable<AppearancePref>('system');

function apply(pref: AppearancePref) {
  // nativewind aceita 'system' | 'light' | 'dark'; isso dirige os tokens do
  // tema (useColors / classes NativeWind) em todo o app.
  colorScheme.set(pref);
}

/** Carrega a preferência salva e aplica. Chamar no boot. */
export async function loadAppearance(): Promise<void> {
  try {
    const saved = (await AsyncStorage.getItem(KEY)) as AppearancePref | null;
    const pref = saved ?? 'system';
    appearance$.set(pref);
    apply(pref);
  } catch {
    apply('system');
  }
}

/** Define e persiste a preferência. */
export async function setAppearance(pref: AppearancePref): Promise<void> {
  appearance$.set(pref);
  apply(pref);
  try {
    await AsyncStorage.setItem(KEY, pref);
  } catch {
    // sem persistência: aplica mesmo assim na sessão
  }
}
