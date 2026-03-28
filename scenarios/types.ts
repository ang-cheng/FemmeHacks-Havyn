export type TranscriptLine = {
  speaker: 'caller' | 'user';
  text: string;
};

export type FakeCallScenario = {
  id: string;
  title: string;
  description: string;
  transcript: TranscriptLine[];
};