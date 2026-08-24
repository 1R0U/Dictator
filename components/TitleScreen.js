import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

function MenuButton({ label, onPress, secondary = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, secondary && styles.secondaryButton, pressed && styles.pressedButton]}
    >
      <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{label}</Text>
    </Pressable>
  );
}

export default function TitleScreen({ onStart, onOpenHistory }) {
  return (
    <SafeAreaView style={styles.container}>
      <View pointerEvents="none" style={styles.sun} />
      <View pointerEvents="none" style={styles.rule} />
      <View style={styles.content}>
        <View style={styles.brand}>
          <Text style={styles.kicker}>DESIRE NATION SIM</Text>
          <View style={styles.emblem}>
            <Text style={styles.emblemText}>欲</Text>
          </View>
          <Text style={styles.title}>欲望国家</Text>
          <Text style={styles.subtitle}>あなたの欲望が、法律になる。</Text>
        </View>
        <View style={styles.menu}>
          <MenuButton label="新規プレイ" onPress={onStart} />
          <MenuButton label="過去の記録" onPress={onOpenHistory} secondary />
        </View>
        <Text style={styles.footer}>THE NATION IS WAITING FOR YOUR DECREE</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0d', overflow: 'hidden' },
  sun: {
    position: 'absolute', top: -150, left: '50%', width: 340, height: 340,
    marginLeft: -170, borderRadius: 170, backgroundColor: '#7e2024', opacity: 0.42,
  },
  rule: {
    position: 'absolute', top: '54%', right: 0, left: 0, height: 1,
    backgroundColor: '#b9985a', opacity: 0.22,
  },
  content: {
    flex: 1, justifyContent: 'space-between', paddingHorizontal: 28,
    paddingTop: 72, paddingBottom: 28,
  },
  brand: { alignItems: 'center' },
  kicker: {
    marginBottom: 30, color: '#b9985a', fontSize: 11, fontWeight: '700', letterSpacing: 4,
  },
  emblem: {
    width: 82, height: 82, marginBottom: 22, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#b9985a', transform: [{ rotate: '45deg' }],
  },
  emblemText: {
    color: '#f3eee4', fontSize: 36, fontWeight: '800', transform: [{ rotate: '-45deg' }],
  },
  title: {
    color: '#f3eee4', fontSize: 44, fontWeight: '800', letterSpacing: 7, textAlign: 'center',
  },
  subtitle: { marginTop: 14, color: '#a9a39a', fontSize: 14, letterSpacing: 1.5 },
  menu: { gap: 14 },
  button: {
    minHeight: 58, alignItems: 'center', justifyContent: 'center', borderWidth: 1,
    borderColor: '#b9985a', backgroundColor: '#b9985a',
  },
  secondaryButton: { backgroundColor: 'transparent' },
  pressedButton: { opacity: 0.72 },
  buttonText: { color: '#111114', fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  secondaryButtonText: { color: '#d8c9aa' },
  footer: { color: '#625e58', fontSize: 8, letterSpacing: 2, textAlign: 'center' },
});
