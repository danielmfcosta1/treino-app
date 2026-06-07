import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { use$ } from '@legendapp/state/react';

import { addRestSeconds, restTimer$, stopRest } from '../state/restTimer';
import { useColors } from '../lib/theme';

/** Barra flutuante de descanso. Renderiza só quando há descanso ativo. */
export function RestTimerBar() {
  const c = useColors();
  const endsAt = use$(restTimer$.endsAt);
  const total = use$(restTimer$.total);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (endsAt == null) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [endsAt]);

  // Auto-para quando zera.
  useEffect(() => {
    if (endsAt != null && now >= endsAt) {
      stopRest();
    }
  }, [now, endsAt]);

  if (endsAt == null) return null;

  const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000));
  const mins = Math.floor(remaining / 60);
  const secs = (remaining % 60).toString().padStart(2, '0');
  const pct = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;

  // Pílula azul (c.accent) com texto branco — legível em dark e light.
  return (
    <View style={[styles.wrap, { backgroundColor: c.accent }]}>
      <View style={[styles.progress, { width: `${pct * 100}%` }]} />
      <View style={styles.content}>
        <TouchableOpacity style={styles.adj} onPress={() => addRestSeconds(-15)}>
          <Text style={styles.adjText}>−15s</Text>
        </TouchableOpacity>

        <View style={styles.center}>
          <Text style={styles.label}>Descanso</Text>
          <Text style={styles.time}>
            {mins}:{secs}
          </Text>
        </View>

        <TouchableOpacity style={styles.adj} onPress={() => addRestSeconds(15)}>
          <Text style={styles.adjText}>+15s</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skip} onPress={() => stopRest()}>
          <Text style={styles.skipText}>Pular</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  progress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  center: { flex: 1, alignItems: 'center' },
  label: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600' },
  time: { color: '#fff', fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'] },
  adj: { paddingHorizontal: 8, paddingVertical: 6 },
  adjText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  skip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  skipText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
