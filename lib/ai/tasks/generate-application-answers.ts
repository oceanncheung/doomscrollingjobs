import 'server-only'

import { generateOpenAIJson, canGenerateWithOpenAI } from '@/lib/ai/client'
import type { ApplicationAnswersInput, GeneratedAnswerOutput } from '@/lib/ai/contracts'
import { generateApplicationAnswersPrompt } from '@/lib/ai/prompts/generate-application-answers'
import { getOpenAIEnv } from '@/lib/env'

function cleanLine(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function normalizeAnswerList(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null
      }

      const record = item as Record<string, unknown>
      const questionKey = cleanLine(String(record.questionKey ?? ''))

      if (!questionKey) {
        return null
      }

      return {
        answerText: String(record.answerText ?? '').trim(),
        answerVariantShort: cleanLine(String(record.answerVariantShort ?? '')),
        questionKey,
      } satisfies GeneratedAnswerOutput
    })
    .filter((item): item is GeneratedAnswerOutput => item !== null)
}

export async function generateApplicationAnswers(
  input: ApplicationAnswersInput,
): Promise<GeneratedAnswerOutput[]> {
  if (!canGenerateWithOpenAI()) {
    throw new Error('OpenAI environment variables are missing.')
  }

  if (input.answers.length === 0) {
    return []
  }

  const { packetModel } = getOpenAIEnv()
  const user = [
    `Target role: ${input.job.title} at ${input.job.companyName}`,
    `Job description: ${input.job.descriptionText}`,
    `Requirements: ${input.job.requirements.join(' | ')}`,
    `Preferred qualifications: ${input.job.preferredQualifications.join(' | ')}`,
    `Profile headline: ${input.workspace.profile.headline}`,
    `Profile summary: ${input.workspace.profile.bioSummary}`,
    `Work authorization notes: ${input.workspace.profile.workAuthorizationNotes}`,
    `Portfolio primary URL: ${input.workspace.profile.portfolioPrimaryUrl}`,
    `Resume headline: ${input.resumeVariant.headline}`,
    `Resume summary: ${input.resumeVariant.summary}`,
    `Questions: ${JSON.stringify(
      input.answers.map((answer) => ({
        baselineAnswerText: answer.answerText,
        baselineShortAnswer: answer.answerVariantShort,
        characterLimit: answer.characterLimit ?? null,
        fieldType: answer.fieldType,
        questionKey: answer.questionKey,
        questionText: answer.questionText,
      })),
    )}`,
  ].join('\n')

  const response = await generateOpenAIJson<{ answers: GeneratedAnswerOutput[] }>({
    model: packetModel,
    promptVersion: generateApplicationAnswersPrompt.version,
    schemaHint: generateApplicationAnswersPrompt.schemaHint,
    system: generateApplicationAnswersPrompt.system,
    user,
  })

  const normalized = normalizeAnswerList(response.answers)
  const byKey = new Map(normalized.map((answer) => [answer.questionKey, answer] as const))

  return input.answers.map((answer) => {
    const generated = byKey.get(answer.questionKey)

    return {
      answerText: generated?.answerText?.trim() || '',
      answerVariantShort: generated?.answerVariantShort || '',
      questionKey: answer.questionKey,
    }
  })
}
