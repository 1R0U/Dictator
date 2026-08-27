import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { selectRandomIndex } from '../game/checkup';

const CHARACTERS = [
  {
    image: require('../assets/corner-oracle.png'),
    name: '欲望の神託',
  },
  {
    image: require('../assets/corner-executioner.png'),
    name: '記録の執行人',
  },
];

/**
 * 画面を開いた際に選ばれたキャラクターと一言を見出しの横へ表示する。
 *
 * @param {Object} props
 * @param {boolean} props.compact 狭い画面向けの表示にするか。
 * @param {string[]} props.messages キャラクターごとの一言。
 */
export default function CornerMessenger({ compact, messages }) {
  const [characterIndex] = useState(() => selectRandomIndex(CHARACTERS.length));
  const character = CHARACTERS[characterIndex];
  const message = messages[characterIndex];

  return (
    <View
      accessibilityLabel={`${character.name}。「${message}」`}
      accessible
      style={[styles.container, compact && styles.compactContainer]}
    >
      <View pointerEvents="none" style={[styles.bubble, compact && styles.compactBubble]}>
        <Text style={styles.message}>{message}</Text>
        <View pointerEvents="none" style={styles.tail} />
      </View>
      <Image
        accessible={false}
        resizeMode="contain"
        source={character.image}
        style={[styles.image, compact && styles.compactImage]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: 153,
    marginTop: -12,
    alignItems: 'center',
  },
  compactContainer: {
    width: 132,
  },
  bubble: {
    position: 'absolute',
    left: '50%',
    bottom: '100%',
    zIndex: 1,
    width: 160,
    marginLeft: -80,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#b9985a',
    backgroundColor: '#eee6d6',
  },
  compactBubble: {
    width: 140,
    marginLeft: -70,
  },
  tail: {
    position: 'absolute',
    left: '50%',
    bottom: -6,
    width: 11,
    height: 11,
    marginLeft: -6,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#b9985a',
    backgroundColor: '#eee6d6',
    transform: [{ rotate: '45deg' }],
  },
  message: {
    color: '#201e1b',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 17,
  },
  image: {
    width: 153,
    height: 183,
  },
  compactImage: {
    width: 132,
    height: 158,
  },
});
