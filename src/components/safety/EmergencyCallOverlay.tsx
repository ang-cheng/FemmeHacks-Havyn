import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

import { HavynColors } from '@/constants/havyn';
import { fetchTtsBase64 } from '@/lib/tts';

import type { TranscriptLine } from '../../../scenarios/types';

type EmergencyCallOverlayProps = {
  visible: boolean;
  onSafe: () => void;
  transcript: TranscriptLine[];
  voiceId: string;
};

const caller = {
  name: 'Sarah',
  label: 'mobile',
  initial: 'S',
};

export function EmergencyCallOverlay({
  visible,
  onSafe,
  transcript,
  voiceId,
}: EmergencyCallOverlayProps) {
  const insets = useSafeAreaInsets();
  const [countdown, setCountdown] = useState(3);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [userLineIndex, setUserLineIndex] = useState<number | null>(null);
  const [isPlayingCaller, setIsPlayingCaller] = useState(false);
  const [scriptFinished, setScriptFinished] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);

  const soundRef = useRef<Audio.Sound | null>(null);
  const cancelledRef = useRef(false);

  const countdownPulse = useRef(new Animated.Value(0)).current;
  const avatarPulse = useRef(new Animated.Value(0)).current;
  const bars = useRef(Array.from({ length: 12 }, () => new Animated.Value(0.35))).current;

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

      const base64 = await fetchTtsBase64(text, voiceId);
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
    [unloadSound, voiceId]
  );

  const playCallerLinesFrom = useCallback(
    async (startIndex: number) => {
      let i = startIndex;
      while (i < transcript.length && transcript[i].speaker === 'caller') {
        if (cancelledRef.current) {
          return;
        }
        await playCallerLine(transcript[i].text);
        i += 1;
      }
      if (cancelledRef.current) {
        return;
      }
      if (i < transcript.length && transcript[i].speaker === 'user') {
        setUserLineIndex(i);
        setScriptFinished(false);
      } else {
        setUserLineIndex(null);
        setScriptFinished(true);
      }
    },
    [playCallerLine, transcript]
  );

  useEffect(() => {
    if (!visible) {
      setCountdown(3);
      setIsCallActive(false);
      setCallDuration(0);
      setUserLineIndex(null);
      setIsPlayingCaller(false);
      setScriptFinished(false);
      setTtsError(null);
      cancelledRef.current = true;
      void unloadSound();
      countdownPulse.setValue(0);
      avatarPulse.setValue(0);
      bars.forEach((bar) => bar.setValue(0.35));
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
  }, [bars, countdownPulse, visible, avatarPulse, unloadSound]);

  useEffect(() => {
    if (!visible || countdown <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((current) => current - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, visible]);

  useEffect(() => {
    if (!visible || countdown > 0) {
      return;
    }

    setIsCallActive(true);
  }, [countdown, visible]);

  useEffect(() => {
    if (!visible || !isCallActive) {
      return;
    }

    cancelledRef.current = false;

    const runInitial = async () => {
      setTtsError(null);
      setIsPlayingCaller(true);
      setUserLineIndex(null);
      setScriptFinished(false);
      try {
        await playCallerLinesFrom(0);
      } catch (e) {
        if (!cancelledRef.current) {
          setTtsError(e instanceof Error ? e.message : 'Could not play audio');
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
  }, [visible, isCallActive, playCallerLinesFrom, unloadSound]);

  useEffect(() => {
    if (!visible || !isCallActive) {
      return;
    }

    const durationTimer = setInterval(() => {
      setCallDuration((current) => current + 1);
    }, 1000);

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
      clearInterval(durationTimer);
      glowLoop.stop();
      avatarPulse.setValue(0);
      barLoops.forEach((loop) => loop.stop());
      bars.forEach((bar) => bar.setValue(0.35));
    };
  }, [avatarPulse, bars, isCallActive, visible]);

  const handleNextPrompt = async () => {
    if (isPlayingCaller || scriptFinished) {
      return;
    }

    const startFrom = userLineIndex === null ? 0 : userLineIndex + 1;

    setTtsError(null);
    cancelledRef.current = false;
    setIsPlayingCaller(true);

    try {
      await playCallerLinesFrom(startFrom);
    } catch (e) {
      if (!cancelledRef.current) {
        setTtsError(e instanceof Error ? e.message : 'Could not play audio');
      }
    } finally {
      if (!cancelledRef.current) {
        setIsPlayingCaller(false);
      }
    }
  };

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

  const userPromptText =
    userLineIndex !== null ? transcript[userLineIndex]?.text ?? '' : '';

  const nextDisabled =
    isPlayingCaller ||
    scriptFinished ||
    (userLineIndex === null && !ttsError);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onSafe}
      presentationStyle="fullScreen"
      statusBarTranslucent
      visible={visible}
    >
      {!isCallActive ? (
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
            <Text style={styles.countdownSubtitle}>
              Your preset conversation is being launched now.
            </Text>
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
            <View style={styles.promptCard}>
              <Text style={styles.promptLabel}>
                {scriptFinished ? 'Script' : isPlayingCaller ? 'Call' : 'Say this'}
              </Text>
              {ttsError ? (
                <Text style={styles.promptText}>{ttsError}</Text>
              ) : scriptFinished ? (
                <Text style={styles.promptText}>
                  You reached the end of this script. Stay on the line as long as you need.
                </Text>
              ) : isPlayingCaller ? (
                <Text style={styles.promptText}>Listening to caller…</Text>
              ) : (
                <Text style={styles.promptText}>{userPromptText}</Text>
              )}
              <Pressable
                accessibilityRole="button"
                disabled={nextDisabled}
                onPress={() => void handleNextPrompt()}
                style={[styles.promptButton, nextDisabled && styles.promptButtonDisabled]}
              >
                <Text
                  style={[styles.promptButtonText, nextDisabled && styles.promptButtonTextDisabled]}
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
              <Text style={styles.callDuration}>{formatTime(callDuration)}</Text>
            </View>

            <View style={styles.avatarSection}>
              <Animated.View
                style={[
                  styles.avatarGlow,
                  {
                    transform: [{ scale: avatarScale }],
                    opacity: avatarOpacity,
                  },
                ]}
              />
              <LinearGradient
                colors={['#4989FF', '#6D5BFF']}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarCircle}
              >
                <Text style={styles.avatarInitial}>{caller.initial}</Text>
              </LinearGradient>

              <View style={styles.waveRow}>
                {bars.map((bar, index) => (
                  <Animated.View
                    key={`bar-${index}`}
                    style={[
                      styles.waveBar,
                      {
                        transform: [{ scaleY: bar }],
                        opacity: index % 3 === 0 ? 0.9 : 0.65,
                      },
                    ]}
                  />
                ))}
              </View>
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
                <Pressable accessibilityRole="button" style={styles.endCallButton}>
                  <Feather
                    color={HavynColors.white}
                    name="phone"
                    size={30}
                    style={styles.endCallIcon}
                  />
                </Pressable>
                <Pressable accessibilityRole="button" onPress={onSafe} style={styles.safeButton}>
                  <Text style={styles.safeButtonText}>I'm safe now</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      )}
    </Modal>
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
    gap: 24,
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
