# gha-report-code-coverage — 構成・仕様まとめ

## リポジトリ概要

`lepusinc/gha-report-code-coverage` はカバレッジ結果を GitHub Step Summary に表形式で出力する **Node.js 22 GitHub Action**。

PHPUnit / Pest / Jest / SimpleCov など、Clover XML を出力する任意のフレームワークと組み合わせられる言語非依存のアクション。

---

## 領域と境界

### このアクションがやること

- カバレッジファイル（glob パターン指定）のパースとメトリクス抽出
- GitHub artifact のダウンロード（付加機能・オプション）
- outputs への集計結果の設定
- GitHub Step Summary へのマークダウンテーブル出力（オプション）
- lines / methods / conditionals の warn / fail 閾値チェック

### このアクションがやらないこと

- テストの実行
- カバレッジの計測・収集（artifact のアップロード）
- PR コメントへの出力（将来対応予定）
- Clover XML 以外のフォーマット（将来対応予定）
- カバレッジのトレンド記録・比較

---

## ディレクトリ構成

```
gha-report-code-coverage/
  action.yml          # アクションのインターフェース定義（inputs / outputs / runs）
  src/
    main.ts           # エントリーポイント。ダウンロード→パース→outputs設定→サマリー出力
    clover.ts         # Clover XML マッパー（CoverageReport 型への変換）
  dist/
    index.js          # ncc でバンドルされた実行ファイル（コミット対象）
    index.js.map      # ソースマップ
    sourcemap-register.js
    licenses.txt      # バンドルした依存パッケージのライセンス
  package.json
  tsconfig.json
  LICENSE             # MIT
  README.md
  AGENTS.md           # このファイル
```

### ファイルごとの役割

| ファイル | 役割 |
|---|---|
| `action.yml` | inputs / outputs の定義、`runs.using: node22` で `dist/index.js` を指定 |
| `src/main.ts` | artifact ダウンロード・ファイル探索・outputs 設定・Summary 書き込み・閾値チェックの制御フロー |
| `src/clover.ts` | `fast-xml-parser` を使った Clover XML → `CoverageReport` 型へのマッパー |
| `dist/index.js` | `@vercel/ncc` でバンドルした単一ファイル。ランナー上で `node dist/index.js` として実行される |

---

## 設計メモ

### フォーマットマッパーアーキテクチャ

将来的に Clover XML 以外のフォーマット（Istanbul / JaCoCo / lcov など）に対応することを見越し、マッパーパターンを採用する。

```
入力ファイル
    ↓
[Mapper] 各フォーマット固有の変換処理
    ↓
内部レポート形式（CoverageReport 型）
    ↓
[出力先] Step Summary / outputs / 将来の出力先
```

- 各フォーマットに対応するマッパーが内部レポート形式（`CoverageReport` 型）へ変換する責務を持つ
- アクション本体（閾値チェック・outputs 設定・Step Summary 出力）は内部レポート形式のみを扱い、入力フォーマットを意識しない
- 現時点での実装は Clover XML マッパーのみ

#### 内部レポート形式と Clover XML の関係

現在の内部レポート形式は Clover XML の構造に準じているが、あくまで内部の正規形式として定義する。他フォーマットのマッパーはこの正規形式へのマッピングが責務となる。

#### マッパーの選択

入力ファイルのフォーマットは将来的に `format` input で明示指定する、または拡張子・内容から自動判別することを想定する（現時点では Clover XML 固定のため不要）。

### `report` の構造方針

`report` output の JSON は内部レポート形式（`CoverageReport` 型）をそのままシリアライズしたもの。Clover XML マッパーは以下のルールで変換する：

- `<metrics>` 属性はそのままフィールド名に使用する
- `<line>` 要素は `count="0"` のもののみ抽出してタイプ別にフィルタリングする
  - `uncoveredMethods` — `type="method"` かつ `count="0"`
  - `uncoveredStatements` — `type="stmt"` かつ `count="0"`（上限 30 件）

`result`・`thresholds` はマッパーではなくアクション本体が付加する。

### `file` glob の評価

`artifact` が指定されていない場合、`file` glob はワークスペースルート（`$GITHUB_WORKSPACE`）基準で評価する。

`artifact` が指定されている場合、`actions/download-artifact` の `outputs.download-path` と `inputs.file` を文字列結合してファイルを探索する。

```
// 例
download-path: /tmp/lepusinc/gha-report-code-coverage
file:          **/coverage.xml
→ 探索パス:   /tmp/lepusinc/gha-report-code-coverage/**/coverage.xml
```

これによりユーザーは `artifact` の有無によらず `file: '**/coverage.xml'` と書ける。

### conditionals の扱い

全ファイルの `conditionals` 合計が `0` の場合、ブランチカバレッジ計測が無効と判断する。この場合、`conditionals` output の設定・Step Summary の Conditionals 行の出力・`thresholds-conditionals` のチェックをすべてスキップする。

### 複数 Clover XML ファイルの集計ロジック

複数の Clover XML ファイルが見つかった場合、各ファイルの `<metrics>` を単純加算してトップレベルの合算値とする。同一ソースファイルが複数の Clover XML に含まれる場合（例: ユニットテストと統合テストが同じクラスをカバーしている）は二重カウントになるが、これは許容する。

### 動作フローと出力アーキテクチャ

1. `artifact` が指定されていれば `actions/download-artifact` でダウンロードする
2. `file` にマッチするカバレッジファイルをパースして集計する
3. 集計結果を outputs に設定する（**基本動作**）
4. `step-summary: true` であれば outputs を整形して Step Summary に書き込む

outputs が唯一の出力ソースであり、Step Summary やその他の出力先はすべて outputs を参照して整形・書き込みを行う。将来 PR コメントなどの出力先を追加する場合も、この構造を踏襲する。

### `dist/index.js` をリポジトリにコミットする理由

GitHub Actions の Node.js アクションはランナー上で `npm install` を実行しない。`dist/index.js` をコミットしておくことで、ランナーはそのまま実行できる。`node_modules/` はコミットしない（`.gitignore` で除外）。

---

## 開発環境セットアップ

### 前提

- Node.js 22+
- npm

### セットアップ

```bash
npm install
```

### ビルド

```bash
npm run build
```

`src/main.ts` → `dist/index.js` に `@vercel/ncc` でバンドルする。**変更後は必ずビルドして `dist/` をコミットすること。**

### 型チェック

```bash
npm run typecheck
```

`tsc --noEmit` を実行する。バンドルは行わない。

---

## テスト方法

現時点では自動テストは存在しない。以下の手順で手動確認する。

### 実際のワークフローでのテスト

`lepusinc/php-ci` の `run-php-test-matrix.yml` から参照してテストを実行する。

```yaml
- uses: lepusinc/gha-report-code-coverage@develop  # ブランチ指定で動作確認
  with:
    artifact: |
      pattern: 'coverage-*'
      merge-multiple: true
    file: '**/coverage.xml'
```

### 確認項目

| ケース | 確認内容 |
|---|---|
| `file` のみ指定（ローカルファイル） | Step Summary にテーブルが出力される |
| `artifact` + `file` 指定 | artifact ダウンロード後にテーブルが出力される |
| 複数 Clover XML（複数テストスイート） | ファイルごとにサブセクションが出力され合算される |
| `thresholds-*` 指定・fail | ジョブが失敗する |
| `thresholds-*` 指定・warn | `::warning::` アノテーションが出る |
| ファイルなし・`required: true` | ジョブが失敗する |
| ファイルなし・`required: false` | 警告のみで続行、outputs が `-` になる |
| `step-summary: false` | Step Summary への出力がスキップされる |
| `conditionals` 計測無効の XML | Conditionals 行が出力されない |

---

## リリース手順

1. `develop` ブランチで変更・ビルド・コミット
2. `develop` → `main` の PR を作成・マージ
3. `main` に `vX.Y.Z` タグを打つ
4. メジャータグ（`v1` など）を最新コミットに移動する

```bash
git tag -fa v1 -m "v1"
git push origin v1 --force
```

> GitHub Actions の慣例として、メジャータグは常に最新のマイナー・パッチに追従させる。

---

## 外部 Action バージョン

このアクション自体はバンドル済みのため、呼び出し側は追加で Action のバージョンを意識する必要はない。内部で使用している主要ライブラリのバージョンは `package.json` を参照。
