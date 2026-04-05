import fs from 'node:fs'
import path from 'node:path'

function loadEnvFile(filename: string) {
  const filepath = path.join(process.cwd(), filename)

  if (!fs.existsSync(filepath)) {
    return
  }

  for (const line of fs.readFileSync(filepath, 'utf8').split(/\n+/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')

    if (separatorIndex <= 0) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    const rawValue = trimmed.slice(separatorIndex + 1).trim()
    const value = rawValue.replace(/^['"]|['"]$/g, '')

    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

loadEnvFile('.env.local')
loadEnvFile('.env')

const args = process.argv.slice(2)
const resetWorkflow = args.includes('--reset-workflow')
const all = args.includes('--all')
const jobIds = args.filter((value) => !value.startsWith('--'))

if (!all && jobIds.length === 0) {
  throw new Error('Pass at least one job id, or use --all.')
}

const [{ createClient }] = await Promise.all([import('../lib/supabase/server.ts')])
const supabase = createClient()
let packetQuery = supabase
  .from('application_packets')
  .select('id, job_id, resume_version_id')

if (!all) {
  packetQuery = packetQuery.in('job_id', jobIds)
}

const { data: packets, error: packetLookupError } = await packetQuery

if (packetLookupError) {
  throw packetLookupError
}

const packetRows = packets ?? []
const packetIds = packetRows.map((row) => asString(row.id)).filter(Boolean)
const targetedJobIds = Array.from(
  new Set(packetRows.map((row) => asString(row.job_id)).filter(Boolean)),
)
const resumeVersionIds = Array.from(
  new Set(packetRows.map((row) => asString(row.resume_version_id)).filter(Boolean)),
)

if (packetIds.length === 0) {
  console.log(
    JSON.stringify(
      {
        clearedAnswers: 0,
        clearedPackets: 0,
        clearedResumeVersions: 0,
        jobIds: targetedJobIds,
        resetWorkflow,
        workflowRowsUpdated: 0,
      },
      null,
      2,
    ),
  )
  process.exit(0)
}

const now = new Date().toISOString()

const { error: deleteAnswersError } = await supabase
  .from('application_answers')
  .delete()
  .in('application_packet_id', packetIds)

if (deleteAnswersError) {
  throw deleteAnswersError
}

const { error: packetUpdateError } = await supabase
  .from('application_packets')
  .update({
    cover_letter_draft: null,
    cover_letter_summary: null,
    generated_at: null,
    generation_error: null,
    generation_model: null,
    generation_prompt_version: null,
    generation_provider: null,
    generation_status: 'not_started',
    packet_status: 'draft',
    professional_summary: null,
    question_snapshot_error: null,
    question_snapshot_refreshed_at: null,
    question_snapshot_status: 'not_started',
  })
  .in('id', packetIds)

if (packetUpdateError) {
  throw packetUpdateError
}

if (resumeVersionIds.length > 0) {
  const { error: resumeUpdateError } = await supabase
    .from('resume_versions')
    .update({
      change_summary_text: null,
      experience_entries: [],
      export_status: 'draft',
      headline_text: null,
      highlighted_requirements: [],
      skills_section: [],
      summary_text: null,
      tailoring_notes: null,
    })
    .in('id', resumeVersionIds)

  if (resumeUpdateError) {
    throw resumeUpdateError
  }
}

let workflowRowsUpdated = 0

if (resetWorkflow && targetedJobIds.length > 0) {
  const { data: workflowRows, error: workflowLookupError } = await supabase
    .from('job_scores')
    .select('id')
    .in('job_id', targetedJobIds)
    .in('workflow_status', ['preparing', 'ready_to_apply'])

  if (workflowLookupError) {
    throw workflowLookupError
  }

  const workflowIds = (workflowRows ?? []).map((row) => asString(row.id)).filter(Boolean)

  if (workflowIds.length > 0) {
    const { error: workflowUpdateError } = await supabase
      .from('job_scores')
      .update({
        last_status_changed_at: now,
        workflow_status: 'shortlisted',
      })
      .in('id', workflowIds)

    if (workflowUpdateError) {
      throw workflowUpdateError
    }

    workflowRowsUpdated = workflowIds.length
  }
}

console.log(
  JSON.stringify(
    {
      clearedAnswers: packetIds.length,
      clearedPackets: packetIds.length,
      clearedResumeVersions: resumeVersionIds.length,
      jobIds: targetedJobIds,
      resetWorkflow,
      workflowRowsUpdated,
    },
    null,
    2,
  ),
)
