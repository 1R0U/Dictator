import { useCallback, useEffect, useRef, useState } from 'react';
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
import { AXES } from '../data/axes';
import { loadCodexState } from '../data/codex';
import { playSoundEffect } from '../utils/sound';
import {
  buildCollapseCodexEntries,
  buildFigureCodexEntries,
} from '../game/codexView';
import { FIGURE_DIAGNOSIS_DISCLAIMER } from '../data/figures';

/** 図鑑画面のCornerMessengerには、他画面の神託/執行人ではなく側近を出す。 */
const CODEX_MESSENGER_CHARACTERS = [
  { image: require('../assets/aide-presenting.png'), name: '側近' },
  { image: require('../assets/aide-panicking.png'), name: '側近' },
];
const CODEX_MESSENGER_MESSAGES = [
  '閣下、統治の記録をこの図鑑にまとめてございます。',
  '崩壊の光景も、選ばれし人物も、閣下の歩みの証にございます。',
  'まだ見ぬ結末が、いくつも眠っております。',
  '空欄を埋めるたび、この者も身が引き締まる思いです。',
  '閣下に重なる人物が、また一人見つかりました。',
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

/** Clamp a stored figure pattern value to a safe 0-100 display range. */
function clampAxisValue(value) {
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
}

/**
 * 図鑑のセクション定義。新しいカテゴリを増やす場合はここへ1件追記するだけでよい。
 * buildEntries: 図鑑状態からそのセクションのエントリ一覧を作る純粋関数。
 */
const CODEX_SECTIONS = Object.freeze([
  Object.freeze({
    key: 'collapse',
    tabLabel: '崩壊図鑑',
    listLabel: 'COLLAPSE ARCHIVE',
    emptyHint: '国を崩壊させると、その光景がここに記録されます。',
    buildEntries: buildCollapseCodexEntries,
  }),
  Object.freeze({
    key: 'figure',
    tabLabel: '偉人図鑑',
    listLabel: 'FIGURE ARCHIVE',
    emptyHint: '統治を終えると、あなたに近い人物がここに記録されます。',
    buildEntries: buildFigureCodexEntries,
  }),
]);

/**
 * 図鑑カードの見た目（サムネイル or ロック表示）を1件分描画する。
 * サムネイル枠・画像ともに必ず px 数値のwidth/heightを渡す。
 * Web版のImageは「'100%'+aspectRatio」や「absoluteFill（position+inset指定）」では
 * 実寸を確定できず、画像自体の実ピクセルサイズ（例：941×1672）にそのまま広がってしまうため。
 * 崩壊ルートの画像は縦長なので、正方形の枠に対して横幅を基準に拡大し、
 * はみ出した上側を枠でクリップして下側（構図の見せ場が多い部分）を表示する。
 */
function CodexCard({ entry, section, size, onPress }) {
  const showImage = entry.unlocked && section.key === 'collapse';
  const thumbSize = size - CARD_PADDING * 2;
  const thumbImageHeight = entry.aspectRatio ? thumbSize / entry.aspectRatio : thumbSize;

  return (
    <PressableScale
      accessibilityLabel={entry.unlocked
        ? `${entry.number} ${section.key === 'collapse' ? entry.label : entry.name}`
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
              {section.key === 'collapse' ? entry.label : entry.name}
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
 * 選択中エントリの全画面詳細。崩壊ルートは画像+結末文、偉人は名前+二つ名+能力値を表示する。
 * 画像もテキスト列も、windowWidthから算出した固定px幅をImageのwidth/heightに直接渡す
 * （Web版のImageは明示的なpx数値を渡さないと自身の実ピクセルサイズに広がってしまうため）。
 */
function CodexDetailModal({ entry, sectionKey, onClose }) {
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

            {sectionKey === 'collapse' ? (
              <>
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
              </>
            ) : (
              <View style={[styles.figureDetailBlock, { width: detailWidth }]}>
                <Text style={styles.detailKicker}>FIGURE {entry.number}</Text>
                <Text style={styles.detailTitle}>{entry.name}</Text>
                <Text style={styles.detailBody}>{entry.epithet}</Text>
                <View style={styles.figureStatList}>
                  {AXES.map((axis) => {
                    const value = clampAxisValue(entry.pattern?.[axis.key]);
                    return (
                      <View key={axis.key} style={styles.figureStatRow}>
                        <View style={styles.figureStatLabels}>
                          <Text style={styles.figureStatLabel}>{axis.label}</Text>
                          <Text style={styles.figureStatValue}>{value}</Text>
                        </View>
                        <View style={styles.figureStatTrack}>
                          <View style={[styles.figureStatFill, { width: `${value}%` }]} />
                        </View>
                      </View>
                    );
                  })}
                </View>
                <Text style={styles.detailDisclaimer}>{FIGURE_DIAGNOSIS_DISCLAIMER}</Text>
              </View>
            )}
            <Text style={styles.detailMeta}>{entry.timesSeen}回遭遇</Text>
          </ScrollView>
        </SafeAreaView>
      ) : null}
    </Modal>
  );
}

/**
 * 解放済みの崩壊エンディング／偉人診断を一覧できる図鑑画面。
 *
 * @param {Object} props
 * @param {Function} props.onBack タイトル画面へ戻る処理。
 * @param {Function} [props.loadCodex] 図鑑状態を取得する非同期処理。
 */
export default function Codex({ onBack, loadCodex = loadCodexState }) {
  const { width } = useWindowDimensions();
  const isCompact = width < 600;
  const [activeSectionKey, setActiveSectionKey] = useState(CODEX_SECTIONS[0].key);
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

  const activeSection = CODEX_SECTIONS.find((section) => section.key === activeSectionKey);
  const entries = codexState ? activeSection.buildEntries(codexState) : [];
  const unlockedCount = entries.filter((entry) => entry.unlocked).length;

  const horizontalPadding = isCompact
    ? CODEX_COMPACT_HORIZONTAL_PADDING
    : CODEX_CONTENT_HORIZONTAL_PADDING;
  const contentWidth = Math.min(width, CODEX_CONTENT_MAX_WIDTH) - horizontalPadding * 2;
  const cardWidth = (contentWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, isCompact && styles.compactContent]}>
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
              <Text style={styles.description}>出会った崩壊の光景と、選ばれし人物たち。</Text>
            </View>
            <CornerMessenger
              characters={CODEX_MESSENGER_CHARACTERS}
              compact={isCompact}
              messages={CODEX_MESSENGER_MESSAGES}
            />
          </View>
        </View>

        <View style={styles.tabs}>
          {CODEX_SECTIONS.map((section) => (
            <PressableScale
              accessibilityRole="button"
              accessibilityState={{ selected: section.key === activeSectionKey }}
              glowColor="#b9985a"
              key={section.key}
              onPress={() => {
                if (section.key === activeSectionKey) return;
                playSoundEffect('advance');
                setActiveSectionKey(section.key);
              }}
              style={({ pressed }) => [
                styles.tab,
                section.key === activeSectionKey && styles.activeTab,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  section.key === activeSectionKey && styles.activeTabText,
                ]}
              >
                {section.tabLabel}
              </Text>
            </PressableScale>
          ))}
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
                <Text style={styles.listLabel}>{activeSection.listLabel}</Text>
                <Text style={styles.resultCount}>{unlockedCount} / {entries.length}</Text>
              </View>
              {unlockedCount === 0 ? (
                <Text style={styles.emptyHint}>{activeSection.emptyHint}</Text>
              ) : null}
              <View style={styles.grid}>
                {entries.map((entry) => (
                  <CodexCard
                    entry={entry}
                    key={entry.key}
                    onPress={setSelectedEntry}
                    section={activeSection}
                    size={cardWidth}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <CodexDetailModal
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
        sectionKey={activeSectionKey}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0d',
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
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
  tabs: {
    marginTop: 36,
    flexDirection: 'row',
    gap: 10,
  },
  tab: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#38353a',
    backgroundColor: '#141417',
  },
  activeTab: {
    borderColor: '#b9985a',
    backgroundColor: '#1b1919',
  },
  tabText: {
    color: '#8e8982',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  activeTabText: {
    color: '#d8c9aa',
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
  figureDetailBlock: {
    marginTop: 40,
    alignItems: 'center',
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
  detailDisclaimer: {
    marginTop: 24,
    maxWidth: 480,
    color: '#625e58',
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
  },
  figureStatList: {
    width: '100%',
    marginTop: 26,
    gap: 14,
  },
  figureStatRow: {
    gap: 6,
  },
  figureStatLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  figureStatLabel: {
    color: '#d8c9aa',
    fontSize: 13,
    fontWeight: '800',
  },
  figureStatValue: {
    color: '#f3eee4',
    fontSize: 13,
    fontWeight: '900',
  },
  figureStatTrack: {
    height: 8,
    overflow: 'hidden',
    backgroundColor: '#2d2b30',
  },
  figureStatFill: {
    height: '100%',
    backgroundColor: '#7e2024',
  },
  detailMeta: {
    marginTop: 28,
    color: '#77716a',
    fontSize: 11,
    fontWeight: '700',
  },
});
