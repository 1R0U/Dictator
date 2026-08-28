// 差し替える場合は assets/se/ 内の同名ファイルを上書きするだけでよい（このファイルの編集は不要）。
const SOUND_EFFECTS = Object.freeze({
  // 統治を始める／節目を「◯◯へ進む」／記録庫を開く、で共通して使う「進行」SE。
  advance: require('../assets/se/start-reign.mp3'),
  // 宣言を送信したとき。
  declare: require('../assets/se/declare.mp3'),
  // 欲望の招待（検診イベント）が画面に現れたとき。
  invite: require('../assets/se/invite.mp3'),
  // ホームへ戻るとき（宣言画面／記録一覧／結末画面）。
  returnHome: require('../assets/se/return-home.mp3'),
  // 国家崩壊の光景を表示したとき（3つ同時に重ねて再生）。
  collapse1: require('../assets/se/collapse-1.mp3'),
  collapse2: require('../assets/se/collapse-2.mp3'),
  collapse3: require('../assets/se/collapse-3.mp3'),
  // 崩壊以外の結末（ハッピーエンド扱い）を表示したとき。
  happyEnd: require('../assets/se/happy-end.mp3'),
});

module.exports = { SOUND_EFFECTS };
