// 偉人診断機能：欲望軸パターンが近い人物・キャラクターのデータセット（#72）。
// 実在の人物枠は、近代以降のジェノサイド加害者など現在も強い痛みを伴う人物を避け、
// 古代〜近世の、風刺エンタメとして広く扱われてきた人物に絞っている（Civilization等の先例に準拠）。
// アニメ・漫画キャラ枠は、支配・革命をテーマにした著名作品の実名キャラを使用（プロジェクト判断で許容）。
// 各作品の著作権・商標は各権利者に帰属し、本データセットはファン目線の風刺エンタメとして扱う。
// 一言紹介・偏見コメントの文面はAI（generateFigureDiagnosis）が対戦ごとに生成するため、
// ここでは選出用のパターンと、AI応答が得られない場合のフォールバック用epithetのみを持つ。
const FIGURES = Object.freeze([
  Object.freeze({
    key: 'caesar',
    name: 'ユリウス・カエサル',
    epithet: '賽は投げられた独裁官',
    pattern: Object.freeze({ domination: 82, egoism: 58, innovation: 60, prestige: 78, madness: 35 }),
  }),
  Object.freeze({
    key: 'nero',
    name: 'ネロ',
    epithet: '燃える都を眺めた皇帝',
    pattern: Object.freeze({ domination: 55, egoism: 80, innovation: 30, prestige: 60, madness: 78 }),
  }),
  Object.freeze({
    key: 'napoleon',
    name: 'ナポレオン・ボナパルト',
    epithet: '大陸を塗り替えた皇帝',
    pattern: Object.freeze({ domination: 85, egoism: 55, innovation: 75, prestige: 80, madness: 45 }),
  }),
  Object.freeze({
    key: 'caligula',
    name: 'カリギュラ',
    epithet: '気まぐれな神を名乗った皇帝',
    pattern: Object.freeze({ domination: 60, egoism: 82, innovation: 25, prestige: 55, madness: 90 }),
  }),
  Object.freeze({
    key: 'genghis_khan',
    name: 'チンギス・ハン',
    epithet: '草原を統べた大ハーン',
    pattern: Object.freeze({ domination: 90, egoism: 45, innovation: 70, prestige: 60, madness: 40 }),
  }),
  Object.freeze({
    key: 'robespierre',
    name: 'マクシミリアン・ロベスピエール',
    epithet: '清廉なる恐怖政治家',
    pattern: Object.freeze({ domination: 65, egoism: 15, innovation: 78, prestige: 40, madness: 72 }),
  }),
  Object.freeze({
    key: 'ivan_the_terrible',
    name: 'イワン雷帝',
    epithet: '疑心暗鬼のツァーリ',
    pattern: Object.freeze({ domination: 80, egoism: 50, innovation: 35, prestige: 50, madness: 80 }),
  }),
  Object.freeze({
    key: 'louis_xiv',
    name: 'ルイ14世',
    epithet: '「朕は国家なり」の太陽王',
    pattern: Object.freeze({ domination: 70, egoism: 60, innovation: 45, prestige: 92, madness: 30 }),
  }),
  Object.freeze({
    key: 'cleopatra',
    name: 'クレオパトラ7世',
    epithet: 'ナイルに君臨した最後のファラオ',
    pattern: Object.freeze({ domination: 60, egoism: 50, innovation: 65, prestige: 85, madness: 25 }),
  }),
  Object.freeze({
    key: 'qin_shi_huang',
    name: '始皇帝',
    epithet: '天下統一を成した初代皇帝',
    pattern: Object.freeze({ domination: 88, egoism: 50, innovation: 80, prestige: 75, madness: 65 }),
  }),
  Object.freeze({
    key: 'alexander_the_great',
    name: 'アレクサンドロス3世（大王）',
    epithet: '世界の果てを求めた王',
    pattern: Object.freeze({ domination: 88, egoism: 40, innovation: 55, prestige: 82, madness: 60 }),
  }),
  Object.freeze({
    key: 'elizabeth_i',
    name: 'エリザベス1世',
    epithet: '国家と結婚した処女王',
    pattern: Object.freeze({ domination: 68, egoism: 30, innovation: 55, prestige: 85, madness: 20 }),
  }),
  Object.freeze({
    key: 'vlad_the_impaler',
    name: 'ヴラド3世（串刺し公）',
    epithet: '恐怖で国境を守った公',
    pattern: Object.freeze({ domination: 78, egoism: 35, innovation: 20, prestige: 45, madness: 92 }),
  }),
  Object.freeze({
    key: 'marie_antoinette',
    name: 'マリー・アントワネット',
    epithet: 'ヴェルサイユの浪費王妃',
    pattern: Object.freeze({ domination: 25, egoism: 78, innovation: 15, prestige: 70, madness: 50 }),
  }),
  Object.freeze({
    key: 'oliver_cromwell',
    name: 'オリバー・クロムウェル',
    epithet: '王を処刑した護国卿',
    pattern: Object.freeze({ domination: 78, egoism: 20, innovation: 70, prestige: 50, madness: 70 }),
  }),
  Object.freeze({
    key: 'toussaint_louverture',
    name: 'トゥーサン・ルーヴェルテュール',
    epithet: '奴隷から将軍になった解放者',
    pattern: Object.freeze({ domination: 60, egoism: 15, innovation: 80, prestige: 55, madness: 30 }),
  }),
  Object.freeze({
    key: 'simon_bolivar',
    name: 'シモン・ボリバル',
    epithet: '大陸を独立させた解放者',
    pattern: Object.freeze({ domination: 75, egoism: 25, innovation: 78, prestige: 70, madness: 45 }),
  }),
  Object.freeze({
    key: 'catherine_de_medici',
    name: 'カトリーヌ・ド・メディシス',
    epithet: '毒と謀略の宮廷を操った王太后',
    pattern: Object.freeze({ domination: 62, egoism: 55, innovation: 50, prestige: 70, madness: 60 }),
  }),
  Object.freeze({
    key: 'timur',
    name: 'ティムール（タメルラン）',
    epithet: '髑髏の塔を築いた征服者',
    pattern: Object.freeze({ domination: 92, egoism: 45, innovation: 50, prestige: 65, madness: 85 }),
  }),
  Object.freeze({
    key: 'catherine_the_great',
    name: 'エカチェリーナ2世（大帝）',
    epithet: '啓蒙と拡張を両立させた女帝',
    pattern: Object.freeze({ domination: 80, egoism: 45, innovation: 75, prestige: 80, madness: 25 }),
  }),
  Object.freeze({
    key: 'attila',
    name: 'アッティラ',
    epithet: '「神の鞭」と恐れられた大王',
    pattern: Object.freeze({ domination: 88, egoism: 40, innovation: 30, prestige: 55, madness: 80 }),
  }),
  Object.freeze({
    key: 'harun_al_rashid',
    name: 'ハールーン・アッ＝ラシード',
    epithet: '千夜一夜物語の黄金期カリフ',
    pattern: Object.freeze({ domination: 55, egoism: 30, innovation: 70, prestige: 80, madness: 20 }),
  }),
  Object.freeze({
    key: 'empress_lu',
    name: '呂后（呂雉）',
    epithet: '漢を裏から支配した皇太后',
    pattern: Object.freeze({ domination: 75, egoism: 60, innovation: 40, prestige: 55, madness: 65 }),
  }),
  Object.freeze({
    key: 'suleiman_the_magnificent',
    name: 'スレイマン1世（壮麗王）',
    epithet: '最盛期を築いたオスマン皇帝',
    pattern: Object.freeze({ domination: 82, egoism: 35, innovation: 65, prestige: 90, madness: 20 }),
  }),
  // --- ここからアニメ・漫画キャラクター枠 ---
  Object.freeze({
    key: 'light_yagami',
    name: '夜神月',
    epithet: '新世界の神を目指したノート使い（『DEATH NOTE』）',
    pattern: Object.freeze({ domination: 80, egoism: 45, innovation: 65, prestige: 85, madness: 75 }),
  }),
  Object.freeze({
    key: 'lelouch',
    name: 'ルルーシュ・ランペルージ',
    epithet: 'ギアスで世界を書き換えた反逆の皇帝（『コードギアス』）',
    pattern: Object.freeze({ domination: 85, egoism: 40, innovation: 82, prestige: 80, madness: 55 }),
  }),
  Object.freeze({
    key: 'frieza',
    name: 'フリーザ',
    epithet: '宇宙を恐怖で支配した帝王（『ドラゴンボール』）',
    pattern: Object.freeze({ domination: 90, egoism: 85, innovation: 25, prestige: 70, madness: 70 }),
  }),
  Object.freeze({
    key: 'doflamingo',
    name: 'ドンキホーテ・ドフラミンゴ',
    epithet: '裏社会に糸を張り巡らせた元王族（『ONE PIECE』）',
    pattern: Object.freeze({ domination: 78, egoism: 70, innovation: 55, prestige: 60, madness: 80 }),
  }),
  Object.freeze({
    key: 'king_bradley',
    name: 'キング・ブラッドレイ',
    epithet: '国家錬金術の頂点に立った大総統（『鋼の錬金術師』）',
    pattern: Object.freeze({ domination: 82, egoism: 40, innovation: 45, prestige: 75, madness: 45 }),
  }),
  Object.freeze({
    key: 'uchiha_madara',
    name: 'うちはマダラ',
    epithet: '世界を書き換えようとした写輪眼の忍（『NARUTO』）',
    pattern: Object.freeze({ domination: 92, egoism: 35, innovation: 80, prestige: 78, madness: 78 }),
  }),
  Object.freeze({
    key: 'gilgamesh',
    name: 'ギルガメッシュ',
    epithet: 'すべてを見下ろす英雄王（『Fate』シリーズ）',
    pattern: Object.freeze({ domination: 70, egoism: 90, innovation: 30, prestige: 92, madness: 40 }),
  }),
  Object.freeze({
    key: 'aizen_sousuke',
    name: '藍染惣右介',
    epithet: '神に成り代わろうとした元隊長（『BLEACH』）',
    pattern: Object.freeze({ domination: 75, egoism: 55, innovation: 85, prestige: 80, madness: 60 }),
  }),
  Object.freeze({
    key: 'eren_yeager',
    name: 'エレン・イェーガー',
    epithet: '自由のために世界を踏み潰した始祖（『進撃の巨人』）',
    pattern: Object.freeze({ domination: 85, egoism: 40, innovation: 55, prestige: 45, madness: 90 }),
  }),
  Object.freeze({
    key: 'monkey_d_luffy',
    name: 'モンキー・D・ルフィ',
    epithet: '誰にも縛られない自由な海賊王候補（『ONE PIECE』）',
    pattern: Object.freeze({ domination: 20, egoism: 30, innovation: 70, prestige: 55, madness: 65 }),
  }),
]);

const FIGURE_DIAGNOSIS_DISCLAIMER =
  '※本診断はファン目線のエンターテインメント演出です。実在の歴史上の人物や作品中のキャラクターの実像・公式見解を示すものではなく、各作品の権利は各権利者に帰属します。';

/** AI応答が得られない場合に使う、選出人物のフォールバック一言紹介。 */
function buildFallbackBlurb(figure) {
  return `${figure.epithet}――${figure.name}に近い、欲望の持ち主のようです。`;
}

module.exports = { FIGURES, FIGURE_DIAGNOSIS_DISCLAIMER, buildFallbackBlurb };
