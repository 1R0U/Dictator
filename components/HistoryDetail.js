import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';

import EndingReveal from './EndingReveal';
import {
  formatHistoryDate,
  getHistoryEndingBody,
  getHistoryEndingTypeLabel,
  getHistoryTitle,
} from '../game/historyView';

/** Replay a saved ending headline and desire-meter reveal. */
export default function HistoryDetail({ result, onBack }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} style={styles.scrollView}>
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={styles.backButtonText}>← 履歴一覧へ戻る</Text>
        </Pressable>
        <Text style={styles.kicker}>ARCHIVE DETAIL</Text>
        <Text style={styles.date}>{formatHistoryDate(result?.savedAt)}</Text>
        <Text style={styles.endingType}>ENDING TYPE / {getHistoryEndingTypeLabel(result)}</Text>
        <EndingReveal
          body={getHistoryEndingBody(result)}
          finalMeter={result?.desireAxes}
          headline={getHistoryTitle(result)}
          onReturnHome={onBack}
          returnLabel="履歴一覧へ戻る"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0d',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  backButton: {
    width: '100%',
    maxWidth: 560,
    marginBottom: 28,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#a9a39a',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  kicker: {
    marginBottom: 8,
    color: '#b9985a',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
  },
  date: {
    marginBottom: 12,
    color: '#8e8982',
    fontSize: 12,
    fontWeight: '700',
  },
  endingType: {
    marginBottom: 24,
    color: '#d8c9aa',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pressed: {
    opacity: 0.65,
  },
});
