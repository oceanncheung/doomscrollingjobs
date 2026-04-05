import type { WorkflowStatus } from '@/lib/domain/types'
import {
  isArchivedWorkflowStatus,
  isSavedWorkflowStatus,
} from '@/lib/jobs/workflow-state'

export const jobWorkflowQuickActionKinds = [
  'save',
  'skip',
  'archive',
  'restore',
  'mark-applied',
] as const

export type JobWorkflowQuickActionKind = (typeof jobWorkflowQuickActionKinds)[number]

export interface JobWorkflowQuickAction {
  defaultLabel: string
  kind: JobWorkflowQuickActionKind
  targetStatus: WorkflowStatus
}

export const workflowEditingUnavailableReason = "Job updates aren't available right now."

const quickActions: Record<JobWorkflowQuickActionKind, JobWorkflowQuickAction> = {
  archive: {
    defaultLabel: 'Archive',
    kind: 'archive',
    targetStatus: 'archived',
  },
  'mark-applied': {
    defaultLabel: 'Mark Applied',
    kind: 'mark-applied',
    targetStatus: 'applied',
  },
  restore: {
    defaultLabel: 'Back to Potential',
    kind: 'restore',
    targetStatus: 'ranked',
  },
  save: {
    defaultLabel: 'Save',
    kind: 'save',
    targetStatus: 'shortlisted',
  },
  skip: {
    defaultLabel: 'Skip',
    kind: 'skip',
    targetStatus: 'archived',
  },
}

export function asJobWorkflowQuickActionKind(value: string) {
  return jobWorkflowQuickActionKinds.includes(value as JobWorkflowQuickActionKind)
    ? (value as JobWorkflowQuickActionKind)
    : null
}

export function getJobWorkflowQuickAction(kind: JobWorkflowQuickActionKind) {
  return quickActions[kind]
}

export function getWorkflowActionDisabledReason(kind: JobWorkflowQuickActionKind) {
  switch (kind) {
    case 'save':
      return 'Open the main queue to save this job.'
    case 'skip':
      return 'Open the main queue to skip this job.'
    case 'archive':
      return 'Open the main queue to archive this job.'
    case 'restore':
      return 'Open the main queue to move this job back to Potential.'
    case 'mark-applied':
      return 'Open the main queue to mark this job as applied.'
  }
}

export function getJobWorkflowTargetStatusForQuickAction(kind: JobWorkflowQuickActionKind) {
  return quickActions[kind].targetStatus
}

export function getWorkflowEventType(targetStatus: WorkflowStatus) {
  if (targetStatus === 'applied') {
    return 'applied' as const
  }

  if (targetStatus === 'follow_up_due') {
    return 'follow_up_due' as const
  }

  return 'status_changed' as const
}

export function getWorkflowSuccessMessage(targetStatus: WorkflowStatus) {
  switch (targetStatus) {
    case 'ranked':
      return 'Job returned to the Potential queue.'
    case 'shortlisted':
      return 'Job saved to the queue.'
    case 'archived':
      return 'Job dismissed from the active queue.'
    case 'preparing':
      return 'Job moved into packet preparation.'
    case 'ready_to_apply':
      return 'Job marked ready.'
    case 'applied':
      return 'Job marked as applied.'
    case 'follow_up_due':
      return 'Follow-up is now due for this job.'
    case 'interview':
      return 'Job moved into interview stage.'
    case 'rejected':
      return 'Job marked as rejected.'
    default:
      return 'Job workflow status saved.'
  }
}

export function getWorkflowTransitionNote({
  actionKind,
  targetStatus,
}: {
  actionKind: JobWorkflowQuickActionKind | null
  targetStatus: WorkflowStatus
}) {
  if (actionKind === 'save') {
    return 'Moved into the shortlist.'
  }

  if (actionKind === 'skip') {
    return 'Dismissed from the ranked queue.'
  }

  if (actionKind === 'archive') {
    return 'Archived from the active queue.'
  }

  if (actionKind === 'restore') {
    return 'Returned to the Potential queue.'
  }

  if (actionKind === 'mark-applied') {
    return 'Marked applied from the review workspace.'
  }

  return `Workflow status updated to ${targetStatus.replaceAll('_', ' ')}.`
}

export function isJobWorkflowQuickActionDisabled(
  currentStatus: WorkflowStatus,
  kind: JobWorkflowQuickActionKind,
) {
  if (kind === 'save') {
    return isSavedWorkflowStatus(currentStatus)
  }

  if (kind === 'skip' || kind === 'archive') {
    return isArchivedWorkflowStatus(currentStatus)
  }

  return false
}
