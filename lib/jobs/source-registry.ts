import 'server-only'

import { getActiveOperatorContext } from '@/lib/data/operators'
import type { JobSourceKind, SourceDiagnostics } from '@/lib/jobs/contracts'
import { createClient } from '@/lib/supabase/server'

export interface SourceRegistryEntry {
  baseUrl: string
  displayName: string
  metadata: Record<string, unknown>
  provider: string
  slug: string
  sourceKind: JobSourceKind
}

export interface CompanyWatchlistEntry {
  atsBoardToken?: string
  careerPageUrl: string
  companyName: string
  companySlug: string
  metadata: Record<string, unknown>
  priority: number
  sourceKey: string
  sourceName: string
  sourceRegistrySlug: string
}

const defaultSourceRegistry: SourceRegistryEntry[] = [
  {
    baseUrl: 'https://remoteok.com/api',
    displayName: 'Remote OK',
    metadata: {},
    provider: 'remoteok',
    slug: 'remote-ok',
    sourceKind: 'remote_board',
  },
  {
    baseUrl: 'https://remotive.com/api/remote-jobs',
    displayName: 'Remotive',
    metadata: {
      category: 'design',
    },
    provider: 'remotive',
    slug: 'remotive',
    sourceKind: 'remote_board',
  },
  {
    baseUrl: 'https://wellfound.com/role/r/designer?location=remote',
    displayName: 'Wellfound',
    metadata: {
      role: 'designer',
    },
    provider: 'wellfound',
    slug: 'wellfound',
    sourceKind: 'remote_board',
  },
  {
    baseUrl: 'https://jobspresso.co/jm-ajax/get_listings/?filter_job_type%5B%5D=designer',
    displayName: 'Jobspresso',
    metadata: {
      category: 'design',
    },
    provider: 'jobspresso',
    slug: 'jobspresso',
    sourceKind: 'remote_board',
  },
  {
    baseUrl: 'https://weworkremotely.com/categories/remote-design-jobs.rss',
    displayName: 'We Work Remotely',
    metadata: {
      format: 'rss',
    },
    provider: 'weworkremotely',
    slug: 'we-work-remotely',
    sourceKind: 'remote_board',
  },
  {
    baseUrl: 'https://authenticjobs.com/?feed=job_feed',
    displayName: 'Authentic Jobs',
    metadata: {
      format: 'rss',
    },
    provider: 'authenticjobs',
    slug: 'authentic-jobs',
    sourceKind: 'remote_board',
  },
  {
    baseUrl: 'https://www.remotesource.com/remote-jobs/design',
    displayName: 'Remote Source',
    metadata: {
      category: 'design',
    },
    provider: 'remotesource',
    slug: 'remote-source',
    sourceKind: 'remote_board',
  },
  {
    baseUrl: 'https://boards-api.greenhouse.io/v1/boards',
    displayName: 'Greenhouse ATS',
    metadata: {
      canonicalHostPattern: 'job-boards.greenhouse.io',
    },
    provider: 'greenhouse',
    slug: 'greenhouse-ats',
    sourceKind: 'ats_hosted_job_page',
  },
]

const defaultCompanyWatchlist: CompanyWatchlistEntry[] = [
  {
    atsBoardToken: 'fluxon',
    careerPageUrl: 'https://job-boards.greenhouse.io/fluxon',
    companyName: 'Fluxon',
    companySlug: 'fluxon',
    metadata: {
      regionHint: 'Europe',
    },
    priority: 5,
    sourceKey: 'greenhouse:fluxon',
    sourceName: 'Fluxon Careers',
    sourceRegistrySlug: 'greenhouse-ats',
  },
  {
    atsBoardToken: 'metalab',
    careerPageUrl: 'https://job-boards.greenhouse.io/metalab',
    companyName: 'Metalab',
    companySlug: 'metalab',
    metadata: {
      regionHint: 'Americas',
    },
    priority: 10,
    sourceKey: 'greenhouse:metalab',
    sourceName: 'Metalab Careers',
    sourceRegistrySlug: 'greenhouse-ats',
  },
  {
    atsBoardToken: 'ninjatrader',
    careerPageUrl: 'https://job-boards.greenhouse.io/ninjatrader',
    companyName: 'NinjaTrader',
    companySlug: 'ninjatrader',
    metadata: {
      regionHint: 'United States',
    },
    priority: 20,
    sourceKey: 'greenhouse:ninjatrader',
    sourceName: 'NinjaTrader Careers',
    sourceRegistrySlug: 'greenhouse-ats',
  },
  {
    atsBoardToken: 'universalaudio',
    careerPageUrl: 'https://job-boards.greenhouse.io/universalaudio',
    companyName: 'Universal Audio',
    companySlug: 'universalaudio',
    metadata: {
      regionHint: 'United States',
    },
    priority: 30,
    sourceKey: 'greenhouse:universalaudio',
    sourceName: 'Universal Audio Careers',
    sourceRegistrySlug: 'greenhouse-ats',
  },
  {
    atsBoardToken: 'flohealth',
    careerPageUrl: 'https://job-boards.greenhouse.io/flohealth',
    companyName: 'Flo Health',
    companySlug: 'flohealth',
    metadata: {
      regionHint: 'Europe',
    },
    priority: 40,
    sourceKey: 'greenhouse:flohealth',
    sourceName: 'Flo Health Careers',
    sourceRegistrySlug: 'greenhouse-ats',
  },
  {
    atsBoardToken: 'appspace',
    careerPageUrl: 'https://job-boards.greenhouse.io/appspace',
    companyName: 'Appspace',
    companySlug: 'appspace',
    metadata: {
      regionHint: 'Europe',
    },
    priority: 50,
    sourceKey: 'greenhouse:appspace',
    sourceName: 'Appspace Careers',
    sourceRegistrySlug: 'greenhouse-ats',
  },
]

const seededDemoSourceNames = new Set(['Company Careers', 'Remote Design Board'])

function asRecord(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function normalizeRegistryRows(rows: unknown[]) {
  return rows
    .map((row) => {
      const record = asRecord(row)

      if (!record) {
        return null
      }

      const slug = asString(record.slug)
      const displayName = asString(record.display_name)
      const sourceKind = asString(record.source_kind) as JobSourceKind

      if (!slug || !displayName || !sourceKind) {
        return null
      }

      return {
        baseUrl: asString(record.base_url),
        displayName,
        metadata: asRecord(record.metadata) ?? {},
        provider: asString(record.provider),
        slug,
        sourceKind,
      } satisfies SourceRegistryEntry
    })
    .filter((row): row is SourceRegistryEntry => row !== null)
}

function normalizeWatchlistRows(rows: unknown[]) {
  const normalized: CompanyWatchlistEntry[] = []

  for (const row of rows) {
    const record = asRecord(row)

    if (!record) {
      continue
    }

    const companyName = asString(record.company_name)
    const companySlug = asString(record.company_slug)
    const sourceKey = asString(record.source_key)
    const sourceName = asString(record.source_name)
    const sourceRegistrySlug = asString(record.source_registry_slug)

    if (!companyName || !companySlug || !sourceKey || !sourceName || !sourceRegistrySlug) {
      continue
    }

    const atsBoardToken = asString(record.ats_board_token)
    const normalizedEntry: CompanyWatchlistEntry = {
      careerPageUrl: asString(record.career_page_url),
      companyName,
      companySlug,
      metadata: asRecord(record.metadata) ?? {},
      priority: asNumber(record.priority, 100),
      sourceKey,
      sourceName,
      sourceRegistrySlug,
      ...(atsBoardToken ? { atsBoardToken } : {}),
    }

    normalized.push(normalizedEntry)
  }

  return normalized
}

function mergeRegistryEntries(entries: SourceRegistryEntry[]) {
  const merged = new Map(defaultSourceRegistry.map((entry) => [entry.slug, entry] as const))

  for (const entry of entries) {
    merged.set(entry.slug, entry)
  }

  return [...merged.values()]
}

function mergeWatchlistEntries(entries: CompanyWatchlistEntry[]) {
  const merged = new Map(defaultCompanyWatchlist.map((entry) => [entry.sourceKey, entry] as const))

  for (const entry of entries) {
    merged.set(entry.sourceKey, entry)
  }

  return [...merged.values()].sort((left, right) => left.priority - right.priority)
}

export async function getSourceRegistry() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('source_registry')
      .select('slug, display_name, source_kind, provider, base_url, metadata, is_active')
      .eq('is_active', true)
      .order('display_name', { ascending: true })

    if (error || !data || data.length === 0) {
      return defaultSourceRegistry
    }

    const rows = normalizeRegistryRows(data).filter((row) => row.provider.length > 0)
    return rows.length > 0 ? mergeRegistryEntries(rows) : defaultSourceRegistry
  } catch {
    return defaultSourceRegistry
  }
}

export async function getCompanyWatchlist() {
  try {
    const operatorContext = await getActiveOperatorContext()

    if (!operatorContext) {
      return defaultCompanyWatchlist
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('company_watchlist')
      .select(
        `
          company_name,
          company_slug,
          career_page_url,
          ats_board_token,
          priority,
          metadata,
          source_key,
          source_name,
          source_registry:source_registry_id (
            slug
          )
        `,
      )
      .eq('operator_id', operatorContext.operator.id)
      .eq('is_active', true)
      .order('priority', { ascending: true })

    if (error || !data || data.length === 0) {
      return defaultCompanyWatchlist
    }

    const rows = normalizeWatchlistRows(
      data.map((row) => {
        const record = asRecord(row)
        const sourceRegistry = asRecord(record?.source_registry)

        return {
          ...record,
          source_registry_slug: asString(sourceRegistry?.slug),
        }
      }),
    )

    return rows.length > 0 ? mergeWatchlistEntries(rows) : defaultCompanyWatchlist
  } catch {
    return defaultCompanyWatchlist
  }
}

export function getSourceRegistryBySlug(registry: SourceRegistryEntry[]) {
  return new Map(registry.map((entry) => [entry.slug, entry] as const))
}

export function isImportedSourceName(sourceName: string) {
  return !seededDemoSourceNames.has(sourceName)
}

export function getImportedSourceNames(
  registry: SourceRegistryEntry[],
  watchlist: CompanyWatchlistEntry[],
) {
  return new Set([
    ...registry
      .filter((entry) => entry.sourceKind === 'remote_board' || entry.sourceKind === 'company_career_page')
      .map((entry) => entry.displayName),
    ...watchlist.map((entry) => entry.sourceName),
  ])
}

async function getSourceDescriptorBySourceName() {
  const [registry, watchlist] = await Promise.all([getSourceRegistry(), getCompanyWatchlist()])
  const descriptors = new Map<
    string,
    Pick<SourceDiagnostics, 'provider' | 'sourceKey' | 'sourceKind' | 'sourceName'>
  >()

  for (const entry of registry) {
    descriptors.set(entry.displayName, {
      provider: entry.provider,
      sourceKey: entry.slug,
      sourceKind: entry.sourceKind,
      sourceName: entry.displayName,
    })
  }

  for (const entry of watchlist) {
    const registryEntry = registry.find((item) => item.slug === entry.sourceRegistrySlug)

    descriptors.set(entry.sourceName, {
      provider: registryEntry?.provider ?? entry.sourceRegistrySlug,
      sourceKey: entry.sourceKey,
      sourceKind: registryEntry?.sourceKind ?? 'company_career_page',
      sourceName: entry.sourceName,
    })
  }

  return descriptors
}

export async function saveSourceDiagnostics(diagnostics: SourceDiagnostics[]) {
  if (diagnostics.length === 0) {
    return undefined
  }

  try {
    const supabase = createClient()
    await supabase.from('source_sync_diagnostics').upsert(
      diagnostics.map((entry) => ({
        issue: entry.issue ?? null,
        provider: entry.provider,
        rows_candidate: entry.rowsCandidate,
        rows_deduped: entry.rowsDeduped,
        rows_excluded: entry.rowsExcluded,
        rows_imported: entry.rowsImported,
        rows_normalized: entry.rowsNormalized,
        rows_qualified: entry.rowsQualified,
        rows_seen: entry.rowsSeen,
        rows_stale: entry.rowsStale,
        rows_visible: entry.rowsVisible,
        source_key: entry.sourceKey,
        source_kind: entry.sourceKind,
        source_name: entry.sourceName,
        sync_metadata: {
          provider: entry.provider,
        },
        synced_at: new Date().toISOString(),
      })),
      {
        onConflict: 'source_key',
      },
    )
  } catch {
    return 'Source diagnostics could not be persisted.'
  }

  return undefined
}

export async function saveSourceQueueCoverage(
  qualifiedCounts: Map<string, number>,
  visibleCounts: Map<string, number>,
) {
  const sourceNames = new Set([...qualifiedCounts.keys(), ...visibleCounts.keys()])

  if (sourceNames.size === 0) {
    return undefined
  }

  try {
    const descriptorByName = await getSourceDescriptorBySourceName()
    const supabase = createClient()
    const sourceKeys = [...sourceNames]
      .map((sourceName) => descriptorByName.get(sourceName)?.sourceKey ?? '')
      .filter(Boolean)
    const { data: existingRows } = sourceKeys.length
      ? await supabase
          .from('source_sync_diagnostics')
          .select(
            'source_key, rows_seen, rows_candidate, rows_excluded, rows_deduped, rows_imported, rows_stale, rows_normalized',
          )
          .in('source_key', sourceKeys)
      : { data: [] }
    const existingBySourceKey = new Map(
      ((existingRows as Array<Record<string, unknown>> | null) ?? []).map((row) => [asString(row.source_key), row] as const),
    )
    await supabase.from('source_sync_diagnostics').upsert(
      [...sourceNames]
        .map((sourceName) => {
          const descriptor = descriptorByName.get(sourceName)

          if (!descriptor) {
            return null
          }

          const existing = existingBySourceKey.get(descriptor.sourceKey)

          return {
            provider: descriptor.provider,
            rows_candidate: asNumber(existing?.rows_candidate),
            rows_deduped: asNumber(existing?.rows_deduped),
            rows_excluded: asNumber(existing?.rows_excluded),
            rows_imported: asNumber(existing?.rows_imported),
            rows_normalized: asNumber(existing?.rows_normalized),
            rows_qualified: qualifiedCounts.get(sourceName) ?? 0,
            rows_seen: asNumber(existing?.rows_seen),
            rows_stale: asNumber(existing?.rows_stale),
            rows_visible: visibleCounts.get(sourceName) ?? 0,
            source_key: descriptor.sourceKey,
            source_kind: descriptor.sourceKind,
            source_name: descriptor.sourceName,
            sync_metadata: {
              provider: descriptor.provider,
            },
            synced_at: new Date().toISOString(),
          }
        })
        .filter((entry) => entry !== null),
      {
        ignoreDuplicates: false,
        onConflict: 'source_key',
      },
    )
  } catch {
    return 'Source queue coverage could not be persisted.'
  }

  return undefined
}

export function summarizeSourceDiagnostics(diagnostics: SourceDiagnostics[]) {
  const successfulSources = diagnostics.filter((entry) => entry.rowsImported > 0)

  if (successfulSources.length === 0) {
    return ''
  }

  return successfulSources
    .map((entry) => `${entry.sourceName}: ${entry.rowsImported}`)
    .join(' · ')
}

export function sourcePreferenceWeight(sourceKind: JobSourceKind) {
  switch (sourceKind) {
    case 'company_career_page':
      return 3
    case 'ats_hosted_job_page':
      return 2
    default:
      return 1
  }
}

export function isRemoteBoardSource(entry: SourceRegistryEntry) {
  return entry.sourceKind === 'remote_board'
}

export function isActiveRegistryEntry(entry: SourceRegistryEntry | null | undefined) {
  return Boolean(entry && entry.slug && entry.displayName && entry.provider)
}

export function hasActiveWatchlist(entries: CompanyWatchlistEntry[]) {
  return entries.some((entry) => entry.priority >= 0)
}
