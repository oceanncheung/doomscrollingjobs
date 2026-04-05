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

loadEnvFile('.env.local')
loadEnvFile('.env')

const defaultJobId = 'ec47ed58-6782-46e4-8ce7-4b3241ef345c'
const jobId = process.argv[2] || defaultJobId

const [{ createClient }, { getApplicationPacketReview }, { generateAndPersistApplicationPacket }] =
  await Promise.all([
  import('../lib/supabase/server.ts'),
  import('../lib/data/application-packets.ts'),
  import('../lib/jobs/application-packet-generation.ts'),
  ])

const targetUrl = `http://127.0.0.1:3000/jobs/${jobId}/packet`
const review = await getApplicationPacketReview(jobId)

const beforeHtml = await fetch(targetUrl).then((response) => response.text())
const generationResult = await generateAndPersistApplicationPacket(jobId)
const afterHtml = await fetch(targetUrl).then((response) => response.text())
const supabase = createClient()

const [
  { data: packetRow, error: packetError },
  { data: resumeRow, error: resumeError },
  { data: answers, error: answersError },
  { data: scoreRow, error: scoreError },
] =
  await Promise.all([
    supabase
      .from('application_packets')
      .select(
        'id, generation_status, generation_error, cover_letter_summary, resume_version_id',
      )
      .eq('job_id', jobId)
      .maybeSingle(),
    supabase
      .from('resume_versions')
      .select('id, headline_text, summary_text, change_summary_text')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('application_answers')
      .select('id, question_key, answer_text, answer_variant_short')
      .eq('job_id', jobId),
    supabase
      .from('job_scores')
      .select('id, ai_match_summary, ai_description_excerpt, ai_summary_status')
      .eq('job_id', jobId)
      .maybeSingle(),
  ])

if (packetError) {
  throw packetError
}

if (resumeError) {
  throw resumeError
}

if (answersError) {
  throw answersError
}

if (scoreError) {
  throw scoreError
}

console.log(
  JSON.stringify(
    {
      before: {
        hasGenerateContent: beforeHtml.includes('Generate Content'),
        hasMarkReady: beforeHtml.includes('Mark Ready to Apply'),
      },
      review: {
        canSave: review.canSave,
        packetAnswerCount: review.packet?.answers.length ?? 0,
        packetSource: review.source,
        profileHeadline: review.workspace.profile.headline,
        resumeExperienceCount: review.workspace.resumeMaster.experienceEntries.length,
        resumeSkillsCount: review.workspace.resumeMaster.skillsSection.length,
        resumeSummaryPresent: Boolean(review.workspace.resumeMaster.summaryText),
      },
      db: {
        answerCount: answers?.length ?? 0,
        aiDescriptionExcerptSaved: Boolean(scoreRow?.ai_description_excerpt),
        aiMatchSummarySaved: Boolean(scoreRow?.ai_match_summary),
        aiSummaryStatus: scoreRow?.ai_summary_status ?? null,
        coverLetterSummarySaved: Boolean(packetRow?.cover_letter_summary),
        generationError: packetRow?.generation_error ?? null,
        generationStatus: packetRow?.generation_status ?? null,
        packetId: packetRow?.id ?? null,
        resumeChangeSummarySaved: Boolean(resumeRow?.change_summary_text),
        resumeHeadlineSaved: Boolean(resumeRow?.headline_text),
        resumeSummarySaved: Boolean(resumeRow?.summary_text),
        resumeVersionId: packetRow?.resume_version_id ?? resumeRow?.id ?? null,
      },
      generationResult,
      html: {
        hasApplicationMaterials: afterHtml.includes('Application materials'),
        hasGeneratedQuestions: afterHtml.includes('Application questions'),
        hasMarkReady: afterHtml.includes('Mark Ready to Apply'),
        hasSuccessCopy: afterHtml.includes('Review what will be sent.'),
      },
      jobId,
    },
    null,
    2,
  ),
)
