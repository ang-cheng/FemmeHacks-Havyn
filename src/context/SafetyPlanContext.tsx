import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type SetStateAction,
} from 'react';

import { voiceOptions } from '@/data/safety';
import {
  applyBuiltInOverrides,
  buildDuplicateScenario,
  createCustomScenarioFromDraft,
  clampCheckInMinutes,
  getDefaultPersistedSafetyPlanState,
  loadPersistedSafetyPlanState,
  normalizeVoiceId,
  savePersistedSafetyPlanState,
  toPersistedCustomScenario,
  type BuiltInScenarioOverride,
} from '@/lib/scenario-storage';
import type { ManagedFakeCallScenario, ScenarioDraftValues } from '../../scenarios/types';

type SafetyPlanContextValue = {
  scenarios: ManagedFakeCallScenario[];
  builtinScenarios: ManagedFakeCallScenario[];
  customScenarios: ManagedFakeCallScenario[];
  selectedScenarioId: string;
  setSelectedScenarioId: (id: string) => void;
  selectedVoiceId: string;
  setSelectedVoiceId: (id: string) => void;
  selectedScenario: ManagedFakeCallScenario;
  selectedScenarioIsCustom: boolean;
  hasBuiltInOverride: boolean;
  isHydrated: boolean;
  isSavingScenario: boolean;
  createScenario: (draft: ScenarioDraftValues) => Promise<ManagedFakeCallScenario>;
  updateCustomScenario: (id: string, draft: ScenarioDraftValues) => Promise<ManagedFakeCallScenario | null>;
  duplicateScenario: (id: string) => Promise<ManagedFakeCallScenario | null>;
  deleteCustomScenario: (id: string) => Promise<void>;
  resetBuiltInScenario: (id: string) => Promise<void>;
  getScenarioById: (id: string) => ManagedFakeCallScenario | undefined;
  checkInEnabled: boolean;
  setCheckInEnabled: (value: SetStateAction<boolean>) => void;
  checkInMinutes: number;
  setCheckInMinutes: (value: SetStateAction<number>) => void;
};

const defaultVoiceId = voiceOptions[0]?.id ?? '';

const SafetyPlanContext = createContext<SafetyPlanContextValue | null>(null);

export function SafetyPlanProvider({ children }: { children: ReactNode }) {
  const [customScenarios, setCustomScenarios] = useState<ManagedFakeCallScenario[]>([]);
  const [builtInOverrides, setBuiltInOverrides] = useState<Record<string, BuiltInScenarioOverride>>({});
  const [selectedScenarioId, setSelectedScenarioIdState] = useState(
    () => applyBuiltInOverrides({})[0]?.id ?? ''
  );
  const [selectedVoiceId, setSelectedVoiceIdState] = useState(defaultVoiceId);
  const [checkInEnabled, setCheckInEnabledState] = useState(true);
  const [checkInMinutes, setCheckInMinutesState] = useState(1);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSavingScenario, setIsSavingScenario] = useState(false);
  const persistQueueRef = useRef(Promise.resolve());

  const builtinScenarios = useMemo(
    () => applyBuiltInOverrides(builtInOverrides),
    [builtInOverrides]
  );

  const scenarios = useMemo(
    () => [...builtinScenarios, ...customScenarios],
    [builtinScenarios, customScenarios]
  );

  const selectedScenario = useMemo(
    () => scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? scenarios[0],
    [scenarios, selectedScenarioId]
  );

  const queuePersist = useCallback(
    async ({
      nextCustomScenarios,
      nextBuiltInOverrides,
      nextSelectedScenarioId,
      nextSelectedVoiceId,
      nextCheckInEnabled,
      nextCheckInMinutes,
    }: {
      nextCustomScenarios: ManagedFakeCallScenario[];
      nextBuiltInOverrides: Record<string, BuiltInScenarioOverride>;
      nextSelectedScenarioId: string;
      nextSelectedVoiceId: string;
      nextCheckInEnabled: boolean;
      nextCheckInMinutes: number;
    }) => {
      const payload = {
        version: 1 as const,
        customScenarios: nextCustomScenarios.map(toPersistedCustomScenario),
        builtInOverrides: nextBuiltInOverrides,
        selectedScenarioId: nextSelectedScenarioId,
        selectedVoiceId: nextSelectedVoiceId,
        checkInEnabled: nextCheckInEnabled,
        checkInMinutes: nextCheckInMinutes,
      };

      persistQueueRef.current = persistQueueRef.current
        .catch((error) => {
          console.warn('[SafetyPlanContext] Previous persistence task failed.', error);
        })
        .then(async () => {
          const saved = await savePersistedSafetyPlanState(payload);
          if (!saved) {
            console.warn('[SafetyPlanContext] Persisted safety plan state could not be saved.');
          }
        });

      await persistQueueRef.current;
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      try {
        const persisted = await loadPersistedSafetyPlanState();
        if (cancelled) {
          return;
        }

        const hydratedCustomScenarios: ManagedFakeCallScenario[] = persisted.customScenarios.map((scenario) => ({
          ...scenario,
          source: 'custom',
        }));
        const hydratedBuiltIns = applyBuiltInOverrides(persisted.builtInOverrides);
        const allScenarios = [...hydratedBuiltIns, ...hydratedCustomScenarios];
        const fallbackScenario = allScenarios[0];
        const resolvedSelectedScenario =
          allScenarios.find((scenario) => scenario.id === persisted.selectedScenarioId) ?? fallbackScenario;
        const resolvedVoiceId = normalizeVoiceId(
          persisted.selectedVoiceId || resolvedSelectedScenario?.preferredVoiceId || defaultVoiceId
        );

        setCustomScenarios(hydratedCustomScenarios);
        setBuiltInOverrides(persisted.builtInOverrides);
        setSelectedScenarioIdState(resolvedSelectedScenario?.id ?? '');
        setSelectedVoiceIdState(resolvedVoiceId);
        setCheckInEnabledState(persisted.checkInEnabled ?? true);
        setCheckInMinutesState(clampCheckInMinutes(persisted.checkInMinutes));
      } catch (error) {
        console.warn(
          '[SafetyPlanContext] Failed to hydrate persisted safety plan state. Using defaults.',
          error
        );

        const fallbackState = getDefaultPersistedSafetyPlanState();
        const fallbackBuiltIns = applyBuiltInOverrides(fallbackState.builtInOverrides);
        const fallbackScenario = fallbackBuiltIns[0];

        if (!cancelled) {
          setCustomScenarios([]);
          setBuiltInOverrides({});
          setSelectedScenarioIdState(fallbackScenario?.id ?? '');
          setSelectedVoiceIdState(
            normalizeVoiceId(fallbackState.selectedVoiceId || fallbackScenario?.preferredVoiceId || defaultVoiceId)
          );
          setCheckInEnabledState(fallbackState.checkInEnabled ?? true);
          setCheckInMinutesState(clampCheckInMinutes(fallbackState.checkInMinutes));
        }
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    };

    void hydrate().catch((error) => {
      console.warn('[SafetyPlanContext] Unhandled hydration failure. Using in-memory defaults.', error);
      if (!cancelled) {
        const fallbackState = getDefaultPersistedSafetyPlanState();
        const fallbackBuiltIns = applyBuiltInOverrides(fallbackState.builtInOverrides);
        const fallbackScenario = fallbackBuiltIns[0];
        setCustomScenarios([]);
        setBuiltInOverrides({});
        setSelectedScenarioIdState(fallbackScenario?.id ?? '');
        setSelectedVoiceIdState(
          normalizeVoiceId(fallbackState.selectedVoiceId || fallbackScenario?.preferredVoiceId || defaultVoiceId)
        );
        setCheckInEnabledState(fallbackState.checkInEnabled ?? true);
        setCheckInMinutesState(clampCheckInMinutes(fallbackState.checkInMinutes));
        setIsHydrated(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const getScenarioById = useCallback(
    (id: string) => scenarios.find((scenario) => scenario.id === id),
    [scenarios]
  );

  const setSelectedScenarioId = useCallback(
    (id: string) => {
      const scenario = scenarios.find((item) => item.id === id) ?? scenarios[0];
      if (!scenario) {
        return;
      }

      const nextVoiceId = normalizeVoiceId(scenario.preferredVoiceId || selectedVoiceId || defaultVoiceId);

      setSelectedScenarioIdState(scenario.id);
      setSelectedVoiceIdState(nextVoiceId);

      if (!isHydrated) {
        return;
      }

      void queuePersist({
        nextCustomScenarios: customScenarios,
        nextBuiltInOverrides: builtInOverrides,
        nextSelectedScenarioId: scenario.id,
        nextSelectedVoiceId: nextVoiceId,
        nextCheckInEnabled: checkInEnabled,
        nextCheckInMinutes: checkInMinutes,
      });
    },
    [builtInOverrides, checkInEnabled, checkInMinutes, customScenarios, isHydrated, queuePersist, scenarios, selectedVoiceId]
  );

  const setSelectedVoiceId = useCallback(
    (voiceId: string) => {
      const nextVoiceId = normalizeVoiceId(voiceId);
      setSelectedVoiceIdState(nextVoiceId);

      if (!isHydrated) {
        return;
      }

      void queuePersist({
        nextCustomScenarios: customScenarios,
        nextBuiltInOverrides: builtInOverrides,
        nextSelectedScenarioId: selectedScenarioId || scenarios[0]?.id || '',
        nextSelectedVoiceId: nextVoiceId,
        nextCheckInEnabled: checkInEnabled,
        nextCheckInMinutes: checkInMinutes,
      });
    },
    [builtInOverrides, checkInEnabled, checkInMinutes, customScenarios, isHydrated, queuePersist, scenarios, selectedScenarioId]
  );

  const createScenario = useCallback(
    async (draft: ScenarioDraftValues) => {
      setIsSavingScenario(true);

      try {
        const newScenario = createCustomScenarioFromDraft({
          ...draft,
          preferredVoiceId: normalizeVoiceId(draft.preferredVoiceId),
        });
        const nextCustomScenarios = [...customScenarios, newScenario];
        const nextSelectedVoiceId = normalizeVoiceId(newScenario.preferredVoiceId);

        setCustomScenarios(nextCustomScenarios);
        setSelectedScenarioIdState(newScenario.id);
        setSelectedVoiceIdState(nextSelectedVoiceId);

        await queuePersist({
          nextCustomScenarios,
          nextBuiltInOverrides: builtInOverrides,
          nextSelectedScenarioId: newScenario.id,
          nextSelectedVoiceId,
          nextCheckInEnabled: checkInEnabled,
          nextCheckInMinutes: checkInMinutes,
        });

        return newScenario;
      } finally {
        setIsSavingScenario(false);
      }
    },
    [builtInOverrides, checkInEnabled, checkInMinutes, customScenarios, queuePersist]
  );

  const updateCustomScenario = useCallback(
    async (id: string, draft: ScenarioDraftValues) => {
      const currentScenario = customScenarios.find((scenario) => scenario.id === id);
      if (!currentScenario) {
        return null;
      }

      setIsSavingScenario(true);

      try {
        const updatedScenario: ManagedFakeCallScenario = {
          ...createCustomScenarioFromDraft(
            {
              ...draft,
              preferredVoiceId: normalizeVoiceId(draft.preferredVoiceId),
            },
            id
          ),
          source: 'custom',
          createdAt: currentScenario.createdAt ?? Date.now(),
          updatedAt: Date.now(),
        };
        const nextCustomScenarios = customScenarios.map((scenario) =>
          scenario.id === id ? updatedScenario : scenario
        );
        const nextSelectedScenarioId = selectedScenarioId === id ? id : selectedScenarioId;
        const nextSelectedVoiceId =
          selectedScenarioId === id
            ? normalizeVoiceId(updatedScenario.preferredVoiceId)
            : selectedVoiceId;

        setCustomScenarios(nextCustomScenarios);
        if (selectedScenarioId === id) {
          setSelectedVoiceIdState(nextSelectedVoiceId);
        }

        await queuePersist({
          nextCustomScenarios,
          nextBuiltInOverrides: builtInOverrides,
          nextSelectedScenarioId,
          nextSelectedVoiceId,
          nextCheckInEnabled: checkInEnabled,
          nextCheckInMinutes: checkInMinutes,
        });

        return updatedScenario;
      } finally {
        setIsSavingScenario(false);
      }
    },
    [builtInOverrides, checkInEnabled, checkInMinutes, customScenarios, queuePersist, selectedScenarioId, selectedVoiceId]
  );

  const duplicateScenario = useCallback(
    async (id: string) => {
      const scenario = scenarios.find((item) => item.id === id);
      if (!scenario || scenario.source !== 'custom') {
        return null;
      }

      setIsSavingScenario(true);

      try {
        const duplicatedScenario = buildDuplicateScenario(scenario, selectedVoiceId);
        const nextCustomScenarios = [...customScenarios, duplicatedScenario];
        const nextSelectedVoiceId = normalizeVoiceId(duplicatedScenario.preferredVoiceId || selectedVoiceId);

        setCustomScenarios(nextCustomScenarios);
        setSelectedScenarioIdState(duplicatedScenario.id);
        setSelectedVoiceIdState(nextSelectedVoiceId);

        await queuePersist({
          nextCustomScenarios,
          nextBuiltInOverrides: builtInOverrides,
          nextSelectedScenarioId: duplicatedScenario.id,
          nextSelectedVoiceId,
          nextCheckInEnabled: checkInEnabled,
          nextCheckInMinutes: checkInMinutes,
        });

        return duplicatedScenario;
      } finally {
        setIsSavingScenario(false);
      }
    },
    [builtInOverrides, checkInEnabled, checkInMinutes, customScenarios, queuePersist, scenarios, selectedVoiceId]
  );

  const deleteCustomScenario = useCallback(
    async (id: string) => {
      const scenario = customScenarios.find((item) => item.id === id);
      if (!scenario) {
        return;
      }

      setIsSavingScenario(true);

      try {
        const nextCustomScenarios = customScenarios.filter((item) => item.id !== id);
        const fallbackScenario =
          builtinScenarios[0] ?? nextCustomScenarios[0] ?? scenarios.find((item) => item.id !== id);
        const nextSelectedScenarioId =
          selectedScenarioId === id ? fallbackScenario?.id ?? '' : selectedScenarioId;
        const nextSelectedVoiceId =
          selectedScenarioId === id
            ? normalizeVoiceId(fallbackScenario?.preferredVoiceId || selectedVoiceId)
            : selectedVoiceId;

        setCustomScenarios(nextCustomScenarios);
        if (selectedScenarioId === id) {
          setSelectedScenarioIdState(nextSelectedScenarioId);
          setSelectedVoiceIdState(nextSelectedVoiceId);
        }

        await queuePersist({
          nextCustomScenarios,
          nextBuiltInOverrides: builtInOverrides,
          nextSelectedScenarioId,
          nextSelectedVoiceId,
          nextCheckInEnabled: checkInEnabled,
          nextCheckInMinutes: checkInMinutes,
        });
      } finally {
        setIsSavingScenario(false);
      }
    },
    [builtInOverrides, builtinScenarios, checkInEnabled, checkInMinutes, customScenarios, queuePersist, scenarios, selectedScenarioId, selectedVoiceId]
  );

  const resetBuiltInScenario = useCallback(
    async (id: string) => {
      if (!builtinScenarios.some((scenario) => scenario.id === id)) {
        return;
      }

      const { [id]: _removed, ...nextBuiltInOverrides } = builtInOverrides;
      const resetScenario = applyBuiltInOverrides(nextBuiltInOverrides).find((scenario) => scenario.id === id);
      const nextSelectedVoiceId =
        selectedScenarioId === id
          ? normalizeVoiceId(resetScenario?.preferredVoiceId || selectedVoiceId)
          : selectedVoiceId;

      setBuiltInOverrides(nextBuiltInOverrides);
      if (selectedScenarioId === id) {
        setSelectedVoiceIdState(nextSelectedVoiceId);
      }

      await queuePersist({
        nextCustomScenarios: customScenarios,
        nextBuiltInOverrides,
        nextSelectedScenarioId: selectedScenarioId || builtinScenarios[0]?.id || '',
        nextSelectedVoiceId,
        nextCheckInEnabled: checkInEnabled,
        nextCheckInMinutes: checkInMinutes,
      });
    },
    [builtInOverrides, builtinScenarios, checkInEnabled, checkInMinutes, customScenarios, queuePersist, selectedScenarioId, selectedVoiceId]
  );

  const setCheckInEnabled = useCallback(
    (value: SetStateAction<boolean>) => {
      setCheckInEnabledState((prev) => {
        const next = typeof value === 'function' ? (value as (p: boolean) => boolean)(prev) : value;
        if (isHydrated) {
          void queuePersist({
            nextCustomScenarios: customScenarios,
            nextBuiltInOverrides: builtInOverrides,
            nextSelectedScenarioId: selectedScenarioId || scenarios[0]?.id || '',
            nextSelectedVoiceId: selectedVoiceId,
            nextCheckInEnabled: next,
            nextCheckInMinutes: checkInMinutes,
          });
        }
        return next;
      });
    },
    [builtInOverrides, checkInMinutes, customScenarios, isHydrated, queuePersist, scenarios, selectedScenarioId, selectedVoiceId]
  );

  const setCheckInMinutes = useCallback(
    (value: SetStateAction<number>) => {
      setCheckInMinutesState((prev) => {
        const raw = typeof value === 'function' ? (value as (p: number) => number)(prev) : value;
        const next = clampCheckInMinutes(raw);
        if (isHydrated) {
          void queuePersist({
            nextCustomScenarios: customScenarios,
            nextBuiltInOverrides: builtInOverrides,
            nextSelectedScenarioId: selectedScenarioId || scenarios[0]?.id || '',
            nextSelectedVoiceId: selectedVoiceId,
            nextCheckInEnabled: checkInEnabled,
            nextCheckInMinutes: next,
          });
        }
        return next;
      });
    },
    [builtInOverrides, checkInEnabled, customScenarios, isHydrated, queuePersist, scenarios, selectedScenarioId, selectedVoiceId]
  );

  const value = useMemo<SafetyPlanContextValue>(
    () => ({
      scenarios,
      builtinScenarios,
      customScenarios,
      selectedScenarioId,
      setSelectedScenarioId,
      selectedVoiceId,
      setSelectedVoiceId,
      selectedScenario,
      selectedScenarioIsCustom: selectedScenario?.source === 'custom',
      hasBuiltInOverride:
        selectedScenario?.source === 'builtin' ? Boolean(builtInOverrides[selectedScenario.id]) : false,
      isHydrated,
      isSavingScenario,
      createScenario,
      updateCustomScenario,
      duplicateScenario,
      deleteCustomScenario,
      resetBuiltInScenario,
      getScenarioById,
      checkInEnabled,
      setCheckInEnabled,
      checkInMinutes,
      setCheckInMinutes,
    }),
    [
      builtInOverrides,
      builtinScenarios,
      checkInEnabled,
      checkInMinutes,
      createScenario,
      customScenarios,
      deleteCustomScenario,
      duplicateScenario,
      getScenarioById,
      isHydrated,
      isSavingScenario,
      resetBuiltInScenario,
      scenarios,
      selectedScenario,
      selectedScenarioId,
      selectedVoiceId,
      setCheckInEnabled,
      setCheckInMinutes,
      setSelectedScenarioId,
      setSelectedVoiceId,
      updateCustomScenario,
    ]
  );

  return <SafetyPlanContext.Provider value={value}>{children}</SafetyPlanContext.Provider>;
}

export function useSafetyPlan() {
  const ctx = useContext(SafetyPlanContext);
  if (!ctx) {
    throw new Error('useSafetyPlan must be used within SafetyPlanProvider');
  }
  return ctx;
}
