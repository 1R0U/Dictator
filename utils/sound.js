import { createAudioPlayer } from 'expo-audio';

import { SOUND_EFFECTS } from '../data/soundEffects';

const players = {};

/** Lazily creates (and caches) the player for a given SE key. */
function getPlayer(key) {
  if (!players[key]) {
    players[key] = createAudioPlayer(SOUND_EFFECTS[key]);
  }
  return players[key];
}

/**
 * 効果音を先頭から再生する。読み込み前の呼び出しや再生失敗は無視する（SEはUI操作の付随演出のため）。
 *
 * @param {keyof typeof SOUND_EFFECTS} key
 */
export function playSoundEffect(key) {
  try {
    const player = getPlayer(key);
    player.seekTo(0).catch(() => {});
    player.play();
  } catch (err) {
    console.warn(`playSoundEffect: failed to play "${key}"`, err?.message);
  }
}

/** 国家崩壊の光景を表示する際に、複数のSEを重ねて再生する。 */
export function playCollapseSoundEffects() {
  playSoundEffect('collapse1');
  playSoundEffect('collapse2');
  playSoundEffect('collapse3');
}
