import { Tabs } from 'expo-router';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/src/lib/theme';

export default function TabLayout() {
  const c = useColors();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: { backgroundColor: c.tabBar, borderTopColor: c.tabBorder },
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.textFaint,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          title: 'Rotinas',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="list.bullet.clipboard.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Histórico',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="clock.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="body"
        options={{
          title: 'Corpo',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="figure.walk" color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progresso',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="chart.line.uptrend.xyaxis" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
