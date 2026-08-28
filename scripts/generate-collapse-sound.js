const fs = require('node:fs');
const path = require('node:path');

const SAMPLE_RATE = 44100;
const DURATION_SECONDS = 1.15;
const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;
const sampleCount = Math.floor(SAMPLE_RATE * DURATION_SECONDS);
const dataSize = sampleCount * CHANNELS * (BITS_PER_SAMPLE / 8);
const buffer = Buffer.alloc(44 + dataSize);

buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(CHANNELS, 22);
buffer.writeUInt32LE(SAMPLE_RATE, 24);
buffer.writeUInt32LE(SAMPLE_RATE * CHANNELS * (BITS_PER_SAMPLE / 8), 28);
buffer.writeUInt16LE(CHANNELS * (BITS_PER_SAMPLE / 8), 32);
buffer.writeUInt16LE(BITS_PER_SAMPLE, 34);
buffer.write('data', 36);
buffer.writeUInt32LE(dataSize, 40);

let noiseState = 0x5f3759df;
const nextNoise = () => {
  noiseState = (1664525 * noiseState + 1013904223) >>> 0;
  return (noiseState / 0xffffffff) * 2 - 1;
};

let filteredNoise = 0;
const reverbBuffer = new Float64Array(Math.floor(SAMPLE_RATE * 0.34));

for (let index = 0; index < sampleCount; index += 1) {
  const time = index / SAMPLE_RATE;
  const fadeOut = Math.min(1, (DURATION_SECONDS - time) / 0.24);
  const rawNoise = nextNoise();
  filteredNoise += (rawNoise - filteredNoise) * 0.075;

  // A steep pitch drop creates the initial physical "DO-GAAN" shock wave.
  const boomPhase = 2 * Math.PI * (118 * time - 31 * time * time);
  const subPhase = 2 * Math.PI * (54 * time - 4.5 * time * time);
  const shock = Math.sin(boomPhase) * Math.exp(-5.1 * time) * 1.25;
  const subBoom = Math.sin(subPhase) * Math.exp(-2.3 * time) * 0.92;

  // Broadband debris with a sharp crack followed by a heavier rolling blast.
  const crack = rawNoise * Math.exp(-38 * time) * 1.5;
  const blast = (rawNoise * 0.48 + filteredNoise * 1.7)
    * Math.exp(-4.1 * time)
    * Math.min(1, time / 0.012)
    * 0.7;

  // A short metallic collapse gives the tail a catastrophic, structural feel.
  const metalEnvelope = Math.min(1, time / 0.025) * Math.exp(-4.3 * time);
  const metal = (
    Math.sin(2 * Math.PI * (286 - 52 * Math.min(time, 1.8)) * time)
    + Math.sin(2 * Math.PI * 417 * time) * 0.42
  ) * metalEnvelope * 0.2;

  const dry = shock + subBoom + crack + blast + metal;
  const reverbIndex = index % reverbBuffer.length;
  const delayed = reverbBuffer[reverbIndex];
  reverbBuffer[reverbIndex] = dry + delayed * 0.38;

  // Soft clipping keeps the explosion loud without producing digital distortion.
  const mixed = Math.tanh((dry + delayed * 0.46) * 1.38) * fadeOut * 0.92;
  buffer.writeInt16LE(Math.round(mixed * 32767), 44 + index * 2);
}

const outputPath = path.resolve(__dirname, '..', 'assets', 'collapse-impact.wav');
fs.writeFileSync(outputPath, buffer);
console.log(`Generated ${outputPath} (${buffer.length} bytes)`);
