import {
  estimateOneRepMax,
  estimateWeightForReps,
  isLowConfidenceReps,
  roundToIncrement,
} from './oneRepMax';

describe('estimateOneRepMax (Epley)', () => {
  it('retorna o próprio peso para 1 rep', () => {
    expect(estimateOneRepMax(100, 1)).toBe(100);
  });

  it('calcula Epley para múltiplas reps', () => {
    // 100 * (1 + 5/30) = 116.666...
    expect(estimateOneRepMax(100, 5)).toBeCloseTo(116.6667, 3);
    // 80 * (1 + 10/30) = 106.666...
    expect(estimateOneRepMax(80, 10)).toBeCloseTo(106.6667, 3);
  });

  it('rejeita entradas inválidas', () => {
    expect(estimateOneRepMax(0, 5)).toBeNull();
    expect(estimateOneRepMax(100, 0)).toBeNull();
    expect(estimateOneRepMax(-50, 5)).toBeNull();
    expect(estimateOneRepMax(100, -3)).toBeNull();
    expect(estimateOneRepMax(NaN, 5)).toBeNull();
  });
});

describe('estimateWeightForReps (inverso de Epley)', () => {
  it('é inverso de estimateOneRepMax', () => {
    const orm = estimateOneRepMax(100, 5)!;
    expect(estimateWeightForReps(orm, 5)).toBeCloseTo(100, 5);
  });

  it('retorna o 1RM para 1 rep', () => {
    expect(estimateWeightForReps(120, 1)).toBe(120);
  });

  it('rejeita entradas inválidas', () => {
    expect(estimateWeightForReps(0, 5)).toBeNull();
    expect(estimateWeightForReps(120, 0)).toBeNull();
  });
});

describe('isLowConfidenceReps', () => {
  it('marca reps altas como baixa confiança', () => {
    expect(isLowConfidenceReps(13)).toBe(true);
    expect(isLowConfidenceReps(12)).toBe(false);
    expect(isLowConfidenceReps(5)).toBe(false);
  });
});

describe('roundToIncrement', () => {
  it('arredonda para 2.5kg por padrão', () => {
    expect(roundToIncrement(100.9)).toBe(100);
    expect(roundToIncrement(101.7)).toBe(102.5);
    expect(roundToIncrement(116.6667)).toBe(117.5);
  });

  it('aceita incremento customizado', () => {
    expect(roundToIncrement(103, 5)).toBe(105);
    expect(roundToIncrement(102, 1)).toBe(102);
  });
});
