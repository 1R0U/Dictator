import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as Speech from 'expo-speech';

import { getSceneAtTime } from '../game/endingNews';

const FALLBACK_DURATION_SECONDS = 25;
const ACCENTS = ['#8f2431', '#9a6a2d', '#496378', '#62527b', '#7d3531'];
// Web版はnative animation moduleが存在せず、useNativeDriver:trueだと
// 警告が出た上でJSフォールバックになるだけなので、Webでは最初からfalseにする。
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

function NewsTicker({ text, durationSeconds }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);
  const textWidth = Math.max(1, Array.from(text).length * 15);

  useEffect(() => {
    if (!containerWidth || !textWidth) return undefined;
    translateX.setValue(containerWidth);
    const animation = Animated.loop(Animated.timing(translateX, {
      toValue: -textWidth,
      duration: Math.max(1000, durationSeconds * 900),
      easing: (value) => value,
      useNativeDriver: USE_NATIVE_DRIVER,
    }));
    animation.start();
    return () => animation.stop();
  }, [containerWidth, durationSeconds, textWidth, translateX]);

  return (
    <View
      accessibilityLabel={text}
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
      style={styles.tickerViewport}
    >
      <Animated.Text
        numberOfLines={1}
        style={[styles.narration, { width: textWidth, transform: [{ translateX }] }]}
      >
        {text}
      </Animated.Text>
    </View>
  );
}

export default function EndingNews({ scenes, audioUri, narrationError, onComplete }) {
  const { width, height } = useWindowDimensions();
  const isCompact = width < 520 || height < 700;
  const player = useAudioPlayer(audioUri || null, { updateInterval: 100 });
  const status = useAudioPlayerStatus(player);
  const [fallbackSeconds, setFallbackSeconds] = useState(0);
  const [hasPlaybackFailed, setHasPlaybackFailed] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;
  const completedRef = useRef(false);
  const playbackStateFailed = ['error', 'failed'].includes(status.playbackState);
  const hasAudio = Boolean(audioUri) && !hasPlaybackFailed && !playbackStateFailed;
  const fallbackDuration = Math.max(
    FALLBACK_DURATION_SECONDS,
    scenes.reduce((sum, item) => sum + String(item.narration ?? '').length, 0) / 6,
  );
  const totalSeconds = hasAudio
    ? (status.duration || fallbackDuration)
    : fallbackDuration;
  const currentSeconds = hasAudio ? status.currentTime : fallbackSeconds;
  const sceneIndex = getSceneAtTime(scenes, currentSeconds, totalSeconds);
  const scene = scenes[sceneIndex] ?? scenes[0];
  const totalNarrationWeight = scenes.reduce(
    (sum, item) => sum + Math.max(String(item.narration ?? '').length, 1),
    0,
  );
  const sceneDuration = scene
    ? totalSeconds * (Math.max(String(scene.narration ?? '').length, 1) / totalNarrationWeight)
    : totalSeconds;

  const finish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (status.playing) player.pause();
    onComplete?.();
  };

  useEffect(() => {
    let cancelled = false;
    setHasPlaybackFailed(false);
    setAudioModeAsync({ playsInSilentMode: true })
      .then(() => { if (!cancelled && audioUri) player.play(); })
      .catch(() => { if (!cancelled && audioUri) setHasPlaybackFailed(true); });
    return () => { cancelled = true; };
  }, [audioUri, player]);

  useEffect(() => {
    if (!audioUri || status.isLoaded || hasPlaybackFailed || playbackStateFailed) {
      return undefined;
    }
    const loadTimer = setTimeout(() => setHasPlaybackFailed(true), 8000);
    return () => clearTimeout(loadTimer);
  }, [audioUri, hasPlaybackFailed, playbackStateFailed, status.isLoaded]);

  useEffect(() => {
    if (hasAudio) return undefined;
    const timer = setInterval(() => setFallbackSeconds((value) => value + 0.1), 100);
    return () => clearInterval(timer);
  }, [hasAudio]);

  useEffect(() => {
    if (hasAudio || !scene?.narration) return undefined;
    let cancelled = false;
    Speech.stop().then(() => {
      if (!cancelled) Speech.speak(scene.narration, { rate: 1 });
    });
    return () => { cancelled = true; Speech.stop(); };
  }, [hasAudio, scene?.key, scene?.narration]);

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: USE_NATIVE_DRIVER }).start();
  }, [fade, sceneIndex]);

  useEffect(() => {
    if ((hasAudio && status.didJustFinish)
      || (!hasAudio && currentSeconds >= fallbackDuration)) finish();
  }, [currentSeconds, hasAudio, status.didJustFinish]);

  useEffect(() => {
    if (!scene) finish();
  }, [scene]);

  if (!scene) return null;

  const progress = Math.min(currentSeconds / totalSeconds, 1);
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.live}>SPECIAL REPORT</Text>
          <Text style={styles.program}>DESIRE NATION NEWS</Text>
        </View>
        <Text style={styles.counter}>{sceneIndex + 1} / {scenes.length}</Text>
      </View>

      <Animated.View style={[styles.bulletin, isCompact && styles.compactBulletin, { opacity: fade }]}>
        <View style={[styles.accentWash, { backgroundColor: ACCENTS[sceneIndex % ACCENTS.length] }]} />
        <View style={styles.bulletinRule} />
        <View style={styles.bulletinHeader}>
          <Text style={styles.bulletinKind}>BREAKING NEWS</Text>
          <Text style={styles.bulletinNumber}>{String(sceneIndex + 1).padStart(2, '0')}</Text>
        </View>
        <View style={styles.bulletinCopy}>
          <Text style={[styles.era, isCompact && styles.compactEra]}>{scene.label}</Text>
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            numberOfLines={isCompact ? 4 : 5}
            style={[styles.mainHeadline, isCompact && styles.compactMainHeadline]}
          >
            {scene.headline}
          </Text>
        </View>
        <View style={styles.bulletinFooter}>
          <Text style={styles.bulletinFooterText}>DESIRE NATION · NATIONAL BROADCAST</Text>
          <View style={styles.liveDot} />
          <Text style={styles.onAir}>ON AIR</Text>
        </View>
      </Animated.View>

      <View style={styles.captionPanel}>
        <View style={styles.captionLabelRow}>
          <Text style={styles.captionLabel}>NEWS FLASH</Text>
          <Text style={styles.captionEra}>{scene.label}</Text>
        </View>
        <NewsTicker
          durationSeconds={sceneDuration}
          key={scene.key}
          text={scene.narration}
        />
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <View style={styles.controls}>
        {hasAudio ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => (status.playing ? player.pause() : player.play())}
            style={styles.controlButton}
          >
            <Text style={styles.controlText}>{status.playing ? '\u4e00\u6642\u505c\u6b62' : '\u518d\u751f'}</Text>
          </Pressable>
        ) : <View />}
        <Pressable accessibilityRole="button" onPress={finish} style={styles.skipButton}>
          <Text style={styles.skipText}>{'\u30b9\u30ad\u30c3\u30d7'}</Text>
        </Pressable>
      </View>
      {narrationError || hasPlaybackFailed || playbackStateFailed ? (
        <Text style={styles.fallback}>{'\u97f3\u58f0\u3092\u518d\u751f\u3067\u304d\u306a\u304b\u3063\u305f\u305f\u3081\u3001\u5b57\u5e55\u3067\u653e\u9001\u3057\u3066\u3044\u307e\u3059'}</Text>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#080a0d', paddingHorizontal: 20, paddingVertical: 18 },
  topBar: {
    width: '100%', maxWidth: 680, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
  },
  live: { color: '#d7aa63', fontSize: 11, fontWeight: '800', letterSpacing: 2.6 },
  program: { color: '#f3efe6', fontSize: 19, fontWeight: '800', letterSpacing: 1 },
  counter: { color: '#99958d', fontSize: 12, fontWeight: '700' },
  bulletin: {
    flex: 1,
    width: '100%',
    maxWidth: 680,
    minHeight: 280,
    alignSelf: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#4b4b47',
    backgroundColor: '#101318',
    paddingHorizontal: 30,
    paddingVertical: 24,
  },
  compactBulletin: { minHeight: 210, paddingHorizontal: 20, paddingVertical: 16 },
  accentWash: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '38%',
    opacity: 0.24,
  },
  bulletinRule: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 7,
    height: '100%',
    backgroundColor: '#8f2431',
  },
  bulletinHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  bulletinKind: { color: '#d7aa63', fontSize: 11, fontWeight: '900', letterSpacing: 2.4 },
  bulletinNumber: { color: 'rgba(255,255,255,0.14)', fontSize: 42, lineHeight: 42, fontWeight: '900' },
  bulletinCopy: { flex: 1, justifyContent: 'center', paddingVertical: 12 },
  era: { color: '#aaa49a', fontSize: 15, fontWeight: '800', letterSpacing: 2, marginBottom: 12 },
  compactEra: { fontSize: 12, marginBottom: 7 },
  mainHeadline: {
    maxWidth: 580,
    color: '#f3efe6',
    fontSize: 38,
    lineHeight: 50,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  compactMainHeadline: { fontSize: 27, lineHeight: 36 },
  bulletinFooter: { flexDirection: 'row', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#45464a' },
  bulletinFooterText: { flex: 1, color: '#777b80', fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  liveDot: { width: 7, height: 7, borderRadius: 4, marginLeft: 12, marginRight: 6, backgroundColor: '#b3333d' },
  onAir: { color: '#d9d4ca', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  captionPanel: {
    width: '100%', maxWidth: 680, alignSelf: 'center',
    backgroundColor: '#e9e3d8', paddingHorizontal: 18, paddingVertical: 13, borderBottomWidth: 5, borderBottomColor: '#8f2431',
  },
  captionLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  captionLabel: { color: '#8f2431', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  captionEra: { color: '#6d6a64', fontSize: 10, fontWeight: '800' },
  tickerViewport: { height: 29, marginTop: 5, overflow: 'hidden', justifyContent: 'center' },
  narration: { color: '#3b3c3d', fontSize: 14, lineHeight: 22, position: 'absolute' },
  progressTrack: {
    width: '100%', maxWidth: 680, alignSelf: 'center',
    height: 3, backgroundColor: '#35383c', marginTop: 17,
  },
  progressFill: { height: '100%', backgroundColor: '#b7a074' },
  controls: {
    width: '100%', maxWidth: 680, alignSelf: 'center',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12,
  },
  controlButton: { paddingVertical: 9, paddingHorizontal: 15, borderWidth: 1, borderColor: '#55585c' },
  controlText: { color: '#d7d3cb', fontSize: 13, fontWeight: '700' },
  skipButton: { paddingVertical: 9, paddingHorizontal: 8 },
  skipText: { color: '#b7a074', fontSize: 13, fontWeight: '800' },
  fallback: {
    width: '100%', maxWidth: 680, alignSelf: 'center',
    color: '#777b80', fontSize: 10, textAlign: 'center', marginTop: 4,
  },
});
