import Link from 'next/link'
import type { ReactNode } from 'react'

import { JobStageActionButton } from '@/components/jobs/job-stage-action-button'
import { getRankedJobs } from '@/lib/data/jobs'
import { requireActiveOperatorSelection } from '@/lib/data/operators'
import { getOperatorProfile } from '@/lib/data/operator-profile'
import type { OperatorProfileRecord } from '@/lib/domain/types'
import type { QualifiedJobRecord } from '@/lib/jobs/contracts'
import {
  getDashboardQueues,
  getMatchReason,
  getQueueView,
  type QueueView,
} from '@/lib/jobs/dashboard-queue'
import {
  formatDateLabel,
  formatRemoteLabel,
  formatSalaryRange,
  formatScore,
  formatWorkflowLabel,
} from '@/lib/jobs/presentation'

export const dynamic = 'force-dynamic'

interface DashboardPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

interface SalaryDisplay {
  label: string
  value: string
}

interface ResumeStatus {
  ctaLabel: string
  href: string
  label: string
}

function asNumber(value: string) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

function formatEstimatedRange(profile: OperatorProfileRecord) {
  const currency = profile.salaryFloorCurrency || 'USD'
  const targetMin = asNumber(profile.salaryTargetMin)
  const targetMax = asNumber(profile.salaryTargetMax)
  const salaryFloor = asNumber(profile.salaryFloorAmount)

  if (!targetMin && !targetMax && !salaryFloor) {
    return 'Pending'
  }

  const formatter = new Intl.NumberFormat('en-US', {
    currency,
    maximumFractionDigits: 0,
    style: 'currency',
  })

  if (targetMin && targetMax) {
    return `${formatter.format(targetMin)} - ${formatter.format(targetMax)}`
  }

  if (targetMin) {
    return `${formatter.format(targetMin)}+`
  }

  return `${formatter.format(salaryFloor ?? 0)}+`
}

function getSalaryDisplay(job: QualifiedJobRecord, profile: OperatorProfileRecord): SalaryDisplay {
  if (job.salaryCurrency && (job.salaryMin || job.salaryMax)) {
    return {
      label: 'Salary',
      value: formatSalaryRange(job),
    }
  }

  return {
    label: 'Estimated salary',
    value: formatEstimatedRange(profile),
  }
}

function getLocationDisplay(job: QualifiedJobRecord) {
  const remoteLabel = formatRemoteLabel(job)
  const locationLabel = job.locationLabel?.trim()

  if (!locationLabel) {
    return remoteLabel
  }

  if (
    remoteLabel.toLowerCase() === locationLabel.toLowerCase() ||
    remoteLabel.toLowerCase().includes(locationLabel.toLowerCase())
  ) {
    return remoteLabel
  }

  return `${remoteLabel} · ${locationLabel}`
}

function getRiskReason(job: QualifiedJobRecord) {
  return job.weakReasons[0] ?? 'No major gaps noted yet.'
}

function getFreshnessLabel(job: QualifiedJobRecord) {
  if (job.stale || job.freshness.band === 'blocked') {
    return 'stale'
  }

  if (typeof job.daysSincePosted === 'number' && job.daysSincePosted <= 10) {
    return 'fresh'
  }

  return 'aging'
}

function formatFitBand(job: QualifiedJobRecord) {
  switch (job.roleFit.band) {
    case 'strong':
      return {
        label: 'Strong fit',
        score: formatScore(job.personalizedScore ?? job.totalScore),
      }
    case 'good':
      return {
        label: 'Good fit',
        score: formatScore(job.personalizedScore ?? job.totalScore),
      }
    default:
      return {
        label: 'Stretch',
        score: formatScore(job.personalizedScore ?? job.totalScore),
      }
  }
}

function toPlainDescription(value: string) {
  return value
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getDescriptionExcerpt(job: QualifiedJobRecord) {
  const text = toPlainDescription(job.descriptionText)

  if (!text) {
    return 'Description excerpt unavailable.'
  }

  if (text.length <= 280) {
    return text
  }

  return `${text.slice(0, 277).trimEnd()}...`
}

function getApplyNextJob(savedJobs: QualifiedJobRecord[], preparedJobs: QualifiedJobRecord[]) {
  return preparedJobs[0] ?? savedJobs[0] ?? null
}

function getApplyNextLink(job: QualifiedJobRecord) {
  if (job.workflowStatus === 'ready_to_apply') {
    return {
      href: job.applicationUrl ?? job.sourceUrl,
      label: 'Apply',
      external: true,
    }
  }

  return {
    href: `/jobs/${job.id}/packet`,
    label: 'Prepare',
    external: false,
  }
}

function getNewTodayCount(jobs: QualifiedJobRecord[]) {
  return jobs.filter((job) => job.daysSincePosted === 0).length
}

function getResumeStatus(profile: OperatorProfileRecord, resumeSummaryText: string, experienceCount: number) {
  if (
    resumeSummaryText.trim().length > 0 ||
    experienceCount > 0 ||
    profile.portfolioPrimaryUrl.trim().length > 0
  ) {
    return {
      ctaLabel: 'Update',
      href: '/profile#source-files',
      label: 'Resume source is present.',
    } satisfies ResumeStatus
  }

  return {
    ctaLabel: 'Add source',
    href: '/profile#source-files',
    label: 'Resume source is still missing.',
  } satisfies ResumeStatus
}

function StageEmpty({
  message,
  title,
}: {
  message: string
  title: string
}) {
  return (
    <article className="empty-state">
      <p className="panel-label">{title}</p>
      <p>{message}</p>
    </article>
  )
}

function StageRow({
  actions,
  children,
  detailLabel,
  job,
  profile,
}: {
  actions: ReactNode
  children: ReactNode
  detailLabel: string
  job: QualifiedJobRecord
  profile: OperatorProfileRecord
}) {
  const salary = getSalaryDisplay(job, profile)
  const fit = formatFitBand(job)

  return (
    <article className="stage-row">
      <div className="stage-row-grid">
        <div className="stage-column stage-column-title">
          <Link className="stage-title-link" href={`/jobs/${job.id}`}>
            {job.title}
          </Link>
          <span>{job.companyName}</span>
        </div>

        <div className="stage-column">
          <span className="stage-column-label">Remote / location</span>
          <strong>{getLocationDisplay(job)}</strong>
        </div>

        <div className="stage-column">
          <span className="stage-column-label">{salary.label}</span>
          <strong>{salary.value}</strong>
        </div>

        <div className="stage-column">
          <span className="stage-column-label">Fit</span>
          <strong>{fit.label}</strong>
          <span className="stage-fit-meta">{fit.score}</span>
        </div>

        <div className="stage-column">
          <span className="stage-column-label">Status</span>
          <strong>{formatWorkflowLabel(job.workflowStatus)}</strong>
        </div>

        <div className="stage-column stage-column-actions">{actions}</div>
      </div>

      <p className="stage-row-reason">{getMatchReason(job)}</p>

      <details className="inline-disclosure">
        <summary>{detailLabel}</summary>
        <div className="inline-disclosure-body">{children}</div>
      </details>
    </article>
  )
}

function PotentialRow({
  actionsEnabled,
  job,
  profile,
}: {
  actionsEnabled: boolean
  job: QualifiedJobRecord
  profile: OperatorProfileRecord
}) {
  const salary = getSalaryDisplay(job, profile)
  const fit = formatFitBand(job)

  return (
    <article className="screening-row">
      <details className="screening-disclosure">
        <summary className="screening-summary">
          <div className="screening-summary-grid">
            <div className="screening-cell screening-title-cell">
              <strong>{job.title}</strong>
              <span>{job.companyName}</span>
            </div>

            <div className="screening-cell">
              <span className="stage-column-label">Remote / location</span>
              <strong>{getLocationDisplay(job)}</strong>
            </div>

            <div className="screening-cell">
              <span className="stage-column-label">{salary.label}</span>
              <strong>{salary.value}</strong>
            </div>

            <div className="screening-cell">
              <span className="stage-column-label">Fit</span>
              <strong>{fit.label}</strong>
              <span className="screening-fit-meta">{fit.score}</span>
            </div>

            <div className="screening-cell">
              <span className="stage-column-label">Posted</span>
              <strong>{formatDateLabel(job.postedAt)}</strong>
              <span className="screening-freshness">{getFreshnessLabel(job)}</span>
            </div>
          </div>

          <p className="screening-match">{getMatchReason(job)}</p>
        </summary>

        <div className="screening-expanded">
          <div className="detail-pair-grid">
            <div>
              <p className="panel-label">Why it matches</p>
              <p>{job.fitSummary}</p>
            </div>
            <div>
              <p className="panel-label">Risks / gaps</p>
              <p>{getRiskReason(job)}</p>
            </div>
          </div>

          <div className="screening-description">
            <p className="panel-label">Description excerpt</p>
            <p>{getDescriptionExcerpt(job)}</p>
          </div>

          <div className="inline-link-row">
            <Link href={`/jobs/${job.id}`}>More details</Link>
            <a href={job.sourceUrl} rel="noreferrer" target="_blank">
              Source
            </a>
          </div>
        </div>
      </details>

      <div aria-label="Screening actions" className="screening-actions-bar" role="group">
        <div className="screening-actions-cluster">
          <div className="screening-action-slot">
            <JobStageActionButton
              canEdit={actionsEnabled}
              disabledReason="Switch back to the database-backed queue to save jobs."
              intent="shortlist"
              jobId={job.id}
              label="Save"
              sourceContext="potential-jobs"
              variant="primary"
            />
          </div>
          <div className="screening-action-slot">
            <JobStageActionButton
              canEdit={actionsEnabled}
              disabledReason="Switch back to the database-backed queue to skip jobs."
              intent="dismiss"
              jobId={job.id}
              label="Skip"
              sourceContext="potential-jobs"
              variant="secondary"
            />
          </div>
        </div>
      </div>
    </article>
  )
}

function SavedRow({
  actionsEnabled,
  job,
  profile,
}: {
  actionsEnabled: boolean
  job: QualifiedJobRecord
  profile: OperatorProfileRecord
}) {
  const packetLabel = job.workflowStatus === 'preparing' ? 'Continue prep' : 'Prepare application'

  return (
    <StageRow
      actions={
        <div className="stage-actions">
          <Link className="button button-primary button-small" href={`/jobs/${job.id}/packet`}>
            {packetLabel}
          </Link>
          <JobStageActionButton
            canEdit={actionsEnabled}
            disabledReason="Switch back to the database-backed queue to return jobs to Potential."
            jobId={job.id}
            label="Back to Potential"
            sourceContext="saved-review"
            variant="secondary"
            workflowStatus="ranked"
          />
          <JobStageActionButton
            canEdit={actionsEnabled}
            disabledReason="Switch back to the database-backed queue to remove saved jobs."
            intent="dismiss"
            jobId={job.id}
            label="Remove"
            sourceContext="saved-review"
            variant="secondary"
          />
          <Link className="button button-ghost button-small" href={`/jobs/${job.id}`}>
            Details
          </Link>
        </div>
      }
      detailLabel="Review fit"
      job={job}
      profile={profile}
    >
      <div className="detail-pair-grid detail-pair-grid-stack">
        <div>
          <p className="panel-label">Fit summary</p>
          <p>{job.fitSummary}</p>
        </div>
        <div>
          <p className="panel-label">Why it matches</p>
          <p>{getMatchReason(job)}</p>
        </div>
        <div>
          <p className="panel-label">Risks / gaps</p>
          <p>{getRiskReason(job)}</p>
        </div>
      </div>
    </StageRow>
  )
}

function PreparedRow({
  actionsEnabled,
  job,
  profile,
}: {
  actionsEnabled: boolean
  job: QualifiedJobRecord
  profile: OperatorProfileRecord
}) {
  return (
    <StageRow
      actions={
        <div className="stage-actions">
          <a
            className="button button-primary button-small"
            href={job.applicationUrl ?? job.sourceUrl}
            rel="noreferrer"
            target="_blank"
          >
            Apply
          </a>
          <JobStageActionButton
            canEdit={actionsEnabled}
            disabledReason="Switch back to the database-backed queue to mark jobs as applied."
            jobId={job.id}
            label="Mark applied"
            sourceContext="prepared-apply"
            variant="secondary"
            workflowStatus="applied"
          />
          <Link className="button button-ghost button-small" href={`/jobs/${job.id}/packet`}>
            Packet
          </Link>
        </div>
      }
      detailLabel="Application readiness"
      job={job}
      profile={profile}
    >
      <div className="detail-pair-grid detail-pair-grid-stack">
        <div>
          <p className="panel-label">Ready now</p>
          <ul className="readiness-list">
            <li>Resume ready</li>
            <li>Cover letter ready</li>
            <li>Answers ready</li>
          </ul>
        </div>
        <div>
          <p className="panel-label">Why it is still strong</p>
          <p>{job.fitSummary}</p>
        </div>
        <div>
          <p className="panel-label">Final watchout</p>
          <p>{getRiskReason(job)}</p>
        </div>
      </div>
    </StageRow>
  )
}

function AppliedRow({
  job,
  profile,
}: {
  job: QualifiedJobRecord
  profile: OperatorProfileRecord
}) {
  return (
    <StageRow
      actions={
        <div className="stage-actions">
          <Link className="button button-primary button-small" href={`/jobs/${job.id}/packet`}>
            View packet
          </Link>
          <a
            className="button button-ghost button-small"
            href={job.applicationUrl ?? job.sourceUrl}
            rel="noreferrer"
            target="_blank"
          >
            Source
          </a>
        </div>
      }
      detailLabel="Application context"
      job={job}
      profile={profile}
    >
      <div className="detail-pair-grid detail-pair-grid-stack">
        <div>
          <p className="panel-label">Status</p>
          <p>{formatWorkflowLabel(job.workflowStatus)}</p>
        </div>
        <div>
          <p className="panel-label">Why it made the cut</p>
          <p>{job.fitSummary}</p>
        </div>
        <div>
          <p className="panel-label">Watchout</p>
          <p>{getRiskReason(job)}</p>
        </div>
      </div>
    </StageRow>
  )
}

function ArchiveRow({
  actionsEnabled,
  job,
  profile,
}: {
  actionsEnabled: boolean
  job: QualifiedJobRecord
  profile: OperatorProfileRecord
}) {
  return (
    <StageRow
      actions={
        <div className="stage-actions">
          <JobStageActionButton
            canEdit={actionsEnabled}
            disabledReason="Switch back to the database-backed queue to return jobs to Potential."
            jobId={job.id}
            label="Back to Potential"
            sourceContext="archive-restore"
            variant="secondary"
            workflowStatus="ranked"
          />
          <Link className="button button-ghost button-small" href={`/jobs/${job.id}`}>
            Details
          </Link>
        </div>
      }
      detailLabel="Why it left the queue"
      job={job}
      profile={profile}
    >
      <div className="detail-pair-grid detail-pair-grid-stack">
        <div>
          <p className="panel-label">Status</p>
          <p>{formatWorkflowLabel(job.workflowStatus)}</p>
        </div>
        <div>
          <p className="panel-label">Why it matched</p>
          <p>{getMatchReason(job)}</p>
        </div>
        <div>
          <p className="panel-label">Why it fell out</p>
          <p>{job.queueReason}</p>
        </div>
      </div>
    </StageRow>
  )
}

function QueueMeta({
  activeView,
  potentialVisibleCount,
  potentialTotalCount,
  totalCount,
}: {
  activeView: QueueView
  potentialVisibleCount: number
  potentialTotalCount: number
  totalCount: number
}) {
  const copy: Record<QueueView, { eyebrow: string; label: string; note: string }> = {
    applied: {
      eyebrow: 'Applied',
      label: `${totalCount} applied jobs`,
      note: 'Submitted roles and active follow-up states.',
    },
    archive: {
      eyebrow: 'Archive',
      label: `${totalCount} archived jobs`,
      note: 'Skipped, rejected, and archived roles live here.',
    },
    potential: {
      eyebrow: 'Potential jobs',
      label: `${potentialVisibleCount} of ${potentialTotalCount} screening jobs`,
      note:
        potentialTotalCount > potentialVisibleCount
          ? 'Save or skip to replenish from the next ranked jobs.'
          : 'Save or skip to keep the screening queue moving.',
    },
    prepared: {
      eyebrow: 'Prepared',
      label: `${totalCount} prepared jobs`,
      note: 'Applications that already have materials ready.',
    },
    saved: {
      eyebrow: 'Saved',
      label: `${totalCount} saved jobs`,
      note: 'Shortlisted roles waiting for review or prep.',
    },
  }

  return (
    <div className="queue-meta">
      <div className="queue-meta-heading">
        <p className="panel-label">{copy[activeView].eyebrow}</p>
        <h1>{copy[activeView].label}</h1>
      </div>
      <p>{copy[activeView].note}</p>
    </div>
  )
}

function TodayRail({
  actionsEnabled,
  applyNextJob,
  newTodayCount,
  preparedCount,
  resumeStatus,
  savedCount,
}: {
  actionsEnabled: boolean
  applyNextJob: QualifiedJobRecord | null
  newTodayCount: number
  preparedCount: number
  resumeStatus: ResumeStatus
  savedCount: number
}) {
  const applyNextAction = applyNextJob ? getApplyNextLink(applyNextJob) : null

  return (
    <aside className="today-rail" aria-label="Today">
      <section className="today-block">
        <div className="today-block-heading">
          <p className="panel-label">Today</p>
          <h2>Apply next</h2>
        </div>

        {applyNextJob ? (
          <div className="today-apply-next">
            <div className="today-apply-copy">
              <Link className="today-job-link" href={`/jobs/${applyNextJob.id}`}>
                {applyNextJob.title}
              </Link>
              <p className="today-job-company">{applyNextJob.companyName}</p>
              <p className="today-job-reason">{getMatchReason(applyNextJob)}</p>
            </div>

            <div className="today-actions">
              {applyNextAction?.external ? (
                <a
                  className="button button-primary"
                  href={applyNextAction.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  {applyNextAction.label}
                </a>
              ) : (
                <Link className="button button-primary" href={applyNextAction?.href ?? `/jobs/${applyNextJob.id}`}>
                  {applyNextAction?.label ?? 'Prepare'}
                </Link>
              )}

              <JobStageActionButton
                canEdit={actionsEnabled}
                disabledReason="Switch back to the database-backed queue to skip jobs."
                intent="dismiss"
                jobId={applyNextJob.id}
                label="Skip"
                sourceContext="today-rail"
                variant="secondary"
              />
            </div>
          </div>
        ) : (
          <div className="today-empty">
            <p>No job is ready for prep yet.</p>
            <p>Save something from Potential and it will move into the next-action rail.</p>
          </div>
        )}
      </section>

      <section className="today-block">
        <div className="today-block-heading">
          <p className="panel-label">Today</p>
          <h2>Snapshot</h2>
        </div>
        <dl className="today-stats">
          <div>
            <dt>New today</dt>
            <dd>{newTodayCount}</dd>
          </div>
          <div>
            <dt>Ready to apply</dt>
            <dd>{preparedCount}</dd>
          </div>
          <div>
            <dt>Saved</dt>
            <dd>{savedCount}</dd>
          </div>
        </dl>
      </section>

      <section className="today-block">
        <div className="today-block-heading">
          <p className="panel-label">Source</p>
          <h2>Resume status</h2>
        </div>
        <div className="today-resume-status">
          <p>{resumeStatus.label}</p>
          <Link className="button button-secondary" href={resumeStatus.href}>
            {resumeStatus.ctaLabel}
          </Link>
        </div>
      </section>
    </aside>
  )
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  await requireActiveOperatorSelection()
  const resolvedSearchParams = (await searchParams) ?? {}
  const activeView = getQueueView(resolvedSearchParams.view)
  const [{ jobs, source }, { workspace }] = await Promise.all([getRankedJobs(), getOperatorProfile()])
  const actionsEnabled = source === 'database'

  const { appliedJobs, archivedJobs, counts, potentialJobs, preparedJobs, savedJobs, screeningPool } =
    getDashboardQueues(jobs)
  const applyNextJob = getApplyNextJob(savedJobs, preparedJobs)
  const newTodayCount = getNewTodayCount(jobs)
  const resumeStatus = getResumeStatus(
    workspace.profile,
    workspace.resumeMaster.summaryText,
    workspace.resumeMaster.experienceEntries.length,
  )

  const activeContent: Record<QueueView, ReactNode> = {
    applied:
      appliedJobs.length > 0 ? (
        appliedJobs.map((job) => <AppliedRow job={job} key={job.id} profile={workspace.profile} />)
      ) : (
        <StageEmpty message="Applied jobs will collect here once you mark them sent." title="Applied" />
      ),
    archive:
      archivedJobs.length > 0 ? (
        archivedJobs.map((job) => (
          <ArchiveRow
            actionsEnabled={actionsEnabled}
            job={job}
            key={job.id}
            profile={workspace.profile}
          />
        ))
      ) : (
        <StageEmpty message="Skipped and archived jobs will show up here." title="Archive" />
      ),
    potential:
      potentialJobs.length > 0 ? (
        potentialJobs.map((job) => (
          <PotentialRow
            actionsEnabled={actionsEnabled}
            job={job}
            key={job.id}
            profile={workspace.profile}
          />
        ))
      ) : (
        <StageEmpty message="No active screening jobs are available right now." title="Potential" />
      ),
    prepared:
      preparedJobs.length > 0 ? (
        preparedJobs.map((job) => (
          <PreparedRow
            actionsEnabled={actionsEnabled}
            job={job}
            key={job.id}
            profile={workspace.profile}
          />
        ))
      ) : (
        <StageEmpty message="Move a packet to ready to apply and it will show up here." title="Prepared" />
      ),
    saved:
      savedJobs.length > 0 ? (
        savedJobs.map((job) => (
          <SavedRow
            actionsEnabled={actionsEnabled}
            job={job}
            key={job.id}
            profile={workspace.profile}
          />
        ))
      ) : (
        <StageEmpty message="Saved jobs will appear here after you shortlist them." title="Saved" />
      ),
  }

  return (
    <main className="page-stack jobs-index">
      <section className="dashboard-workspace">
        <TodayRail
          actionsEnabled={actionsEnabled}
          applyNextJob={applyNextJob}
          newTodayCount={newTodayCount}
          preparedCount={preparedJobs.length}
          resumeStatus={resumeStatus}
          savedCount={savedJobs.length}
        />

        <div className="queue-column">
          <QueueMeta
            activeView={activeView}
            potentialTotalCount={screeningPool.length}
            potentialVisibleCount={potentialJobs.length}
            totalCount={counts[activeView]}
          />
          <section className="queue-list" aria-live="polite">
            {activeContent[activeView]}
          </section>
        </div>
      </section>
    </main>
  )
}
