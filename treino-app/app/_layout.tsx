import '@/global.css';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { use$ } from '@legendapp/state/react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { authReady$, session$ } from '@/src/state/auth';

// Segura a splash até sabermos se há sessão — evita piscar a tela de login
// para quem já está logado.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const ready = use$(authReady$);
  const session = use$(session$);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
