const test = require('node:test');
const assert = require('node:assert/strict');

const { WAV_HEADER_SIZE, createWaveBytes } = require('../game/wavAudio');

test('wraps PCM bytes in a mono 24 kHz 16-bit WAV header', () => {
  const pcm = Uint8Array.from([1, 2, 3, 4]);
  const wave = createWaveBytes(Buffer.from(pcm).toString('base64'));
  const view = new DataView(wave.buffer, wave.byteOffset, wave.byteLength);
  assert.equal(Buffer.from(wave.slice(0, 4)).toString(), 'RIFF');
  assert.equal(Buffer.from(wave.slice(8, 12)).toString(), 'WAVE');
  assert.equal(view.getUint16(22, true), 1);
  assert.equal(view.getUint32(24, true), 24000);
  assert.equal(view.getUint16(34, true), 16);
  assert.deepEqual([...wave.slice(WAV_HEADER_SIZE)], [...pcm]);
});
