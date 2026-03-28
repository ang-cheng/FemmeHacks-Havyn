import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { HavynColors, HavynShadow } from '@/constants/havyn';
import { useSafetyPlan } from '@/context/SafetyPlanContext';
import { useCall } from '@/context/call';
import { voiceOptions } from '@/data/safety';

type CallScreenProps = {
  onOpenMap: () => void;
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: HavynColors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    justifyContent: 'center',
    gap: 26,
  },
  infoBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: HavynColors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: HavynColors.border,
    ...HavynShadow,
  },
  infoBadgeText: {
    color: HavynColors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  centerStack: {
    alignItems: 'center',
    gap: 30,
  },
  callButtonWrap: {
    width: 264,
    height: 264,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButtonPulse: {
    position: 'absolute',
    width: 264,
    height: 264,
    borderRadius: 132,
    backgroundColor: HavynColors.accent,
  },
  callButtonPressable: {
    width: 264,
    height: 264,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButton: {
    width: 264,
    height: 264,
    borderRadius: 132,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: HavynColors.accent,
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.32,
    shadowRadius: 30,
    elevation: 18,
  },
  tapBadge: {
    position: 'absolute',
    right: 18,
    top: 18,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HavynColors.white,
    ...HavynShadow,
  },
  tapBadgeText: {
    color: HavynColors.accent,
    fontSize: 24,
    fontWeight: '700',
  },
  instructions: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
  },
  instructionsTitle: {
    color: HavynColors.text,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  instructionsBody: {
    color: HavynColors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 320,
  },
  bottomCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: HavynColors.border,
    backgroundColor: HavynColors.surface,
    paddingHorizontal: 18,
    paddingVertical: 18,
    ...HavynShadow,
  },
  bottomCardDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: HavynColors.accent,
    marginTop: 6,
  },
  bottomCardBody: {
    flex: 1,
    gap: 4,
  },
  bottomCardTitle: {
    color: HavynColors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  bottomCardText: {
    color: HavynColors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  planDetailText: {
    color: HavynColors.accentDeep,
    fontSize: 13,
    fontWeight: '600',
  },
  quickMapButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: HavynColors.surface,
    borderWidth: 1,
    borderColor: HavynColors.border,
    ...HavynShadow,
  },
  quickMapButtonText: {
    color: HavynColors.accentDeep,
    fontSize: 14,
    fontWeight: '700',
  },
});

export function CallScreen({ onOpenMap }: CallScreenProps) {
  const { selectedScenario, selectedVoiceId } = useSafetyPlan();
  const [tapCount, setTapCount] = useState(0);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseOne = useRef(new Animated.Value(0)).current;
  const pulseTwo = useRef(new Animated.Value(0)).current;
  const { callStage, expandCall, isCallMinimized, startCall } = useCall();

  const selectedVoiceLabel = useMemo(
    () => voiceOptions.find((voice) => voice.id === selectedVoiceId)?.name ?? 'Configured voice',
    [selectedVoiceId]
  );

  useEffect(() => {
    if (tapCount === 0 || callStage !== 'idle') {
      pulseOne.stopAnimation();
      pulseTwo.stopAnimation();
      pulseOne.setValue(0);
      pulseTwo.setValue(0);
      return;
    }

    const pulseAnimation = (value: Animated.Value, delay = 0) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 1200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );

    const one = pulseAnimation(pulseOne);
    const two = pulseAnimation(pulseTwo, 260);

    one.start();
    two.start();

    return () => {
      one.stop();
      two.stop();
      pulseOne.setValue(0);
      pulseTwo.setValue(0);
    };
  }, [callStage, pulseOne, pulseTwo, tapCount]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (callStage !== 'idle') {
      setTapCount(0);
    }
  }, [callStage]);

  const handleTap = () => {
    if (callStage !== 'idle') {
      expandCall();
      return;
    }

    const nextCount = tapCount + 1;

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    if (nextCount >= 3) {
      setTapCount(0);
      startCall();
      return;
    }

    setTapCount(nextCount);
    resetTimerRef.current = setTimeout(() => {
      setTapCount(0);
    }, 2000);
  };

  const titleText =
    callStage === 'idle'
      ? tapCount > 0
        ? `Tap ${3 - tapCount} more time${3 - tapCount > 1 ? 's' : ''}`
        : 'Tap 3 times to start call'
      : isCallMinimized
        ? 'Call minimized over the map'
        : 'Call already in progress';

  const bodyText =
    callStage === 'idle'
      ? 'Your contacts and nearby helpers will be alerted if you need a discreet exit.'
      : isCallMinimized
        ? 'The fake transcript and TTS keep running while you browse nearby safe places underneath.'
        : 'Use the minimize control in the fake call to navigate on the map without ending it.';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.infoBadge}>
        <Feather color={HavynColors.accent} name="shield" size={16} />
        <Text style={styles.infoBadgeText}>
          {callStage === 'idle' ? 'Ready to assist you' : 'Fake call is running'}
        </Text>
      </View>

      <View style={styles.centerStack}>
        <View style={styles.callButtonWrap}>
          {tapCount > 0 && callStage === 'idle' ? (
            <>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.callButtonPulse,
                  {
                    opacity: pulseOne.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.38, 0],
                    }),
                    transform: [
                      {
                        scale: pulseOne.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.34],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.callButtonPulse,
                  {
                    opacity: pulseTwo.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.24, 0],
                    }),
                    transform: [
                      {
                        scale: pulseTwo.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.52],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </>
          ) : null}

          <Pressable accessibilityRole="button" onPress={handleTap} style={styles.callButtonPressable}>
            <LinearGradient
              colors={[HavynColors.accent, HavynColors.accentDark]}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={styles.callButton}
            >
              <Feather
                color={HavynColors.white}
                name={callStage === 'idle' ? 'phone' : isCallMinimized ? 'maximize-2' : 'phone-call'}
                size={76}
              />
            </LinearGradient>

            {tapCount > 0 && callStage === 'idle' ? (
              <View style={styles.tapBadge}>
                <Text style={styles.tapBadgeText}>{tapCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>{titleText}</Text>
          <Text style={styles.instructionsBody}>{bodyText}</Text>
        </View>
      </View>

      <View style={styles.bottomCard}>
        <View style={styles.bottomCardDot} />
        <View style={styles.bottomCardBody}>
          <Text style={styles.bottomCardTitle}>Emergency mode</Text>
          <Text style={styles.bottomCardText}>
            {callStage === 'idle'
              ? 'Launches a believable call screen so you can leave an unsafe situation without drawing attention.'
              : 'When minimized, the fake call floats above the map so you can keep navigating without ending it.'}
          </Text>
          <Text style={styles.planDetailText}>Scenario: {selectedScenario.title}</Text>
          <Text style={styles.planDetailText}>Voice: {selectedVoiceLabel}</Text>
        </View>
      </View>

      {callStage !== 'idle' ? (
        <Pressable accessibilityRole="button" onPress={onOpenMap} style={styles.quickMapButton}>
          <Feather color={HavynColors.accent} name="map-pin" size={18} />
          <Text style={styles.quickMapButtonText}>Go to map while call continues</Text>
        </Pressable>
      ) : null}
      </ScrollView>
  );
}