import { type ApplicationPacketRecord } from '@/lib/domain/types'
import type { RankedJobRecord } from '@/lib/jobs/contracts'

function toTextAreaValue(values: string[]) {
  return values.join('\n')
}

interface PacketHiddenFieldsProps {
  job: RankedJobRecord
  packet: ApplicationPacketRecord
}

export function PacketHiddenFields({
  job,
  packet,
}: PacketHiddenFieldsProps) {
  return (
    <>
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
      <textarea hidden name="coverLetterChangeSummary" readOnly value={packet.coverLetterChangeSummary} />
      <textarea hidden name="professionalSummary" readOnly value={packet.professionalSummary} />
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
    </>
  )
}
