import { normalizeName, selectMissingExercises } from './selection';
import { EXERCISE_SEED } from './exercises.seed';

describe('normalizeName', () => {
  it('ignora caixa, acentos e espaços nas pontas', () => {
    expect(normalizeName('  Tríceps Testa ')).toBe('triceps testa');
    expect(normalizeName('AGACHAMENTO')).toBe('agachamento');
  });
});

describe('selectMissingExercises', () => {
  it('retorna todo o seed quando nada existe', () => {
    expect(selectMissingExercises([])).toHaveLength(EXERCISE_SEED.length);
  });

  it('é idempotente: nada falta quando tudo já existe', () => {
    const allNames = EXERCISE_SEED.map((e) => e.name);
    expect(selectMissingExercises(allNames)).toHaveLength(0);
  });

  it('ignora diferenças de acento/caixa ao comparar', () => {
    const missing = selectMissingExercises(['agachamento livre']); // sem acento, minúsculo
    const names = missing.map((m) => m.name);
    expect(names).not.toContain('Agachamento Livre');
  });

  it('insere só os que faltam', () => {
    const existing = EXERCISE_SEED.slice(0, 5).map((e) => e.name);
    const missing = selectMissingExercises(existing);
    expect(missing).toHaveLength(EXERCISE_SEED.length - 5);
  });

  it('o seed não tem nomes duplicados', () => {
    const norm = EXERCISE_SEED.map((e) => normalizeName(e.name));
    expect(new Set(norm).size).toBe(EXERCISE_SEED.length);
  });
});
