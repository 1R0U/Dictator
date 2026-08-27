import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  MAX_ADDITIONAL_DECLARATION_LENGTH,
  canSubmitAdditionalDeclaration,
} from '../game/checkup';

/**
 * 節目の検診で、側近が追加宣言の有無を確認する吹き出しUI。
 *
 * @param {Object} props
 * @param {string} props.milestoneLabel 検診が発生した節目の表示名。
 * @param {Function} props.onSkip 追加宣言をせず検診を終える処理。
 * @param {Function} props.onSubmit 追加宣言を確定する処理。
 */
export default function CheckupEvent({ milestoneLabel, onSkip, onSubmit }) {
  const [declaration, setDeclaration] = useState('');
  const [pendingAction, setPendingAction] = useState('');
  const [submitError, setSubmitError] = useState('');
  const isSubmitting = pendingAction !== '';
  const canSubmit = canSubmitAdditionalDeclaration(declaration) && !isSubmitting;

  /** 入力を整形して追加宣言を親画面へ渡す。 */
  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitError('');
    setPendingAction('declare');
    try {
      await onSubmit(declaration.trim());
      setDeclaration('');
    } catch {
      setSubmitError('物語を更新できませんでした。もう一度お試しください。');
      setPendingAction('');
    }
  };

  /** 追加宣言なしで、これまでの宣言を使った物語生成へ進む。 */
  const handleSkip = async () => {
    if (isSubmitting) return;

    setSubmitError('');
    setPendingAction('skip');
    try {
      await onSkip();
    } catch {
      setSubmitError('物語を更新できませんでした。もう一度お試しください。');
      setPendingAction('');
    }
  };

  return (
    <View accessibilityLabel={`${milestoneLabel}の欲望検診`} style={styles.container}>
      <View style={styles.bubbleWrap}>
        <View pointerEvents="none" style={styles.bubbleTail} />
        <View style={styles.bubble}>
          <Text style={styles.checkupLabel}>DESIRE CHECKUP · {milestoneLabel}</Text>
          <Text style={styles.dialogue}>
            閣下、ここまでの統治はいかがでしょう。国民へ、追加で宣言しておきたいことはございますか？
          </Text>
          <Text style={styles.guidance}>
            なければスキップを。ある場合は、この場で新たな命令をお聞かせください。
          </Text>

          <View style={styles.inputFrame}>
            <TextInput
              accessibilityLabel="追加宣言"
              editable={!isSubmitting}
              maxLength={MAX_ADDITIONAL_DECLARATION_LENGTH}
              multiline
              onChangeText={setDeclaration}
              placeholder="追加の宣言を入力…"
              placeholderTextColor="#77716a"
              style={styles.input}
              textAlignVertical="top"
              value={declaration}
            />
            <Text style={styles.counter}>
              {declaration.length} / {MAX_ADDITIONAL_DECLARATION_LENGTH}
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={handleSkip}
              style={({ pressed }) => [
                styles.actionButton,
                styles.skipButton,
                isSubmitting && styles.disabledButton,
                pressed && !isSubmitting && styles.pressed,
              ]}
            >
              {pendingAction === 'skip' ? (
                <View style={styles.loadingContent}>
                  <ActivityIndicator color="#4e483d" size="small" />
                  <Text style={styles.skipButtonText}>更新中…</Text>
                </View>
              ) : (
                <Text style={styles.skipButtonText}>今回はスキップ</Text>
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={!canSubmit}
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.actionButton,
                styles.declareButton,
                !canSubmit && styles.disabledButton,
                pressed && canSubmit && styles.pressed,
              ]}
            >
              {pendingAction === 'declare' ? (
                <View style={styles.loadingContent}>
                  <ActivityIndicator color="#fffaf0" size="small" />
                  <Text style={styles.declareButtonText}>物語を更新中…</Text>
                </View>
              ) : (
                <Text style={styles.declareButtonText}>追加宣言する</Text>
              )}
            </Pressable>
          </View>
          {submitError ? (
            <Text accessibilityLiveRegion="polite" style={styles.errorText}>{submitError}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.characterColumn}>
        <View accessibilityLabel="独裁者の側近" accessible style={styles.portrait}>
          <View style={styles.hair} />
          <View style={styles.face}>
            <View style={styles.glasses}>
              <View style={styles.lens} />
              <View style={styles.glassesBridge} />
              <View style={styles.lens} />
            </View>
            <View style={styles.mouth} />
          </View>
          <View style={styles.suit}>
            <View style={styles.tie} />
          </View>
        </View>
        <Text style={styles.characterName}>側近</Text>
        <Text style={styles.characterRole}>欲望監査担当</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 620,
    marginBottom: 10,
    alignItems: 'center',
  },
  characterColumn: {
    width: 120,
    marginTop: 18,
    alignItems: 'center',
  },
  portrait: {
    width: 78,
    height: 104,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  hair: {
    position: 'absolute',
    top: 0,
    width: 58,
    height: 31,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    backgroundColor: '#3c3938',
  },
  face: {
    position: 'absolute',
    top: 17,
    width: 55,
    height: 57,
    alignItems: 'center',
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    backgroundColor: '#c6a982',
  },
  glasses: {
    marginTop: 17,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lens: {
    width: 18,
    height: 12,
    borderWidth: 2,
    borderColor: '#242326',
    borderRadius: 6,
  },
  glassesBridge: {
    width: 6,
    height: 2,
    backgroundColor: '#242326',
  },
  mouth: {
    width: 15,
    height: 2,
    marginTop: 10,
    backgroundColor: '#694b42',
  },
  suit: {
    width: 74,
    height: 43,
    alignItems: 'center',
    backgroundColor: '#29282d',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  tie: {
    width: 7,
    height: 28,
    backgroundColor: '#7e2024',
  },
  characterName: {
    marginTop: 7,
    color: '#f3eee4',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  characterRole: {
    marginTop: 3,
    color: '#77716a',
    fontSize: 8,
  },
  bubbleWrap: {
    position: 'relative',
    width: '100%',
    marginBottom: 2,
  },
  bubbleTail: {
    position: 'absolute',
    left: '50%',
    bottom: -9,
    marginLeft: -10,
    zIndex: 1,
    width: 20,
    height: 20,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#b9985a',
    backgroundColor: '#eee6d6',
    transform: [{ rotate: '45deg' }],
  },
  bubble: {
    zIndex: 2,
    padding: 22,
    borderWidth: 1,
    borderColor: '#b9985a',
    backgroundColor: '#eee6d6',
  },
  checkupLabel: {
    color: '#7e2024',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },
  dialogue: {
    marginTop: 14,
    color: '#201e1b',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 29,
  },
  guidance: {
    marginTop: 10,
    color: '#625e58',
    fontSize: 12,
    lineHeight: 20,
  },
  inputFrame: {
    minHeight: 120,
    marginTop: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#a89b84',
    backgroundColor: '#fffaf0',
  },
  input: {
    minHeight: 72,
    color: '#201e1b',
    fontSize: 15,
    lineHeight: 24,
  },
  counter: {
    marginTop: 8,
    color: '#8e8982',
    fontSize: 10,
    textAlign: 'right',
  },
  actions: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  skipButton: {
    borderWidth: 1,
    borderColor: '#8e8982',
    backgroundColor: '#eee6d6',
  },
  skipButtonText: {
    color: '#4e483d',
    fontSize: 12,
    fontWeight: '800',
  },
  declareButton: {
    backgroundColor: '#7e2024',
  },
  declareButtonText: {
    color: '#fffaf0',
    fontSize: 12,
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.35,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    marginTop: 12,
    color: '#7e2024',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
