import 'server-only'

import type { RawJobIntakeRecord } from '@/lib/jobs/contracts'
import { extractSalaryMetadata, normalizeWhitespace, stripHtml } from '@/lib/jobs/source-parsing'

import type { ImportedSourceBatch } from './greenhouse'

const jobspressoSourceKey = 'jobspresso'
const jobspressoSourceName = 'Jobspresso'
const jobspressoListingsUrl = 'https://jobspresso.co/jm-ajax/get_listings/?filter_job_type%5B%5D=designer'
const maxJobspressoPages = 6
const maxJobspressoListings = 60
const browserUserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'

interface JobspressoListingsPayload {
  found_jobs?: boolean
  html?: string
  max_num_pages?: number
}

interface JobspressoPostingRecord {
  description?: string
  employmentType?: string
  hiringOrganization?: {
    name?: string
  }
  identifier?: {
    value?: string
  }
  jobLocation?: {
    address?: string
  }
  title?: string
  datePosted?: string
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

function normalizeListingsPayload(value: unknown): JobspressoListingsPayload {
  const record = asRecord(value)

  if (!record) {
    return {
      found_jobs: false,
      html: '',
      max_num_pages: 0,
    }
  }

  return {
    found_jobs: Boolean(record.found_jobs),
    html: asString(record.html),
    max_num_pages: typeof record.max_num_pages === 'number' ? record.max_num_pages : 0,
  }
}

function extractListingUrls(html: string) {
  const urls = new Set<string>()

  for (const match of html.matchAll(/data-href="([^"]+)"/g)) {
    const url = asString(match[1])

    if (url.startsWith('https://jobspresso.co/job/')) {
      urls.add(url)
    }
  }

  return [...urls]
}

function extractApplicationUrl(html: string) {
  const linkMatch = html.match(/class="application_button_link button"[^>]*href="([^"]+)"/i)
  return asString(linkMatch?.[1])
}

function extractPostedAt(html: string, posting: JobspressoPostingRecord) {
  if (posting.datePosted) {
    return posting.datePosted
  }

  const metaMatch = html.match(/property="DC\.date\.issued"\s+content="([^"]+)"/i)
  return asString(metaMatch?.[1])
}

function extractPostingLocation(posting: JobspressoPostingRecord) {
  const jobLocation = posting.jobLocation
  const directAddress = asString(jobLocation?.address)

  if (directAddress) {
    return directAddress
  }

  return ''
}

function extractJobPosting(html: string) {
  for (const match of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    const block = asString(match[1])

    if (!block.includes('JobPosting')) {
      continue
    }

    try {
      const parsed = JSON.parse(block) as Record<string, unknown>
      const type = asString(parsed['@type'])

      if (type === 'JobPosting') {
        return parsed as JobspressoPostingRecord
      }
    } catch {
      continue
    }
  }

  return null
}

function extractSourceJobId(sourceUrl: string, posting: JobspressoPostingRecord | null) {
  const identifierValue = asString(posting?.identifier?.value)

  if (identifierValue) {
    return identifierValue
  }

  const match = sourceUrl.match(/\/job\/([^/]+)\/?$/)
  return asString(match?.[1])
}

async function fetchJobspressoDetail(url: string, capturedAt: string): Promise<RawJobIntakeRecord | null> {
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent': browserUserAgent,
    },
  })

  if (!response.ok) {
    return null
  }

  const html = await response.text()
  const posting = extractJobPosting(html)
  const titleRaw = normalizeWhitespace(asString(posting?.title))
  const companyNameRaw = normalizeWhitespace(asString(posting?.hiringOrganization?.name))
  const sourceJobId = extractSourceJobId(url, posting)

  if (!titleRaw || !companyNameRaw || !sourceJobId) {
    return null
  }

  const descriptionText = stripHtml(asString(posting?.description))
  const salaryMetadata = extractSalaryMetadata(descriptionText)
  const jobTypeMatch = html.match(/<div class="job-type [^"]+">([^<]+)<\/div>/i)

  return {
    applicationUrl: extractApplicationUrl(html) || url,
    capturedAt,
    companyNameRaw,
    descriptionText,
    locationRaw: extractPostingLocation(posting ?? {}) || undefined,
    metadata: {
      ...salaryMetadata,
      job_type: normalizeWhitespace(asString(jobTypeMatch?.[1])) || asString(posting?.employmentType) || undefined,
      source_key: jobspressoSourceKey,
    },
    postedAtRaw: extractPostedAt(html, posting ?? {}) || undefined,
    sourceJobId,
    sourceKey: jobspressoSourceKey,
    sourceKind: 'remote_board',
    sourceName: jobspressoSourceName,
    sourceUrl: url,
    titleRaw,
  }
}

export async function fetchJobspressoJobs(): Promise<ImportedSourceBatch> {
  try {
    const listingUrls = new Set<string>()
    let totalPages = 1

    for (let page = 1; page <= totalPages && page <= maxJobspressoPages; page += 1) {
      const response = await fetch(`${jobspressoListingsUrl}&page=${page}`, {
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          'User-Agent': browserUserAgent,
        },
      })

      if (!response.ok) {
        return {
          issue: `Jobspresso returned ${response.status}.`,
          provider: 'jobspresso',
          rawJobs: [],
          rowsSeen: 0,
          sourceKey: jobspressoSourceKey,
          sourceKind: 'remote_board',
          sourceName: jobspressoSourceName,
        }
      }

      const payload = normalizeListingsPayload(await response.json())

      if (page === 1) {
        totalPages = Math.min(payload.max_num_pages ?? 1, maxJobspressoPages)
      }

      for (const url of extractListingUrls(asString(payload.html))) {
        listingUrls.add(url)

        if (listingUrls.size >= maxJobspressoListings) {
          break
        }
      }

      if (listingUrls.size >= maxJobspressoListings || payload.found_jobs === false) {
        break
      }
    }

    const capturedAt = new Date().toISOString()
    const rawJobs = (
      await Promise.all([...listingUrls].map((url) => fetchJobspressoDetail(url, capturedAt)))
    ).filter((item): item is RawJobIntakeRecord => item !== null)

    if (listingUrls.size > 0 && rawJobs.length === 0) {
      return {
        issue: 'Jobspresso listings were discovered, but none could be normalized from detail pages.',
        provider: 'jobspresso',
        rawJobs: [],
        rowsSeen: listingUrls.size,
        sourceKey: jobspressoSourceKey,
        sourceKind: 'remote_board',
        sourceName: jobspressoSourceName,
      }
    }

    return {
      provider: 'jobspresso',
      rawJobs,
      rowsSeen: listingUrls.size,
      sourceKey: jobspressoSourceKey,
      sourceKind: 'remote_board',
      sourceName: jobspressoSourceName,
    }
  } catch (error) {
    return {
      issue: error instanceof Error ? error.message : 'Jobspresso import failed.',
      provider: 'jobspresso',
      rawJobs: [],
      rowsSeen: 0,
      sourceKey: jobspressoSourceKey,
      sourceKind: 'remote_board',
      sourceName: jobspressoSourceName,
    }
  }
}
