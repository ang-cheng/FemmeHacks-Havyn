export type SafePlaceCategory = 'police' | 'hospital' | 'resource' | 'cafe' | 'other';

export type SafePlaceFilterId = 'open' | 'police' | 'hospital' | '247' | 'campus';

export type DemoSafePlace = {
  id: string;
  name: string;
  category: SafePlaceCategory;
  latitude: number;
  longitude: number;
  open24Hours: boolean;
  isOpenNow?: boolean;
  openHours?: string;
  phone?: string;
  accessibility?: string;
  staffed?: boolean;
  description?: string;
  campusOnly?: boolean;
  searchTerms?: string[];
};

export const PENN_DEMO_CENTER = {
  latitude: 39.95224,
  longitude: -75.19336,
};

export const safePlaceFilters: Array<{ id: SafePlaceFilterId; label: string }> = [
  { id: 'open', label: 'Open now' },
  { id: 'police', label: 'Police station' },
  { id: 'hospital', label: 'Hospital' },
  { id: '247', label: '24/7' },
  { id: 'campus', label: 'Campus only' },
];

export const safePlaceCategoryLabels: Record<SafePlaceCategory, string> = {
  police: 'Police station',
  hospital: 'Hospital',
  resource: 'Campus resource',
  cafe: 'Cafe',
  other: 'Public place',
};

export const demoSafePlaces: DemoSafePlace[] = [
  {
    id: 'penn-public-safety',
    name: 'Penn Public Safety HQ',
    category: 'police',
    latitude: 39.95282,
    longitude: -75.19354,
    open24Hours: true,
    isOpenNow: true,
    openHours: '24/7',
    phone: '+1 (215) 573-3333',
    accessibility: 'Wheelchair-accessible entrance',
    staffed: true,
    description: 'Closest staffed campus emergency dispatch point.',
    campusOnly: true,
    searchTerms: ['penn police', 'public safety', 'security', 'dispatch'],
  },
  {
    id: 'hup-ed',
    name: 'HUP Emergency Department',
    category: 'hospital',
    latitude: 39.94955,
    longitude: -75.19346,
    open24Hours: true,
    isOpenNow: true,
    openHours: '24/7',
    phone: '+1 (215) 662-4000',
    accessibility: 'Accessible drop-off and emergency entrance',
    staffed: true,
    description: 'Full emergency department with round-the-clock staffing.',
    campusOnly: false,
    searchTerms: ['hospital', 'emergency room', 'ed', 'penn medicine'],
  },
  {
    id: 'student-health',
    name: 'Student Health and Counseling',
    category: 'resource',
    latitude: 39.95628,
    longitude: -75.19608,
    open24Hours: false,
    isOpenNow: true,
    openHours: 'Open until 10 PM',
    phone: '+1 (215) 746-3535',
    accessibility: 'Elevator access available',
    staffed: true,
    description: 'Campus wellness and support staff with evening coverage.',
    campusOnly: true,
    searchTerms: ['wellness', 'counseling', 'student health', 'clinic'],
  },
  {
    id: 'van-pelt-night-desk',
    name: 'Van Pelt Night Desk',
    category: 'resource',
    latitude: 39.95267,
    longitude: -75.19088,
    open24Hours: false,
    isOpenNow: true,
    openHours: 'Open until 2 AM',
    phone: '+1 (215) 898-8964',
    accessibility: 'Accessible entrance and staffed lobby',
    staffed: true,
    description: 'Busy late-night campus building with staff and students nearby.',
    campusOnly: true,
    searchTerms: ['library', 'van pelt', 'study space', 'night desk'],
  },
  {
    id: 'starbucks-34th-walnut',
    name: 'Starbucks 34th & Walnut',
    category: 'cafe',
    latitude: 39.95314,
    longitude: -75.19168,
    open24Hours: false,
    isOpenNow: true,
    openHours: 'Open until 11 PM',
    phone: '+1 (215) 222-1051',
    accessibility: 'Street-level accessible entrance',
    staffed: true,
    description: 'Well-lit cafe with steady foot traffic and staff on site.',
    campusOnly: false,
    searchTerms: ['coffee', 'cafe', 'walnut street', 'starbucks'],
  },
  {
    id: 'cvs-walnut',
    name: 'CVS 34th Street',
    category: 'other',
    latitude: 39.95359,
    longitude: -75.19193,
    open24Hours: false,
    isOpenNow: true,
    openHours: 'Open until midnight',
    phone: '+1 (215) 222-2563',
    accessibility: 'Accessible entrance',
    staffed: true,
    description: 'Large, well-lit store with staff and main-street visibility.',
    campusOnly: false,
    searchTerms: ['pharmacy', 'cvs', 'store', 'walnut'],
  },
];
