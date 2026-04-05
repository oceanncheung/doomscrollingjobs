import 'server-only'

import { getOperatorProfile } from '@/lib/data/operator-profile'
import type { CompensationPeriod } from '@/lib/jobs/contracts'
import { getRankedJobs } from '@/lib/data/jobs'
import { getDashboardQueues } from '@/lib/jobs/dashboard-queue'
import { hasSuspiciousStoredCompensation } from '@/lib/jobs/source-parsing'
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
  suspiciousCompensationAudit: {
    count: number
    examples: Array<{
      companyName: string
      normalizedPeriod: string
      salaryMax: number | undefined
      salaryMin: number | undefined
      storedPeriod: string
      title: string
    }>
  }
  profileCompleteness: {
    score: number
    total: number
  }
  sourceDiagnostics: Array<Record<string, unknown>>
  visibleQueueCount: number
}

interface SuspiciousCompensationExample {
  companyName: string
  normalizedPeriod: CompensationPeriod
  salaryMax: number | undefined
  salaryMin: number | undefined
  storedPeriod: string
  title: string
}

export async function getSystemReadinessAudit(): Promise<SystemReadinessAudit> {
  const [{ jobs }, { workspace }] = await Promise.all([getRankedJobs(), getOperatorProfile()])
  const queues = getDashboardQueues(jobs)
  const supabase = createClient()
  const [{ data: sourceDiagnostics }, { data: packetGenerationRows }, { data: compensationRows }] =
    await Promise.all([
    supabase
      .from('source_sync_diagnostics')
      .select(
        'source_name, rows_seen, rows_normalized, rows_imported, rows_qualified, rows_visible, synced_at, issue',
      )
      .order('source_name', { ascending: true }),
    supabase.from('application_packets').select('generation_status'),
    supabase
      .from('jobs')
      .select('title, company_name, salary_min, salary_max, salary_period, description_text')
      .limit(500),
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
  const suspiciousCompensationExamples: SuspiciousCompensationExample[] = (
    (compensationRows as Array<Record<string, unknown>> | null) ?? []
  ).flatMap((row) => {
      const title = typeof row.title === 'string' ? row.title : ''
      const companyName = typeof row.company_name === 'string' ? row.company_name : ''
      const descriptionText = typeof row.description_text === 'string' ? row.description_text : ''
      const salaryMin = typeof row.salary_min === 'number' ? row.salary_min : undefined
      const salaryMax = typeof row.salary_max === 'number' ? row.salary_max : undefined
      const storedPeriod = typeof row.salary_period === 'string' ? row.salary_period : ''
      const inspection = hasSuspiciousStoredCompensation({
        descriptionText,
        salaryMax,
        salaryMin,
        storedPeriod,
      })

      if (!inspection.suspicious) {
        return []
      }

      return [
        {
          companyName,
          normalizedPeriod: inspection.normalizedPeriod,
          salaryMax,
          salaryMin,
          storedPeriod,
          title,
        },
      ]
    })

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
    suspiciousCompensationAudit: {
      count: suspiciousCompensationExamples.length,
      examples: suspiciousCompensationExamples.slice(0, 5),
    },
    profileCompleteness: {
      score: Math.min(totalSignals, countFilled(profileSignals)),
      total: totalSignals,
    },
    sourceDiagnostics: sourceDiagnostics ?? [],
    visibleQueueCount: queues.potentialJobs.length,
  }
}
