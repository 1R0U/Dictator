const COLLAPSE_VISUALS = Object.freeze({
  collapse_oppression: Object.freeze({
    image: require('../assets/collapse-oppression.jpg'),
    imageLabel: '炎と群衆に包囲され、崩壊した宮殿と独裁者の像',
    kicker: 'COLLAPSE ROUTE 01 / OPPRESSION',
    number: '01',
    aspectRatio: 941 / 1672,
  }),
  collapse_privatization: Object.freeze({
    image: require('../assets/collapse-privatization.jpg'),
    imageLabel: '黄金に埋もれた支配者と、その足元で困窮する国民',
    kicker: 'COLLAPSE ROUTE 02 / PRIVATIZATION',
    number: '02',
    aspectRatio: 1122 / 1402,
  }),
  collapse_runaway_reform: Object.freeze({
    image: require('../assets/collapse-runaway-reform.jpg'),
    imageLabel: '制御不能な改革機構によって崩壊していく巨大都市',
    kicker: 'COLLAPSE ROUTE 03 / RUNAWAY REFORM',
    number: '03',
    aspectRatio: 941 / 1672,
  }),
  collapse_prestige_war: Object.freeze({
    image: require('../assets/collapse-prestige-war.jpg'),
    imageLabel: '国家の威信を懸けた総力戦によって焼け落ちる帝都',
    kicker: 'COLLAPSE ROUTE 04 / PRESTIGE WAR',
    number: '04',
    aspectRatio: 941 / 1672,
  }),
  collapse_fanaticism: Object.freeze({
    image: require('../assets/collapse-fanaticism.jpg'),
    imageLabel: '狂信に呑まれ、炎と祈りの中で滅びていく聖都',
    kicker: 'COLLAPSE ROUTE 05 / FANATICISM',
    number: '05',
    aspectRatio: 853 / 1844,
  }),
  collapse_bloody_revolution: Object.freeze({
    image: require('../assets/collapse-bloody-revolution.jpg'),
    imageLabel: '流血の革命と炎に包まれた宮殿へ押し寄せる群衆',
    kicker: 'COLLAPSE ROUTE 06 / BLOODY REVOLUTION',
    number: '06',
    aspectRatio: 853 / 1844,
  }),
  collapse_golden_palace: Object.freeze({
    image: require('../assets/collapse-golden-palace.jpg'),
    imageLabel: '黄金と財宝に埋め尽くされ、炎に沈む豪奢な宮殿',
    kicker: 'COLLAPSE ROUTE 07 / GOLDEN PALACE',
    number: '07',
    aspectRatio: 941 / 1672,
  }),
  collapse_forbidden_creation: Object.freeze({
    image: require('../assets/collapse-forbidden-creation.jpg'),
    imageLabel: '禁断の巨大装置が暴走し、空間ごと崩壊していく王都',
    kicker: 'COLLAPSE ROUTE 08 / FORBIDDEN CREATION',
    number: '08',
    aspectRatio: 853 / 1844,
  }),
  collapse_quiet: Object.freeze({
    image: require('../assets/collapse-quiet.jpg'),
    imageLabel: '人影が消え、音もなく朽ちていく灰色の帝都',
    kicker: 'COLLAPSE ROUTE 09 / QUIET EXTINCTION',
    number: '09',
    aspectRatio: 941 / 1672,
  }),
  collapse_void: Object.freeze({
    image: require('../assets/collapse-void.jpg'),
    imageLabel: '意味も営みも失われ、虚無だけが残った廃都',
    kicker: 'COLLAPSE ROUTE 10 / VOID',
    number: '10',
    aspectRatio: 853 / 1844,
  }),
});

function getCollapseVisual(endingType) {
  return COLLAPSE_VISUALS[endingType] ?? null;
}

module.exports = { COLLAPSE_VISUALS, getCollapseVisual };
