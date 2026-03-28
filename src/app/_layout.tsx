// src/app/_layout.tsx
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CallProvider } from '@/context/call';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <CallProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
        </Stack>
      </CallProvider>
    </SafeAreaProvider>
  );
}
