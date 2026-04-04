import 'server-only'

import type { GeneratedPacketOutput } from '@/lib/ai/contracts'
import { generateApplicationAnswers } from '@/lib/ai/tasks/generate-application-answers'
import { generateCoverLetter } from '@/lib/ai/tasks/generate-cover-letter'
import { generateJobSummary } from '@/lib/ai/tasks/generate-job-summary'
import { generateResumeVariant } from '@/lib/ai/tasks/generate-resume-variant'
import type { ApplicationPacketRecord, OperatorWorkspaceRecord } from '@/lib/domain/types'
import type { RankedJobRecord } from '@/lib/jobs/contracts'

export async function generateApplicationPacketArtifacts({
  job,
  packet,
  workspace,
}: {
  job: RankedJobRecord
  packet: ApplicationPacketRecord
  workspace: OperatorWorkspaceRecord
}): Promise<GeneratedPacketOutput> {
  const jobSummary = await generateJobSummary({ job })
  const resumeVariant = await generateResumeVariant({
    baselineAnswers: packet.answers,
    job,
    workspace,
  })
  const coverLetter = await generateCoverLetter({
    job,
    resumeVariant,
    workspace,
  })
  const answers = await generateApplicationAnswers({
    answers: packet.answers,
    job,
    resumeVariant,
    workspace,
  })

  return {
    answers,
    coverLetter,
    jobSummary,
    resumeVariant,
  }
}
