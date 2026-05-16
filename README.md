# gha-report-code-coverage

GitHub Action to download Clover XML coverage artifacts and output a summary to [GitHub Step Summary](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/adding-a-workflow-summary).

Works with any language that produces Clover XML: PHP (PHPUnit, Pest), Ruby (SimpleCov), JavaScript (Jest), and more.

## Inputs

| Input | Default | Description |
|---|---|---|
| `artifact-id` | `''` | Artifact ID to download. Mutually exclusive with `artifact-pattern`. |
| `artifact-pattern` | `''` | Glob pattern to match artifact names (e.g. `"coverage *"`). Useful for matrix builds. Mutually exclusive with `artifact-id`. |
| `title` | `'Coverage'` | Heading text in the Step Summary. |
| `thresholds` | `''` | Space-separated warn/fail thresholds (e.g. `'60 80'`). Checked against overall line coverage. Empty = no check. |

## Usage

### Single artifact (by ID)

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

### Matrix build (by pattern)

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

### Thresholds

The `thresholds` input takes two space-separated numbers: `"<warn> <fail>"`.

- If overall line coverage drops below the **fail** threshold, the action exits with an error.
- If it drops below the **warn** threshold (but not fail), a warning annotation is emitted.

```yaml
- uses: lepusinc/gha-report-code-coverage@v1
  with:
    artifact-pattern: 'coverage *'
    thresholds: '60 80'  # warn at <60%, fail at <80%
```

## License

MIT
