import 'server-only'

import type { JobSummaryInput } from '@/lib/ai/contracts'
import { generateJobSummary } from '@/lib/ai/tasks/generate-job-summary'
import { getOpenAIEnv, hasOpenAIEnv } from '@/lib/env'
import type { JobReviewSummaryStatus } from '@/lib/domain/types'
import { createClient } from '@/lib/supabase/server'

interface JobReviewCopySyncInput {
  existingAiDescriptionExcerpt?: string
  existingAiMatchSummary?: string
  existingAiSummaryStatus?: JobReviewSummaryStatus
  fitReasons: string[]
  fitSummary: string
  force?: boolean
  job: JobSummaryInput['job']
  jobScoreId: string
}

export interface JobReviewCopySyncResult {
  failedCount: number
  generatedCount: number
  skippedCount: number
}

function hasGeneratedReviewCopy(input: JobReviewCopySyncInput) {
  return Boolean(
    input.existingAiMatchSummary?.trim() &&
      input.existingAiDescriptionExcerpt?.trim() &&
      input.existingAiSummaryStatus === 'generated',
  )
}

export async function syncJobReviewCopy(
  inputs: JobReviewCopySyncInput[],
): Promise<JobReviewCopySyncResult> {
  if (!hasOpenAIEnv()) {
    return {
      failedCount: 0,
      generatedCount: 0,
      skippedCount: inputs.length,
    }
  }

  const supabase = createClient()
  const { summaryModel } = getOpenAIEnv()
  let failedCount = 0
  let generatedCount = 0
  let skippedCount = 0

  for (const input of inputs) {
    if (!input.force && hasGeneratedReviewCopy(input)) {
      skippedCount += 1
      continue
    }

    try {
      const generated = await generateJobSummary({
        fitReasons: input.fitReasons,
        fitSummary: input.fitSummary,
        job: input.job,
      })

      const { error } = await supabase
        .from('job_scores')
        .update({
          ai_description_excerpt: generated.descriptionExcerpt,
          ai_match_summary: generated.matchSummary,
          ai_summary_error: null,
          ai_summary_generated_at: new Date().toISOString(),
          ai_summary_model: summaryModel,
          ai_summary_status: 'generated',
        })
        .eq('id', input.jobScoreId)

      if (error) {
        throw new Error(error.message)
      }

      generatedCount += 1
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Job review copy generation failed.'

      await supabase
        .from('job_scores')
        .update({
          ai_summary_error: message,
          ai_summary_generated_at: null,
          ai_summary_model: summaryModel,
          ai_summary_status: 'failed',
        })
        .eq('id', input.jobScoreId)

      failedCount += 1
    }
  }

  return {
    failedCount,
    generatedCount,
    skippedCount,
  }
}
