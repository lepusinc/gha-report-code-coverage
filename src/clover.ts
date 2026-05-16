import { XMLParser } from 'fast-xml-parser'

export interface CloverMetrics {
  statements: number
  coveredStatements: number
  methods: number
  coveredMethods: number
}

export interface CoverageFile {
  label: string
  metrics: CloverMetrics
}

export function parseCloverXml(xml: string): CloverMetrics | null {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
  const doc = parser.parse(xml)

  const project = doc?.coverage?.project ?? doc?.project
  if (!project) return null

  const metrics = project.metrics
  if (!metrics) return null

  return {
    statements: Number(metrics['@_statements'] ?? 0),
    coveredStatements: Number(metrics['@_coveredstatements'] ?? 0),
    methods: Number(metrics['@_methods'] ?? 0),
    coveredMethods: Number(metrics['@_coveredmethods'] ?? 0),
  }
}

export function coveragePercent(covered: number, total: number): number {
  return total > 0 ? (covered / total) * 100 : 0
}
