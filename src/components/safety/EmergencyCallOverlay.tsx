import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

import { HavynColors } from '@/constants/havyn';
import { useSafetyPlan } from '@/context/SafetyPlanContext';
import { useCall } from '@/context/call';
import { fetchTtsBase64 } from '@/lib/tts';

type EmergencyCallOverlayProps = {
  isMapVisible: boolean;
  onExpandCall: () => void;
  onMinimizeToMap: () => void;
};

const caller = {
  name: 'Sarah',
  label: 'mobile',
};

export function EmergencyCallOverlay({
  isMapVisible,
  onExpandCall,
  onMinimizeToMap,
}: EmergencyCallOverlayProps) {
  const insets = useSafeAreaInsets();
  const { selectedScenario, selectedVoiceId } = useSafetyPlan();
  const {
    callDuration,
    callStage,
    countdown,
    endCall,
    expandCall,
    isCallMinimized,
    minimizeCall,
  } = useCall();

  const transcript = selectedScenario.transcript;
  const soundRef = useRef<Audio.Sound | null>(null);
  const cancelledRef = useRef(false);
  const countdownPulse = useRef(new Animated.Value(0)).current;
  const avatarPulse = useRef(new Animated.Value(0)).current;
  const bars = useRef(Array.from({ length: 12 }, () => new Animated.Value(0.35))).current;

  const [userLineIndex, setUserLineIndex] = useState<number | null>(null);
  const [isPlayingCaller, setIsPlayingCaller] = useState(false);
  const [scriptFinished, setScriptFinished] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);

  const unloadSound = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch {
        /* ignore */
      }
      soundRef.current = null;
    }
  }, []);

  const playCallerLine = useCallback(
    async (text: string) => {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
      });

      const base64 = await fetchTtsBase64(text, selectedVoiceId);
      const uri = `data:audio/mpeg;base64,${base64}`;

      await unloadSound();

      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      soundRef.current = sound;

      await new Promise<void>((resolve, reject) => {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) {
            if (status.error) {
              reject(new Error(status.error));
            }
            return;
          }

          if (status.didJustFinish) {
            resolve();
          }
        });
      });
    },
    [selectedVoiceId, unloadSound]
  );

  const playCallerLinesFrom = useCallback(
    async (startIndex: number) => {
      let nextIndex = startIndex;

      while (nextIndex < transcript.length && transcript[nextIndex].speaker === 'caller') {
        if (cancelledRef.current) {
          return;
        }

        await playCallerLine(transcript[nextIndex].text);
        nextIndex += 1;
      }

      if (cancelledRef.current) {
        return;
      }

      if (nextIndex < transcript.length && transcript[nextIndex].speaker === 'user') {
        setUserLineIndex(nextIndex);
        setScriptFinished(false);
      } else {
        setUserLineIndex(null);
        setScriptFinished(true);
      }
    },
    [playCallerLine, transcript]
  );

  useEffect(() => {
    if (callStage === 'idle') {
      cancelledRef.current = true;
      void unloadSound();
      setUserLineIndex(null);
      setIsPlayingCaller(false);
      setScriptFinished(false);
      setTtsError(null);
      countdownPulse.setValue(0);
      avatarPulse.setValue(0);
      bars.forEach((bar) => bar.setValue(0.35));
      return;
    }

    cancelledRef.current = false;
  }, [avatarPulse, bars, callStage, countdownPulse, unloadSound]);

  useEffect(() => {
    if (callStage !== 'countdown') {
      countdownPulse.stopAnimation();
      countdownPulse.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.timing(countdownPulse, {
        toValue: 1,
        duration: 1800,
        useNativeDriver: true,
      })
    );

    loop.start();

    return () => {
      loop.stop();
      countdownPulse.setValue(0);
    };
  }, [callStage, countdownPulse]);

  useEffect(() => {
    if (callStage !== 'active') {
      return;
    }

    cancelledRef.current = false;

    const runInitial = async () => {
      setTtsError(null);
      setUserLineIndex(null);
      setScriptFinished(false);
      setIsPlayingCaller(true);

      try {
        await playCallerLinesFrom(0);
      } catch (error) {
        if (!cancelledRef.current) {
          setTtsError(error instanceof Error ? error.message : 'Could not play audio');
        }
      } finally {
        if (!cancelledRef.current) {
          setIsPlayingCaller(false);
        }
      }
    };

    void runInitial();

    return () => {
      cancelledRef.current = true;
      void unloadSound();
    };
  }, [callStage, playCallerLinesFrom, selectedScenario.id, unloadSound]);

  useEffect(() => {
    if (callStage !== 'active') {
      avatarPulse.stopAnimation();
      avatarPulse.setValue(0);
      bars.forEach((bar) => bar.setValue(0.35));
      return;
    }

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(avatarPulse, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(avatarPulse, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );

    glowLoop.start();

    const barLoops = bars.map((bar, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 45),
          Animated.timing(bar, {
            toValue: 1,
            duration: 420,
            useNativeDriver: true,
          }),
          Animated.timing(bar, {
            toValue: 0.35,
            duration: 420,
            useNativeDriver: true,
          }),
        ])
      )
    );

    barLoops.forEach((loop) => loop.start());

    return () => {
      glowLoop.stop();
      avatarPulse.setValue(0);
      barLoops.forEach((loop) => loop.stop());
      bars.forEach((bar) => bar.setValue(0.35));
    };
  }, [avatarPulse, bars, callStage]);

  const handleNextPrompt = useCallback(async () => {
    if (isPlayingCaller || scriptFinished) {
      return;
    }

    const startFrom = userLineIndex === null ? 0 : userLineIndex + 1;

    setTtsError(null);
    cancelledRef.current = false;
    setIsPlayingCaller(true);

    try {
      await playCallerLinesFrom(startFrom);
    } catch (error) {
      if (!cancelledRef.current) {
        setTtsError(error instanceof Error ? error.message : 'Could not play audio');
      }
    } finally {
      if (!cancelledRef.current) {
        setIsPlayingCaller(false);
      }
    }
  }, [isPlayingCaller, playCallerLinesFrom, scriptFinished, userLineIndex]);

  const durationLabel = useMemo(() => formatTime(callDuration), [callDuration]);

  const countdownScale = countdownPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.9],
  });

  const countdownOpacity = countdownPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 0],
  });

  const avatarScale = avatarPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  const avatarOpacity = avatarPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.28, 0.08],
  });

  const userPromptText = userLineIndex !== null ? transcript[userLineIndex]?.text ?? '' : '';
  const nextDisabled = isPlayingCaller || scriptFinished || (userLineIndex === null && !ttsError);

  const promptLabel = scriptFinished ? 'Script' : isPlayingCaller ? 'Call' : 'Say this';
  const promptText = ttsError
    ? ttsError
    : scriptFinished
      ? 'You reached the end of this script. Stay on the line as long as you need.'
      : isPlayingCaller
        ? 'Listening to caller…'
        : userPromptText;

  if (callStage === 'idle') {
    return null;
  }

  if (callStage === 'active' && isCallMinimized) {
    return (
      <View pointerEvents="box-none" style={styles.minimizedLayer}>
        <View
          style={[
            styles.minimizedWrap,
            {
              paddingTop: Math.max(insets.top, 14),
            },
          ]}
        >
          <View style={styles.minimizedCard}>
            <View style={styles.minimizedTopRow}>
              <View style={styles.minimizedBadge}>
                <View style={styles.minimizedBadgeDot} />
                <Text style={styles.minimizedBadgeText}>{durationLabel}</Text>
              </View>
              <View style={styles.minimizedActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    expandCall();
                    onExpandCall();
                  }}
                  style={styles.iconButton}
                >
                  <Feather color={HavynColors.white} name="maximize-2" size={15} />
                </Pressable>
                <Pressable accessibilityRole="button" onPress={endCall} style={styles.iconButtonDanger}>
                  <Feather color={HavynColors.white} name="phone-off" size={15} />
                </Pressable>
              </View>
            </View>

            <Text numberOfLines={3} style={styles.minimizedPromptText}>
              {promptText}
            </Text>

            <View style={styles.minimizedFooter}>
              <Pressable
                accessibilityRole="button"
                disabled={nextDisabled}
                onPress={() => void handleNextPrompt()}
                style={[styles.minimizedNextButton, nextDisabled && styles.promptButtonDisabled]}
              >
                <Text
                  style={[
                    styles.minimizedNextButtonText,
                    nextDisabled && styles.promptButtonTextDisabled,
                  ]}
                >
                  Next prompt
                </Text>
                <Feather
                  color={nextDisabled ? 'rgba(255,255,255,0.4)' : HavynColors.white}
                  name="chevron-right"
                  size={14}
                />
              </Pressable>
              {!isMapVisible ? (
                <Pressable accessibilityRole="button" onPress={onMinimizeToMap} style={styles.minimizedMapButton}>
                  <Feather color={HavynColors.white} name="map-pin" size={14} />
                  <Text style={styles.minimizedMapButtonText}>Open map</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fullscreenLayer}>
      {callStage === 'countdown' ? (
        <LinearGradient
          colors={[HavynColors.accent, '#F86464', HavynColors.accentDark]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.countdownScreen}
        >
          <Animated.View
            style={[
              styles.countdownRing,
              {
                transform: [{ scale: countdownScale }],
                opacity: countdownOpacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.countdownRingSecondary,
              {
                transform: [{ scale: countdownScale }],
                opacity: countdownOpacity,
              },
            ]}
          />
          <View style={styles.countdownContent}>
            <View style={styles.countdownCircle}>
              <Text style={styles.countdownNumber}>{countdown}</Text>
            </View>
            <Text style={styles.countdownTitle}>Starting safety call...</Text>
          </View>
        </LinearGradient>
      ) : (
        <LinearGradient
          colors={[HavynColors.overlayStart, HavynColors.overlayMid, HavynColors.overlayEnd]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.activeScreen}
        >
          <ScrollView
            bounces={false}
            contentContainerStyle={[
              styles.activeContent,
              {
                paddingTop: Math.max(insets.top, 18),
                paddingBottom: Math.max(insets.bottom, 24),
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.activeHeaderRow}>
              <View style={styles.headerSpacer} />
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  minimizeCall();
                  onMinimizeToMap();
                }}
                style={styles.minimizeButton}
              >
                <Feather color={HavynColors.white} name="minimize-2" size={18} />
              </Pressable>
            </View>

            <View style={styles.promptCard}>
              <Text style={styles.promptLabel}>{promptLabel}</Text>
              <Text style={styles.promptText}>{promptText}</Text>
              <Pressable
                accessibilityRole="button"
                disabled={nextDisabled}
                onPress={() => void handleNextPrompt()}
                style={[styles.promptButton, nextDisabled && styles.promptButtonDisabled]}
              >
                <Text
                  style={[
                    styles.promptButtonText,
                    nextDisabled && styles.promptButtonTextDisabled,
                  ]}
                >
                  Next prompt
                </Text>
                <Feather
                  color={nextDisabled ? 'rgba(255,255,255,0.4)' : HavynColors.white}
                  name="chevron-right"
                  size={16}
                />
              </Pressable>
            </View>

            <View style={styles.callerMeta}>
              <Text style={styles.callerLabel}>{caller.label}</Text>
              <Text style={styles.callerName}>{caller.name}</Text>
              <Text style={styles.callDuration}>{durationLabel}</Text>
            </View>

            <View style={styles.controlsSection}>
              <View style={styles.controlsGrid}>
                <ControlButton icon="mic-off" label="mute" />
                <ControlButton icon="hash" label="keypad" />
                <ControlButton icon="volume-2" label="audio" />
                <ControlButton icon="user-plus" label="add call" />
                <ControlButton icon="users" label="contacts" />
                <ControlButton icon="speaker" label="speaker" />
              </View>

              <View style={styles.footerButtons}>
                <Pressable accessibilityRole="button" onPress={endCall} style={styles.endCallButton}>
                  <Feather
                    color={HavynColors.white}
                    name="phone"
                    size={30}
                    style={styles.endCallIcon}
                  />
                </Pressable>
                <Pressable accessibilityRole="button" onPress={endCall} style={styles.safeButton}>
                  <Text style={styles.safeButtonText}>I'm safe now</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      )}
    </View>
  );
}

function ControlButton({
  icon,
  label,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
}) {
  return (
    <Pressable accessibilityRole="button" style={styles.controlButton}>
      <View style={styles.controlButtonIconWrap}>
        <Feather color={HavynColors.white} name={icon} size={22} />
      </View>
      <Text style={styles.controlButtonLabel}>{label}</Text>
    </Pressable>
  );
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  fullscreenLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
  },
  minimizedLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
  },
  minimizedWrap: {
    paddingHorizontal: 18,
  },
  minimizedCard: {
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(19, 22, 34, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: HavynColors.black,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.24,
    shadowRadius: 24,
    elevation: 14,
    gap: 12,
  },
  minimizedTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  minimizedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  minimizedBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#4FD18A',
  },
  minimizedBadgeText: {
    color: HavynColors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  minimizedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconButtonDanger: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(226, 84, 84, 0.86)',
  },
  minimizedPromptText: {
    color: HavynColors.white,
    fontSize: 14,
    lineHeight: 20,
  },
  minimizedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  minimizedNextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: HavynColors.accent,
  },
  minimizedNextButtonText: {
    color: HavynColors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  minimizedMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  minimizedMapButtonText: {
    color: HavynColors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  countdownScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  countdownRing: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  countdownRingSecondary: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  countdownContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownCircle: {
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: HavynColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: HavynColors.black,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  countdownNumber: {
    color: HavynColors.text,
    fontSize: 58,
    fontWeight: '300',
  },
  countdownTitle: {
    color: HavynColors.white,
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  countdownSubtitle: {
    color: 'rgba(255, 255, 255, 0.86)',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 280,
  },
  activeScreen: {
    flex: 1,
  },
  activeContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    justifyContent: 'space-between',
    gap: 24,
  },
  activeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 42,
    height: 42,
  },
  minimizeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  promptCard: {
    borderRadius: 28,
    backgroundColor: HavynColors.overlayCard,
    borderWidth: 1,
    borderColor: HavynColors.overlayCardBorder,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 12,
  },
  promptLabel: {
    color: 'rgba(255, 255, 255, 0.56)',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  promptText: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 15,
    lineHeight: 22,
  },
  promptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  promptButtonDisabled: {
    opacity: 0.55,
  },
  promptButtonText: {
    color: HavynColors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  promptButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.55)',
  },
  callerMeta: {
    alignItems: 'center',
    gap: 6,
  },
  callerLabel: {
    color: 'rgba(255, 255, 255, 0.56)',
    fontSize: 15,
  },
  callerName: {
    color: HavynColors.white,
    fontSize: 46,
    fontWeight: '300',
    letterSpacing: -1,
  },
  callDuration: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 18,
  },
  avatarSection: {
    alignItems: 'center',
    gap: 22,
  },
  avatarGlow: {
    position: 'absolute',
    top: -10,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(79, 140, 255, 0.28)',
  },
  avatarCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F8CFF',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.32,
    shadowRadius: 24,
    elevation: 12,
  },
  avatarInitial: {
    color: HavynColors.white,
    fontSize: 52,
    fontWeight: '300',
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 42,
  },
  waveBar: {
    width: 4,
    height: 28,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  controlsSection: {
    gap: 32,
  },
  controlsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 18,
  },
  controlButton: {
    width: '31%',
    alignItems: 'center',
    gap: 8,
  },
  controlButtonIconWrap: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonLabel: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 12,
    fontWeight: '600',
  },
  footerButtons: {
    alignItems: 'center',
    gap: 16,
  },
  endCallButton: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E25454',
    shadowColor: '#E25454',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.32,
    shadowRadius: 22,
    elevation: 14,
  },
  endCallIcon: {
    transform: [{ rotate: '135deg' }],
  },
  safeButton: {
    minWidth: 200,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  safeButtonText: {
    color: HavynColors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
