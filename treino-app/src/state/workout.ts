import { observable } from '@legendapp/state';

/**
 * ID do treino em andamento. null = nenhum treino ativo.
 * Não é sincronizado — é estado local de sessão (perde ao fechar o app).
 * O treino em si fica em workouts$ e é sync'd normalmente.
 */
export const activeWorkoutId$ = observable<string | null>(null);
