import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';

import { mapDesire } from './api/mapDesire';
import { generateBeat } from './api/generateBeat';
import CheckupEvent from './components/CheckupEvent';
import DeclarationForm from './components/DeclarationForm';
import EndingReveal from './components/EndingReveal';
import History from './components/History';
import MilestoneReport from './components/MilestoneReport';
import TitleScreen from './components/TitleScreen';
import { AXES } from './data/axes';
import { MILESTONES } from './data/milestones';
import {
  completeCheckup,
  createAdditionalDeclaration,
  getPreviousDeclarationTexts,
  shouldShowCheckup,
} from './game/checkup';
import { createGenerationInput } from './game/declaration';
import { formatHistoryDate, getHistoryTitle } from './game/historyView';
import { applyMapping } from './game/meter';
import { STAGES } from './game/navigation';

const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
const DUMMY_FINAL_METER = Object.freeze({
  wealth: 72,
  power: 91,
  fame: 64,
  love: 28,
  pleasure: 57,
});

/**
 * 未実装の遷移先に共通のプレースホルダー画面を表示する。
 */
function DestinationPlaceholder({ eyebrow, title, children }) {
  return (
    <SafeAreaView style={styles.destination}>
      <ScrollView
        contentContainerStyle={styles.destinationContent}
        keyboardShouldPersistTaps="handled"
        style={styles.destinationScroll}
      >
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.destinationTitle}>{title}</Text>
        {children}
      </ScrollView>
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
          nextLabel={nextMilestone ? `${nextMilestone.label}へ進む` : '結末を見る'}
          onNext={nextMilestone ? onNext : onFinish}
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

  /** エンディング表示後にプレイ状態を初期化してホームへ戻る。 */
  const handleReturnHome = () => {
    setGenerationInput(null);
    setDesireAxes(null);
    setMilestoneIndex(0);
    setHandledCheckups([]);
    setAdditionalDeclarations([]);
    setMilestoneReports({});
    setLoadingMilestoneKey(null);
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
        <DestinationPlaceholder eyebrow="ARCHIVE DETAIL" title={getHistoryTitle(selectedHistoryResult)}>
          <Text style={styles.historyDetailDate}>
            {formatHistoryDate(selectedHistoryResult?.savedAt)}
          </Text>
          <Text style={styles.historyDetailNote}>
            詳細なエンディング再現はIssue #18で実装します。
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setStage(STAGES.HISTORY)}
            style={({ pressed }) => [styles.historyBackButton, pressed && styles.historyPressed]}
          >
            <Text style={styles.historyBackButtonText}>← 履歴一覧へ戻る</Text>
          </Pressable>
        </DestinationPlaceholder>
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
          onFinish={() => setStage(STAGES.ENDING)}
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
            body="国はあなたの宣言を忠実に実行し続けた。やがて人々は命令に従うことだけを覚え、静かな繁栄と引き換えに、自ら選ぶ未来を手放した。"
            finalMeter={DUMMY_FINAL_METER}
            headline="黄金色の静寂"
            onRevealComplete={() => {
              // Issue #31で、このタイミングに履歴保存処理を接続する。
            }}
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
  historyDetailDate: {
    marginTop: 18,
    color: '#b9985a',
    fontSize: 12,
    fontWeight: '700',
  },
  historyDetailNote: {
    marginTop: 28,
    color: '#8e8982',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  historyBackButton: {
    minHeight: 52,
    marginTop: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#b9985a',
  },
  historyBackButtonText: {
    color: '#d8c9aa',
    fontSize: 13,
    fontWeight: '800',
  },
  historyPressed: {
    opacity: 0.65,
  },
});
