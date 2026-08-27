// 節目（マイルストーン）定義：進行ロジックはこの配列をインデックスで参照する
// 検診（追加宣言）は半年後・3年後・10年後の3回。
// 50年後は「国の滅亡」エンドへ分岐しうる節目（game/milestoneEnding.js参照）で、
// 分岐しなかった場合のみ最後の2XXX年（遠い未来）へ進む。
export const MILESTONES = [
  {
    key: 'day1',
    label: '初日',
    description: '宣言が布告され、組織が最初の解釈を発表する。',
    hasCheckup: false,
  },
  {
    key: 'week1',
    label: '1週間後',
    description: '布告の余波が国中に広がり始める。',
    hasCheckup: false,
  },
  {
    key: 'month1',
    label: '1か月後',
    description: '事態が形を成し始める。',
    hasCheckup: false,
  },
  {
    key: 'halfYear',
    label: '半年後',
    description: '国のかたちが定着し、欲望鑑定士が検診に訪れる。',
    hasCheckup: true,
  },
  {
    key: 'year1',
    label: '1年後',
    description: '一年間の統治の結末が見え始める。',
    hasCheckup: false,
  },
  {
    key: 'year3',
    label: '3年後',
    description: '統治が板につき、欲望鑑定士が再び検診に訪れる。',
    hasCheckup: true,
  },
  {
    key: 'year5',
    label: '5年後',
    description: '初期の熱狂が薄れ、国の日常として定着していく。',
    hasCheckup: false,
  },
  {
    key: 'year10',
    label: '10年後',
    description: '一つの時代の節目として、欲望鑑定士が最後の検診に訪れる。',
    hasCheckup: true,
  },
  {
    key: 'year50',
    label: '50年後',
    description: '半世紀を経て、国の行く末を分ける分岐点が訪れる。',
    hasCheckup: false,
  },
  {
    key: 'year2xxx',
    label: '2XXX年',
    description: '遠い未来、国がどんな結末を迎えたかが記録に残る。',
    hasCheckup: false,
  },
];

// 「国の滅亡」エンドへ分岐しうる節目のキー（game/milestoneEnding.js参照）。
export const NATION_COLLAPSE_CHECK_KEY = 'year50';

export default MILESTONES;
