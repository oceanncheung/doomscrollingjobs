import 'server-only'

import { generateOpenAIJson, canGenerateWithOpenAI } from '@/lib/ai/client'
import type { JobSummaryInput, JobSummaryOutput } from '@/lib/ai/contracts'
import { generateJobSummaryPrompt } from '@/lib/ai/prompts/generate-job-summary'
import { getOpenAIEnv } from '@/lib/env'

function cleanLine(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').map((item) => cleanLine(item)).filter(Boolean)
    : []
}

function normalizeJobSummaryOutput(value: Partial<JobSummaryOutput>): JobSummaryOutput {
  return {
    descriptionExcerpt: cleanLine(value.descriptionExcerpt ?? ''),
    hiringSignals: asStringArray(value.hiringSignals).slice(0, 4),
    matchSummary: cleanLine(value.matchSummary ?? ''),
  }
}

export async function generateJobSummary(input: JobSummaryInput): Promise<JobSummaryOutput> {
  if (!canGenerateWithOpenAI()) {
    throw new Error('OpenAI environment variables are missing.')
  }

  const { summaryModel } = getOpenAIEnv()
  const { job } = input
  const user = [
    `Title: ${job.title}`,
    `Company: ${job.companyName}`,
    `Location: ${job.locationLabel ?? 'Unknown'}`,
    `Remote: ${job.remoteType}`,
    `Salary: ${job.salaryMin ?? ''} ${job.salaryMax ?? ''} ${job.salaryCurrency ?? ''}`.trim(),
    `Department: ${job.department ?? ''}`,
    `Description: ${job.descriptionText}`,
    `Requirements: ${job.requirements.join(' | ')}`,
    `Preferred qualifications: ${job.preferredQualifications.join(' | ')}`,
    `Skills keywords: ${job.skillsKeywords.join(' | ')}`,
    `Deterministic fit summary: ${input.fitSummary}`,
    `Deterministic fit reasons: ${input.fitReasons.join(' | ')}`,
  ].join('\n')

  const response = await generateOpenAIJson<JobSummaryOutput>({
    model: summaryModel,
    promptVersion: generateJobSummaryPrompt.version,
    schemaHint: generateJobSummaryPrompt.schemaHint,
    system: generateJobSummaryPrompt.system,
    user,
  })

  const normalized = normalizeJobSummaryOutput(response)

  if (!normalized.descriptionExcerpt || !normalized.matchSummary) {
    throw new Error('Job summary generation returned incomplete content.')
  }

  return normalized
}
