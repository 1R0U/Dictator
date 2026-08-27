// 偉人診断機能：欲望軸パターンが近い歴史上の人物データセット（#72）。
// 実在の人物を扱うため、近代以降のジェノサイド加害者など現在も強い痛みを伴う人物は避け、
// 古代〜近世の、風刺エンタメとして広く扱われてきた人物に絞っている（Civilization等の先例に準拠）。
const FIGURES = Object.freeze([
  Object.freeze({
    key: 'caesar',
    name: 'ユリウス・カエサル',
    epithet: '賽は投げられた独裁官',
    blurb: '軍事と政治の両輪を制し、「賽は投げられた」の一言で国境も慣習も踏み越えた実力者タイプ。',
    pattern: Object.freeze({ domination: 82, egoism: 58, innovation: 60, prestige: 78, madness: 35 }),
  }),
  Object.freeze({
    key: 'nero',
    name: 'ネロ',
    epithet: '燃える都を眺めた皇帝',
    blurb: '芸術と享楽に没頭し、国政より自分の評価と気分を優先しがちな自己陶酔タイプ。',
    pattern: Object.freeze({ domination: 55, egoism: 80, innovation: 30, prestige: 60, madness: 78 }),
  }),
  Object.freeze({
    key: 'napoleon',
    name: 'ナポレオン・ボナパルト',
    epithet: '大陸を塗り替えた皇帝',
    blurb: '法典から軍制まで作り替え、勢いのままに版図を広げ続ける野心満々の改革者タイプ。',
    pattern: Object.freeze({ domination: 85, egoism: 55, innovation: 75, prestige: 80, madness: 45 }),
  }),
  Object.freeze({
    key: 'caligula',
    name: 'カリギュラ',
    epithet: '気まぐれな神を名乗った皇帝',
    blurb: '思いつきと欲望をそのまま国政に反映させる、予測不能で危うい暴走タイプ。',
    pattern: Object.freeze({ domination: 60, egoism: 82, innovation: 25, prestige: 55, madness: 90 }),
  }),
  Object.freeze({
    key: 'genghis_khan',
    name: 'チンギス・ハン',
    epithet: '草原を統べた大ハーン',
    blurb: '徹底した実力主義と大胆な制度改革で、あっという間に版図を広げる拡張志向タイプ。',
    pattern: Object.freeze({ domination: 90, egoism: 45, innovation: 70, prestige: 60, madness: 40 }),
  }),
  Object.freeze({
    key: 'robespierre',
    name: 'マクシミリアン・ロベスピエール',
    epithet: '清廉なる恐怖政治家',
    blurb: '私腹を肥やさず理想に忠実であるがゆえに、正義の名のもとに歯止めが利かなくなるタイプ。',
    pattern: Object.freeze({ domination: 65, egoism: 15, innovation: 78, prestige: 40, madness: 72 }),
  }),
  Object.freeze({
    key: 'ivan_the_terrible',
    name: 'イワン雷帝',
    epithet: '疑心暗鬼のツァーリ',
    blurb: '身内すら信じ切れず、恐怖で従わせることでしか安心を得られない猜疑心タイプ。',
    pattern: Object.freeze({ domination: 80, egoism: 50, innovation: 35, prestige: 50, madness: 80 }),
  }),
  Object.freeze({
    key: 'louis_xiv',
    name: 'ルイ14世',
    epithet: '「朕は国家なり」の太陽王',
    blurb: '豪奢な宮殿と儀礼で権威を演出し、自分こそが国そのものだと信じて疑わないタイプ。',
    pattern: Object.freeze({ domination: 70, egoism: 60, innovation: 45, prestige: 92, madness: 30 }),
  }),
]);

const FIGURE_DIAGNOSIS_DISCLAIMER =
  '※本診断はエンターテインメント目的の演出です。実在の歴史上の人物の評価や実像を断定するものではありません。';

module.exports = { FIGURES, FIGURE_DIAGNOSIS_DISCLAIMER };
