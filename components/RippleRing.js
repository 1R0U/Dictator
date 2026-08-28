import { Animated, StyleSheet } from 'react-native';

/**
 * ボタン中心から一瞬だけ広がって消える、控えめなリップルの輪。
 * 日常的な操作（一覧のカード、ナビゲーションボタンなど）向けの軽い演出。
 *
 * @param {Object} props
 * @param {Animated.Value} props.progress 0→1で進む発火用のAnimated.Value。
 * @param {string} [props.color] 輪の色。
 */
export default function RippleRing({ progress, color = '#b9985a' }) {
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.8] });
  const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });

  return (
    <Animated.View pointerEvents="none" style={styles.wrap}>
      <Animated.View
        style={[styles.ring, { borderColor: color, opacity, transform: [{ scale }] }]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 46,
    height: 46,
    marginLeft: -23,
    marginTop: -23,
    borderRadius: 23,
    borderWidth: 1.5,
  },
});
