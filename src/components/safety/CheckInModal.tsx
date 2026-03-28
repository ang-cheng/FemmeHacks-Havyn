import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { HavynColors, HavynShadow } from '@/constants/havyn';
import { useSafetyPlan } from '@/context/SafetyPlanContext';
import { useCall } from '@/context/call';

const CHECKIN_SECONDS = 5;

export function CheckInModal() {
  const { callStage } = useCall();
  const { checkInEnabled, checkInMinutes } = useSafetyPlan();
  const [visible, setVisible] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(CHECKIN_SECONDS);
  const missedRef = useRef(false);

  const handleMissed = useCallback(() => {
    if (missedRef.current) {
      return;
    }
    missedRef.current = true;
    setVisible(false);
    Alert.alert(
      'Check-in missed',
      'You did not confirm in time. Per your safety plan, your contacts may be alerted.',
      [{ text: 'OK' }]
    );
  }, []);

  const handleConfirm = useCallback(() => {
    missedRef.current = false;
    setVisible(false);
  }, []);

  useEffect(() => {
    if (callStage !== 'active' || !checkInEnabled) {
      setVisible(false);
    }
  }, [callStage, checkInEnabled]);

  useEffect(() => {
    if (callStage !== 'active' || !checkInEnabled || visible) {
      return;
    }

    const ms = checkInMinutes * 60 * 1000;
    const id = setInterval(() => {
      missedRef.current = false;
      setVisible(true);
    }, ms);

    return () => clearInterval(id);
  }, [callStage, checkInEnabled, checkInMinutes, visible]);

  useEffect(() => {
    if (!visible) {
      setSecondsLeft(CHECKIN_SECONDS);
      return;
    }

    setSecondsLeft(CHECKIN_SECONDS);

    let s = CHECKIN_SECONDS;
    const id = setInterval(() => {
      s -= 1;
      setSecondsLeft(s);
      if (s <= 0) {
        clearInterval(id);
        handleMissed();
      }
    }, 1000);

    return () => clearInterval(id);
  }, [visible, handleMissed]);

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={handleMissed}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Safety check-in</Text>
          <Text style={styles.body}>Tap the button to confirm you are okay.</Text>
          <View style={styles.timerRing}>
            <Text style={styles.timerNumber}>{secondsLeft}</Text>
          </View>
          <Text style={styles.timerHint}>seconds remaining</Text>
          <Pressable
            accessibilityRole="button"
            disabled={secondsLeft <= 0}
            onPress={handleConfirm}
            style={[styles.confirmButton, secondsLeft <= 0 && styles.confirmButtonDisabled]}
          >
            <Text style={styles.confirmButtonText}>I'm okay</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(19, 22, 34, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 28,
    backgroundColor: HavynColors.surface,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: HavynColors.border,
    ...HavynShadow,
  },
  title: {
    color: HavynColors.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    color: HavynColors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  timerRing: {
    marginTop: 8,
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    borderColor: HavynColors.accentSoft,
    backgroundColor: HavynColors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerNumber: {
    color: HavynColors.accentDeep,
    fontSize: 36,
    fontWeight: '700',
  },
  timerHint: {
    color: HavynColors.textSoft,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  confirmButton: {
    alignSelf: 'stretch',
    borderRadius: 999,
    backgroundColor: HavynColors.accent,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.45,
  },
  confirmButtonText: {
    color: HavynColors.white,
    fontSize: 17,
    fontWeight: '700',
  },
});
