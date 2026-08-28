/**
 * 現在より前の節目で生成済みの出来事を、節目定義の順番で取り出す。
 *
 * @param {{ key: string, label: string }[]} milestones 節目定義。
 * @param {Record<string, { news?: string, memo?: string }>} reports 節目ごとの生成結果。
 * @param {number} currentIndex 現在の節目インデックス。
 * @returns {{ milestoneLabel: string, news: string, memo: string }[]} 時系列の出来事。
 */
function getPreviousMilestoneEvents(milestones, reports, currentIndex) {
  return milestones
    .slice(0, Math.max(0, currentIndex))
    .flatMap((milestone) => {
      const report = reports?.[milestone.key];
      const news = typeof report?.news === 'string' ? report.news.trim() : '';
      const memo = typeof report?.memo === 'string' ? report.memo.trim() : '';

      if (!news && !memo) return [];

      return [{
        milestoneLabel: milestone.label,
        news,
        memo,
      }];
    });
}

module.exports = { getPreviousMilestoneEvents };
