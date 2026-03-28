import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

type CallStage = 'idle' | 'countdown' | 'active';

type CallContextValue = {
  callStage: CallStage;
  countdown: number;
  callDuration: number;
  isCallActive: boolean;
  isCallMinimized: boolean;
  startCall: () => void;
  endCall: () => void;
  minimizeCall: () => void;
  expandCall: () => void;
};

const CallContext = createContext<CallContextValue | null>(null);

export function CallProvider({ children }: { children: ReactNode }) {
  const [callStage, setCallStage] = useState<CallStage>('idle');
  const [countdown, setCountdown] = useState(3);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallMinimized, setIsCallMinimized] = useState(false);

  useEffect(() => {
    if (callStage !== 'countdown') {
      return;
    }

    if (countdown <= 0) {
      setCallStage('active');
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((current) => current - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [callStage, countdown]);

  useEffect(() => {
    if (callStage !== 'active') {
      return;
    }

    const interval = setInterval(() => {
      setCallDuration((current) => current + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [callStage]);

  const value = useMemo<CallContextValue>(
    () => ({
      callStage,
      countdown,
      callDuration,
      isCallActive: callStage !== 'idle',
      isCallMinimized,
      startCall: () => {
        if (callStage !== 'idle') {
          setIsCallMinimized(false);
          return;
        }

        setCallStage('countdown');
        setCountdown(3);
        setCallDuration(0);
        setIsCallMinimized(false);
      },
      endCall: () => {
        setCallStage('idle');
        setCountdown(3);
        setCallDuration(0);
        setIsCallMinimized(false);
      },
      minimizeCall: () => {
        if (callStage === 'active') {
          setIsCallMinimized(true);
        }
      },
      expandCall: () => {
        if (callStage !== 'idle') {
          setIsCallMinimized(false);
        }
      },
    }),
    [callDuration, callStage, countdown, isCallMinimized]
  );

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCall() {
  const context = useContext(CallContext);

  if (!context) {
    throw new Error('useCall must be used within CallProvider');
  }

  return context;
}
