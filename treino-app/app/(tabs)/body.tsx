import { useMemo, useState } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-gifted-charts';
import { use$ } from '@legendapp/state/react';

import { bodyMetrics$, cardioSessions$, exercises$ } from '@/src/state/store';
import { newId } from '@/src/lib/ids';
import type { BodyMetricRow, CardioSessionRow } from '@/src/domain/types';

const SCREEN_W = Dimensions.get('window').width;
const EMPTY = {} as Record<string, never>; // ref estável p/ não bustar os useMemo

export default function BodyScreen() {
  const metricsMap = use$(bodyMetrics$) ?? EMPTY;
  const cardioMap = use$(cardioSessions$) ?? EMPTY;
  const exercisesMap = use$(exercises$) ?? EMPTY;

  const [showMetric, setShowMetric] = useState(false);
  const [showCardio, setShowCardio] = useState(false);

  const metrics = useMemo(
    () =>
      Object.values(metricsMap)
        .filter((m): m is BodyMetricRow => !!m && !m.deleted)
        .sort((a, b) => b.measured_at.localeCompare(a.measured_at)),
    [metricsMap],
  );

  const cardio = useMemo(
    () =>
      Object.values(cardioMap)
        .filter((c): c is CardioSessionRow => !!c && !c.deleted)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 10),
    [cardioMap],
  );

  // Gráfico de peso (cronológico).
  const weightData = useMemo(
    () =>
      metrics
        .filter((m) => m.weight != null)
        .slice()
        .reverse()
        .map((m) => ({
          value: m.weight as number,
          label: new Date(m.measured_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        })),
    [metrics],
  );

  const exName = (id: string | null) => (id ? exercisesMap[id]?.name ?? 'Cardio' : 'Cardio');

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <SafeAreaView style={st.safe}>
      <View style={st.header}>
        <Text style={st.title}>Corpo</Text>
      </View>

      <ScrollView contentContainerStyle={st.content}>
        {/* Peso / medidas */}
        <View style={st.section}>
          <View style={st.sectionHead}>
            <Text style={st.sectionTitle}>Peso & medidas</Text>
            <TouchableOpacity style={st.addBtn} onPress={() => setShowMetric(true)}>
              <Text style={st.addBtnText}>+ Registrar</Text>
            </TouchableOpacity>
          </View>

          {weightData.length >= 2 && (
            <View style={st.chartCard}>
              <LineChart
                data={weightData}
                width={SCREEN_W - 96}
                height={160}
                color="#6fcf8e"
                thickness={3}
                dataPointsColor="#6fcf8e"
                yAxisTextStyle={st.axisText}
                xAxisLabelTextStyle={st.axisText}
                yAxisColor="#2a2a2a"
                xAxisColor="#2a2a2a"
                rulesColor="#1e1e1e"
                curved
                noOfSections={4}
              />
            </View>
          )}

          {metrics.length === 0 ? (
            <Text style={st.empty}>Nenhuma medida registrada.</Text>
          ) : (
            metrics.slice(0, 8).map((m) => (
              <View key={m.id} style={st.row}>
                <Text style={st.rowDate}>{fmtDate(m.measured_at)}</Text>
                <View style={st.rowVals}>
                  {m.weight != null ? <Text style={st.rowMain}>{m.weight} kg</Text> : null}
                  {m.body_fat != null ? <Text style={st.rowSub}>{m.body_fat}% gordura</Text> : null}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Cardio */}
        <View style={st.section}>
          <View style={st.sectionHead}>
            <Text style={st.sectionTitle}>Cardio</Text>
            <TouchableOpacity style={st.addBtn} onPress={() => setShowCardio(true)}>
              <Text style={st.addBtnText}>+ Registrar</Text>
            </TouchableOpacity>
          </View>
          {cardio.length === 0 ? (
            <Text style={st.empty}>Nenhuma sessão de cardio.</Text>
          ) : (
            cardio.map((c) => (
              <View key={c.id} style={st.row}>
                <View style={{ flex: 1 }}>
                  <Text style={st.rowMain}>{exName(c.exercise_id)}</Text>
                  <Text style={st.rowDate}>{fmtDate(c.created_at)}</Text>
                </View>
                <View style={st.rowVals}>
                  {c.duration_seconds ? (
                    <Text style={st.rowSub}>{Math.round(c.duration_seconds / 60)} min</Text>
                  ) : null}
                  {c.distance_meters ? (
                    <Text style={st.rowSub}>{(c.distance_meters / 1000).toFixed(2)} km</Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <MetricModal visible={showMetric} onClose={() => setShowMetric(false)} />
      <CardioModal visible={showCardio} onClose={() => setShowCardio(false)} exercisesMap={exercisesMap} />
    </SafeAreaView>
  );
}

// ---------- modal de medida ----------

function MetricModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');

  const num = (s: string) => {
    const n = parseFloat(s.replace(',', '.'));
    return isNaN(n) ? null : n;
  };

  const save = () => {
    const w = num(weight);
    const bf = num(bodyFat);
    if (w == null && bf == null) return;
    const id = newId();
    bodyMetrics$[id].set({
      id,
      weight: w,
      body_fat: bf,
      measured_at: new Date().toISOString(),
      measurements: null,
      notes: null,
    } as never);
    setWeight('');
    setBodyFat('');
    onClose();
  };

  return (
    <FormModal visible={visible} onClose={onClose} title="Registrar medida" onSave={save} canSave={!!weight || !!bodyFat}>
      <Field label="Peso (kg)" value={weight} onChange={setWeight} placeholder="75.5" />
      <Field label="% Gordura (opcional)" value={bodyFat} onChange={setBodyFat} placeholder="15" />
    </FormModal>
  );
}

// ---------- modal de cardio ----------

function CardioModal({
  visible,
  onClose,
  exercisesMap,
}: {
  visible: boolean;
  onClose: () => void;
  exercisesMap: Record<string, { id: string; name: string; category: string | null; deleted: boolean } | undefined>;
}) {
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [minutes, setMinutes] = useState('');
  const [km, setKm] = useState('');

  const cardioExercises = Object.values(exercisesMap).filter(
    (e): e is NonNullable<typeof e> => !!e && !e.deleted && e.category === 'cardio',
  );

  const num = (s: string) => {
    const n = parseFloat(s.replace(',', '.'));
    return isNaN(n) ? null : n;
  };

  const save = () => {
    const mins = num(minutes);
    const dist = num(km);
    if (mins == null && dist == null) return;
    const id = newId();
    cardioSessions$[id].set({
      id,
      exercise_id: exerciseId,
      workout_id: null,
      duration_seconds: mins != null ? Math.round(mins * 60) : null,
      distance_meters: dist != null ? Math.round(dist * 1000) : null,
      avg_heart_rate: null,
      max_heart_rate: null,
      notes: null,
    } as never);
    setMinutes('');
    setKm('');
    setExerciseId(null);
    onClose();
  };

  return (
    <FormModal visible={visible} onClose={onClose} title="Registrar cardio" onSave={save} canSave={!!minutes || !!km}>
      <Text style={fm.fieldLabel}>Tipo</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
        {cardioExercises.map((e) => (
          <TouchableOpacity
            key={e.id}
            style={[fm.chip, exerciseId === e.id && fm.chipActive]}
            onPress={() => setExerciseId(e.id)}>
            <Text style={[fm.chipText, exerciseId === e.id && fm.chipTextActive]}>{e.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Field label="Duração (min)" value={minutes} onChange={setMinutes} placeholder="30" />
      <Field label="Distância (km, opcional)" value={km} onChange={setKm} placeholder="5" />
    </FormModal>
  );
}

// ---------- componentes de form compartilhados ----------

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={fm.fieldLabel}>{label}</Text>
      <TextInput
        style={fm.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#444"
        keyboardType="decimal-pad"
      />
    </View>
  );
}

function FormModal({
  visible,
  onClose,
  title,
  onSave,
  canSave,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  onSave: () => void;
  canSave: boolean;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={fm.modal}>
        <View style={fm.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={fm.cancel}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={fm.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onSave} disabled={!canSave}>
            <Text style={[fm.save, !canSave && fm.saveDisabled]}>Salvar</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={fm.modalBody}>{children}</ScrollView>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f0f' },
  header: { padding: 20, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff' },
  content: { padding: 20, paddingTop: 4, gap: 24, paddingBottom: 40 },
  section: { gap: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#aaa' },
  addBtn: { backgroundColor: '#1f3a52', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnText: { color: '#7fb3e0', fontSize: 13, fontWeight: '600' },
  chartCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  axisText: { color: '#666', fontSize: 10 },
  empty: { color: '#555', fontSize: 14, paddingVertical: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  rowDate: { color: '#666', fontSize: 12 },
  rowVals: { alignItems: 'flex-end' },
  rowMain: { color: '#fff', fontSize: 15, fontWeight: '600' },
  rowSub: { color: '#888', fontSize: 13 },
});

const fm = StyleSheet.create({
  modal: { flex: 1, backgroundColor: '#111' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#fff' },
  cancel: { fontSize: 16, color: '#888' },
  save: { fontSize: 16, color: '#4f9cf9', fontWeight: '600' },
  saveDisabled: { color: '#333' },
  modalBody: { padding: 20, gap: 16 },
  fieldLabel: { color: '#888', fontSize: 13 },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
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
});
