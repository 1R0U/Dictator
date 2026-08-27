import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { REPORT_SIDES, getReportContent } from '../game/milestoneReport';

/**
 * 節目ごとのニュース（表）と側近メモ（裏）を切り替えて表示する。
 *
 * @param {Object} props
 * @param {string} props.milestoneLabel 節目の表示名。
 * @param {string} props.news generateBeatが返したニュース本文。
 * @param {string} props.memo generateBeatが返した側近メモ本文。
 * @param {Function} [props.onPrevious] 前の節目へ戻る処理。
 * @param {string} [props.previousLabel] 戻るボタンのラベル。
 * @param {Function} [props.onNext] 次の節目へ進む処理。
 * @param {string} [props.nextLabel] 次へボタンのラベル。
 * @param {boolean} [props.isFinal] 最後の節目かどうか。
 */
export default function MilestoneReport({
  milestoneLabel,
  news,
  memo,
  onPrevious,
  previousLabel = '前の節目へ戻る',
  onNext,
  nextLabel = '次の節目へ',
  isFinal = false,
}) {
  const [activeSide, setActiveSide] = useState(REPORT_SIDES.NEWS);
  const isNews = activeSide === REPORT_SIDES.NEWS;
  const reportContent = getReportContent(activeSide, { news, memo });

  useEffect(() => {
    setActiveSide(REPORT_SIDES.NEWS);
  }, [milestoneLabel]);

  return (
    <View style={styles.container}>
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
        <View style={styles.reportHeader}>
          <Text style={[styles.badge, !isNews && styles.memoBadge]}>
            {isNews ? 'DICTATOR TIMES' : 'CONFIDENTIAL'}
          </Text>
          <Text style={styles.milestone}>{milestoneLabel}</Text>
        </View>
        <Text style={[styles.heading, !isNews && styles.memoHeading]}>
          {isNews ? '国家からの最新報道' : '独裁者だけに届く側近メモ'}
        </Text>
        <View style={styles.rule} />
        <Text style={[styles.body, !isNews && styles.memoBody]}>{reportContent}</Text>
        <Text style={styles.switchHint}>タブを押して表と裏を切り替え</Text>
      </View>
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
  report: {
    minHeight: 300,
    padding: 24,
    borderWidth: 1,
  },
  newsReport: {
    borderColor: '#b9985a',
    backgroundColor: '#eee6d6',
  },
  memoReport: {
    borderColor: '#7e2024',
    backgroundColor: '#171316',
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
  heading: {
    marginTop: 22,
    color: '#171316',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 32,
  },
  memoHeading: {
    color: '#f3eee4',
  },
  rule: {
    width: 48,
    height: 3,
    marginVertical: 18,
    backgroundColor: '#7e2024',
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
