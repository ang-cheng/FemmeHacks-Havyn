import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { HavynColors } from '@/constants/havyn';
import { useSafetyPlan } from '@/context/SafetyPlanContext';
import { emergencyContacts, voiceOptions } from '@/data/safety';
import { fetchTtsBase64 } from '@/lib/tts';
import { fakeCallScenarios } from '../../../scenarios/fakeCallScenarios';

import { InitialAvatar, SectionHeader, SelectionCard, StatusPill, SurfaceCard, ToggleSwitch } from './common';

const VOICE_PREVIEW_PHRASE =
  "Hello! It's nice to meet you. How can I help you?";

function formatScriptPreview(transcript: { speaker: string; text: string }[]): string {
  return transcript
    .map((line) => `${line.speaker === 'caller' ? 'Them' : 'You'}: ${line.text}`)
    .join('\n\n');
}

export function PlanScreen() {
  const {
    selectedScenarioId,
    setSelectedScenarioId,
    selectedVoiceId,
    setSelectedVoiceId,
    selectedScenario,
  } = useSafetyPlan();
  const [sendTextEnabled, setSendTextEnabled] = useState(true);
  const [shareLocationEnabled, setShareLocationEnabled] = useState(true);
  const [checkInEnabled, setCheckInEnabled] = useState(true);
  const [checkInMinutes, setCheckInMinutes] = useState(1);
  const [activePreview, setActivePreview] = useState<{
    voiceId: string;
    loading: boolean;
  } | null>(null);

  const previewSoundRef = useRef<Audio.Sound | null>(null);

  const stopVoicePreview = useCallback(async () => {
    if (previewSoundRef.current) {
      try {
        await previewSoundRef.current.stopAsync();
        await previewSoundRef.current.unloadAsync();
      } catch {
        /* ignore */
      }
      previewSoundRef.current = null;
    }
    setActivePreview(null);
  }, []);

  const playVoicePreview = useCallback(
    async (voiceId: string) => {
      await stopVoicePreview();
      setActivePreview({ voiceId, loading: true });

      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          allowsRecordingIOS: false,
        });

        const base64 = await fetchTtsBase64(VOICE_PREVIEW_PHRASE, voiceId);
        const uri = `data:audio/mpeg;base64,${base64}`;

        const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
        previewSoundRef.current = sound;
        setActivePreview({ voiceId, loading: false });

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            void stopVoicePreview();
          }
        });
      } catch {
        setActivePreview(null);
        previewSoundRef.current = null;
      }
    },
    [stopVoicePreview]
  );

  const handleVoicePlayPress = useCallback(
    (voiceId: string) => {
      if (activePreview?.voiceId === voiceId && !activePreview.loading) {
        void stopVoicePreview();
        return;
      }
      void playVoicePreview(voiceId);
    },
    [activePreview, playVoicePreview, stopVoicePreview]
  );

  useEffect(() => {
    return () => {
      void stopVoicePreview();
    };
  }, [stopVoicePreview]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
       <View style={{ paddingTop: 50 }}>
        <SectionHeader
        title="Safety Plan"
        subtitle="Customize your emergency settings and default support flow."
        />
       </View>

      <View style={styles.sectionStack}>
        <SurfaceCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Call Scenario</Text>
          <View style={styles.cardStack}>
            {fakeCallScenarios.map((scenario) => (
              <SelectionCard
                key={scenario.id}
                title={scenario.title}
                description={scenario.description}
                selected={scenario.id === selectedScenarioId}
                onPress={() => setSelectedScenarioId(scenario.id)}
              />
            ))}
          </View>

          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewLabel}>Script Preview</Text>
              <Pressable accessibilityRole="button" style={styles.previewAction}>
                <Text style={styles.previewActionText}>Edit</Text>
              </Pressable>
            </View>
            <Text style={styles.previewBody}>{formatScriptPreview(selectedScenario.transcript)}</Text>
          </View>
        </SurfaceCard>

        <SurfaceCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Voice Selection</Text>
          <View style={styles.cardStack}>
            {voiceOptions.map((voice) => {
              const isThisPreview = activePreview?.voiceId === voice.id;
              const isLoading = isThisPreview && activePreview?.loading;
              const isPlaying = isThisPreview && !activePreview?.loading;

              return (
                <SelectionCard
                  key={voice.id}
                  title={voice.name}
                  description={voice.description}
                  selected={voice.id === selectedVoiceId}
                  onPress={() => setSelectedVoiceId(voice.id)}
                  rightAccessory={
                    <Pressable
                      accessibilityLabel={
                        isPlaying ? 'Stop voice preview' : 'Play voice preview'
                      }
                      accessibilityRole="button"
                      hitSlop={8}
                      onPress={() => handleVoicePlayPress(voice.id)}
                      style={styles.playButton}
                    >
                      {isLoading ? (
                        <ActivityIndicator color={HavynColors.accent} size="small" />
                      ) : (
                        <Feather
                          color={HavynColors.text}
                          name={isPlaying ? 'square' : 'play'}
                          size={isPlaying ? 14 : 16}
                        />
                      )}
                    </Pressable>
                  }
                />
              );
            })}
          </View>
        </SurfaceCard>

        <SurfaceCard style={styles.sectionCard}>
          {/* Title row (can still be inline if you want) */}
          <View style={styles.inlineHeader}>
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          </View>

          {/* Button row below the title */}
          <View style={[styles.inlineHeader, { justifyContent: 'flex-end' }]}>
            <Pressable accessibilityRole="button" style={styles.addButton}>
              <Feather color={HavynColors.white} name="plus" size={16} />
              <Text style={styles.addButtonText}>Add Contact</Text>
            </Pressable>
          </View>

          <View style={styles.cardStack}>
            {emergencyContacts.map((contact) => (
              <View key={contact.id} style={styles.contactRow}>
                <InitialAvatar initials={contact.initials} />
                <View style={styles.contactBody}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>{contact.phone}</Text>
                </View>
                <StatusPill label={contact.status} tone={contact.status === 'Main' ? 'accent' : 'success'} />
              </View>
            ))}
          </View>
        </SurfaceCard>

        <SurfaceCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Auto Safety Features</Text>
          <View style={styles.settingList}>
            <View style={styles.settingRow}>
              <View style={styles.settingBody}>
                <Text style={styles.settingTitle}>Send text if call triggered</Text>
                <Text style={styles.settingDescription}>Alert your contacts via SMS.</Text>
              </View>
              <ToggleSwitch value={sendTextEnabled} onValueChange={setSendTextEnabled} />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingBody}>
                <Text style={styles.settingTitle}>Share live location</Text>
                <Text style={styles.settingDescription}>Real-time GPS tracking during an event.</Text>
              </View>
              <ToggleSwitch value={shareLocationEnabled} onValueChange={setShareLocationEnabled} />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingBody}>
                <Text style={styles.settingTitle}>Check-in timer</Text>
                <Text style={styles.settingDescription}>Auto-alert if you do not respond.</Text>
              </View>
              <View style={styles.checkInControls}>
                <ToggleSwitch value={checkInEnabled} onValueChange={setCheckInEnabled} />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setCheckInMinutes((current) => (current === 3 ? 1 : current + 1))}
                  style={styles.checkInButton}
                >
                  <Text style={styles.checkInButtonText}>{checkInMinutes} min</Text>
                  <Feather color={HavynColors.textSoft} name="chevron-down" size={16} />
                </Pressable>
              </View>
            </View>
          </View>
        </SurfaceCard>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: HavynColors.background,
  },
  content: {
    paddingBottom: 28,
  },
  sectionStack: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  sectionCard: {
    gap: 18,
  },
  sectionTitle: {
    color: HavynColors.text,
    fontSize: 19,
    fontWeight: '700',
  },
  cardStack: {
    gap: 12,
  },
  previewCard: {
    borderRadius: 22,
    backgroundColor: HavynColors.surfaceMuted,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewLabel: {
    color: HavynColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  previewAction: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  previewActionText: {
    color: HavynColors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  previewBody: {
    color: HavynColors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HavynColors.surfaceMuted,
  },
  inlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: HavynColors.accent,
  },
  addButtonText: {
    color: HavynColors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 22,
    backgroundColor: HavynColors.surfaceMuted,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  contactBody: {
    flex: 1,
    gap: 4,
  },
  contactName: {
    color: HavynColors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  contactPhone: {
    color: HavynColors.textMuted,
    fontSize: 13,
  },
  settingList: {
    gap: 14,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingBody: {
    flex: 1,
    gap: 4,
  },
  settingTitle: {
    color: HavynColors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  settingDescription: {
    color: HavynColors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: HavynColors.border,
  },
  checkInControls: {
    alignItems: 'flex-end',
    gap: 10,
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: HavynColors.surfaceMuted,
  },
  checkInButtonText: {
    color: HavynColors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
});
