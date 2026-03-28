import AsyncStorage from '@react-native-async-storage/async-storage';

import { voiceOptions } from '@/data/safety';
import { fakeCallScenarios } from '../../scenarios/fakeCallScenarios';
import type {
  ManagedFakeCallScenario,
  ScenarioDraftValues,
  TranscriptLine,
} from '../../scenarios/types';

export const SAFETY_PLAN_STORAGE_KEY = 'havyn:safety-plan:v1';

export type BuiltInScenarioOverride = Partial<
  Pick<ManagedFakeCallScenario, 'title' | 'description' | 'transcript' | 'preferredVoiceId' | 'updatedAt'>
>;

type PersistedCustomScenario = Omit<ManagedFakeCallScenario, 'source'>;

export type PersistedSafetyPlanState = {
  version: 1;
  customScenarios: PersistedCustomScenario[];
  builtInOverrides: Record<string, BuiltInScenarioOverride>;
  selectedScenarioId?: string;
  selectedVoiceId?: string;
};

type StorageLike = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

const defaultVoiceId = voiceOptions[0]?.id ?? '';

const builtInScenarioDefaults: ManagedFakeCallScenario[] = fakeCallScenarios.map((scenario) => ({
  ...scenario,
  source: 'builtin',
}));

export function getBuiltInScenarioDefaults() {
  return builtInScenarioDefaults.map((scenario) => ({ ...scenario }));
}

export function getDefaultPersistedSafetyPlanState(): PersistedSafetyPlanState {
  return {
    version: 1,
    customScenarios: [],
    builtInOverrides: {},
    selectedScenarioId: builtInScenarioDefaults[0]?.id ?? '',
    selectedVoiceId: defaultVoiceId,
  };
}

function getStorage(): StorageLike | null {
  const storage = AsyncStorage as Partial<StorageLike> | null | undefined;

  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
    console.warn(
      '[SafetyPlanStorage] AsyncStorage native module is unavailable. Falling back to in-memory state.'
    );
    return null;
  }

  return storage as StorageLike;
}

function logStorageError(context: 'load' | 'save', error: unknown) {
  console.warn(
    `[SafetyPlanStorage] Failed to ${context} persisted safety plan state. Falling back to in-memory state.`,
    error
  );
}

export function applyBuiltInOverrides(
  overrides: Record<string, BuiltInScenarioOverride> = {}
): ManagedFakeCallScenario[] {
  return builtInScenarioDefaults.map((scenario) => {
    const override = overrides[scenario.id];

    return {
      ...scenario,
      ...override,
      transcript: override?.transcript ? [...override.transcript] : [...scenario.transcript],
      source: 'builtin',
    };
  });
}

export function serializeTranscript(transcript: TranscriptLine[]) {
  return transcript
    .map((line) => `${line.speaker === 'caller' ? 'Them' : 'You'}: ${line.text}`)
    .join('\n');
}

export function parseScriptText(scriptText: string): TranscriptLine[] {
  const lines = scriptText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const transcript: TranscriptLine[] = [];
  let lastSpeaker: TranscriptLine['speaker'] = 'caller';

  for (const line of lines) {
    const callerMatch = line.match(/^(them|caller|friend)\s*:\s*(.+)$/i);
    if (callerMatch) {
      transcript.push({ speaker: 'caller', text: callerMatch[2].trim() });
      lastSpeaker = 'caller';
      continue;
    }

    const userMatch = line.match(/^(you|user|me)\s*:\s*(.+)$/i);
    if (userMatch) {
      transcript.push({ speaker: 'user', text: userMatch[2].trim() });
      lastSpeaker = 'user';
      continue;
    }

    const nextSpeaker: TranscriptLine['speaker'] =
      transcript.length === 0 ? 'caller' : lastSpeaker === 'caller' ? 'user' : 'caller';
    transcript.push({ speaker: nextSpeaker, text: line });
    lastSpeaker = nextSpeaker;
  }

  return transcript;
}

export function createScenarioDraft(
  scenario?: ManagedFakeCallScenario,
  fallbackVoiceId = defaultVoiceId
): ScenarioDraftValues {
  if (!scenario) {
    return {
      title: '',
      description: '',
      scriptText: 'Them: Hey, where are you?\nYou: I’m on my way out now.',
      preferredVoiceId: fallbackVoiceId,
    };
  }

  return {
    title: scenario.title,
    description: scenario.description,
    scriptText: serializeTranscript(scenario.transcript),
    preferredVoiceId: scenario.preferredVoiceId ?? fallbackVoiceId,
  };
}

export function createCustomScenarioFromDraft(
  draft: ScenarioDraftValues,
  existingId?: string
): ManagedFakeCallScenario {
  const now = Date.now();

  return {
    id: existingId ?? `custom-scenario-${now}-${Math.random().toString(36).slice(2, 8)}`,
    source: 'custom',
    title: draft.title.trim(),
    description: draft.description.trim(),
    transcript: parseScriptText(draft.scriptText),
    preferredVoiceId: draft.preferredVoiceId || defaultVoiceId,
    createdAt: now,
    updatedAt: now,
  };
}

export function buildDuplicateScenario(
  scenario: ManagedFakeCallScenario,
  fallbackVoiceId = defaultVoiceId
): ManagedFakeCallScenario {
  const draft = createScenarioDraft(scenario, fallbackVoiceId);
  const duplicateTitle = draft.title.trim().endsWith('(Copy)')
    ? draft.title.trim()
    : `${draft.title.trim()} (Copy)`;

  return createCustomScenarioFromDraft(
    {
      ...draft,
      title: duplicateTitle,
    }
  );
}

export async function loadPersistedSafetyPlanState(): Promise<PersistedSafetyPlanState> {
  const storage = getStorage();
  if (!storage) {
    return getDefaultPersistedSafetyPlanState();
  }

  let raw: string | null = null;

  try {
    raw = await storage.getItem(SAFETY_PLAN_STORAGE_KEY);
  } catch (error) {
    logStorageError('load', error);
    return getDefaultPersistedSafetyPlanState();
  }

  if (!raw) {
    return getDefaultPersistedSafetyPlanState();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedSafetyPlanState>;

    return {
      version: 1,
      customScenarios: Array.isArray(parsed.customScenarios)
        ? parsed.customScenarios
            .filter(
              (scenario): scenario is PersistedCustomScenario =>
                Boolean(
                  scenario &&
                    typeof scenario.id === 'string' &&
                    typeof scenario.title === 'string' &&
                    typeof scenario.description === 'string' &&
                    Array.isArray(scenario.transcript)
                )
            )
            .map((scenario) => ({
              ...scenario,
              transcript: scenario.transcript.filter(
                (line): line is TranscriptLine =>
                  Boolean(
                    line &&
                      (line.speaker === 'caller' || line.speaker === 'user') &&
                      typeof line.text === 'string'
                  )
              ),
            }))
        : [],
      builtInOverrides:
        parsed.builtInOverrides && typeof parsed.builtInOverrides === 'object'
          ? parsed.builtInOverrides
          : {},
      selectedScenarioId:
        typeof parsed.selectedScenarioId === 'string'
          ? parsed.selectedScenarioId
          : builtInScenarioDefaults[0]?.id ?? '',
      selectedVoiceId: typeof parsed.selectedVoiceId === 'string' ? parsed.selectedVoiceId : defaultVoiceId,
    };
  } catch (error) {
    logStorageError('load', error);
    return getDefaultPersistedSafetyPlanState();
  }
}

export async function savePersistedSafetyPlanState(state: PersistedSafetyPlanState): Promise<boolean> {
  const storage = getStorage();
  if (!storage) {
    return false;
  }

  try {
    await storage.setItem(SAFETY_PLAN_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    logStorageError('save', error);
    return false;
  }
}

export function toPersistedCustomScenario(
  scenario: ManagedFakeCallScenario
): PersistedCustomScenario {
  const { source: _source, ...persisted } = scenario;
  return persisted;
}

export function normalizeVoiceId(voiceId?: string) {
  const option = voiceOptions.find((voice) => voice.id === voiceId);
  return option?.id ?? defaultVoiceId;
}
