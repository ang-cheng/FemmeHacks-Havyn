import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { HavynColors, HavynShadow } from '@/constants/havyn';
import { SafePlace, safePlaces } from '@/data/safety';

import { FilterChip, SectionHeader, SurfaceCard } from './common';

type FilterId = 'open' | 'campus' | '247';

const filters: Array<{ id: FilterId; label: string }> = [
  { id: 'open', label: 'Open now' },
  { id: 'campus', label: 'Campus only' },
  { id: '247', label: '24/7 locations' },
];

export function MapScreen() {
  const [selectedFilters, setSelectedFilters] = useState<FilterId[]>(['open']);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number>(safePlaces[0]?.id ?? 1);

  const visiblePlaces = useMemo(() => {
    const hasFilter = (filterId: FilterId) => selectedFilters.includes(filterId);

    const filtered = safePlaces.filter((place) => {
      if (hasFilter('open') && !place.isOpen) {
        return false;
      }

      if (hasFilter('campus') && !place.campusOnly) {
        return false;
      }

      if (hasFilter('247') && !place.alwaysOpen) {
        return false;
      }

      return true;
    });

    return filtered.length > 0 ? filtered : safePlaces;
  }, [selectedFilters]);

  const selectedPlace =
    visiblePlaces.find((place) => place.id === selectedPlaceId) ?? visiblePlaces[0] ?? safePlaces[0];

  const toggleFilter = (filterId: FilterId) => {
    setSelectedFilters((current) =>
      current.includes(filterId) ? current.filter((id) => id !== filterId) : [...current, filterId]
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <SectionHeader
        title="Nearby Safe Places"
        subtitle="Find open campus resources and a fast route to help."
      />

      <View style={styles.filterRow}>
        {filters.map((filter) => (
          <FilterChip
            key={filter.id}
            label={filter.label}
            active={selectedFilters.includes(filter.id)}
            onPress={() => toggleFilter(filter.id)}
          />
        ))}
      </View>

      <View style={styles.mapShell}>
        <LinearGradient
          colors={['#F8FAFF', '#EDF2FF', '#E6F0FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.mapArea}
        >
          <View style={styles.gridOverlay}>
            {Array.from({ length: 8 }).map((_, index) => (
              <View key={`row-${index}`} style={[styles.gridLineHorizontal, { top: `${index * 14}%` }]} />
            ))}
            {Array.from({ length: 8 }).map((_, index) => (
              <View key={`column-${index}`} style={[styles.gridLineVertical, { left: `${index * 14}%` }]} />
            ))}
          </View>

          <View style={styles.routeOne} />
          <View style={styles.routeTwo} />
          <View style={styles.routeThree} />

          {visiblePlaces.map((place) => (
            <Pressable
              accessibilityRole="button"
              key={place.id}
              onPress={() => setSelectedPlaceId(place.id)}
              style={[
                styles.pinWrap,
                {
                  left: place.mapPosition.left,
                  top: place.mapPosition.top,
                },
              ]}
            >
              <View style={[styles.pin, place.id === selectedPlace.id && styles.pinActive]}>
                <Feather
                  color={HavynColors.white}
                  name={iconForPlace(place)}
                  size={18}
                />
              </View>
              <View style={styles.pinStem} />
            </Pressable>
          ))}

          <View style={styles.currentLocationWrap}>
            <View style={styles.currentLocationPulse} />
            <View style={styles.currentLocationCore} />
          </View>

          <View style={styles.compassButton}>
            <Feather color={HavynColors.accent} name="navigation" size={22} />
          </View>
        </LinearGradient>
      </View>

      <View style={styles.sectionStack}>
        <SurfaceCard>
          <View style={styles.primaryPlaceHeader}>
            <View style={styles.primaryPlaceBody}>
              <View style={styles.primaryPlaceRow}>
                <View style={styles.primaryPlaceIcon}>
                  <Feather color={HavynColors.accent} name={iconForPlace(selectedPlace)} size={18} />
                </View>
                <View style={styles.primaryPlaceMeta}>
                  <Text style={styles.primaryPlaceTitle}>{selectedPlace.name}</Text>
                  <View style={styles.metricRow}>
                    <View style={styles.metricItem}>
                      <Feather color={HavynColors.textMuted} name="map-pin" size={14} />
                      <Text style={styles.metricText}>{selectedPlace.distance}</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Feather color={HavynColors.textMuted} name="clock" size={14} />
                      <Text style={styles.metricText}>{selectedPlace.eta}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.hoursPill}>
              <Text style={styles.hoursText}>{selectedPlace.hours}</Text>
            </View>
          </View>

          <Pressable accessibilityRole="button" style={styles.guideButton}>
            <LinearGradient
              colors={[HavynColors.accent, HavynColors.accentDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.guideButtonGradient}
            >
              <Feather color={HavynColors.white} name="navigation" size={18} />
              <Text style={styles.guideButtonText}>Guide Me</Text>
            </LinearGradient>
          </Pressable>
        </SurfaceCard>

        <SurfaceCard>
          <Text style={styles.listTitle}>Other open locations</Text>
          <View style={styles.listStack}>
            {visiblePlaces.map((place) => (
              <Pressable
                accessibilityRole="button"
                key={place.id}
                onPress={() => setSelectedPlaceId(place.id)}
                style={[
                  styles.placeRow,
                  place.id === selectedPlace.id ? styles.placeRowSelected : null,
                ]}
              >
                <View style={styles.placeRowIcon}>
                  <Feather color={HavynColors.accent} name={iconForPlace(place)} size={16} />
                </View>
                <View style={styles.placeRowBody}>
                  <Text style={styles.placeRowTitle}>{place.name}</Text>
                  <Text style={styles.placeRowSubtitle}>
                    {place.distance} · {place.eta}
                  </Text>
                </View>
                <Feather color={HavynColors.textSoft} name="chevron-right" size={18} />
              </Pressable>
            ))}
          </View>
        </SurfaceCard>
      </View>
    </ScrollView>
  );
}

function iconForPlace(place: SafePlace): keyof typeof Feather.glyphMap {
  switch (place.type) {
    case 'security':
    case 'police':
      return 'shield';
    case 'hospital':
      return 'plus-square';
    default:
      return 'home';
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: HavynColors.background,
  },
  content: {
    paddingBottom: 28,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  mapShell: {
    paddingHorizontal: 20,
  },
  mapArea: {
    height: 360,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: HavynColors.border,
    ...HavynShadow,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.22,
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#A5B4D6',
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#A5B4D6',
  },
  routeOne: {
    position: 'absolute',
    left: 24,
    top: 120,
    width: 220,
    height: 18,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    transform: [{ rotate: '-22deg' }],
  },
  routeTwo: {
    position: 'absolute',
    right: 32,
    top: 120,
    width: 140,
    height: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    transform: [{ rotate: '36deg' }],
  },
  routeThree: {
    position: 'absolute',
    left: 64,
    bottom: 82,
    width: 180,
    height: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    transform: [{ rotate: '18deg' }],
  },
  pinWrap: {
    position: 'absolute',
    alignItems: 'center',
    marginLeft: -20,
    marginTop: -20,
  },
  pin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HavynColors.accent,
    shadowColor: HavynColors.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
  },
  pinActive: {
    transform: [{ scale: 1.08 }],
  },
  pinStem: {
    width: 4,
    height: 14,
    borderRadius: 999,
    backgroundColor: HavynColors.accent,
    marginTop: -4,
  },
  currentLocationWrap: {
    position: 'absolute',
    left: '47%',
    top: '54%',
    marginLeft: -18,
    marginTop: -18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocationPulse: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(79, 140, 255, 0.18)',
  },
  currentLocationCore: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: HavynColors.info,
    borderWidth: 4,
    borderColor: HavynColors.white,
  },
  compassButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HavynColors.white,
    ...HavynShadow,
  },
  sectionStack: {
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 16,
  },
  primaryPlaceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
  },
  primaryPlaceBody: {
    flex: 1,
  },
  primaryPlaceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  primaryPlaceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: HavynColors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryPlaceMeta: {
    flex: 1,
    gap: 8,
  },
  primaryPlaceTitle: {
    color: HavynColors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metricText: {
    color: HavynColors.textMuted,
    fontSize: 13,
  },
  hoursPill: {
    borderRadius: 999,
    backgroundColor: HavynColors.successBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  hoursText: {
    color: HavynColors.successText,
    fontSize: 12,
    fontWeight: '700',
  },
  guideButton: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  guideButtonGradient: {
    minHeight: 54,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  guideButtonText: {
    color: HavynColors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  listTitle: {
    color: HavynColors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  listStack: {
    gap: 12,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 22,
    backgroundColor: HavynColors.surfaceMuted,
  },
  placeRowSelected: {
    backgroundColor: HavynColors.accentSoft,
  },
  placeRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HavynColors.white,
  },
  placeRowBody: {
    flex: 1,
    gap: 4,
  },
  placeRowTitle: {
    color: HavynColors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  placeRowSubtitle: {
    color: HavynColors.textMuted,
    fontSize: 13,
  },
});
