// Catálogo-semente de exercícios comuns (subconjunto curado do free-exercise-db,
// domínio público — github.com/yuhonas/free-exercise-db). Nomes de músculos
// seguem a convenção do dataset original para alimentar o heatmap.
//
// Campos batem com a tabela `exercises`: name, category, equipment, force,
// mechanic, primary_muscles, secondary_muscles.

export interface SeedExercise {
  name: string;
  category: string;
  equipment: string | null;
  force: string | null;
  mechanic: string | null;
  primary_muscles: string[];
  secondary_muscles: string[];
}

export const EXERCISE_SEED: SeedExercise[] = [
  // ---- Peito ----
  { name: 'Supino Reto com Barra', category: 'strength', equipment: 'barbell', force: 'push', mechanic: 'compound', primary_muscles: ['chest'], secondary_muscles: ['shoulders', 'triceps'] },
  { name: 'Supino Inclinado com Halteres', category: 'strength', equipment: 'dumbbell', force: 'push', mechanic: 'compound', primary_muscles: ['chest'], secondary_muscles: ['shoulders', 'triceps'] },
  { name: 'Crucifixo na Máquina (Peck Deck)', category: 'strength', equipment: 'machine', force: 'push', mechanic: 'isolation', primary_muscles: ['chest'], secondary_muscles: [] },
  { name: 'Crossover na Polia', category: 'strength', equipment: 'cable', force: 'push', mechanic: 'isolation', primary_muscles: ['chest'], secondary_muscles: ['shoulders'] },
  { name: 'Flexão de Braço', category: 'strength', equipment: 'body only', force: 'push', mechanic: 'compound', primary_muscles: ['chest'], secondary_muscles: ['shoulders', 'triceps'] },

  // ---- Costas ----
  { name: 'Barra Fixa (Pull-up)', category: 'strength', equipment: 'body only', force: 'pull', mechanic: 'compound', primary_muscles: ['lats'], secondary_muscles: ['biceps', 'middle back'] },
  { name: 'Puxada Alta na Polia', category: 'strength', equipment: 'cable', force: 'pull', mechanic: 'compound', primary_muscles: ['lats'], secondary_muscles: ['biceps', 'middle back'] },
  { name: 'Remada Curvada com Barra', category: 'strength', equipment: 'barbell', force: 'pull', mechanic: 'compound', primary_muscles: ['middle back'], secondary_muscles: ['lats', 'biceps'] },
  { name: 'Remada Baixa na Polia', category: 'strength', equipment: 'cable', force: 'pull', mechanic: 'compound', primary_muscles: ['middle back'], secondary_muscles: ['lats', 'biceps'] },
  { name: 'Remada Unilateral com Haltere', category: 'strength', equipment: 'dumbbell', force: 'pull', mechanic: 'compound', primary_muscles: ['middle back'], secondary_muscles: ['lats', 'biceps'] },
  { name: 'Levantamento Terra', category: 'strength', equipment: 'barbell', force: 'pull', mechanic: 'compound', primary_muscles: ['lower back'], secondary_muscles: ['glutes', 'hamstrings', 'traps'] },

  // ---- Ombros ----
  { name: 'Desenvolvimento com Halteres', category: 'strength', equipment: 'dumbbell', force: 'push', mechanic: 'compound', primary_muscles: ['shoulders'], secondary_muscles: ['triceps'] },
  { name: 'Desenvolvimento Militar com Barra', category: 'strength', equipment: 'barbell', force: 'push', mechanic: 'compound', primary_muscles: ['shoulders'], secondary_muscles: ['triceps'] },
  { name: 'Elevação Lateral', category: 'strength', equipment: 'dumbbell', force: 'push', mechanic: 'isolation', primary_muscles: ['shoulders'], secondary_muscles: [] },
  { name: 'Elevação Frontal', category: 'strength', equipment: 'dumbbell', force: 'push', mechanic: 'isolation', primary_muscles: ['shoulders'], secondary_muscles: [] },
  { name: 'Crucifixo Invertido (Reverse Fly)', category: 'strength', equipment: 'dumbbell', force: 'pull', mechanic: 'isolation', primary_muscles: ['shoulders'], secondary_muscles: ['middle back'] },

  // ---- Bíceps ----
  { name: 'Rosca Direta com Barra', category: 'strength', equipment: 'barbell', force: 'pull', mechanic: 'isolation', primary_muscles: ['biceps'], secondary_muscles: ['forearms'] },
  { name: 'Rosca Alternada com Halteres', category: 'strength', equipment: 'dumbbell', force: 'pull', mechanic: 'isolation', primary_muscles: ['biceps'], secondary_muscles: ['forearms'] },
  { name: 'Rosca Martelo', category: 'strength', equipment: 'dumbbell', force: 'pull', mechanic: 'isolation', primary_muscles: ['biceps'], secondary_muscles: ['forearms'] },

  // ---- Tríceps ----
  { name: 'Tríceps na Polia (Pushdown)', category: 'strength', equipment: 'cable', force: 'push', mechanic: 'isolation', primary_muscles: ['triceps'], secondary_muscles: [] },
  { name: 'Tríceps Testa com Barra', category: 'strength', equipment: 'barbell', force: 'push', mechanic: 'isolation', primary_muscles: ['triceps'], secondary_muscles: [] },
  { name: 'Mergulho entre Bancos (Dips)', category: 'strength', equipment: 'body only', force: 'push', mechanic: 'compound', primary_muscles: ['triceps'], secondary_muscles: ['chest', 'shoulders'] },

  // ---- Pernas ----
  { name: 'Agachamento Livre', category: 'strength', equipment: 'barbell', force: 'push', mechanic: 'compound', primary_muscles: ['quadriceps'], secondary_muscles: ['glutes', 'hamstrings', 'lower back'] },
  { name: 'Agachamento Sumô', category: 'strength', equipment: 'barbell', force: 'push', mechanic: 'compound', primary_muscles: ['quadriceps'], secondary_muscles: ['glutes', 'hamstrings', 'lower back'] },
  { name: 'Agachamento Frontal', category: 'strength', equipment: 'barbell', force: 'push', mechanic: 'compound', primary_muscles: ['quadriceps'], secondary_muscles: ['glutes', 'lower back'] },
  { name: 'Leg Press 45°', category: 'strength', equipment: 'machine', force: 'push', mechanic: 'compound', primary_muscles: ['quadriceps'], secondary_muscles: ['glutes', 'hamstrings'] },
  { name: 'Cadeira Extensora', category: 'strength', equipment: 'machine', force: 'push', mechanic: 'isolation', primary_muscles: ['quadriceps'], secondary_muscles: [] },
  { name: 'Mesa Flexora', category: 'strength', equipment: 'machine', force: 'pull', mechanic: 'isolation', primary_muscles: ['hamstrings'], secondary_muscles: [] },
  { name: 'Stiff com Barra', category: 'strength', equipment: 'barbell', force: 'pull', mechanic: 'compound', primary_muscles: ['hamstrings'], secondary_muscles: ['glutes', 'lower back'] },
  { name: 'Afundo (Lunge) com Halteres', category: 'strength', equipment: 'dumbbell', force: 'push', mechanic: 'compound', primary_muscles: ['quadriceps'], secondary_muscles: ['glutes', 'hamstrings'] },
  { name: 'Elevação de Panturrilha em Pé', category: 'strength', equipment: 'machine', force: 'push', mechanic: 'isolation', primary_muscles: ['calves'], secondary_muscles: [] },
  { name: 'Panturrilha no Leg Press', category: 'strength', equipment: 'machine', force: 'push', mechanic: 'isolation', primary_muscles: ['calves'], secondary_muscles: [] },
  { name: 'Hip Thrust com Barra', category: 'strength', equipment: 'barbell', force: 'push', mechanic: 'compound', primary_muscles: ['glutes'], secondary_muscles: ['hamstrings'] },

  // ---- Core ----
  { name: 'Prancha Abdominal', category: 'strength', equipment: 'body only', force: 'static', mechanic: 'isolation', primary_muscles: ['abdominals'], secondary_muscles: ['lower back'] },
  { name: 'Abdominal Supra', category: 'strength', equipment: 'body only', force: 'pull', mechanic: 'isolation', primary_muscles: ['abdominals'], secondary_muscles: [] },
  { name: 'Dead Bug', category: 'strength', equipment: 'body only', force: null, mechanic: 'isolation', primary_muscles: ['abdominals'], secondary_muscles: [] },
  { name: 'Elevação de Pernas Suspenso', category: 'strength', equipment: 'body only', force: 'pull', mechanic: 'compound', primary_muscles: ['abdominals'], secondary_muscles: ['forearms'] },

  // ---- Cardio ----
  { name: 'Esteira (Corrida)', category: 'cardio', equipment: 'machine', force: null, mechanic: null, primary_muscles: ['quadriceps'], secondary_muscles: ['calves', 'hamstrings'] },
  { name: 'Bicicleta Ergométrica', category: 'cardio', equipment: 'machine', force: null, mechanic: null, primary_muscles: ['quadriceps'], secondary_muscles: ['calves'] },
  { name: 'Elíptico', category: 'cardio', equipment: 'machine', force: null, mechanic: null, primary_muscles: ['quadriceps'], secondary_muscles: ['hamstrings', 'calves'] },
  { name: 'Remo Ergômetro', category: 'cardio', equipment: 'machine', force: null, mechanic: null, primary_muscles: ['middle back'], secondary_muscles: ['lats', 'quadriceps', 'biceps'] },
];
