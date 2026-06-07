import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { use$ } from '@legendapp/state/react';

import { signOut, session$ } from '@/src/state/auth';
import { defaultRestSeconds$ } from '@/src/state/restTimer';
import { appearance$, setAppearance, type AppearancePref } from '@/src/state/appearance';
import {
  ageFromISO,
  brToISO,
  isoToBR,
  maskBR,
  readProfile,
  updateProfile,
} from '@/src/state/profile';
import { useColors, type ThemeColors } from '@/src/lib/theme';
import {
  workouts$,
  workoutExercises$,
  sets$,
  exercises$,
  cardioSessions$,
  bodyMetrics$,
} from '@/src/state/store';
import {
  backupToJSON,
  buildBackup,
  buildSetsCSV,
  flattenSets,
  type BackupData,
} from '@/src/lib/exportData';
import { shareTextFile } from '@/src/lib/share';

const REST_PRESETS = [60, 90, 120, 180];
const APPEARANCE_OPTS: { key: AppearancePref; label: string }[] = [
  { key: 'system', label: 'Sistema' },
  { key: 'light', label: 'Claro' },
  { key: 'dark', label: 'Escuro' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const c = useColors();
  const s = makeStyles(c);
  const session = use$(session$);
  const restSecs = use$(defaultRestSeconds$);
  const appearance = use$(appearance$);
  const [busy, setBusy] = useState(false);

  // Perfil (nome + nascimento) — semeado do user_metadata, salvo sob demanda.
  const profile = readProfile(session);
  const [name, setName] = useState(profile.displayName);
  const [birth, setBirth] = useState(isoToBR(profile.birthDate));
  const [savingProfile, setSavingProfile] = useState(false);
  useEffect(() => {
    setName(profile.displayName);
    setBirth(isoToBR(profile.birthDate));
  }, [profile.displayName, profile.birthDate]);

  const dirty = name !== profile.displayName || birth !== isoToBR(profile.birthDate);
  const birthInvalid = birth.length > 0 && brToISO(birth) === null;
  const age = ageFromISO(brToISO(birth));

  const saveProfile = async () => {
    if (birthInvalid) {
      Alert.alert('Data inválida', 'Use o formato DD/MM/AAAA.');
      return;
    }
    setSavingProfile(true);
    const err = await updateProfile({ displayName: name, birthDate: brToISO(birth) });
    setSavingProfile(false);
    if (err) Alert.alert('Erro', err);
  };

  const activeArr = <T extends { deleted: boolean }>(m: Record<string, T | undefined>): T[] =>
    Object.values(m).filter((x): x is T => !!x && !x.deleted);

  const exportJSON = async () => {
    setBusy(true);
    try {
      const data: BackupData = {
        exercises: activeArr(exercises$.get() ?? {}),
        workouts: activeArr(workouts$.get() ?? {}),
        workoutExercises: activeArr(workoutExercises$.get() ?? {}),
        sets: activeArr(sets$.get() ?? {}),
        cardioSessions: activeArr(cardioSessions$.get() ?? {}),
        bodyMetrics: activeArr(bodyMetrics$.get() ?? {}),
      };
      const json = backupToJSON(buildBackup(data, new Date().toISOString()));
      const ok = await shareTextFile('treino-backup.json', json, 'application/json');
      if (!ok) Alert.alert('Indisponível', 'Compartilhamento não disponível neste dispositivo.');
    } catch (e) {
      Alert.alert('Erro', String(e));
    } finally {
      setBusy(false);
    }
  };

  const exportCSV = async () => {
    setBusy(true);
    try {
      const flat = flattenSets(
        workouts$.get() ?? {},
        workoutExercises$.get() ?? {},
        sets$.get() ?? {},
        exercises$.get() ?? {},
      );
      const csv = buildSetsCSV(flat);
      const ok = await shareTextFile('treino-series.csv', csv, 'text/csv');
      if (!ok) Alert.alert('Indisponível', 'Compartilhamento não disponível neste dispositivo.');
    } catch (e) {
      Alert.alert('Erro', String(e));
    } finally {
      setBusy(false);
    }
  };

  const confirmSignOut = () => {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.topBar}>
        <Text style={s.title}>Configurações</Text>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={s.closeBtn}>
          <Text style={s.closeText}>Fechar</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.content}>
        {/* Perfil */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Perfil</Text>
          <View style={s.card}>
            <Text style={s.fieldLabel}>Nome (como o app te chama)</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="Seu nome"
              placeholderTextColor={c.textFaint}
              autoCapitalize="words"
            />

            <Text style={[s.fieldLabel, { marginTop: 14 }]}>Data de nascimento</Text>
            <TextInput
              style={[s.input, birthInvalid && s.inputError]}
              value={birth}
              onChangeText={(t) => setBirth(maskBR(t))}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={c.textFaint}
              keyboardType="number-pad"
              maxLength={10}
            />
            {birthInvalid ? (
              <Text style={s.hintError}>Data inválida — use DD/MM/AAAA.</Text>
            ) : age != null ? (
              <Text style={s.hint}>{age} anos</Text>
            ) : null}

            {dirty ? (
              <TouchableOpacity
                style={[s.saveBtn, savingProfile && { opacity: 0.6 }]}
                onPress={saveProfile}
                disabled={savingProfile}>
                {savingProfile ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.saveBtnText}>Salvar perfil</Text>
                )}
              </TouchableOpacity>
            ) : null}

            <Text style={[s.label, { marginTop: 14 }]}>Logado como</Text>
            <Text style={s.value}>{session?.user?.email ?? '—'}</Text>
          </View>
        </View>

        {/* Aparência */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Aparência</Text>
          <View style={s.presetRow}>
            {APPEARANCE_OPTS.map((o) => (
              <TouchableOpacity
                key={o.key}
                style={[s.preset, appearance === o.key && s.presetActive]}
                onPress={() => setAppearance(o.key)}>
                <Text style={[s.presetText, appearance === o.key && s.presetTextActive]}>
                  {o.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Descanso padrão */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Descanso padrão entre séries</Text>
          <View style={s.presetRow}>
            {REST_PRESETS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[s.preset, restSecs === p && s.presetActive]}
                onPress={() => defaultRestSeconds$.set(p)}>
                <Text style={[s.presetText, restSecs === p && s.presetTextActive]}>
                  {p < 120 ? `${p}s` : `${p / 60}min`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Backup */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Backup / Exportar</Text>
          <TouchableOpacity style={s.actionBtn} onPress={exportJSON} disabled={busy}>
            <Text style={s.actionText}>📦 Exportar tudo (JSON)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn} onPress={exportCSV} disabled={busy}>
            <Text style={s.actionText}>📊 Exportar séries (CSV)</Text>
          </TouchableOpacity>
        </View>

        {/* Sair */}
        <TouchableOpacity style={s.signOut} onPress={confirmSignOut}>
          <Text style={s.signOutText}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 4,
    },
    closeBtn: { paddingVertical: 6, paddingHorizontal: 8 },
    closeText: { color: c.accent, fontSize: 16, fontWeight: '600' },
    content: { padding: 20, paddingTop: 8, gap: 24, paddingBottom: 40 },
    title: { fontSize: 28, fontWeight: '700', color: c.text },
    section: { gap: 10 },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: c.textDim,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    label: { color: c.textFaint, fontSize: 12 },
    value: { color: c.text, fontSize: 16, marginTop: 4 },
    fieldLabel: { color: c.textDim, fontSize: 13, marginBottom: 6 },
    input: {
      backgroundColor: c.inputBg,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: c.text,
      borderWidth: 1,
      borderColor: c.border,
    },
    inputError: { borderColor: c.danger },
    hint: { color: c.textDim, fontSize: 12, marginTop: 6 },
    hintError: { color: c.danger, fontSize: 12, marginTop: 6 },
    saveBtn: {
      backgroundColor: c.accent,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 14,
    },
    saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    presetRow: { flexDirection: 'row', gap: 10 },
    preset: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    presetActive: { backgroundColor: c.accent, borderColor: c.accent },
    presetText: { color: c.textDim, fontSize: 15, fontWeight: '600' },
    presetTextActive: { color: '#fff' },
    actionBtn: {
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    actionText: { color: c.accent, fontSize: 15, fontWeight: '600' },
    signOut: {
      backgroundColor: c.dangerBg,
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.danger,
      marginTop: 8,
    },
    signOutText: { color: c.danger, fontSize: 16, fontWeight: '600' },
  });
