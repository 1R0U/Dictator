import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';

import { mapDesire } from './api/mapDesire';
import DeclarationForm from './components/DeclarationForm';
import MilestoneReport from './components/MilestoneReport';
import TitleScreen from './components/TitleScreen';
import { AXES } from './data/axes';
import { MILESTONES } from './data/milestones';
import { createGenerationInput } from './game/declaration';
import { STAGES } from './game/navigation';

const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY;

/**
 * 未実装の遷移先に共通のプレースホルダー画面を表示する。
 */
function DestinationPlaceholder({ eyebrow, title, children }) {
  return (
    <SafeAreaView style={styles.destination}>
      <ScrollView contentContainerStyle={styles.destinationContent} style={styles.destinationScroll}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.destinationTitle}>{title}</Text>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * 初日の宣言内容と欲望軸を表示する。
 */
function DayGenerationScreen({
  declaration,
  desireAxes,
  milestone,
  previousMilestone,
  nextMilestone,
  onPrevious,
  onNext,
}) {
  return (
    <DestinationPlaceholder eyebrow="MILESTONE" title={milestone.label}>
      <Text style={styles.destinationDeclaration}>「{declaration}」</Text>
      <MilestoneReport
        memo={`側近メモ：${milestone.description} 表向きは平静だが、現場では想定外の影響が広がっている。`}
        milestoneLabel={milestone.label}
        previousLabel={previousMilestone ? `${previousMilestone.label}へ戻る` : undefined}
        onPrevious={previousMilestone ? onPrevious : undefined}
        news={`【${milestone.label}】${milestone.description} 政府は状況を注視すると発表しています。`}
        nextLabel={nextMilestone ? `${nextMilestone.label}へ進む` : undefined}
        onNext={nextMilestone ? onNext : undefined}
      />
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

    const result = await mapDesire(nextGenerationInput.declaration, CLAUDE_API_KEY);
    setDesireAxes(result);
    setStage(STAGES.DAY_GENERATION);
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
      screen = <DestinationPlaceholder eyebrow="ARCHIVE" title="過去の記録" />;
      break;
    case STAGES.DAY_GENERATION:
      screen = (
        <DayGenerationScreen
          declaration={generationInput?.declaration ?? ''}
          desireAxes={desireAxes}
          milestone={MILESTONES[milestoneIndex]}
          previousMilestone={MILESTONES[milestoneIndex - 1]}
          nextMilestone={MILESTONES[milestoneIndex + 1]}
          onPrevious={() => (
            setMilestoneIndex((current) => Math.max(current - 1, 0))
          )}
          onNext={() => (
            setMilestoneIndex((current) => Math.min(current + 1, MILESTONES.length - 1))
          )}
        />
      );
      break;
    default:
      screen = (
        <TitleScreen
          onStart={() => setStage(STAGES.DECLARATION)}
          onOpenHistory={() => setStage(STAGES.HISTORY)}
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
});
