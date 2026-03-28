import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { HavynColors } from '@/constants/havyn';
import { useCall } from '@/context/call';
import { SafetyTab } from '@/data/safety';

import { BottomTabBar } from '@/components/safety/BottomTabBar';
import { CallScreen } from '@/components/safety/CallScreen';
import { EmergencyCallOverlay } from '@/components/safety/EmergencyCallOverlay';
import { MapScreen } from '@/components/safety/MapScreen';
import { PlanScreen } from '@/components/safety/PlanScreen';

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<SafetyTab>('call');
  const { isCallActive } = useCall();

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.phoneFrame}>
        <View style={styles.content}>
          {activeTab === 'plan' ? <PlanScreen /> : null}
          {activeTab === 'call' ? <CallScreen onOpenMap={() => setActiveTab('map')} /> : null}
          {activeTab === 'map' ? <MapScreen /> : null}
        </View>
        <BottomTabBar activeTab={activeTab} onChange={setActiveTab} />
        {isCallActive ? (
          <EmergencyCallOverlay
            isMapVisible={activeTab === 'map'}
            onExpandCall={() => setActiveTab('call')}
            onMinimizeToMap={() => setActiveTab('map')}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: HavynColors.surface,
  },
  phoneFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: HavynColors.surface,
  },
  content: {
    flex: 1,
    backgroundColor: HavynColors.background,
  },
});
