import 'server-only'

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
  const loweredText = normalized.toLowerCase()
  const salaryPeriod = loweredText.includes('per month') || loweredText.includes('monthly')
    ? 'monthly'
    : loweredText.includes('per hour') || loweredText.includes('hourly')
      ? 'hourly'
      : loweredText.includes('per week') || loweredText.includes('weekly')
        ? 'weekly'
        : 'annual'

  return {
    salary_currency: salaryCurrency,
    salary_max: Math.round(Math.max(salaryMin, salaryMax)),
    salary_min: Math.round(Math.min(salaryMin, salaryMax)),
    salary_period: salaryPeriod,
  }
}
