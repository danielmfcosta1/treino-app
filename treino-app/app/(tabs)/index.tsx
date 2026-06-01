import { useState } from 'react';
import { Button, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { use$ } from '@legendapp/state/react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { exercises$ } from '@/src/state/store';
import { authReady$, session$, signIn, signOut } from '@/src/state/auth';
import { newId } from '@/src/lib/ids';

// Tela de prova de sync (Fase 0). Será substituída pela home real na Fase 3.
export default function SyncTestScreen() {
  const ready = use$(authReady$);
  const session = use$(session$);
  const exercises = use$(exercises$);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const rows = exercises ? Object.values(exercises) : [];

  const addExercise = () => {
    const id = newId();
    exercises$[id].set({
      id,
      name: `Teste ${new Date().toLocaleTimeString()}`,
      is_custom: true,
    } as never);
  };

  const handleSignIn = async () => {
    setError(null);
    const { error } = await signIn(email.trim(), password);
    if (error) setError(error.message);
  };

  if (!ready) {
    return (
      <SafeAreaView style={styles.center}>
        <ThemedText>Carregando…</ThemedText>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedText type="title">Login</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="senha"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
        <Button title="Entrar" onPress={handleSignIn} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ThemedText type="title">Prova de sync</ThemedText>
      <ThemedText>Logado: {session.user.email}</ThemedText>
      <View style={styles.row}>
        <Button title="+ Exercício" onPress={addExercise} />
        <Button title="Sair" onPress={signOut} />
      </View>
      <ThemedText type="subtitle">{rows.length} exercícios</ThemedText>
      <ScrollView style={styles.list}>
        {rows.map((ex: any) => (
          <ThemedView key={ex.id} style={styles.item}>
            <ThemedText>{ex.name}</ThemedText>
          </ThemedView>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  row: { flexDirection: 'row', gap: 12 },
  list: { flex: 1 },
  item: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  error: { color: '#e00' },
});
