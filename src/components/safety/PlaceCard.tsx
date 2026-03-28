import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { HavynColors } from '@/constants/havyn';
import { getCategoryLabel, RankedSafePlace } from '@/utils/map';

import { SurfaceCard } from './common';

type PlaceCardProps = {
  place: RankedSafePlace;
  onCall: () => void;
  onGuide: () => void;
  guidanceActive: boolean;
  callDisabled?: boolean;
};

export function PlaceCard({ place, onCall, onGuide, guidanceActive, callDisabled = false }: PlaceCardProps) {
  return (
    <View style={styles.wrapper}>
      <SurfaceCard style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>{place.name}</Text>
            <Text style={styles.category}>{getCategoryLabel(place.category)}</Text>
          </View>
          <View style={styles.badgeRow}>
            <Badge label={place.open24Hours ? '24/7' : place.isCurrentlyOpen ? 'Open now' : 'Closed'} tone={place.isCurrentlyOpen ? 'success' : 'muted'} />
          </View>
        </View>

        <View style={styles.metricRow}>
          <Metric icon="map-pin" text={place.distanceLabel} />
          <Metric icon="clock" text={place.walkTimeLabel} />
          {place.staffed ? <Metric icon="users" text="Staffed" /> : <Metric icon="user" text="Unstaffed" />}
        </View>

        <InfoRow label="Why recommended" value={place.whyRecommended} />
        <InfoRow label="Hours" value={place.openHours ?? (place.open24Hours ? '24/7' : 'Check local hours')} />
        {place.accessibility ? <InfoRow label="Accessibility" value={place.accessibility} /> : null}
        {place.phone ? <InfoRow label="Phone" value={place.phone} /> : null}

        <Text style={styles.description}>{place.description ?? 'Nearby place with visible staff and lighting.'}</Text>

        <View style={styles.buttonRow}>
          <Pressable
            accessibilityRole="button"
            disabled={callDisabled}
            onPress={onCall}
            style={[styles.callButton, callDisabled && styles.callButtonDisabled]}
          >
            <Feather color={callDisabled ? HavynColors.textSoft : HavynColors.text} name="phone" size={16} />
            <Text style={[styles.callButtonText, callDisabled && styles.callButtonTextDisabled]}>Call</Text>
          </Pressable>

          <Pressable accessibilityRole="button" onPress={onGuide} style={styles.guideButton}>
            <LinearGradient
              colors={[HavynColors.accent, HavynColors.accentDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.guideButtonGradient}
            >
              <Feather color={HavynColors.white} name={guidanceActive ? 'x-circle' : 'navigation'} size={16} />
              <Text style={styles.guideButtonText}>{guidanceActive ? 'End Guidance' : 'Guide Me'}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SurfaceCard>
    </View>
  );
}

function Metric({ icon, text }: { icon: keyof typeof Feather.glyphMap; text: string }) {
  return (
    <View style={styles.metric}>
      <Feather color={HavynColors.textMuted} name={icon} size={14} />
      <Text style={styles.metricText}>{text}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Badge({ label, tone }: { label: string; tone: 'success' | 'muted' }) {
  return (
    <View style={[styles.badge, tone === 'success' ? styles.badgeSuccess : styles.badgeMuted]}>
      <Text style={[styles.badgeText, tone === 'success' ? styles.badgeTextSuccess : styles.badgeTextMuted]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  card: {
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleWrap: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: HavynColors.text,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  category: {
    color: HavynColors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  badgeRow: {
    alignItems: 'flex-end',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  badgeSuccess: {
    backgroundColor: HavynColors.successBg,
  },
  badgeMuted: {
    backgroundColor: HavynColors.surfaceMuted,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeTextSuccess: {
    color: HavynColors.successText,
  },
  badgeTextMuted: {
    color: HavynColors.textMuted,
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: HavynColors.surfaceMuted,
  },
  metricText: {
    color: HavynColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    gap: 4,
  },
  infoLabel: {
    color: HavynColors.textSoft,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  infoValue: {
    color: HavynColors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  description: {
    color: HavynColors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 4,
  },
  callButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: HavynColors.border,
    backgroundColor: HavynColors.surfaceMuted,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  callButtonDisabled: {
    opacity: 0.55,
  },
  callButtonText: {
    color: HavynColors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  callButtonTextDisabled: {
    color: HavynColors.textSoft,
  },
  guideButton: {
    flex: 1.2,
    borderRadius: 20,
    overflow: 'hidden',
  },
  guideButtonGradient: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  guideButtonText: {
    color: HavynColors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
