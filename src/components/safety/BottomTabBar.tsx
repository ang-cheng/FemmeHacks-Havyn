import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

import { HavynColors, HavynRadius, HavynShadow } from '@/constants/havyn';
import { SafetyTab } from '@/data/safety';

type BottomTabBarProps = {
  activeTab: SafetyTab;
  onChange: (tab: SafetyTab) => void;
};

const tabs: Array<{ id: SafetyTab; label: string; icon: keyof typeof Feather.glyphMap }> = [
  { id: 'plan', label: 'Plan', icon: 'book-open' },
  { id: 'call', label: 'Call', icon: 'phone' },
  { id: 'map', label: 'Map', icon: 'map-pin' },
];

export function BottomTabBar({ activeTab, onChange }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.inner}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const isPrimary = tab.id === 'call';

          if (isPrimary && isActive) {
            return (
              <Pressable
                accessibilityRole="button"
                key={tab.id}
                onPress={() => onChange(tab.id)}
                style={styles.primaryTabHitbox}
              >
                <LinearGradient
                  colors={[HavynColors.accent, HavynColors.accentDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryTab}
                >
                  <Feather color={HavynColors.white} name={tab.icon} size={25} />
                  <Text style={styles.primaryTabLabel}>{tab.label}</Text>
                </LinearGradient>
              </Pressable>
            );
          }

          return (
            <Pressable
              accessibilityRole="button"
              key={tab.id}
              onPress={() => onChange(tab.id)}
              style={[styles.tab, isActive && styles.tabActive, isPrimary && styles.callTabIdle]}
            >
              <Feather
                color={isPrimary ? HavynColors.accent : isActive ? HavynColors.text : '#98A2B3'}
                name={tab.icon}
                size={23}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isPrimary ? styles.callTabLabelIdle : null,
                  isActive ? styles.tabLabelActive : null,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: HavynColors.surface,
    borderTopWidth: 1,
    borderTopColor: HavynColors.border,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  tab: {
    flex: 1,
    minHeight: 60,
    borderRadius: HavynRadius.control,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabActive: {
    backgroundColor: '#F4F6FB',
  },
  callTabIdle: {
    borderWidth: 1,
    borderColor: HavynColors.accentSoft,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#98A2B3',
  },
  tabLabelActive: {
    color: HavynColors.text,
  },
  callTabLabelIdle: {
    color: HavynColors.accent,
  },
  primaryTabHitbox: {
    flex: 1,
  },
  primaryTab: {
    minHeight: 60,
    borderRadius: HavynRadius.control,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    ...HavynShadow,
  },
  primaryTabLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: HavynColors.white,
  },
});
