import 'server-only'

import type { PacketQuestionSnapshotStatus } from '@/lib/domain/types'
import type { RankedJobRecord } from '@/lib/jobs/contracts'
import { getCompanyWatchlist } from '@/lib/jobs/source-registry'

interface GreenhouseQuestionFieldValueRecord {
  label?: string
  value?: string
}

interface GreenhouseQuestionFieldRecord {
  max_length?: number | string
  name?: string
  type?: string
  values?: GreenhouseQuestionFieldValueRecord[] | string[]
}

interface GreenhouseQuestionRecord {
  fields?: GreenhouseQuestionFieldRecord[]
  label?: string
}

interface GreenhouseJobQuestionPayload {
  questions?: GreenhouseQuestionRecord[]
}

export interface ExtractedApplicationQuestion {
  characterLimit?: number
  fieldType: string
  questionKey: string
  questionText: string
  sourceContext: Record<string, unknown>
}

export interface GreenhouseApplicationQuestionResult {
  error?: string
  questions: ExtractedApplicationQuestion[]
  status: PacketQuestionSnapshotStatus
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function asOptionalNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

function normalizeQuestionKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

function resolveBoardTokenFromSourceUrl(sourceUrl: string) {
  try {
    const url = new URL(sourceUrl)
    const host = url.hostname.toLowerCase()

    if (!host.includes('greenhouse')) {
      return ''
    }

    const [boardToken] = url.pathname.split('/').filter(Boolean)
    return boardToken ?? ''
  } catch {
    return ''
  }
}

async function resolveBoardToken(job: RankedJobRecord) {
  const fromUrl = resolveBoardTokenFromSourceUrl(job.sourceUrl)

  if (fromUrl) {
    return fromUrl
  }

  const watchlist = await getCompanyWatchlist()
  const matchedEntry =
    watchlist.find((entry) => entry.sourceName === job.sourceName) ??
    watchlist.find((entry) => entry.companyName.toLowerCase() === job.companyName.toLowerCase())

  return matchedEntry?.atsBoardToken ?? ''
}

function extractOptionLabels(values: GreenhouseQuestionFieldRecord['values']) {
  if (!Array.isArray(values)) {
    return []
  }

  return values
    .map((value) => {
      if (typeof value === 'string') {
        return value.trim()
      }

      return asString(value.label ?? value.value)
    })
    .filter(Boolean)
}

function normalizeQuestionText(label: string, optionLabels: string[]) {
  if (optionLabels.length === 0) {
    return label
  }

  return `${label} Options: ${optionLabels.join(' | ')}`
}

function extractQuestions(payload: GreenhouseJobQuestionPayload) {
  const questions = Array.isArray(payload.questions) ? payload.questions : []

  return questions
    .map((question) => {
      const label = asString(question.label)
      const fields = Array.isArray(question.fields) ? question.fields : []
      const customField = fields.find((field) => asString(field.name).startsWith('question_'))

      if (!label || !customField) {
        return null
      }

      const optionLabels = extractOptionLabels(customField.values)
      const questionKey = asString(customField.name) || normalizeQuestionKey(label)

      const extractedQuestion: ExtractedApplicationQuestion = {
        characterLimit: asOptionalNumber(customField.max_length),
        fieldType: asString(customField.type) || 'textarea',
        questionKey,
        questionText: normalizeQuestionText(label, optionLabels),
        sourceContext: {
          fieldName: asString(customField.name),
          optionLabels,
          provider: 'greenhouse',
        },
      }

      return extractedQuestion
    })
    .filter((question): question is ExtractedApplicationQuestion => question !== null)
}

export async function fetchGreenhouseApplicationQuestions(
  job: RankedJobRecord,
): Promise<GreenhouseApplicationQuestionResult> {
  const boardToken = await resolveBoardToken(job)
  const sourceJobId = job.sourceJobId?.trim() ?? ''

  if (!boardToken || !sourceJobId) {
    return {
      questions: [],
      status: 'unsupported',
    }
  }

  try {
    const response = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs/${sourceJobId}?questions=true`,
      {
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
        },
      },
    )

    if (!response.ok) {
      return {
        error: `Greenhouse question sync returned ${response.status}.`,
        questions: [],
        status: 'failed',
      }
    }

    const payload = (await response.json()) as GreenhouseJobQuestionPayload
    const questions = extractQuestions(payload)

    return {
      questions,
      status: questions.length > 0 ? 'extracted' : 'none',
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Greenhouse question sync failed.',
      questions: [],
      status: 'failed',
    }
  }
}
