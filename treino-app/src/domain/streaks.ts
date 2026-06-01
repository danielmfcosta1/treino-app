// Streaks de dias treinados. Tudo determinístico: a "data de hoje" é sempre
// passada como parâmetro (referenceDate), nunca lida do relógio — assim os
// testes não dependem de quando rodam.

/** Converte uma data (ISO ou YYYY-MM-DD) num índice inteiro de dia (UTC). */
export function toDayIndex(isoDate: string): number {
  const day = isoDate.slice(0, 10); // YYYY-MM-DD
  const [y, m, d] = day.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

function uniqueSortedDays(dates: string[]): number[] {
  const set = new Set(dates.map(toDayIndex));
  return [...set].sort((a, b) => a - b);
}

export interface StreakResult {
  current: number;
  longest: number;
}

/**
 * Calcula streak atual e maior streak a partir das datas de treino.
 *
 * - `current`: dias consecutivos terminando hoje (ou ontem, para não "quebrar"
 *   só porque você ainda não treinou hoje). 0 se o último treino foi antes.
 * - `longest`: maior sequência de dias consecutivos no histórico.
 */
export function computeStreaks(
  workoutDates: string[],
  referenceDate: string,
): StreakResult {
  const days = uniqueSortedDays(workoutDates);
  if (days.length === 0) return { current: 0, longest: 0 };

  // Maior sequência.
  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    if (days[i] === days[i - 1] + 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  // Streak atual: ancora em hoje ou ontem.
  const present = new Set(days);
  const today = toDayIndex(referenceDate);
  let anchor: number | null = null;
  if (present.has(today)) anchor = today;
  else if (present.has(today - 1)) anchor = today - 1;

  let current = 0;
  if (anchor !== null) {
    let cursor = anchor;
    while (present.has(cursor)) {
      current += 1;
      cursor -= 1;
    }
  }

  return { current, longest };
}
