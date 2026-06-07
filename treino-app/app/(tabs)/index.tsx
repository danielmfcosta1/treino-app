import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { use$ } from '@legendapp/state/react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { workouts$, routines$ } from '@/src/state/store';
import { session$ } from '@/src/state/auth';
import { activeWorkoutId$ } from '@/src/state/workout';
import { newId } from '@/src/lib/ids';

export default function HomeScreen() {
  const router = useRouter();
  const session = use$(session$);
  const workoutsMap = use$(workouts$);
  const routinesMap = use$(routines$);
  use$(activeWorkoutId$); // re-render quando muda

  const allWorkouts = Object.values(workoutsMap ?? {}).filter((w) => !w.deleted);

  // Treino em andamento = derivado dos dados sincronizados (NÃO só do estado
  // em memória). Assim, mesmo se o app for fechado no meio do treino, ao
  // reabrir o "Retomar" aparece e nada se perde.
  const inProgress = allWorkouts
    .filter((w) => w.started_at && !w.ended_at)
    .sort((a, b) => (b.started_at ?? '').localeCompare(a.started_at ?? ''))[0];

  const recentWorkouts = allWorkouts
    .filter((w) => w.ended_at)
    .sort((a, b) => (b.started_at ?? '').localeCompare(a.started_at ?? ''))
    .slice(0, 5);

  const routineList = Object.values(routinesMap ?? {})
    .filter((r) => !r.deleted)
    .sort((a, b) => a.position - b.position);

  const resumeWorkout = (id: string) => {
    activeWorkoutId$.set(id);
    router.push(`/workout/${id}`);
  };

  const startFreeWorkout = () => {
    const id = newId();
    workouts$[id].set({
      id,
      name: 'Treino livre',
      routine_id: null,
      started_at: new Date().toISOString(),
      ended_at: null,
      notes: null,
    } as never);
    activeWorkoutId$.set(id);
    router.push(`/workout/${id}`);
  };

  const startRoutineWorkout = (routineId: string, routineName: string) => {
    const id = newId();
    workouts$[id].set({
      id,
      name: routineName,
      routine_id: routineId,
      started_at: new Date().toISOString(),
      ended_at: null,
      notes: null,
    } as never);
    activeWorkoutId$.set(id);
    router.push(`/workout/${id}`);
  };

  const formatDuration = (start: string | null, end: string | null) => {
    if (!start || !end) return '';
    const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
    if (mins < 60) return `${mins}min`;
    return `${Math.floor(mins / 60)}h${mins % 60 ? `${mins % 60}min` : ''}`;
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const displayName = (session?.user?.user_metadata?.display_name as string | undefined)?.trim();
  const firstName = displayName || session?.user?.email?.split('@')[0] || 'você';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="gap-5 p-5 pb-10">
        <View className="mb-1 flex-row items-center">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground">Olá, {firstName} 👋</Text>
            <Text className="mt-1 text-[15px] text-muted-foreground">Pronto para treinar?</Text>
          </View>
          <Button variant="ghost" size="icon" onPress={() => router.push('/settings')}>
            <Text className="text-[22px]">⚙️</Text>
          </Button>
        </View>

        {inProgress ? (
          <View className="gap-2.5">
            <Button
              className="h-auto flex-col rounded-2xl bg-[#2d7a3a] py-5 active:bg-[#256830]"
              onPress={() => resumeWorkout(inProgress.id)}>
              <Text className="text-lg font-bold text-white">
                ▶ Retomar: {inProgress.name ?? 'Treino'}
              </Text>
              <Text className="mt-1 text-xs text-[#cdebd3]">
                Treino em andamento — toque para continuar
              </Text>
            </Button>
            <Button
              variant="outline"
              className="h-auto rounded-xl py-3.5"
              onPress={startFreeWorkout}>
              <Text className="font-semibold text-muted-foreground">+ Novo treino livre</Text>
            </Button>
          </View>
        ) : (
          <Button className="h-auto rounded-2xl py-5" onPress={startFreeWorkout}>
            <Text className="text-lg font-bold text-primary-foreground">+ Iniciar treino livre</Text>
          </Button>
        )}

        {routineList.length > 0 && (
          <View className="gap-2.5">
            <Text className="mb-1 text-base font-semibold text-muted-foreground">Suas rotinas</Text>
            {routineList.map((r) => (
              <Button
                key={r.id}
                variant="outline"
                className="h-auto flex-row items-center justify-between gap-3 rounded-xl bg-card px-4 py-4"
                onPress={() => startRoutineWorkout(r.id, r.name)}>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">{r.name}</Text>
                  {r.notes ? (
                    <Text className="mt-0.5 text-[13px] text-muted-foreground">{r.notes}</Text>
                  ) : null}
                </View>
                <Text className="text-sm font-semibold text-primary">Iniciar →</Text>
              </Button>
            ))}
          </View>
        )}

        {recentWorkouts.length > 0 && (
          <View className="gap-2.5">
            <Text className="mb-1 text-base font-semibold text-muted-foreground">
              Últimos treinos
            </Text>
            {recentWorkouts.map((w) => (
              <Card
                key={w.id}
                className="flex-row items-center justify-between gap-0 rounded-xl px-4 py-4">
                <View>
                  <Text className="text-[15px] font-semibold text-foreground">
                    {w.name ?? 'Treino'}
                  </Text>
                  <Text className="mt-0.5 text-xs text-muted-foreground">
                    {formatDate(w.started_at)}
                  </Text>
                </View>
                <Text className="text-sm font-medium text-primary">
                  {formatDuration(w.started_at, w.ended_at)}
                </Text>
              </Card>
            ))}
          </View>
        )}

        {recentWorkouts.length === 0 && routineList.length === 0 && (
          <View className="items-center gap-2 py-10">
            <Text className="text-base font-medium text-muted-foreground">Nenhum treino ainda.</Text>
            <Text className="text-center text-sm text-muted-foreground/70">
              {'Toque em "Iniciar treino livre" para começar!'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
