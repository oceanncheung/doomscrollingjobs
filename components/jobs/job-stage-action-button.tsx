'use client'

import { useActionState } from 'react'

import { updateJobWorkflow, type JobWorkflowActionState } from '@/app/jobs/actions'
import type { WorkflowStatus } from '@/lib/domain/types'

const initialState: JobWorkflowActionState = {
  message: '',
  status: 'idle',
}

interface JobStageActionButtonProps {
  canEdit: boolean
  disabledReason?: string
  intent?: 'dismiss' | 'save' | 'shortlist'
  jobId: string
  label: string
  showMessage?: boolean
  sourceContext: string
  variant?: 'ghost' | 'primary' | 'secondary'
  workflowStatus?: WorkflowStatus
}

export function JobStageActionButton({
  canEdit,
  disabledReason,
  intent,
  jobId,
  label,
  showMessage = false,
  sourceContext,
  variant = 'secondary',
  workflowStatus,
}: JobStageActionButtonProps) {
  const [state, formAction, isPending] = useActionState(updateJobWorkflow, initialState)
  const isDisabled = !canEdit || isPending
  const message = !canEdit ? disabledReason : state.message

  return (
    <form action={formAction} className="stage-action-form">
      <input name="jobId" type="hidden" value={jobId} />
      <input name="sourceContext" type="hidden" value={sourceContext} />
      {intent ? <input name="intent" type="hidden" value={intent} /> : null}
      {workflowStatus ? <input name="workflowStatus" type="hidden" value={workflowStatus} /> : null}

      <button
        className={`button button-${variant} button-small`}
        disabled={isDisabled}
        type="submit"
      >
        {isPending ? 'Saving...' : label}
      </button>

      {showMessage && message ? (
        <p
          className={`action-note ${
            state.status === 'error' ? 'action-note-error' : 'action-note-success'
          }`}
        >
          {message}
        </p>
      ) : null}
    </form>
  )
}
