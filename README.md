# gha-report-code-coverage

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Node.js 20](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Clover XML のカバレッジ artifact をダウンロードし、[GitHub Step Summary](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/adding-a-workflow-summary) にカバレッジ表を出力する GitHub Action。

---

## 機能

- **Clover XML 対応** — PHPUnit / Pest / Jest / SimpleCov など、Clover XML を出力する任意のテストフレームワークと組み合わせられる
- **単一 / 複数 artifact 対応** — artifact ID を指定した単一取得と、glob パターンによる複数取得（matrix ビルド）の両方をサポート
- **カバレッジ閾値チェック** — warn / fail の 2 段階閾値を設定可能。全 artifact のライン数を合算して判定する
- **Step Summary 出力** — `@actions/core` の Summary API を使い、ヘッダー・テーブル形式で出力する

---

## Getting Started

```yaml
coverage-report:
  needs: [test]
  runs-on: ubuntu-latest
  if: ${{ !cancelled() }}
  steps:
    - uses: lepusinc/gha-report-code-coverage@v1
      with:
        artifact-id: ${{ needs.test.outputs.coverage-artifact-id }}
```

---

## 使い方

### 単一 artifact（artifact ID 指定）

前のジョブがアップロードした artifact の ID を直接指定する。

```yaml
coverage-report:
  needs: [test]
  runs-on: ubuntu-latest
  if: ${{ !cancelled() }}
  steps:
    - uses: lepusinc/gha-report-code-coverage@v1
      with:
        artifact-id: ${{ needs.test.outputs.coverage-artifact-id }}
        title: 'Test Coverage'
```

### matrix ビルド（パターン指定）

matrix で複数の artifact がアップロードされる場合、glob パターンで一括ダウンロードして合算レポートする。

```yaml
coverage-report:
  needs: [test]
  runs-on: ubuntu-latest
  if: ${{ !cancelled() }}
  steps:
    - uses: lepusinc/gha-report-code-coverage@v1
      with:
        artifact-pattern: 'coverage *'
        thresholds: '60 80'
```

artifact ごとにサブセクション（`### <artifact名>`）が出力され、閾値チェックは全 artifact の合算ライン数に対して行われる。

### カバレッジ閾値

`thresholds` に `"<warn> <fail>"` 形式で 2 つの数値をスペース区切りで指定する。

| 状況 | 動作 |
|---|---|
| 全体ライン率 ≥ warn | 何もしない |
| 全体ライン率 < warn かつ ≥ fail | `::warning::` アノテーションを出力 |
| 全体ライン率 < fail | `core.setFailed()` でジョブを失敗させる |

```yaml
- uses: lepusinc/gha-report-code-coverage@v1
  with:
    artifact-pattern: 'coverage *'
    thresholds: '60 80'  # 60% 未満で警告、80% 未満で失敗
```

---

## インターフェース仕様

### inputs

| 名前 | 型 | デフォルト | 説明 |
|---|---|---|---|
| `artifact-id` | string | `''` | ダウンロードする artifact の ID。`artifact-pattern` と排他 |
| `artifact-pattern` | string | `''` | artifact 名にマッチする glob パターン（例: `"coverage *"`）。`artifact-id` と排他 |
| `title` | string | `'Coverage'` | Step Summary の見出しテキスト |
| `thresholds` | string | `''` | warn / fail 閾値（例: `'60 80'`）。省略時は閾値チェックなし |

`artifact-id` と `artifact-pattern` はどちらか一方を指定する。両方指定した場合は `artifact-id` が優先される。

### outputs

なし（Step Summary への書き込みと、閾値違反時のジョブ失敗が副作用）

### Step Summary の出力形式

```markdown
## Coverage

| | Coverage |
| --- | --- |
| Lines   | 85.3% (1234/1447) |
| Methods | 91.2% (145/159) |
```

matrix ビルドで複数 artifact がある場合:

```markdown
## Coverage

### coverage (PHP 8.3, Laravel 11.*)

| | Coverage |
| --- | --- |
| Lines   | 85.3% (1234/1447) |
| Methods | 91.2% (145/159) |

### coverage (PHP 8.4, Laravel 11.*)

...
```

---

## 必要なパーミッション

artifact をダウンロードするため、ジョブに `actions: read` 権限が必要。

```yaml
permissions:
  actions: read
```

---

## 技術スタック

| 役割 | パッケージ |
|---|---|
| GitHub Actions SDK | `@actions/core`, `@actions/artifact` |
| Clover XML パース | `fast-xml-parser` |
| artifact 名マッチング | `minimatch` |
| ビルド（バンドル） | `@vercel/ncc` |
| 型チェック | `typescript` |

---

## License

[MIT](LICENSE)
