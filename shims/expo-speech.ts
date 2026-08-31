export async function stop() {
  if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
}

export function speak(text: string, options: { rate?: number; onDone?: () => void; onError?: () => void } = {}) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    options.onError?.();
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = options.rate ?? 1;
  utterance.onend = () => options.onDone?.();
  utterance.onerror = () => options.onError?.();
  window.speechSynthesis.speak(utterance);
}
