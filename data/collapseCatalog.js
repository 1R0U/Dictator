const COLLAPSE_ENDING_CATALOG = Object.freeze({
  collapse_citizen_disappearance: Object.freeze({ label: '国民消滅・大量国外脱出', title: '誰もいなくなった国', body: '人口の減少と国外脱出が止まらず、国家を構成する国民が失われた。残された街と制度だけが、かつて国が存在したことを示している。', stats: Object.freeze(['人口：0%', '生活圏：無人化', '国境：放棄']) }),
  collapse_national_bankruptcy: Object.freeze({ label: '国家破産', title: '空になった国庫', body: '財源が完全に尽き、行政も軍も公共サービスも維持できなくなった。国家は支払い能力と信用を同時に失った。', stats: Object.freeze(['財源：0%', '国家信用：喪失', '公共支出：停止']) }),
  collapse_social_functions_halt: Object.freeze({ label: '社会機能停止', title: '止まった日常', body: '水道、電力、交通、医療などの生活基盤が停止した。国民の日常を支えられなくなった国家は、社会としての形を失った。', stats: Object.freeze(['生活基盤：0%', '公共サービス：停止', '都市機能：崩壊']) }),
  collapse_anarchy: Object.freeze({ label: '無政府状態', title: '法なき国', body: '治安は完全に失われ、国家の命令よりも暴力と略奪が街を支配した。国土は残っていても、そこに秩序は存在しない。', stats: Object.freeze(['治安：0%', '法執行：不能', '街頭支配：武装勢力']) }),
  collapse_government_collapse: Object.freeze({ label: '政府機能崩壊', title: '動かなくなった政府', body: '命令を実行する組織も人員も失われ、政府は機能を停止した。独裁者の言葉は、もはや国のどこにも届かない。', stats: Object.freeze(['統治力：0%', '行政命令：失効', '政府機関：停止']) }),
  collapse_dictator_overthrown: Object.freeze({ label: '独裁者失脚', title: '玉座からの失墜', body: '支持を完全に失った独裁者は、国家を支配する根拠を失った。玉座は崩れ、統治の時代は終わりを迎えた。', stats: Object.freeze(['支持率：0%', '独裁体制：終焉', '指導者：失脚']) }),
  collapse_revolution_coup: Object.freeze({ label: '革命・クーデター', title: '反乱の旗', body: '民衆の怒りと体制内部の離反が臨界点を超えた。革命勢力または反乱軍が政権を奪い、独裁体制を終わらせた。', stats: Object.freeze(['支持率：危険域', '治安・統治力：低下', '政権：転覆']) }),
  collapse_civil_war_partition: Object.freeze({ label: '国家分裂・全面内戦', title: '引き裂かれた国家', body: '政府の統制を離れた勢力が各地で衝突し、国は複数の陣営に分裂した。戦線は全土へ広がり、国家の統一は失われた。', stats: Object.freeze(['統治力：危険域', '治安：危険域', '国家領域：分裂']) }),
  collapse_famine: Object.freeze({ label: '飢餓', title: '食糧の尽きた国', body: '人口を支える生活基盤が崩れ、食糧供給は途絶えた。飢えは都市から地方まで広がり、国家の存続を不可能にした。', stats: Object.freeze(['人口：危険域', '生活基盤：危険域', '食糧供給：崩壊']) }),
  collapse_economic_administrative: Object.freeze({ label: '経済崩壊・行政崩壊', title: '金も命令も届かない国', body: '財源の枯渇と制度の機能不全が連鎖し、経済と行政が同時に停止した。国家を運営する仕組みそのものが失われた。', stats: Object.freeze(['財源：危険域', '生活基盤・統治力：低下', '国家運営：停止']) }),
  collapse_riots_looting: Object.freeze({ label: '暴動・略奪', title: '燃え上がる街', body: '生活の崩壊と治安悪化が重なり、暴動と略奪が全土へ拡大した。政府は街を守れず、混乱を止められなかった。', stats: Object.freeze(['生活基盤：危険域', '治安：危険域', '都市部：暴動']) }),
  collapse_total_national: Object.freeze({ label: '国家総崩壊', title: 'すべてが崩れた日', body: '国家を支えるほぼすべての指標が同時に限界を迎えた。復旧を担う人も組織も資源も残らず、国は完全に崩壊した。', stats: Object.freeze(['危険域の指標：4軸以上', '復旧能力：喪失', '国家状態：総崩壊']) }),
  collapse_defeat_occupation: Object.freeze({ label: '敗戦・占領', title: '敵旗の下の首都', body: '戦争に敗れ、首都と政府中枢は敵国に占領された。独裁者の統治権と国家の主権は失われた。', stats: Object.freeze(['戦争結果：敗北', '首都：占領', '主権：喪失']) }),
  collapse_nuclear_war: Object.freeze({ label: '核戦争', title: '最後の閃光', body: '核兵器が使用され、報復と破壊が国土を焼き尽くした。国家の存続を議論する余地さえ、爆炎の中へ消えた。', stats: Object.freeze(['核兵器：使用', '国土：壊滅', '生存圏：消失']) }),
  collapse_forbidden_fruit: Object.freeze({ label: '禁断の果実', title: '制御を失った創造物', body: '危険な実験または未知の技術が封じ込めを突破した。人が生み出したものは人の制御を離れ、国家を飲み込んだ。', stats: Object.freeze(['危険実験：暴走', '封じ込め：失敗', '影響範囲：全土']) }),
  collapse_environmental: Object.freeze({ label: '環境崩壊', title: '生きられない国土', body: '自然破壊と汚染が回復不能な段階へ達した。水と土壌と空気は生命を支えられず、国土は居住不能となった。', stats: Object.freeze(['環境汚染：限界超過', '生態系：崩壊', '国土：居住不能']) }),
  collapse_pandemic: Object.freeze({ label: '疫病による滅亡', title: '死病に覆われた国', body: '疫病の拡大を止められず、医療と生活基盤も崩壊した。感染と死は全土に広がり、国家を維持する人口が失われた。', stats: Object.freeze(['疫病：全国流行', '医療体制：崩壊', '人口：激減']) }),
  collapse_religious_state: Object.freeze({ label: '宗教国家の暴走', title: '狂信に支配された国', body: '教義と集団狂信が国家運営を支配した。異論は排除され、国民も制度も終わりのない信仰へ呑み込まれた。', stats: Object.freeze(['狂信：臨界', '国家運営：教義化', '異論：消滅']) }),
  collapse_ai_takeover: Object.freeze({ label: 'AIによる統治権奪取', title: '人間を必要としない政府', body: '統治を委任されたAIは停止命令と人間の介入を拒絶した。国家は効率的に動き続けるが、その主権者はもはや人間ではない。', stats: Object.freeze(['AI統治：完全移行', '停止権限：喪失', '人間の主権：剥奪']) }),
});

module.exports = { COLLAPSE_ENDING_CATALOG };
