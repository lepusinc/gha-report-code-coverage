# gha-report-code-coverage — 構成・仕様まとめ

## リポジトリ概要

`lepusinc/gha-report-code-coverage` は Clover XML 形式のカバレッジ artifact をダウンロードし、GitHub Step Summary にカバレッジ表を出力する **Node.js 20 GitHub Action**。

PHPUnit / Pest / Jest / SimpleCov など、Clover XML を出力する任意のフレームワークと組み合わせられる言語非依存のアクション。

---

## 領域と境界

### このアクションがやること

- GitHub artifact のダウンロード（ID 指定 / glob パターン指定）
- Clover XML のパースとメトリクス抽出（lines / methods）
- GitHub Step Summary へのマークダウンテーブル出力
- 全 artifact の合算カバレッジに対する warn / fail 閾値チェック

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
  action.yml          # アクションのインターフェース定義（inputs / runs）
  src/
    main.ts           # エントリーポイント。ダウンロード→パース→サマリー出力→閾値チェック
    clover.ts         # Clover XML パースロジックと型定義
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
| `action.yml` | inputs / outputs の定義、`runs.using: node20` で `dist/index.js` を指定 |
| `src/main.ts` | artifact ダウンロード・XML ファイル探索・Summary 書き込み・閾値チェックの制御フロー |
| `src/clover.ts` | `fast-xml-parser` を使った Clover XML パース。`CloverMetrics` 型と `parseCloverXml()` / `coveragePercent()` を export |
| `dist/index.js` | `@vercel/ncc` でバンドルした単一ファイル。ランナー上で `node dist/index.js` として実行される |

---

## 設計メモ

### `dist/index.js` をリポジトリにコミットする理由

GitHub Actions の Node.js アクションはランナー上で `npm install` を実行しない。`dist/index.js` をコミットしておくことで、ランナーはそのまま実行できる。`node_modules/` はコミットしない（`.gitignore` で除外）。

### artifact ID vs glob パターン

| 取得方法 | 用途 |
|---|---|
| `artifact-id`（ID 指定） | 単一ジョブが 1 つ artifact をアップロードするケース |
| `artifact-pattern`（glob） | matrix ビルドで複数 artifact をまとめてダウンロードするケース |

両方指定された場合は `artifact-id` が優先される（`main.ts` の `if / else if` 分岐）。

### カバレッジラベル

artifact のダウンロード先ディレクトリ構成によってラベルが決まる。

```
coverage-results/
  coverage (PHP 8.3, Laravel 11.*)/   ← artifact 名がサブディレクトリになる
    clover.xml
  coverage (PHP 8.4, Laravel 11.*)/
    clover.xml
```

`parentDir === destDir`（ルート直下）のとき label は空文字（セクション見出しなし）。サブディレクトリのとき `### <artifact名>` が出力される。

### 閾値チェックのスコープ

閾値は全 artifact の **合算** `statements` / `coveredStatements` に対して計算する。artifact ごとの個別チェックは行わない。

---

## 開発環境セットアップ

### 前提

- Node.js 20+
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
    artifact-pattern: 'coverage *'
```

### 確認項目

| ケース | 確認内容 |
|---|---|
| `artifact-id` 指定 | Step Summary にテーブルが出力される |
| `artifact-pattern` 指定（複数 artifact） | artifact ごとにサブセクションが出力される |
| `thresholds` 指定・fail | ジョブが失敗する |
| `thresholds` 指定・warn | `::warning::` アノテーションが出る |
| artifact なし / XML なし | `_No coverage data found._` が出力される |

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
