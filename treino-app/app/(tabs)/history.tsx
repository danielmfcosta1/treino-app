import { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { use$ } from '@legendapp/state/react';

import { workouts$, workoutExercises$, sets$, exercises$ } from '@/src/state/store';

export default function HistoryScreen() {
  const workoutsMap = use$(workouts$);
  const wxMap = use$(workoutExercises$);
  const setsMap = use$(sets$);
  const exercisesMap = use$(exercises$);
  const [expanded, setExpanded] = useState<string | null>(null);

  const completed = Object.values(workoutsMap ?? {})
    .filter((w) => !w.deleted && w.ended_at)
    .sort((a, b) => (b.started_at ?? '').localeCompare(a.started_at ?? ''));

  const wxForWorkout = (workoutId: string) =>
    Object.values(wxMap ?? {})
      .filter((wx) => wx.workout_id === workoutId && !wx.deleted)
      .sort((a, b) => a.position - b.position);

  const setsForWx = (wxId: string) =>
    Object.values(setsMap ?? {})
      .filter((s) => s.workout_exercise_id === wxId && !s.deleted && s.is_completed)
      .sort((a, b) => a.position - b.position);

  const exName = (exId: string) =>
    exercisesMap?.[exId]?.name ?? 'Exercício';

  const formatDate = (iso: string | null) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const formatDuration = (start: string | null, end: string | null) => {
    if (!start || !end) return '';
    const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
    if (mins < 60) return `${mins}min`;
    return `${Math.floor(mins / 60)}h${mins % 60 ? `${mins % 60}min` : ''}`;
  };

  const totalSets = (workoutId: string) => {
    const wxIds = wxForWorkout(workoutId).map((wx) => wx.id);
    return wxIds.reduce((n, id) => n + setsForWx(id).length, 0);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Histórico</Text>
      </View>
      <FlatList
        data={completed}
        keyExtractor={(w) => w.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhum treino finalizado ainda.</Text>
          </View>
        }
        renderItem={({ item: w }) => {
          const isOpen = expanded === w.id;
          const wxList = wxForWorkout(w.id);
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => setExpanded(isOpen ? null : w.id)}
              activeOpacity={0.8}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{w.name ?? 'Treino'}</Text>
                  <Text style={styles.cardDate}>{formatDate(w.started_at)}</Text>
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.cardDuration}>{formatDuration(w.started_at, w.ended_at)}</Text>
                  <Text style={styles.cardSets}>{totalSets(w.id)} séries</Text>
                </View>
                <Text style={styles.chevron}>{isOpen ? '▲' : '▼'}</Text>
              </View>

              {isOpen && (
                <View style={styles.cardDetail}>
                  {wxList.map((wx) => {
                    const setList = setsForWx(wx.id);
                    if (setList.length === 0) return null;
                    return (
                      <View key={wx.id} style={styles.exBlock}>
                        <Text style={styles.exName}>{exName(wx.exercise_id)}</Text>
                        {setList.map((s, i) => (
                          <Text key={s.id} style={styles.setLine}>
                            {i + 1}. {s.weight ? `${s.weight}kg` : '—'} × {s.reps ?? '?'} reps
                            {s.rpe ? `  RPE ${s.rpe}` : ''}
                            {s.rir != null ? `  RIR ${s.rir}` : ''}
                          </Text>
                        ))}
                      </View>
                    );
                  })}
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f0f' },
  header: { padding: 20, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff' },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  cardName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  cardDate: { fontSize: 12, color: '#666', marginTop: 2, textTransform: 'capitalize' },
  cardRight: { alignItems: 'flex-end', marginRight: 12 },
  cardDuration: { fontSize: 14, color: '#4f9cf9', fontWeight: '500' },
  cardSets: { fontSize: 12, color: '#555', marginTop: 2 },
  chevron: { color: '#444', fontSize: 12 },
  cardDetail: { marginTop: 14, gap: 12, borderTopWidth: 1, borderTopColor: '#2a2a2a', paddingTop: 14 },
  exBlock: { gap: 4 },
  exName: { fontSize: 13, fontWeight: '600', color: '#aaa', marginBottom: 2 },
  setLine: { fontSize: 13, color: '#777', paddingLeft: 8 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 15, color: '#444' },
});
