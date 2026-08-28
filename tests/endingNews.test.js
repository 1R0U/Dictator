const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildEndingNarrationText,
  createEndingNewsScenes,
  getSceneAtTime,
} = require('../game/endingNews');

test('ending news samples at most five reports while preserving first and last', () => {
  const milestones = Array.from({ length: 10 }, (_, index) => ({
    key: `m${index}`,
    label: `${index}`,
  }));
  const reports = Object.fromEntries(milestones.map((milestone, index) => [
    milestone.key,
    { headline: `headline ${index}`, news: `news ${index}` },
  ]));
  const scenes = createEndingNewsScenes(milestones, reports);
  assert.equal(scenes.length, 5);
  assert.equal(scenes[0].key, 'm0');
  assert.equal(scenes.at(-1).key, 'm9');
});

test('narration keeps the complete report text', () => {
  const milestones = Array.from({ length: 5 }, (_, index) => ({ key: `m${index}`, label: '' }));
  const reports = Object.fromEntries(milestones.map((milestone) => [
    milestone.key,
    { headline: '見出し', news: 'これはとても長いニュース文章です。続きは読みません。' },
  ]));
  const text = buildEndingNarrationText(createEndingNewsScenes(milestones, reports));
  assert.equal(text.includes('続きは読みません'), true);
});

test('scene timing follows narration length', () => {
  const scenes = [
    { narration: '12345' },
    { narration: '123456789012345' },
  ];
  assert.equal(getSceneAtTime(scenes, 2, 20), 0);
  assert.equal(getSceneAtTime(scenes, 10, 20), 1);
  assert.equal(getSceneAtTime(scenes, 20, 20), 1);
});
