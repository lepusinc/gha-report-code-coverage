import * as core from '@actions/core'
import * as fs from 'fs'
import * as path from 'path'
import { DefaultArtifactClient } from '@actions/artifact'
import { minimatch } from 'minimatch'
import { parseCloverXml, coveragePercent, type CloverMetrics } from './clover'

async function downloadById(artifactId: number, destDir: string): Promise<void> {
  const client = new DefaultArtifactClient()
  await client.downloadArtifact(artifactId, { path: destDir })
}

async function downloadByPattern(pattern: string, destDir: string): Promise<void> {
  const client = new DefaultArtifactClient()
  const { artifacts } = await client.listArtifacts({ latest: true })

  const matched = artifacts.filter(a => minimatch(a.name, pattern))

  if (matched.length === 0) {
    core.warning(`No artifacts matched pattern: ${pattern}`)
    return
  }

  for (const artifact of matched) {
    await client.downloadArtifact(artifact.id, {
      path: path.join(destDir, artifact.name),
    })
  }
}

function findXmlFiles(dir: string): string[] {
  const results: string[] = []
  if (!fs.existsSync(dir)) return results

  function walk(current: string): void {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) {
        walk(full)
      } else if (entry.name.endsWith('.xml')) {
        results.push(full)
      }
    }
  }
  walk(dir)
  return results.sort()
}

interface SectionResult {
  label: string
  lineRate: number
  methodRate: number
  metrics: CloverMetrics
}

async function run(): Promise<void> {
  const artifactId = core.getInput('artifact-id')
  const artifactPattern = core.getInput('artifact-pattern')
  const title = core.getInput('title') || 'Coverage'
  const thresholds = core.getInput('thresholds').trim()

  const destDir = 'coverage-results'

  if (artifactId) {
    await downloadById(Number(artifactId), destDir)
  } else if (artifactPattern) {
    await downloadByPattern(artifactPattern, destDir)
  }

  const xmlFiles = findXmlFiles(destDir)

  let overallStatements = 0
  let overallCovered = 0
  const sections: SectionResult[] = []

  for (const xmlFile of xmlFiles) {
    const parentDir = path.basename(path.dirname(xmlFile))
    const label = parentDir === destDir ? '' : parentDir

    let xml: string
    try {
      xml = fs.readFileSync(xmlFile, 'utf-8')
    } catch {
      continue
    }

    const metrics = parseCloverXml(xml)
    if (!metrics) continue

    overallStatements += metrics.statements
    overallCovered += metrics.coveredStatements

    sections.push({
      label,
      lineRate: coveragePercent(metrics.coveredStatements, metrics.statements),
      methodRate: coveragePercent(metrics.coveredMethods, metrics.methods),
      metrics,
    })
  }

  const summary = core.summary.addHeading(title, 2)

  if (sections.length === 0) {
    summary.addRaw('_No coverage data found._\n')
  } else {
    for (const section of sections) {
      if (section.label) {
        summary.addHeading(section.label, 3)
      }
      summary.addTable([
        [
          { data: '', header: true },
          { data: 'Coverage', header: true },
        ],
        [
          'Lines',
          `${section.lineRate.toFixed(1)}% (${section.metrics.coveredStatements}/${section.metrics.statements})`,
        ],
        [
          'Methods',
          `${section.methodRate.toFixed(1)}% (${section.metrics.coveredMethods}/${section.metrics.methods})`,
        ],
      ])
    }
  }

  await summary.write()

  if (thresholds && overallStatements > 0) {
    const parts = thresholds.split(/\s+/)
    const warnT = parts[0] ? parseFloat(parts[0]) : null
    const failT = parts[1] ? parseFloat(parts[1]) : null
    const overallRate = coveragePercent(overallCovered, overallStatements)

    if (failT !== null && overallRate < failT) {
      core.setFailed(
        `Line coverage ${overallRate.toFixed(1)}% is below the failure threshold of ${failT.toFixed(0)}%`,
      )
    } else if (warnT !== null && overallRate < warnT) {
      core.warning(
        `Line coverage ${overallRate.toFixed(1)}% is below the warning threshold of ${warnT.toFixed(0)}%`,
      )
    }
  }
}

run().catch(err => core.setFailed(String(err)))
