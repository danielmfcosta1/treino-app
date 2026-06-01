import {
  detectStagnation,
  suggestNextLoad,
  DEFAULT_PROGRESSION,
} from './progression';
import type { PerformedSet, SessionPerformance } from './types';

const set = (weight: number, reps: number, extra: Partial<PerformedSet> = {}): PerformedSet => ({
  weight,
  reps,
  ...extra,
});

describe('suggestNextLoad (dupla progressão)', () => {
  it('retorna null sem sessão anterior', () => {
    expect(suggestNextLoad([])).toBeNull();
  });

  it('sobe a carga ao bater o topo da faixa com folga (RIR alto)', () => {
    // faixa 8–12, bateu 12 reps com RIR 3 → +2.5kg, volta pro fundo (8)
    const s = suggestNextLoad([set(100, 12, { rir: 3 })]);
    expect(s).toEqual({ weight: 102.5, reps: 8, reason: 'increase_weight' });
  });

  it('consolida ao bater o topo no talo (RIR 0)', () => {
    const s = suggestNextLoad([set(100, 12, { rir: 0 })]);
    expect(s).toEqual({ weight: 100, reps: 12, reason: 'consolidate' });
  });

  it('adiciona 1 rep quando está abaixo do topo', () => {
    const s = suggestNextLoad([set(100, 9, { rir: 2 })]);
    expect(s).toEqual({ weight: 100, reps: 10, reason: 'add_rep' });
  });

  it('reduz a carga ao falhar abaixo do mínimo no talo', () => {
    const s = suggestNextLoad([set(100, 5, { rir: 0 })]);
    expect(s).toEqual({ weight: 97.5, reps: 8, reason: 'reduce_weight' });
  });

  it('deriva RIR do RPE quando rir ausente (RPE 7 → RIR 3)', () => {
    const s = suggestNextLoad([set(100, 12, { rpe: 7 })]);
    expect(s?.reason).toBe('increase_weight');
  });

  it('usa o melhor set (maior peso) como referência', () => {
    const s = suggestNextLoad([
      set(60, 12, { rir: 5 }),
      set(100, 9, { rir: 2 }),
    ]);
    expect(s).toEqual({ weight: 100, reps: 10, reason: 'add_rep' });
  });
});

describe('detectStagnation', () => {
  const session = (performedAt: string, sets: PerformedSet[]): SessionPerformance => ({
    workoutId: performedAt,
    exerciseId: 'ex1',
    performedAt,
    sets,
  });

  it('não acusa estagnação sem sessões suficientes', () => {
    const r = detectStagnation([session('2026-05-01', [set(100, 5)])]);
    expect(r.isStagnant).toBe(false);
    expect(r.sessionsAnalyzed).toBe(1);
  });

  it('detecta estagnação quando o 1RM não melhora na janela', () => {
    const sessions = [
      session('2026-05-01', [set(100, 5)]),
      session('2026-05-08', [set(100, 5)]),
      session('2026-05-15', [set(100, 5)]),
    ];
    const r = detectStagnation(sessions);
    expect(r.isStagnant).toBe(true);
    // deload: 100 * 0.9 = 90
    expect(r.deloadWeight).toBe(90);
  });

  it('NÃO acusa estagnação quando há melhora na janela', () => {
    const sessions = [
      session('2026-05-01', [set(100, 5)]),
      session('2026-05-08', [set(102.5, 5)]),
      session('2026-05-15', [set(105, 5)]),
    ];
    const r = detectStagnation(sessions);
    expect(r.isStagnant).toBe(false);
    expect(r.deloadWeight).toBeNull();
  });

  it('usa a config default de janela 3', () => {
    expect(DEFAULT_PROGRESSION.repRange).toEqual({ min: 8, max: 12 });
  });
});
