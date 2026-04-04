import type {
  ApplicationAnswerRecord,
  OperatorWorkspaceRecord,
  ResumeExperienceRecord,
} from '@/lib/domain/types'
import type { RankedJobRecord } from '@/lib/jobs/contracts'

export interface JobSummaryInput {
  job: RankedJobRecord
}

export interface JobSummaryOutput {
  editorialSummary: string
  focusSummary: string
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
  jobSummary: JobSummaryOutput
  resumeVariant: ResumeVariantOutput
}
