# JavaScript 定数・変数リファレンス

`src/` 配下の JavaScript に登場する **定数** と **変数** の意味・型・値の変化・使われるタイミングをまとめた資料です。  
`FUNCTIONS_GUIDE.md` と併用してソースコードの読解補助に利用してください。

---

## 目次

| セクション | 内容 |
|------------|------|
| [定数と変数の見分け方](#定数と変数の見分け方) | この資料での分類ルール |
| [`src/` フォルダ概要](#src-フォルダ概要) | ファイルごとの定数・変数の所在 |
| [`src/main.js`](#srcmainjs) | 起動時の変数 |
| [`src/data/` フォルダ概要](#srcdata-フォルダ概要) | 静的データの定数 |
| [`src/game/` フォルダ概要](#srcgame-フォルダ概要) | 状態オブジェクト・タイマー変数 |
| [`src/ui/` フォルダ概要](#srcui-フォルダ概要) | 画面制御の変数・定数 |
| [`src/storage/` フォルダ概要](#srcstorage-フォルダ概要) | 永続化の定数 |
| [状態オブジェクトのライフサイクル](#状態オブジェクトのライフサイクル) | `state` の値が変わるタイミング |
| [モジュールスコープ変数の一覧](#モジュールスコープ変数の一覧) | ファイルをまたぐ共有状態 |

---

## 定数と変数の見分け方

| 種類 | コード上の特徴 | この資料での扱い |
|------|----------------|------------------|
| **定数** | `const` で宣言し、再代入しない値 | モジュール定数・設定値・export されるデータ定義 |
| **変数** | `let` で宣言、またはオブジェクトのプロパティとして更新される値 | モジュール変数・クロージャ変数・`state` 内プロパティ・関数内の一時変数 |

> **読解ポイント:** `const state = ...` のように `const` でも、オブジェクトの**中身**（プロパティ）は後から変更できる。`state.moves += 1` は変数の更新であり、定数の破壊ではない。

---

## `src/` フォルダ概要

| パス | 定数 | 変数（主なもの） |
|------|------|------------------|
| `main.js` | — | `root`, `controller` |
| `data/cards.js` | `ROSTER`, `DIFFICULTY` | — |
| `game/engine.js` | — | `state` オブジェクト一式、カードオブジェクトのプロパティ |
| `game/timer.js` | — | `intervalId`, `startedAt`, `elapsedMs`（モジュールスコープ） |
| `ui/events.js` | `FLIP_DELAY_MS` | `playerName`, `difficultyKey`, `state`, `hudTimerId` |
| `ui/render.js` | — | 描画用の一時変数・`context` の各フィールド |
| `storage/scores.js` | `STORAGE_KEY` | 関数内の読み込み・保存用一時変数 |

```
定数（設定・データ定義）     data/cards.js, ui/events.js, storage/scores.js
変数（動きながら変わる状態） game/timer.js, ui/events.js, game/engine.js の state
```

---

## `src/main.js`

エントリポイント。定数はなく、起動時に2つの変数だけを束縛する。

| 名前 | 種類 | 初期値 | 意味 | 変化するタイミング |
|------|------|--------|------|-------------------|
| `root` | `const`（実質固定） | `#app` 要素 | 画面全体の描画先 DOM | 再代入しない |
| `controller` | `const`（実質固定） | `createScreenController(root)` の戻り値 | 画面制御オブジェクト | 再代入しない |

**使うタイミング:**
- `root` — `createScreenController` に渡し、以降すべての画面描画の親要素として使われる
- `controller` — 起動直後に `showStart()`、ページ離脱時に `cleanup()` を呼ぶ

---

## `src/data/` フォルダ概要

ゲームの「固定データ」を **export 定数** として定義する層。実行中に値が変わる変数は持たない。

| ファイル | 定数 | 変数 |
|----------|------|------|
| `cards.js` | `ROSTER`, `DIFFICULTY` | なし |

---

## `src/data/cards.js`

### `ROSTER`（export 定数）

| 項目 | 内容 |
|------|------|
| **型** | 配列（8要素） |
| **各要素** | `{ id, name, image }` を持つキャラクターオブジェクト |
| **意味** | ゲームで使える全キャラクターのマスターデータ |
| **変化** | 実行中は変更されない |

**使うタイミング:**
- `getRosterSlice()` 経由で `buildDeck()` がデッキ用キャラを選ぶとき
- 難易度の `pairCount` に応じて先頭から切り出される

### `DIFFICULTY`（export 定数）

| 項目 | 内容 |
|------|------|
| **型** | オブジェクト（キー: `easy`, `normal`） |
| **各難易度のプロパティ** | `label`, `rows`, `cols`, `pairCount` |
| **意味** | 盤面サイズとペア数の定義 |

| キー | `label` | `rows` | `cols` | `pairCount` | カード枚数 |
|------|---------|--------|--------|-------------|------------|
| `easy` | `EASY` | 3 | 4 | 6 | 12枚 |
| `normal` | `NORMAL` | 4 | 4 | 8 | 16枚 |

**使うタイミング:**
- タイトル画面の難易度選択（`render.js`, `events.js`）
- ゲーム開始時に `createInitialState(DIFFICULTY[difficultyKey])`
- クリア判定（`matched.size === difficulty.pairCount`）

---

## `src/game/` フォルダ概要

ゲームの **動的な状態** と **時間** を変数で管理する層。

| ファイル | 定数 | 変数（主なもの） |
|----------|------|------------------|
| `engine.js` | — | `state` オブジェクト、`deck` 内のカードプロパティ |
| `timer.js` | — | `intervalId`, `startedAt`, `elapsedMs` |

```
ui/events.js の state 変数
  └─ engine.js が返す state オブジェクト（deck / flipped / matched など）
  └─ timer.js の elapsedMs（プレイ時間）
```

---

## `src/game/engine.js`

### ゲーム状態オブジェクト（`state`）のプロパティ

`createInitialState()` が作り、以降 `flipCard` / `resolveFlip` が新しいオブジェクトとして返す。**変数**として扱われる動的な値。

| プロパティ | 型 | 初期値 | 意味 | 主な変化タイミング |
|------------|-----|--------|------|-------------------|
| `deck` | 配列 | シャッフル済みカード | 盤面上の全カード | カードの `faceUp` が `flipCard` / `resolveFlip` で変わる |
| `flipped` | 配列 | `[]` | 今表向きのカード UID（最大2件） | カードクリックで追加、結果処理後に空に |
| `matched` | `Set` | 空 | マッチ済みペアの `pairId` | ペア一致時に `add` |
| `moves` | 数値 | `0` | 2枚めくりの回数（手数） | 2枚目をめくったとき `+1` |
| `locked` | 真偽値 | `false` | 入力ロック中か | 2枚めくりで `true`、結果処理後に `false` |
| `finished` | 真偽値 | `false` | 全ペア揃いでクリア済みか | 最後のペア一致で `true` |
| `difficulty` | オブジェクト | 選択難易度 | `pairCount`, `rows`, `cols` など | ゲーム中は通常変化しない |

**保持場所:** `ui/events.js` のクロージャ変数 `state` に代入され、プレイ中ずっと参照される。

---

### カードオブジェクト（`state.deck` の各要素）のプロパティ

`createCard()` が生成。1枚ごとの **変数**（特に `faceUp` が頻繁に変わる）。

| プロパティ | 型 | 初期値 | 意味 | 主な変化タイミング |
|------------|-----|--------|------|-------------------|
| `uid` | 文字列 | 例: `wizard-a` | カード固有 ID | 変化しない |
| `pairId` | 文字列 | 例: `wizard` | ペア判定用 ID | 変化しない |
| `pairIndex` | 数値 | ロスター内 index | どのキャラか | 変化しない |
| `name` | 文字列 | 例: `WIZARD` | 表示名 | 変化しない |
| `image` | 文字列 | 画像パス | スプライト URL | 変化しない |
| `faceUp` | 真偽値 | `false` | 表向きか | めくりで `true`、不一致時に `false` に戻る |

---

### 関数内の主な一時変数

| 名前 | 関数 | 意味 |
|------|------|------|
| `deck` | `createInitialState` | `buildDeck` の戻り値を一時保持 |
| `roster` | `buildDeck` | 今回使うキャラ配列 |
| `pairs` | `buildDeck` | ペア2枚ずつ並べた配列（シャッフル前） |
| `copy` | `shuffle` | 元配列を壊さないためのコピー |
| `i`, `j` | `shuffle` | シャッフル用ループインデックス |
| `card` | `canFlip`, `flipCard` | `deck` から `find` した1枚 |
| `next` | `flipCard`, `resolveFlip` | `cloneState` 後の新しい `state` |
| `firstUid`, `secondUid` | `resolveFlip` | めくった2枚の UID |
| `first`, `second` | `resolveFlip` | めくった2枚のカードオブジェクト |

---

## `src/game/timer.js`

### モジュールスコープ変数（ファイル全体で1セット）

ゲームは同時に1つだけ動く想定で、タイマー状態をモジュール先頭の `let` で保持する。

| 名前 | 型 | 初期値 | 意味 | 主な変化タイミング |
|------|-----|--------|------|-------------------|
| `intervalId` | `number \| null` | `null` | `setInterval` の ID | `startTimer` でセット、`stopTimer` で `null` |
| `startedAt` | `number \| null` | `null` | 計測開始時刻（`Date.now()`） | `startTimer` で現在時刻、`resetTimer` で `null` |
| `elapsedMs` | 数値 | `0` | 経過ミリ秒 | 計測中は 250ms ごとに更新、リセットで `0` |

**使うタイミング:**
- `startTimer()` — ゲーム開始時（`beginGame`）
- `stopTimer()` / `resetTimer()` — タイトル戻り・再開前・クリア時
- `getElapsedMs()` — HUD 表示・記録保存で参照

---

### `formatElapsed(ms)` 内の一時変数

| 名前 | 意味 |
|------|------|
| `ms` | 引数。変換元のミリ秒 |
| `totalSeconds` | ミリ秒を秒に変換した値 |
| `minutes` | 分の部分 |
| `seconds` | 秒の部分（0〜59） |

---

## `src/ui/` フォルダ概要

画面制御の **設定定数** と、プレイヤー入力・ゲーム状態を保持する **クロージャ変数** を持つ層。

| ファイル | 定数 | 変数（主なもの） |
|----------|------|------------------|
| `events.js` | `FLIP_DELAY_MS` | `playerName`, `difficultyKey`, `state`, `hudTimerId` |
| `render.js` | — | `context` 関連、DOM 参照、描画用一時変数 |

---

## `src/ui/events.js`

### `FLIP_DELAY_MS`（モジュール定数）

| 項目 | 内容 |
|------|------|
| **値** | `700` |
| **単位** | ミリ秒 |
| **意味** | 2枚めくったあと、結果判定（`resolveFlip`）まで待つ時間 |
| **変化** | しない |

**使うタイミング:**
- `handleCardClick` 内の `setTimeout(..., FLIP_DELAY_MS)`

---

### `createScreenController(root)` 内のクロージャ変数

コントローラ生成時に作られ、ゲームセッションをまたいで保持される **変数**。

| 名前 | 型 | 初期値 | 意味 | 主な変化タイミング |
|------|-----|--------|------|-------------------|
| `playerName` | 文字列 | `'HERO'` | プレイヤー名 | START クリック時に入力値で更新 |
| `difficultyKey` | 文字列 | `'easy'` | 難易度キー（`easy` / `normal`） | START クリック時にラジオボタンで更新 |
| `state` | オブジェクト \| `null` | `null` | 現在のゲーム状態 | `beginGame` で初期化、クリックで更新、タイトルで `null` |
| `hudTimerId` | `number \| null` | `null` | HUD 更新用 `setInterval` の ID | `beginGame` でセット、`cleanupGameTimers` で `null` |

**使うタイミング:**
- `playerName` — HUD・結果画面・記録保存・タイトル入力の初期値
- `difficultyKey` — `DIFFICULTY[difficultyKey]`、記録の難易度区分
- `state` — カード操作のたびに `flipCard` / `resolveFlip` の戻り値で置き換え
- `hudTimerId` — 250ms ごとの `updateHud` 用

---

### 関数内の主な一時変数

| 名前 | 関数 | 意味 |
|------|------|------|
| `difficulty` | `beginGame` | `DIFFICULTY[difficultyKey]` のオブジェクト |
| `nameInput` | `bindStartScreen` | `#player-name` 入力要素 |
| `trimmed` | `bindStartScreen` | 入力名の trim 結果 |
| `selected` | `bindStartScreen` | 選択中の難易度ラジオ |
| `target` | `bindGameScreen` | クリックされたカード要素 |
| `cardUid` | `handleCardClick` | めくるカードの UID |
| `result` | `handleCardClick` | `resolveFlip` の戻り値 `{ state, matched }` |
| `elapsedMs` | `finishGame` | クリア時のプレイ時間 |
| `progress` | `finishGame` | `getProgress(state)` の結果 |
| `saved` | `finishGame`, `buildViewContext` | 記録保存の成否 |

---

## `src/ui/render.js`

定数はなく、引数・分割代入・関数内で使う **一時変数** が中心。

### `renderGameScreen(root, context)` の変数

| 名前 | 由来 | 意味 |
|------|------|------|
| `state` | `context.state` | ゲーム状態（盤面・難易度など） |
| `playerName` | `context.playerName` | 表示用ヒーロー名 |
| `elapsedMs` | `context.elapsedMs` | 表示用経過時間 |
| `moves` | `context.progress.moves` | HUD の手数 |
| `matched` | `context.progress.matched` | 見つけたペア数 |
| `total` | `context.progress.total` | 総ペア数 |
| `classes` | `map` 内で生成 | カードボタンの CSS クラス配列 |
| `card` | `state.deck.map` の要素 | ループ中の1枚 |

---

### `updateHud(progress, elapsedMs)` の変数

| 名前 | 意味 |
|------|------|
| `timerDisplay` | `#timer-display` 要素 |
| `movesDisplay` | `#moves-display` 要素 |
| `foundDisplay` | `#found-display` 要素 |

**使うタイミング:** 250ms ごとの HUD 更新、カードクリック直後

---

### `renderResultOverlay(context)` の変数

| 名前 | 由来 | 意味 |
|------|------|------|
| `playerName` | `context` | 結果画面のヒーロー名 |
| `progress` | `context` | 手数など |
| `elapsedMs` | `context` | クリアタイム |
| `bestRecord` | `context` | ベスト記録オブジェクト |
| `saved` | `context` | 記録更新の成否 |
| `bestLine` | 計算結果 | ベスト記録表示用の1行テキスト |

---

### `renderRecordsPanel()` の変数

| 名前 | 意味 |
|------|------|
| `key` | `Object.entries(DIFFICULTY)` の難易度キー |
| `value` | 難易度オブジェクト（`label` など） |
| `records` | `getTopRecords(key, 3)` の結果 |
| `lines` | ランキング HTML の行 |
| `record` | 1件の記録 |
| `index` | ランキング順位（0始まり） |

---

### `escapeHtml(value)` の変数

| 名前 | 意味 |
|------|------|
| `value` | エスケープ対象の文字列（主にプレイヤー名） |

---

## `src/storage/` フォルダ概要

`localStorage` のキーを **定数** で固定し、読み書き時に **一時変数** でデータを組み立てる層。

| ファイル | 定数 | 変数 |
|----------|------|------|
| `scores.js` | `STORAGE_KEY` | `raw`, `parsed`, `records`, `bucket`, `next` など |

---

## `src/storage/scores.js`

### `STORAGE_KEY`（モジュール定数）

| 項目 | 内容 |
|------|------|
| **値** | `'crystal-memory-records'` |
| **意味** | `localStorage` に保存するときのキー名 |
| **変化** | しない |

---

### 記録オブジェクトのプロパティ（保存されるデータ）

`saveRecord` が `localStorage` に保存する1件分の形。

| プロパティ | 型 | 意味 |
|------------|-----|------|
| `playerName` | 文字列 | プレイヤー名 |
| `moves` | 数値 | 手数 |
| `elapsedMs` | 数値 | クリアまでのミリ秒 |
| `savedAt` | 文字列 | 保存日時（ISO 8601） |

**保存件数:** 難易度ごとに上位 **5件**（`slice(0, 5)`）。タイトル画面の表示は **3件**（`getTopRecords(key, 3)`）。

---

### 関数内の主な一時変数

| 名前 | 関数 | 意味 |
|------|------|------|
| `raw` | `loadRecords` | `localStorage` から取った生文字列 |
| `parsed` | `loadRecords` | `JSON.parse` 後のオブジェクト |
| `records` | `saveRecord`, `getBestRecord`, `getTopRecords` | 全難易度の記録マップ |
| `bucket` | `saveRecord`, `getBestRecord`, `getTopRecords` | 1難易度分の記録配列 |
| `next` | `saveRecord` | 新規追加・ソート・上位5件に絞った配列 |
| `limit` | `getTopRecords` | 取得件数（デフォルト `5`） |

---

## 状態オブジェクトのライフサイクル

`ui/events.js` の `state` と `game/engine.js` の状態が、プレイ中にどう変わるかのまとめ。

```
[タイトル画面]
  state = null

[START QUEST]
  state = createInitialState()   … 初期値（moves=0, locked=false など）

[カード1枚目クリック]
  state = flipCard()             … flipped に1件, faceUp=true

[カード2枚目クリック]
  state = flipCard()             … moves+1, locked=true

[700ms 後・一致]
  state = resolveFlip().state    … matched に追加, locked=false
  （全ペア揃いなら finished=true）

[700ms 後・不一致]
  state = resolveFlip().state    … 2枚を裏返し, locked=false

[クリア]
  state.finished === true        … finishGame で記録保存・結果表示

[タイトルに戻る]
  state = null
```

---

## モジュールスコープ変数の一覧

アプリ全体で「どこに状態が溜まっているか」を一望する表。

| ファイル | 名前 | スコープ | 寿命 | 役割 |
|----------|------|----------|------|------|
| `game/timer.js` | `intervalId` | モジュール | ページを開いている間 | ゲーム時間の interval |
| `game/timer.js` | `startedAt` | モジュール | 同上 | 計測開始時刻 |
| `game/timer.js` | `elapsedMs` | モジュール | 同上 | 経過ミリ秒の保持 |
| `ui/events.js` | `playerName` | クロージャ | コントローラ存続中 | プレイヤー名 |
| `ui/events.js` | `difficultyKey` | クロージャ | 同上 | 選択難易度 |
| `ui/events.js` | `state` | クロージャ | 同上 | ゲーム状態 |
| `ui/events.js` | `hudTimerId` | クロージャ | 同上 | HUD 更新 interval |

> **読解ポイント:** `game/timer.js` の3変数は **ファイルを import した全コードで共有** される。`ui/events.js` の4変数は **1つの `createScreenController` 呼び出しごとに独立** する。

---

## 定数一覧（クイックリファレンス）

| 名前 | ファイル | 値・概要 |
|------|----------|----------|
| `ROSTER` | `data/cards.js` | 8体のキャラクター配列 |
| `DIFFICULTY` | `data/cards.js` | `easy` / `normal` の盤面・ペア数定義 |
| `FLIP_DELAY_MS` | `ui/events.js` | `700`（めくり結果までの待機 ms） |
| `STORAGE_KEY` | `storage/scores.js` | `'crystal-memory-records'` |

---

## 数値リテラル・暗黙の定数

コードに直書きされているが、挙動理解に重要な数値。

| 値 | 場所 | 意味 |
|----|------|------|
| `250` | `timer.js`, `events.js` | タイマー・HUD の更新間隔（ms） |
| `700` | `events.js`（`FLIP_DELAY_MS`） | 2枚めくり後の待機時間（ms） |
| `5` | `scores.js` | 難易度ごとの保存記録上限 |
| `3` | `render.js` | タイトル画面ランキング表示件数 |
| `12` | `cards.js`（input） | プレイヤー名の最大文字数 |
| `'HERO'` | `events.js` | デフォルトプレイヤー名 |
| `'easy'` | `events.js`, `render.js` | デフォルト難易度 |

---

*本資料は `src/` のソースを読解するための補助資料です。関数の動きは `FUNCTIONS_GUIDE.md`、実装の詳細は各 `.js` ファイルを参照してください。*
