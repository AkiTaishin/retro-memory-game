/**
 * メンター用コメント付きソース（受講者には配布しない）
 * 対応ファイル: src/main.js
 *
 * エントリポイント。アプリ起動時に最初に実行される。
 * 受講者への初日の問いかけ例:「index.html からどのファイルが最初に動く？」
 */

import { createScreenController } from './ui/events.js';

// index.html の <div id="app"> を取得。以降の画面はすべてここに描画される
const root = document.getElementById('app');

// 画面遷移・イベント処理を担うコントローラを生成
const controller = createScreenController(root);

// 初回表示はタイトル画面
controller.showStart();

// ブラウザタブを閉じる直前にタイマーを止める（メモリリーク・警告防止）
window.addEventListener('beforeunload', () => {
  controller.cleanup();
});
