# Report Code Coverage

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Node.js 24+](https://img.shields.io/badge/Node.js-24%2B-339933?logo=node.js&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

カバレッジ結果を [GitHub Step Summary](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/adding-a-workflow-summary)
に表形式で出力する GitHub Action。

---

## 機能

- **ファイルベースの読み込み** — ワークスペース上のカバレッジファイルを glob パターンで指定して読み込む
- **artifact ダウンロード** — `artifact` を指定すると、ファイル読み込みの前に `actions/download-artifact`でダウンロードを行う（付加機能）
- **カバレッジ閾値チェック** — lines / methods それぞれに warn / fail の 2 段階閾値を設定可能。全ファイルの合算値に対して判定する

### 対応フォーマット

- **Clover XML** — PHPUnit / Pest / Jest / SimpleCov など、Clover XML を出力する任意のテストフレームワークと組み合わせられる

### 対応出力

- **GitHub Step Summary** — `@actions/core` の Summary API を使い、ヘッダー・テーブル形式で出力する

---

## Getting Started

```yaml
coverage-report:
  needs: [ test ]
  runs-on: ubuntu-latest
  if: ${{ !cancelled() }}
  steps:
    - uses: lepusinc/gha-report-code-coverage@v1
      with:
        file: '**/coverage.xml'
```

---

## 使い方

### ローカルファイルを直接読み込む（基本）

同一ジョブ内でテストを実行した場合など、ワークスペースにカバレッジファイルが存在するケース。

```yaml
coverage-report:
  runs-on: ubuntu-latest
  steps:
    - run: vendor/bin/phpunit  # coverage.xml をワークスペースに生成
    - uses: lepusinc/gha-report-code-coverage@v1
      with:
        file: '**/coverage.xml'
        title: 'Test Coverage'
        thresholds-lines: '60 80'
```

### artifact からダウンロードして読み込む

別ジョブでアップロードされた artifact をダウンロードしてから読み込むケース。

```yaml
coverage-report:
  needs: [ test ]
  runs-on: ubuntu-latest
  if: ${{ !cancelled() }}
  steps:
    - uses: lepusinc/gha-report-code-coverage@v1
      with:
        artifact: |
          name: ${{ needs.test.outputs.coverage-artifact-name }}
        file: '**/coverage.xml'
        thresholds-lines: '60 80'
```

### 複数テストスイートを合算する

ユニットテストと統合テストを別々に実行して artifact にアップロードし、カバレッジを合算レポートするケース。

```yaml
coverage-report:
  needs: [ unit-test, integration-test ]
  runs-on: ubuntu-latest
  if: ${{ !cancelled() }}
  steps:
    - uses: lepusinc/gha-report-code-coverage@v1
      with:
        artifact: |
          pattern: 'coverage-*'
          merge-multiple: true
        file: '**/coverage.xml'
        thresholds-lines: '80 60'
        thresholds-methods: '70 50'
```

Clover XML ファイルごとにサブセクション（`### <project name>`）が出力され、閾値チェックは全ファイルの合算値に対して行われる。

### カバレッジ閾値

`thresholds-lines` / `thresholds-methods` / `thresholds-conditionals` に `"<warn> <fail>"` 形式で 2
つの数値をスペース区切りで指定する。それぞれ独立して設定でき、省略したメトリクスは閾値チェックを行わない。

| 状況                   | 動作                            |
|----------------------|-------------------------------|
| 全体率 ≥ warn           | 何もしない                         |
| 全体率 < warn かつ ≥ fail | `::warning::` アノテーションを出力      |
| 全体率 < fail           | `core.setFailed()` でジョブを失敗させる |

いずれかのメトリクスが `fail` を下回った場合にジョブを失敗させる。`warn` / `fail` の判定は各メトリクスで独立して行われる。

---

## インターフェース仕様

### inputs

| 名前                        | 型       | デフォルト        | 説明                                                                                                                    |
|---------------------------|---------|--------------|-----------------------------------------------------------------------------------------------------------------------|
| `file`                    | string  | —            | カバレッジファイルにマッチする glob パターン（例: `"**/coverage.xml"`）（必須）                                                                 |
| `artifact`                | string  | `''`         | ファイル読み込み前に実行する `actions/download-artifact` の `with` 句を YAML / JSON で記述する                                              |
| `required`                | boolean | `true`       | `false` にするとカバレッジファイルが1件も見つからない場合に警告に留めてジョブを続行する。`true` の場合はエラーにする                                                    |
| `step-summary`            | boolean | `true`       | `false` にすると Step Summary への出力を行わない                                                                                   |
| `title`                   | string  | `'Coverage'` | Step Summary の見出しテキスト                                                                                                 |
| `thresholds-lines`        | string  | `''`         | ライン カバレッジの warn / fail 閾値（例: `'60 80'`）。省略時はチェックなし                                                                    |
| `thresholds-methods`      | string  | `''`         | メソッド カバレッジの warn / fail 閾値（例: `'50 70'`）。省略時はチェックなし                                                                   |
| `thresholds-conditionals` | string  | `''`         | 条件分岐カバレッジの warn / fail 閾値（例: `'50 70'`）。省略時はチェックなし                                                                    |
| `uncovered-methods-limit` | string  | `'10'`       | Step Summary に表示する未カバーメソッドの最大件数、および `report` output の `statements` 配列の上限件数。`'0'` または `'off'` を指定すると未カバーメソッドの出力をスキップする |

`artifact` には `actions/download-artifact` がサポートする任意のパラメータを指定できる。ただし `path` はアクション内部で
`/tmp/lepusinc/gha-report-code-coverage` に固定されるため、指定しても無視される（警告を出力）。

### outputs

| 名前             | 型      | 説明                                                                                                |
|----------------|--------|---------------------------------------------------------------------------------------------------|
| `title`        | string | レポートの見出しテキスト（`title` input の値）                                                                    |
| `lines`        | number | 全ファイル合算のライン カバレッジ率。ファイルが0件の場合は `-`                                                                |
| `methods`      | number | 全ファイル合算のメソッド カバレッジ率。ファイルが0件の場合は `-`                                                               |
| `conditionals` | number | 全ファイル合算の条件分岐カバレッジ率。計測されていない場合（全ファイルの `conditionals` 合計が `0`）またはファイルが0件の場合は出力しない                   |
| `result`       | string | 閾値チェック結果（`ok` / `warn` / `fail`）。lines / methods / conditionals いずれの閾値も未指定時は `ok`。ファイルが0件の場合は `-` |
| `report`       | JSON   | ファイルごとの内訳を含む完全なレポート                                                                               |

`report` のフォーマット：

```json
{
  "name": "Coverage",
  "metrics": {
    "statements": 1447,
    "coveredstatements": 1234,
    "methods": 159,
    "coveredmethods": 145,
    "conditionals": 0,
    "coveredconditionals": 0
  },
  "result": "warn",
  "thresholds": {
    "lines": {
      "result": "warn",
      "warn": 90,
      "fail": 80
    },
    "methods": {
      "result": "ok",
      "warn": 70,
      "fail": 60
    },
    "conditionals": {
      "result": "ok",
      "warn": 50,
      "fail": 40
    }
  },
  "methods": [
    {
      "file": "src/UserService.php",
      "num": 25,
      "name": "delete",
      "covered": false
    },
    {
      "file": "src/OrderService.php",
      "num": 48,
      "name": "cancel",
      "covered": false
    }
  ],
  "statements": [
    {
      "file": "src/UserService.php",
      "num": 26,
      "covered": false
    },
    {
      "file": "src/UserService.php",
      "num": 27,
      "covered": false
    }
  ],
  "files": [
    {
      "name": "Unit Tests",
      "metrics": {
        "statements": 800,
        "coveredstatements": 650,
        "methods": 90,
        "coveredmethods": 80,
        "conditionals": 0,
        "coveredconditionals": 0
      },
      "result": "warn",
      "thresholds": {
        "lines": {
          "result": "warn",
          "warn": 90,
          "fail": 80
        },
        "methods": {
          "result": "ok",
          "warn": 70,
          "fail": 60
        },
        "conditionals": {
          "result": "ok",
          "warn": 50,
          "fail": 40
        }
      },
      "methods": [
        {
          "file": "src/UserService.php",
          "num": 25,
          "name": "delete",
          "covered": false
        }
      ],
      "statements": [
        {
          "file": "src/UserService.php",
          "num": 26,
          "covered": false
        }
      ]
    },
    {
      "name": "Integration Tests",
      "metrics": {
        "statements": 647,
        "coveredstatements": 584,
        "methods": 69,
        "coveredmethods": 65,
        "conditionals": 0,
        "coveredconditionals": 0
      },
      "result": "ok",
      "thresholds": {
        "lines": {
          "result": "ok",
          "warn": 90,
          "fail": 80
        },
        "methods": {
          "result": "ok",
          "warn": 70,
          "fail": 60
        }
      },
      "methods": [
        {
          "file": "src/OrderService.php",
          "num": 48,
          "name": "cancel",
          "covered": false
        }
      ],
      "statements": [
        {
          "file": "src/OrderService.php",
          "num": 49,
          "covered": false
        }
      ]
    }
  ]
}
```

Clover XML を JSON に変換した構造とする。`metrics` の各フィールドは Clover XML の `<metrics>` 属性名をそのまま使用する。
`methods`・`statements` は `<line>` 要素をタイプ別に全件抽出したもので、`covered: false` はカバーされていないことを示す。
`statements` の件数は `uncovered-methods-limit` に従う。`result`・`thresholds` はアクション独自の付加情報。トップレベルは全ファイルの合算、
`files` の各要素は
Clover XML ファイルごとの値。`thresholds` は指定されたメトリクスのみ含まれ、閾値未指定の場合は空オブジェクトになる。

`files[].name` は Clover XML の `<project name="...">` を使用する。未設定または空の場合はファイルパスにフォールバックする。

副作用：Step Summary への書き込み（`step-summary: true` 時）、閾値違反時のジョブ失敗

### Step Summary の出力形式

```markdown
## Coverage

| Metrics      | Coverage          |
|--------------|-------------------|
| Lines        | 85.3% (1234/1447) |
| Methods      | 91.2% (145/159)   |
| Conditionals | 72.4% (100/138)   |
```

全ファイルの `conditionals` 合計が `0` の場合（計測無効）は Conditionals 行を出力しない。

複数ファイルがある場合:

```markdown
## Coverage

### Unit Tests

| Metrics | Coverage        |
|---------|-----------------|
| Lines   | 81.3% (650/800) |
| Methods | 88.9% (80/90)   |

<details><summary>未カバーのメソッド (1)</summary>

| ファイル                  | 行  | メソッド     |
|-----------------------|----|----------|
| `src/UserService.php` | 25 | `delete` |

</details>

### Integration Tests

...
```

サブ見出しは Clover XML の `<project name="...">` を使用する。未設定または空の場合はファイルパスにフォールバックする。未カバーのメソッド一覧は
`<details>` で折りたたんで出力する。`uncovered-methods-limit` が `'0'` または `'off'` の場合は出力しない。

---

## 必要なパーミッション

`artifact` を使用する場合、ジョブに `actions: read` 権限が必要。

```yaml
permissions:
  actions: read
```

---

## License

[MIT](LICENSE)
