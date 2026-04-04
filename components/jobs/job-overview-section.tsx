import { getDescriptionExcerpt } from '@/components/dashboard/formatters'
import { JobOverviewActions } from '@/components/jobs/job-overview-actions'
import type { ApplicationPacketRecord } from '@/lib/domain/types'
import type { QualifiedJobRecord } from '@/lib/jobs/contracts'

interface JobOverviewSectionProps {
  canGenerate: boolean
  canSave: boolean
  generationDisabledReason?: string
  saveDisabledReason?: string
  job: QualifiedJobRecord
  packet: ApplicationPacketRecord
  prepOpen: boolean
}

export function JobOverviewSection({
  canGenerate,
  canSave,
  generationDisabledReason,
  saveDisabledReason,
  job,
  packet,
  prepOpen,
}: JobOverviewSectionProps) {
  const hasOverviewActions =
    prepOpen ||
    job.workflowStatus === 'new' ||
    job.workflowStatus === 'ranked' ||
    job.workflowStatus === 'shortlisted' ||
    job.workflowStatus === 'preparing' ||
    job.workflowStatus === 'ready_to_apply'
  const overviewText =
    packet.generationStatus === 'generated' && packet.jobSummary
      ? packet.jobSummary
      : getDescriptionExcerpt(job)

  return (
    <div className="job-flow-prep-overview-wrap">
      <section
        className={`job-flow-section detail-review-section detail-review-section--first${
          !prepOpen ? ' detail-review-section--terminal' : ''
        }${hasOverviewActions ? ' detail-review-section--with-actions' : ''}`}
      >
        <div className="job-flow-section-inner">
          <div className="job-review-grid">
            <div className="job-review-column">
              <p className="panel-label">Job overview</p>
              <p>{overviewText}</p>
              <div className="inline-link-row">
                <a href={job.sourceUrl} rel="noreferrer" target="_blank">
                  Source
                </a>
              </div>
            </div>
            <div className="job-review-column">
              <p className="panel-label">Skills</p>
              {job.skillsKeywords.length > 0 ? (
                <div className="job-card-tags">
                  {job.skillsKeywords.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
              ) : (
                <p>No specific skills were listed on the imported job source.</p>
              )}
            </div>
          </div>
          {hasOverviewActions ? (
            <JobOverviewActions
              canGenerate={canGenerate}
              canSave={canSave}
              generationDisabledReason={generationDisabledReason}
              job={job}
              packet={packet}
              prepOpen={prepOpen}
              saveDisabledReason={saveDisabledReason}
            />
          ) : null}
        </div>
      </section>
    </div>
  )
}
