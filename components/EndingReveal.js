import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { AXES } from '../data/axes';
import {
  METER_MAX,
  METER_MIN,
  clampMeterValue,
  createRevealCompletionNotifier,
  normalizeMeterValue,
} from '../game/endingReveal';
import { getDesireTraitSentence } from '../game/desireTraits';

const PHASES = Object.freeze({
  ENDING: 'ending',
  METER: 'meter',
});

/**
 * エンディング本文を先に見せ、操作後に最終欲望メーターを開示する。
 *
 * @param {Object} props
 * @param {string} props.headline generateEndingが返すエンディング見出し。
 * @param {string} props.body generateEndingが返すエンディング本文。
 * @param {Object.<string, number>} props.finalMeter 各欲望軸の最終値。
 * @param {Function} [props.onRevealComplete] メーター開示アニメーション完了時の処理。
 * @param {Function} [props.onReturnHome] 表示完了後にホームへ戻る処理。
 * @param {string} [props.returnLabel] 表示完了後の戻るボタン文言。
 */
export default function EndingReveal({
  headline,
  body,
  finalMeter,
  onRevealComplete,
  onReturnHome,
  returnLabel = 'ホームへ戻る',
}) {
  const [phase, setPhase] = useState(PHASES.ENDING);
  const [isRevealComplete, setIsRevealComplete] = useState(false);
  const meterAnimations = useRef(AXES.map(() => new Animated.Value(0))).current;
  const activeAnimation = useRef(null);
  const isRevealing = useRef(false);
  const onRevealCompleteRef = useRef(onRevealComplete);
  const completionNotifier = useRef(
    createRevealCompletionNotifier(() => onRevealCompleteRef.current?.()),
  ).current;

  useEffect(() => {
    onRevealCompleteRef.current = onRevealComplete;
  }, [onRevealComplete]);

  useEffect(() => {
    setPhase(PHASES.ENDING);
    setIsRevealComplete(false);
    isRevealing.current = false;
    completionNotifier.reset();
    meterAnimations.forEach((animation) => animation.setValue(0));

    return () => {
      activeAnimation.current?.stop();
      activeAnimation.current = null;
      isRevealing.current = false;
    };
  }, [completionNotifier, headline, meterAnimations]);

  /** 欲望メーターを順番に開示し、完了を外部へ通知する。 */
  const revealMeter = () => {
    if (phase !== PHASES.ENDING || isRevealing.current) return;

    isRevealing.current = true;
    setPhase(PHASES.METER);
    activeAnimation.current = Animated.stagger(
      120,
      meterAnimations.map((animation) => (
        Animated.timing(animation, {
          duration: 500,
          toValue: 1,
          useNativeDriver: false,
        })
      )),
    );
    activeAnimation.current.start(({ finished }) => {
      activeAnimation.current = null;
      if (completionNotifier.notify(finished)) {
        setIsRevealComplete(true);
      }
    });
  };

  return (
    <View style={styles.container}>
      {phase === PHASES.ENDING ? (
        <View accessibilityLiveRegion="polite" style={styles.endingPanel}>
          <Text style={styles.kicker}>THE END OF YOUR NATION</Text>
          <Text style={styles.headline}>{headline}</Text>
          <View style={styles.rule} />
          <Text style={styles.body}>{body}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={revealMeter}
            style={({ pressed }) => [styles.revealButton, pressed && styles.pressed]}
          >
            <Text style={styles.revealButtonText}>欲望の正体を見る</Text>
            <Text style={styles.revealButtonIcon}>↓</Text>
          </Pressable>
        </View>
      ) : (
        <View accessibilityLiveRegion="polite" style={styles.meterPanel}>
          <Text style={styles.kicker}>DESIRE REVEALED</Text>
          <Text style={styles.meterTitle}>あなたが本当に望んでいたもの</Text>
          <Text style={styles.meterLead}>宣言の裏に積み重なった欲望の最終値</Text>

          <View style={styles.meterList}>
            {AXES.map((axis, index) => {
              const value = clampMeterValue(finalMeter?.[axis.key]);
              const traitSentence = getDesireTraitSentence(axis.key, value);
              const width = meterAnimations[index].interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', `${normalizeMeterValue(value)}%`],
              });

              return (
                <View
                  accessibilityLabel={`${axis.name} ${value}。${traitSentence}`}
                  accessibilityValue={{
                    max: METER_MAX,
                    min: METER_MIN,
                    now: value,
                  }}
                  accessible
                  key={axis.key}
                  style={styles.meterRow}
                >
                  <View style={styles.meterLabels}>
                    <Text style={styles.axisLabel}>
                      {axis.label} / {axis.englishName.toUpperCase()}
                    </Text>
                    <Text style={styles.axisValue}>{value}</Text>
                  </View>
                  <View style={styles.meterTrack}>
                    <Animated.View style={[styles.meterFill, { width }]} />
                  </View>
                  <Text style={styles.axisTrait}>
                    {traitSentence}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.scaleLabels}>
            <Text style={styles.scaleText}>{METER_MIN}</Text>
            <Text style={styles.scaleText}>50</Text>
            <Text style={styles.scaleText}>{METER_MAX}</Text>
          </View>
          {isRevealComplete && onReturnHome ? (
            <Pressable
              accessibilityRole="button"
              onPress={onReturnHome}
              style={({ pressed }) => [styles.homeButton, pressed && styles.pressed]}
            >
              <Text style={styles.homeButtonText}>{returnLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 560,
  },
  endingPanel: {
    padding: 28,
    borderWidth: 1,
    borderColor: '#7e2024',
    backgroundColor: '#151216',
  },
  meterPanel: {
    padding: 28,
    borderWidth: 1,
    borderColor: '#b9985a',
    backgroundColor: '#111114',
  },
  kicker: {
    color: '#b9985a',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
    textAlign: 'center',
  },
  headline: {
    marginTop: 24,
    color: '#f3eee4',
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 43,
    textAlign: 'center',
  },
  rule: {
    alignSelf: 'center',
    width: 52,
    height: 3,
    marginVertical: 22,
    backgroundColor: '#7e2024',
  },
  body: {
    color: '#c8c0b5',
    fontSize: 16,
    lineHeight: 29,
    textAlign: 'center',
  },
  revealButton: {
    minHeight: 58,
    marginTop: 30,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#b9985a',
  },
  revealButtonText: {
    color: '#111114',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  revealButtonIcon: {
    color: '#111114',
    fontSize: 20,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.7,
  },
  meterTitle: {
    marginTop: 20,
    color: '#f3eee4',
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 36,
    textAlign: 'center',
  },
  meterLead: {
    marginTop: 10,
    color: '#8e8982',
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'center',
  },
  meterList: {
    marginTop: 30,
    gap: 20,
  },
  meterRow: {
    gap: 8,
  },
  meterLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  axisLabel: {
    color: '#d8c9aa',
    fontSize: 14,
    fontWeight: '800',
  },
  axisValue: {
    color: '#f3eee4',
    fontSize: 14,
    fontWeight: '900',
  },
  axisTrait: {
    marginTop: 3,
    color: '#8e8982',
    fontSize: 11,
    lineHeight: 18,
  },
  meterTrack: {
    height: 10,
    overflow: 'hidden',
    backgroundColor: '#2d2b30',
  },
  meterFill: {
    height: '100%',
    backgroundColor: '#7e2024',
  },
  scaleLabels: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleText: {
    color: '#625e58',
    fontSize: 10,
    fontWeight: '700',
  },
  homeButton: {
    minHeight: 56,
    marginTop: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#b9985a',
    backgroundColor: '#17171a',
  },
  homeButtonText: {
    color: '#d8c9aa',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
