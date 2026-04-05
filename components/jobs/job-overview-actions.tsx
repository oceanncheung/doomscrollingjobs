import { GeneratePacketButton } from '@/components/jobs/generate-packet-button'
import { JobStageActionButton } from '@/components/jobs/job-stage-action-button'
import type { QualifiedJobRecord } from '@/lib/jobs/contracts'
import type { JobOverviewActionModel } from '@/lib/jobs/job-overview-action-model'

function PrepSubmitButton({
  canSave,
  disabledReason,
  hasDraft,
}: {
  canSave: boolean
  disabledReason?: string
  hasDraft: boolean
}) {
  return (
    <button
      className="button button-primary button-small"
      disabled={!canSave}
      form="packet-form"
      name="submitIntent"
      title={!canSave ? disabledReason : undefined}
      type="submit"
      value={hasDraft ? 'mark-ready' : 'save-review'}
    >
      {hasDraft ? 'Mark Ready' : 'Save Review'}
    </button>
  )
}

interface JobOverviewActionsProps {
  actionModel: JobOverviewActionModel
  canGenerate: boolean
  canSave: boolean
  generationDisabledReason?: string
  job: QualifiedJobRecord
  saveDisabledReason?: string
}

export function JobOverviewActions({
  actionModel,
  canGenerate,
  canSave,
  generationDisabledReason,
  job,
  saveDisabledReason,
}: JobOverviewActionsProps) {
  if (actionModel.kind === 'ready-to-apply') {
      return (
        <div
          aria-label="Job overview actions"
          className={`screening-actions-bar job-overview-actions ${actionModel.layoutClass}`}
          role="group"
        >
          <div className="screening-actions-cluster">
            <div className="screening-action-slot">
              <a
                className="button button-primary button-small"
                href={job.applicationUrl ?? job.sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                Apply
              </a>
            </div>
            <div className="screening-action-slot">
              <JobStageActionButton
                canEdit={canSave}
                disabledReason={saveDisabledReason || 'Switch back to the database-backed queue to mark jobs applied.'}
                jobId={job.id}
                label="Mark Applied"
                sourceContext="job-flow"
                variant="secondary"
                workflowStatus="applied"
              />
            </div>
          </div>
        </div>
      )
  }

  if (actionModel.kind === 'prep') {
    return (
      <div
        aria-label="Job overview actions"
        className={`screening-actions-bar job-overview-actions ${actionModel.layoutClass}`}
        role="group"
      >
        <div className="screening-actions-cluster">
          <div className="screening-action-slot">
            {actionModel.hasGeneratedContent ? (
              <PrepSubmitButton canSave={canSave} disabledReason={saveDisabledReason} hasDraft />
            ) : (
              <GeneratePacketButton canEdit={canGenerate} disabledReason={generationDisabledReason} jobId={job.id} />
            )}
          </div>
          {actionModel.showReviewAnchor ? (
            <div className="screening-action-slot">
              <a className="button button-ghost button-small" href="#packet-materials-section">
                Review Materials
              </a>
            </div>
          ) : null}
          {actionModel.showShortlistArchive ? (
            <div className="screening-action-slot">
              <JobStageActionButton
                canEdit={canSave}
                disabledReason={saveDisabledReason || 'Switch back to the database-backed queue to archive saved jobs.'}
                intent="dismiss"
                jobId={job.id}
                label="Archive"
                sourceContext="job-flow"
                variant="secondary"
              />
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div
      aria-label="Job overview actions"
      className={`screening-actions-bar job-overview-actions ${actionModel.layoutClass}`}
      role="group"
    >
      <div className="screening-actions-cluster">
        <div className="screening-action-slot">
          <JobStageActionButton
            canEdit={canSave}
            disabledReason={saveDisabledReason || 'Switch back to the database-backed queue to save jobs.'}
            intent="shortlist"
            jobId={job.id}
            label="Save"
            sourceContext="job-flow"
            variant="primary"
          />
        </div>
        <div className="screening-action-slot">
          <JobStageActionButton
            canEdit={canSave}
            disabledReason={saveDisabledReason || 'Switch back to the database-backed queue to skip jobs.'}
            intent="dismiss"
            jobId={job.id}
            label="Skip"
            sourceContext="job-flow"
            variant="secondary"
          />
        </div>
      </div>
    </div>
  )
}
