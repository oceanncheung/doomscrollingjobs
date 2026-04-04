import 'server-only'

import { getOperatorProfile } from '@/lib/data/operator-profile'
import { getRankedJobs } from '@/lib/data/jobs'
import { getDashboardQueues } from '@/lib/jobs/dashboard-queue'
import { createClient } from '@/lib/supabase/server'

function countFilled(values: string[]) {
  return values.filter((value) => value.trim().length > 0).length
}

export interface SystemReadinessAudit {
  candidatePoolCount: number
  exportReadiness: {
    coverLetterFileConfigured: boolean
    portfolioFileConfigured: boolean
    resumeFileConfigured: boolean
  }
  packetGenerationReadiness: {
    failedCount: number
    generatedCount: number
    notStartedCount: number
    runningCount: number
  }
  profileCompleteness: {
    score: number
    total: number
  }
  sourceDiagnostics: Array<Record<string, unknown>>
  visibleQueueCount: number
}

export async function getSystemReadinessAudit(): Promise<SystemReadinessAudit> {
  const [{ jobs }, { workspace }] = await Promise.all([getRankedJobs(), getOperatorProfile()])
  const queues = getDashboardQueues(jobs)
  const supabase = createClient()
  const [{ data: sourceDiagnostics }, { data: packetGenerationRows }] = await Promise.all([
    supabase
      .from('source_sync_diagnostics')
      .select(
        'source_name, rows_seen, rows_normalized, rows_imported, rows_qualified, rows_visible, synced_at, issue',
      )
      .order('source_name', { ascending: true }),
    supabase.from('application_packets').select('generation_status'),
  ])

  const profileSignals = [
    workspace.profile.headline,
    workspace.profile.locationLabel,
    workspace.profile.primaryMarket,
    workspace.profile.searchBrief,
    workspace.profile.portfolioPrimaryUrl,
    workspace.resumeMaster.summaryText,
    ...workspace.profile.targetRoles,
    ...workspace.profile.skills,
  ]
  const totalSignals = 8
  const packetRows = (packetGenerationRows as Array<{ generation_status?: string }> | null) ?? []

  return {
    candidatePoolCount: jobs.length,
    exportReadiness: {
      coverLetterFileConfigured: Boolean(workspace.resumeMaster.coverLetterPdfFileName),
      portfolioFileConfigured: Boolean(workspace.resumeMaster.portfolioPdfFileName),
      resumeFileConfigured: Boolean(workspace.resumeMaster.resumePdfFileName),
    },
    packetGenerationReadiness: {
      failedCount: packetRows.filter((row) => row.generation_status === 'failed').length,
      generatedCount: packetRows.filter((row) => row.generation_status === 'generated').length,
      notStartedCount: packetRows.filter((row) => !row.generation_status || row.generation_status === 'not_started').length,
      runningCount: packetRows.filter((row) => row.generation_status === 'running').length,
    },
    profileCompleteness: {
      score: Math.min(totalSignals, countFilled(profileSignals)),
      total: totalSignals,
    },
    sourceDiagnostics: sourceDiagnostics ?? [],
    visibleQueueCount: queues.potentialJobs.length,
  }
}
