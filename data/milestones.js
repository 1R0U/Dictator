// 節目（マイルストーン）定義：進行ロジックはこの配列をインデックスで参照する
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
    description: '事態が形を成し始め、欲望鑑定士による最初の検診が入る。',
    hasCheckup: true,
  },
  {
    key: 'halfYear',
    label: '半年後',
    description: '国のかたちが定着し、欲望鑑定士が再び検診に訪れる。',
    hasCheckup: true,
  },
  {
    key: 'year1',
    label: '1年後',
    description: '一年間の統治の結末が見え始め、最後の検診が行われる。',
    hasCheckup: true,
  },
];

export default MILESTONES;
