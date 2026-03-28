import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { HavynColors, HavynShadow } from '@/constants/havyn';

type GuideModeBannerProps = {
  destinationName: string;
  distanceLabel: string;
  walkTimeLabel: string;
  directionLabel: string;
  bearingDegrees: number;
  usingFallbackOrigin: boolean;
  onEnd: () => void;
};

export function GuideModeBanner({
  destinationName,
  distanceLabel,
  walkTimeLabel,
  directionLabel,
  bearingDegrees,
  usingFallbackOrigin,
  onEnd,
}: GuideModeBannerProps) {
  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={['#FFF4F1', '#FFF9F8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <View style={styles.headerRow}>
          <View style={styles.badge}>
            <Feather color={HavynColors.accent} name="navigation" size={14} />
            <Text style={styles.badgeText}>Guide Me Active</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={onEnd} style={styles.endButton}>
            <Text style={styles.endButtonText}>End Guidance</Text>
          </Pressable>
        </View>

        <View style={styles.contentRow}>
          <View style={styles.arrowWrap}>
            <Feather
              color={HavynColors.accent}
              name="navigation"
              size={24}
              style={{ transform: [{ rotate: `${bearingDegrees}deg` }] }}
            />
          </View>
          <View style={styles.contentBody}>
            <Text style={styles.headingText}>Head {directionLabel} toward {destinationName}</Text>
            <Text style={styles.metricsText}>{distanceLabel} remaining · {walkTimeLabel}</Text>
            {usingFallbackOrigin ? (
              <Text style={styles.demoNote}>Using a Penn campus demo start point because live location is unavailable.</Text>
            ) : null}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  banner: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#FFD9D2',
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 14,
    ...HavynShadow,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFE6E3',
  },
  badgeText: {
    color: HavynColors.accentDeep,
    fontSize: 12,
    fontWeight: '700',
  },
  endButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  endButtonText: {
    color: HavynColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  arrowWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HavynColors.white,
  },
  contentBody: {
    flex: 1,
    gap: 4,
  },
  headingText: {
    color: HavynColors.text,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  metricsText: {
    color: HavynColors.accentDeep,
    fontSize: 14,
    fontWeight: '600',
  },
  demoNote: {
    color: HavynColors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
});
