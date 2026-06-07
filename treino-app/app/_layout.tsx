import '@/global.css';

import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colorScheme } from 'nativewind';
import { use$ } from '@legendapp/state/react';

import { authReady$, session$ } from '@/src/state/auth';

// App é dark-only: as telas fixas usam #0f0f0f e o tema dark do NativeWind foi
// feito pra casar. Forçamos dark independente do modo do sistema, senão a Home
// (NativeWind) viraria branca em iPhone no modo claro.
colorScheme.set('dark');

// Segura a splash até sabermos se há sessão — evita piscar a tela de login
// para quem já está logado.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const ready = use$(authReady$);
  const session = use$(session$);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={DarkTheme}>
        <Stack>
        {/* Rotas autenticadas: visíveis só com sessão. O expo-router troca o
            grupo de forma declarativa quando `session` muda (login/logout),
            sem navegação imperativa — evita o crash "navigate before mounting". */}
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="workout/[id]"
            options={{ presentation: 'fullScreenModal', headerShown: false }}
          />
          <Stack.Screen
            name="exercises/picker"
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen name="settings" options={{ presentation: 'modal', headerShown: false }} />
        </Stack.Protected>

        {/* Rota de login: visível só sem sessão. */}
        <Stack.Protected guard={!session}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
