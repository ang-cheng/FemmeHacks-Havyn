import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HavynColors } from '@/constants/havyn';
import { getCategoryLabel, RankedSafePlace } from '@/utils/map';

import { SurfaceCard } from './common';

type PlaceListProps = {
  places: RankedSafePlace[];
  selectedPlaceId: string | null;
  guidancePlaceId: string | null;
  onSelect: (placeId: string) => void;
};

export function PlaceList({ places, selectedPlaceId, guidancePlaceId, onSelect }: PlaceListProps) {
  return (
    <View style={styles.wrapper}>
      <SurfaceCard>
        <Text style={styles.title}>Nearby matches</Text>
        <View style={styles.listStack}>
          {places.map((place, index) => {
            const isSelected = place.id === selectedPlaceId;
            const isGuiding = place.id === guidancePlaceId;

            return (
              <Pressable
                accessibilityRole="button"
                key={place.id}
                onPress={() => onSelect(place.id)}
                style={[styles.row, isSelected && styles.rowSelected]}
              >
                <View style={styles.rankBadge}>
                  <Text style={styles.rankBadgeText}>{index + 1}</Text>
                </View>

                <View style={styles.body}>
                  <View style={styles.titleRow}>
                    <Text style={styles.placeTitle}>{place.name}</Text>
                    {isGuiding ? (
                      <View style={styles.guidingBadge}>
                        <Text style={styles.guidingBadgeText}>Guiding</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.subtitle}>
                    {getCategoryLabel(place.category)} · {place.distanceLabel} · {place.walkTimeLabel}
                  </Text>
                  <Text style={styles.reason}>{place.whyRecommended}</Text>
                </View>

                <Feather color={HavynColors.textSoft} name="chevron-right" size={18} />
              </Pressable>
            );
          })}
        </View>
      </SurfaceCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  title: {
    color: HavynColors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  listStack: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 22,
    backgroundColor: HavynColors.surfaceMuted,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowSelected: {
    backgroundColor: HavynColors.accentSoft,
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HavynColors.white,
  },
  rankBadgeText: {
    color: HavynColors.accentDeep,
    fontSize: 13,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  placeTitle: {
    color: HavynColors.text,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  subtitle: {
    color: HavynColors.textMuted,
    fontSize: 12,
  },
  reason: {
    color: HavynColors.accentDeep,
    fontSize: 12,
    fontWeight: '600',
  },
  guidingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFE6E3',
  },
  guidingBadgeText: {
    color: HavynColors.accentDeep,
    fontSize: 11,
    fontWeight: '700',
  },
});
