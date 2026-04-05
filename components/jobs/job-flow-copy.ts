import type { QualifiedJobRecord } from '@/lib/jobs/contracts'

export function getDetailIntro(job: QualifiedJobRecord) {
  if (job.workflowStatus === 'ready_to_apply') {
    return 'Everything is lined up. Review the role, then apply when you want to move.'
  }

  if (job.workflowStatus === 'preparing') {
    return 'Materials are already being prepared. Review the role, then continue when you want.'
  }

  return ''
}

export function getPrepIntro(job: QualifiedJobRecord) {
  if (job.workflowStatus === 'ready_to_apply') {
    return 'Your materials are ready. Review the role, then apply when you want to submit.'
  }

  return ''
}
