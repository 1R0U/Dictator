import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  REPORT_SIDES,
  REPORT_STATUS,
  getReportContent,
  getReportStatus,
} from '../game/milestoneReport';

const NOTEBOOK_RING_COUNT = 12;
const NOTEBOOK_RINGS = Array.from({ length: NOTEBOOK_RING_COUNT }, (_, i) => i);
const NOTEBOOK_LINE_COUNT = 11;
const NOTEBOOK_LINES = Array.from({ length: NOTEBOOK_LINE_COUNT }, (_, i) => i);

/**
 * 節目ごとのニュース（表）と側近メモ（裏）を切り替えて表示する。
 *
 * @param {Object} props
 * @param {string} props.milestoneLabel 節目の表示名。
 * @param {string} [props.headline] generateBeatが返したニュース見出し。
 * @param {string} props.news generateBeatが返したニュース本文。
 * @param {string} props.memo generateBeatが返した側近メモ本文。
 * @param {Function} [props.onPrevious] 前の節目へ戻る処理。
 * @param {string} [props.previousLabel] 戻るボタンのラベル。
 * @param {Function} [props.onNext] 次の節目へ進む処理。
 * @param {string} [props.nextLabel] 次へボタンのラベル。
 * @param {boolean} [props.isFinal] 最後の節目かどうか。
 * @param {boolean} [props.isLoading] generateBeat呼び出し中かどうか。trueの間はローディング表示に差し替える。
 * @param {boolean} [props.isFallback] #11のタイムアウト・フォールバック機構がフォールバック本文を返したかどうか。
 */
export default function MilestoneReport({
  milestoneLabel,
  headline,
  news,
  memo,
  onPrevious,
  previousLabel = '前の節目へ戻る',
  onNext,
  nextLabel = '次の節目へ',
  isFinal = false,
  isLoading = false,
  isFallback = false,
}) {
  const [activeSide, setActiveSide] = useState(REPORT_SIDES.NEWS);
  const isNews = activeSide === REPORT_SIDES.NEWS;
  const reportContent = getReportContent(activeSide, { news, memo });
  const status = getReportStatus({ isLoading, isFallback });
  const [scrollMetrics, setScrollMetrics] = useState({ containerHeight: 0, contentHeight: 0, scrollY: 0 });
  const canScrollBody = scrollMetrics.contentHeight > scrollMetrics.containerHeight + 1;
  const scrollThumbHeight = canScrollBody
    ? Math.max(24, (scrollMetrics.containerHeight / scrollMetrics.contentHeight) * scrollMetrics.containerHeight)
    : 0;
  const scrollThumbTop = canScrollBody
    ? (scrollMetrics.scrollY / (scrollMetrics.contentHeight - scrollMetrics.containerHeight)) *
      (scrollMetrics.containerHeight - scrollThumbHeight)
    : 0;

  useEffect(() => {
    setActiveSide(REPORT_SIDES.NEWS);
  }, [milestoneLabel]);

  return (
    <View style={styles.container}>
      {status === REPORT_STATUS.LOADING ? (
        <View accessibilityLiveRegion="polite" style={styles.loading}>
          <ActivityIndicator color="#b9985a" size="large" />
          <Text style={styles.loadingText}>{milestoneLabel}の情報を集めています…</Text>
        </View>
      ) : (
        <>
          {status === REPORT_STATUS.FALLBACK ? (
            <Text accessibilityLiveRegion="polite" style={styles.fallbackNotice}>
              通信状況により、代替の速報を表示しています
            </Text>
          ) : null}
          <View accessibilityRole="tablist" style={styles.tabs}>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: isNews }}
              onPress={() => setActiveSide(REPORT_SIDES.NEWS)}
              style={({ pressed }) => [
                styles.tab,
                isNews && styles.activeNewsTab,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.tabText, isNews && styles.activeTabText]}>表・ニュース</Text>
            </Pressable>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: !isNews }}
              onPress={() => setActiveSide(REPORT_SIDES.MEMO)}
              style={({ pressed }) => [
                styles.tab,
                !isNews && styles.activeMemoTab,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.tabText, !isNews && styles.activeMemoTabText]}>
                裏・側近メモ
              </Text>
            </Pressable>
          </View>

          <View
            accessibilityLiveRegion="polite"
            style={[styles.report, isNews ? styles.newsReport : styles.memoReport]}
          >
            {!isNews ? (
              <>
                <View style={styles.notebookLines}>
                  {NOTEBOOK_LINES.map((i) => (
                    <View key={i} style={styles.notebookLine} />
                  ))}
                </View>
                <View style={styles.notebookSpine} />
                <View style={styles.notebookRings}>
                  {NOTEBOOK_RINGS.map((i) => (
                    <View key={i} style={styles.notebookRingItem}>
                      <View style={styles.notebookRingCoil} />
                      <View style={styles.notebookRingHole} />
                    </View>
                  ))}
                </View>
                <View style={styles.notebookRibbon}>
                  <View style={styles.notebookRibbonNotch} />
                </View>
              </>
            ) : null}
            <View style={styles.reportHeader}>
              <Text style={[styles.badge, !isNews && styles.memoBadge]}>
                {isNews ? 'DICTATOR TIMES' : 'CONFIDENTIAL'}
              </Text>
              <Text style={styles.milestone}>{milestoneLabel}</Text>
            </View>
            <View style={[styles.headingRule, !isNews && styles.memoHeadingRule]} />
            <View style={styles.headingRow}>
              <Text style={[styles.headingOrnament, !isNews && styles.memoHeadingOrnament]}>
                ◆
              </Text>
              <Text style={[styles.heading, !isNews && styles.memoHeading]}>
                {isNews ? '国家からの最新報道' : '独裁者だけに届く側近メモ'}
              </Text>
              <Text style={[styles.headingOrnament, !isNews && styles.memoHeadingOrnament]}>
                ◆
              </Text>
            </View>
            {isNews && headline ? (
              <Text style={styles.subheadline}>{headline}</Text>
            ) : null}
            <View style={styles.rule} />
            <View style={styles.bodyScrollWrap}>
              <ScrollView
                key={activeSide}
                nestedScrollEnabled
                onContentSizeChange={(_width, height) => (
                  setScrollMetrics((current) => ({ ...current, contentHeight: height }))
                )}
                onLayout={(e) => {
                  const height = e.nativeEvent.layout.height;
                  setScrollMetrics((current) => ({ ...current, containerHeight: height }));
                }}
                onScroll={(e) => {
                  const y = e.nativeEvent.contentOffset.y;
                  setScrollMetrics((current) => ({ ...current, scrollY: y }));
                }}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                style={styles.bodyScroll}
                contentContainerStyle={styles.bodyScrollContent}
              >
                <Text style={[styles.body, !isNews && styles.memoBody]}>{reportContent}</Text>
              </ScrollView>
              {canScrollBody ? (
                <View style={styles.scrollTrack}>
                  <View
                    style={[
                      styles.scrollThumb,
                      !isNews && styles.memoScrollThumb,
                      { height: scrollThumbHeight, top: scrollThumbTop },
                    ]}
                  />
                </View>
              ) : null}
            </View>
            <Text style={styles.switchHint}>タブを押して表と裏を切り替え</Text>
          </View>
        </>
      )}
      {onPrevious || onNext ? (
        <View style={styles.navigation}>
          {onPrevious ? (
            <Pressable
              accessibilityRole="button"
              onPress={onPrevious}
              style={({ pressed }) => [
                styles.navigationButton,
                styles.previousButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.previousArrow}>←</Text>
              <Text style={styles.previousButtonText}>{previousLabel}</Text>
            </Pressable>
          ) : null}
          {onNext ? (
            <Pressable
              accessibilityRole="button"
              onPress={onNext}
              style={({ pressed }) => [
                styles.navigationButton,
                styles.nextButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.nextButtonText}>{nextLabel}</Text>
              <Text style={styles.nextArrow}>→</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {isFinal ? (
        <Text style={styles.finalMilestone}>最後の節目に到達しました</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 520,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#38353a',
    backgroundColor: '#111114',
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeNewsTab: {
    backgroundColor: '#d8c9aa',
  },
  activeMemoTab: {
    backgroundColor: '#7e2024',
  },
  tabText: {
    color: '#8e8982',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  activeTabText: {
    color: '#111114',
  },
  activeMemoTabText: {
    color: '#f3eee4',
  },
  pressed: {
    opacity: 0.7,
  },
  loading: {
    minHeight: 300,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#38353a',
    backgroundColor: '#111114',
  },
  loadingText: {
    color: '#d8c9aa',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
  },
  fallbackNotice: {
    marginBottom: 10,
    padding: 10,
    color: '#d98b8f',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#7e2024',
    backgroundColor: '#1c1315',
  },
  report: {
    position: 'relative',
    minHeight: 300,
    padding: 24,
    borderWidth: 1,
  },
  newsReport: {
    borderColor: '#b9985a',
    backgroundColor: '#eee6d6',
  },
  memoReport: {
    paddingLeft: 42,
    borderColor: '#7e2024',
    backgroundColor: '#171316',
    borderRadius: 6,
    transform: [{ rotate: '-0.6deg' }],
  },
  notebookLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  notebookLine: {
    height: 1,
    marginTop: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  notebookSpine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 30,
    backgroundColor: '#100c0d',
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    pointerEvents: 'none',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
  },
  notebookRings: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    pointerEvents: 'none',
  },
  notebookRingItem: {
    position: 'relative',
    width: 30,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notebookRingCoil: {
    position: 'absolute',
    left: -7,
    top: 0,
    width: 11,
    height: 14,
    borderWidth: 2,
    borderRightWidth: 0,
    borderColor: '#9a948a',
    borderTopLeftRadius: 7,
    borderBottomLeftRadius: 7,
  },
  notebookRingHole: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#0b0b0d',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  notebookRibbon: {
    position: 'absolute',
    top: -14,
    right: 32,
    width: 20,
    height: 34,
    backgroundColor: '#b9985a',
    pointerEvents: 'none',
  },
  notebookRibbonNotch: {
    position: 'absolute',
    bottom: -8,
    left: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#171316',
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  badge: {
    color: '#7e2024',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  memoBadge: {
    color: '#d98b8f',
  },
  milestone: {
    color: '#625e58',
    fontSize: 11,
    fontWeight: '700',
  },
  headingRule: {
    marginTop: 18,
    height: 1,
    backgroundColor: '#b9985a',
    opacity: 0.6,
  },
  memoHeadingRule: {
    backgroundColor: '#625e58',
  },
  headingRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  headingOrnament: {
    color: '#b9985a',
    fontSize: 12,
  },
  memoHeadingOrnament: {
    color: '#7e2024',
  },
  heading: {
    flexShrink: 1,
    color: '#171316',
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 0.5,
    lineHeight: 32,
    textAlign: 'center',
  },
  memoHeading: {
    color: '#f3eee4',
  },
  subheadline: {
    marginTop: 10,
    paddingLeft: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#7e2024',
    color: '#3a2422',
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  rule: {
    width: 48,
    height: 3,
    marginVertical: 18,
    backgroundColor: '#7e2024',
  },
  bodyScrollWrap: {
    position: 'relative',
  },
  bodyScroll: {
    maxHeight: 320,
  },
  bodyScrollContent: {
    paddingRight: 14,
    paddingBottom: 4,
  },
  scrollTrack: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    pointerEvents: 'none',
  },
  scrollThumb: {
    position: 'absolute',
    right: 0,
    width: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  memoScrollThumb: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  body: {
    color: '#302d29',
    fontSize: 16,
    lineHeight: 28,
  },
  memoBody: {
    color: '#d8c9aa',
  },
  switchHint: {
    marginTop: 28,
    color: '#77716a',
    fontSize: 10,
    letterSpacing: 1,
    textAlign: 'center',
  },
  navigation: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  navigationButton: {
    flex: 1,
    minHeight: 56,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previousButton: {
    borderWidth: 1,
    borderColor: '#625e58',
    backgroundColor: '#17171a',
  },
  previousButtonText: {
    color: '#d8c9aa',
    fontSize: 12,
    fontWeight: '800',
  },
  previousArrow: {
    color: '#d8c9aa',
    fontSize: 20,
    fontWeight: '700',
  },
  nextButton: {
    backgroundColor: '#b9985a',
  },
  nextButtonText: {
    color: '#111114',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  nextArrow: {
    color: '#111114',
    fontSize: 20,
    fontWeight: '700',
  },
  finalMilestone: {
    marginTop: 20,
    color: '#b9985a',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
  },
});
