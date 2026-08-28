import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import { getSceneAtTime } from '../game/endingNews';

const FALLBACK_DURATION_SECONDS = 25;
const ACCENTS = ['#8f2431', '#9a6a2d', '#496378', '#62527b', '#7d3531'];

function NewsTicker({ text }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);
  const textWidth = Math.max(1, Array.from(text).length * 15);

  useEffect(() => {
    if (!containerWidth || !textWidth) return undefined;
    translateX.setValue(containerWidth);
    const animation = Animated.loop(Animated.timing(translateX, {
      toValue: -textWidth,
      duration: Math.max(5000, ((containerWidth + textWidth) / 45) * 1000),
      easing: (value) => value,
      useNativeDriver: true,
    }));
    animation.start();
    return () => animation.stop();
  }, [containerWidth, textWidth, translateX]);

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
  const player = useAudioPlayer(audioUri || null, { updateInterval: 100 });
  const status = useAudioPlayerStatus(player);
  const [fallbackSeconds, setFallbackSeconds] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const completedRef = useRef(false);
  const hasAudio = Boolean(audioUri);
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

  const finish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (status.playing) player.pause();
    onComplete?.();
  };

  useEffect(() => {
    let cancelled = false;
    setAudioModeAsync({ playsInSilentMode: true })
      .then(() => { if (!cancelled && audioUri) player.play(); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [audioUri, player]);

  useEffect(() => {
    if (hasAudio) return undefined;
    const timer = setInterval(() => setFallbackSeconds((value) => value + 0.1), 100);
    return () => clearInterval(timer);
  }, [hasAudio]);

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }).start();
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

      <Animated.View style={[styles.visual, { opacity: fade }]}>
        <View style={[styles.glow, { backgroundColor: ACCENTS[sceneIndex % ACCENTS.length] }]} />
        <View style={styles.placeholderFrame}>
          <Text style={styles.placeholderMark}>DN</Text>
          <Text style={styles.placeholderText}>{'\u5831\u9053\u753b\u50cf\u306f\u5f8c\u304b\u3089\u8ffd\u52a0\u3067\u304d\u307e\u3059'}</Text>
        </View>
        <View style={styles.dateChip}><Text style={styles.dateText}>{scene.label}</Text></View>
      </Animated.View>

      <View style={styles.captionPanel}>
        <Text style={styles.headline}>{scene.headline}</Text>
        <NewsTicker key={scene.key} text={scene.narration} />
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
      {narrationError ? (
        <Text style={styles.fallback}>{'\u97f3\u58f0\u3092\u751f\u6210\u3067\u304d\u306a\u304b\u3063\u305f\u305f\u3081\u3001\u5b57\u5e55\u3067\u653e\u9001\u3057\u3066\u3044\u307e\u3059'}</Text>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#080a0d', paddingHorizontal: 20, paddingVertical: 18 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  live: { color: '#d7aa63', fontSize: 11, fontWeight: '800', letterSpacing: 2.6 },
  program: { color: '#f3efe6', fontSize: 19, fontWeight: '800', letterSpacing: 1 },
  counter: { color: '#99958d', fontSize: 12, fontWeight: '700' },
  visual: { flex: 1, minHeight: 260, overflow: 'hidden', backgroundColor: '#151a20', borderWidth: 1, borderColor: '#4b4b47' },
  glow: { position: 'absolute', width: 280, height: 280, borderRadius: 140, opacity: 0.36, top: -80, right: -60 },
  placeholderFrame: { flex: 1, margin: 24, borderWidth: 1, borderColor: 'rgba(230,220,200,0.22)', alignItems: 'center', justifyContent: 'center' },
  placeholderMark: { color: 'rgba(255,255,255,0.1)', fontSize: 90, fontWeight: '900', letterSpacing: -7 },
  placeholderText: { color: '#9b9994', fontSize: 12, marginTop: 10 },
  dateChip: { position: 'absolute', left: 0, bottom: 0, backgroundColor: '#b7a074', paddingHorizontal: 16, paddingVertical: 8 },
  dateText: { color: '#111317', fontWeight: '900', fontSize: 13 },
  captionPanel: { backgroundColor: '#e9e3d8', paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 5, borderBottomColor: '#8f2431' },
  headline: { color: '#13161a', fontSize: 21, lineHeight: 29, fontWeight: '900' },
  tickerViewport: { height: 29, marginTop: 8, overflow: 'hidden', justifyContent: 'center' },
  narration: { color: '#3b3c3d', fontSize: 14, lineHeight: 22, position: 'absolute' },
  progressTrack: { height: 3, backgroundColor: '#35383c', marginTop: 17 },
  progressFill: { height: '100%', backgroundColor: '#b7a074' },
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  controlButton: { paddingVertical: 9, paddingHorizontal: 15, borderWidth: 1, borderColor: '#55585c' },
  controlText: { color: '#d7d3cb', fontSize: 13, fontWeight: '700' },
  skipButton: { paddingVertical: 9, paddingHorizontal: 8 },
  skipText: { color: '#b7a074', fontSize: 13, fontWeight: '800' },
  fallback: { color: '#777b80', fontSize: 10, textAlign: 'center', marginTop: 4 },
});
