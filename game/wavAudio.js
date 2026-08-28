const WAV_HEADER_SIZE = 44;

/** Decode base64 without depending on Node Buffer, which is unavailable in Expo. */
function decodeBase64(base64) {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function writeAscii(view, offset, value) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

/** Wrap Gemini's mono 16-bit PCM response in a playable WAV container. */
function createWaveBytes(base64Pcm, sampleRate = 24000) {
  if (typeof base64Pcm !== 'string' || !base64Pcm.trim()) {
    throw new Error('Narration audio is empty');
  }

  const pcm = decodeBase64(base64Pcm);
  const output = new Uint8Array(WAV_HEADER_SIZE + pcm.length);
  const view = new DataView(output.buffer);
  const channels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * channels * (bitsPerSample / 8);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcm.length, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, channels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, pcm.length, true);
  output.set(pcm, WAV_HEADER_SIZE);

  return output;
}

module.exports = { WAV_HEADER_SIZE, createWaveBytes, decodeBase64 };
