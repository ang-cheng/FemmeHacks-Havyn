import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { HavynColors } from '@/constants/havyn';
import { useSafetyPlan } from '@/context/SafetyPlanContext';
import { type Contact, emergencyContacts as defaultEmergencyContacts, voiceOptions } from '@/data/safety';
import { fetchTtsBase64 } from '@/lib/tts';
import { fakeCallScenarios } from '../../../scenarios/fakeCallScenarios';

import { InitialAvatar, SectionHeader, SelectionCard, SurfaceCard, ToggleSwitch } from './common';

const VOICE_PREVIEW_PHRASE =
  "Hello! It's nice to meet you. How can I help you?";

function initialsFromName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return '?';
  }
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

export function PlanScreen() {
  const router = useRouter();
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

  const [contacts, setContacts] = useState<Contact[]>(() =>
    defaultEmergencyContacts.map((c) => ({ ...c }))
  );
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

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

  const openAddContactModal = () => {
    setNewContactName('');
    setNewContactPhone('');
    setAddContactOpen(true);
  };

  const closeAddContactModal = () => {
    setAddContactOpen(false);
  };

  const saveNewContact = () => {
    const name = newContactName.trim();
    const phone = newContactPhone.trim();
    if (!name || !phone) {
      return;
    }
    const id = `contact-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const next: Contact = {
      id,
      name,
      phone,
      initials: initialsFromName(name),
    };
    setContacts((prev) => [...prev, next]);
    closeAddContactModal();
  };

  const deleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

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

          <Pressable
            accessibilityHint="Opens the full call script for the scenario you selected"
            accessibilityRole="button"
            onPress={() => router.push('/script-preview')}
            style={({ pressed }) => [styles.scriptPreviewRow, pressed && styles.scriptPreviewRowPressed]}
          >
            <View style={styles.scriptPreviewTextBlock}>
              <Text style={styles.scriptPreviewTitle}>Script preview</Text>
              <Text numberOfLines={2} style={styles.scriptPreviewSubtitle}>
                {selectedScenario.title} · {selectedScenario.transcript.length} lines
              </Text>
            </View>
            <Feather color={HavynColors.textSoft} name="chevron-right" size={20} />
          </Pressable>
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
          <View style={styles.inlineHeader}>
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            <Pressable
              accessibilityLabel="Add contact"
              accessibilityRole="button"
              hitSlop={6}
              onPress={openAddContactModal}
              style={styles.addContactFab}
            >
              <Feather color={HavynColors.white} name="plus" size={22} />
            </Pressable>
          </View>

          <Text style={styles.contactsExplainer}>
            When you activate a fake safety call, these people can be alerted by text message so someone
            knows you may need support.
          </Text>

          {contacts.length === 0 ? (
            <Text style={styles.contactsEmpty}>No contacts yet. Add someone you trust.</Text>
          ) : (
            <View style={styles.cardStack}>
              {contacts.map((contact) => (
                <View key={contact.id} style={styles.contactRow}>
                  <InitialAvatar initials={contact.initials} />
                  <View style={styles.contactBody}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactPhone}>{contact.phone}</Text>
                  </View>
                  <Pressable
                    accessibilityLabel={`Remove ${contact.name}`}
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => deleteContact(contact.id)}
                    style={styles.deleteContactButton}
                  >
                    <Feather color={HavynColors.textMuted} name="trash-2" size={18} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </SurfaceCard>

        <Modal
          animationType="fade"
          onRequestClose={closeAddContactModal}
          transparent
          visible={addContactOpen}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalRoot}
          >
            <View style={styles.modalSheet}>
              <Pressable
                accessibilityLabel="Dismiss"
                accessibilityRole="button"
                onPress={closeAddContactModal}
                style={styles.modalBackdropFill}
              />
              <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Add emergency contact</Text>
              <Text style={styles.modalSubtitle}>
                They can receive SMS alerts when you start a fake call (if texting is enabled).
              </Text>

              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                autoCapitalize="words"
                autoCorrect
                onChangeText={setNewContactName}
                placeholder="Full name"
                placeholderTextColor={HavynColors.textSoft}
                style={styles.textInput}
                value={newContactName}
              />

              <Text style={styles.inputLabel}>Phone number</Text>
              <TextInput
                keyboardType="phone-pad"
                onChangeText={setNewContactPhone}
                placeholder="+1 (555) 000-0000"
                placeholderTextColor={HavynColors.textSoft}
                style={styles.textInput}
                value={newContactPhone}
              />

              <View style={styles.modalActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={closeAddContactModal}
                  style={styles.modalButtonSecondary}
                >
                  <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={!newContactName.trim() || !newContactPhone.trim()}
                  onPress={saveNewContact}
                  style={[
                    styles.modalButtonPrimary,
                    (!newContactName.trim() || !newContactPhone.trim()) && styles.modalButtonPrimaryDisabled,
                  ]}
                >
                  <Text style={styles.modalButtonPrimaryText}>Save</Text>
                </Pressable>
              </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

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
  scriptPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 22,
    backgroundColor: HavynColors.surfaceMuted,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: HavynColors.border,
  },
  scriptPreviewRowPressed: {
    opacity: 0.92,
    backgroundColor: '#E8ECF4',
  },
  scriptPreviewTextBlock: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  scriptPreviewTitle: {
    color: HavynColors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  scriptPreviewSubtitle: {
    color: HavynColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
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
  addContactFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HavynColors.accent,
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
  contactsExplainer: {
    color: HavynColors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  contactsEmpty: {
    color: HavynColors.textSoft,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  deleteContactButton: {
    padding: 6,
    marginLeft: 4,
  },
  modalRoot: {
    flex: 1,
  },
  modalSheet: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 28,
    backgroundColor: 'rgba(15, 24, 40, 0.45)',
  },
  modalBackdropFill: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    backgroundColor: HavynColors.surface,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 22,
    gap: 10,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  modalTitle: {
    color: HavynColors.text,
    fontSize: 19,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: HavynColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  inputLabel: {
    color: HavynColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: HavynColors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: HavynColors.text,
    backgroundColor: HavynColors.surfaceMuted,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 14,
  },
  modalButtonSecondary: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
  },
  modalButtonSecondaryText: {
    color: HavynColors.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonPrimary: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: HavynColors.accent,
  },
  modalButtonPrimaryDisabled: {
    opacity: 0.45,
  },
  modalButtonPrimaryText: {
    color: HavynColors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
