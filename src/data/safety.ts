export type SafetyTab = 'plan' | 'call' | 'map';

export type VoiceOption = {
  id: string;
  name: string;
  description: string;
};

export type Contact = {
  id: string;
  name: string;
  phone: string;
  status: 'Main' | 'Safe';
  initials: string;
};

export const voiceOptions: VoiceOption[] = [
  {
    id: 'sB7vwSCyX0tQmU24cW2C',
    name: 'Neutral Authoritative',
    description: 'Grounding and confident',
  },
  {
    id: 'Yy9hdn23JDNfhVPIWlHY',
    name: 'College Friend',
    description: 'Casual and friendly',
  },
  {
    id: 'qmm0vRXCIew16ilYAeiI',
    name: 'Trustworthy Friend',
    description: 'Reliable and present',
  },
  {
    id: 'GIJE29YWWeAkgRFZxlrX',
    name: 'Coach Cupp',
    description: 'Realistic and down-to-earth',
  },
];

export const emergencyContacts: Contact[] = [
  {
    id: 'sarah',
    name: 'Sarah Kim',
    phone: '+1 (555) 123-4567',
    status: 'Main',
    initials: 'SK',
  },
  {
    id: 'mom',
    name: 'Mom',
    phone: '+1 (555) 987-6543',
    status: 'Safe',
    initials: 'M',
  },
  {
    id: 'campus-security',
    name: 'Campus Security',
    phone: '+1 (555) 246-8100',
    status: 'Safe',
    initials: 'CS',
  },
];
