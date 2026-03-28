import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { LatLng, Marker, Polyline } from 'react-native-maps';

import { HavynColors, HavynShadow } from '@/constants/havyn';
import { demoSafePlaces, PENN_DEMO_CENTER, SafePlaceFilterId, safePlaceFilters } from '@/data/safePlaces';
import {
  buildDemoRoute,
  formatDistance,
  formatWalkTime,
  getBearingDegrees,
  getBearingLabel,
  getFallbackOrigin,
  rankSafePlaces,
  RankedSafePlace,
} from '@/utils/map';

import { FilterChip, SectionHeader, SurfaceCard } from './common';
import { GuideModeBanner } from './GuideModeBanner';
import { MapSearchBar } from './MapSearchBar';
import { PlaceCard } from './PlaceCard';
import { PlaceList } from './PlaceList';

const initialEdgePadding = { top: 80, right: 64, bottom: 80, left: 64 };

export function MapScreen() {
  const mapRef = useRef<MapView | null>(null);
  const locationWatcherRef = useRef<Location.LocationSubscription | null>(null);
  const headingWatcherRef = useRef<Location.LocationSubscription | null>(null);
  const lastFrameKeyRef = useRef<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<SafePlaceFilterId[]>(['open']);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [guidancePlaceId, setGuidancePlaceId] = useState<string | null>(null);
  const [hasManualSelection, setHasManualSelection] = useState(false);
  const [permissionState, setPermissionState] = useState<'loading' | 'granted' | 'denied'>('loading');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [headingDegrees, setHeadingDegrees] = useState<number | null>(null);

  const origin = userLocation ?? getFallbackOrigin();
  const usingFallbackOrigin = permissionState !== 'granted' || userLocation == null;

  const rankedPlaces = useMemo(
    () => rankSafePlaces(demoSafePlaces, origin, activeFilters, searchQuery),
    [activeFilters, origin, searchQuery]
  );

  const recommendedPlace = rankedPlaces[0] ?? null;

  useEffect(() => {
    let mounted = true;

    const loadLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (!mounted) {
          return;
        }

        if (status !== 'granted') {
          setPermissionState('denied');
          setLocationError('Location permission denied. Browsing Penn campus demo data instead.');
          return;
        }

        setPermissionState('granted');

        const currentPosition = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!mounted) {
          return;
        }

        setUserLocation({
          latitude: currentPosition.coords.latitude,
          longitude: currentPosition.coords.longitude,
        });

        locationWatcherRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 8,
            timeInterval: 4000,
          },
          (nextPosition) => {
            setUserLocation({
              latitude: nextPosition.coords.latitude,
              longitude: nextPosition.coords.longitude,
            });
          }
        );

        try {
          headingWatcherRef.current = await Location.watchHeadingAsync((heading) => {
            const nextHeading = Number.isFinite(heading.trueHeading) && heading.trueHeading >= 0
              ? heading.trueHeading
              : heading.magHeading;

            if (Number.isFinite(nextHeading)) {
              setHeadingDegrees(nextHeading);
            }
          });
        } catch {
          setHeadingDegrees(null);
        }
      } catch {
        if (!mounted) {
          return;
        }

        setPermissionState('denied');
        setLocationError('Using the Penn campus demo origin because live location is unavailable.');
        setHeadingDegrees(null);
      }
    };

    loadLocation();

    return () => {
      mounted = false;
      locationWatcherRef.current?.remove();
      headingWatcherRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!rankedPlaces.length) {
      setSelectedPlaceId(null);
      setGuidancePlaceId(null);
      return;
    }

    const selectionStillVisible = selectedPlaceId
      ? rankedPlaces.some((place) => place.id === selectedPlaceId)
      : false;

    if (!selectionStillVisible || !hasManualSelection) {
      setSelectedPlaceId(rankedPlaces[0].id);
    }

    if (guidancePlaceId && !rankedPlaces.some((place) => place.id === guidancePlaceId)) {
      setGuidancePlaceId(null);
    }
  }, [guidancePlaceId, hasManualSelection, rankedPlaces, selectedPlaceId]);

  const selectedPlace =
    rankedPlaces.find((place) => place.id === selectedPlaceId) ?? recommendedPlace;

  const guidePlace =
    rankedPlaces.find((place) => place.id === guidancePlaceId) ?? null;

  const guideRoute = useMemo(() => {
    if (!guidePlace) {
      return [];
    }

    return buildDemoRoute(origin, {
      latitude: guidePlace.latitude,
      longitude: guidePlace.longitude,
    });
  }, [guidePlace, origin]);

  const guideBearing = guidePlace
    ? getBearingDegrees(origin, {
        latitude: guidePlace.latitude,
        longitude: guidePlace.longitude,
      })
    : 0;

  const guideDirectionLabel = getBearingLabel(guideBearing);

  useEffect(() => {
    if (!mapRef.current || !mapReady) {
      return;
    }

    const frameKey = guidePlace
      ? `guide:${guidePlace.id}`
      : `browse:${rankedPlaces.slice(0, 4).map((place) => place.id).join(',')}`;

    if (lastFrameKeyRef.current === frameKey) {
      return;
    }

    lastFrameKeyRef.current = frameKey;

    const focusCoordinates = guidePlace
      ? [
          origin,
          {
            latitude: guidePlace.latitude,
            longitude: guidePlace.longitude,
          },
        ]
      : [
          origin,
          ...rankedPlaces.slice(0, 4).map((place) => ({
            latitude: place.latitude,
            longitude: place.longitude,
          })),
        ];

    if (focusCoordinates.length > 1) {
      mapRef.current.fitToCoordinates(focusCoordinates, {
        animated: true,
        edgePadding: initialEdgePadding,
      });
    } else {
      mapRef.current.animateCamera({
        center: focusCoordinates[0] ?? PENN_DEMO_CENTER,
        zoom: 15,
      });
    }
  }, [guidePlace, mapReady, origin, rankedPlaces]);

  const handleSelectPlace = useCallback((placeId: string) => {
    setHasManualSelection(true);
    setSelectedPlaceId(placeId);
  }, []);

  const toggleFilter = useCallback((filterId: SafePlaceFilterId) => {
    setActiveFilters((current) =>
      current.includes(filterId)
        ? current.filter((filter) => filter !== filterId)
        : [...current, filterId]
    );
  }, []);

  const handleCallPlace = useCallback(async () => {
    if (!selectedPlace?.phone) {
      Alert.alert('Phone unavailable', 'This demo location does not have a phone number configured.');
      return;
    }

    await Linking.openURL(`tel:${selectedPlace.phone.replace(/[^+\d]/g, '')}`);
  }, [selectedPlace]);

  const handleGuideToggle = useCallback(() => {
    if (!selectedPlace) {
      return;
    }

    setGuidancePlaceId((current) => (current === selectedPlace.id ? null : selectedPlace.id));
  }, [selectedPlace]);

  const handleTopRecommendationPress = useCallback(() => {
    if (guidePlace) {
      setGuidancePlaceId(null);
      return;
    }

    if (!recommendedPlace) {
      return;
    }

    setSelectedPlaceId(recommendedPlace.id);
    setGuidancePlaceId(recommendedPlace.id);
  }, [guidePlace, recommendedPlace]);

  const handleRecenter = useCallback(() => {
    if (!mapRef.current) {
      return;
    }

    mapRef.current.animateCamera({
      center: origin,
      zoom: 15.4,
    });
  }, [origin]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: 50 }}>
        <SectionHeader
          title="Nearby Safe Places"
          subtitle="Find open campus resources and a fast route to help."
        />
      </View>

      <MapSearchBar
        onChangeText={setSearchQuery}
        resultCount={rankedPlaces.length}
        value={searchQuery}
      />

      <View style={styles.filterRow}>
        {safePlaceFilters.map((filter) => (
          <FilterChip
            key={filter.id}
            active={activeFilters.includes(filter.id)}
            label={filter.label}
            onPress={() => toggleFilter(filter.id)}
          />
        ))}
      </View>

      {permissionState !== 'granted' || locationError ? (
        <View style={styles.locationNoticeWrap}>
          <SurfaceCard style={styles.locationNoticeCard}>
            <View style={styles.locationNoticeRow}>
              <Feather color={HavynColors.accent} name="map-pin" size={18} />
              <Text style={styles.locationNoticeTitle}>
                {permissionState === 'loading' ? 'Finding your location…' : 'Manual browse mode'}
              </Text>
            </View>
            <Text style={styles.locationNoticeText}>
              {permissionState === 'loading'
                ? 'We are requesting location access so the map can rank the closest safe places for you.'
                : locationError ?? 'Location is unavailable, so the map is centered on a Penn-area demo origin.'}
            </Text>
          </SurfaceCard>
        </View>
      ) : null}

      <View style={styles.mapWrap}>
        <View style={styles.mapCard}>
          <MapView
            initialRegion={{
              latitude: origin.latitude,
              longitude: origin.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            onMapReady={() => setMapReady(true)}
            ref={mapRef}
            rotateEnabled={false}
            showsBuildings
            showsCompass={false}
            style={StyleSheet.absoluteFill}
          >
            <Marker coordinate={origin} tracksViewChanges={false}>
              {headingDegrees != null ? (
                <View style={styles.userArrowMarker}>
                  <Feather
                    color={HavynColors.info}
                    name="navigation"
                    size={18}
                    style={{ transform: [{ rotate: `${headingDegrees}deg` }] }}
                  />
                </View>
              ) : (
                <View style={styles.userMarkerOuter}>
                  <View style={styles.userMarkerInner} />
                </View>
              )}
            </Marker>

            {rankedPlaces.map((place) => {
              const isSelected = place.id === selectedPlace?.id;
              const isRecommended = place.id === recommendedPlace?.id;
              const isGuiding = place.id === guidancePlaceId;

              return (
                <Marker
                  coordinate={{ latitude: place.latitude, longitude: place.longitude }}
                  key={place.id}
                  onPress={() => handleSelectPlace(place.id)}
                  tracksViewChanges={false}
                >
                  <View style={styles.markerContainer}>
                    <View
                      style={[
                        styles.markerBubble,
                        isRecommended && styles.markerBubbleRecommended,
                        isSelected && styles.markerBubbleSelected,
                        isGuiding && styles.markerBubbleGuiding,
                      ]}
                    >
                      <Feather
                        color={HavynColors.white}
                        name={iconForCategory(place.category)}
                        size={16}
                      />
                    </View>
                    <View style={[styles.markerStem, isGuiding && styles.markerStemGuiding]} />
                  </View>
                </Marker>
              );
            })}

            {guideRoute.length ? (
              <Polyline
                coordinates={guideRoute}
                lineCap="round"
                lineDashPattern={[1, 0]}
                lineJoin="round"
                strokeColor={HavynColors.accent}
                strokeWidth={5}
              />
            ) : null}
          </MapView>

          <View style={styles.mapOverlayTop}>
            <Pressable
              accessibilityRole="button"
              disabled={!recommendedPlace && !guidePlace}
              onPress={handleTopRecommendationPress}
              style={[styles.mapStatusBadge, guidePlace ? styles.mapStatusBadgeActive : null]}
            >
              {permissionState === 'loading' ? (
                <ActivityIndicator color={HavynColors.accent} size="small" />
              ) : (
                <Feather
                  color={guidePlace ? HavynColors.white : HavynColors.accent}
                  name={guidePlace ? 'navigation' : 'shield'}
                  size={15}
                />
              )}
              <View style={styles.mapStatusBody}>
                <Text style={[styles.mapStatusText, guidePlace ? styles.mapStatusTextActive : null]}>
                  {guidePlace
                    ? `Guiding to ${guidePlace.name}`
                    : recommendedPlace
                      ? `Guide to ${recommendedPlace.name}`
                      : 'No matches'}
                </Text>
                {guidePlace ? (
                  <Text style={styles.mapStatusSubtextActive}>
                    {guidePlace.distanceLabel} · {guidePlace.walkTimeLabel}
                  </Text>
                ) : recommendedPlace ? (
                  <Text style={styles.mapStatusSubtext}>
                    {recommendedPlace.whyRecommended}
                  </Text>
                ) : null}
              </View>
              <View style={[styles.mapStatusAction, guidePlace ? styles.mapStatusActionActive : null]}>
                <Text style={[styles.mapStatusActionText, guidePlace ? styles.mapStatusActionTextActive : null]}>
                  {guidePlace ? 'End guidance' : 'Start route'}
                </Text>
              </View>
            </Pressable>
          </View>

          <Pressable accessibilityRole="button" onPress={handleRecenter} style={styles.recenterButton}>
            <Feather color={HavynColors.accent} name="crosshair" size={18} />
          </Pressable>
        </View>
      </View>

      {guidePlace ? (
        <GuideModeBanner
          bearingDegrees={guideBearing}
          destinationName={guidePlace.name}
          directionLabel={guideDirectionLabel}
          distanceLabel={formatDistance(guidePlace.distanceMeters)}
          onEnd={() => setGuidancePlaceId(null)}
          usingFallbackOrigin={usingFallbackOrigin}
          walkTimeLabel={formatWalkTime(guidePlace.walkMinutes)}
        />
      ) : null}

      {selectedPlace ? (
        <PlaceCard
          callDisabled={!selectedPlace.phone}
          guidanceActive={guidancePlaceId === selectedPlace.id}
          onCall={handleCallPlace}
          onGuide={handleGuideToggle}
          place={selectedPlace}
        />
      ) : (
        <View style={styles.emptyStateWrap}>
          <SurfaceCard>
            <Text style={styles.emptyStateTitle}>No places match your search</Text>
            <Text style={styles.emptyStateText}>
              Try a broader search like “hospital” or clear one of the active filters.
            </Text>
          </SurfaceCard>
        </View>
      )}

      {rankedPlaces.length ? (
        <PlaceList
          guidancePlaceId={guidancePlaceId}
          onSelect={handleSelectPlace}
          places={rankedPlaces}
          selectedPlaceId={selectedPlace?.id ?? null}
        />
      ) : null}
    </ScrollView>
  );
}

function iconForCategory(category: RankedSafePlace['category']): keyof typeof Feather.glyphMap {
  switch (category) {
    case 'police':
      return 'shield';
    case 'hospital':
      return 'plus-square';
    case 'resource':
      return 'book-open';
    case 'cafe':
      return 'coffee';
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
    paddingBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  locationNoticeWrap: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  locationNoticeCard: {
    gap: 8,
  },
  locationNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationNoticeTitle: {
    color: HavynColors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  locationNoticeText: {
    color: HavynColors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  mapWrap: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  mapCard: {
    height: 360,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: HavynColors.border,
    backgroundColor: HavynColors.surface,
    ...HavynShadow,
  },
  mapOverlayTop: {
    position: 'absolute',
    left: 14,
    right: 64,
    top: 14,
  },
  mapStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  mapStatusBadgeActive: {
    backgroundColor: 'rgba(20, 27, 44, 0.92)',
  },
  mapStatusBody: {
    flex: 1,
    gap: 1,
  },
  mapStatusText: {
    color: HavynColors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  mapStatusTextActive: {
    color: HavynColors.white,
  },
  mapStatusSubtext: {
    color: HavynColors.textMuted,
    fontSize: 11,
  },
  mapStatusSubtextActive: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 11,
  },
  mapStatusAction: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: HavynColors.accentSoft,
  },
  mapStatusActionActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  mapStatusActionText: {
    color: HavynColors.accentDeep,
    fontSize: 11,
    fontWeight: '700',
  },
  mapStatusActionTextActive: {
    color: HavynColors.white,
  },
  recenterButton: {
    position: 'absolute',
    right: 14,
    top: 14,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
  },
  userMarkerOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(79, 140, 255, 0.22)',
  },
  userMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: HavynColors.info,
    borderWidth: 2,
    borderColor: HavynColors.white,
  },
  userArrowMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 2,
    borderColor: HavynColors.info,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HavynColors.accent,
    borderWidth: 2,
    borderColor: HavynColors.white,
  },
  markerBubbleRecommended: {
    backgroundColor: '#FF826F',
    transform: [{ scale: 1.04 }],
  },
  markerBubbleSelected: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  markerBubbleGuiding: {
    backgroundColor: HavynColors.accentDeep,
  },
  markerStem: {
    width: 4,
    height: 12,
    borderRadius: 999,
    marginTop: -2,
    backgroundColor: HavynColors.accent,
  },
  markerStemGuiding: {
    backgroundColor: HavynColors.accentDeep,
  },
  emptyStateWrap: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  emptyStateTitle: {
    color: HavynColors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyStateText: {
    color: HavynColors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
});
