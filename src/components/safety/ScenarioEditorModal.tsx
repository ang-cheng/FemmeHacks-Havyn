import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
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

import { HavynColors, HavynShadow } from '@/constants/havyn';
import { voiceOptions } from '@/data/safety';
import type { ScenarioDraftValues } from '../../../scenarios/types';

type ScenarioEditorModalProps = {
  visible: boolean;
  mode: 'create' | 'edit';
  initialValues: ScenarioDraftValues;
  busy?: boolean;
  onCancel: () => void;
  onSave: (values: ScenarioDraftValues) => Promise<void> | void;
};

type ValidationErrors = {
  title?: string;
  scriptText?: string;
};

export function ScenarioEditorModal({
  visible,
  mode,
  initialValues,
  busy = false,
  onCancel,
  onSave,
}: ScenarioEditorModalProps) {
  const [values, setValues] = useState<ScenarioDraftValues>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setValues(initialValues);
    setErrors({});
    setSaveError(null);
  }, [initialValues, visible]);

  const modalTitle = useMemo(
    () => (mode === 'create' ? 'Create custom scenario' : 'Edit custom scenario'),
    [mode]
  );

  const validate = () => {
    const nextErrors: ValidationErrors = {};

    if (!values.title.trim()) {
      nextErrors.title = 'Add a title so you can recognize this scenario later.';
    }

    if (!values.scriptText.trim()) {
      nextErrors.scriptText = 'Add at least one script line before saving.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    setSaveError(null);

    if (!validate()) {
      return;
    }

    try {
      await onSave({
        title: values.title.trim(),
        description: values.description.trim(),
        scriptText: values.scriptText.trim(),
        preferredVoiceId: values.preferredVoiceId,
      });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save this scenario right now.');
    }
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onCancel}
      presentationStyle="pageSheet"
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalRoot}
      >
        <View style={styles.modalSheet}>
          <Pressable
            accessibilityLabel="Dismiss scenario editor"
            accessibilityRole="button"
            onPress={onCancel}
            style={styles.modalBackdropFill}
          />

          <View style={styles.modalCard}>
            <View style={styles.headerRow}>
              <View style={styles.headerCopy}>
                <Text style={styles.modalTitle}>{modalTitle}</Text>
                <Text style={styles.modalSubtitle}>
                  Save a custom script you can select like any built-in scenario.
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close scenario editor"
                accessibilityRole="button"
                hitSlop={8}
                onPress={onCancel}
                style={styles.closeButton}
              >
                <Feather color={HavynColors.textMuted} name="x" size={18} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.formContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Scenario title</Text>
                <TextInput
                  autoCapitalize="sentences"
                  autoCorrect
                  onChangeText={(title) => {
                    setValues((current) => ({ ...current, title }));
                    if (errors.title) {
                      setErrors((current) => ({ ...current, title: undefined }));
                    }
                  }}
                  placeholder="Late walk home"
                  placeholderTextColor={HavynColors.textSoft}
                  style={[styles.textInput, errors.title ? styles.textInputError : null]}
                  value={values.title}
                />
                {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Short description</Text>
                <TextInput
                  autoCapitalize="sentences"
                  multiline
                  onChangeText={(description) => setValues((current) => ({ ...current, description }))}
                  placeholder="A quick check-in script for leaving a crowded event."
                  placeholderTextColor={HavynColors.textSoft}
                  style={[styles.textInput, styles.textAreaSmall]}
                  textAlignVertical="top"
                  value={values.description}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Script</Text>
                <Text style={styles.helperText}>
                  Use one line per turn. Prefix with “Them:” or “You:” when you want to control who speaks.
                </Text>
                <TextInput
                  autoCapitalize="sentences"
                  multiline
                  onChangeText={(scriptText) => {
                    setValues((current) => ({ ...current, scriptText }));
                    if (errors.scriptText) {
                      setErrors((current) => ({ ...current, scriptText: undefined }));
                    }
                  }}
                  placeholder={'Them: Hey, where are you?\nYou: I’m heading outside now.'}
                  placeholderTextColor={HavynColors.textSoft}
                  style={[styles.textInput, styles.scriptInput, errors.scriptText ? styles.textInputError : null]}
                  textAlignVertical="top"
                  value={values.scriptText}
                />
                {errors.scriptText ? <Text style={styles.errorText}>{errors.scriptText}</Text> : null}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Preferred voice</Text>
                <View style={styles.voiceOptionsWrap}>
                  {voiceOptions.map((voice) => {
                    const selected = voice.id === values.preferredVoiceId;

                    return (
                      <Pressable
                        key={voice.id}
                        accessibilityRole="button"
                        onPress={() =>
                          setValues((current) => ({
                            ...current,
                            preferredVoiceId: voice.id,
                          }))
                        }
                        style={[styles.voiceChip, selected && styles.voiceChipSelected]}
                      >
                        <Text style={[styles.voiceChipTitle, selected && styles.voiceChipTitleSelected]}>
                          {voice.name}
                        </Text>
                        <Text
                          style={[
                            styles.voiceChipDescription,
                            selected && styles.voiceChipDescriptionSelected,
                          ]}
                        >
                          {voice.description}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={onCancel}
                style={styles.modalButtonSecondary}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={() => void handleSave()}
                style={[styles.modalButtonPrimary, busy && styles.modalButtonPrimaryDisabled]}
              >
                <Text style={styles.modalButtonPrimaryText}>{busy ? 'Saving...' : 'Save'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  modalSheet: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: 'rgba(15, 24, 40, 0.45)',
  },
  modalBackdropFill: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    backgroundColor: HavynColors.surface,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    gap: 18,
    maxHeight: '88%',
    ...HavynShadow,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  modalTitle: {
    color: HavynColors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: HavynColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HavynColors.surfaceMuted,
  },
  formContent: {
    gap: 18,
    paddingBottom: 4,
  },
  fieldGroup: {
    gap: 8,
  },
  inputLabel: {
    color: HavynColors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  helperText: {
    color: HavynColors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  textInput: {
    borderWidth: 1,
    borderColor: HavynColors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: HavynColors.text,
    backgroundColor: HavynColors.surfaceMuted,
  },
  textAreaSmall: {
    minHeight: 86,
  },
  scriptInput: {
    minHeight: 220,
  },
  textInputError: {
    borderColor: HavynColors.accent,
  },
  errorText: {
    color: HavynColors.accentDeep,
    fontSize: 13,
    lineHeight: 18,
  },
  voiceOptionsWrap: {
    gap: 10,
  },
  voiceChip: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: HavynColors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: HavynColors.surfaceMuted,
    gap: 3,
  },
  voiceChipSelected: {
    borderColor: HavynColors.accent,
    backgroundColor: HavynColors.accentSoft,
  },
  voiceChipTitle: {
    color: HavynColors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  voiceChipTitleSelected: {
    color: HavynColors.accentDeep,
  },
  voiceChipDescription: {
    color: HavynColors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  voiceChipDescriptionSelected: {
    color: HavynColors.accentDeep,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
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
    opacity: 0.55,
  },
  modalButtonPrimaryText: {
    color: HavynColors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
