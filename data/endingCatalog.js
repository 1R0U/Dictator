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
