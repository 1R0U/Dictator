import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import CornerMessenger from './CornerMessenger';
import PressableScale from './PressableScale';
import ScreenContainer, { useResponsiveLayout } from './ScreenContainer';
import { loadCodexState } from '../data/codex';
import { playSoundEffect } from '../utils/sound';
import { buildCollapseCodexEntries } from '../game/codexView';

/** 図鑑画面のCornerMessengerには、他画面の神託/執行人ではなく側近を出す。 */
const CODEX_MESSENGER_CHARACTERS = [
  { image: require('../assets/aide-presenting.png'), name: '側近' },
  { image: require('../assets/aide-panicking.png'), name: '側近' },
];
const CODEX_MESSENGER_MESSAGES = [
  '閣下、統治の記録をこの図鑑にまとめてございます。',
  '崩壊の光景は、すべて閣下の歩みの証にございます。',
  'まだ見ぬ結末が、いくつも眠っております。',
  '空欄を埋めるたび、この者も身が引き締まる思いです。',
  '滅びの記録を、一つたりとも見逃しませぬ。',
  'すべてを埋めるまで、統治は終わりませんぞ。',
];

const CODEX_CONTENT_MAX_WIDTH = 680;
const CODEX_CONTENT_HORIZONTAL_PADDING = 28;
const CODEX_COMPACT_HORIZONTAL_PADDING = 16;
const GRID_COLUMNS = 3;
const GRID_GAP = 12;
const CARD_PADDING = 10;
const DETAIL_MAX_WIDTH = 480;
const DETAIL_HORIZONTAL_PADDING = 24;

const CODEX_LIST_LABEL = 'COLLAPSE ARCHIVE';
const CODEX_EMPTY_HINT = '国を崩壊させると、その光景がここに記録されます。';

/**
 * 図鑑カードの見た目（サムネイル or ロック表示）を1件分描画する。
 * サムネイル枠・画像ともに必ず px 数値のwidth/heightを渡す。
 * Web版のImageは「'100%'+aspectRatio」や「absoluteFill（position+inset指定）」では
 * 実寸を確定できず、画像自体の実ピクセルサイズ（例：941×1672）にそのまま広がってしまうため。
 * 崩壊ルートの画像は縦長なので、正方形の枠に対して横幅を基準に拡大し、
 * はみ出した上側を枠でクリップして下側（構図の見せ場が多い部分）を表示する。
 */
function CodexCard({ entry, size, onPress }) {
  const showImage = entry.unlocked;
  const thumbSize = size - CARD_PADDING * 2;
  const thumbImageHeight = entry.aspectRatio ? thumbSize / entry.aspectRatio : thumbSize;

  return (
    <PressableScale
      accessibilityLabel={entry.unlocked
        ? `${entry.number} ${entry.label}`
        : `未解放 ${entry.number}`}
      accessibilityRole="button"
      glowColor="#b9985a"
      onPress={() => entry.unlocked && onPress(entry)}
      style={({ pressed }) => [
        styles.card,
        { width: size },
        !entry.unlocked && styles.lockedCard,
        pressed && entry.unlocked && styles.pressedCard,
      ]}
    >
      <View style={[styles.cardThumbFrame, { width: thumbSize, height: thumbSize }]}>
        {showImage ? (
          <Image
            resizeMode="cover"
            source={entry.image}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: thumbSize,
              height: thumbImageHeight,
            }}
          />
        ) : null}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardNumber}>{entry.number}</Text>
        {entry.unlocked ? (
          <>
            <Text numberOfLines={2} style={styles.cardLabel}>
              {entry.label}
            </Text>
            <Text style={styles.cardTimesSeen}>{entry.timesSeen}回遭遇</Text>
          </>
        ) : (
          <Text style={styles.cardLockedLabel}>???</Text>
        )}
      </View>
    </PressableScale>
  );
}

/**
 * 選択中の崩壊ルートを画像と結末文で表示する。
 * 画像もテキスト列も、windowWidthから算出した固定px幅をImageのwidth/heightに直接渡す
 * （Web版のImageは明示的なpx数値を渡さないと自身の実ピクセルサイズに広がってしまうため）。
 */
function CodexDetailModal({ entry, onClose }) {
  const { width: windowWidth } = useWindowDimensions();
  const detailWidth = Math.min(windowWidth - DETAIL_HORIZONTAL_PADDING * 2, DETAIL_MAX_WIDTH);
  const imageHeight = entry?.aspectRatio ? detailWidth / entry.aspectRatio : 0;

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent={false}
      visible={Boolean(entry)}
    >
      {entry ? (
        <SafeAreaView style={styles.detailContainer}>
          <ScrollView contentContainerStyle={styles.detailContent}>
            <PressableScale
              accessibilityRole="button"
              glowColor="#a9a39a"
              onPress={onClose}
              style={({ pressed }) => [styles.detailBackButton, pressed && styles.pressed]}
            >
              <Text style={styles.detailBackButtonText}>← 図鑑へ戻る</Text>
            </PressableScale>

            <View style={[styles.detailImageFrame, { width: detailWidth, height: imageHeight }]}>
              <Image
                accessibilityLabel={entry.imageLabel}
                accessible
                resizeMode="cover"
                source={entry.image}
                style={{ width: detailWidth, height: imageHeight }}
              />
            </View>
            <Text style={styles.detailKicker}>{entry.kicker}</Text>
            <Text style={[styles.detailTitle, { width: detailWidth }]}>{entry.title}</Text>
            <Text style={[styles.detailBody, { width: detailWidth }]}>{entry.body}</Text>
            <Text style={styles.detailMeta}>{entry.timesSeen}回遭遇</Text>
          </ScrollView>
        </SafeAreaView>
      ) : null}
    </Modal>
  );
}

/**
 * 解放済みの崩壊エンディングを一覧できる図鑑画面。
 *
 * @param {Object} props
 * @param {Function} props.onBack タイトル画面へ戻る処理。
 * @param {Function} [props.loadCodex] 図鑑状態を取得する非同期処理。
 */
export default function Codex({ onBack, loadCodex = loadCodexState }) {
  const { width, isCompactWidth: isCompact } = useResponsiveLayout();
  const [codexState, setCodexState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const requestIdRef = useRef(0);

  const fetchCodex = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);
    setLoadError('');

    try {
      const loadedState = await loadCodex();
      if (requestId !== requestIdRef.current) return;
      setCodexState(loadedState);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setLoadError('図鑑を読み込めませんでした。');
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [loadCodex]);

  useEffect(() => {
    fetchCodex();
    return () => {
      requestIdRef.current += 1;
    };
  }, [fetchCodex]);

  const entries = codexState ? buildCollapseCodexEntries(codexState) : [];
  const unlockedCount = entries.filter((entry) => entry.unlocked).length;

  const horizontalPadding = isCompact
    ? CODEX_COMPACT_HORIZONTAL_PADDING
    : CODEX_CONTENT_HORIZONTAL_PADDING;
  const contentWidth = Math.min(width, CODEX_CONTENT_MAX_WIDTH) - horizontalPadding * 2;
  const cardWidth = (contentWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

  return (
    <Fragment>
      <ScreenContainer compactContentStyle={styles.compactContent} contentStyle={styles.content}>
        <View style={styles.header}>
          <PressableScale
            accessibilityRole="button"
            glowColor="#a9a39a"
            onPress={() => {
              playSoundEffect('returnHome');
              onBack();
            }}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Text style={styles.backButtonText}>← ホームへ戻る</Text>
          </PressableScale>
          <View style={[styles.intro, isCompact && styles.compactIntro]}>
            <View style={styles.headingCopy}>
              <Text style={[styles.title, isCompact && styles.compactTitle]}>図鑑</Text>
              <Text style={styles.description}>目撃した国家崩壊の光景を記録する書庫。</Text>
            </View>
            <CornerMessenger
              characters={CODEX_MESSENGER_CHARACTERS}
              compact={isCompact}
              messages={CODEX_MESSENGER_MESSAGES}
            />
          </View>
        </View>

        <View style={styles.listArea}>
          {isLoading ? (
            <View accessibilityLiveRegion="polite" style={styles.statePanel}>
              <ActivityIndicator color="#b9985a" size="large" />
              <Text style={styles.stateText}>図鑑を読み込み中…</Text>
            </View>
          ) : null}

          {!isLoading && loadError ? (
            <View accessibilityLiveRegion="polite" style={styles.statePanel}>
              <Text style={styles.stateMark}>!</Text>
              <Text style={styles.stateTitle}>図鑑を開けませんでした</Text>
              <Text style={styles.stateText}>{loadError}</Text>
              <PressableScale
                accessibilityRole="button"
                glowColor="#b9985a"
                onPress={fetchCodex}
                style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
              >
                <Text style={styles.retryButtonText}>もう一度読み込む</Text>
              </PressableScale>
            </View>
          ) : null}

          {!isLoading && !loadError ? (
            <View>
              <View style={styles.listHeader}>
                <Text style={styles.listLabel}>{CODEX_LIST_LABEL}</Text>
                <Text style={styles.resultCount}>{unlockedCount} / {entries.length}</Text>
              </View>
              {unlockedCount === 0 ? (
                <Text style={styles.emptyHint}>{CODEX_EMPTY_HINT}</Text>
              ) : null}
              <View style={styles.grid}>
                {entries.map((entry) => (
                  <CodexCard
                    entry={entry}
                    key={entry.key}
                    onPress={setSelectedEntry}
                    size={cardWidth}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </ScreenContainer>

      <CodexDetailModal
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />
    </Fragment>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 28,
    paddingTop: 54,
    paddingBottom: 32,
  },
  compactContent: {
    paddingHorizontal: 16,
  },
  header: {
    width: '100%',
  },
  backButton: {
    marginBottom: 14,
    paddingVertical: 8,
    paddingRight: 12,
  },
  backButtonText: {
    color: '#a9a39a',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  intro: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 18,
  },
  compactIntro: {
    gap: 10,
  },
  headingCopy: {
    flex: 1,
  },
  title: {
    color: '#f3eee4',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 4,
  },
  compactTitle: {
    fontSize: 26,
    letterSpacing: 1,
  },
  description: {
    marginTop: 12,
    color: '#8e8982',
    fontSize: 14,
    lineHeight: 22,
  },
  listArea: {
    flex: 1,
    marginTop: 28,
  },
  statePanel: {
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    borderWidth: 1,
    borderColor: '#38353a',
    backgroundColor: '#111114',
  },
  stateMark: {
    color: '#d98b8f',
    fontSize: 42,
    fontWeight: '300',
  },
  stateTitle: {
    marginTop: 18,
    color: '#f3eee4',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  stateText: {
    maxWidth: 360,
    marginTop: 12,
    color: '#8e8982',
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 50,
    marginTop: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#b9985a',
  },
  retryButtonText: {
    color: '#d8c9aa',
    fontSize: 13,
    fontWeight: '800',
  },
  listHeader: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  listLabel: {
    color: '#625e58',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },
  resultCount: {
    color: '#8e8982',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyHint: {
    marginTop: 4,
    marginBottom: 16,
    color: '#77716a',
    fontSize: 12,
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  card: {
    padding: CARD_PADDING,
    borderWidth: 1,
    borderColor: '#38353a',
    backgroundColor: '#141417',
  },
  lockedCard: {
    opacity: 0.55,
  },
  pressedCard: {
    borderColor: '#b9985a',
    backgroundColor: '#1b1919',
  },
  cardThumbFrame: {
    marginBottom: 8,
    overflow: 'hidden',
    backgroundColor: '#1c1a1a',
  },
  cardBody: {
    minHeight: 46,
  },
  cardNumber: {
    color: '#b9985a',
    fontSize: 10,
    fontWeight: '900',
  },
  cardLabel: {
    marginTop: 4,
    color: '#f3eee4',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  cardTimesSeen: {
    marginTop: 4,
    color: '#77716a',
    fontSize: 10,
    fontWeight: '700',
  },
  cardLockedLabel: {
    marginTop: 4,
    color: '#625e58',
    fontSize: 12,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.65,
  },
  detailContainer: {
    flex: 1,
    backgroundColor: '#0b0b0d',
  },
  detailContent: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 24,
    paddingBottom: 48,
  },
  detailBackButton: {
    width: '100%',
    maxWidth: 560,
    marginBottom: 20,
    paddingVertical: 8,
  },
  detailBackButtonText: {
    color: '#a9a39a',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  detailImageFrame: {
    overflow: 'hidden',
    backgroundColor: '#0b0b0d',
  },
  detailKicker: {
    marginTop: 20,
    color: '#b9985a',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
    textAlign: 'center',
  },
  detailTitle: {
    marginTop: 14,
    color: '#f3eee4',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 36,
    textAlign: 'center',
  },
  detailBody: {
    marginTop: 18,
    maxWidth: 480,
    color: '#c8c0b5',
    fontSize: 15,
    lineHeight: 26,
    textAlign: 'center',
  },
  detailMeta: {
    marginTop: 28,
    color: '#77716a',
    fontSize: 11,
    fontWeight: '700',
  },
});
