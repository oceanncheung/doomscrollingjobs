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

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []
}

function asRelatedRow(value: unknown) {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

loadEnvFile('.env.local')
loadEnvFile('.env')

const args = process.argv.slice(2)
const force = args.includes('--force')
const jobIds = args.filter((value) => !value.startsWith('--'))

const [{ createClient }, { syncJobReviewCopy }] = await Promise.all([
  import('../lib/supabase/server.ts'),
  import('../lib/jobs/job-review-copy.ts'),
])

const supabase = createClient()
let query = supabase.from('job_scores').select(
  `
    id,
    job_id,
    fit_summary,
    fit_reasons,
    ai_match_summary,
    ai_description_excerpt,
    ai_summary_status,
    jobs!inner (
      company_name,
      department,
      description_text,
      location_label,
      preferred_qualifications,
      remote_type,
      requirements,
      salary_currency,
      salary_max,
      salary_min,
      skills_keywords,
      title
    )
  `,
)

if (jobIds.length > 0) {
  query = query.in('job_id', jobIds)
}

const { data, error } = await query

if (error) {
  throw error
}

const inputs =
  (data ?? [])
    .map((row) => {
      const job = asRelatedRow(row.jobs)

      if (!job) {
        return null
      }

      return {
        existingAiDescriptionExcerpt: asString(row.ai_description_excerpt),
        existingAiMatchSummary: asString(row.ai_match_summary),
        existingAiSummaryStatus:
          asString(row.ai_summary_status) === 'generated' || asString(row.ai_summary_status) === 'failed'
            ? asString(row.ai_summary_status)
            : 'not_started',
        fitReasons: asStringArray(row.fit_reasons),
        fitSummary: asString(row.fit_summary),
        force,
        job: {
          companyName: asString(job.company_name),
          department: asString(job.department),
          descriptionText: asString(job.description_text),
          locationLabel: asString(job.location_label),
          preferredQualifications: asStringArray(job.preferred_qualifications),
          remoteType: asString(job.remote_type) || 'remote',
          requirements: asStringArray(job.requirements),
          salaryCurrency: asString(job.salary_currency) || undefined,
          salaryMax: typeof job.salary_max === 'number' ? job.salary_max : undefined,
          salaryMin: typeof job.salary_min === 'number' ? job.salary_min : undefined,
          skillsKeywords: asStringArray(job.skills_keywords),
          title: asString(job.title),
        },
        jobScoreId: asString(row.id),
      }
    })
    .filter((item) => item !== null)

const result = await syncJobReviewCopy(inputs)

console.log(
  JSON.stringify(
    {
      force,
      generatedCount: result.generatedCount,
      inputCount: inputs.length,
      jobIds,
      failedCount: result.failedCount,
      skippedCount: result.skippedCount,
    },
    null,
    2,
  ),
)
