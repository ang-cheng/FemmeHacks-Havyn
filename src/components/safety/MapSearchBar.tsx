import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { HavynColors, HavynShadow } from '@/constants/havyn';

type MapSearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  resultCount: number;
};

export function MapSearchBar({ value, onChangeText, resultCount }: MapSearchBarProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.inputShell}>
        <Feather color={HavynColors.textSoft} name="search" size={18} />
        <TextInput
          autoCorrect={false}
          onChangeText={onChangeText}
          placeholder="Search a safe place or building"
          placeholderTextColor={HavynColors.textSoft}
          returnKeyType="search"
          style={styles.input}
          value={value}
        />
        {value ? (
          <Pressable accessibilityRole="button" onPress={() => onChangeText('')} style={styles.clearButton}>
            <Feather color={HavynColors.textMuted} name="x" size={16} />
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.helperText}>
        {value ? `${resultCount} match${resultCount === 1 ? '' : 'es'} in demo data` : 'Try Starbucks, hospital, or police'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 8,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: HavynColors.border,
    backgroundColor: HavynColors.surface,
    paddingHorizontal: 16,
    minHeight: 54,
    ...HavynShadow,
  },
  input: {
    flex: 1,
    color: HavynColors.text,
    fontSize: 15,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HavynColors.surfaceMuted,
  },
  helperText: {
    color: HavynColors.textMuted,
    fontSize: 12,
    paddingHorizontal: 4,
  },
});
