import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';

import PressableScale from './PressableScale';
import { AXES } from '../data/axes';
import {
  METER_MAX,
  METER_MIN,
  clampMeterValue,
  createRevealCompletionNotifier,
  normalizeMeterValue,
} from '../game/endingReveal';
import {
  getDesireTendencyLabel,
  getDesireTraitKeywords,
  getDesireTraitSentence,
} from '../game/desireTraits';
import { getDesireBiasComment } from '../game/desireBias';
import { resolveCurrentFigure } from '../game/figureMatch';
import { FIGURE_DIAGNOSIS_DISCLAIMER, buildFallbackBlurb } from '../data/figures';
import { getCollapseVisual } from '../data/collapseVisuals';
import { ENDING_CATALOG } from '../data/endingCatalog';
import { playCollapseSoundEffects, playSoundEffect } from '../utils/sound';
import { shouldStartCollapseIntro } from '../game/collapseIntro';

const PHASES = Object.freeze({
  ENDING: 'ending',
  METER: 'meter',
});
const COLLAPSE_CHARACTERS = Object.freeze(['国', '家', '滅', '亡']);
const COLLAPSE_CHARACTER_INTERVAL_MS = 900;
const FULLSCREEN_IMAGE_DURATION_MS = 4300;
const COLLAPSE_SOUND = require('../assets/collapse-impact.wav');

setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});

/** Split a trait sentence into plain/highlighted segments so key words stand out visually. */
function splitTraitSentenceSegments(sentence, keywords) {
  const segments = [];
  let remaining = sentence;

  keywords.forEach((keyword) => {
    const index = remaining.indexOf(keyword);
    if (index === -1) return;
    if (index > 0) segments.push({ text: remaining.slice(0, index), highlight: false });
    segments.push({ text: keyword, highlight: true });
    remaining = remaining.slice(index + keyword.length);
  });

  if (remaining) segments.push({ text: remaining, highlight: false });
  return segments;
}

/**
 * エンディング本文を先に見せ、操作後に最終欲望メーターを開示する。
 *
 * @param {Object} props
 * @param {string} props.headline generateEndingが返すエンディング見出し。
 * @param {string} props.body generateEndingが返すエンディング本文。
 * @param {string} [props.endingType] 決定済みのエンディング型。
 * @param {Object.<string, number>} props.finalMeter 各欲望軸の最終値。
 * @param {{figure: Object, blurb: string, biasComment: string}} [props.figureDiagnosis]
 *   事前に選出・生成済みの偉人診断（未指定時はローカルで即時算出する）。
 * @param {Function} [props.onRevealComplete] メーター開示アニメーション完了時の処理。
 * @param {Function} [props.onReturnHome] 表示完了後にホームへ戻る処理。
 * @param {string} [props.returnLabel] 表示完了後の戻るボタン文言。
 * @param {Object} [props.scrollViewRef] 欲望パネルへ自動スクロールする親ScrollViewのref。
 * @param {boolean} [props.enableCollapseIntro] ライブの国家滅亡時だけ初回演出を有効にする。
 */
export default function EndingReveal({
  headline,
  body,
  endingType,
  finalMeter,
  figureDiagnosis,
  onRevealComplete,
  onReturnHome,
  returnLabel = 'ホームへ戻る',
  scrollViewRef,
  enableCollapseIntro = false,
}) {
  const [phase, setPhase] = useState(PHASES.ENDING);
  const [isRevealComplete, setIsRevealComplete] = useState(false);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const [visibleCollapseCharacterCount, setVisibleCollapseCharacterCount] = useState(0);
  const collapseVisual = getCollapseVisual(endingType);
  const collapseAudioSource = enableCollapseIntro && collapseVisual ? COLLAPSE_SOUND : null;
  const collapseHitOne = useAudioPlayer(collapseAudioSource);
  const collapseHitTwo = useAudioPlayer(collapseAudioSource);
  const collapseHitThree = useAudioPlayer(collapseAudioSource);
  const collapseHitFour = useAudioPlayer(collapseAudioSource);
  const meterAnimations = useRef(AXES.map(() => new Animated.Value(0))).current;
  const panelRevealAnimation = useRef(new Animated.Value(0)).current;
  const resolvedFigureState = resolveCurrentFigure(finalMeter, figureDiagnosis?.figure);
  const resolvedFigure = resolvedFigureState.figure;
  const resolvedBlurb = resolvedFigureState.canReuseCopy && figureDiagnosis?.blurb
    ? figureDiagnosis.blurb
    : (resolvedFigure ? buildFallbackBlurb(resolvedFigure) : null);
  const resolvedBiasComment = resolvedFigureState.canReuseCopy && figureDiagnosis?.biasComment
    ? figureDiagnosis.biasComment
    : getDesireBiasComment(finalMeter);
  const collapseLabel = collapseVisual ? ENDING_CATALOG[endingType]?.label : null;
  const activeAnimation = useRef(null);
  const isRevealing = useRef(false);
  const onRevealCompleteRef = useRef(onRevealComplete);
  const completionNotifier = useRef(
    createRevealCompletionNotifier(() => onRevealCompleteRef.current?.()),
  ).current;
  const containerYRef = useRef(0);
  const hasScrolledToMeterRef = useRef(false);
  const scrollAnimationFrameRef = useRef(null);
  const playedCollapseTypeRef = useRef(null);
  const collapseSequenceTimeoutsRef = useRef([]);
  const collapseHitPlayersRef = useRef([]);
  collapseHitPlayersRef.current = [
    collapseHitOne,
    collapseHitTwo,
    collapseHitThree,
    collapseHitFour,
  ];

  useEffect(() => {
    onRevealCompleteRef.current = onRevealComplete;
  }, [onRevealComplete]);

  useEffect(() => {
    setPhase(PHASES.ENDING);
    setIsRevealComplete(false);
    setIsImageFullscreen(Boolean(collapseVisual));
    isRevealing.current = false;
    hasScrolledToMeterRef.current = false;
    completionNotifier.reset();
    panelRevealAnimation.setValue(0);
    meterAnimations.forEach((animation) => animation.setValue(0));

    if (collapseVisual) {
      playCollapseSoundEffects();
    } else {
      playSoundEffect('happyEnd');
    }

    return () => {
      activeAnimation.current?.stop();
      activeAnimation.current = null;
      if (scrollAnimationFrameRef.current !== null) {
        cancelAnimationFrame(scrollAnimationFrameRef.current);
        scrollAnimationFrameRef.current = null;
      }
      isRevealing.current = false;
    };
  }, [collapseVisual, completionNotifier, endingType, headline, meterAnimations, panelRevealAnimation]);

  /** Cancel pending character hits and stop any sound that is still playing. */
  const stopCollapseSequence = () => {
    collapseSequenceTimeoutsRef.current.forEach(clearTimeout);
    collapseSequenceTimeoutsRef.current = [];
    collapseHitPlayersRef.current.forEach((player) => player.pause());
  };

  /** ライブの滅亡直後だけ、四文字と四打の効果音を一度だけ開始する。 */
  useEffect(() => {
    if (!enableCollapseIntro || !collapseVisual) {
      setVisibleCollapseCharacterCount(0);
      return;
    }
    if (!shouldStartCollapseIntro({
      enabled: enableCollapseIntro,
      endingType,
      hasCollapseVisual: Boolean(collapseVisual),
      playedEndingType: playedCollapseTypeRef.current,
    })) return;

    setVisibleCollapseCharacterCount(0);
    stopCollapseSequence();
    collapseSequenceTimeoutsRef.current = collapseHitPlayersRef.current.map((player, index) => (
      setTimeout(() => {
        if (index === 0) playedCollapseTypeRef.current = endingType;
        player.volume = 0.6;
        player.play();
        setVisibleCollapseCharacterCount(index + 1);
      }, index * COLLAPSE_CHARACTER_INTERVAL_MS)
    ));

    return stopCollapseSequence;
  }, [collapseVisual, enableCollapseIntro, endingType]);

  /** 全画面表示中は一定時間で自動的に閉じる。 */
  useEffect(() => {
    if (!isImageFullscreen) return undefined;

    const timer = setTimeout(() => {
      setIsImageFullscreen(false);
      setVisibleCollapseCharacterCount(0);
    }, FULLSCREEN_IMAGE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [isImageFullscreen]);

  const closeFullscreenImage = () => {
    stopCollapseSequence();
    setIsImageFullscreen(false);
    setVisibleCollapseCharacterCount(0);
  };

  /** 欲望メーターを順番に開示し、完了を外部へ通知する。二度目以降はアニメーションを省略して即再表示する。 */
  const openMeter = () => {
    if (phase === PHASES.METER || isRevealing.current) return;

    if (isRevealComplete) {
      setPhase(PHASES.METER);
      return;
    }

    isRevealing.current = true;
    setPhase(PHASES.METER);
    activeAnimation.current = Animated.parallel([
      Animated.timing(panelRevealAnimation, {
        duration: 420,
        toValue: 1,
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.delay(180),
        Animated.stagger(
          120,
          meterAnimations.map((animation) => (
            Animated.timing(animation, {
              duration: 500,
              toValue: 1,
              useNativeDriver: false,
            })
          )),
        ),
      ]),
    ]);
    activeAnimation.current.start(({ finished }) => {
      activeAnimation.current = null;
      isRevealing.current = false;
      if (completionNotifier.notify(finished)) {
        setIsRevealComplete(true);
      }
    });
  };

  /** 開示済みの欲望メーターを閉じる。 */
  const closeMeter = () => {
    if (phase !== PHASES.METER) return;
    setPhase(PHASES.ENDING);
  };

  /** ボタン1つで開示・格納をトグルする。 */
  const handleToggleMeter = () => {
    if (phase === PHASES.METER) {
      closeMeter();
    } else {
      openMeter();
    }
  };

  /** Scroll the parent once so the newly mounted meter starts inside the viewport. */
  const handleMeterLayout = ({ nativeEvent }) => {
    if (hasScrolledToMeterRef.current || !scrollViewRef?.current) return;

    hasScrolledToMeterRef.current = true;
    const meterY = nativeEvent.layout.y;
    scrollAnimationFrameRef.current = requestAnimationFrame(() => {
      scrollAnimationFrameRef.current = null;
      scrollViewRef.current?.scrollTo({
        animated: true,
        y: Math.max(containerYRef.current + meterY - 16, 0),
      });
    });
  };

  /** 崩壊光景の再表示・ホームへ戻るボタン。閉じているときは見るボタン直下、開いているときは一番下に置く。 */
  const extraActions = (
    <>
      {collapseVisual ? (
        <PressableScale
          accessibilityRole="button"
          glowColor="#8c3c2f"
          onPress={() => setIsImageFullscreen(true)}
          style={({ pressed }) => [styles.replayImageButton, pressed && styles.pressed]}
        >
          <Text style={styles.replayImageButtonText}>崩壊の光景をもう一度見る</Text>
        </PressableScale>
      ) : null}
      {onReturnHome ? (
        <PressableScale
          accessibilityRole="button"
          glowColor="#b9985a"
          onPress={() => {
            playSoundEffect('returnHome');
            onReturnHome();
          }}
          style={({ pressed }) => [
            styles.homeButton,
            collapseVisual && styles.homeButtonAfterReplay,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.homeButtonText}>{returnLabel}</Text>
        </PressableScale>
      ) : null}
    </>
  );

  return (
    <View
      onLayout={({ nativeEvent }) => {
        containerYRef.current = nativeEvent.layout.y;
      }}
      style={styles.container}
    >
      {collapseVisual ? (
        <Modal
          animationType="fade"
          onRequestClose={closeFullscreenImage}
          transparent={false}
          visible={isImageFullscreen}
        >
          <Pressable
            accessibilityRole="button"
            onPress={closeFullscreenImage}
            style={styles.fullscreenOverlay}
          >
            <Image
              accessibilityLabel={collapseVisual.imageLabel}
              accessible
              resizeMode="cover"
              source={collapseVisual.image}
              style={styles.fullscreenImage}
            />
            <View style={styles.fullscreenShade} />
            {visibleCollapseCharacterCount > 0 ? (
              <View
                accessibilityLabel={COLLAPSE_CHARACTERS
                  .slice(0, visibleCollapseCharacterCount)
                  .join('')}
                accessibilityLiveRegion="assertive"
                accessible
                style={[styles.collapseAnnouncement, { pointerEvents: 'none' }]}
              >
                <View style={styles.collapseCharacterRow}>
                  {COLLAPSE_CHARACTERS.map((character, index) => (
                    <Text
                      key={character}
                      style={[
                        styles.collapseAnnouncementText,
                        index >= visibleCollapseCharacterCount && styles.hiddenCollapseCharacter,
                      ]}
                    >
                      {character}
                    </Text>
                  ))}
                </View>
                <View style={styles.collapseAnnouncementRule} />
              </View>
            ) : null}
            <View style={styles.fullscreenMark}>
              <Text style={styles.fullscreenNumber}>{collapseVisual.number}</Text>
              <Text style={styles.fullscreenLabel}>{collapseLabel}</Text>
            </View>
            <Text style={styles.fullscreenHint}>タップして続ける</Text>
          </Pressable>
        </Modal>
      ) : null}
      <View style={[styles.endingPanel, collapseVisual && styles.collapseEndingPanel]}>
        {!collapseVisual ? <Text style={styles.kicker}>THE END OF YOUR NATION</Text> : null}
        <Text style={[styles.headline, collapseVisual && styles.collapseHeadline]}>
          {headline}
        </Text>
        <View style={[styles.rule, collapseVisual && styles.collapseRule]} />
        {collapseVisual ? <Text style={styles.collapseReasonLabel}>滅亡理由</Text> : null}
        <Text style={[styles.body, collapseVisual && styles.collapseBody]}>{body}</Text>
      </View>
      <PressableScale
        accessibilityRole="button"
        accessibilityState={{
          disabled: phase === PHASES.METER && !isRevealComplete,
          expanded: phase === PHASES.METER,
        }}
        disabled={phase === PHASES.METER && !isRevealComplete}
        flashy={phase === PHASES.ENDING}
        glowColor="#b9985a"
        onPress={handleToggleMeter}
        style={({ pressed }) => [
          styles.revealButton,
          phase === PHASES.METER && !isRevealComplete && styles.revealedButton,
          pressed && styles.pressed,
        ]}
      >
        <Text
          accessibilityLiveRegion={phase === PHASES.METER ? 'polite' : 'none'}
          style={styles.revealButtonText}
        >
          {phase === PHASES.ENDING
            ? '欲望の正体を見る'
            : (isRevealComplete ? '閉じる' : '欲望の正体を表示中…')}
        </Text>
        <Text style={styles.revealButtonIcon}>
          {phase === PHASES.ENDING ? '↓' : (isRevealComplete ? '↑' : '…')}
        </Text>
      </PressableScale>
      {phase === PHASES.ENDING ? extraActions : null}
      {phase === PHASES.METER ? (
        <Animated.View
          onLayout={handleMeterLayout}
          style={[
            styles.meterPanel,
            {
              opacity: panelRevealAnimation,
              transform: [{
                translateY: panelRevealAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-18, 0],
                }),
              }],
            },
          ]}
        >
          <Text style={styles.kicker}>DESIRE REVEALED</Text>
          <Text style={styles.meterTitle}>あなたが本当に望んでいたもの</Text>
          <Text style={styles.meterLead}>宣言の裏に積み重なった欲望の最終値</Text>

          <View style={styles.meterList}>
            {AXES.map((axis, index) => {
              const value = clampMeterValue(finalMeter?.[axis.key]);
              const traitSentence = getDesireTraitSentence(axis.key, value);
              const traitKeywords = getDesireTraitKeywords(axis.key, value);
              const traitSegments = splitTraitSentenceSegments(traitSentence, traitKeywords);
              const position = normalizeMeterValue(value);
              const width = meterAnimations[index].interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', `${Math.abs(position - 50)}%`],
              });
              const fillPosition = value < 0 ? `${position}%` : '50%';

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
                    <Text style={styles.axisValue}>{value > 0 ? `+${value}` : value}</Text>
                  </View>
                  <View style={styles.poleLabels}>
                    <Text style={styles.poleLabel}>{axis.leftLabel}</Text>
                    <Text style={styles.poleLabel}>{axis.rightLabel}</Text>
                  </View>
                  <Text style={styles.tendencyLabel}>
                    {getDesireTendencyLabel(axis.key, value)}
                  </Text>
                  <View style={styles.meterTrack}>
                    <View style={styles.meterCenter} />
                    <Animated.View style={[styles.meterFill, { left: fillPosition, width }]} />
                  </View>
                  <Text style={styles.axisTrait}>
                    {traitSegments.map((segment, segmentIndex) => (
                      <Text
                        key={segmentIndex}
                        style={segment.highlight ? styles.axisTraitHighlight : null}
                      >
                        {segment.text}
                      </Text>
                    ))}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.scaleLabels}>
            <Text style={styles.scaleText}>{METER_MIN}</Text>
            <Text style={styles.scaleText}>0</Text>
            <Text style={styles.scaleText}>{METER_MAX}</Text>
          </View>
          {isRevealComplete && resolvedFigure ? (
            <View accessibilityLiveRegion="polite" style={styles.figurePanel}>
              <Text style={styles.figureKicker}>FIGURE DIAGNOSIS</Text>
              <Text style={styles.figureLead}>あなたに最も近い人物は…</Text>
              <Text style={styles.figureName}>{resolvedFigure.name}</Text>
              <Text style={styles.figureEpithet}>{resolvedFigure.type ?? resolvedFigure.epithet}</Text>
              <View style={styles.figureStatList}>
                {AXES.map((axis) => {
                  const value = clampMeterValue(resolvedFigure.pattern?.[axis.key]);
                  const position = normalizeMeterValue(value);
                  const width = `${Math.abs(position - 50)}%`;
                  const fillPosition = value < 0 ? `${position}%` : '50%';

                  return (
                    <View
                      accessibilityLabel={`${resolvedFigure.name}の${axis.name} ${value}`}
                      accessibilityValue={{ max: METER_MAX, min: METER_MIN, now: value }}
                      accessible
                      key={axis.key}
                      style={styles.figureStatRow}
                    >
                      <View style={styles.figureStatLabels}>
                        <Text style={styles.figureStatLabel}>{axis.label}</Text>
                        <Text style={styles.figureStatValue}>{value > 0 ? `+${value}` : value}</Text>
                      </View>
                      <View style={styles.meterTrack}>
                        <View style={styles.meterCenter} />
                        <View style={[styles.meterFill, { left: fillPosition, width }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
              <Text style={styles.figureBlurb}>{resolvedBlurb}</Text>
              <View style={styles.biasDivider} />
              <Text style={styles.biasLabel}>あなたの性格は偏見的にこれ！</Text>
              <Text style={styles.biasComment}>{resolvedBiasComment}</Text>
              <Text style={styles.figureDisclaimer}>{FIGURE_DIAGNOSIS_DISCLAIMER}</Text>
            </View>
          ) : null}
        </Animated.View>
      ) : null}
      {phase === PHASES.METER ? extraActions : null}
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
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: '#080707',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  fullscreenShade: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    height: '30%',
    backgroundColor: 'rgba(8, 5, 5, 0.5)',
  },
  fullscreenMark: {
    position: 'absolute',
    right: 24,
    bottom: 40,
    left: 24,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    gap: 12,
  },
  collapseAnnouncement: {
    position: 'absolute',
    top: '42%',
    right: 20,
    left: 20,
    alignItems: 'center',
  },
  collapseAnnouncementText: {
    color: '#f4e8d7',
    fontSize: 58,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(112, 12, 8, 1)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 14,
  },
  collapseCharacterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  hiddenCollapseCharacter: {
    opacity: 0,
  },
  collapseAnnouncementRule: {
    width: 180,
    height: 2,
    marginTop: 14,
    backgroundColor: '#a64234',
  },
  fullscreenNumber: {
    color: '#c28a62',
    fontSize: 44,
    fontWeight: '300',
    letterSpacing: 6,
  },
  fullscreenLabel: {
    color: '#ead8c4',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  fullscreenHint: {
    position: 'absolute',
    top: 56,
    alignSelf: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    letterSpacing: 2,
  },
  collapseEndingPanel: {
    borderColor: '#5f3025',
    backgroundColor: '#100c0c',
  },
  collapseHeadline: {
    marginTop: 0,
    color: '#ead8c4',
    textShadowColor: 'rgba(132, 43, 28, 0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  collapseRule: {
    width: 86,
    height: 1,
    backgroundColor: '#8c3c2f',
  },
  collapseReasonLabel: {
    marginBottom: 12,
    color: '#a96b52',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 4,
    textAlign: 'center',
  },
  collapseBody: {
    color: '#cdb9a4',
  },
  meterPanel: {
    marginTop: 8,
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
  revealedButton: {
    opacity: 0.72,
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
  poleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  poleLabel: {
    color: '#8e8982',
    fontSize: 10,
    fontWeight: '800',
  },
  tendencyLabel: {
    marginBottom: 5,
    color: '#d8c9aa',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  axisTrait: {
    marginTop: 3,
    color: '#8e8982',
    fontSize: 11,
    lineHeight: 18,
  },
  axisTraitHighlight: {
    color: '#d8c9aa',
    fontWeight: '900',
  },
  meterTrack: {
    position: 'relative',
    height: 10,
    overflow: 'hidden',
    backgroundColor: '#2d2b30',
  },
  meterFill: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#7e2024',
  },
  meterCenter: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 2,
    backgroundColor: '#d8c9aa',
    zIndex: 1,
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
  figurePanel: {
    marginTop: 30,
    padding: 20,
    borderWidth: 1,
    borderColor: '#7e2024',
    backgroundColor: '#151216',
  },
  figureKicker: {
    color: '#b9985a',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
    textAlign: 'center',
  },
  figureLead: {
    marginTop: 12,
    color: '#8e8982',
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'center',
  },
  figureName: {
    marginTop: 10,
    color: '#f3eee4',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  figureEpithet: {
    marginTop: 4,
    color: '#d8c9aa',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  figureStatList: {
    marginTop: 18,
    gap: 10,
  },
  figureStatRow: {
    gap: 5,
  },
  figureStatLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  figureStatLabel: {
    color: '#d8c9aa',
    fontSize: 12,
    fontWeight: '800',
  },
  figureStatValue: {
    color: '#f3eee4',
    fontSize: 12,
    fontWeight: '900',
  },
  figureBlurb: {
    marginTop: 14,
    color: '#c8c0b5',
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'center',
  },
  biasDivider: {
    alignSelf: 'center',
    width: 32,
    height: 2,
    marginTop: 18,
    backgroundColor: '#3a3640',
  },
  biasLabel: {
    marginTop: 10,
    color: '#8e8982',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
  },
  biasComment: {
    marginTop: 6,
    color: '#c8956a',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'center',
  },
  figureDisclaimer: {
    marginTop: 16,
    color: '#625e58',
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
  },
  replayImageButton: {
    minHeight: 52,
    marginTop: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#5f3025',
    backgroundColor: 'transparent',
  },
  replayImageButtonText: {
    color: '#c8956a',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
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
  homeButtonAfterReplay: {
    marginTop: 12,
  },
  homeButtonText: {
    color: '#d8c9aa',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
