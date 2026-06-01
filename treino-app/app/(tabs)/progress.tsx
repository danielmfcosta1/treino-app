import { useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-gifted-charts';
import { use$ } from '@legendapp/state/react';

import { workouts$, workoutExercises$, sets$, exercises$ } from '@/src/state/store';
import {
  buildExerciseHistory,
  completedWorkoutDates,
  computeAllRecords,
  muscleHeatmapForPeriod,
} from '@/src/domain/aggregate';
import { computeStreaks } from '@/src/domain/streaks';
import { oneRepMaxTrend } from '@/src/domain/progression';
import { rankMuscles } from '@/src/domain/heatmap';
import { muscleLabel } from '@/src/lib/muscles';

const SCREEN_W = Dimensions.get('window').width;
const EMPTY = {} as Record<string, never>; // ref estável p/ não bustar os useMemo

export default function ProgressScreen() {
  const workoutsMap = use$(workouts$) ?? EMPTY;
  const wxMap = use$(workoutExercises$) ?? EMPTY;
  const setsMap = use$(sets$) ?? EMPTY;
  const exercisesMap = use$(exercises$) ?? EMPTY;

  const today = new Date().toISOString().slice(0, 10);

  const streaks = useMemo(
    () => computeStreaks(completedWorkoutDates(workoutsMap), today),
    [workoutsMap, today],
  );

  const records = useMemo(
    () => computeAllRecords(workoutsMap, wxMap, setsMap),
    [workoutsMap, wxMap, setsMap],
  );

  const heatmap = useMemo(() => {
    const since = new Date(Date.now() - 28 * 86400000).toISOString();
    return rankMuscles(muscleHeatmapForPeriod(workoutsMap, wxMap, setsMap, exercisesMap, since));
  }, [workoutsMap, wxMap, setsMap, exercisesMap]);

  // Exercícios com >= 2 sessões → elegíveis para gráfico de 1RM.
  const chartable = useMemo(() => {
    return Object.values(exercisesMap)
      .filter((e): e is NonNullable<typeof e> => !!e && !e.deleted)
      .map((e) => ({
        id: e.id,
        name: e.name,
        trend: oneRepMaxTrend(buildExerciseHistory(e.id, workoutsMap, wxMap, setsMap)),
      }))
      .filter((x) => x.trend.length >= 2)
      .sort((a, b) => b.trend.length - a.trend.length);
  }, [exercisesMap, workoutsMap, wxMap, setsMap]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = chartable.find((c) => c.id === selectedId) ?? chartable[0] ?? null;

  const prList = useMemo(() => {
    return Object.entries(records)
      .map(([exId, rec]) => ({ name: exercisesMap[exId]?.name ?? '—', rec }))
      .filter((p) => p.rec.estimated_1rm > 0)
      .sort((a, b) => b.rec.estimated_1rm - a.rec.estimated_1rm)
      .slice(0, 10);
  }, [records, exercisesMap]);

  const maxHeat = heatmap.length > 0 ? heatmap[0].score : 1;

  const chartData = selected
    ? selected.trend.map((t) => ({
        value: Math.round(t.e1rm),
        label: new Date(t.performedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      }))
    : [];

  const hasAnyData = streaks.longest > 0 || prList.length > 0 || heatmap.length > 0;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Progresso</Text>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {!hasAnyData && (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📈</Text>
            <Text style={s.emptyText}>Sem dados ainda</Text>
            <Text style={s.emptyHint}>
              Finalize alguns treinos e seu progresso aparece aqui: 1RM, recordes, streaks e heatmap.
            </Text>
          </View>
        )}

        {/* Streaks */}
        {streaks.longest > 0 && (
          <View style={s.streakRow}>
            <View style={s.streakCard}>
              <Text style={s.streakNum}>🔥 {streaks.current}</Text>
              <Text style={s.streakLabel}>Sequência atual</Text>
            </View>
            <View style={s.streakCard}>
              <Text style={s.streakNum}>🏆 {streaks.longest}</Text>
              <Text style={s.streakLabel}>Maior sequência</Text>
            </View>
          </View>
        )}

        {/* Gráfico de 1RM */}
        {selected && chartData.length >= 2 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Evolução de força (1RM estimado)</Text>
            {chartable.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chips}>
                {chartable.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[s.chip, selected.id === c.id && s.chipActive]}
                    onPress={() => setSelectedId(c.id)}>
                    <Text style={[s.chipText, selected.id === c.id && s.chipTextActive]}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <View style={s.chartCard}>
              <Text style={s.chartEx}>{selected.name}</Text>
              <LineChart
                data={chartData}
                width={SCREEN_W - 96}
                height={180}
                color="#4f9cf9"
                thickness={3}
                dataPointsColor="#6fcf8e"
                textColor="#888"
                textFontSize={10}
                yAxisTextStyle={s.axisText}
                xAxisLabelTextStyle={s.axisText}
                yAxisColor="#2a2a2a"
                xAxisColor="#2a2a2a"
                rulesColor="#1e1e1e"
                curved
                hideRules={false}
                noOfSections={4}
              />
            </View>
          </View>
        )}

        {/* Heatmap muscular */}
        {heatmap.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Volume por grupo (últimas 4 semanas)</Text>
            <View style={s.card}>
              {heatmap.map((m) => (
                <View key={m.muscle} style={s.heatRow}>
                  <Text style={s.heatLabel}>{muscleLabel(m.muscle)}</Text>
                  <View style={s.heatBarBg}>
                    <View style={[s.heatBar, { width: `${(m.score / maxHeat) * 100}%` }]} />
                  </View>
                  <Text style={s.heatScore}>{m.score % 1 === 0 ? m.score : m.score.toFixed(1)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* PRs */}
        {prList.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Recordes pessoais</Text>
            <View style={s.card}>
              {prList.map((p, i) => (
                <View key={i} style={s.prRow}>
                  <Text style={s.prName} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <View style={s.prVals}>
                    <Text style={s.prWeight}>{p.rec.max_weight}kg</Text>
                    <Text style={s.prOrm}>1RM ~{Math.round(p.rec.estimated_1rm)}kg</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f0f' },
  header: { padding: 20, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff' },
  content: { padding: 20, paddingTop: 4, gap: 22, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12, paddingHorizontal: 20 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 20, fontWeight: '600', color: '#fff' },
  emptyHint: { fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 22 },
  streakRow: { flexDirection: 'row', gap: 12 },
  streakCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  streakNum: { fontSize: 26, fontWeight: '700', color: '#fff' },
  streakLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#aaa' },
  chips: { flexGrow: 0 },
  chip: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  chipActive: { backgroundColor: '#4f9cf9', borderColor: '#4f9cf9' },
  chipText: { color: '#888', fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  chartCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  chartEx: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 12 },
  axisText: { color: '#666', fontSize: 10 },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 12,
  },
  heatRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heatLabel: { color: '#bbb', fontSize: 13, width: 90 },
  heatBarBg: { flex: 1, height: 10, backgroundColor: '#222', borderRadius: 5, overflow: 'hidden' },
  heatBar: { height: 10, backgroundColor: '#4f9cf9', borderRadius: 5 },
  heatScore: { color: '#666', fontSize: 12, width: 32, textAlign: 'right' },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  prName: { color: '#fff', fontSize: 14, flex: 1 },
  prVals: { alignItems: 'flex-end' },
  prWeight: { color: '#4f9cf9', fontSize: 14, fontWeight: '600' },
  prOrm: { color: '#666', fontSize: 11 },
});
