import { useEffect, useMemo, useState } from 'react';

type AudioSource = string | number | { uri?: string; default?: string } | null;

function resolveSource(source: AudioSource) {
  if (typeof source === 'string') return source;
  if (source && typeof source === 'object') return source.uri ?? source.default ?? '';
  return '';
}

class WebAudioPlayer {
  audio: HTMLAudioElement | null = null;

  constructor(source: AudioSource) {
    if (typeof Audio !== 'undefined') this.audio = new Audio(resolveSource(source));
  }

  play() { return this.audio?.play() ?? Promise.resolve(); }
  pause() { this.audio?.pause(); }
  async seekTo(seconds: number) { if (this.audio) this.audio.currentTime = seconds; }
  remove() { this.audio?.pause(); this.audio = null; }
}

export function createAudioPlayer(source: AudioSource) {
  return new WebAudioPlayer(source);
}

export function useAudioPlayer(source: AudioSource) {
  const player = useMemo(() => new WebAudioPlayer(source), [source]);
  useEffect(() => () => player.remove(), [player]);
  return player;
}

export function useAudioPlayerStatus(player: WebAudioPlayer) {
  const [status, setStatus] = useState({
    playing: false, isLoaded: false, didJustFinish: false,
    duration: 0, currentTime: 0, playbackState: 'idle',
  });
  useEffect(() => {
    const timer = window.setInterval(() => {
      const audio = player.audio;
      setStatus({
        playing: Boolean(audio && !audio.paused && !audio.ended),
        isLoaded: Boolean(audio && audio.readyState >= 1),
        didJustFinish: Boolean(audio?.ended),
        duration: Number.isFinite(audio?.duration) ? audio?.duration ?? 0 : 0,
        currentTime: audio?.currentTime ?? 0,
        playbackState: audio?.error ? 'error' : 'ready',
      });
    }, 100);
    return () => window.clearInterval(timer);
  }, [player]);
  return status;
}

export async function setAudioModeAsync(_options: unknown) {}
