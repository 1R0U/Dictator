import {
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import PressableScale from './PressableScale';
import { playSoundEffect } from '../utils/sound';

const HOME_BACKGROUND = require('../assets/home-background.png');

/**
 * Renders a numbered title-screen action with visual press feedback.
 *
 * @param {Object} props
 * @param {string} props.index - Two-digit menu position displayed beside the label.
 * @param {string} props.label - Visible and accessible action label.
 * @param {Function} props.onPress - Callback invoked when the action is selected.
 * @param {boolean} [props.secondary=false] - Whether to use the subdued secondary style.
 * @returns {React.ReactElement} The interactive menu button.
 */
function MenuButton({ index, label, onPress, secondary = false }) {
  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="button"
      flashy={!secondary}
      glowColor="#a94b42"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondaryButton,
        pressed && styles.pressedButton,
      ]}
    >
      <Text accessibilityElementsHidden importantForAccessibility="no" style={[styles.buttonIndex, secondary && styles.secondaryButtonText]}>
        {index}
      </Text>
      <Text maxFontSizeMultiplier={1.25} style={[styles.buttonText, secondary && styles.secondaryButtonText]}>
        {label}
      </Text>
      <Text accessibilityElementsHidden importantForAccessibility="no" style={[styles.buttonArrow, secondary && styles.secondaryButtonText]}>
        ›
      </Text>
    </PressableScale>
  );
}

/**
 * Renders the responsive home screen and its primary navigation actions.
 *
 * @param {Object} props
 * @param {Function} props.onStart - Opens a new simulation.
 * @param {Function} props.onOpenHistory - Opens the saved simulation archive.
 * @param {Function} props.onOpenCodex - Opens the collapse/figure codex.
 * @returns {React.ReactElement} The illustrated title screen.
 */
export default function TitleScreen({ onStart, onOpenHistory, onOpenCodex }) {
  const { height } = useWindowDimensions();
  const isCompact = height < 720;

  return (
    <ImageBackground
      accessible={false}
      resizeMode="cover"
      source={HOME_BACKGROUND}
      style={styles.background}
    >
      <View pointerEvents="none" style={styles.imageShade} />
      <View pointerEvents="none" style={styles.edgeShadeLeft} />
      <View pointerEvents="none" style={styles.edgeShadeRight} />

      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.content, isCompact && styles.compactContent]}>
          <View style={[styles.brand, isCompact && styles.compactBrand]}>
            <View style={styles.kickerRow}>
              <View style={styles.kickerRule} />
              <Text maxFontSizeMultiplier={1.2} style={styles.kicker}>DESIRE NATION SIM</Text>
              <View style={styles.kickerRule} />
            </View>
            <View style={styles.titlePlate}>
              <Text
                accessibilityRole="header"
                maxFontSizeMultiplier={1.2}
                style={[styles.title, isCompact && styles.compactTitle]}
              >
                欲望国家
              </Text>
            </View>
            <Text maxFontSizeMultiplier={1.25} style={styles.subtitle}>
              あなたの欲望を法律へ、
            </Text>
          </View>

          <View style={[styles.bottomContent, isCompact && styles.compactBottomContent]}>
            <View style={styles.commandHeader}>
              <View style={styles.commandRule} />
              <Text style={styles.invitation}>DECREE</Text>
              <View style={styles.commandRule} />
            </View>
            <Text maxFontSizeMultiplier={1.25} style={styles.commandCopy}>
              玉座は、あなたの宣言を待っている
            </Text>
            <View style={styles.menu}>
              <MenuButton
                index="01"
                label="統治を始める"
                onPress={() => {
                  playSoundEffect('advance');
                  onStart();
                }}
              />
              <MenuButton
                index="02"
                label="記録庫を開く"
                onPress={() => {
                  playSoundEffect('advance');
                  onOpenHistory();
                }}
                secondary
              />
              <MenuButton
                index="03"
                label="図鑑を開く"
                onPress={() => {
                  playSoundEffect('advance');
                  onOpenCodex();
                }}
                secondary
              />
            </View>
          </View>

          <Text style={styles.footer}>THE NATION IS WAITING FOR YOUR DECREE</Text>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#172127' },
  imageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 9, 12, 0.08)',
  },
  edgeShadeLeft: {
    position: 'absolute', top: 0, bottom: 0, left: 0, width: '12%',
    backgroundColor: 'rgba(3, 8, 11, 0.2)',
  },
  edgeShadeRight: {
    position: 'absolute', top: 0, right: 0, bottom: 0, width: '12%',
    backgroundColor: 'rgba(3, 8, 11, 0.2)',
  },
  safeArea: { flex: 1 },
  content: {
    flex: 1, paddingHorizontal: 24, paddingTop: 30, paddingBottom: 18,
  },
  compactContent: { paddingTop: 18, paddingBottom: 12 },
  brand: { alignItems: 'center', paddingTop: 6 },
  compactBrand: { paddingTop: 0 },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  kickerRule: { width: 28, height: 1, backgroundColor: 'rgba(96, 41, 36, 0.8)' },
  kicker: {
    color: '#efe4d1', fontSize: 9, fontWeight: '800', letterSpacing: 3.2,
    textShadowColor: 'rgba(0, 0, 0, 0.9)', textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  titlePlate: {
    marginTop: 11, paddingHorizontal: 20, paddingVertical: 3,
    borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: 'rgba(224, 209, 182, 0.42)',
    backgroundColor: 'rgba(12, 18, 21, 0.2)',
  },
  title: {
    color: '#fff8eb', fontSize: 42, fontWeight: '900',
    letterSpacing: 9, textAlign: 'center', textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 7,
  },
  compactTitle: { fontSize: 35 },
  subtitle: {
    marginTop: 10, color: '#eee4d4', fontSize: 12, fontWeight: '600',
    letterSpacing: 2, textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  bottomContent: {
    position: 'absolute', right: 24, bottom: 64, left: 24, alignItems: 'center',
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14,
    borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: 'rgba(201, 181, 149, 0.38)',
    backgroundColor: 'rgba(8, 14, 18, 0.62)',
  },
  compactBottomContent: { bottom: 42, paddingTop: 8, paddingBottom: 10 },
  commandHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  commandRule: { width: 30, height: 1, backgroundColor: '#8c3933' },
  invitation: {
    color: '#b96358', fontSize: 9, fontWeight: '800', letterSpacing: 3,
  },
  commandCopy: {
    marginTop: 6, marginBottom: 11, color: '#d8ccba', fontSize: 11, letterSpacing: 1.2,
    textShadowColor: 'rgba(0, 0, 0, 0.95)', textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  menu: { width: '100%', maxWidth: 380, gap: 8 },
  button: {
    minHeight: 52, flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderColor: '#a04a41', backgroundColor: 'rgba(103, 30, 27, 0.92)',
  },
  secondaryButton: {
    borderColor: 'rgba(211, 195, 166, 0.7)',
    backgroundColor: 'rgba(10, 17, 21, 0.72)',
  },
  pressedButton: { opacity: 0.7 },
  buttonIndex: {
    width: 48, color: '#d69a8e', fontSize: 9, fontWeight: '800',
    letterSpacing: 1, textAlign: 'center',
  },
  buttonText: {
    flex: 1, color: '#fff8ea', fontSize: 14, fontWeight: '800',
    letterSpacing: 3, textAlign: 'center',
  },
  buttonArrow: {
    width: 48, color: '#e4b7aa', fontSize: 24, fontWeight: '300', textAlign: 'center',
  },
  secondaryButtonText: { color: '#e6dac4' },
  footer: {
    position: 'absolute', right: 0, bottom: 4, left: 0,
    color: 'rgba(209, 197, 177, 0.58)', fontSize: 7, letterSpacing: 1.8,
    textAlign: 'center', textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
});
