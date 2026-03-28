import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { HavynColors, HavynRadius, HavynShadow } from '@/constants/havyn';

type SurfaceCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
};

type SelectionCardProps = {
  title: string;
  description: string;
  selected?: boolean;
  onPress?: () => void;
  rightAccessory?: React.ReactNode;
};

type FilterChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

type StatusPillProps = {
  label: string;
  tone?: 'accent' | 'success' | 'muted';
};

type InitialAvatarProps = {
  initials: string;
  tone?: 'accent' | 'neutral';
};

type ToggleSwitchProps = {
  value: boolean;
  onValueChange: (nextValue: boolean) => void;
};

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function SurfaceCard({ children, style }: SurfaceCardProps) {
  return <View style={[styles.surfaceCard, style]}>{children}</View>;
}

export function SelectionCard({
  title,
  description,
  selected = false,
  onPress,
  rightAccessory,
}: SelectionCardProps) {
  return (
    <View style={[styles.selectionCard, selected && styles.selectionCardSelected]}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={styles.selectionCardMain}
      >
        <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
          {selected ? <View style={styles.radioInner} /> : null}
        </View>
        <View style={styles.selectionBody}>
          <Text style={styles.selectionTitle}>{title}</Text>
          <Text style={styles.selectionDescription}>{description}</Text>
        </View>
      </Pressable>
      {rightAccessory ? <View style={styles.selectionAccessory}>{rightAccessory}</View> : null}
    </View>
  );
}

export function FilterChip({ label, active, onPress }: FilterChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.filterChip, active && styles.filterChipActive]}
    >
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function StatusPill({ label, tone = 'muted' }: StatusPillProps) {
  const colors = useMemo(() => {
    switch (tone) {
      case 'accent':
        return {
          backgroundColor: HavynColors.accent,
          color: HavynColors.white,
        };
      case 'success':
        return {
          backgroundColor: HavynColors.successBg,
          color: HavynColors.successText,
        };
      default:
        return {
          backgroundColor: HavynColors.surfaceMuted,
          color: HavynColors.textMuted,
        };
    }
  }, [tone]);

  return (
    <View style={[styles.statusPill, { backgroundColor: colors.backgroundColor }]}>
      <Text style={[styles.statusPillText, { color: colors.color }]}>{label}</Text>
    </View>
  );
}

export function InitialAvatar({ initials, tone = 'accent' }: InitialAvatarProps) {
  return (
    <View style={[styles.initialAvatar, tone === 'accent' ? styles.initialAvatarAccent : null]}>
      <Text style={[styles.initialAvatarText, tone === 'accent' ? styles.initialAvatarTextAccent : null]}>
        {initials}
      </Text>
    </View>
  );
}

export function ToggleSwitch({ value, onValueChange }: ToggleSwitchProps) {
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: value ? 1 : 0,
      useNativeDriver: true,
      stiffness: 210,
      damping: 18,
      mass: 0.7,
    }).start();
  }, [progress, value]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      style={[styles.toggleTrack, value && styles.toggleTrackActive]}
    >
      <Animated.View style={[styles.toggleThumb, { transform: [{ translateX }] }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    backgroundColor: HavynColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: HavynColors.border,
  },
  headerTitle: {
    color: HavynColors.text,
    fontSize: 30,
    fontWeight: '600',
    letterSpacing: -0.6,
  },
  headerSubtitle: {
    marginTop: 8,
    color: HavynColors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  surfaceCard: {
    backgroundColor: HavynColors.surface,
    borderRadius: HavynRadius.card,
    paddingHorizontal: 20,
    paddingVertical: 22,
    borderWidth: 1,
    borderColor: HavynColors.border,
    ...HavynShadow,
  },
  selectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: HavynColors.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: HavynColors.surface,
  },
  selectionCardSelected: {
    borderColor: HavynColors.accent,
    backgroundColor: HavynColors.accentSoft,
  },
  selectionCardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: HavynColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    backgroundColor: HavynColors.surface,
  },
  radioOuterSelected: {
    borderColor: HavynColors.accent,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: HavynColors.accent,
  },
  selectionBody: {
    flex: 1,
    gap: 4,
  },
  selectionTitle: {
    color: HavynColors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  selectionDescription: {
    color: HavynColors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  selectionAccessory: {
    marginLeft: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: HavynRadius.chip,
    backgroundColor: HavynColors.surfaceMuted,
  },
  filterChipActive: {
    backgroundColor: HavynColors.accent,
  },
  filterChipText: {
    color: HavynColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: HavynColors.white,
  },
  statusPill: {
    borderRadius: HavynRadius.chip,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  initialAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HavynColors.surfaceMuted,
  },
  initialAvatarAccent: {
    backgroundColor: HavynColors.accentSoft,
  },
  initialAvatarText: {
    color: HavynColors.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  initialAvatarTextAccent: {
    color: HavynColors.accentDeep,
  },
  toggleTrack: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#CBD2DF',
    justifyContent: 'center',
  },
  toggleTrackActive: {
    backgroundColor: HavynColors.accent,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: HavynColors.white,
    shadowColor: HavynColors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 3,
  },
});
