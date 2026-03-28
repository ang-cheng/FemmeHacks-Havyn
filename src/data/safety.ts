export type SafetyTab = 'plan' | 'call' | 'map';

export type ScenarioOption = {
  id: string;
  title: string;
  description: string;
  script: string;
};

export type VoiceOption = {
  id: string;
  name: string;
  description: string;
};

export type Contact = {
  id: string;
  name: string;
  phone: string;
  status: 'Primary' | 'Safe';
  initials: string;
};

export const scenarioOptions: ScenarioOption[] = [
  {
    id: 'friend',
    title: 'Friend checking in',
    description: 'Casual conversation with a friend',
    script:
      "Hey! I'm just leaving the library now. Can you stay on the line with me while I walk home?",
  },
  {
    id: 'partner',
    title: 'Partner waiting at home',
    description: "Let them know you're on your way",
    script:
      "I'm heading out now and should be there in about ten minutes. Can you keep talking with me until I get inside?",
  },
  {
    id: 'parent',
    title: 'Parent call',
    description: 'Family member checking on you',
    script:
      "I'm almost back, just cutting across campus. Stay with me for a minute so I don't sound alone.",
  },
];

export const voiceOptions: VoiceOption[] = [
  {
    id: 'calm-female',
    name: 'Calm female voice',
    description: 'Reassuring and friendly',
  },
  {
    id: 'deep-male',
    name: 'Deep male voice',
    description: 'Confident and protective',
  },
  {
    id: 'neutral',
    name: 'Friendly neutral voice',
    description: 'Warm and approachable',
  },
];

export const emergencyContacts: Contact[] = [
  {
    id: 'sarah',
    name: 'Sarah Kim',
    phone: '+1 (555) 123-4567',
    status: 'Primary',
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

export const scriptedPrompts = [
  "Hey, I'm almost home. Can you stay on the line with me?",
  "Yeah, I'm just walking from the library now.",
  'Can you meet me outside in 5 minutes?',
  "I should be there soon, just keep talking to me.",
];
