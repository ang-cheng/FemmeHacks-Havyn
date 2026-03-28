import {
  DemoSafePlace,
  PENN_DEMO_CENTER,
  SafePlaceCategory,
  SafePlaceFilterId,
  safePlaceCategoryLabels,
} from '@/data/safePlaces';

export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

export type RankedSafePlace = DemoSafePlace & {
  isCurrentlyOpen: boolean;
  distanceMeters: number;
  distanceLabel: string;
  walkMinutes: number;
  walkTimeLabel: string;
  whyRecommended: string;
};

const metersPerMile = 1609.34;

export function getFallbackOrigin() {
  return PENN_DEMO_CENTER;
}

export function rankSafePlaces(
  places: DemoSafePlace[],
  origin: MapCoordinate,
  activeFilters: SafePlaceFilterId[],
  query: string
) {
  const normalizedQuery = query.trim().toLowerCase();

  const ranked = places
    .filter((place) => matchesSearch(place, normalizedQuery))
    .filter((place) => matchesFilters(place, activeFilters))
    .map((place) => {
      const distanceMeters = getDistanceMeters(origin, place);
      const walkMinutes = estimateWalkMinutes(distanceMeters);
      const isCurrentlyOpen = place.isOpenNow ?? place.open24Hours;

      return {
        ...place,
        isCurrentlyOpen,
        distanceMeters,
        distanceLabel: formatDistance(distanceMeters),
        walkMinutes,
        walkTimeLabel: formatWalkTime(walkMinutes),
        whyRecommended: getRecommendationReason(place, isCurrentlyOpen, walkMinutes),
      };
    })
    .sort((left, right) => getPlaceScore(right) - getPlaceScore(left) || left.distanceMeters - right.distanceMeters);

  return ranked;
}

export function getDistanceMeters(origin: MapCoordinate, destination: MapCoordinate) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const latDelta = toRadians(destination.latitude - origin.latitude);
  const lonDelta = toRadians(destination.longitude - origin.longitude);
  const latOne = toRadians(origin.latitude);
  const latTwo = toRadians(destination.latitude);

  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(latOne) * Math.cos(latTwo) * Math.sin(lonDelta / 2) * Math.sin(lonDelta / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

export function estimateWalkMinutes(distanceMeters: number) {
  return Math.max(1, Math.round(distanceMeters / 80));
}

export function formatDistance(distanceMeters: number) {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`;
  }

  return `${(distanceMeters / metersPerMile).toFixed(1)} mi`;
}

export function formatWalkTime(minutes: number) {
  return `${minutes} min walk`;
}

export function getBearingDegrees(origin: MapCoordinate, destination: MapCoordinate) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const toDegrees = (value: number) => (value * 180) / Math.PI;
  const originLatitude = toRadians(origin.latitude);
  const destinationLatitude = toRadians(destination.latitude);
  const longitudeDelta = toRadians(destination.longitude - origin.longitude);

  const y = Math.sin(longitudeDelta) * Math.cos(destinationLatitude);
  const x =
    Math.cos(originLatitude) * Math.sin(destinationLatitude) -
    Math.sin(originLatitude) * Math.cos(destinationLatitude) * Math.cos(longitudeDelta);

  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

export function getBearingLabel(bearingDegrees: number) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return directions[Math.round(bearingDegrees / 45) % directions.length];
}

export function buildDemoRoute(origin: MapCoordinate, destination: MapCoordinate) {
  const latitudeDelta = destination.latitude - origin.latitude;
  const longitudeDelta = destination.longitude - origin.longitude;

  return [
    origin,
    {
      latitude: origin.latitude + latitudeDelta * 0.42 + longitudeDelta * 0.12,
      longitude: origin.longitude + longitudeDelta * 0.42 - latitudeDelta * 0.04,
    },
    {
      latitude: origin.latitude + latitudeDelta * 0.74 + longitudeDelta * 0.06,
      longitude: origin.longitude + longitudeDelta * 0.74 - latitudeDelta * 0.02,
    },
    destination,
  ];
}

export function getCategoryLabel(category: SafePlaceCategory) {
  return safePlaceCategoryLabels[category];
}

function matchesSearch(place: DemoSafePlace, normalizedQuery: string) {
  if (!normalizedQuery) {
    return true;
  }

  const haystack = [
    place.name,
    place.category,
    place.description ?? '',
    ...(place.searchTerms ?? []),
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

function matchesFilters(place: DemoSafePlace, activeFilters: SafePlaceFilterId[]) {
  if (!activeFilters.length) {
    return true;
  }

  const categoryFilters = activeFilters.filter(
    (filter): filter is 'police' | 'hospital' => filter === 'police' || filter === 'hospital'
  );

  if (categoryFilters.length) {
    const categoryMatches = categoryFilters.some((filter) =>
      filter === 'police' ? place.category === 'police' : place.category === 'hospital'
    );

    if (!categoryMatches) {
      return false;
    }
  }

  if (activeFilters.includes('open') && !(place.isOpenNow ?? place.open24Hours)) {
    return false;
  }

  if (activeFilters.includes('247') && !place.open24Hours) {
    return false;
  }

  if (activeFilters.includes('campus') && !place.campusOnly) {
    return false;
  }

  return true;
}

function getPlaceScore(place: RankedSafePlace) {
  let score = 0;

  if (place.isCurrentlyOpen) {
    score += 4000;
  }

  if (place.open24Hours) {
    score += 2000;
  }

  if (place.category === 'police') {
    score += 1500;
  } else if (place.category === 'hospital') {
    score += 1350;
  } else if (place.category === 'resource') {
    score += 700;
  } else if (place.category === 'cafe') {
    score += 350;
  }

  if (place.staffed) {
    score += 500;
  }

  score -= place.walkMinutes * 45;
  score -= place.distanceMeters / 20;

  return score;
}

function getRecommendationReason(place: DemoSafePlace, isCurrentlyOpen: boolean, walkMinutes: number) {
  if (isCurrentlyOpen && place.open24Hours && place.staffed && place.category === 'police') {
    return 'Closest 24/7 staffed emergency resource';
  }

  if (isCurrentlyOpen && (place.category === 'police' || place.category === 'hospital')) {
    return 'Nearest open emergency resource';
  }

  if (place.open24Hours && place.staffed) {
    return 'Closest 24/7 staffed location';
  }

  if (walkMinutes <= 5) {
    return 'Fastest walk from your current position';
  }

  return 'Reliable nearby option with visible staff';
}
