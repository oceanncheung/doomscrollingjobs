import 'server-only'

import type { CompensationPeriod, RawJobIntakeRecord } from '@/lib/jobs/contracts'
import { normalizeWhitespace } from '@/lib/jobs/source-parsing'

import type { ImportedSourceBatch } from './greenhouse'

const remoteSourceKey = 'remote-source'
const remoteSourceName = 'Remote Source'
const remoteSourceListingsUrl = 'https://www.remotesource.com/remote-jobs/design'
const browserUserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'

interface RemoteSourceCompanyRecord {
  atsName?: string
  atsToken?: string
  description?: string
  industry?: string
  isRemoteFirst?: boolean
  name?: string
  size?: string
  websiteUrl?: string
}

interface RemoteSourceJobRecord {
  company?: RemoteSourceCompanyRecord
  experienceLevel?: string
  id?: number | string
  isInternship?: boolean
  isLeadership?: boolean
  jobCategory?: string
  jobType?: string
  location?: string
  postedAt?: string
  salaryCurrency?: string
  salaryMax?: number
  salaryMin?: number
  salaryPeriod?: string
  slug?: string
  title?: string
  uuid?: string
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

function asOptionalNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function cleanSerializedDate(value: string) {
  return value.replace(/^\$D/, '').trim()
}

function normalizeSalaryPeriod(value: string): CompensationPeriod {
  const normalized = value.toLowerCase()

  if (normalized.includes('hour')) {
    return 'hourly'
  }

  if (normalized.includes('month')) {
    return 'monthly'
  }

  if (normalized.includes('week')) {
    return 'weekly'
  }

  if (normalized.includes('day')) {
    return 'daily'
  }

  if (normalized.includes('contract')) {
    return 'contract'
  }

  if (normalized.includes('year')) {
    return 'annual'
  }

  return 'unknown'
}

function extractInitialJobsPayload(html: string) {
  const match = html.match(/initialJobs\\":(\[[\s\S]*?\]),\\"initialTotalCount\\":\\"?([0-9]+)\\"?/)

  if (!match) {
    return {
      jobs: [] as RemoteSourceJobRecord[],
      rowsSeen: 0,
    }
  }

  try {
    return {
      jobs: JSON.parse(match[1].replace(/\\"/g, '"')) as RemoteSourceJobRecord[],
      rowsSeen: Number.parseInt(match[2] ?? '', 10) || 0,
    }
  } catch {
    return {
      jobs: [] as RemoteSourceJobRecord[],
      rowsSeen: 0,
    }
  }
}

function normalizeRemoteSourceJob(item: RemoteSourceJobRecord, capturedAt: string): RawJobIntakeRecord | null {
  const slug = asString(item.slug)
  const sourceJobId = asString(item.uuid) || asString(item.id) || slug
  const titleRaw = normalizeWhitespace(asString(item.title))
  const companyNameRaw = normalizeWhitespace(asString(item.company?.name))
  const sourceUrl = slug ? `https://www.remotesource.com/jobs/${slug}` : ''

  if (!sourceJobId || !titleRaw || !companyNameRaw || !sourceUrl) {
    return null
  }

  const companyDescription = normalizeWhitespace(asString(item.company?.description))
  const jobCategory = normalizeWhitespace(asString(item.jobCategory))
  const jobType = normalizeWhitespace(asString(item.jobType))
  const experienceLevel = normalizeWhitespace(asString(item.experienceLevel))
  const locationRaw = normalizeWhitespace(asString(item.location))
  const descriptionText = normalizeWhitespace(
    [titleRaw, companyDescription, jobCategory, experienceLevel, locationRaw].filter(Boolean).join('. '),
  )

  return {
    applicationUrl: sourceUrl,
    capturedAt,
    companyNameRaw,
    compensationRaw:
      item.salaryMin || item.salaryMax
        ? [item.salaryMin ? String(item.salaryMin) : '', item.salaryMax ? String(item.salaryMax) : '']
            .filter(Boolean)
            .join('-')
        : undefined,
    descriptionText,
    locationRaw: locationRaw || undefined,
    metadata: {
      ats_name: asString(item.company?.atsName) || undefined,
      ats_token: asString(item.company?.atsToken) || undefined,
      category: jobCategory || undefined,
      company_industry: normalizeWhitespace(asString(item.company?.industry)) || undefined,
      company_remote_first: item.company?.isRemoteFirst ?? undefined,
      company_size: normalizeWhitespace(asString(item.company?.size)) || undefined,
      company_website_url: asString(item.company?.websiteUrl) || undefined,
      experience_level: experienceLevel || undefined,
      job_type: jobType || undefined,
      salary_currency: asString(item.salaryCurrency) || undefined,
      salary_max: asOptionalNumber(item.salaryMax),
      salary_min: asOptionalNumber(item.salaryMin),
      salary_period: normalizeSalaryPeriod(asString(item.salaryPeriod)),
      source_key: remoteSourceKey,
      tags: [jobCategory, experienceLevel].filter(Boolean),
    },
    postedAtRaw: cleanSerializedDate(asString(item.postedAt)) || undefined,
    sourceJobId,
    sourceKey: remoteSourceKey,
    sourceKind: 'remote_board',
    sourceName: remoteSourceName,
    sourceUrl,
    titleRaw,
  }
}

export async function fetchRemoteSourceJobs(): Promise<ImportedSourceBatch> {
  try {
    const response = await fetch(remoteSourceListingsUrl, {
      cache: 'no-store',
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': browserUserAgent,
      },
    })

    if (!response.ok) {
      return {
        issue: `Remote Source returned ${response.status}.`,
        provider: 'remotesource',
        rawJobs: [],
        rowsSeen: 0,
        sourceKey: remoteSourceKey,
        sourceKind: 'remote_board',
        sourceName: remoteSourceName,
      }
    }

    const html = await response.text()
    const payload = extractInitialJobsPayload(html)
    const capturedAt = new Date().toISOString()
    const rawJobs = payload.jobs
      .map((item) => normalizeRemoteSourceJob(item, capturedAt))
      .filter((item): item is RawJobIntakeRecord => item !== null)

    if (payload.rowsSeen > 0 && rawJobs.length === 0) {
      return {
        issue: 'Remote Source category page loaded, but its job payload could not be normalized.',
        provider: 'remotesource',
        rawJobs: [],
        rowsSeen: payload.rowsSeen,
        sourceKey: remoteSourceKey,
        sourceKind: 'remote_board',
        sourceName: remoteSourceName,
      }
    }

    return {
      provider: 'remotesource',
      rawJobs,
      rowsSeen: rawJobs.length,
      sourceKey: remoteSourceKey,
      sourceKind: 'remote_board',
      sourceName: remoteSourceName,
    }
  } catch (error) {
    return {
      issue: error instanceof Error ? error.message : 'Remote Source import failed.',
      provider: 'remotesource',
      rawJobs: [],
      rowsSeen: 0,
      sourceKey: remoteSourceKey,
      sourceKind: 'remote_board',
      sourceName: remoteSourceName,
    }
  }
}
