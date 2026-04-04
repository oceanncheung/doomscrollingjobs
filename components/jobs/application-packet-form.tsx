'use client'

import { useActionState } from 'react'

import { saveApplicationPacket, type ApplicationPacketActionState } from '@/app/jobs/actions'
import { PacketFormFooterMessage } from '@/components/jobs/packet-form-footer-message'
import { PacketMaterialsSection } from '@/components/jobs/packet-materials-section'
import { PacketPreGenerationSection } from '@/components/jobs/packet-pre-generation-section'
import { PacketQuestionsSection } from '@/components/jobs/packet-questions-section'
import { type ApplicationPacketRecord } from '@/lib/domain/types'
import type { RankedJobRecord } from '@/lib/jobs/contracts'

const initialState: ApplicationPacketActionState = {
  message: '',
  status: 'idle',
}

function toTextAreaValue(values: string[]) {
  return values.join('\n')
}

function getFirstFilledText(...values: Array<string | null | undefined>) {
  return values.find((value) => value?.trim())?.trim() ?? ''
}

function getPreviewText(value: string, fallback: string, maxLength = 220) {
  const trimmed = value.trim()

  if (!trimmed) {
    return fallback
  }

  if (trimmed.length <= maxLength) {
    return trimmed
  }

  return `${trimmed.slice(0, maxLength).trimEnd()}...`
}

interface ApplicationPacketFormProps {
  canSave: boolean
  disabledReason?: string
  job: RankedJobRecord
  packet: ApplicationPacketRecord
  showGeneratedContent: boolean
}

export function ApplicationPacketForm({
  job,
  packet,
  showGeneratedContent,
}: ApplicationPacketFormProps) {
  const [state, formAction] = useActionState(saveApplicationPacket, initialState)

  const resumeSource = getFirstFilledText(packet.resumeVersion.summaryText, packet.professionalSummary)
  const coverLetterSource = packet.coverLetterDraft.trim()
  const readyAnswerCount = packet.answers.filter(
    (answer) => answer.answerText.trim() || answer.answerVariantShort.trim(),
  ).length

  const resumeReady = Boolean(
    resumeSource ||
      packet.resumeVersion.highlightedRequirements.length > 0 ||
      packet.resumeVersion.skillsSection.length > 0,
  )
  const coverLetterReady = Boolean(coverLetterSource)

  const resumeSummary = getPreviewText(
    resumeSource,
    'A tailored resume summary will appear here once the application materials are generated.',
  )
  const coverLetterSummary = getPreviewText(
    packet.coverLetterSummary || coverLetterSource,
    'A role-specific cover letter will appear here once the application materials are generated.',
  )
  const resumeChangeSummary = getPreviewText(
    packet.resumeVersion.changeSummaryText,
    'A short explanation of how the resume changed will appear here once the application materials are generated.',
  )
  const isRunning = packet.generationStatus === 'running'
  const isFailed = packet.generationStatus === 'failed'

  return (
    <form action={formAction} className="packet-form" id="packet-form">
      <input name="jobId" type="hidden" value={job.id} />
      <input name="jobScoreId" type="hidden" value={packet.jobScoreId} />
      <input name="packetId" type="hidden" value={packet.id} />
      <input name="resumeVersionId" type="hidden" value={packet.resumeVersion.id} />
      <input name="packetStatus" type="hidden" value={packet.packetStatus} />
      <input name="resumeVersionLabel" type="hidden" value={packet.resumeVersion.versionLabel} />
      <input
        name="resumeExperienceEntriesJson"
        type="hidden"
        value={JSON.stringify(packet.resumeVersion.experienceEntries)}
      />
      <input
        name="caseStudySelectionJson"
        type="hidden"
        value={JSON.stringify(packet.caseStudySelection)}
      />

      <input name="resumeHeadlineText" type="hidden" value={packet.resumeVersion.headlineText} />
      <textarea hidden name="resumeChangeSummaryText" readOnly value={packet.resumeVersion.changeSummaryText} />
      <textarea hidden name="resumeSummaryText" readOnly value={packet.resumeVersion.summaryText} />
      <textarea
        hidden
        name="highlightedRequirements"
        readOnly
        value={toTextAreaValue(packet.resumeVersion.highlightedRequirements)}
      />
      <textarea
        hidden
        name="resumeSkillsSection"
        readOnly
        value={toTextAreaValue(packet.resumeVersion.skillsSection)}
      />
      <textarea hidden name="tailoringNotes" readOnly value={packet.resumeVersion.tailoringNotes} />
      <textarea hidden name="coverLetterDraft" readOnly value={packet.coverLetterDraft} />
      <textarea hidden name="coverLetterSummary" readOnly value={packet.coverLetterSummary} />
      <textarea hidden name="professionalSummary" readOnly value={packet.professionalSummary} />
      <textarea hidden name="jobSummary" readOnly value={packet.jobSummary} />
      <textarea hidden name="jobFocusSummary" readOnly value={packet.jobFocusSummary} />
      <input name="portfolioPrimaryLabel" type="hidden" value={packet.portfolioRecommendation.primaryLabel} />
      <input name="portfolioPrimaryUrl" type="hidden" value={packet.portfolioRecommendation.primaryUrl} />
      <textarea hidden name="portfolioRationale" readOnly value={packet.portfolioRecommendation.rationale} />
      <textarea hidden name="checklistItems" readOnly value={toTextAreaValue(packet.checklistItems)} />
      <textarea hidden name="manualNotes" readOnly value={packet.manualNotes} />

      {packet.answers.map((answer, index) => (
        <div hidden key={`${answer.questionKey}-${index}`}>
          <input name="answerId" type="hidden" value={answer.id} />
          <input name="questionText" type="hidden" value={answer.questionText} />
          <input name="questionKey" type="hidden" value={answer.questionKey} />
          <input name="fieldType" type="hidden" value={answer.fieldType} />
          <input name="reviewStatus" type="hidden" value={answer.reviewStatus} />
          <input
            name="characterLimit"
            type="hidden"
            value={answer.characterLimit ? String(answer.characterLimit) : ''}
          />
          <textarea hidden name="answerText" readOnly value={answer.answerText} />
          <input name="answerVariantShort" type="hidden" value={answer.answerVariantShort} />
        </div>
      ))}

      {showGeneratedContent ? (
        <>
          <PacketMaterialsSection
            coverLetterReady={coverLetterReady}
            coverLetterSummary={coverLetterSummary}
            resumeChangeSummary={resumeChangeSummary}
            resumeReady={resumeReady}
            resumeSummary={resumeSummary}
          />
          <PacketQuestionsSection answers={packet.answers} readyAnswerCount={readyAnswerCount} />
        </>
      ) : (
        <PacketPreGenerationSection
          generationError={packet.generationError}
          isFailed={isFailed}
          isRunning={isRunning}
        />
      )}

      <PacketFormFooterMessage message={state.message} status={state.status} />
    </form>
  )
}
