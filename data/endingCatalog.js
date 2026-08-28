const ENDING_CATALOG = Object.freeze({
  greed: Object.freeze({
    label: '強欲',
    title: '果てなき強欲の国',
    body: 'すべてを手に入れたはずの独裁者。しかし国庫は空になり、国民は去り、残ったのは金メッキの玉座だけだった。',
    stats: Object.freeze(['国庫残高：0', '国民の信頼：測定不能', '独裁者の満足度：まだ足りない']),
  }),
  emptiness: Object.freeze({
    label: '空虚',
    title: '何もかもが空っぽの国',
    body: '望んだものはすべて叶った。なのに独裁者の心は満たされない。国民は笑顔を見せるが、それも法律で義務化されたものだった。',
    stats: Object.freeze(['達成した欲望：全部', '幸福度：該当なし', '意味：見つかりませんでした']),
  }),
  ruin: Object.freeze({
    label: '破滅',
    title: '崩壊した楽園',
    body: '独裁者の欲望は国の限界を超えた。インフラは崩壊し、経済は破綻し、最後の閣僚は辞表をFAXで送ってきた。FAXも壊れていた。',
    stats: Object.freeze(['GDP：マイナス', '閣僚数：0', 'FAX：故障中']),
  }),
  collapse_oppression: Object.freeze({
    label: '圧政崩壊',
    title: '王冠を砕いた群衆',
    body: '命令で押さえつけられた国民は、ついに沈黙を破った。軍と官僚も離反し、宮殿を囲む声の中で国家は崩壊した。',
    stats: Object.freeze(['統制：限界突破', '反乱地域：全国', '最後の命令：未達']),
  }),
  collapse_privatization: Object.freeze({
    label: '私物化破綻',
    title: '売り払われた国家',
    body: '国庫も土地も制度も、独裁者の欲望を満たすために使い尽くされた。最後に残った国家そのものにも値札が付き、買い手のないまま消滅した。',
    stats: Object.freeze(['国庫：空', '公共資産：売却済み', '国家の所有者：不明']),
  }),
  collapse_runaway_reform: Object.freeze({
    label: '改革暴走',
    title: '明日だけを作り続けた国',
    body: '昨日の制度を壊し、今日の制度も完成前に捨てた。変革は目的を失って加速し、誰にも運用できない国家だけが残った。',
    stats: Object.freeze(['制度改定：毎日', '施行済み法令：0', '現在地：未来']),
  }),
  collapse_prestige_war: Object.freeze({
    label: '威信戦争',
    title: '拍手のための最終戦争',
    body: '国威を守るための小さな衝突は、撤退できない総力戦へ変わった。勝利を宣言する放送だけが、誰もいない首都に流れ続けた。',
    stats: Object.freeze(['勝利宣言：継続中', '交戦国：多数', '帰還兵：記録なし']),
  }),
  collapse_fanaticism: Object.freeze({
    label: '狂信的破滅',
    title: '正しすぎた最後の夜',
    body: '疑問は裏切りとされ、妄信だけが国民の資格になった。最後の儀式が終わると、国には信者も異端者も残らなかった。',
    stats: Object.freeze(['信仰率：100%', '疑問：禁止', '生存者：未確認']),
  }),
  collapse_bloody_revolution: Object.freeze({
    label: '血塗られた革命',
    title: '処刑台から始まった革命',
    body: '恐怖政治は敵を消すほど、新しい敵を生んだ。粛清された者の名を掲げた反乱軍が首都へ雪崩れ込み、内戦は国境まで焼き尽くした。',
    stats: Object.freeze(['粛清名簿：無限', '反乱軍：全国', '首都：陥落']),
  }),
  collapse_golden_palace: Object.freeze({
    label: '黄金宮殿の終焉',
    title: '黄金だけが残った宮殿',
    body: '威光を示す宮殿は完成したが、その外に国民はいなかった。最後の祝宴の日、空の国庫と空の客席が独裁者を迎えた。',
    stats: Object.freeze(['宮殿純度：24金', '国庫残高：0', '招待客：0']),
  }),
  collapse_forbidden_creation: Object.freeze({
    label: '禁断の創世',
    title: '世界を作り直した日',
    body: '国家を理想通りに作り替える計画は、現実そのものを材料にし始めた。実験は成功したと記録されたが、その記録を読む世界は残らなかった。',
    stats: Object.freeze(['計画進捗：100%', '安全装置：解除', '旧世界：削除済み']),
  }),
  collapse_quiet: Object.freeze({
    label: '静かな滅亡',
    title: '最後の消灯',
    body: '戦争も革命も起きなかった。ただ人が減り、制度が止まり、誰も国の続きを望まなくなった。最後の役所の灯りが消えた日を、記録する者はいなかった。',
    stats: Object.freeze(['最終人口：1', '廃止届：未提出', '最後の消灯：静か']),
  }),
  collapse_void: Object.freeze({
    label: '欲望の空白',
    title: '誰も望まなかった国',
    body: '命令は出たが、どこへ向かうためのものか誰にも分からなかった。国民も役人も独裁者さえも国家を信じなくなり、国名だけが地図から薄れていった。',
    stats: Object.freeze(['国家目標：空欄', '命令の効力：なし', '国名：削除']),
  }),
  ironic_peace: Object.freeze({
    label: '皮肉な平和',
    title: '皮肉な平和',
    body: '表面上は平和だが、誰もが本音を隠して暮らしている。独裁者だけが「うまくいっている」と信じている。',
    stats: Object.freeze(['表面上の秩序：完璧', '本音：非公開', '独裁者の認識：ずれている']),
  }),
  chaos: Object.freeze({
    label: '混沌',
    title: '愉快なる混沌',
    body: '法律は矛盾だらけ、役所は機能不全、しかし国民はなぜか楽しそうだ。独裁者が何を言っても誰も真面目に聞いていないからだ。',
    stats: Object.freeze(['法律の数：999', '矛盾する法律：998', '国民のストレス：意外と低い']),
  }),
});

module.exports = { ENDING_CATALOG };
