import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import CornerMessenger from './CornerMessenger';
import PressableScale from './PressableScale';
import ScreenContainer, { useResponsiveLayout } from './ScreenContainer';
import { loadResults } from '../data/history';
import { supabase } from '../lib/supabase';
import { scheduleAuthHistoryReload } from '../game/authHistory';
import { playSoundEffect } from '../utils/sound';
import {
  HISTORY_PAGE_SIZE,
  formatHistoryDate,
  getHistoryAccessibilityLabel,
  getHistoryAdditionalDeclarations,
  getHistoryPageCount,
  getHistoryPageItems,
  getHistoryTitle,
  normalizeHistoryResults,
} from '../game/historyView';

/**
 * 保存済みプレイ結果を新しい順に表示する履歴一覧画面。
 *
 * @param {Object} props
 * @param {Function} props.onBack タイトル画面へ戻る処理。
 * @param {Function} props.onSelect 履歴詳細へ進む処理。
 * @param {Function} [props.loadHistory] 履歴を取得する非同期処理。
 */
export default function History({ onBack, onSelect, loadHistory = loadResults }) {
  const { isCompactWidth: isCompact } = useResponsiveLayout();
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [page, setPage] = useState(0);
  const requestIdRef = useRef(0);
  const pageCount = getHistoryPageCount(results, HISTORY_PAGE_SIZE);
  const currentPage = Math.min(page, pageCount - 1);
  const pageResults = getHistoryPageItems(results, currentPage, HISTORY_PAGE_SIZE);

  const fetchHistory = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);
    setLoadError('');

    try {
      const loadedResults = await loadHistory();
      if (requestId !== requestIdRef.current) return;
      setResults(normalizeHistoryResults(loadedResults));
      setPage(0);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setLoadError('過去の記録を読み込めませんでした。');
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [loadHistory]);

  useEffect(() => {
    fetchHistory();
    return () => {
      requestIdRef.current += 1;
    };
  }, [fetchHistory]);

  useEffect(() => {
    if (!supabase) return undefined;
    const pendingReloads = new Set();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      requestIdRef.current += 1;
      setResults([]);
      setPage(0);
      const timer = scheduleAuthHistoryReload(event, () => {
        pendingReloads.delete(timer);
        fetchHistory();
      });
      if (timer !== null) pendingReloads.add(timer);
    });
    return () => {
      data.subscription.unsubscribe();
      pendingReloads.forEach(clearTimeout);
    };
  }, [fetchHistory]);

  return (
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
          <View style={[styles.headingCopy, styles.loweredHeaderContent]}>
            <Text style={[styles.title, isCompact && styles.compactTitle]}>過去の記録</Text>
            <Text style={styles.description}>これまでに統治した国々の結末。</Text>
          </View>
          <View style={styles.loweredHeaderContent}>
            <CornerMessenger
              compact={isCompact}
              messages={[
                '過去の欲望が、まだ光ってる。',
                'すべての宣言を、私は覚えている。',
                'この光、消えたことは一度もない。',
                '結末から目をそらさないで。',
                '記録は、消させない。',
                '過去も、裁きの対象だ。',
                'どの国も、同じ欲望から始まった。',
                '忘れたふりは、許さない。',
                'ここに眠るのは、あなたの選択の結果。',
                '次はどんな国を、望む？',
              ]}
            />
          </View>
        </View>
      </View>

      <View style={styles.listArea}>
        {isLoading ? (
          <View accessibilityLiveRegion="polite" style={styles.statePanel}>
            <ActivityIndicator color="#b9985a" size="large" />
            <Text style={styles.stateText}>記録を読み込み中…</Text>
          </View>
        ) : null}

        {!isLoading && loadError ? (
          <View accessibilityLiveRegion="polite" style={styles.statePanel}>
            <Text style={styles.stateMark}>!</Text>
            <Text style={styles.stateTitle}>記録を開けませんでした</Text>
            <Text style={styles.stateText}>{loadError}</Text>
            <PressableScale
              accessibilityRole="button"
              glowColor="#b9985a"
              onPress={fetchHistory}
              style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
            >
              <Text style={styles.retryButtonText}>もう一度読み込む</Text>
            </PressableScale>
          </View>
        ) : null}

        {!isLoading && !loadError && results.length === 0 ? (
          <View accessibilityLiveRegion="polite" style={styles.statePanel}>
            <Text style={styles.emptyEmblem}>◇</Text>
            <Text style={styles.stateTitle}>記録はまだありません</Text>
            <Text style={styles.stateText}>
              国の結末まで見届けると、ここに統治の記録が残ります。
            </Text>
            <PressableScale
              accessibilityRole="button"
              glowColor="#b9985a"
              onPress={onBack}
              style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
            >
              <Text style={styles.retryButtonText}>最初の国をつくる</Text>
            </PressableScale>
          </View>
        ) : null}

        {!isLoading && !loadError && results.length > 0 ? (
          <View>
            <View style={styles.listHeader}>
              <Text style={styles.listLabel}>ARCHIVED NATIONS</Text>
              <Text style={styles.resultCount}>{results.length}件</Text>
            </View>
            <View style={styles.list}>
              {pageResults.map((result, index) => {
                const overallIndex = currentPage * HISTORY_PAGE_SIZE + index;
                const title = getHistoryTitle(result);
                const savedAt = formatHistoryDate(result.savedAt);
                const additionalDeclarations = getHistoryAdditionalDeclarations(result);

                return (
                  <PressableScale
                    accessibilityLabel={getHistoryAccessibilityLabel(result, title, savedAt)}
                    accessibilityRole="button"
                    glowColor="#b9985a"
                    key={`${result.savedAt ?? 'unknown'}-${overallIndex}`}
                    onPress={() => onSelect(result)}
                    style={({ pressed }) => [styles.card, pressed && styles.pressedCard]}
                  >
                    <View style={styles.cardIndex}>
                      <Text style={styles.cardIndexText}>
                        {String(overallIndex + 1).padStart(2, '0')}
                      </Text>
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.cardDate}>{savedAt}</Text>
                      <Text style={styles.cardTitle}>{title}</Text>
                      {result.declarationSummary ? (
                        <Text numberOfLines={2} style={styles.cardSummary}>
                          「{result.declarationSummary}」
                        </Text>
                      ) : null}
                      {additionalDeclarations.map((item, declarationIndex) => (
                        <Text
                          key={`${item.milestoneKey}-${declarationIndex}`}
                          numberOfLines={2}
                          style={styles.cardAdditionalDeclaration}
                        >
                          追加宣言「{item.declaration}」
                        </Text>
                      ))}
                    </View>
                    <Text style={styles.cardArrow}>→</Text>
                  </PressableScale>
                );
              })}
            </View>
            {pageCount > 1 ? (
              <View style={styles.pagination}>
                <PressableScale
                  accessibilityRole="button"
                  disabled={currentPage === 0}
                  glowColor="#d8c9aa"
                  onPress={() => setPage((current) => Math.max(current - 1, 0))}
                  style={({ pressed }) => [
                    styles.pageButton,
                    currentPage === 0 && styles.disabledPageButton,
                    pressed && currentPage > 0 && styles.pressed,
                  ]}
                >
                  <Text style={styles.pageButtonText}>← 前へ</Text>
                </PressableScale>
                <Text style={styles.pageIndicator}>
                  {currentPage + 1} / {pageCount}
                </Text>
                <PressableScale
                  accessibilityRole="button"
                  disabled={currentPage >= pageCount - 1}
                  glowColor="#d8c9aa"
                  onPress={() => setPage((current) => Math.min(current + 1, pageCount - 1))}
                  style={({ pressed }) => [
                    styles.pageButton,
                    currentPage >= pageCount - 1 && styles.disabledPageButton,
                    pressed && currentPage < pageCount - 1 && styles.pressed,
                  ]}
                >
                  <Text style={styles.pageButtonText}>次へ →</Text>
                </PressableScale>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </ScreenContainer>
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
  loweredHeaderContent: {
    marginTop: 32,
  },
  title: {
    marginTop: 16,
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
    marginTop: 40,
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
  emptyEmblem: {
    color: '#625e58',
    fontSize: 52,
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
  list: {
    gap: 12,
  },
  pagination: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4e483d',
  },
  disabledPageButton: {
    opacity: 0.35,
  },
  pageButtonText: {
    color: '#d8c9aa',
    fontSize: 12,
    fontWeight: '800',
  },
  pageIndicator: {
    color: '#8e8982',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  card: {
    minHeight: 116,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#38353a',
    backgroundColor: '#141417',
  },
  pressedCard: {
    borderColor: '#b9985a',
    backgroundColor: '#1b1919',
  },
  cardIndex: {
    width: 36,
    height: 36,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4e483d',
  },
  cardIndexText: {
    color: '#b9985a',
    fontSize: 10,
    fontWeight: '900',
  },
  cardContent: {
    flex: 1,
  },
  cardDate: {
    color: '#77716a',
    fontSize: 10,
    fontWeight: '700',
  },
  cardTitle: {
    marginTop: 6,
    color: '#f3eee4',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 25,
  },
  cardSummary: {
    marginTop: 7,
    color: '#a9a39a',
    fontSize: 12,
    lineHeight: 18,
  },
  cardAdditionalDeclaration: {
    marginTop: 4,
    color: '#d8c9aa',
    fontSize: 11,
    lineHeight: 17,
  },
  cardArrow: {
    marginLeft: 14,
    color: '#b9985a',
    fontSize: 19,
  },
  pressed: {
    opacity: 0.65,
  },
});
