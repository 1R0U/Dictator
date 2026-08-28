import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

const CONTAINER_BACKGROUND = '#0b0b0d';

/**
 * 画面レイアウトで共通して使う2種類のブレークポイントをまとめて返す。
 * isCompactWidthは横幅で崩れる要素（カード一覧・フォーム等）向け、
 * isCompactHeightは縦の詰まりで崩れる要素（TitleScreenの縦1カラム構成）向け。
 * どちらを使うかは画面ごとに判断する（幅に統一しない）。
 */
export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  return {
    width,
    height,
    isCompactWidth: width < 600,
    isCompactHeight: height < 720,
  };
}

/**
 * SafeAreaView→(KeyboardAvoidingView)→ScrollView→幅制限コンテンツ、という
 * 各画面で重複していた外枠を共通化する。デスクトップ幅では`maxWidth`で中央寄せにし、
 * スマホ縦画面前提のレイアウトがワイド画面で間延びするのを防ぐ。
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children スクロール領域に表示する内容。
 * @param {boolean} [props.keyboardAvoiding] 入力画面などでKeyboardAvoidingViewを挟むか。
 * @param {number} [props.maxWidth] コンテンツの最大幅。
 * @param {Object} [props.containerStyle] 最外殻(SafeAreaView)への追加スタイル。
 * @param {Object} [props.contentStyle] スクロールコンテンツへの追加スタイル。
 * @param {Object} [props.compactContentStyle] isCompactWidth時にcontentStyleへ重ねるスタイル。
 * @param {React.ReactNode} [props.overlay] スクロール領域の外側・最前面に重ねる装飾等（位置指定はabsoluteで自前）。
 * @param {React.ReactNode} [props.stickyFooter] スクロールしない固定フッター（ナビバー等）。
 * @param {Object} [props.scrollProps] ScrollViewへそのまま渡す追加props（ref/keyboardShouldPersistTaps等）。
 */
export default function ScreenContainer({
  children,
  keyboardAvoiding = false,
  maxWidth = 680,
  containerStyle,
  contentStyle,
  compactContentStyle,
  overlay = null,
  stickyFooter = null,
  scrollProps,
}) {
  const { isCompactWidth } = useResponsiveLayout();

  // stickyFooterはScrollViewの外でposition:'absolute'配置になる想定なので、
  // その基準となるposition:'relative'の箱を明示的に用意する
  // （SafeAreaView/KeyboardAvoidingView自体を基準にすると環境差の影響を受けやすいため）。
  const inner = (
    <View style={styles.body}>
      {overlay}
      <ScrollView
        style={styles.scrollView}
        {...scrollProps}
        contentContainerStyle={[
          styles.content,
          { maxWidth },
          contentStyle,
          isCompactWidth && compactContentStyle,
        ]}
      >
        {children}
      </ScrollView>
      {stickyFooter}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, containerStyle]}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {inner}
        </KeyboardAvoidingView>
      ) : inner}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CONTAINER_BACKGROUND,
  },
  keyboardView: {
    flex: 1,
  },
  body: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    alignSelf: 'center',
  },
});
