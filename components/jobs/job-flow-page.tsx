import { ApplicationPacketForm } from '@/components/jobs/application-packet-form'
import { JobFlowHeader } from '@/components/jobs/job-flow-header'
import { JobOverviewSection } from '@/components/jobs/job-overview-section'
import type { ApplicationPacketRecord, OperatorProfileRecord } from '@/lib/domain/types'
import type { QualifiedJobRecord } from '@/lib/jobs/contracts'
import { buildJobFlowPageViewModel } from '@/lib/jobs/job-flow-view-model'

interface JobFlowPageProps {
  canSave: boolean
  issue?: string
  job: QualifiedJobRecord
  packet: ApplicationPacketRecord
  prepOpen: boolean
  profile: OperatorProfileRecord
  profileMaterialReady: boolean
  screeningLocked?: boolean
}

export function JobFlowPage({
  canSave,
  issue,
  job,
  packet,
  prepOpen,
  profile,
  profileMaterialReady,
  screeningLocked = false,
}: JobFlowPageProps) {
  const viewModel = buildJobFlowPageViewModel({
    canSave,
    issue,
    job,
    prepOpen,
    profile,
    screeningLocked,
  })

  return (
    <>
      <JobFlowHeader header={viewModel.header} />
      <JobOverviewSection
        canGenerate={viewModel.canGenerate}
        canSave={canSave}
        generationDisabledReason={viewModel.generationDisabledReason}
        job={job}
        packet={packet}
        prepOpen={prepOpen}
        saveDisabledReason={issue}
        screeningLocked={screeningLocked}
      />

      {prepOpen ? (
        <div className="job-prep-direct">
          <ApplicationPacketForm
            canSave={canSave}
            disabledReason={issue}
            job={job}
            packet={packet}
            profileMaterialReady={profileMaterialReady}
            screeningLocked={screeningLocked}
          />
        </div>
      ) : null}
    </>
  )
}
