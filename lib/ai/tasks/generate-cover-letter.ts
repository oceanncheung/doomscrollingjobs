import 'server-only'

import { generateOpenAIJson, canGenerateWithOpenAI } from '@/lib/ai/client'
import type { CoverLetterInput, CoverLetterOutput } from '@/lib/ai/contracts'
import { generateCoverLetterPrompt } from '@/lib/ai/prompts/generate-cover-letter'
import { getOpenAIEnv } from '@/lib/env'

function cleanLine(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

export async function generateCoverLetter(input: CoverLetterInput): Promise<CoverLetterOutput> {
  if (!canGenerateWithOpenAI()) {
    throw new Error('OpenAI environment variables are missing.')
  }

  const { packetModel } = getOpenAIEnv()
  const user = [
    `Target role: ${input.job.title} at ${input.job.companyName}`,
    `Job description: ${input.job.descriptionText}`,
    `Requirements: ${input.job.requirements.join(' | ')}`,
    `Preferred qualifications: ${input.job.preferredQualifications.join(' | ')}`,
    `Profile headline: ${input.workspace.profile.headline}`,
    `Profile summary: ${input.workspace.profile.bioSummary}`,
    `Resume headline: ${input.resumeVariant.headline}`,
    `Resume summary: ${input.resumeVariant.summary}`,
    `Resume change summary: ${input.resumeVariant.changeSummaryForUser}`,
    `Portfolio primary URL: ${input.workspace.profile.portfolioPrimaryUrl}`,
  ].join('\n')

  const response = await generateOpenAIJson<CoverLetterOutput>({
    model: packetModel,
    promptVersion: generateCoverLetterPrompt.version,
    schemaHint: generateCoverLetterPrompt.schemaHint,
    system: generateCoverLetterPrompt.system,
    user,
  })

  const normalized = {
    draft: String(response.draft ?? '').trim(),
    summary: cleanLine(response.summary ?? ''),
  }

  if (!normalized.draft || !normalized.summary) {
    throw new Error('Cover letter generation returned incomplete content.')
  }

  return normalized
}
