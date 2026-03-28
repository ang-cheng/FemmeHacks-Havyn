import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HavynColors, HavynShadow } from '@/constants/havyn';
import { useSafetyPlan } from '@/context/SafetyPlanContext';

export default function ScriptPreviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedScenario } = useSafetyPlan();

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
        <Text style={styles.description}>{selectedScenario.description}</Text>

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
