import { computeRecords, findNewRecords } from './records';
import type { PerformedSet } from './types';

const set = (weight: number, reps: number, extra: Partial<PerformedSet> = {}): PerformedSet => ({
  weight,
  reps,
  ...extra,
});

describe('computeRecords', () => {
  it('zera sem sets válidos', () => {
    expect(computeRecords([])).toEqual({
      max_weight: 0,
      estimated_1rm: 0,
      max_volume_set: 0,
      max_reps: 0,
    });
  });

  it('ignora warmups e sets incompletos', () => {
    const r = computeRecords([
      set(200, 1, { set_type: 'warmup' }),
      set(100, 5, { is_completed: false }),
      set(80, 10),
    ]);
    expect(r.max_weight).toBe(80);
    expect(r.max_reps).toBe(10);
  });

  it('pega o melhor de cada métrica entre sets', () => {
    const r = computeRecords([set(100, 3), set(80, 10), set(60, 15)]);
    expect(r.max_weight).toBe(100);
    expect(r.max_reps).toBe(15);
    // volume: 100*3=300, 80*10=800, 60*15=900
    expect(r.max_volume_set).toBe(900);
    // e1rm: 100*(1+3/30)=110, 80*(1+10/30)=106.67, 60*(1+15/30)=90 → 110
    expect(r.estimated_1rm).toBeCloseTo(110, 5);
  });
});

describe('findNewRecords', () => {
  const prev = {
    max_weight: 100,
    estimated_1rm: 110,
    max_volume_set: 900,
    max_reps: 15,
  };

  it('detecta só os recordes batidos', () => {
    const news = findNewRecords(prev, [set(105, 3)]);
    const types = news.map((n) => n.type);
    expect(types).toContain('max_weight'); // 105 > 100
    expect(types).toContain('estimated_1rm'); // 105*1.1=115.5 > 110
    expect(types).not.toContain('max_reps'); // 3 < 15
  });

  it('retorna vazio quando nada é superado', () => {
    expect(findNewRecords(prev, [set(50, 5)])).toEqual([]);
  });
});
