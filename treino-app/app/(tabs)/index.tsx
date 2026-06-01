import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { use$ } from '@legendapp/state/react';

import { workouts$, routines$ } from '@/src/state/store';
import { session$ } from '@/src/state/auth';
import { activeWorkoutId$ } from '@/src/state/workout';
import { newId } from '@/src/lib/ids';

export default function HomeScreen() {
  const router = useRouter();
  const session = use$(session$);
  const workoutsMap = use$(workouts$);
  const routinesMap = use$(routines$);
  const activeId = use$(activeWorkoutId$);

  const recentWorkouts = Object.values(workoutsMap ?? {})
    .filter((w) => !w.deleted && w.ended_at)
    .sort((a, b) => (b.started_at ?? '').localeCompare(a.started_at ?? ''))
    .slice(0, 5);

  const routineList = Object.values(routinesMap ?? {})
    .filter((r) => !r.deleted)
    .sort((a, b) => a.position - b.position);

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

  const firstName = session?.user?.email?.split('@')[0] ?? 'você';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Olá, {firstName} 👋</Text>
          <Text style={styles.sub}>Pronto para treinar?</Text>
        </View>

        {activeId ? (
          <TouchableOpacity
            style={[styles.primaryBtn, styles.resumeBtn]}
            onPress={() => router.push(`/workout/${activeId}`)}>
            <Text style={styles.primaryBtnText}>▶ Retomar treino em andamento</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.primaryBtn} onPress={startFreeWorkout}>
            <Text style={styles.primaryBtnText}>+ Iniciar treino livre</Text>
          </TouchableOpacity>
        )}

        {routineList.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suas rotinas</Text>
            {routineList.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={styles.routineCard}
                onPress={() => startRoutineWorkout(r.id, r.name)}
                disabled={!!activeId}>
                <View style={styles.routineInfo}>
                  <Text style={styles.routineName}>{r.name}</Text>
                  {r.notes ? <Text style={styles.routineNotes}>{r.notes}</Text> : null}
                </View>
                <Text style={styles.routineStart}>Iniciar →</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {recentWorkouts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Últimos treinos</Text>
            {recentWorkouts.map((w) => (
              <View key={w.id} style={styles.historyCard}>
                <View>
                  <Text style={styles.historyName}>{w.name ?? 'Treino'}</Text>
                  <Text style={styles.historyMeta}>{formatDate(w.started_at)}</Text>
                </View>
                <Text style={styles.historyDuration}>
                  {formatDuration(w.started_at, w.ended_at)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {recentWorkouts.length === 0 && routineList.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhum treino ainda.</Text>
            <Text style={styles.emptyHint}>{'Toque em "Iniciar treino livre" para começar!'}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f0f' },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40, gap: 20 },
  header: { marginBottom: 4 },
  greeting: { fontSize: 24, fontWeight: '700', color: '#fff' },
  sub: { fontSize: 15, color: '#888', marginTop: 4 },
  primaryBtn: { backgroundColor: '#4f9cf9', borderRadius: 16, padding: 20, alignItems: 'center' },
  resumeBtn: { backgroundColor: '#2d7a3a' },
  primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#aaa', marginBottom: 4 },
  routineCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  routineInfo: { flex: 1 },
  routineName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  routineNotes: { fontSize: 13, color: '#666', marginTop: 2 },
  routineStart: { color: '#4f9cf9', fontSize: 14, fontWeight: '600' },
  historyCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  historyName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  historyMeta: { fontSize: 12, color: '#666', marginTop: 2 },
  historyDuration: { fontSize: 14, color: '#4f9cf9', fontWeight: '500' },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 16, color: '#555', fontWeight: '500' },
  emptyHint: { fontSize: 14, color: '#444', textAlign: 'center' },
});
