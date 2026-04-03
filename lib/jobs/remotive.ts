import 'server-only'

import type { RawJobIntakeRecord } from '@/lib/jobs/contracts'

import type { ImportedSourceBatch } from './greenhouse'

const remotiveSourceKey = 'remotive'
const remotiveSourceName = 'Remotive'
const remotiveSourceUrl = 'https://remotive.com/api/remote-jobs?category=design&limit=120'

interface RemotiveJobRecord {
  candidate_required_location?: string
  category?: string
  company_name?: string
  description?: string
  id?: number | string
  job_type?: string
  publication_date?: string
  salary?: string
  tags?: string[]
  title?: string
  url?: string
}

interface RemotiveJobsPayload {
  jobs?: RemotiveJobRecord[]
  'job-count'?: number
}

function asString(value: unknown) {
  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  return ''
}

function asRecord(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []
}

function parseSalaryAmount(raw: string) {
  const normalized = raw.replace(/,/g, '').trim()
  const match = normalized.match(/^(\d+(?:\.\d+)?)([kK])?$/)

  if (!match) {
    return undefined
  }

  const numeric = Number.parseFloat(match[1] ?? '')

  if (!Number.isFinite(numeric)) {
    return undefined
  }

  return match[2] ? numeric * 1000 : numeric
}

function parseSalaryRange(raw: string) {
  const matches = [...raw.matchAll(/(\d[\d,.]*(?:\.\d+)?)\s*([kK])?/g)]
    .map((match) => parseSalaryAmount(`${match[1] ?? ''}${match[2] ?? ''}`))
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))

  if (matches.length === 0) {
    return {}
  }

  const [first, second] = matches
  const ordered = [first, second ?? first].sort((left, right) => left - right)

  return {
    salary_max: Math.round(ordered[1] ?? ordered[0] ?? 0),
    salary_min: Math.round(ordered[0] ?? 0),
  }
}

function normalizePayload(value: unknown): RemotiveJobsPayload {
  const record = asRecord(value)

  if (!record) {
    return {
      jobs: [],
      'job-count': 0,
    }
  }

  return {
    jobs: Array.isArray(record.jobs) ? (record.jobs as RemotiveJobRecord[]) : [],
    'job-count': typeof record['job-count'] === 'number' ? record['job-count'] : 0,
  }
}

function normalizeRemotiveRawJob(item: RemotiveJobRecord, capturedAt: string): RawJobIntakeRecord | null {
  const sourceJobId = asString(item.id)
  const sourceUrl = asString(item.url)
  const titleRaw = asString(item.title)
  const companyNameRaw = asString(item.company_name)

  if (!sourceJobId || !sourceUrl || !titleRaw || !companyNameRaw) {
    return null
  }

  const salaryRaw = asString(item.salary)

  return {
    applicationUrl: sourceUrl,
    capturedAt,
    companyNameRaw,
    compensationRaw: salaryRaw || undefined,
    descriptionText: asString(item.description),
    locationRaw: asString(item.candidate_required_location) || undefined,
    metadata: {
      ...parseSalaryRange(salaryRaw),
      category: asString(item.category) || undefined,
      job_type: asString(item.job_type) || undefined,
      source_key: remotiveSourceKey,
      tags: asStringArray(item.tags),
    },
    postedAtRaw: asString(item.publication_date) || undefined,
    sourceKey: remotiveSourceKey,
    sourceKind: 'remote_board',
    sourceJobId,
    sourceName: remotiveSourceName,
    sourceUrl,
    titleRaw,
  }
}

export async function fetchRemotiveJobs(): Promise<ImportedSourceBatch> {
  try {
    const response = await fetch(remotiveSourceUrl, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      return {
        issue: `Remotive returned ${response.status}.`,
        provider: 'remotive',
        rawJobs: [],
        rowsSeen: 0,
        sourceKey: remotiveSourceKey,
        sourceKind: 'remote_board',
        sourceName: remotiveSourceName,
      }
    }

    const payload = normalizePayload(await response.json())
    const capturedAt = new Date().toISOString()
    const rawJobs = (payload.jobs ?? [])
      .map((item) => normalizeRemotiveRawJob(item, capturedAt))
      .filter((item): item is RawJobIntakeRecord => item !== null)

    return {
      provider: 'remotive',
      rawJobs,
      rowsSeen: payload['job-count'] ?? rawJobs.length,
      sourceKey: remotiveSourceKey,
      sourceKind: 'remote_board',
      sourceName: remotiveSourceName,
    }
  } catch (error) {
    return {
      issue: error instanceof Error ? error.message : 'Remotive import failed.',
      provider: 'remotive',
      rawJobs: [],
      rowsSeen: 0,
      sourceKey: remotiveSourceKey,
      sourceKind: 'remote_board',
      sourceName: remotiveSourceName,
    }
  }
}
