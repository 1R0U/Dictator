const MAX_NEWS_SCENES = 5;

function cleanText(value) {
  return String(value ?? '').replace(/[「」『』]/g, '').replace(/\s+/g, ' ').trim();
}

function selectEvenly(items, limit) {
  if (items.length <= limit) return items;
  const lastIndex = items.length - 1;
  return Array.from({ length: limit }, (_, index) => (
    items[Math.round((index * lastIndex) / (limit - 1))]
  ));
}

function createEndingNewsScenes(milestones, reports, limit = MAX_NEWS_SCENES) {
  const candidates = milestones.flatMap((milestone) => {
    const report = reports?.[milestone.key];
    if (!report) return [];
    const headline = cleanText(report.headline || report.news);
    const narration = cleanText(report.news || report.headline);
    if (!headline || !narration) return [];
    return [{ key: milestone.key, label: milestone.label, headline, narration }];
  });
  return selectEvenly(candidates, Math.min(Math.max(limit, 1), MAX_NEWS_SCENES));
}

function buildEndingNarrationText(scenes) {
  return scenes.map((scene) => cleanText(scene.narration)).filter(Boolean).join(' ');
}

function getSceneAtTime(scenes, currentSeconds, totalSeconds) {
  if (!scenes.length) return 0;
  const safeTotal = totalSeconds > 0 ? totalSeconds : 25;
  const totalWeight = scenes.reduce(
    (sum, scene) => sum + Math.max(cleanText(scene.narration).length, 1), 0,
  );
  const progress = Math.max(0, Math.min(currentSeconds / safeTotal, 0.999999));
  let accumulated = 0;
  for (let index = 0; index < scenes.length; index += 1) {
    accumulated += Math.max(cleanText(scenes[index].narration).length, 1) / totalWeight;
    if (progress < accumulated) return index;
  }
  return scenes.length - 1;
}

module.exports = {
  MAX_NEWS_SCENES,
  buildEndingNarrationText,
  createEndingNewsScenes,
  getSceneAtTime,
};
