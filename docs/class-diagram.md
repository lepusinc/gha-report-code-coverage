# クラス図

## クラス・インターフェース一覧

### 処理ステップ

| 種別 | 名前 | 役割 |
|---|---|---|
| クラス | `ReportCodeCoverageAction` | アクション全体を表すクラス。`run()` 内で `Config` を生成し、各ステップを順に呼び出す |
| クラス | `SourceResolveProcess` | ステップ 2。artifact ダウンロードと glob を確定し、解決済み glob パスを返す |
| クラス | `CoverageLoadProcess` | ステップ 3。glob でファイルを探索・読み込み、`ParserFactory` 経由でパースして `CoverageData[]` を返す |
| クラス | `CoverageAnalysisProcess` | ステップ 4。`CoverageData[]` を合算し `CoverageProcessorPipeline` で処理して `CoverageResult` を生成する。副作用として outputs を書き込む |
| クラス | `ReportProcess` | ステップ 5。`Config` から `AggregateReporter` を組み立て、`report` を呼び出す |

```mermaid
classDiagram
    direction LR

    class ReportCodeCoverageAction {
        +run() Promise~void~
    }

    class SourceResolveProcess {
        +run(config: Config) Promise~string~
    }

    class CoverageLoadProcess {
        +run(glob: string, config: Config) Promise~CoverageData[]~
    }

    class CoverageAnalysisProcess {
        +run(data: CoverageData[], config: Config) CoverageResult
    }

    class ReportProcess {
        -build(config: Config) AggregateReporter
        +run(result: CoverageResult, config: Config) Promise~void~
    }

    class AggregateReporter {
        -Reporter[] reporters
        +report(result: CoverageResult, config: Config) Promise~void~
    }

    ReportCodeCoverageAction --> SourceResolveProcess : Config
    SourceResolveProcess --> CoverageLoadProcess : glob
    CoverageLoadProcess --> CoverageAnalysisProcess : CoverageData[]
    CoverageAnalysisProcess --> ReportProcess : CoverageResult
    ReportProcess ..> AggregateReporter : builds & calls
```

---

### 設定

| 種別 | 名前 | 役割 |
|---|---|---|
| クラス | `Config` | inputs をパースした設定値の集合 |
| クラス | `Thresholds` | lines / methods / conditionals それぞれの閾値設定を保持する |
| クラス | `ThresholdValue` | 単一メトリクスの warn / fail 閾値ペア |

### データモデル

| 種別 | 名前 | 役割 |
|---|---|---|
| インターフェース | `Jsonable` | `toJSON()` を定義するインターフェース。outputs に含まれるデータクラスが実装する |
| クラス | `Metrics` | statements / methods / conditionals の生カウント値を保持する。`Jsonable` を実装 |
| 抽象クラス | `SourceCode` | `SourceCodeMethod` / `SourceCodeStatement` の親クラス。`file`・`num`・`covered` の共通属性を持つ。`Jsonable` を実装 |
| クラス | `SourceCodeMethod` | メソッドの情報。`SourceCode` を継承し `name` を追加 |
| クラス | `SourceCodeStatement` | ステートメントの情報。`SourceCode` を継承 |
| 抽象クラス | `CoverageBase` | `CoverageData` / `CoverageResult` の親クラス。`name`・`metrics`・`methods`・`statements`・`files` の共通属性を持つ。`Jsonable` を実装 |
| クラス | `CoverageData` | `CoverageBase` を継承。パーサーが出力するパース済みの生データ。`result` / `thresholds` は持たない |
| クラス | `ThresholdValue` | 単一メトリクスの warn / fail 閾値ペア。`Jsonable` を実装 |
| クラス | `ThresholdResult` | `ThresholdValue` を継承し `result`（ok / warn / fail）を追加した閾値判定結果 |
| クラス | `Thresholds` | lines / methods / conditionals それぞれの閾値設定を保持する。`Jsonable` を実装 |
| クラス | `ThresholdResults` | `Thresholds` を継承し、各フィールドの型を `ThresholdResult` に特化したもの |
| クラス | `CoverageResult` | `CoverageBase` を継承。`result` / `thresholds` を追加した最終形。`report` output のシリアライズ対象 |

### パーサー

| 種別 | 名前 | 役割 |
|---|---|---|
| インターフェース | `Parser` | パーサーのインターフェース。`parse(content: string, filePath: string): CoverageData` を定義 |
| クラス | `CloverParser` | `Parser` の実装。Clover XML を `CoverageData` に変換する |
| クラス | `ParserFactory` | ファイルパスまたは内容からフォーマットを判別し、適切な `Parser` インスタンスを返す |

```mermaid
classDiagram
    direction LR

    class Parser {
        <<interface>>
        +parse(content: string, filePath: string) CoverageData
    }

    class CloverParser {
        +parse(content: string, filePath: string) CoverageData
    }

    class ParserFactory {
        +create(filePath: string) Parser
    }

    Parser <|.. CloverParser
    ParserFactory ..> Parser : creates
```

### プロセッサー

| 種別 | 名前 | 役割 |
|---|---|---|
| インターフェース | `CoverageProcessor` | `CoverageResult` に対する処理のインターフェース（Strategy パターン）。`process(result: CoverageResult, config: Config): CoverageResult` を定義 |
| クラス | `CoverageProcessorPipeline` | `CoverageProcessor` の実装。複数の `CoverageProcessor` を保持し順に実行する（Composite パターン） |
| クラス | `CoverageRateCalculator` | `CoverageProcessor` の実装。カバレッジのパーセンテージを計算して `CoverageResult` に付加する |
| クラス | `ThresholdEvaluator` | `CoverageProcessor` の実装。閾値判定を行い `result` / `thresholds` フィールドを設定する |
| クラス | `UncoveredMethodFilter` | `CoverageProcessor` の実装。未カバーメソッドを `uncoveredMethodsLimit` に従いフィルターする |

```mermaid
classDiagram
    direction LR

    class CoverageProcessor {
        <<interface>>
        +process(result: CoverageResult, config: Config) CoverageResult
    }

    class CoverageProcessorPipeline {
        -CoverageProcessor[] processors
        +process(result: CoverageResult, config: Config) CoverageResult
    }

    class CoverageRateCalculator {
        +process(result: CoverageResult, config: Config) CoverageResult
    }

    class ThresholdEvaluator {
        +process(result: CoverageResult, config: Config) CoverageResult
    }

    class UncoveredMethodFilter {
        +process(result: CoverageResult, config: Config) CoverageResult
    }

    CoverageProcessor <|.. CoverageProcessorPipeline
    CoverageProcessor <|.. CoverageRateCalculator
    CoverageProcessor <|.. ThresholdEvaluator
    CoverageProcessor <|.. UncoveredMethodFilter
    CoverageProcessorPipeline "1" *-- "*" CoverageProcessor : processors
```

### レポーター

| 種別 | 名前 | 役割 |
|---|---|---|
| インターフェース | `Reporter` | 出力処理のインターフェース。`report(result: CoverageResult, config: Config): Promise<void>` を定義 |
| クラス | `AggregateReporter` | `Reporter` の実装。複数の `Reporter` を保持し順に実行する（Composite パターン） |
| クラス | `StepSummaryReporter` | `Reporter` の実装。GitHub Step Summary に書き込む |
| クラス | `PullRequestReporter` | `Reporter` の実装（将来実装）。PR コメントに書き込む |

```mermaid
classDiagram
    direction LR

    class Reporter {
        <<interface>>
        +report(result: CoverageResult, config: Config) Promise~void~
    }

    class AggregateReporter {
        -Reporter[] reporters
        +report(result: CoverageResult, config: Config) Promise~void~
    }

    class StepSummaryReporter {
        +report(result: CoverageResult, config: Config) Promise~void~
    }

    class PullRequestReporter {
        <<将来実装>>
        +report(result: CoverageResult, config: Config) Promise~void~
    }

    Reporter <|.. AggregateReporter
    Reporter <|.. StepSummaryReporter
    Reporter <|.. PullRequestReporter
    AggregateReporter "1" *-- "*" Reporter : reporters
```

---

## 全体構成

```mermaid
classDiagram
    direction TB

    class Config {
        +string file
        +string artifact
        +boolean required
        +boolean stepSummary
        +string title
        +Thresholds thresholds
        +number uncoveredMethodsLimit
    }

    class Thresholds {
        +ThresholdValue|null lines
        +ThresholdValue|null methods
        +ThresholdValue|null conditionals
    }

    class ThresholdValue {
        +number warn
        +number fail
    }

    class Jsonable {
        <<interface>>
        +toJSON() Record~string_unknown~
    }

    class Metrics {
        +number statements
        +number coveredstatements
        +number methods
        +number coveredmethods
        +number conditionals
        +number coveredconditionals
    }

    class SourceCode {
        <<abstract>>
        +string file
        +number num
        +boolean covered
    }

    class SourceCodeMethod {
        +string name
    }

    class SourceCodeStatement {
    }

    class CoverageBase {
        <<abstract>>
        +string name
        +Metrics metrics
        +SourceCodeMethod[] methods
        +SourceCodeStatement[] statements
        +CoverageBase[] files
    }

    class CoverageData {
    }

    class ThresholdResult {
        +string result
    }

    class ThresholdResults {
    }

    class CoverageResult {
        +string result
        +ThresholdResults thresholds
    }

    class Parser {
        <<interface>>
        +parse(content: string, filePath: string) CoverageData
    }

    class CoverageProcessor {
        <<interface>>
        +process(result: CoverageResult, config: Config) CoverageResult
    }

    class Reporter {
        <<interface>>
        +report(result: CoverageResult, config: Config) Promise~void~
    }

    Jsonable <|.. Metrics
    Jsonable <|.. SourceCode
    Jsonable <|.. CoverageBase
    Jsonable <|.. ThresholdValue
    Jsonable <|.. Thresholds

    ThresholdValue <|-- ThresholdResult
    Thresholds <|-- ThresholdResults

    Config "1" *-- "1" Thresholds
    Thresholds "1" *-- "0..3" ThresholdValue

    SourceCode <|-- SourceCodeMethod
    SourceCode <|-- SourceCodeStatement

    CoverageBase <|-- CoverageData
    CoverageBase <|-- CoverageResult
    CoverageBase "1" *-- "1" Metrics
    CoverageBase "1" *-- "*" SourceCodeMethod
    CoverageBase "1" *-- "*" SourceCodeStatement
    CoverageBase "1" *-- "*" CoverageBase : files

    CoverageResult "1" *-- "1" ThresholdResults
    ThresholdResults "1" *-- "0..3" ThresholdResult

    Parser ..> CoverageData : produces
    CoverageProcessor ..> CoverageResult : transforms
    Reporter ..> CoverageResult : consumes
```

