import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { TONES, canStartDeclaration } from '../game/declaration';

const MAX_LENGTH = 500;

/**
 * 最初の法律を入力し、親コンポーネントへ送信するフォーム。
 */
export default function DeclarationForm({ onBack, onSubmit }) {
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
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          style={styles.scrollView}
        >
          <View>
            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={onBack}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressedBackButton]}
            >
              <Text style={styles.backButtonText}>← ホームへ戻る</Text>
            </Pressable>
            <Text style={styles.kicker}>FIRST DECREE</Text>
            <Text style={styles.title}>冒頭宣言</Text>
            <Text style={styles.description}>
              この国で、あなたが最初に定める法律を宣言してください。
            </Text>
          </View>

          <View style={styles.form}>
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

            <View>
              <Text style={styles.toneLabel}>物語のトーンを選ぶ</Text>
              <View style={styles.toneGrid}>
                {TONES.map((tone) => {
                  const isSelected = selectedTone === tone.id;

                  return (
                    <Pressable
                      accessibilityLabel={`${tone.label}トーン`}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      disabled={isSubmitting}
                      onPress={() => setSelectedTone(tone.id)}
                      key={tone.id}
                      style={({ pressed }) => [
                        styles.toneButton,
                        isSelected && styles.selectedToneButton,
                        pressed && styles.pressedButton,
                      ]}
                    >
                      <Text style={[styles.toneButtonText, isSelected && styles.selectedToneButtonText]}>
                        {tone.label}
                      </Text>
                      <Text style={[styles.toneDescription, isSelected && styles.selectedToneDescription]}>
                        {tone.description}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={!canSubmit}
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.submitButton,
                !canSubmit && styles.disabledButton,
                pressed && canSubmit && styles.pressedButton,
              ]}
            >
              {isSubmitting ? (
                <View style={styles.loadingContent}>
                  <ActivityIndicator color="#111114" size="small" />
                  <Text style={styles.submitText}>宣言中...</Text>
                </View>
              ) : (
                <Text style={styles.submitText}>この法律を宣言する</Text>
              )}
            </Pressable>
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
    paddingTop: 64,
    paddingBottom: 28,
  },
  kicker: {
    marginBottom: 14,
    color: '#b9985a',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 4,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 36,
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
    color: '#f3eee4',
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: 4,
  },
  description: {
    maxWidth: 360,
    marginTop: 18,
    color: '#a9a39a',
    fontSize: 15,
    lineHeight: 26,
  },
  form: {
    gap: 18,
  },
  toneLabel: {
    marginBottom: 10,
    color: '#d8c9aa',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  toneGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  toneButton: {
    width: '48%',
    minHeight: 70,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#4e483d',
    backgroundColor: '#141417',
  },
  selectedToneButton: {
    borderColor: '#b9985a',
    backgroundColor: '#b9985a',
  },
  toneButtonText: {
    color: '#f3eee4',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  selectedToneButtonText: {
    color: '#111114',
  },
  toneDescription: {
    marginTop: 5,
    color: '#a9a39a',
    fontSize: 11,
  },
  selectedToneDescription: {
    color: '#3c3020',
  },
  inputFrame: {
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
  submitButton: {
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#b9985a',
  },
  disabledButton: {
    opacity: 0.35,
  },
  pressedButton: {
    opacity: 0.72,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  submitText: {
    color: '#111114',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
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
