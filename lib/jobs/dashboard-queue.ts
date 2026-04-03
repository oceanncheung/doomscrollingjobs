import type { QualifiedJobRecord } from '@/lib/jobs/contracts'

const screeningBatchSize = 8
const minimumStrictScreeningBatch = 5

const genericMatchReasonPatterns = [
  'remote requirement still passes',
  'remote-only eligibility',
  'remote compatibility intact',
  'remote region',
]

const genericRoleTokens = new Set([
  'design',
  'designer',
  'senior',
  'junior',
  'lead',
  'staff',
  'brand',
  'visual',
  'graphic',
])

export const queueViews = ['potential', 'saved', 'prepared', 'applied', 'archive'] as const

export type QueueView = (typeof queueViews)[number]

export interface DashboardQueues {
  appliedJobs: QualifiedJobRecord[]
  archivedJobs: QualifiedJobRecord[]
  counts: Record<QueueView, number>
  potentialJobs: QualifiedJobRecord[]
  preparedJobs: QualifiedJobRecord[]
  savedJobs: QualifiedJobRecord[]
  screeningPool: QualifiedJobRecord[]
}

export function getQueueView(value: string | string[] | undefined): QueueView {
  const selected = Array.isArray(value) ? value[0] : value
  return queueViews.find((view) => view === selected) ?? 'potential'
}

function isGenericMatchReason(reason: string) {
  const normalized = reason.toLowerCase()
  return genericMatchReasonPatterns.some((pattern) => normalized.includes(pattern))
}

export function getMatchReason(job: QualifiedJobRecord) {
  const candidates = [...job.fitReasons, ...job.strongReasons, job.queueReason].filter(Boolean)

  return candidates.find((reason) => !isGenericMatchReason(reason)) ?? candidates[0] ?? job.queueReason
}

function sortStageJobs(jobs: QualifiedJobRecord[]) {
  const queueOrder: Record<QualifiedJobRecord['queueSegment'], number> = {
    apply_now: 0,
    worth_reviewing: 1,
    monitor: 2,
    hidden: 3,
  }

  return [...jobs].sort((left, right) => {
    if (left.queueSegment !== right.queueSegment) {
      return queueOrder[left.queueSegment] - queueOrder[right.queueSegment]
    }

    if (left.queueScore !== right.queueScore) {
      return right.queueScore - left.queueScore
    }

    if ((left.daysSincePosted ?? Number.MAX_SAFE_INTEGER) !== (right.daysSincePosted ?? Number.MAX_SAFE_INTEGER)) {
      return (left.daysSincePosted ?? Number.MAX_SAFE_INTEGER) - (right.daysSincePosted ?? Number.MAX_SAFE_INTEGER)
    }

    return left.companyName.localeCompare(right.companyName) || left.title.localeCompare(right.title)
  })
}

function isActiveScreeningJob(job: QualifiedJobRecord) {
  return (job.workflowStatus === 'new' || job.workflowStatus === 'ranked') && job.queueSegment !== 'hidden'
}

function isStrictScreeningCandidate(job: QualifiedJobRecord) {
  if (!isActiveScreeningJob(job)) {
    return false
  }

  if (
    job.roleFit.band === 'weak' ||
    job.roleFit.band === 'blocked' ||
    job.eligibility.band === 'blocked' ||
    job.marketFit.band === 'blocked'
  ) {
    return false
  }

  return !isGenericMatchReason(getMatchReason(job))
}

function buildScreeningPool(jobs: QualifiedJobRecord[]) {
  const strictPool = sortStageJobs(jobs.filter(isStrictScreeningCandidate))

  if (strictPool.length >= minimumStrictScreeningBatch) {
    return strictPool
  }

  const relaxedPool = sortStageJobs(jobs.filter(isActiveScreeningJob))
  const strictIds = new Set(strictPool.map((job) => job.id))
  const replenishmentPool = relaxedPool.filter((job) => !strictIds.has(job.id))

  return [...strictPool, ...replenishmentPool]
}

function buildPotentialQueue(jobs: QualifiedJobRecord[]) {
  const selected: QualifiedJobRecord[] = []
  const seenCompanies = new Set<string>()
  const seenRolePatterns = new Set<string>()

  const getRolePattern = (job: QualifiedJobRecord) => {
    const tokens = job.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2 && !genericRoleTokens.has(token))

    return tokens.slice(0, 2).join(' ') || job.title.toLowerCase()
  }

  for (const job of jobs) {
    if (selected.length >= screeningBatchSize) {
      break
    }

    const companyKey = job.companyName.toLowerCase()
    const rolePattern = getRolePattern(job)

    if (seenCompanies.has(companyKey) || seenRolePatterns.has(rolePattern)) {
      continue
    }

    seenCompanies.add(companyKey)
    seenRolePatterns.add(rolePattern)
    selected.push(job)
  }

  if (selected.length < screeningBatchSize) {
    const selectedIds = new Set(selected.map((job) => job.id))

    for (const job of jobs) {
      if (selected.length >= screeningBatchSize) {
        break
      }

      if (selectedIds.has(job.id)) {
        continue
      }

      selected.push(job)
      selectedIds.add(job.id)
    }
  }

  return selected
}

export function getDashboardQueues(jobs: QualifiedJobRecord[]): DashboardQueues {
  const screeningPool = buildScreeningPool(jobs)
  const potentialJobs = buildPotentialQueue(screeningPool)
  const savedJobs = sortStageJobs(
    jobs.filter((job) => job.workflowStatus === 'shortlisted' || job.workflowStatus === 'preparing'),
  )
  const preparedJobs = sortStageJobs(jobs.filter((job) => job.workflowStatus === 'ready_to_apply'))
  const appliedJobs = sortStageJobs(
    jobs.filter(
      (job) =>
        job.workflowStatus === 'applied' ||
        job.workflowStatus === 'follow_up_due' ||
        job.workflowStatus === 'interview',
    ),
  )
  const archivedJobs = sortStageJobs(
    jobs.filter((job) => job.workflowStatus === 'archived' || job.workflowStatus === 'rejected'),
  )

  return {
    appliedJobs,
    archivedJobs,
    counts: {
      applied: appliedJobs.length,
      archive: archivedJobs.length,
      potential: screeningPool.length,
      prepared: preparedJobs.length,
      saved: savedJobs.length,
    },
    potentialJobs,
    preparedJobs,
    savedJobs,
    screeningPool,
  }
}
