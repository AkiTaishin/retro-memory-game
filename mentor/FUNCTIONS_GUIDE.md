# JavaScript 関数リファレンス

`src/` 配下の JavaScript ファイルに定義されている関数・定数の内容と、使われるタイミングをまとめた資料です。  
ソースコードの読解補助用として利用してください。

---

## 処理の全体フロー

```
main.js
  └─ createScreenController(root)  … 画面制御の準備
       └─ showStart()               … タイトル画面表示
            └─ [START QUEST] クリック
                 └─ beginGame()     … ゲーム開始
                      ├─ createInitialState()
                      ├─ renderGameScreen()
                      ├─ startTimer()
                      └─ [カードクリック]
                           └─ handleCardClick()
                                ├─ canFlip() → flipCard() → paintBoard()
                                └─ 2枚めくり後 700ms → resolveFlip()
                                     └─ finished なら finishGame()
```

------------------------------------------------------------------

## `src/` フォルダ概要

アプリケーションのソースコード一式。`index.html` から `main.js` が読み込まれ、各フォルダが役割ごとに分割されている。

| パス | 役割 |
|------|------|
| `main.js` | エントリポイント。起動処理のみ（関数定義なし） |
| `data/` | キャラクター・難易度などの静的データ定義 |
| `game/` | ゲームルール・状態管理・プレイ時間の計測 |
| `ui/` | DOM の生成とユーザー操作・画面遷移の制御 |
| `storage/` | `localStorage` によるスコア記録の永続化 |

```
index.html
  └─ main.js
       └─ ui/events.js          … 画面制御の中心
            ├─ ui/render.js     … 見た目の生成
            ├─ game/engine.js   … ルール・状態
            ├─ game/timer.js    … 時間計測
            ├─ data/cards.js    … 難易度・キャラデータ
            └─ storage/scores.js … 記録の読み書き
```

**読む順番の目安:** `main.js` → `ui/events.js` → `game/engine.js` → `ui/render.js` → 残り

---

## `src/main.js` の層概要

`src/` 直下に置かれた **エントリポイント（起動の入口）** の層。サブフォルダではなくファイル1つだけが担う「アプリの電源ボタン」に相当する。

| 項目 | 内容 |
|------|------|
| **この層の役割** | ブラウザ起動時に最初に動き、描画先の確保・画面コントローラの生成・初回表示・終了時の後片付けだけを行う |
| **関数定義** | なし（import と数行の実行コードのみ） |
| **依存先** | `ui/events.js` の `createScreenController` だけ |
| **依存元** | `index.html` から `<script type="module" src="/src/main.js">` で読み込まれる |

### この層がやること / やらないこと

| やること | やらないこと |
|----------|--------------|
| `#app` 要素を取得して描画の土台にする | ゲームルールの処理（`game/engine.js` の仕事） |
| 画面コントローラを1つ作る | HTML の生成（`ui/render.js` の仕事） |
| タイトル画面を最初に表示する | クリックイベントの詳細処理（`ui/events.js` の仕事） |
| ページ離脱時にタイマーを止める | スコアの保存（`storage/scores.js` の仕事） |

**設計意図:** 起動と終了の手続きだけをここに集約し、ゲーム本体のロジックはすべて下位のフォルダに任せる。読解の起点として「最初にどこが動くか」を追いやすくする。

### 起動時の処理の流れ

```
index.html 読み込み
  └─ <script src="/src/main.js"> が実行される
       1. createScreenController を import
       2. document.getElementById('app') で root を取得
       3. createScreenController(root) で controller を生成
       4. controller.showStart() でタイトル画面表示
       5. beforeunload リスナーを登録（終了時の cleanup 用）
```

```
index.html
  └─ main.js                    … 起動・終了の手続きのみ
       └─ ui/events.js
            └─ showStart()      … 以降は events.js が主導
```

### コードごとの処理とタイミング

| コード | 内容 | タイミング |
|--------|------|------------|
| `import { createScreenController } from './ui/events.js'` | 画面制御モジュールを読み込む | モジュール評価時（ページ読み込み直後） |
| `const root = document.getElementById('app')` | `index.html` の `<div id="app">` を描画先として取得 | 同上 |
| `const controller = createScreenController(root)` | 画面遷移・イベント処理のコントローラを生成 | 同上（`root` を渡して以降の描画先を固定） |
| `controller.showStart()` | タイトル画面を表示 | 同上（ユーザーが最初に見る画面） |
| `window.addEventListener('beforeunload', ...)` | タブ閉じ・ページ離脱の直前に `controller.cleanup()` を呼ぶ | リスナー登録は起動時、**実行は離脱時** |

### `controller` が持つ操作（main.js から呼ばれるもの）

`createScreenController()` の戻り値。main.js が直接使うのは次の2つだけ。

| メソッド | 呼び出しタイミング | 内容 |
|----------|-------------------|------|
| `showStart()` | 起動直後（1回） | タイトル画面を表示。以降の START / TITLE ボタンからも `events.js` 内部で呼ばれる |
| `cleanup()` | `beforeunload` 時 | ゲームタイマーと HUD 更新用 interval を停止 |

### 他フォルダとの位置づけ

```
[ 起動層 ]     main.js          … 「動かし始める」「片付ける」
[ 制御層 ]     ui/events.js     … 画面遷移・操作の司令塔
[ 表示層 ]     ui/render.js     … 見た目の生成
[ ロジック層 ] game/            … ルール・時間
[ データ層 ]   data/            … キャラ・難易度の定義
[ 永続化層 ]   storage/         … 記録の保存
```

`main.js` は最上流にあり、**下位のフォルダを import しない**（`events.js` 経由で間接的にすべてが動く）。コード量は最小だが、アプリ全体の読み始めの起点になるファイル。

---

## `src/main.js`（コードの詳細）

上記の層概要に対応する、ファイル内の具体的な処理の補足。

| 処理 | タイミング |
|------|------------|
| `createScreenController(root)` の呼び出し | ページ読み込み直後。`root` に今後の画面をすべて描画する |
| `controller.showStart()` | 起動直後。タイトル画面が最初に表示される |
| `controller.cleanup()`（`beforeunload` 経由） | ブラウザタブを閉じる・別ページへ移る直前。動いているタイマーを止める |

---



【 `src/data/` フォルダ概要】

ゲームで使う「データ」の定義だけを置く層。ロジックや DOM 操作は含まない。値を export して他モジュールから読み取られる。

| ファイル | 役割 |
|----------|------|
| `cards.js` | キャラクター一覧（`ROSTER`）・難易度設定（`DIFFICULTY`）・ロスター切り出し関数 |

```
src/game/engine.js
  └─ cards.js  … getRosterSlice() でデッキ用キャラを取得

src/ui/events.js
  └─ cards.js  … DIFFICULTY で難易度オブジェクトを参照

src/ui/render.js
  └─ cards.js  … DIFFICULTY で選択肢・ランキング見出しを生成
```

### `cards.js` 内の定義の関係

```
ROSTER              … 全8体のキャラクター配列（定数）
DIFFICULTY          … easy / normal の盤面サイズ・ペア数（定数）
getRosterSlice()    … ROSTER から必要数だけ切り出す（関数）
```

------------------------------------------------------------------

## `src/data/cards.js`

`src/data/` フォルダの唯一のファイル。キャラクター一覧と難易度設定を定義する。

### 定数

| 名前 | 内容 |
|------|------|
| `ROSTER` | 8体のキャラクター配列。各要素は `id`, `name`, `image` を持つ |
| `DIFFICULTY` | 難易度定義。`easy`（3×4・6ペア）と `normal`（4×4・8ペア） |

### `getRosterSlice(pairCount)`

**内容:** `ROSTER` の先頭から `pairCount` 件だけ切り出して返す。

**使うタイミング:**
- `buildDeck()` 内で、今回のゲームに使うキャラクターを選ぶとき
- 難易度ごとの `pairCount`（6 または 8）に応じてデッキの種類数を決める

------------------------------------------------------------------






【 `src/game/` フォルダ概要　】

ゲームの「中身」（ルール・状態・時間）を担当する層。UI（`src/ui/`）やデータ定義（`src/data/`）には依存するが、DOM には触らない。

| ファイル | 役割 |
|----------|------|
| `engine.js` | デッキ生成・カードめくり・ペア判定・クリア判定などゲームルール全体 |
| `timer.js` | プレイ時間の計測と `MM:SS` 表示用のフォーマット |

```
src/ui/events.js
  ├─ engine.js  … 状態を更新（canFlip → flipCard → resolveFlip）
  └─ timer.js   … 時間を計測（startTimer / getElapsedMs / formatElapsed）
```

### `engine.js` 内の関数の関係

```
createInitialState(difficulty)
  └─ buildDeck(pairCount)
       ├─ getRosterSlice()   … cards.js から import
       ├─ createCard()       … 内部関数（非 export）
       └─ shuffle()

flipCard(state, cardUid)
  ├─ cloneState()           … 内部関数（非 export）
  └─ canFlip()

resolveFlip(state)
  └─ cloneState()

getProgress(state)          … 表示用の集計（状態は変更しない）
```

---

## `src/game/engine.js`

### ゲーム状態オブジェクト（`state`）の構造

`createInitialState()` が返すオブジェクト。以降の関数はこの `state` を受け取り、新しい `state` を返す（イミュータブルな更新）。

| プロパティ | 型 | 初期値 | 意味 |
|------------|-----|--------|------|
| `deck` | 配列 | シャッフル済みカード | 盤面上の全カード |
| `flipped` | 配列 | `[]` | 今表向きのカード UID（最大2件） |
| `matched` | `Set` | 空 | マッチ済みペアの `pairId` 集合 |
| `moves` | 数値 | `0` | 2枚めくりの回数（手数） |
| `locked` | 真偽値 | `false` | `true` の間は新しいカードをめくれない |
| `finished` | 真偽値 | `false` | 全ペア揃いでクリア済み |
| `difficulty` | オブジェクト | 選択難易度 | `pairCount`, `rows`, `cols` など |

### カードオブジェクト（`deck` の各要素）の構造

`createCard()` が生成する1枚分のデータ。

| プロパティ | 例 | 意味 |
|------------|-----|------|
| `uid` | `wizard-a` | カード固有 ID（クリック時に渡される） |
| `pairId` | `wizard` | ペア判定用（同じ `pairId` なら一致） |
| `pairIndex` | `0` | ロスター内のインデックス |
| `name` | `WIZARD` | 表示名 |
| `image` | `/sprites/Wizard.png` | 画像パス |
| `faceUp` | `false` | 表向きかどうか |

### `createInitialState(difficulty)`

| 項目 | 内容 |
|------|------|
| **引数** | `difficulty` — `DIFFICULTY.easy` や `DIFFICULTY.normal` などの難易度オブジェクト |
| **戻り値** | 初期化済みの `state` オブジェクト |
| **export** | あり |

**処理の流れ:**
1. `buildDeck(difficulty.pairCount)` でシャッフル済みデッキを作る
2. `flipped`, `matched`, `moves`, `locked`, `finished` を初期値にセット
3. 渡された `difficulty` をそのまま保持

**使うタイミング:**
- `beginGame()` でゲームを新規開始するとき
- 「PLAY AGAIN」で同じ難易度で再プレイするとき

**状態の変化:** 前の `state` は破棄され、まっさらな `state` が作られる。

---

### `buildDeck(pairCount)`

| 項目 | 内容 |
|------|------|
| **引数** | `pairCount` — 使うペア数（easy=6, normal=8） |
| **戻り値** | シャッフル済みカード配列（`state.deck` にそのまま入る） |
| **export** | あり |

**処理の流れ:**
1. `getRosterSlice(pairCount)` で `ROSTER` 先頭からキャラを取得
2. `flatMap` で各キャラを2枚に複製（`createCard(character, index, 'a')` と `'b'`）
3. `shuffle(pairs)` でランダムに並べ替えて返す

**使うタイミング:**
- `createInitialState()` 内部のみ（外部から直接呼ばれない）

---

### `createCard(character, pairIndex, suffix)`（非 export）

| 項目 | 内容 |
|------|------|
| **引数** | `character` — ロスター1件 / `pairIndex` — インデックス / `suffix` — `'a'` または `'b'` |
| **戻り値** | カードオブジェクト（`faceUp: false`） |
| **export** | なし（`engine.js` 内部専用） |

**処理の流れ:**
- `uid` を `${character.id}-${suffix}` 形式で生成（例: `wizard-a`）
- `pairId` に `character.id` をコピー（ペア判定はここで比較）
- `name`, `image` をキャラデータからコピー

**使うタイミング:**
- `buildDeck()` 内で、各キャラのペア2枚を作るとき

---

### `shuffle(items)`

| 項目 | 内容 |
|------|------|
| **引数** | `items` — 並べ替えたい配列 |
| **戻り値** | シャッフル済みの**新しい配列**（元の `items` は変更しない） |
| **export** | あり |

**処理の流れ（Fisher-Yates 風）:**
1. `[...items]` でコピーを作る
2. 末尾から前に向かって、ランダムな位置 `j` と要素を入れ替え
3. コピー配列を返す

**使うタイミング:**
- `buildDeck()` でデッキの順番をランダムにするとき

**読解ポイント:** `sort(() => Math.random() - 0.5)` とは違い、元配列を壊さず、より均等なランダム性を狙った実装。

---

### `canFlip(state, cardUid)`

| 項目 | 内容 |
|------|------|
| **引数** | `state` — 現在のゲーム状態 / `cardUid` — めくりたいカードの UID |
| **戻り値** | `true`（めくれる）または `false`（めくれない） |
| **export** | あり |

**処理の流れ（上から順にチェック、1つでも該当すれば `false`）:**
1. `state.locked` または `state.finished` → 操作不可
2. `state.deck` から `cardUid` のカードを `find` で探す
3. カードがない / 既に `faceUp` / `matched` に `pairId` が含まれる → めくれない
4. `flipped.length < 2` なら `true`、既に2枚めくっていれば `false`

**使うタイミング:**
- `handleCardClick()` の入口（無効クリックを早期リターン）
- `flipCard()` 内部（二重チェック）

**状態の変化:** なし（読み取り専用の判定関数）

---

### `flipCard(state, cardUid)`

| 項目 | 内容 |
|------|------|
| **引数** | `state` — 現在のゲーム状態 / `cardUid` — めくるカードの UID |
| **戻り値** | 更新後の新しい `state` オブジェクト |
| **export** | あり |

**処理の流れ:**
1. `cloneState(state)` で状態をコピー（`next`）
2. `canFlip(next, cardUid)` が `false` なら `next` をそのまま返す
3. 対象カードの `faceUp = true`
4. `next.flipped` に `cardUid` を追加
5. `flipped.length === 2` なら `moves += 1` と `locked = true`
6. `next` を返す

**使うタイミング:**
- プレイヤーがカードをクリックし、`canFlip()` が通った直後

**状態の変化（1枚目をめくった場合）:**
| プロパティ | 変化 |
|------------|------|
| `deck` 内の対象カード | `faceUp: true` |
| `flipped` | UID が1件追加 |
| `moves` | 変化なし |
| `locked` | 変化なし |

**状態の変化（2枚目をめくった場合）:**
| プロパティ | 変化 |
|------------|------|
| 上記に加え | `moves += 1`, `locked = true` |

---

### `resolveFlip(state)`

| 項目 | 内容 |
|------|------|
| **引数** | `state` — 2枚めくり済み・`locked: true` の状態 |
| **戻り値** | `{ state: 新state, matched: 真偽値 }` |
| **export** | あり |

**処理の流れ:**
1. `cloneState(state)` でコピー（`next`）
2. `flipped` の2件 UID からカードを取得（`first`, `second`）
3. **ペア一致**（`first.pairId === second.pairId`）の場合:
   - `matched.add(first.pairId)`
   - `flipped = []`, `locked = false`
   - `matched.size === difficulty.pairCount` なら `finished = true`
   - `{ state: next, matched: true }` を返す
4. **不一致**の場合:
   - `first.faceUp = false`, `second.faceUp = false`
   - `flipped = []`, `locked = false`
   - `{ state: next, matched: false }` を返す

**使うタイミング:**
- 2枚めくってから **700ms**（`FLIP_DELAY_MS`）後の `setTimeout` 内
- プレイヤーが2枚を見比べる猶予を確保してから実行

**状態の変化（一致時）:**
| プロパティ | 変化 |
|------------|------|
| `matched` | `pairId` が追加 |
| `flipped` | 空に |
| `locked` | `false` |
| `finished` | 全ペア揃いなら `true` |
| カードの `faceUp` | 表向きのまま（マッチ済みとして表示） |

**状態の変化（不一致時）:**
| プロパティ | 変化 |
|------------|------|
| 2枚のカード | `faceUp: false` に戻る |
| `flipped` | 空に |
| `locked` | `false` |

---

### `getProgress(state)`

| 項目 | 内容 |
|------|------|
| **引数** | `state` — 現在のゲーム状態 |
| **戻り値** | `{ moves, matched, total }` |
| **export** | あり |

**戻り値の内訳:**
- `moves` — `state.moves`（手数）
- `matched` — `state.matched.size`（見つけたペア数）
- `total` — `state.difficulty.pairCount`（総ペア数）

**使うタイミング:**
- HUD（手数・FOUND 表示）の更新時
- クリア画面の表示データ組み立て時
- 記録保存時（`finishGame()`）

**状態の変化:** なし（読み取り専用）

---

### `cloneState(state)`（非 export）

| 項目 | 内容 |
|------|------|
| **引数** | `state` — コピー元 |
| **戻り値** | ディープコピーされた新しい `state` |
| **export** | なし（`engine.js` 内部専用） |

**処理の流れ:**
- トップレベルはスプレッド `{ ...state }` で浅いコピー
- `deck` — 各カードを `{ ...card }` で個別コピー
- `flipped` — `[...state.flipped]` で配列コピー
- `matched` — `new Set(state.matched)` で Set コピー
- `difficulty` — `{ ...state.difficulty }` でオブジェクトコピー

**使うタイミング:**
- `flipCard()` と `resolveFlip()` の冒頭

**なぜ必要か:** 元の `state` を直接書き換えないことで、過去の状態を保持し、意図しない副作用を防ぐ。

---

## `src/game/timer.js`

ゲームのプレイ時間を計測するモジュール。ファイル先頭の **モジュールスコープ変数** でタイマー状態を1つだけ保持する（ゲームは同時に1つだけ動く想定）。

### モジュール内の変数（関数ではないが理解に必要）

| 変数 | 型 | 意味 |
|------|-----|------|
| `intervalId` | `number \| null` | `setInterval` の ID。動いていないときは `null` |
| `startedAt` | `number \| null` | 計測開始時刻（`Date.now()`）。未開始は `null` |
| `elapsedMs` | `number` | 経過ミリ秒。`setInterval` 内で更新される |

### タイマー関数の関係

```
startTimer()
  └─ stopTimer()        … 二重起動防止のため先に停止

resetTimer()
  └─ stopTimer()        … 停止してからカウンタをゼロに

getElapsedMs()
  ├─ startedAt あり → Date.now() - startedAt（リアルタイム計算）
  └─ startedAt なし → elapsedMs（停止後の保存値）

formatElapsed(ms)     … 表示専用（タイマー状態には触らない）
```

### `startTimer()`

| 項目 | 内容 |
|------|------|
| **引数** | なし |
| **戻り値** | なし |
| **export** | あり |

**処理の流れ:**
1. `stopTimer()` で既存の interval を止める（二重起動防止）
2. `startedAt = Date.now()` で開始時刻を記録
3. `elapsedMs = 0` にリセット
4. 250ms 間隔の `setInterval` を開始し、毎回 `elapsedMs = Date.now() - startedAt` を更新

**使うタイミング:**
- `beginGame()` でゲーム開始直後

**変数の変化:** `intervalId` がセットされる / `startedAt` が現在時刻 / `elapsedMs` が 0 から増加開始

---

### `stopTimer()`

| 項目 | 内容 |
|------|------|
| **引数** | なし |
| **戻り値** | なし |
| **export** | あり |

**処理の流れ:**
1. `intervalId !== null` なら `clearInterval(intervalId)`
2. `intervalId = null` に戻す

**使うタイミング:**
- `startTimer()` の冒頭（二重起動防止）
- `resetTimer()` 内
- `cleanupGameTimers()` 経由（タイトル戻り・クリア・ページ離脱時）

**変数の変化:** `intervalId` が `null` に。`startedAt` と `elapsedMs` はそのまま（`resetTimer` で別途クリア）

---

### `resetTimer()`

| 項目 | 内容 |
|------|------|
| **引数** | なし |
| **戻り値** | なし |
| **export** | あり |

**処理の流れ:**
1. `stopTimer()` で interval を停止
2. `startedAt = null`
3. `elapsedMs = 0`

**使うタイミング:**
- タイトル画面に戻るとき（`showStart()`）
- 新しいゲームを始める直前（`beginGame()`）

**変数の変化:** タイマー関連の3変数すべてが初期状態に戻る

---

### `getElapsedMs()`

| 項目 | 内容 |
|------|------|
| **引数** | なし |
| **戻り値** | 経過ミリ秒（整数） |
| **export** | あり |

**処理の流れ:**
- `startedAt === null`（計測停止後）→ 保存済みの `elapsedMs` を返す
- `startedAt` がある（計測中）→ `Date.now() - startedAt` をリアルタイム計算して返す

**使うタイミング:**
- HUD 更新（250ms ごとの `setInterval`）
- カードクリック直後の HUD 更新
- クリア画面表示（`buildViewContext()`）
- 記録保存（`finishGame()`）

**読解ポイント:** `stopTimer()` 後も `elapsedMs` に最後の値が残るため、クリア時に `getElapsedMs()` で正しいプレイ時間を取得できる。

---

### `formatElapsed(ms)`

| 項目 | 内容 |
|------|------|
| **引数** | `ms` — ミリ秒 |
| **戻り値** | `MM:SS` 形式の文字列（例: `01:23`, `00:05`） |
| **export** | あり |

**処理の流れ:**
1. `Math.floor(ms / 1000)` で総秒数を得る
2. 分 = `総秒数 / 60` の商、秒 = 総秒数 % 60
3. `padStart(2, '0')` で2桁ゼロ埋めし、`分:秒` を連結

**使うタイミング:**
- ゲーム画面のタイマー表示（`renderGameScreen`, `updateHud`）
- クリア画面のタイム表示
- タイトル画面のランキング表示（`renderRecordsPanel`）

**状態の変化:** なし（純粋な変換関数。タイマーの内部変数には触らない）

---

### `src/game` の関数が連動する典型パターン

#### ゲーム開始時

```
beginGame()
  → createInitialState()     … state 初期化
  → resetTimer()             … 時間リセット
  → startTimer()             … 時間計測開始
  → getElapsedMs()           … HUD 表示用
  → getProgress(state)       … HUD 表示用
```

#### カードを2枚めくって一致したとき

```
flipCard()        … locked=true, moves+1
  （700ms 待機）
resolveFlip()     … matched に追加, locked=false
getProgress()     … FOUND 表示更新
getElapsedMs()    … TIME 表示更新
  （全ペア揃いなら finished=true → finishGame で stopTimer）
```

#### タイトルに戻るとき

```
showStart()
  → cleanupGameTimers()  … stopTimer() + HUD interval 停止
  → resetTimer()         … 時間を完全リセット
```

---

## `src/ui/` フォルダ概要

画面の「見た目」と「操作」の層。`events.js` が司令塔となり、他モジュールを呼び出して画面を動かす。`render.js` は DOM 生成専用で、ゲーム状態は変更しない。

| ファイル | 役割 |
|----------|------|
| `events.js` | 画面遷移・クリック処理・各モジュールの接続（コントローラー） |
| `render.js` | HTML の生成・HUD の部分更新 |

```
main.js
  └─ events.js  … createScreenController() で起動
       ├─ render.js       … renderStartScreen / renderGameScreen / updateHud
       ├─ game/engine.js  … 状態の更新（flipCard, resolveFlip など）
       ├─ game/timer.js   … 時間の取得・計測
       ├─ data/cards.js   … 難易度の参照
       └─ storage/scores.js … クリア時の記録保存・表示用データ取得
```

### `render.js` 内の関数の関係

```
renderStartScreen()
  ├─ renderRecordsPanel()  … 内部関数（非 export）
  └─ escapeHtml()          … 内部関数（非 export）

renderGameScreen()
  ├─ renderResultOverlay() … 内部関数（finished 時のみ）
  ├─ formatElapsed()       … timer.js から import
  └─ escapeHtml()

updateHud()                … 既存 DOM のテキストだけ更新（軽量）
```

### `events.js` 内の関数の関係

```
createScreenController(root)   … export。showStart / cleanup を返す
  ├─ showStart()
  │    ├─ cleanupGameTimers()
  │    ├─ resetTimer()
  │    ├─ renderStartScreen()
  │    └─ bindStartScreen()
  │         └─ beginGame()   … START クリック時
  ├─ beginGame()
  │    ├─ createInitialState()
  │    ├─ renderGameScreen() / bindGameScreen()
  │    ├─ startTimer()
  │    └─ setInterval → updateHud()
  ├─ handleCardClick()       … カードクリックの中心
  │    ├─ flipCard() / resolveFlip()
  │    ├─ paintBoard()
  │    └─ finishGame()       … クリア時
  ├─ buildViewContext()      … render 用データの組み立て
  └─ cleanupGameTimers()
```

---

## `src/ui/render.js`

`src/ui/` の描画担当。DOM の生成・更新のみ。ゲームロジックは持たない。

### `renderStartScreen(root, playerName)`

**内容:** タイトル画面の HTML を `root.innerHTML` で一括生成する。

含まれる要素:
- ヒーロー名入力欄（前回の名前を初期値に）
- 難易度ラジオボタン
- START QUEST ボタン
- HALL OF FAME（各難易度の上位記録）

**使うタイミング:**
- 初回起動時（`showStart()`）
- タイトルに戻るとき（QUIT / TITLE ボタン）

---

### `renderGameScreen(root, context)`

**内容:** プレイ画面の HTML を `root.innerHTML` で一括生成する。

`context` に含まれる主な値: `state`, `playerName`, `progress`, `elapsedMs`, `bestRecord`, `saved`

含まれる要素:
- HUD（ヒーロー名・時間・手数・発見数）
- カード盤面（`state.deck` から生成）
- BACK TO TITLE ボタン
- `state.finished` が `true` ならクリアオーバーレイも付与

**使うタイミング:**
- ゲーム開始時（`beginGame()`）
- カードをめくった直後（`paintBoard()`）
- クリア時（`finishGame()`）

---

### `updateHud(progress, elapsedMs)`

**内容:** 既存 DOM の `#timer-display`, `#moves-display`, `#found-display` のテキストだけ更新する。画面全体は再生成しない。

**使うタイミング:**
- ゲーム中 250ms ごとの HUD タイマー更新
- カードクリック直後の手数・発見数更新

---

### `renderResultOverlay(context)`（非 export）

**内容:** クリア時のオーバーレイ HTML を生成する。VICTORY 表示、タイム・手数、記録更新の有無、ベスト記録、PLAY AGAIN / TITLE ボタン。

**使うタイミング:**
- `renderGameScreen()` 内で `state.finished` が `true` のとき

---

### `renderRecordsPanel()`（非 export）

**内容:** タイトル画面用のランキング HTML を生成。各難易度の上位3件を `getTopRecords()` から取得して表示。

**使うタイミング:**
- `renderStartScreen()` 内

---

### `escapeHtml(value)`（非 export）

**内容:** HTML 特殊文字（`&`, `<`, `>`, `"`, `'`）をエスケープして XSS を防ぐ。

**使うタイミング:**
- プレイヤー名などユーザー入力を HTML に埋め込むすべての箇所

---

## `src/ui/events.js`

`src/ui/` の制御担当。画面遷移・ユーザー操作・各モジュールの接続を行うコントローラー。

### `createScreenController(root)`

**内容:** 画面制御オブジェクトを作る。内部で `playerName`, `difficultyKey`, `state`, `hudTimerId` を保持。

**返り値:**
- `showStart` — タイトル画面を表示
- `cleanup` — タイマーをすべて停止

**使うタイミング:**
- `main.js` の起動時に1回だけ

---

### `showStart()`（内部関数）

**内容:**
1. `cleanupGameTimers()` でタイマー停止
2. `resetTimer()` で時間リセット
3. `state = null`
4. `renderStartScreen()` でタイトル描画
5. `bindStartScreen()` でイベント登録

**使うタイミング:**
- 初回表示
- BACK TO TITLE / TITLE ボタン

---

### `beginGame()`（内部関数）

**内容:**
1. 選択難易度で `createInitialState()`
2. タイマークリーンアップ・リセット
3. `renderGameScreen()` でプレイ画面描画
4. `bindGameScreen()` でイベント登録
5. `startTimer()` でゲーム時間計測開始
6. 250ms 間隔の HUD 更新 `setInterval` 開始

**使うタイミング:**
- START QUEST ボタン
- PLAY AGAIN ボタン

---

### `bindStartScreen()`（内部関数）

**内容:** `#start-button` のクリックで、名前・難易度を読み取り `beginGame()` を呼ぶ。名前が空なら `HERO` を使う。

**使うタイミング:**
- タイトル画面描画の直後

---

### `bindGameScreen()`（内部関数）

**内容:** プレイ画面のイベントを登録する。
- `#board` クリック → カードクリック処理（`closest('[data-uid]')` でカード特定）
- `#quit-button` → `showStart()`
- `#retry-button` → `beginGame()`
- `#title-button` → `showStart()`

**使うタイミング:**
- プレイ画面を描画した直後（`beginGame`, `paintBoard`, `finishGame` の各後）

---

### `handleCardClick(cardUid)`（内部関数）

**内容:** カードクリックのメインフロー。

1. `canFlip()` で弾く
2. `flipCard()` で状態更新
3. `paintBoard()` で盤面再描画
4. `updateHud()` で HUD 更新
5. 2枚めくっていなければ終了
6. 700ms 後に `resolveFlip()` 実行
7. クリアなら `finishGame()`、そうでなければ `paintBoard()` + `updateHud()`

**使うタイミング:**
- プレイヤーがカードをクリックしたとき

---

### `finishGame()`（内部関数）

**内容:**
1. `cleanupGameTimers()` でタイマー停止
2. 経過時間・進捗を取得
3. `saveRecord()` で記録保存を試行
4. クリア画面付きで `renderGameScreen()` 再描画
5. `bindGameScreen()` でボタン再登録

**使うタイミング:**
- `resolveFlip()` の結果 `state.finished` が `true` のとき（全ペア揃い）

---

### `paintBoard()`（内部関数）

**内容:** `renderGameScreen()` で盤面を丸ごと再描画し、直後に `bindGameScreen()` でイベントを再登録。

**使うタイミング:**
- カードをめくった直後
- 2枚めくりの結果処理後（クリア以外）

**注意:** 画面全体を毎回 `innerHTML` で作り直すため、イベントの再登録が必要。

---

### `buildViewContext(saved)`（内部関数）

**内容:** `renderGameScreen()` に渡す `context` オブジェクトを組み立てる。

```js
{
  state,
  playerName,
  progress: getProgress(state),
  elapsedMs: getElapsedMs(),
  bestRecord: getBestRecord(difficultyKey),
  saved,  // 記録保存に成功したか（クリア時のみ意味がある）
}
```

**使うタイミング:**
- `beginGame()`, `paintBoard()`, `finishGame()` で画面描画前

---

### `cleanupGameTimers()`（内部関数）

**内容:** ゲームタイマー（`stopTimer()`）と HUD 更新用 `setInterval` を両方停止。

**使うタイミング:**
- タイトルに戻るとき
- ゲーム開始前のクリーンアップ
- クリア時
- `controller.cleanup()` 経由のページ離脱時

---

## `src/storage/` フォルダ概要

ブラウザの `localStorage` を使ったデータ永続化の層。ゲームロジックや UI には触らず、記録の読み書きだけを担当する。

| ファイル | 役割 |
|----------|------|
| `scores.js` | 難易度別ベスト記録の保存・読み込み・上位取得 |

```
src/ui/events.js
  └─ scores.js  … saveRecord()（クリア時）, getBestRecord()（結果画面）

src/ui/render.js
  └─ scores.js  … getTopRecords()（タイトルの HALL OF FAME）
```

### `scores.js` 内の関数の関係

```
loadRecords()              … localStorage から全記録を読む（内部の土台）
  ↑ 内部で呼ばれる
saveRecord()               … 記録を追加して保存（上位5件に制限）
getBestRecord()            … 1位の記録を返す
getTopRecords()            … 上位 N 件を返す
```

**読解ポイント:** `loadRecords()` は他3関数の共通の読み込み処理として内部から呼ばれる。`try/catch` でストレージ障害時は空データにフォールバックする。

---

## `src/storage/scores.js`

`src/storage/` フォルダの唯一のファイル。`localStorage` によるベスト記録の永続化。

### `loadRecords()`

**内容:** `localStorage` から全記録を読み込む。キーは `crystal-memory-records`。JSON パース失敗やデータ不正時は空オブジェクト `{}` を返す。

**使うタイミング:**
- `saveRecord()`, `getBestRecord()`, `getTopRecords()` の内部

---

### `saveRecord(difficultyKey, playerName, payload)`

**内容:** 記録を追加して保存する。
1. 既存記録に新規エントリを追加（`moves`, `elapsedMs`, `savedAt`）
2. 手数優先・同手数なら時間短い順にソート
3. 上位5件に `slice(0, 5)` で制限
4. `localStorage.setItem` で保存

**戻り値:** 保存成功なら `true`、失敗（容量超過・プライベートモード等）なら `false`

**使うタイミング:**
- ゲームクリア時（`finishGame()`）

---

### `getBestRecord(difficultyKey)`

**内容:** 指定難易度の1位記録を返す。なければ `null`。

**使うタイミング:**
- クリア画面でベスト記録を表示するとき（`buildViewContext()`）

---

### `getTopRecords(difficultyKey, limit = 5)`

**内容:** 指定難易度の上位記録を `limit` 件返す（デフォルト5件）。

**使うタイミング:**
- タイトル画面の HALL OF FAME 表示（`renderRecordsPanel()` では `limit = 3`）

---

## カードクリック1回の関数呼び出し順（参考）

### 1枚目をめくるとき

```
handleCardClick
  → canFlip
  → flipCard（内部で cloneState, canFlip）
  → paintBoard（renderGameScreen, bindGameScreen）
  → updateHud（getProgress, getElapsedMs, formatElapsed）
```

### 2枚目をめくるとき（一致・不一致共通）

上記に加え、700ms 後:

```
setTimeout 内
  → resolveFlip（内部で cloneState）
  → finishGame または paintBoard + updateHud
```

`finishGame` の場合:

```
finishGame
  → cleanupGameTimers（stopTimer, clearInterval）
  → getElapsedMs, getProgress
  → saveRecord（内部で loadRecords）
  → renderGameScreen（buildViewContext → getBestRecord）
  → bindGameScreen
```

---

## モジュール間の依存関係

```
main.js
  └─ ui/events.js
       ├─ data/cards.js      （DIFFICULTY）
       ├─ game/engine.js     （状態・ルール）
       ├─ game/timer.js        （時間計測）
       ├─ storage/scores.js  （記録）
       └─ ui/render.js         （DOM 描画）
            ├─ data/cards.js
            ├─ game/timer.js
            └─ storage/scores.js
```

---

*本資料は `src/` のソースを読解するための補助資料です。実装の詳細は各 `.js` ファイルを参照してください。*
