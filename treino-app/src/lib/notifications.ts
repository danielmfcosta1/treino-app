import * as Notifications from 'expo-notifications';

// Mostra o alerta mesmo com o app em primeiro plano (senão a notificação só
// apareceria com o app em background). API nova do expo-notifications SDK 54.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: false,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let permissionAsked = false;

/** Pede permissão de notificação uma vez. Retorna true se concedida. */
export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (permissionAsked && !current.canAskAgain) return false;
  permissionAsked = true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

/** Agenda uma notificação local após `seconds`. Retorna o id (ou null). */
export async function scheduleInSeconds(
  seconds: number,
  title: string,
  body: string,
): Promise<string | null> {
  const ok = await ensureNotificationPermission();
  if (!ok) return null;
  return Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, Math.round(seconds)),
    },
  });
}

export async function cancelScheduled(id: string | null): Promise<void> {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // já disparou ou não existe — ignorar
  }
}
