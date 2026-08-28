import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import CornerMessenger from './CornerMessenger';
import PressableScale from './PressableScale';
import { TONES, canStartDeclaration } from '../game/declaration';

const MAX_LENGTH = 500;

const TONE_COLORS = {
  horror: '#5b2f78',
  pop: '#c9457a',
  real: '#3f7ea8',
  emotional: '#d98a3d',
};
const DEFAULT_TONE_COLOR = '#c53a34';

/**
 * 最初の法律を入力し、親コンポーネントへ送信するフォーム。
 */
export default function DeclarationForm({ onBack, onSubmit }) {
  const { width } = useWindowDimensions();
  const isCompact = width < 600;
  const [declaration, setDeclaration] = useState('');
  const [selectedTone, setSelectedTone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const canSubmit = canStartDeclaration(declaration, selectedTone) && !isSubmitting;

  /**
   * 入力内容を整形して送信し、失敗時は再試行できる状態に戻す。
   */
  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitError('');
    setIsSubmitting(true);

    try {
      await onSubmit(declaration.trim(), selectedTone);
    } catch {
      setSubmitError('宣言を送信できませんでした。時間をおいて、もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View pointerEvents="none" style={styles.accent} />
        <ScrollView
          contentContainerStyle={[styles.content, isCompact && styles.compactContent]}
          keyboardShouldPersistTaps="handled"
          style={styles.scrollView}
        >
          <View>
            <PressableScale
              accessibilityRole="button"
              disabled={isSubmitting}
              glowColor="#a9a39a"
              onPress={onBack}
              ripple
              style={({ pressed }) => [styles.backButton, pressed && styles.pressedBackButton]}
            >
              <Text style={styles.backButtonText}>← ホームへ戻る</Text>
            </PressableScale>
            <View style={[styles.intro, isCompact && styles.compactIntro]}>
              <View style={styles.headingCopy}>
                <Text style={[styles.title, isCompact && styles.compactTitle]}>第一勅令</Text>
                <Text style={styles.description}>
                  最初に定める法律を宣言
                </Text>
              </View>
              <View style={styles.messengerWrap}>
                <CornerMessenger
                  compact={isCompact}
                  messages={[
                    'あなたの欲望を、ここに刻んで。',
                    'さあ、最初の一文を。',
                    '国のかたちは、この一行で決まる。',
                    '遠慮はいらない。命令して。',
                    '躊躇は記録に残らない。',
                    'どんな欲望も、私は裁く。',
                    '本音を、法律にしてしまえばいい。',
                    '誰も止めない。今だけは。',
                    'その一言が、国民の明日を決める。',
                    '建前はいらない。欲しいものを言って。',
                  ]}
                />
              </View>
            </View>
          </View>

          <View style={styles.form}>
            <View style={styles.inputSection}>
              <View style={styles.articleLabelRow}>
                <View style={styles.articleMark} />
                <Text style={styles.articleLabel}>第一条</Text>
              </View>
              <View style={styles.inputFrame}>
                <TextInput
                  accessibilityLabel="冒頭宣言"
                  editable={!isSubmitting}
                  maxLength={MAX_LENGTH}
                  multiline
                  onChangeText={setDeclaration}
                  placeholder="例：すべての国民は、毎日ひとつ願いを叶えられる。"
                  placeholderTextColor="#625e58"
                  style={styles.input}
                  textAlignVertical="top"
                  value={declaration}
                />
                <Text style={styles.counter}>{declaration.length} / {MAX_LENGTH}</Text>
              </View>
            </View>

            <View pointerEvents="none" style={styles.divider} />

            <View>
              <Text style={styles.toneLabel}>物語のトーンを選ぶ</Text>
              <View style={styles.toneRow}>
                {TONES.map((tone) => {
                  const isSelected = selectedTone === tone.id;
                  const toneColor = TONE_COLORS[tone.id] || DEFAULT_TONE_COLOR;

                  return (
                    <PressableScale
                      accessibilityLabel={`${tone.label}トーン`}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      disabled={isSubmitting}
                      glowColor={toneColor}
                      onPress={() => setSelectedTone(tone.id)}
                      key={tone.id}
                      ripple
                      style={({ pressed }) => [
                        styles.toneButton,
                        isSelected && {
                          borderColor: toneColor,
                          backgroundColor: toneColor,
                        },
                        pressed && styles.pressedButton,
                      ]}
                    >
                      <Text
                        numberOfLines={1}
                        style={[styles.toneButtonText, isSelected && styles.selectedToneButtonText]}
                      >
                        {tone.label}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>
              {selectedTone ? (
                <Text
                  style={[
                    styles.toneDescription,
                    { color: TONE_COLORS[selectedTone] || DEFAULT_TONE_COLOR },
                  ]}
                >
                  {TONES.find((tone) => tone.id === selectedTone)?.description}
                </Text>
              ) : null}
            </View>

            <PressableScale
              accessibilityRole="button"
              disabled={!canSubmit}
              flashy
              glowColor="#f2c14e"
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.launchButton,
                !canSubmit && styles.disabledButton,
                pressed && canSubmit && styles.pressedButton,
              ]}
            >
              <View style={styles.launchCore}>
                <View pointerEvents="none" style={styles.launchHighlight} />
                {isSubmitting ? (
                  <ActivityIndicator color="#f8ece4" size="small" />
                ) : (
                  <Text style={styles.launchText}>宣言</Text>
                )}
              </View>
            </PressableScale>
            {submitError ? (
              <Text accessibilityLiveRegion="polite" style={styles.errorText}>
                {submitError}
              </Text>
            ) : null}
          </View>

          <Text style={styles.note}>宣言は、この国の未来を決定します。</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0d',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  accent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 120,
    height: 4,
    backgroundColor: '#7e2024',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 28,
  },
  compactContent: {
    paddingHorizontal: 16,
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 32,
    gap: 18,
  },
  compactIntro: {
    gap: 10,
  },
  headingCopy: {
    flex: 1,
  },
  messengerWrap: {
    marginTop: -28,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 14,
    paddingVertical: 8,
    paddingRight: 12,
  },
  pressedBackButton: {
    opacity: 0.55,
  },
  backButtonText: {
    color: '#a9a39a',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
  },
  title: {
    color: '#c53a34',
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: 4,
  },
  compactTitle: {
    fontSize: 26,
    letterSpacing: 1,
  },
  description: {
    maxWidth: 360,
    marginTop: 18,
    color: '#a9a39a',
    fontSize: 15,
    lineHeight: 26,
  },
  form: {
    flex: 1,
    gap: 18,
  },
  inputSection: {
    flex: 1,
  },
  articleLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  articleMark: {
    width: 14,
    height: 1,
    backgroundColor: '#c9a24a',
  },
  articleLabel: {
    color: '#c9a24a',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#232227',
  },
  toneLabel: {
    marginBottom: 10,
    color: '#d8c9aa',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
  },
  toneRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toneButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#4e483d',
    backgroundColor: '#141417',
  },
  toneButtonText: {
    color: '#d8c9aa',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 3,
    fontStyle: 'italic',
  },
  selectedToneButtonText: {
    color: '#f8ece4',
    fontWeight: '700',
  },
  toneDescription: {
    marginTop: 8,
    color: '#a9a39a',
    fontSize: 11,
    textAlign: 'center',
  },
  inputFrame: {
    flex: 1,
    minHeight: 190,
    padding: 18,
    borderWidth: 1,
    borderColor: '#4e483d',
    backgroundColor: '#141417',
  },
  input: {
    flex: 1,
    minHeight: 130,
    color: '#f3eee4',
    fontSize: 17,
    lineHeight: 28,
  },
  counter: {
    marginTop: 12,
    color: '#625e58',
    fontSize: 11,
    textAlign: 'right',
  },
  launchButton: {
    alignSelf: 'center',
    width: 240,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    borderWidth: 5,
    borderColor: '#f2c14e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  launchCore: {
    width: 200,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#c53a34',
    borderWidth: 3,
    borderColor: '#7e2024',
    overflow: 'hidden',
  },
  launchHighlight: {
    position: 'absolute',
    top: 14,
    left: 22,
    width: 46,
    height: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    transform: [{ rotate: '-20deg' }],
  },
  launchText: {
    color: '#f8ece4',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 6,
  },
  disabledButton: {
    opacity: 0.35,
  },
  pressedButton: {
    opacity: 0.72,
  },
  errorText: {
    color: '#d98b8f',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  note: {
    color: '#625e58',
    fontSize: 11,
    letterSpacing: 1,
    textAlign: 'center',
  },
});
