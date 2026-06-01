import { computeStreaks, toDayIndex } from './streaks';

describe('toDayIndex', () => {
  it('dias consecutivos diferem de 1', () => {
    expect(toDayIndex('2026-05-31') - toDayIndex('2026-05-30')).toBe(1);
  });
  it('ignora a parte de hora', () => {
    expect(toDayIndex('2026-05-31T23:59:00Z')).toBe(toDayIndex('2026-05-31'));
  });
});

describe('computeStreaks', () => {
  it('zera sem treinos', () => {
    expect(computeStreaks([], '2026-05-31')).toEqual({ current: 0, longest: 0 });
  });

  it('conta streak atual terminando hoje', () => {
    const dates = ['2026-05-29', '2026-05-30', '2026-05-31'];
    expect(computeStreaks(dates, '2026-05-31')).toEqual({ current: 3, longest: 3 });
  });

  it('não quebra streak se ainda não treinou hoje (ancora em ontem)', () => {
    const dates = ['2026-05-29', '2026-05-30'];
    expect(computeStreaks(dates, '2026-05-31').current).toBe(2);
  });

  it('zera streak atual se o último treino foi há mais de 1 dia', () => {
    const dates = ['2026-05-27', '2026-05-28'];
    const r = computeStreaks(dates, '2026-05-31');
    expect(r.current).toBe(0);
    expect(r.longest).toBe(2);
  });

  it('deduplica múltiplos treinos no mesmo dia', () => {
    const dates = ['2026-05-31T08:00:00Z', '2026-05-31T18:00:00Z'];
    expect(computeStreaks(dates, '2026-05-31')).toEqual({ current: 1, longest: 1 });
  });

  it('acha o maior streak mesmo com buracos', () => {
    const dates = [
      '2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04', // 4
      '2026-05-10', '2026-05-11', // 2
    ];
    expect(computeStreaks(dates, '2026-05-31').longest).toBe(4);
  });
});
