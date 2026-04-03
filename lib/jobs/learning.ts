import 'server-only'

import { hasSupabaseServerEnv } from '@/lib/env'
import type { WorkflowStatus } from '@/lib/domain/types'
import type { RankedJobRecord } from '@/lib/jobs/contracts'
import { createClient } from '@/lib/supabase/server'

export type PreferenceSignalKind = 'apply' | 'prepare' | 'save' | 'skip'

interface LearningExample {
  jobId: string
  signalKind: PreferenceSignalKind
  traits: LearningTraits
  weight: number
}

interface LearningContribution {
  contribution: number
  example: LearningExample
  similarity: number
}

interface LearningTraits {
  companyTypeTags: string[]
  industryTags: string[]
  marketTags: string[]
  roleTags: string[]
  seniorityTags: string[]
  skillTags: string[]
}

interface LearningCandidateShape {
  companyDomain?: string
  companyName: string
  department?: string
  descriptionText: string
  locationLabel?: string
  preferredQualifications: string[]
  remoteRegions: string[]
  seniorityLabel?: string
  skillsKeywords: string[]
  sourceName: string
  title: string
  requirements: string[]
}

const workflowSignalKinds: Partial<Record<WorkflowStatus, { kind: PreferenceSignalKind; weight: number }>> = {
  applied: { kind: 'apply', weight: 4.6 },
  archived: { kind: 'skip', weight: -3.1 },
  follow_up_due: { kind: 'apply', weight: 4.3 },
  interview: { kind: 'apply', weight: 4.8 },
  preparing: { kind: 'prepare', weight: 3.3 },
  ready_to_apply: { kind: 'prepare', weight: 3.6 },
  shortlisted: { kind: 'save', weight: 2.4 },
}

const companyTypeMatchers: Array<{ label: string; patterns: string[] }> = [
  { label: 'agency', patterns: ['agency', 'studio', 'creative studio', 'design studio'] },
  { label: 'saas', patterns: ['saas', 'software', 'platform', 'b2b'] },
  { label: 'startup', patterns: ['startup', 'early stage', 'venture backed', 'series a', 'series b'] },
  { label: 'enterprise', patterns: ['enterprise', 'global company', 'fortune 500', 'large team'] },
  { label: 'consumer', patterns: ['consumer', 'consumer brand', 'consumer app', 'lifestyle'] },
]

const industryMatchers: Array<{ label: string; patterns: string[] }> = [
  { label: 'ai', patterns: ['ai', 'artificial intelligence', 'genai', 'machine intelligence'] },
  { label: 'healthcare', patterns: ['health', 'healthcare', 'medical', 'care'] },
  { label: 'finance', patterns: ['finance', 'fintech', 'banking', 'investment'] },
  { label: 'education', patterns: ['education', 'learning', 'edtech'] },
  { label: 'media', patterns: ['media', 'editorial', 'publishing', 'content'] },
  { label: 'developer tools', patterns: ['developer', 'engineering', 'api', 'infrastructure'] },
  { label: 'ecommerce', patterns: ['commerce', 'ecommerce', 'retail', 'shop'] },
]

const skillMatchers = [
  'brand design',
  'visual design',
  'graphic design',
  'presentation design',
  'marketing design',
  'production design',
  'web design',
  'editorial design',
  'campaign design',
  'motion design',
  'motion graphics',
  'art direction',
  'creative direction',
  'typography',
  'layout design',
  'design systems',
  'landing pages',
  'social creative',
  'storytelling',
  'figma',
  'adobe creative suite',
  'photoshop',
  'illustrator',
  'indesign',
  'after effects',
  'powerpoint',
  'google slides',
]

const learningScale = 3.6
const maxLearningDelta = 14
const minReasonContribution = 0.9

function roundScore(value: number) {
  return Math.round(value * 10) / 10
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function normalizeToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function toPaddedText(values: string[]) {
  return ` ${values.map((value) => normalizeToken(value)).filter(Boolean).join(' ')} `
}

function toTokenSet(values: string[]) {
  return new Set(
    values
      .flatMap((value) => normalizeToken(value).split(/\s+/))
      .filter((value) => value.length > 1),
  )
}

function toPhraseSet(values: string[]) {
  return new Set(values.map((value) => normalizeToken(value)).filter(Boolean))
}

function getIntersection<T>(left: Set<T>, right: Set<T>) {
  return [...left].filter((value) => right.has(value))
}

function getOverlapRatio(left: Set<string>, right: Set<string>) {
  if (left.size === 0 || right.size === 0) {
    return 0
  }

  const shared = getIntersection(left, right).length
  const union = new Set([...left, ...right]).size

  return union === 0 ? 0 : shared / union
}

function getExactMatchRatio(left: string[], right: string[]) {
  return getOverlapRatio(toPhraseSet(left), toPhraseSet(right))
}

function extractLabels(text: string, matchers: Array<{ label: string; patterns: string[] }>) {
  const paddedText = ` ${normalizeToken(text)} `

  return matchers
    .filter((matcher) =>
      matcher.patterns.some((pattern) => paddedText.includes(` ${normalizeToken(pattern)} `)),
    )
    .map((matcher) => matcher.label)
}

function extractSkillTags(candidate: LearningCandidateShape) {
  const providedSkills = candidate.skillsKeywords
    .map((skill) => normalizeToken(skill))
    .filter((skill) => skill.length > 0)
  const text = toPaddedText([
    candidate.title,
    candidate.department ?? '',
    candidate.descriptionText,
    ...candidate.requirements,
    ...candidate.preferredQualifications,
    ...candidate.skillsKeywords,
  ])
  const matchedSkills = skillMatchers.filter((skill) => text.includes(` ${normalizeToken(skill)} `))

  return [...new Set([...providedSkills, ...matchedSkills])].slice(0, 16)
}

function extractMarketTags(candidate: LearningCandidateShape) {
  const locationTokens = [
    ...(candidate.remoteRegions ?? []),
    candidate.locationLabel ?? '',
    candidate.sourceName,
  ]

  return [...new Set(locationTokens.map((value) => normalizeToken(value)).filter(Boolean))]
}

function buildLearningTraits(candidate: LearningCandidateShape): LearningTraits {
  const descriptiveText = [
    candidate.companyName,
    candidate.companyDomain ?? '',
    candidate.title,
    candidate.department ?? '',
    candidate.descriptionText,
    ...candidate.requirements,
    ...candidate.preferredQualifications,
    ...candidate.skillsKeywords,
  ].join(' ')

  return {
    companyTypeTags: extractLabels(descriptiveText, companyTypeMatchers),
    industryTags: extractLabels(descriptiveText, industryMatchers),
    marketTags: extractMarketTags(candidate),
    roleTags: [...toTokenSet([candidate.title, candidate.department ?? ''])],
    seniorityTags: [...toTokenSet([candidate.seniorityLabel ?? ''])],
    skillTags: extractSkillTags(candidate),
  }
}

function serializeTraits(traits: LearningTraits) {
  return {
    companyTypeTags: traits.companyTypeTags,
    industryTags: traits.industryTags,
    marketTags: traits.marketTags,
    roleTags: traits.roleTags,
    seniorityTags: traits.seniorityTags,
    skillTags: traits.skillTags,
  }
}

function parseTraits(value: unknown): LearningTraits | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  const record = value as Record<string, unknown>
  const asStringArray = (input: unknown) =>
    Array.isArray(input)
      ? input.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : []

  return {
    companyTypeTags: asStringArray(record.companyTypeTags),
    industryTags: asStringArray(record.industryTags),
    marketTags: asStringArray(record.marketTags),
    roleTags: asStringArray(record.roleTags),
    seniorityTags: asStringArray(record.seniorityTags),
    skillTags: asStringArray(record.skillTags),
  }
}

function toLearningShape(job: RankedJobRecord): LearningCandidateShape {
  return {
    companyDomain: job.companyDomain,
    companyName: job.companyName,
    department: job.department,
    descriptionText: job.descriptionText,
    locationLabel: job.locationLabel,
    preferredQualifications: job.preferredQualifications,
    remoteRegions: job.remoteRegions,
    seniorityLabel: job.seniorityLabel,
    skillsKeywords: job.skillsKeywords,
    sourceName: job.sourceName,
    title: job.title,
    requirements: job.requirements,
  }
}

function computeSimilarity(candidateTraits: LearningTraits, exampleTraits: LearningTraits) {
  const roleSimilarity = getExactMatchRatio(candidateTraits.roleTags, exampleTraits.roleTags)
  const companyTypeSimilarity = getExactMatchRatio(
    candidateTraits.companyTypeTags,
    exampleTraits.companyTypeTags,
  )
  const industrySimilarity = getExactMatchRatio(candidateTraits.industryTags, exampleTraits.industryTags)
  const skillSimilarity = getExactMatchRatio(candidateTraits.skillTags, exampleTraits.skillTags)
  const marketSimilarity = getExactMatchRatio(candidateTraits.marketTags, exampleTraits.marketTags)
  const senioritySimilarity = getExactMatchRatio(
    candidateTraits.seniorityTags,
    exampleTraits.seniorityTags,
  )

  return (
    roleSimilarity * 0.28 +
    companyTypeSimilarity * 0.12 +
    industrySimilarity * 0.18 +
    skillSimilarity * 0.24 +
    marketSimilarity * 0.1 +
    senioritySimilarity * 0.08
  )
}

function getPreferenceSignalFromStatus(status: WorkflowStatus) {
  return workflowSignalKinds[status] ?? null
}

function getSignalLabel(kind: PreferenceSignalKind) {
  switch (kind) {
    case 'apply':
      return 'applied roles'
    case 'prepare':
      return 'prepared roles'
    case 'save':
      return 'saved roles'
    default:
      return 'skipped roles'
  }
}

function describeSharedTraits(candidate: LearningTraits, example: LearningTraits) {
  const sharedSkills = getIntersection(toPhraseSet(candidate.skillTags), toPhraseSet(example.skillTags))
  const sharedIndustries = getIntersection(
    toPhraseSet(candidate.industryTags),
    toPhraseSet(example.industryTags),
  )
  const sharedMarkets = getIntersection(toPhraseSet(candidate.marketTags), toPhraseSet(example.marketTags))
  const sharedRoles = getIntersection(toPhraseSet(candidate.roleTags), toPhraseSet(example.roleTags))

  const parts: string[] = []

  if (sharedSkills.length > 0) {
    parts.push(sharedSkills.slice(0, 2).join(' and '))
  }

  if (sharedIndustries.length > 0) {
    parts.push(`${sharedIndustries[0]} context`)
  }

  if (sharedMarkets.length > 0) {
    parts.push(`${sharedMarkets[0]} market coverage`)
  }

  if (parts.length === 0 && sharedRoles.length > 0) {
    parts.push(`${sharedRoles.slice(0, 2).join(' / ')} role patterns`)
  }

  return parts.slice(0, 2)
}

function buildFeedbackReasons(
  candidateTraits: LearningTraits,
  positiveContributions: LearningContribution[],
  negativeContributions: LearningContribution[],
) {
  const reasons: string[] = []
  const strongestPositive = positiveContributions[0]
  const strongestNegative = negativeContributions[0]

  if (strongestPositive && strongestPositive.contribution >= minReasonContribution) {
    const sharedTraits = describeSharedTraits(candidateTraits, strongestPositive.example.traits)
    reasons.push(
      sharedTraits.length > 0
        ? `Your ${getSignalLabel(strongestPositive.example.signalKind)} keep favoring ${sharedTraits.join(' and ')}.`
        : `Your ${getSignalLabel(strongestPositive.example.signalKind)} keep favoring roles like this.`,
    )
  }

  if (strongestNegative && Math.abs(strongestNegative.contribution) >= minReasonContribution) {
    const sharedTraits = describeSharedTraits(candidateTraits, strongestNegative.example.traits)
    reasons.push(
      sharedTraits.length > 0
        ? `Your skipped roles keep pushing down ${sharedTraits.join(' and ')}.`
        : `Your skipped roles keep pushing down roles like this.`,
    )
  }

  return reasons.slice(0, 2)
}

function buildFeedbackSummary(delta: number, reasons: string[]) {
  if (delta >= 3) {
    return 'Strongly boosted by your recent save, prepare, and apply behavior.'
  }

  if (delta <= -3) {
    return 'Pushed down by the kinds of roles you keep skipping.'
  }

  if (reasons.length > 0) {
    return delta > 0
      ? 'Light positive preference learning is helping this role stay visible.'
      : 'Light negative preference learning is holding this role back.'
  }

  return 'Not enough strong preference signals yet to materially change this rank.'
}

function buildFallbackExamples(jobs: RankedJobRecord[]): LearningExample[] {
  return jobs
    .map((job) => {
      const signal = getPreferenceSignalFromStatus(job.workflowStatus)

      if (!signal) {
        return null
      }

      return {
        jobId: job.id,
        signalKind: signal.kind,
        traits: buildLearningTraits(toLearningShape(job)),
        weight: signal.weight,
      } satisfies LearningExample
    })
    .filter((example): example is LearningExample => example !== null)
}

async function loadPersistedExamples(
  jobs: RankedJobRecord[],
  operatorId?: string,
): Promise<LearningExample[]> {
  if (!operatorId || !hasSupabaseServerEnv()) {
    return []
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('job_feedback_signals')
      .select('job_id, signal_kind, signal_weight, signal_payload')
      .eq('operator_id', operatorId)
      .order('signal_recorded_at', { ascending: false })
      .limit(250)

    if (error || !data) {
      return []
    }

    const jobById = new Map(jobs.map((job) => [job.id, job] as const))

    return data
      .map((row) => {
        const jobId = typeof row.job_id === 'string' ? row.job_id : ''
        const signalKind =
          row.signal_kind === 'apply' ||
          row.signal_kind === 'prepare' ||
          row.signal_kind === 'save' ||
          row.signal_kind === 'skip'
            ? row.signal_kind
            : null
        const persistedJob = jobById.get(jobId)
        const signalPayload =
          row.signal_payload && typeof row.signal_payload === 'object' && !Array.isArray(row.signal_payload)
            ? (row.signal_payload as Record<string, unknown>)
            : {}
        const traits =
          (persistedJob ? buildLearningTraits(toLearningShape(persistedJob)) : null) ??
          parseTraits(signalPayload.traits)

        if (!jobId || !signalKind || !traits) {
          return null
        }

        return {
          jobId,
          signalKind,
          traits,
          weight:
            typeof row.signal_weight === 'number'
              ? row.signal_weight
              : Number.parseFloat(String(row.signal_weight ?? '0')) || 0,
        } satisfies LearningExample
      })
      .filter((example): example is LearningExample => example !== null && example.weight !== 0)
  } catch {
    return []
  }
}

export async function persistPreferenceSignal({
  jobId,
  operatorId,
  sourceContext,
  targetStatus,
  userId,
}: {
  jobId: string
  operatorId: string
  sourceContext: string
  targetStatus: WorkflowStatus
  userId: string
}) {
  const signal = getPreferenceSignalFromStatus(targetStatus)

  if (!signal || !hasSupabaseServerEnv()) {
    return
  }

  try {
    const supabase = createClient()
    const { data: jobRow, error: jobError } = await supabase
      .from('jobs')
      .select(
        `
          company_name,
          company_domain,
          title,
          department,
          description_text,
          skills_keywords,
          requirements,
          preferred_qualifications,
          remote_regions,
          location_label,
          seniority_label,
          source_name
        `,
      )
      .eq('id', jobId)
      .maybeSingle()

    if (jobError || !jobRow) {
      return
    }

    const candidate: LearningCandidateShape = {
      companyDomain: typeof jobRow.company_domain === 'string' ? jobRow.company_domain : undefined,
      companyName: typeof jobRow.company_name === 'string' ? jobRow.company_name : '',
      department: typeof jobRow.department === 'string' ? jobRow.department : undefined,
      descriptionText: typeof jobRow.description_text === 'string' ? jobRow.description_text : '',
      locationLabel: typeof jobRow.location_label === 'string' ? jobRow.location_label : undefined,
      preferredQualifications: Array.isArray(jobRow.preferred_qualifications)
        ? jobRow.preferred_qualifications.filter((item): item is string => typeof item === 'string')
        : [],
      remoteRegions: Array.isArray(jobRow.remote_regions)
        ? jobRow.remote_regions.filter((item): item is string => typeof item === 'string')
        : [],
      seniorityLabel: typeof jobRow.seniority_label === 'string' ? jobRow.seniority_label : undefined,
      skillsKeywords: Array.isArray(jobRow.skills_keywords)
        ? jobRow.skills_keywords.filter((item): item is string => typeof item === 'string')
        : [],
      sourceName: typeof jobRow.source_name === 'string' ? jobRow.source_name : '',
      title: typeof jobRow.title === 'string' ? jobRow.title : '',
      requirements: Array.isArray(jobRow.requirements)
        ? jobRow.requirements.filter((item): item is string => typeof item === 'string')
        : [],
    }

    await supabase.from('job_feedback_signals').upsert(
      {
        job_id: jobId,
        operator_id: operatorId,
        signal_kind: signal.kind,
        signal_payload: {
          sourceContext,
          targetStatus,
          traits: serializeTraits(buildLearningTraits(candidate)),
        },
        signal_recorded_at: new Date().toISOString(),
        signal_weight: signal.weight,
        user_id: userId,
      },
      {
        onConflict: 'operator_id,job_id',
      },
    )
  } catch {
    // Preference-signal persistence is optional until the migration is applied.
  }
}

export async function applyWorkflowLearning(jobs: RankedJobRecord[], operatorId?: string) {
  const persistedExamples = await loadPersistedExamples(jobs, operatorId)
  const fallbackExamples = buildFallbackExamples(jobs)
  const examplesByJobId = new Map<string, LearningExample>()

  for (const example of persistedExamples) {
    examplesByJobId.set(example.jobId, example)
  }

  for (const example of fallbackExamples) {
    if (!examplesByJobId.has(example.jobId)) {
      examplesByJobId.set(example.jobId, example)
    }
  }

  const examples = [...examplesByJobId.values()]

  if (examples.length === 0) {
    return jobs.map((job) => ({
      ...job,
      feedbackReasons: [],
      feedbackScoreDelta: 0,
      feedbackSummary: 'Not enough preference signals yet to personalize ranking.',
      personalizedScore: job.totalScore,
    }))
  }

  return jobs
    .map((job) => {
      const candidateTraits = buildLearningTraits(toLearningShape(job))
      const contributions = examples
        .filter((example) => example.jobId !== job.id)
        .map((example) => {
          const similarity = computeSimilarity(candidateTraits, example.traits)

          return {
            contribution: example.weight * similarity * learningScale,
            example,
            similarity,
          }
        })
        .filter((item) => item.similarity >= 0.12 && Math.abs(item.contribution) >= 0.25)
        .sort((left, right) => Math.abs(right.contribution) - Math.abs(left.contribution))

      const totalDelta = clamp(
        contributions.reduce((sum, item) => sum + item.contribution, 0),
        -maxLearningDelta,
        maxLearningDelta,
      )
      const positiveContributions = contributions.filter((item) => item.contribution > 0)
      const negativeContributions = contributions.filter((item) => item.contribution < 0)
      const feedbackReasons = buildFeedbackReasons(
        candidateTraits,
        positiveContributions,
        negativeContributions,
      )
      const feedbackScoreDelta = roundScore(totalDelta)

      return {
        ...job,
        feedbackReasons,
        feedbackScoreDelta,
        feedbackSummary: buildFeedbackSummary(feedbackScoreDelta, feedbackReasons),
        personalizedScore: roundScore(job.totalScore + feedbackScoreDelta),
      }
    })
    .sort((left, right) => {
      const leftScore = left.personalizedScore ?? left.totalScore
      const rightScore = right.personalizedScore ?? right.totalScore

      if (leftScore === rightScore) {
        return right.totalScore - left.totalScore
      }

      return rightScore - leftScore
    })
}
