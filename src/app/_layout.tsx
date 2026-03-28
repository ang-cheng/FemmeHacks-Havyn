// src/app/_layout.tsx
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CallProvider } from '@/context/call';
import { SafetyPlanProvider } from '@/context/SafetyPlanContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <CallProvider>
        <SafetyPlanProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="script-preview" />
          </Stack>
        </SafetyPlanProvider>
      </CallProvider>
    </SafeAreaProvider>
  );
}
