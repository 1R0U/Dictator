import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { mapDesire } from './api/mapDesire';
import { moveDesireAxesTowardNeutral } from './game/desireScale';
import { generateBeat } from './api/generateBeat';
import { generateEnding } from './api/generateEnding';
import { generateFigureDiagnosis } from './api/generateFigureDiagnosis';
import { generateNarration } from './api/generateNarration';
import CheckupEvent from './components/CheckupEvent';
import Codex from './components/Codex';
import DeclarationForm from './components/DeclarationForm';
import EndingReveal from './components/EndingReveal';
import EndingNews from './components/EndingNews';
import History from './components/History';
import HistoryDetail from './components/HistoryDetail';
import MilestoneReport, { MilestoneNavigation } from './components/MilestoneReport';
import TitleScreen from './components/TitleScreen';
import { unlockCodexEntry } from './data/codex';
import { saveResult } from './data/history';
import { MILESTONES } from './data/milestones';
import {
  completeCheckup,
  createAdditionalDeclaration,
  getPreviousDeclarationTexts,
  getVisibleAdditionalDeclarations,
  shouldShowCheckup,
} from './game/checkup';
import { createGenerationInput } from './game/declaration';
import { applyMapping, createInitialMeter } from './game/meter';
import { matchFigure } from './game/figureMatch';
import {
  advanceCollapseState,
  determineCollapseRoute,
  shouldTriggerNationCollapse,
} from './game/milestoneEnding';
import { decideEnding } from './game/decideEnding';
import { isMilestoneReportPending } from './game/milestoneReport';
import { STAGES } from './game/navigation';
import { getPreviousMilestoneEvents } from './game/storyContext';
import { createHistoryResult } from './game/historyView';
import { playSoundEffect } from './utils/sound';
import {
  buildEndingNarrationText,
  createEndingNewsScenes,
} from './game/endingNews';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
// desireAxesが未設定（通常発生しない）な場合のみ使うフォールバック値。
const FALLBACK_FINAL_METER = Object.freeze({
  domination: 82,
  egoism: 44,
  innovation: 28,
  prestige: 14,
  madness: 44,
});
// エンディング型の判定ロジック（#6/#25）が未実装のため、型自体は仮固定。

const FALLBACK_ENDING_HEADLINE = '黄金色の静寂';
const FALLBACK_ENDING_BODY =
  '国はあなたの宣言を忠実に実行し続けた。やがて人々は命令に従うことだけを覚え、静かな繁栄と引き換えに、自ら選ぶ未来を手放した。';

/**
 * 未実装の遷移先に共通のプレースホルダー画面を表示する。
 */
function DestinationPlaceholder({ eyebrow, title, children, scrollViewRef }) {
  return (
    <SafeAreaView style={styles.destination}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.destinationKeyboardArea}
      >
        <ScrollView
          contentContainerStyle={styles.destinationContent}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="always"
          ref={scrollViewRef}
          style={styles.destinationScroll}
        >
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.destinationTitle}>{title}</Text>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * 節目ごとの宣言内容、表裏レポート、欲望軸を表示する。
 */
function DayGenerationScreen({
  declaration,
  milestone,
  previousMilestone,
  nextMilestone,
  onPrevious,
  onNext,
  onFinish,
  isFinishing,
  isPreparingEnding,
  isCollapsePending,
  showCheckup,
  additionalDeclarations = [],
  onSkipCheckup,
  onSubmitAdditionalDeclaration,
  report,
  isReportLoading,
}) {
  const nextLabel = isPreparingEnding
    ? '\u30cb\u30e5\u30fc\u30b9\u3092\u6e96\u5099\u4e2d\u2026'
    : isFinishing
    ? '時間を進めています…'
    : nextMilestone
    ? `${nextMilestone.label}へ進む`
    : '\u30cb\u30e5\u30fc\u30b9\u3092\u59cb\u3081\u308b';
  const isNextDisabled = isFinishing || isPreparingEnding;
  const onNextAction = isCollapsePending ? onFinish : (nextMilestone ? onNext : onFinish);

  return (
    <SafeAreaView style={styles.destination}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.destinationKeyboardArea}
      >
        <View style={styles.destinationBody}>
          <ScrollView
            contentContainerStyle={styles.destinationContent}
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            keyboardShouldPersistTaps="always"
            style={styles.destinationScroll}
          >
            <Text style={styles.eyebrow}>MILESTONE</Text>
            <Text style={styles.destinationTitle}>{milestone.label}</Text>
            <View style={styles.declarationBlock}>
              <Text style={styles.destinationDeclaration}>「{declaration}」</Text>
              {additionalDeclarations.map((item, index) => (
                <Text
                  key={`${item.milestoneKey}-${index}`}
                  style={styles.additionalDeclaration}
                >
                  追加宣言「{item.declaration}」
                </Text>
              ))}
            </View>
            {showCheckup ? (
              <CheckupEvent
                key={milestone.key}
                milestoneLabel={milestone.label}
                onSkip={onSkipCheckup}
                onSubmit={onSubmitAdditionalDeclaration}
              />
            ) : (
              <MilestoneReport
                collapsePressure={report?.collapsePressure}
                headline={report?.headline ?? ''}
                hideNavigation
                isFallback={report?.isFallback ?? false}
                isLoading={isReportLoading}
                key={milestone.key}
                memo={report?.memo ?? ''}
                milestoneLabel={milestone.label}
                news={report?.news ?? ''}
              />
            )}
          </ScrollView>
          {!showCheckup ? (
            <View pointerEvents="box-none" style={styles.stickyNavigationBar}>
              <View style={styles.stickyNavigationInner}>
                <MilestoneNavigation
                  isFinal={!nextMilestone && !isCollapsePending}
                  nextLabel={nextLabel}
                  nextDisabled={isNextDisabled}
                  onNext={onNextAction}
                  onPrevious={previousMilestone ? onPrevious : undefined}
                  previousLabel={previousMilestone ? `${previousMilestone.label}へ戻る` : undefined}
                />
              </View>
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * アプリ全体の画面遷移と、生成処理へ渡す宣言入力を管理する。
 */
export default function App() {
  const [stage, setStage] = useState(STAGES.TITLE);
  const [generationInput, setGenerationInput] = useState(null);
  const [desireAxes, setDesireAxes] = useState(null);
  const [milestoneIndex, setMilestoneIndex] = useState(0);
  const [handledCheckups, setHandledCheckups] = useState([]);
  const [additionalDeclarations, setAdditionalDeclarations] = useState([]);
  const [milestoneReports, setMilestoneReports] = useState({});
  const [selectedHistoryResult, setSelectedHistoryResult] = useState(null);
  const [loadingMilestoneKey, setLoadingMilestoneKey] = useState(null);
  const [endingReport, setEndingReport] = useState(null);
  const [endingType, setEndingType] = useState(null);
  const [figureDiagnosis, setFigureDiagnosis] = useState(null);
  const [isEndingLoading, setIsEndingLoading] = useState(false);
  const [endingNewsScenes, setEndingNewsScenes] = useState([]);
  const [endingNarrationUri, setEndingNarrationUri] = useState(null);
  const [endingNarrationError, setEndingNarrationError] = useState(null);
  const [hasEndingPreparationStarted, setHasEndingPreparationStarted] = useState(false);
  const generatingMilestonesRef = useRef(new Set());
  const endingPreparationRef = useRef(false);
  const endingScrollRef = useRef(null);

  /**
   * 冒頭宣言を送信する。
   *
   * @param {string} declaration プレイヤーが入力した宣言文。
   * @param {string} tone 選択されたトーンID。
   * @returns {Promise<void>}
   * mapDesireは通信失敗時もフォールバック配点を返すため、
   * 送信は常に初日生成画面への遷移で完了する。
   */
  const handleDeclarationSubmit = async (declaration, tone) => {
    const nextGenerationInput = createGenerationInput(declaration, tone);
    setGenerationInput(nextGenerationInput);
    setMilestoneIndex(0);
    setHandledCheckups([]);
    setAdditionalDeclarations([]);
    setMilestoneReports({});
    setLoadingMilestoneKey(null);
    setEndingNewsScenes([]);
    setEndingNarrationUri(null);
    setEndingNarrationError(null);
    setHasEndingPreparationStarted(false);
    endingPreparationRef.current = false;

    const result = await mapDesire(nextGenerationInput.declaration, GEMINI_API_KEY);
    setDesireAxes(applyMapping(createInitialMeter(), result, 0));
    setStage(STAGES.DAY_GENERATION);
  };

  /** 現在までの宣言を踏まえたNEWS/MEMOを生成して節目に保存する。 */
  const generateCurrentMilestoneReport = async (declarations, meter = desireAxes) => {
    const milestone = MILESTONES[milestoneIndex];
    if (generatingMilestonesRef.current.has(milestone.key)) return;

    generatingMilestonesRef.current.add(milestone.key);
    setLoadingMilestoneKey(milestone.key);
    try {
      const previousReport = MILESTONES
        .slice(0, milestoneIndex)
        .map((item) => milestoneReports[item.key])
        .filter(Boolean)
        .at(-1);
      const report = await generateBeat({
        declaration: generationInput.declaration,
        milestoneLabel: milestone.label,
        meter,
        previousDeclarations: getPreviousDeclarationTexts(declarations),
        previousEvents: getPreviousMilestoneEvents(
          MILESTONES,
          milestoneReports,
          milestoneIndex,
        ),
        tone: generationInput.tone,
        apiKey: GEMINI_API_KEY,
        previousState: previousReport?.collapsePressure,
      });
      const collapseState = advanceCollapseState({
        previousPressure: previousReport?.collapsePressure,
        stateDelta: report.stateDelta,
      });
      const collapseRoute = shouldTriggerNationCollapse(
        collapseState.pressure,
        report.collapseSignals,
      )
        ? determineCollapseRoute(collapseState.pressure, report.collapseSignals)
        : null;

      setMilestoneReports((current) => ({
        ...current,
        [milestone.key]: {
          ...report,
          collapseRisk: collapseState.risk,
          collapsePressure: collapseState.pressure,
          collapseRoute,
          collapseSignals: report.collapseSignals,
          desireAxesSnapshot: { ...meter },
        },
      }));
    } finally {
      generatingMilestonesRef.current.delete(milestone.key);
      setLoadingMilestoneKey((current) => (current === milestone.key ? null : current));
    }
  };

  /** 検診のない節目へ到達した時点で、宣言と過去の流れを使ってレポートを生成する。 */
  useEffect(() => {
    if (stage !== STAGES.DAY_GENERATION || !generationInput || !desireAxes) return;

    const milestone = MILESTONES[milestoneIndex];
    if (
      shouldShowCheckup(milestone, handledCheckups)
      || milestoneReports[milestone.key]
      || loadingMilestoneKey === milestone.key
    ) return;

    generateCurrentMilestoneReport(additionalDeclarations).catch((err) => {
      console.warn('generateCurrentMilestoneReport: failed', err.message);
    });
  }, [
    additionalDeclarations,
    desireAxes,
    generationInput,
    handledCheckups,
    loadingMilestoneKey,
    milestoneIndex,
    milestoneReports,
    stage,
  ]);

  /** 追加宣言せず、これまでの宣言を踏まえた物語へ進む。 */
  const handleSkipCheckup = async () => {
    const nextDesireAxes = moveDesireAxesTowardNeutral(desireAxes);
    completeCurrentCheckup();
    setDesireAxes(nextDesireAxes);
    try {
      await generateCurrentMilestoneReport(additionalDeclarations, nextDesireAxes);
    } catch (err) {
      console.warn('handleSkipCheckup: failed to generate report', err.message);
    }
  };

  /** 現在の節目の検診を処理済みにする。 */
  const completeCurrentCheckup = () => {
    const milestoneKey = MILESTONES[milestoneIndex].key;
    setHandledCheckups((current) => completeCheckup(current, milestoneKey));
  };

  /** 追加宣言をメーターへ反映し、現在の節目の検診を完了する。 */
  const handleAdditionalDeclaration = async (declaration) => {
    const milestoneKey = MILESTONES[milestoneIndex].key;
    const nextDeclaration = createAdditionalDeclaration(milestoneKey, declaration);
    const nextDeclarations = [...additionalDeclarations, nextDeclaration];

    setAdditionalDeclarations(nextDeclarations);
    completeCurrentCheckup();
    setLoadingMilestoneKey(milestoneKey);

    try {
      const mapping = await mapDesire(nextDeclaration.declaration, GEMINI_API_KEY);
      const progressionIndex = Math.min(nextDeclarations.length, 3);
      const nextDesireAxes = applyMapping(desireAxes, mapping, progressionIndex);

      await generateCurrentMilestoneReport(nextDeclarations, nextDesireAxes);
      setDesireAxes(nextDesireAxes);
    } catch (err) {
      console.warn('handleAdditionalDeclaration: failed to generate report', err.message);
      setLoadingMilestoneKey((current) => (current === milestoneKey ? null : current));
    }
  };

  /**
   * 選択トーンを反映したエンディングを生成し、結末画面へ進む。
   *
   * @param {string} [forcedEndingType] 50年時点の国の滅亡分岐など、型を強制する場合に指定する。
   */
  const handleFinish = async (forcedEndingType, navigateWhenReady = false) => {
    if (endingPreparationRef.current) return;
    endingPreparationRef.current = true;
    setHasEndingPreparationStarted(true);
    setIsEndingLoading(true);

    const resolvedEndingType = forcedEndingType ?? decideEnding(desireAxes);
    const newsScenes = createEndingNewsScenes(MILESTONES, milestoneReports);
    setEndingNewsScenes(newsScenes);
    setEndingNarrationUri(null);
    setEndingNarrationError(null);

    try {
      const meter = desireAxes ?? FALLBACK_FINAL_METER;
      const match = matchFigure(meter);

      const narrationPromise = newsScenes.length
        ? generateNarration({
          apiKey: GEMINI_API_KEY,
          text: buildEndingNarrationText(newsScenes),
        })
          .then((narration) => {
            setEndingNarrationUri(narration.uri);
            return narration;
          })
          .catch((err) => {
            console.warn('handleFinish: narration generation failed', err.message);
            setEndingNarrationError(err);
            return null;
          })
        : Promise.resolve(null);

      const [ending, diagnosis] = await Promise.all([
        generateEnding({
          declaration: generationInput.declaration,
          endingType: resolvedEndingType,
          meter,
          previousDeclarations: getPreviousDeclarationTexts(additionalDeclarations),
          tone: generationInput.tone,
          apiKey: GEMINI_API_KEY,
        }),
        match
          ? generateFigureDiagnosis({
            figure: match.figure,
            desireAxes: meter,
            apiKey: GEMINI_API_KEY,
          }).catch((err) => {
            console.warn('handleFinish: figure diagnosis failed', err.message);
            return null;
          })
          : Promise.resolve(null),
        narrationPromise,
      ]);

      setEndingReport(ending);
      setEndingType(resolvedEndingType);
      setFigureDiagnosis(match && diagnosis ? { figure: match.figure, ...diagnosis } : null);
    } catch (err) {
      console.warn('handleFinish: failed to generate ending', err.message);
    } finally {
      setIsEndingLoading(false);
      if (navigateWhenReady) {
        setStage(newsScenes.length ? STAGES.ENDING_NEWS : STAGES.ENDING);
      }
    }
  };

  useEffect(() => {
    const isFinalMilestone = milestoneIndex === MILESTONES.length - 1;
    const finalReport = MILESTONES.at(-1) && milestoneReports[MILESTONES.at(-1).key];
    if (
      stage === STAGES.DAY_GENERATION
      && isFinalMilestone
      && finalReport
      && !hasEndingPreparationStarted
    ) {
      handleFinish(finalReport.collapseRoute ?? undefined);
    }
  }, [hasEndingPreparationStarted, milestoneIndex, milestoneReports, stage]);

  /** エンディング二段演出の完了を受けて、結果を履歴へ保存する。 */
  const handleEndingRevealComplete = () => {
    saveResult(createHistoryResult({
      declarationSummary: generationInput?.declaration ?? '',
      additionalDeclarations,
      desireAxes: desireAxes ?? FALLBACK_FINAL_METER,
      endingBody: endingReport?.body ?? FALLBACK_ENDING_BODY,
      endingType,
      endingTitle: endingReport?.title ?? FALLBACK_ENDING_HEADLINE,
      figureDiagnosis: figureDiagnosis ?? null,
    })).catch((err) => {
      console.warn('handleEndingRevealComplete: failed to save result', err.message);
    });

    if (endingType?.startsWith('collapse')) {
      unlockCodexEntry('collapse', endingType).catch((err) => {
        console.warn('handleEndingRevealComplete: failed to unlock collapse codex entry', err.message);
      });
    }
    if (figureDiagnosis?.figure?.key) {
      unlockCodexEntry('figure', figureDiagnosis.figure.key).catch((err) => {
        console.warn('handleEndingRevealComplete: failed to unlock figure codex entry', err.message);
      });
    }
  };

  /** エンディング表示後にプレイ状態を初期化してホームへ戻る。 */
  const handleReturnHome = () => {
    setGenerationInput(null);
    setDesireAxes(null);
    setMilestoneIndex(0);
    setHandledCheckups([]);
    setAdditionalDeclarations([]);
    setMilestoneReports({});
    setLoadingMilestoneKey(null);
    setEndingReport(null);
    setEndingType(null);
    setFigureDiagnosis(null);
    setIsEndingLoading(false);
    setEndingNewsScenes([]);
    setEndingNarrationUri(null);
    setEndingNarrationError(null);
    setHasEndingPreparationStarted(false);
    endingPreparationRef.current = false;
    setStage(STAGES.TITLE);
  };

  let screen;

  switch (stage) {
    case STAGES.DECLARATION:
      screen = (
        <DeclarationForm
          onBack={() => setStage(STAGES.TITLE)}
          onSubmit={handleDeclarationSubmit}
        />
      );
      break;
    case STAGES.HISTORY:
      screen = (
        <History
          onBack={() => setStage(STAGES.TITLE)}
          onSelect={(result) => {
            setSelectedHistoryResult(result);
            setStage(STAGES.HISTORY_DETAIL);
          }}
        />
      );
      break;
    case STAGES.HISTORY_DETAIL:
      screen = (
        <HistoryDetail
          onBack={() => setStage(STAGES.HISTORY)}
          result={selectedHistoryResult}
        />
      );
      break;
    case STAGES.DAY_GENERATION: {
      const milestone = MILESTONES[milestoneIndex];
      const showCheckup = shouldShowCheckup(milestone, handledCheckups);
      const visibleAdditionalDeclarations = getVisibleAdditionalDeclarations(
        additionalDeclarations,
        MILESTONES,
        milestoneIndex,
      );
      const collapseRoute = milestoneReports[milestone.key]?.collapseRoute;
      const nextMilestone = MILESTONES[milestoneIndex + 1];
      const isFinalMilestone = !nextMilestone;
      const isPreparingEnding = isFinalMilestone
        && (!hasEndingPreparationStarted || isEndingLoading);

      screen = (
        <DayGenerationScreen
          declaration={generationInput?.declaration ?? ''}
          milestone={milestone}
          previousMilestone={MILESTONES[milestoneIndex - 1]}
          nextMilestone={nextMilestone}
          onPrevious={() => (
            setMilestoneIndex((current) => Math.max(current - 1, 0))
          )}
          onNext={() => {
            playSoundEffect('advance');
            setMilestoneIndex((current) => Math.min(current + 1, MILESTONES.length - 1));
          }}
          onFinish={() => {
            if (isFinalMilestone && hasEndingPreparationStarted && !isEndingLoading) {
              setStage(endingNewsScenes.length ? STAGES.ENDING_NEWS : STAGES.ENDING);
              return;
            }
            handleFinish(collapseRoute ?? undefined, true);
          }}
          isFinishing={isEndingLoading}
          isPreparingEnding={isPreparingEnding}
          isCollapsePending={Boolean(collapseRoute)}
          showCheckup={showCheckup}
          additionalDeclarations={visibleAdditionalDeclarations}
          onSkipCheckup={handleSkipCheckup}
          onSubmitAdditionalDeclaration={handleAdditionalDeclaration}
          report={milestoneReports[milestone.key]}
          isReportLoading={isMilestoneReportPending({
            isLoading: loadingMilestoneKey === milestone.key,
            showCheckup,
            report: milestoneReports[milestone.key],
          })}
        />
      );
      break;
    }
    case STAGES.ENDING:
      screen = (
        <DestinationPlaceholder
          eyebrow="FINAL REPORT"
          scrollViewRef={endingScrollRef}
          title="世界の結末"
        >
          <EndingReveal
            body={endingReport?.body ?? FALLBACK_ENDING_BODY}
            enableCollapseIntro
            endingType={endingType}
            figureDiagnosis={figureDiagnosis}
            finalMeter={desireAxes ?? FALLBACK_FINAL_METER}
            headline={endingReport?.title ?? FALLBACK_ENDING_HEADLINE}
            onRevealComplete={handleEndingRevealComplete}
            onReturnHome={handleReturnHome}
            scrollViewRef={endingScrollRef}
          />
        </DestinationPlaceholder>
      );
      break;
    case STAGES.ENDING_NEWS:
      screen = (
        <EndingNews
          audioUri={endingNarrationUri}
          narrationError={endingNarrationError}
          onComplete={() => setStage(STAGES.ENDING)}
          scenes={endingNewsScenes}
        />
      );
      break;
    case STAGES.CODEX:
      screen = (
        <Codex onBack={() => setStage(STAGES.TITLE)} />
      );
      break;
    default:
      screen = (
        <TitleScreen
          onOpenCodex={() => setStage(STAGES.CODEX)}
          onStart={() => setStage(STAGES.DECLARATION)}
          onOpenHistory={() => {
            setSelectedHistoryResult(null);
            setStage(STAGES.HISTORY);
          }}
        />
      );
  }

  return (
    <>
      {screen}
      <StatusBar style="light" />
    </>
  );
}

const styles = StyleSheet.create({
  destination: {
    flex: 1,
    backgroundColor: '#0b0b0d',
  },
  destinationKeyboardArea: {
    flex: 1,
  },
  destinationBody: {
    flex: 1,
    position: 'relative',
  },
  stickyNavigationBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 20,
  },
  stickyNavigationInner: {
    width: '100%',
    maxWidth: 520,
  },
  destinationContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    paddingBottom: 140,
  },
  destinationScroll: {
    flex: 1,
  },
  eyebrow: {
    marginBottom: 12,
    color: '#b9985a',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
  },
  destinationTitle: {
    color: '#f3eee4',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 2,
  },
  declarationBlock: {
    marginVertical: 24,
    alignItems: 'center',
  },
  destinationDeclaration: {
    maxWidth: 320,
    color: '#a9a39a',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
  additionalDeclaration: {
    marginTop: 6,
    maxWidth: 520,
    color: '#d8c9aa',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'center',
  },
});
