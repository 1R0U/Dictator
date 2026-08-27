import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { mapDesire } from './api/mapDesire';
import DeclarationForm from './components/DeclarationForm';
import TitleScreen from './components/TitleScreen';
import { AXES } from './data/axes';
import { STAGES } from './game/navigation';

const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY;

function DestinationPlaceholder({ eyebrow, title, children }) {
  return (
    <SafeAreaView style={styles.destination}>
      <View style={styles.destinationContent}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.destinationTitle}>{title}</Text>
        {children}
      </View>
    </SafeAreaView>
  );
}

function DayGenerationScreen({ declaration, desireAxes }) {
  return (
    <DestinationPlaceholder eyebrow="DAY 1" title="初日">
      <Text style={styles.destinationDeclaration}>「{declaration}」</Text>
      {desireAxes ? (
        <Text style={styles.destinationAxes}>
          {AXES.map((axis) => `${axis.label} ${desireAxes[axis.key]}`).join('　')}
        </Text>
      ) : null}
    </DestinationPlaceholder>
  );
}

export default function App() {
  const [stage, setStage] = useState(STAGES.TITLE);
  const [declaration, setDeclaration] = useState('');
  const [desireAxes, setDesireAxes] = useState(null);

  /**
   * 冒頭宣言を送信し、mapDesireで欲望軸に変換してから初日生成画面へ遷移する。
   * mapDesireは通信失敗時も含めて自身のtry/catchでフォールバック配点を返し、
   * 例外を投げないため、送信は常に初日生成画面への遷移で完了する。
   */
  const handleDeclarationSubmit = async (text) => {
    const result = await mapDesire(text, CLAUDE_API_KEY);
    setDeclaration(text);
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
      screen = <DayGenerationScreen declaration={declaration} desireAxes={desireAxes} />;
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
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
    marginTop: 24,
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
