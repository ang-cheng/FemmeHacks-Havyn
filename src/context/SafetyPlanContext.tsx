import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { fakeCallScenarios } from '../../scenarios/fakeCallScenarios';
import type { FakeCallScenario } from '../../scenarios/types';
import { voiceOptions } from '@/data/safety';

type SafetyPlanContextValue = {
  selectedScenarioId: string;
  setSelectedScenarioId: (id: string) => void;
  selectedVoiceId: string;
  setSelectedVoiceId: (id: string) => void;
  selectedScenario: FakeCallScenario;
};

const SafetyPlanContext = createContext<SafetyPlanContextValue | null>(null);

export function SafetyPlanProvider({ children }: { children: ReactNode }) {
  const [selectedScenarioId, setSelectedScenarioId] = useState(
    fakeCallScenarios[0]?.id ?? ''
  );
  const [selectedVoiceId, setSelectedVoiceId] = useState(
    voiceOptions[0]?.id ?? ''
  );

  const selectedScenario = useMemo(
    () =>
      fakeCallScenarios.find((s) => s.id === selectedScenarioId) ??
      fakeCallScenarios[0],
    [selectedScenarioId]
  );

  const value = useMemo(
    () => ({
      selectedScenarioId,
      setSelectedScenarioId,
      selectedVoiceId,
      setSelectedVoiceId,
      selectedScenario,
    }),
    [selectedScenarioId, selectedVoiceId, selectedScenario]
  );

  return (
    <SafetyPlanContext.Provider value={value}>{children}</SafetyPlanContext.Provider>
  );
}

export function useSafetyPlan() {
  const ctx = useContext(SafetyPlanContext);
  if (!ctx) {
    throw new Error('useSafetyPlan must be used within SafetyPlanProvider');
  }
  return ctx;
}
