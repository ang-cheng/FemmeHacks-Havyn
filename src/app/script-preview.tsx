import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScenarioEditorModal } from '@/components/safety/ScenarioEditorModal';
import { StatusPill } from '@/components/safety/common';
import { HavynColors, HavynShadow } from '@/constants/havyn';
import { useSafetyPlan } from '@/context/SafetyPlanContext';
import { voiceOptions } from '@/data/safety';
import { createScenarioDraft } from '@/lib/scenario-storage';
import type { ScenarioDraftValues } from '../../scenarios/types';

type EditorMode = 'create' | 'edit' | null;

export default function ScriptPreviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string }>();
  const {
    createScenario,
    deleteCustomScenario,
    duplicateScenario,
    hasBuiltInOverride,
    isSavingScenario,
    resetBuiltInScenario,
    selectedScenario,
    selectedScenarioIsCustom,
    selectedVoiceId,
    updateCustomScenario,
  } = useSafetyPlan();
  const [editorMode, setEditorMode] = useState<EditorMode>(null);
  const createModeHandledRef = useRef(false);

  useEffect(() => {
    if (params.mode === 'create' && !createModeHandledRef.current) {
      createModeHandledRef.current = true;
      setEditorMode('create');
      return;
    }

    if (params.mode !== 'create') {
      createModeHandledRef.current = false;
    }
  }, [params.mode]);

  const selectedVoiceLabel = useMemo(
    () => voiceOptions.find((voice) => voice.id === (selectedScenario.preferredVoiceId ?? selectedVoiceId))?.name ?? 'Selected voice',
    [selectedScenario.preferredVoiceId, selectedVoiceId]
  );

  const editorInitialValues = useMemo<ScenarioDraftValues>(
    () =>
      editorMode === 'edit'
        ? createScenarioDraft(selectedScenario, selectedScenario.preferredVoiceId ?? selectedVoiceId)
        : createScenarioDraft(undefined, selectedScenario.preferredVoiceId ?? selectedVoiceId),
    [editorMode, selectedScenario, selectedVoiceId]
  );

  const handleSaveScenario = useCallback(
    async (draft: ScenarioDraftValues) => {
      if (editorMode === 'edit') {
        const updated = await updateCustomScenario(selectedScenario.id, draft);
        if (!updated) {
          throw new Error('Only custom scenarios can be edited.');
        }
      } else {
        await createScenario(draft);
      }

      setEditorMode(null);
    },
    [createScenario, editorMode, selectedScenario.id, updateCustomScenario]
  );

  const handleDuplicate = useCallback(() => {
    void duplicateScenario(selectedScenario.id);
  }, [duplicateScenario, selectedScenario.id]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete custom scenario?',
      `"${selectedScenario.title}" will be removed from this device.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteCustomScenario(selectedScenario.id);
          },
        },
      ]
    );
  }, [deleteCustomScenario, selectedScenario.id, selectedScenario.title]);

  const openEdit = () => {
    if (!selectedScenarioIsCustom) {
      return;
    }

    setEditorMode('edit');
  };

  return (
    <View style={[styles.screen, { paddingBottom: Math.max(insets.bottom, 20) }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Feather color={HavynColors.text} name="chevron-left" size={24} />
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Script preview</Text>
          <Text numberOfLines={2} style={styles.headerSubtitle}>
            {selectedScenario.title}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <View style={styles.actionBlock}>
          <View style={styles.actionRow}>
            <View style={styles.actionMeta}>
              <StatusPill
                label={selectedScenarioIsCustom ? 'Custom scenario' : 'Built-in scenario'}
                tone={selectedScenarioIsCustom ? 'accent' : 'muted'}
              />
              <Text style={styles.voiceLabel}>Preferred voice: {selectedVoiceLabel}</Text>
            </View>

            <View style={styles.topActions}>
              <Pressable
                accessibilityRole="button"
                disabled={!selectedScenarioIsCustom}
                onPress={openEdit}
                style={[
                  styles.actionButton,
                  !selectedScenarioIsCustom && styles.actionButtonDisabled,
                ]}
              >
                <Feather
                  color={selectedScenarioIsCustom ? HavynColors.accentDeep : HavynColors.textSoft}
                  name="edit-2"
                  size={15}
                />
                <Text
                  style={[
                    styles.actionButtonText,
                    !selectedScenarioIsCustom && styles.actionButtonTextDisabled,
                  ]}
                >
                  Edit
                </Text>
              </Pressable>

              <Pressable
                accessibilityHint="Create a new custom scenario"
                accessibilityRole="button"
                onPress={() => setEditorMode('create')}
                style={styles.iconActionButton}
              >
                <Feather color={HavynColors.accentDeep} name="plus" size={18} />
              </Pressable>
            </View>
          </View>

          <View style={styles.secondaryActionRow}>
            {selectedScenarioIsCustom ? (
              <>
                <Pressable accessibilityRole="button" onPress={handleDuplicate} style={styles.secondaryActionButton}>
                  <Feather color={HavynColors.textMuted} name="copy" size={14} />
                  <Text style={styles.secondaryActionButtonText}>Duplicate</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={handleDelete}
                  style={[styles.secondaryActionButton, styles.secondaryActionButtonDanger]}
                >
                  <Feather color={HavynColors.accentDeep} name="trash-2" size={14} />
                  <Text style={[styles.secondaryActionButtonText, styles.secondaryActionButtonTextDanger]}>
                    Delete
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void resetBuiltInScenario(selectedScenario.id)}
                  style={styles.secondaryActionButton}
                >
                  <Feather color={HavynColors.textMuted} name="rotate-ccw" size={14} />
                  <Text style={styles.secondaryActionButtonText}>
                    {hasBuiltInOverride ? 'Reset to Default' : 'Reset to Default'}
                  </Text>
                </Pressable>
                <Text style={styles.readOnlyText}>Built-in scenarios are read-only.</Text>
              </>
            )}
          </View>
        </View>

        <Text style={styles.description}>
          {selectedScenario.description || 'Add a short description so this scenario is easy to scan quickly.'}
        </Text>

        <View style={styles.transcriptStack}>
          {selectedScenario.transcript.map((line, index) => {
            const isCaller = line.speaker === 'caller';
            return (
              <View
                key={`${index}-${line.text.slice(0, 12)}`}
                style={[styles.lineCard, isCaller ? styles.lineCardCaller : styles.lineCardUser]}
              >
                <Text style={styles.lineLabel}>{isCaller ? 'Them' : 'You'}</Text>
                <Text style={styles.lineText}>{line.text}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <ScenarioEditorModal
        busy={isSavingScenario}
        initialValues={editorInitialValues}
        mode={editorMode === 'edit' ? 'edit' : 'create'}
        onCancel={() => setEditorMode(null)}
        onSave={handleSaveScenario}
        visible={editorMode !== null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: HavynColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: HavynColors.border,
    backgroundColor: HavynColors.surface,
    ...HavynShadow,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  headerTitles: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
  },
  headerTitle: {
    color: HavynColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    color: HavynColors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 20,
  },
  actionBlock: {
    gap: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionMeta: {
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  voiceLabel: {
    color: HavynColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: HavynColors.accentSoft,
  },
  actionButtonDisabled: {
    backgroundColor: HavynColors.surfaceMuted,
  },
  actionButtonText: {
    color: HavynColors.accentDeep,
    fontSize: 14,
    fontWeight: '700',
  },
  actionButtonTextDisabled: {
    color: HavynColors.textSoft,
  },
  iconActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HavynColors.surfaceMuted,
  },
  secondaryActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: HavynColors.surface,
    borderWidth: 1,
    borderColor: HavynColors.border,
  },
  secondaryActionButtonDanger: {
    backgroundColor: '#FFF1F1',
    borderColor: '#FFD6D6',
  },
  secondaryActionButtonText: {
    color: HavynColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryActionButtonTextDanger: {
    color: HavynColors.accentDeep,
  },
  readOnlyText: {
    color: HavynColors.textSoft,
    fontSize: 13,
    lineHeight: 18,
  },
  description: {
    color: HavynColors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  transcriptStack: {
    gap: 12,
  },
  lineCard: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  lineCardCaller: {
    backgroundColor: HavynColors.surface,
    borderColor: HavynColors.border,
    marginRight: 28,
  },
  lineCardUser: {
    backgroundColor: HavynColors.accentSoft,
    borderColor: 'rgba(255, 107, 107, 0.25)',
    marginLeft: 28,
  },
  lineLabel: {
    color: HavynColors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  lineText: {
    color: HavynColors.text,
    fontSize: 15,
    lineHeight: 22,
  },
});
