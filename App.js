import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';

import { mapDesire } from './api/mapDesire';
import { generateBeat } from './api/generateBeat';
import { generateEnding } from './api/generateEnding';
import { generateFigureDiagnosis } from './api/generateFigureDiagnosis';
import CheckupEvent from './components/CheckupEvent';
import DeclarationForm from './components/DeclarationForm';
import EndingReveal from './components/EndingReveal';
import History from './components/History';
import HistoryDetail from './components/HistoryDetail';
import MilestoneReport from './components/MilestoneReport';
import TitleScreen from './components/TitleScreen';
import { AXES } from './data/axes';
import { saveResult } from './data/history';
import { MILESTONES } from './data/milestones';
import {
  completeCheckup,
  createAdditionalDeclaration,
  getPreviousDeclarationTexts,
  shouldShowCheckup,
} from './game/checkup';
import { createGenerationInput } from './game/declaration';
import { applyMapping } from './game/meter';
import { matchFigure } from './game/figureMatch';
import { STAGES } from './game/navigation';

const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
// desireAxesが未設定（通常発生しない）な場合のみ使うフォールバック値。
const FALLBACK_FINAL_METER = Object.freeze({
  domination: 91,
  egoism: 72,
  innovation: 64,
  prestige: 57,
  madness: 72,
});
// エンディング型の判定ロジック（#6/#25）が未実装のため、型自体は仮固定。
const DUMMY_ENDING_TYPE = 'ironic_peace';
const FALLBACK_ENDING_HEADLINE = '黄金色の静寂';
const FALLBACK_ENDING_BODY =
  '国はあなたの宣言を忠実に実行し続けた。やがて人々は命令に従うことだけを覚え、静かな繁栄と引き換えに、自ら選ぶ未来を手放した。';

/**
 * 未実装の遷移先に共通のプレースホルダー画面を表示する。
 */
function DestinationPlaceholder({ eyebrow, title, children }) {
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
  desireAxes,
  milestone,
  previousMilestone,
  nextMilestone,
  onPrevious,
  onNext,
  onFinish,
  isFinishing,
  showCheckup,
  additionalDeclaration,
  onSkipCheckup,
  onSubmitAdditionalDeclaration,
  report,
  isReportLoading,
}) {
  return (
    <DestinationPlaceholder eyebrow="MILESTONE" title={milestone.label}>
      <Text style={styles.destinationDeclaration}>「{declaration}」</Text>
      {showCheckup ? (
        <CheckupEvent
          key={milestone.key}
          milestoneLabel={milestone.label}
          onSkip={onSkipCheckup}
          onSubmit={onSubmitAdditionalDeclaration}
        />
      ) : (
        <MilestoneReport
          isFallback={report?.isFallback ?? false}
          isFinal={!nextMilestone}
          isLoading={isReportLoading}
          key={milestone.key}
          memo={report?.memo ?? `側近メモ：${milestone.description} 表向きは平静だが、現場では想定外の影響が広がっている。`}
          milestoneLabel={milestone.label}
          previousLabel={previousMilestone ? `${previousMilestone.label}へ戻る` : undefined}
          onPrevious={previousMilestone ? onPrevious : undefined}
          news={report?.news ?? `【${milestone.label}】${milestone.description} 政府は状況を注視すると発表しています。`}
          nextLabel={
            nextMilestone ? `${nextMilestone.label}へ進む` : (isFinishing ? '結末を生成中…' : '結末を見る')
          }
          onNext={nextMilestone ? onNext : (isFinishing ? undefined : onFinish)}
        />
      )}
      {additionalDeclaration ? (
        <Text style={styles.additionalDeclaration}>
          追加宣言「{additionalDeclaration.declaration}」
        </Text>
      ) : null}
      {desireAxes ? (
        <Text style={styles.destinationAxes}>
          {AXES.map((axis) => `${axis.label} ${desireAxes[axis.key]}`).join('　')}
        </Text>
      ) : null}
    </DestinationPlaceholder>
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
  const [figureDiagnosis, setFigureDiagnosis] = useState(null);
  const [isEndingLoading, setIsEndingLoading] = useState(false);

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

    const result = await mapDesire(nextGenerationInput.declaration, CLAUDE_API_KEY);
    setDesireAxes(result);
    setStage(STAGES.DAY_GENERATION);
  };

  /** 現在までの宣言を踏まえたNEWS/MEMOを生成して節目に保存する。 */
  const generateCurrentMilestoneReport = async (declarations, meter = desireAxes) => {
    const milestone = MILESTONES[milestoneIndex];
    setLoadingMilestoneKey(milestone.key);
    try {
      const report = await generateBeat({
        declaration: generationInput.declaration,
        milestoneLabel: milestone.label,
        meter,
        previousDeclarations: getPreviousDeclarationTexts(declarations),
        tone: generationInput.tone,
        apiKey: CLAUDE_API_KEY,
      });

      setMilestoneReports((current) => ({ ...current, [milestone.key]: report }));
    } finally {
      setLoadingMilestoneKey((current) => (current === milestone.key ? null : current));
    }
  };

  /** 追加宣言せず、これまでの宣言を踏まえた物語へ進む。 */
  const handleSkipCheckup = async () => {
    completeCurrentCheckup();
    try {
      await generateCurrentMilestoneReport(additionalDeclarations);
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
      const mapping = await mapDesire(nextDeclaration.declaration, CLAUDE_API_KEY);
      const nextDesireAxes = applyMapping(desireAxes, mapping);

      await generateCurrentMilestoneReport(nextDeclarations, nextDesireAxes);
      setDesireAxes(nextDesireAxes);
    } catch (err) {
      console.warn('handleAdditionalDeclaration: failed to generate report', err.message);
      setLoadingMilestoneKey((current) => (current === milestoneKey ? null : current));
    }
  };

  /** 選択トーンを反映したエンディングを生成し、結末画面へ進む。 */
  const handleFinish = async () => {
    if (isEndingLoading) return;
    setIsEndingLoading(true);

    try {
      const meter = desireAxes ?? FALLBACK_FINAL_METER;
      const match = matchFigure(meter);

      const [ending, diagnosis] = await Promise.all([
        generateEnding({
          declaration: generationInput.declaration,
          endingType: DUMMY_ENDING_TYPE,
          meter,
          tone: generationInput.tone,
          apiKey: CLAUDE_API_KEY,
        }),
        match
          ? generateFigureDiagnosis({ figure: match.figure, desireAxes: meter, apiKey: CLAUDE_API_KEY })
          : Promise.resolve(null),
      ]);

      setEndingReport(ending);
      setFigureDiagnosis(match && diagnosis ? { figure: match.figure, ...diagnosis } : null);
    } catch (err) {
      console.warn('handleFinish: failed to generate ending', err.message);
    } finally {
      setIsEndingLoading(false);
      setStage(STAGES.ENDING);
    }
  };

  /** エンディング二段演出の完了を受けて、結果を履歴へ保存する。 */
  const handleEndingRevealComplete = () => {
    saveResult({
      declarationSummary: generationInput?.declaration ?? '',
      desireAxes: desireAxes ?? FALLBACK_FINAL_METER,
      endingBody: endingReport?.body ?? FALLBACK_ENDING_BODY,
      endingType: DUMMY_ENDING_TYPE,
      endingTitle: endingReport?.title ?? FALLBACK_ENDING_HEADLINE,
      figureDiagnosis: figureDiagnosis ?? null,
    }).catch((err) => {
      console.warn('handleEndingRevealComplete: failed to save result', err.message);
    });
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
    setFigureDiagnosis(null);
    setIsEndingLoading(false);
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
      const additionalDeclaration = additionalDeclarations.find(
        (item) => item.milestoneKey === milestone.key,
      );

      screen = (
        <DayGenerationScreen
          declaration={generationInput?.declaration ?? ''}
          desireAxes={desireAxes}
          milestone={milestone}
          previousMilestone={MILESTONES[milestoneIndex - 1]}
          nextMilestone={MILESTONES[milestoneIndex + 1]}
          onPrevious={() => (
            setMilestoneIndex((current) => Math.max(current - 1, 0))
          )}
          onNext={() => (
            setMilestoneIndex((current) => Math.min(current + 1, MILESTONES.length - 1))
          )}
          onFinish={handleFinish}
          isFinishing={isEndingLoading}
          showCheckup={showCheckup}
          additionalDeclaration={additionalDeclaration}
          onSkipCheckup={handleSkipCheckup}
          onSubmitAdditionalDeclaration={handleAdditionalDeclaration}
          report={milestoneReports[milestone.key]}
          isReportLoading={loadingMilestoneKey === milestone.key}
        />
      );
      break;
    }
    case STAGES.ENDING:
      screen = (
        <DestinationPlaceholder eyebrow="FINAL REPORT" title="世界の結末">
          <EndingReveal
            body={endingReport?.body ?? FALLBACK_ENDING_BODY}
            figureDiagnosis={figureDiagnosis}
            finalMeter={desireAxes ?? FALLBACK_FINAL_METER}
            headline={endingReport?.title ?? FALLBACK_ENDING_HEADLINE}
            onRevealComplete={handleEndingRevealComplete}
            onReturnHome={handleReturnHome}
          />
        </DestinationPlaceholder>
      );
      break;
    default:
      screen = (
        <TitleScreen
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
  destinationContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
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
  destinationDeclaration: {
    marginVertical: 24,
    maxWidth: 320,
    color: '#a9a39a',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
  destinationAxes: {
    marginTop: 16,
    color: '#625e58',
    fontSize: 12,
    letterSpacing: 1,
    textAlign: 'center',
  },
  additionalDeclaration: {
    marginTop: 18,
    maxWidth: 520,
    color: '#d8c9aa',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'center',
  },
});
