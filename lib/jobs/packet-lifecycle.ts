import type {
  ApplicationPacketRecord,
  PacketStatus,
  WorkflowStatus,
} from '@/lib/domain/types'
import {
  isAppliedWorkflowStatus,
  isArchivedWorkflowStatus,
  isReadyWorkflowStatus,
  shouldBeginPacketPrep,
} from '@/lib/jobs/workflow-state'

export const packetSubmitIntents = ['save-review', 'mark-ready', 'apply'] as const

export type PacketSubmitIntent = (typeof packetSubmitIntents)[number]

export interface PacketLifecycle {
  hasGeneratedContent: boolean
  isFailed: boolean
  isRunning: boolean
  packetStatus: PacketStatus
  phase: 'applied' | 'archived' | 'draft' | 'failed' | 'idle' | 'ready' | 'running'
  readyAnswerCount: number
  showQuestionSection: boolean
}

export function asPacketSubmitIntent(value: string): PacketSubmitIntent {
  return packetSubmitIntents.includes(value as PacketSubmitIntent)
    ? (value as PacketSubmitIntent)
    : 'save-review'
}

export function getNextPacketStatus({
  currentStatus,
  submitIntent,
}: {
  currentStatus: PacketStatus
  submitIntent: PacketSubmitIntent
}) {
  if (submitIntent === 'mark-ready') {
    return 'ready'
  }

  if (submitIntent === 'apply') {
    return 'applied'
  }

  return currentStatus
}

export function getPacketWorkflowTargetStatus({
  currentWorkflowStatus,
  submitIntent,
}: {
  currentWorkflowStatus: WorkflowStatus | null
  submitIntent: PacketSubmitIntent
}): WorkflowStatus | null {
  if (submitIntent === 'mark-ready') {
    return 'ready_to_apply'
  }

  if (submitIntent === 'apply') {
    return 'applied'
  }

  if (!currentWorkflowStatus) {
    return 'preparing'
  }

  if (shouldBeginPacketPrep(currentWorkflowStatus)) {
    return 'preparing'
  }

  if (isReadyWorkflowStatus(currentWorkflowStatus) || isAppliedWorkflowStatus(currentWorkflowStatus)) {
    return currentWorkflowStatus
  }

  if (isArchivedWorkflowStatus(currentWorkflowStatus)) {
    return null
  }

  return 'preparing'
}

export function getPacketLifecycle(
  packet: Pick<ApplicationPacketRecord, 'answers' | 'generationStatus' | 'packetStatus' | 'questionSnapshotStatus'>,
): PacketLifecycle {
  const hasGeneratedContent = packet.generationStatus === 'generated'
  const readyAnswerCount = packet.answers.filter(
    (answer) => answer.answerText.trim() || answer.answerVariantShort.trim(),
  ).length

  if (packet.generationStatus === 'running') {
    return {
      hasGeneratedContent,
      isFailed: false,
      isRunning: true,
      packetStatus: packet.packetStatus,
      phase: 'running',
      readyAnswerCount,
      showQuestionSection: false,
    }
  }

  if (packet.generationStatus === 'failed') {
    return {
      hasGeneratedContent,
      isFailed: true,
      isRunning: false,
      packetStatus: packet.packetStatus,
      phase: 'failed',
      readyAnswerCount,
      showQuestionSection: false,
    }
  }

  if (packet.packetStatus === 'applied') {
    return {
      hasGeneratedContent,
      isFailed: false,
      isRunning: false,
      packetStatus: packet.packetStatus,
      phase: 'applied',
      readyAnswerCount,
      showQuestionSection: packet.questionSnapshotStatus === 'extracted' && packet.answers.length > 0,
    }
  }

  if (packet.packetStatus === 'archived') {
    return {
      hasGeneratedContent,
      isFailed: false,
      isRunning: false,
      packetStatus: packet.packetStatus,
      phase: 'archived',
      readyAnswerCount,
      showQuestionSection: packet.questionSnapshotStatus === 'extracted' && packet.answers.length > 0,
    }
  }

  if (packet.packetStatus === 'ready') {
    return {
      hasGeneratedContent,
      isFailed: false,
      isRunning: false,
      packetStatus: packet.packetStatus,
      phase: 'ready',
      readyAnswerCount,
      showQuestionSection: packet.questionSnapshotStatus === 'extracted' && packet.answers.length > 0,
    }
  }

  if (hasGeneratedContent) {
    return {
      hasGeneratedContent,
      isFailed: false,
      isRunning: false,
      packetStatus: packet.packetStatus,
      phase: 'draft',
      readyAnswerCount,
      showQuestionSection: packet.questionSnapshotStatus === 'extracted' && packet.answers.length > 0,
    }
  }

  return {
    hasGeneratedContent,
    isFailed: false,
    isRunning: false,
    packetStatus: packet.packetStatus,
    phase: 'idle',
    readyAnswerCount,
    showQuestionSection: false,
  }
}
