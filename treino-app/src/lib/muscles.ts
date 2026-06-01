// Rótulos PT-BR para os grupos musculares do free-exercise-db.
export const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Peito',
  lats: 'Dorsais',
  'middle back': 'Costas',
  'lower back': 'Lombar',
  shoulders: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  forearms: 'Antebraço',
  quadriceps: 'Quadríceps',
  hamstrings: 'Posterior',
  glutes: 'Glúteos',
  calves: 'Panturrilha',
  abdominals: 'Abdômen',
  traps: 'Trapézio',
  neck: 'Pescoço',
};

export function muscleLabel(key: string): string {
  return MUSCLE_LABELS[key] ?? key;
}
