import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Placeholder — a Fase 6 (inteligência) preenche esta tela com:
// gráficos de 1RM, sugestão de carga, estagnação/deload, streaks, heatmap.
export default function ProgressScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Progresso</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.icon}>📈</Text>
        <Text style={styles.text}>Em breve</Text>
        <Text style={styles.hint}>
          Gráficos de 1RM, evolução de carga, streaks e heatmap de grupos musculares.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f0f' },
  header: { padding: 20, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  icon: { fontSize: 48 },
  text: { fontSize: 20, fontWeight: '600', color: '#fff' },
  hint: { fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 22 },
});
