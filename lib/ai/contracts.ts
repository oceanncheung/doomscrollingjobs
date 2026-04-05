import type {
  ApplicationAnswerRecord,
  OperatorWorkspaceRecord,
  ResumeExperienceRecord,
} from '@/lib/domain/types'
import type { NormalizedJobRecord, RankedJobRecord } from '@/lib/jobs/contracts'

export interface JobSummaryInput {
  fitReasons: string[]
  fitSummary: string
  job: Pick<
    NormalizedJobRecord,
    | 'companyName'
    | 'department'
    | 'descriptionText'
    | 'locationLabel'
    | 'preferredQualifications'
    | 'remoteType'
    | 'requirements'
    | 'salaryCurrency'
    | 'salaryMax'
    | 'salaryMin'
    | 'skillsKeywords'
    | 'title'
  >
}

export interface JobSummaryOutput {
  descriptionExcerpt: string
  matchSummary: string
  hiringSignals: string[]
}

export interface ResumeVariantInput {
  baselineAnswers: ApplicationAnswerRecord[]
  job: RankedJobRecord
  workspace: OperatorWorkspaceRecord
}

export interface ResumeVariantOutput {
  changeSummaryForUser: string
  experienceEntries: ResumeExperienceRecord[]
  headline: string
  highlightedRequirements: string[]
  skillsSection: string[]
  summary: string
  tailoringRationale: string
}

export interface CoverLetterInput {
  job: RankedJobRecord
  resumeVariant: ResumeVariantOutput
  workspace: OperatorWorkspaceRecord
}

export interface CoverLetterOutput {
  draft: string
  summary: string
}

export interface GeneratedAnswerOutput {
  answerText: string
  answerVariantShort: string
  questionKey: string
}

export interface ApplicationAnswersInput {
  answers: ApplicationAnswerRecord[]
  job: RankedJobRecord
  resumeVariant: ResumeVariantOutput
  workspace: OperatorWorkspaceRecord
}

export interface GeneratedPacketOutput {
  answers: GeneratedAnswerOutput[]
  coverLetter: CoverLetterOutput
  resumeVariant: ResumeVariantOutput
}

export interface ProfileWorkspaceGenerationInput {
  sourceCoverLetterMarkdown: string
  sourceResumeMarkdown: string
}

export interface ProfileWorkspaceGenerationOutput {
  bioSummary: string
  headline: string
  searchBrief: string
  skills: string[]
  targetRoles: string[]
  targetSeniorityLevels: string[]
  tools: string[]
  allowedAdjacentRoles: string[]
}
