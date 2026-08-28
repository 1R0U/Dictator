import { useRef, useState } from 'react';
import { Animated, Platform, Pressable } from 'react-native';

import SparkBurst from './SparkBurst';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const FLASHY_DURATION_MS = 550;
// Web版はnative animation moduleが存在せず、useNativeDriver:trueだと
// 警告が出た上でJSフォールバックになるだけなので、Webでは最初からfalseにする。
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

/**
 * Pressableへタップエフェクトを足したラッパー。
 * style={({ pressed }) => [...]} を含め、既存の使い方をそのまま維持できる。
 *
 * @param {Object} props
 * @param {Function|Object|Array} [props.style] Pressableと同じstyle（関数形式も可）。
 * @param {number} [props.scaleTo] 押下時に縮小する倍率。
 * @param {boolean} [props.flashy] trueの場合、より大きく縮み、押した瞬間に火花と衝撃波が広がる演出を足す（重要な決定ボタン向け）。
 * @param {string} [props.glowColor] flashy時の色。
 */
export default function PressableScale({
  style,
  children,
  onPressIn,
  onPressOut,
  scaleTo,
  flashy = false,
  glowColor = '#f2c14e',
  ...rest
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const [pressed, setPressed] = useState(false);
  const effectiveScaleTo = scaleTo ?? (flashy ? 0.9 : 0.96);

  const animateTo = (toValue) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: USE_NATIVE_DRIVER,
      speed: flashy ? 30 : 50,
      bounciness: flashy ? 16 : 6,
    }).start();
  };

  const triggerBurst = (duration) => {
    burst.stopAnimation();
    burst.setValue(0);
    Animated.timing(burst, {
      toValue: 1,
      duration,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  };

  const resolvedStyle = typeof style === 'function' ? style({ pressed }) : style;

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(event) => {
        setPressed(true);
        animateTo(effectiveScaleTo);
        if (flashy) triggerBurst(FLASHY_DURATION_MS);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        animateTo(1);
        onPressOut?.(event);
      }}
      style={[resolvedStyle, { transform: [{ scale }] }]}
    >
      {children}
      {flashy ? <SparkBurst color={glowColor} progress={burst} /> : null}
    </AnimatedPressable>
  );
}
