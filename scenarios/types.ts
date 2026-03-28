export type TranscriptLine = {
  speaker: 'caller' | 'user';
  text: string;
};

export type FakeCallScenario = {
  id: string;
  title: string;
  description: string;
  transcript: TranscriptLine[];
  preferredVoiceId?: string;
  source?: 'builtin' | 'custom';
  createdAt?: number;
  updatedAt?: number;
};

export type ManagedFakeCallScenario = FakeCallScenario & {
  source: 'builtin' | 'custom';
};

export type ScenarioDraftValues = {
  title: string;
  description: string;
  scriptText: string;
  preferredVoiceId: string;
};
