import type { ApplicationAnswerRecord } from '@/lib/domain/types'

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
                  <summary className="disclosure-summary packet-question-summary">
                    <div className="packet-question-main">
                      <p className="upload-slot-label">Question {index + 1}</p>
                      <h3>{answer.questionText}</h3>
                    </div>
                    <div className="packet-question-status-slot">
                      <span className="packet-material-status" role="status">
                        <span
                          aria-hidden="true"
                          className={
                            answerReady
                              ? 'packet-material-status-dot packet-material-status-dot--ready'
                              : 'packet-material-status-dot packet-material-status-dot--pending'
                          }
                        />
                        {answerReady ? 'Ready' : 'Pending'}
                      </span>
                    </div>
                    <div className="disclosure-controls packet-question-controls">
                      <span className="disclosure-caret" aria-hidden="true">
                        <svg fill="none" height="14" viewBox="0 0 16 16" width="14">
                          <path
                            d="M4 6l4 4 4-4"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.25"
                          />
                        </svg>
                      </span>
                    </div>
                  </summary>
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
          <div className="packet-inline-note">
            <p>No extra questions have been detected for this application yet.</p>
          </div>
        )}
      </div>
    </section>
  )
}
