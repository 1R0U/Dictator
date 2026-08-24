import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import DeclarationForm from './components/DeclarationForm';
import TitleScreen from './components/TitleScreen';
import { STAGES } from './game/navigation';

function DestinationPlaceholder({ eyebrow, title }) {
  return (
    <SafeAreaView style={styles.destination}>
      <View style={styles.destinationContent}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.destinationTitle}>{title}</Text>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  const [stage, setStage] = useState(STAGES.TITLE);

  /**
   * 冒頭宣言を送信する。
   * AI連携と次画面への遷移はIssue #28で実装する。
   */
  const handleDeclarationSubmit = async () => {
    // Issue #13では入力UIとコールバック呼び出しまでを確認する。
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
});
