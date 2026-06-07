import { supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';

// Perfil fica no user_metadata do Supabase Auth — sem tabela nova, sincroniza
// em qualquer login. display_name = como o app chama o usuário; birth_date ISO.
export interface Profile {
  displayName: string;
  birthDate: string | null; // 'YYYY-MM-DD'
}

export function readProfile(session: Session | null): Profile {
  const meta = (session?.user?.user_metadata ?? {}) as Record<string, unknown>;
  return {
    displayName: typeof meta.display_name === 'string' ? meta.display_name : '',
    birthDate: typeof meta.birth_date === 'string' ? meta.birth_date : null,
  };
}

/** Salva nome + nascimento no auth. Dispara USER_UPDATED → session$ atualiza. */
export async function updateProfile(p: Profile): Promise<string | null> {
  const { error } = await supabase.auth.updateUser({
    data: {
      display_name: p.displayName.trim() || null,
      birth_date: p.birthDate,
    },
  });
  return error ? error.message : null;
}

// ---- helpers de data (exibe DD/MM/AAAA, guarda YYYY-MM-DD) ----

/** Aplica máscara DD/MM/AAAA enquanto digita. */
export function maskBR(input: string): string {
  const d = input.replace(/\D/g, '').slice(0, 8);
  const parts = [d.slice(0, 2), d.slice(2, 4), d.slice(4, 8)].filter(Boolean);
  return parts.join('/');
}

/** 'YYYY-MM-DD' → 'DD/MM/AAAA' (ou '' se vazio). */
export function isoToBR(iso: string | null): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}/${m}/${y}` : '';
}

/** 'DD/MM/AAAA' → 'YYYY-MM-DD' se for data válida; senão null. */
export function brToISO(br: string): string | null {
  const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const day = +dd, mon = +mm, year = +yyyy;
  if (mon < 1 || mon > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) return null;
  const dt = new Date(year, mon - 1, day);
  if (dt.getFullYear() !== year || dt.getMonth() !== mon - 1 || dt.getDate() !== day) return null;
  return `${yyyy}-${mm}-${dd}`;
}

/** Idade a partir do ISO (ou null). */
export function ageFromISO(iso: string | null): number | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  const today = new Date();
  let age = today.getFullYear() - y;
  const mDiff = today.getMonth() + 1 - m;
  if (mDiff < 0 || (mDiff === 0 && today.getDate() < d)) age--;
  return age >= 0 && age < 150 ? age : null;
}
