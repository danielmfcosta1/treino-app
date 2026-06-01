import { computeMuscleHeatmap, rankMuscles } from './heatmap';
import type { PerformedSet } from './types';

const set = (weight: number, reps: number, extra: Partial<PerformedSet> = {}): PerformedSet => ({
  weight,
  reps,
  ...extra,
});

describe('computeMuscleHeatmap', () => {
  it('soma séries por músculo, secundário com metade do peso', () => {
    const h = computeMuscleHeatmap([
      {
        primaryMuscles: ['chest'],
        secondaryMuscles: ['triceps'],
        sets: [set(100, 8), set(100, 8)], // 2 séries de trabalho
      },
    ]);
    expect(h.chest).toBe(2);
    expect(h.triceps).toBe(1); // 2 * 0.5
  });

  it('acumula entre exercícios', () => {
    const h = computeMuscleHeatmap([
      { primaryMuscles: ['chest'], secondaryMuscles: [], sets: [set(100, 8)] },
      { primaryMuscles: ['chest'], secondaryMuscles: [], sets: [set(80, 10), set(80, 10)] },
    ]);
    expect(h.chest).toBe(3);
  });

  it('ignora warmups na contagem', () => {
    const h = computeMuscleHeatmap([
      {
        primaryMuscles: ['back'],
        secondaryMuscles: [],
        sets: [set(100, 5, { set_type: 'warmup' }), set(100, 5)],
      },
    ]);
    expect(h.back).toBe(1);
  });

  it('métrica tonnage soma peso×reps', () => {
    const h = computeMuscleHeatmap(
      [{ primaryMuscles: ['legs'], secondaryMuscles: [], sets: [set(100, 5)] }],
      { metric: 'tonnage', secondaryWeight: 0.5 },
    );
    expect(h.legs).toBe(500);
  });
});

describe('rankMuscles', () => {
  it('ordena do mais trabalhado pro menos', () => {
    const ranked = rankMuscles({ chest: 2, triceps: 1, back: 5 });
    expect(ranked.map((r) => r.muscle)).toEqual(['back', 'chest', 'triceps']);
  });
});
