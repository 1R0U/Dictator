function createVisual(image, imageLabel, number, englishLabel, aspectRatio) {
  return Object.freeze({ image, imageLabel, kicker: `COLLAPSE ROUTE ${number} / ${englishLabel}`, number, aspectRatio });
}

const COLLAPSE_VISUALS = Object.freeze({
  collapse_citizen_disappearance: createVisual(require('../assets/collapse-citizen-disappearance.png'), '国民が消え、無人となった首都', '01', 'CITIZEN DISAPPEARANCE', 941 / 1672),
  collapse_national_bankruptcy: createVisual(require('../assets/collapse-national-bankruptcy.png'), '空になった国庫と崩れた国家財政', '02', 'NATIONAL BANKRUPTCY', 941 / 1672),
  collapse_social_functions_halt: createVisual(require('../assets/collapse-social-functions-halt.png'), '生活基盤が停止し荒廃した都市', '03', 'SOCIAL FUNCTIONS HALT', 941 / 1672),
  collapse_anarchy: createVisual(require('../assets/collapse-anarchy.png'), '無政府状態となり略奪が広がる都市', '04', 'ANARCHY', 941 / 1672),
  collapse_government_collapse: createVisual(require('../assets/collapse-government-collapse.png'), '政府機関が破壊され行政文書が散乱する宮殿', '05', 'GOVERNMENT COLLAPSE', 941 / 1672),
  collapse_dictator_overthrown: createVisual(require('../assets/collapse-dictator-overthrown.png'), '崩壊した玉座の前で失脚した独裁者', '06', 'DICTATOR OVERTHROWN', 941 / 1672),
  collapse_revolution_coup: createVisual(require('../assets/collapse-revolution-coup.png'), '革命軍が首都へ旗を掲げる光景', '07', 'REVOLUTION / COUP', 1054 / 1492),
  collapse_civil_war_partition: createVisual(require('../assets/collapse-civil-war-partition.png'), '分裂した勢力が全面衝突する内戦', '08', 'CIVIL WAR / PARTITION', 941 / 1672),
  collapse_famine: createVisual(require('../assets/collapse-famine.png'), '深刻な飢餓に苦しむ国民と荒廃した街', '09', 'FAMINE', 941 / 1672),
  collapse_economic_administrative: createVisual(require('../assets/collapse-economic-administrative.png'), '経済と行政が同時に崩壊した国家中枢', '10', 'ECONOMIC / ADMINISTRATIVE COLLAPSE', 941 / 1672),
  collapse_riots_looting: createVisual(require('../assets/collapse-riots-looting.png'), '暴動と略奪に支配された首都', '11', 'RIOTS / LOOTING', 941 / 1672),
  collapse_total_national: createVisual(require('../assets/collapse-total-national.png'), 'すべてが崩壊し炎上する国土', '12', 'TOTAL NATIONAL COLLAPSE', 853 / 1844),
  collapse_defeat_occupation: createVisual(require('../assets/collapse-defeat-occupation.png'), '敵軍に占領され異国の旗が掲げられた首都', '13', 'DEFEAT / OCCUPATION', 941 / 1672),
  collapse_nuclear_war: createVisual(require('../assets/collapse-nuclear-war.png'), '核爆発によって焼き尽くされる都市', '14', 'NUCLEAR WAR', 941 / 1672),
  collapse_forbidden_fruit: createVisual(require('../assets/collapse-forbidden-fruit.png'), '制御不能となった禁断の実験が都市を侵食する光景', '15', 'FORBIDDEN FRUIT', 941 / 1672),
  collapse_environmental: createVisual(require('../assets/collapse-environmental.png'), '汚染によって生命を失った国土', '16', 'ENVIRONMENTAL COLLAPSE', 941 / 1672),
  collapse_pandemic: createVisual(require('../assets/collapse-pandemic.png'), '疫病が蔓延し医療が崩壊した首都', '17', 'PANDEMIC EXTINCTION', 941 / 1672),
  collapse_religious_state: createVisual(require('../assets/collapse-religious-state.png'), '狂信に支配されひれ伏す国民', '18', 'RELIGIOUS STATE RUNAWAY', 1086 / 1448),
  collapse_ai_takeover: createVisual(require('../assets/collapse-ai-takeover.png'), 'AIが統治権を奪い人々を支配する未来都市', '19', 'AI TAKEOVER', 1086 / 1448),
});

/** Return visual metadata only for explicitly registered collapse route keys. */
function getCollapseVisual(endingType) {
  return Object.hasOwn(COLLAPSE_VISUALS, endingType) ? COLLAPSE_VISUALS[endingType] : null;
}

module.exports = { COLLAPSE_VISUALS, getCollapseVisual };
