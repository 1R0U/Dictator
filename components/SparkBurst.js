import { useMemo } from 'react';
import { Animated, StyleSheet } from 'react-native';

const SPARK_COUNT = 14;

/** Build fixed spark angles/distances once so bursts stay stable across re-renders. */
function buildSparks(count) {
  return Array.from({ length: count }, (_, index) => {
    const angle = ((Math.PI * 2) / count) * index + (Math.random() - 0.5) * 0.4;
    const distance = 46 + Math.random() * 30;
    return { angle, distance };
  });
}

/**
 * ボタン中心から火花が飛び散り、衝撃波のリングが広がる演出。
 * 親要素（ボタン本体）の中心に重ねて配置し、progressが0→1で発火する想定。
 *
 * @param {Object} props
 * @param {Animated.Value} props.progress 0→1で進む発火用のAnimated.Value。
 * @param {string} [props.color] 火花の色。
 * @param {string} [props.ringColor] 衝撃波リングの色（省略時はcolorを使う）。
 */
export default function SparkBurst({ progress, color = '#f2c14e', ringColor }) {
  const sparks = useMemo(() => buildSparks(SPARK_COUNT), []);

  const ringScale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.3, 2.6] });
  const ringOpacity = progress.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.85, 0] });

  return (
    <Animated.View pointerEvents="none" style={styles.wrap}>
      <Animated.View
        style={[
          styles.ring,
          {
            borderColor: ringColor ?? color,
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />
      {sparks.map((spark, index) => {
        const translateX = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(spark.angle) * spark.distance],
        });
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(spark.angle) * spark.distance],
        });
        const opacity = progress.interpolate({
          inputRange: [0, 0.1, 0.7, 1],
          outputRange: [0, 1, 1, 0],
        });
        const scale = progress.interpolate({
          inputRange: [0, 0.15, 1],
          outputRange: [0.3, 1, 0.4],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.spark,
              {
                backgroundColor: color,
                opacity,
                transform: [{ translateX }, { translateY }, { scale }],
              },
            ]}
          />
        );
      })}
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
    width: 60,
    height: 60,
    marginLeft: -30,
    marginTop: -30,
    borderRadius: 30,
    borderWidth: 2,
  },
  spark: {
    position: 'absolute',
    width: 5,
    height: 5,
    marginLeft: -2.5,
    marginTop: -2.5,
    borderRadius: 2.5,
  },
});
