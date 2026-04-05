import 'server-only'

import type { GeneratedPacketOutput } from '@/lib/ai/contracts'
import { generateApplicationAnswers } from '@/lib/ai/tasks/generate-application-answers'
import { generateCoverLetter } from '@/lib/ai/tasks/generate-cover-letter'
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
  const resumeVariant = await generateResumeVariant({
    baselineAnswers: packet.answers,
    job,
    workspace,
  })
  const [coverLetter, answers] = await Promise.all([
    generateCoverLetter({
      job,
      resumeVariant,
      workspace,
    }),
    generateApplicationAnswers({
      answers: packet.answers,
      job,
      resumeVariant,
      workspace,
    }),
  ])

  return {
    answers,
    coverLetter,
    resumeVariant,
  }
}
