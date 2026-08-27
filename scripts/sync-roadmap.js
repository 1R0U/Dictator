#!/usr/bin/env node
// issue-roadmap.htmlの「誰が・どの順で作るか」レーンを、実際のGitHub issueの
// open/closed状態に合わせて自動更新する。
//
// 自動で直すもの：
//   - 各issueチップの done / wait / now(次) クラスと「次」バッジ
//   - 各レーンの完了件数（cnt表示・ヘッダー凡例）
//
// 手動のまま残すもの（GitHubに存在しない計画情報のため）：
//   - どの担当がどのissueを持つか（レーン構成そのもの）
//   - 論点セクション（decisions）・合流ポイント（sync points）・各種説明文
//   - ⏳「〇〇待ち」の依存関係の文言
//
// 使い方: node scripts/sync-roadmap.js
// 前提: ghコマンドでこのリポジトリにアクセスできること（gh auth login済み）

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const REPO = '1R0U/Dictator';
const ROADMAP_PATH = path.join(__dirname, '..', 'issue-roadmap.html');

// レーン構成と着手推奨順（左→右）。GitHubのissueに担当者情報がないため、
// ここだけは手動管理。担当が変わった/issueが増減したときはここを直す。
const LANES = [
  { key: 'ichiro', cntClass: 'cic', legendName: 'いちろー', issues: [1, 3, 7, 26, 27, 28, 30, 29, 31, 45, 11, 19] },
  { key: 'nozomi', cntClass: 'cnz', legendName: 'のぞみ', issues: [2, 4, 5, 8, 9, 10, 43, 25, 6] },
  { key: 'hiramasa', cntClass: 'chr', legendName: 'ひらまさ', issues: [12, 13, 44, 14, 16, 15, 17, 18] },
];

function fetchIssueStates() {
  const out = execFileSync(
    'gh',
    ['issue', 'list', '--repo', REPO, '--state', 'all', '--limit', '200', '--json', 'number,state'],
    { encoding: 'utf8' }
  );
  const issues = JSON.parse(out);
  const states = new Map();
  for (const issue of issues) states.set(issue.number, issue.state === 'CLOSED');
  return states;
}

function syncChip(html, issueNumber, isDone, isNext) {
  const re = new RegExp(
    `<a class="chip([^"]*)" href="https://github\\.com/1R0U/Dictator/issues/${issueNumber}" target="_blank" rel="noopener">(<span class="nb">次</span>)?([\\s\\S]*?)</a>`
  );
  const match = html.match(re);
  if (!match) {
    console.warn(`  ! #${issueNumber} のチップが見つかりませんでした（HTML構造が変わった？）`);
    return html;
  }

  let tokens = match[1].split(/\s+/).filter(Boolean);
  tokens = tokens.filter((t) => !['done', 'now'].includes(t));
  if (isDone) {
    tokens = tokens.filter((t) => t !== 'wait' && t !== 'inprog');
    tokens.push('done');
  } else if (isNext) {
    tokens.push('now');
  }
  const className = ['chip', ...tokens].join(' ');
  const badge = !isDone && isNext ? '<span class="nb">次</span>' : '';
  const replacement = `<a class="${className}" href="https://github.com/1R0U/Dictator/issues/${issueNumber}" target="_blank" rel="noopener">${badge}${match[3]}</a>`;
  return html.replace(re, replacement);
}

function syncLaneCount(html, lane, doneCount) {
  const cntRe = new RegExp(`(<div class="cnt ${lane.cntClass}">)\\d+( issues（完了)\\d+(）</div>)`);
  html = html.replace(cntRe, `$1${lane.issues.length}$2${doneCount}$3`);

  const legendRe = new RegExp(`(${lane.legendName}[^<]*?完了)\\d+(）)`);
  html = html.replace(legendRe, `$1${doneCount}$2`);
  return html;
}

function main() {
  console.log(`gh issue list --repo ${REPO} を取得中...`);
  const closedByNumber = fetchIssueStates();

  let html = fs.readFileSync(ROADMAP_PATH, 'utf8');
  const summary = [];

  for (const lane of LANES) {
    let nextAssigned = false;
    let doneCount = 0;

    for (const issueNumber of lane.issues) {
      const isDone = closedByNumber.get(issueNumber) === true;
      if (isDone) doneCount += 1;
      const isNext = !isDone && !nextAssigned;
      if (isNext) nextAssigned = true;
      html = syncChip(html, issueNumber, isDone, isNext);
    }

    html = syncLaneCount(html, lane, doneCount);
    summary.push(`  ${lane.legendName}: ${doneCount}/${lane.issues.length} 完了`);
  }

  fs.writeFileSync(ROADMAP_PATH, html);
  console.log('issue-roadmap.htmlのレーン状態を更新しました。');
  console.log(summary.join('\n'));
  console.log(
    '\n※ 論点(decisions)・合流ポイント(sync)・ヘッダーの完了issue一覧・「⏳待ち」の文言は\n' +
    '   このスクリプトでは更新していません。変更があれば手動で見直してください。'
  );
}

main();
