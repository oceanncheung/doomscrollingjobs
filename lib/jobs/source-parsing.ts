import 'server-only'

import type { CompensationPeriod } from '@/lib/jobs/contracts'

const namedEntities: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  hellip: '...',
  lt: '<',
  mdash: '-',
  nbsp: ' ',
  ndash: '-',
  quot: '"',
}

function decodeNumericEntity(value: string, base: number) {
  const parsed = Number.parseInt(value, base)

  if (!Number.isFinite(parsed)) {
    return ''
  }

  return String.fromCodePoint(parsed)
}

export function decodeHtmlEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, entity: string) => decodeNumericEntity(entity, 16))
    .replace(/&#([0-9]+);/g, (_, entity: string) => decodeNumericEntity(entity, 10))
    .replace(/&([a-z]+);/gi, (_, entity: string) => namedEntities[entity.toLowerCase()] ?? `&${entity};`)
}

export function normalizeWhitespace(value: string) {
  return decodeHtmlEntities(value).replace(/\s+/g, ' ').trim()
}

export function stripHtml(value: string) {
  return normalizeWhitespace(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/p>/gi, ' ')
      .replace(/<\/li>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
}

export function extractXmlTagValue(block: string, tagName: string) {
  const escapedTagName = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = block.match(new RegExp(`<${escapedTagName}(?:\\s[^>]*)?>([\\s\\S]*?)</${escapedTagName}>`, 'i'))

  return match?.[1] ? decodeHtmlEntities(match[1]).trim() : ''
}

export function extractXmlItems(xml: string) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => match[0])
}

function parseSalaryNumber(rawValue: string, multiplierToken = '') {
  const normalized = rawValue.replace(/,/g, '').trim()
  const parsed = Number.parseFloat(normalized)

  if (!Number.isFinite(parsed)) {
    return undefined
  }

  return multiplierToken.toLowerCase() === 'k' ? parsed * 1000 : parsed
}

function normalizeCompensationPeriod(value: string): CompensationPeriod {
  switch (value) {
    case 'annual':
    case 'monthly':
    case 'weekly':
    case 'daily':
    case 'hourly':
    case 'contract':
      return value
    default:
      return 'unknown'
  }
}

function detectSalaryPeriod(text: string): CompensationPeriod {
  const loweredText = text.toLowerCase()

  if (
    loweredText.includes('per year') ||
    loweredText.includes('per annum') ||
    loweredText.includes('annually') ||
    loweredText.includes('annual') ||
    loweredText.includes('yearly') ||
    loweredText.includes('/year') ||
    loweredText.includes('/yr')
  ) {
    return 'annual' as const
  }

  if (loweredText.includes('per month') || loweredText.includes('monthly') || loweredText.includes('/month') || loweredText.includes('/mo')) {
    return 'monthly' as const
  }

  if (loweredText.includes('per hour') || loweredText.includes('hourly') || loweredText.includes('/hour') || loweredText.includes('/hr')) {
    return 'hourly' as const
  }

  if (loweredText.includes('per week') || loweredText.includes('weekly') || loweredText.includes('/week') || loweredText.includes('/wk')) {
    return 'weekly' as const
  }

  if (loweredText.includes('per day') || loweredText.includes('daily') || loweredText.includes('/day')) {
    return 'daily' as const
  }

  return 'annual' as const
}

function getSalaryContext(text: string, rangeText: string, rangeIndex = -1) {
  const startIndex = rangeIndex >= 0 ? rangeIndex : text.indexOf(rangeText)

  if (startIndex < 0) {
    return text
  }

  const contextStart = Math.max(0, startIndex - 72)
  const contextEnd = Math.min(text.length, startIndex + rangeText.length + 72)

  return text.slice(contextStart, contextEnd)
}

function getStoredSalaryRangeContext(text: string) {
  const normalized = normalizeWhitespace(text)

  if (!normalized) {
    return ''
  }

  const rangeMatch = normalized.match(
    /(?:USD|CAD|EUR|GBP|PLN|[$€£])?\s*[0-9][0-9,]*(?:\.[0-9]+)?\s*[kK]?\s*(?:-|–|to)\s*(?:USD|CAD|EUR|GBP|PLN|[$€£])?\s*[0-9][0-9,]*(?:\.[0-9]+)?\s*[kK]?/i,
  )

  if (!rangeMatch?.[0]) {
    return normalized
  }

  return getSalaryContext(normalized, rangeMatch[0], rangeMatch.index ?? -1)
}

function looksImplausibleForNonAnnualPeriod(max: number, period: CompensationPeriod) {
  switch (period) {
    case 'hourly':
      return max >= 1_000
    case 'daily':
      return max >= 5_000
    case 'weekly':
      return max >= 20_000
    case 'monthly':
      return max >= 50_000
    default:
      return false
  }
}

export function normalizeStoredSalaryPeriod(options: {
  descriptionText: string
  salaryMax?: number
  salaryMin?: number
  storedPeriod?: string
}): CompensationPeriod {
  const storedPeriod = normalizeCompensationPeriod(options.storedPeriod ?? '')

  if (storedPeriod === 'unknown' || storedPeriod === 'annual' || storedPeriod === 'contract') {
    if (storedPeriod === 'unknown') {
      const context = getStoredSalaryRangeContext(options.descriptionText)
      return detectSalaryPeriod(context)
    }

    return storedPeriod
  }

  const context = getStoredSalaryRangeContext(options.descriptionText)
  const inferredPeriod = detectSalaryPeriod(context)
  const max = options.salaryMax ?? options.salaryMin ?? 0

  if (inferredPeriod === 'annual') {
    return 'annual'
  }

  if (looksImplausibleForNonAnnualPeriod(max, storedPeriod)) {
    return 'annual'
  }

  return storedPeriod
}

export function hasSuspiciousStoredCompensation(options: {
  descriptionText: string
  salaryMax?: number
  salaryMin?: number
  storedPeriod?: string
}) {
  const normalizedPeriod = normalizeStoredSalaryPeriod(options)
  const min = options.salaryMin ?? options.salaryMax ?? 0
  const max = options.salaryMax ?? options.salaryMin ?? min
  const storedPeriod = normalizeCompensationPeriod(options.storedPeriod ?? '')

  if (!min && !max) {
    return {
      normalizedPeriod,
      suspicious: false,
    }
  }

  const suspicious =
    normalizedPeriod !== storedPeriod ||
    (normalizedPeriod === 'annual' && max > 0 && max < 10_000) ||
    (normalizedPeriod === 'hourly' && max >= 1_000) ||
    (normalizedPeriod === 'daily' && max >= 5_000) ||
    (normalizedPeriod === 'weekly' && max >= 20_000) ||
    (normalizedPeriod === 'monthly' && max >= 50_000)

  return {
    normalizedPeriod,
    suspicious,
  }
}

function looksSuspiciousSalaryRange(options: {
  max: number
  min: number
  period: CompensationPeriod
  rawText: string
}) {
  const { max, min, period, rawText } = options
  const loweredText = rawText.toLowerCase()
  const hasExplicitSalarySignal =
    /\b(usd|cad|eur|gbp|salary|compensation|pay|rate)\b|[$€£]/i.test(rawText) ||
    /[0-9]\s*[kK]\b/.test(rawText)

  if (period !== 'annual') {
    return false
  }

  if (max < 10_000) {
    return true
  }

  if (
    min >= 1900 &&
    max <= 2105 &&
    max - min <= 5 &&
    !hasExplicitSalarySignal &&
    !/\b(annual|annually|year|yearly|yr|per year)\b/i.test(loweredText)
  ) {
    return true
  }

  return false
}

export function extractSalaryMetadata(text: string) {
  const normalized = normalizeWhitespace(text)

  if (!normalized) {
    return {}
  }

  const currencyMatch = normalized.match(/\b(USD|CAD|EUR|GBP|PLN)\b|([$€£])/i)
  const rangeMatch = normalized.match(
    /(?:USD|CAD|EUR|GBP|PLN|[$€£])?\s*([0-9][0-9,]*(?:\.[0-9]+)?)\s*([kK])?\s*(?:-|–|to)\s*(?:USD|CAD|EUR|GBP|PLN|[$€£])?\s*([0-9][0-9,]*(?:\.[0-9]+)?)\s*([kK])?/i,
  )

  if (!rangeMatch) {
    return {}
  }

  const salaryMin = parseSalaryNumber(rangeMatch[1] ?? '', rangeMatch[2] ?? '')
  const salaryMax = parseSalaryNumber(rangeMatch[3] ?? '', rangeMatch[4] ?? '')

  if (!salaryMin || !salaryMax) {
    return {}
  }

  const currencyToken = (currencyMatch?.[1] ?? currencyMatch?.[2] ?? 'USD').toUpperCase()
  const salaryCurrency =
    currencyToken === '$'
      ? 'USD'
      : currencyToken === '€'
        ? 'EUR'
        : currencyToken === '£'
          ? 'GBP'
          : currencyToken
  const salaryPeriod = detectSalaryPeriod(
    getSalaryContext(normalized, rangeMatch[0] ?? '', rangeMatch.index ?? -1),
  )

  if (
    looksSuspiciousSalaryRange({
      max: Math.max(salaryMin, salaryMax),
      min: Math.min(salaryMin, salaryMax),
      period: salaryPeriod,
      rawText: normalized,
    })
  ) {
    return {}
  }

  return {
    salary_currency: salaryCurrency,
    salary_max: Math.round(Math.max(salaryMin, salaryMax)),
    salary_min: Math.round(Math.min(salaryMin, salaryMax)),
    salary_period: salaryPeriod,
  }
}
