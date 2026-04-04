import { ApplicationPacketForm } from '@/components/jobs/application-packet-form'
import { JobFlowHeader } from '@/components/jobs/job-flow-header'
import { JobOverviewSection } from '@/components/jobs/job-overview-section'
import type { ApplicationPacketRecord, OperatorProfileRecord } from '@/lib/domain/types'
import { hasOpenAIEnv } from '@/lib/env'
import type { QualifiedJobRecord } from '@/lib/jobs/contracts'

function getDetailIntro(job: QualifiedJobRecord) {
  if (job.workflowStatus === 'ready_to_apply') {
    return 'Everything is lined up. Review the role, then apply when you want to move.'
  }

  if (job.workflowStatus === 'preparing') {
    return 'Materials are already being prepared. Review the role, then continue when you want.'
  }

  if (job.workflowStatus === 'shortlisted') {
    return 'This role is saved. Review the basics, then prepare the application when it is worth pursuing.'
  }

  return 'Review the basics, then decide whether to save, skip, or open the source listing.'
}

function getPrepIntro(job: QualifiedJobRecord, hasDraft: boolean) {
  if (job.workflowStatus === 'ready_to_apply') {
    return 'Your materials are ready. Review the role, then apply when you want to submit.'
  }

  if (hasDraft) {
    return 'Review the role and the prepared materials below, then mark the application ready to apply.'
  }

  return 'Generate tailored materials for this role first. The resume, cover letter, and answers will appear after that step.'
}

interface JobFlowPageProps {
  canSave: boolean
  issue?: string
  job: QualifiedJobRecord
  packet: ApplicationPacketRecord
  prepOpen: boolean
  profile: OperatorProfileRecord
}

export function JobFlowPage({
  canSave,
  issue,
  job,
  packet,
  prepOpen,
  profile,
}: JobFlowPageProps) {
  const draftReady = packet.generationStatus === 'generated'
  const canGenerate = canSave && hasOpenAIEnv()
  const generationDisabledReason = !canSave
    ? issue
    : !canGenerate
      ? 'Add the OpenAI server environment before generating application materials.'
      : issue
  const pageLabel = prepOpen ? 'Application prep' : 'Job detail'
  const pageIntro = prepOpen ? getPrepIntro(job, draftReady) : getDetailIntro(job)

  return (
    <>
      <JobFlowHeader job={job} pageIntro={pageIntro} pageLabel={pageLabel} packet={packet} profile={profile} />
      <JobOverviewSection
        canGenerate={canGenerate}
        canSave={canSave}
        generationDisabledReason={generationDisabledReason}
        job={job}
        packet={packet}
        prepOpen={prepOpen}
        saveDisabledReason={issue}
      />

      {prepOpen ? (
        <div className="job-prep-direct">
          <ApplicationPacketForm
            canSave={canSave}
            disabledReason={issue}
            job={job}
            packet={packet}
            showGeneratedContent={draftReady}
          />
        </div>
      ) : null}
    </>
  )
}
