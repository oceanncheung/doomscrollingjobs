import type { ApplicationAnswerRecord } from '@/lib/domain/types'

import {
  PacketInlineNote,
  PacketQuestionSummary,
} from '@/components/jobs/packet-primitives'
import { SectionHeading } from '@/components/ui/section-heading'

interface PacketQuestionsSectionProps {
  answers: ApplicationAnswerRecord[]
  readyAnswerCount: number
}

export function PacketQuestionsSection({
  answers,
  readyAnswerCount,
}: PacketQuestionsSectionProps) {
  return (
    <section className="packet-section">
      <div className="packet-section-inner">
        <SectionHeading
          className="packet-section-heading"
          label="Application questions"
          note={
            answers.length > 0
              ? `${readyAnswerCount} of ${answers.length} recognized questions already have prepared answers.`
              : 'Questions will appear here when the application asks for them.'
          }
          title="Check the generated answers."
        />

        {answers.length > 0 ? (
          <div className="packet-question-list">
            {answers.map((answer, index) => {
              const answerReady = Boolean(answer.answerText.trim() || answer.answerVariantShort.trim())

              return (
                <details className="disclosure packet-question-card" key={`${answer.questionKey}-${index}`}>
                  <PacketQuestionSummary
                    answerReady={answerReady}
                    index={index}
                    questionText={answer.questionText}
                  />
                  <div className="disclosure-body packet-disclosure-body">
                    <div className="packet-preview-block">
                      <p>
                        {answer.answerText.trim() ||
                          'A prepared answer will appear here once this question is generated.'}
                      </p>
                      {answer.answerVariantShort.trim() ? (
                        <p className="packet-preview-secondary">
                          <strong>Short answer.</strong> {answer.answerVariantShort}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </details>
              )
            })}
          </div>
        ) : (
          <PacketInlineNote>
            <p>No extra questions have been detected for this application yet.</p>
          </PacketInlineNote>
        )}
      </div>
    </section>
  )
}
