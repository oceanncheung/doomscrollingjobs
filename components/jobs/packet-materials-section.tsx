import { SectionHeading } from '@/components/ui/section-heading'

interface PacketMaterialsSectionProps {
  coverLetterReady: boolean
  coverLetterSummary: string
  resumeChangeSummary: string
  resumeReady: boolean
  resumeSummary: string
}

export function PacketMaterialsSection({
  coverLetterReady,
  coverLetterSummary,
  resumeChangeSummary,
  resumeReady,
  resumeSummary,
}: PacketMaterialsSectionProps) {
  return (
    <section className="packet-section" id="packet-materials-section">
      <div className="packet-section-inner">
        <SectionHeading
          className="packet-section-heading"
          label="Application materials"
          note="Short summaries of the tailored resume and cover letter are below. Use the source listing on this page if you need the full job text or posting."
          title="Review what will be sent."
        />

        <div className="packet-material-grid">
          <article className="packet-material-block">
            <div className="packet-material-heading">
              <p className="upload-slot-label">Resume summary</p>
            </div>
            <p className="packet-material-copy">{resumeSummary}</p>
            <p className="packet-material-status" role="status">
              <span
                aria-hidden="true"
                className={
                  resumeReady
                    ? 'packet-material-status-dot packet-material-status-dot--ready'
                    : 'packet-material-status-dot packet-material-status-dot--pending'
                }
              />
              {resumeReady ? 'Ready' : 'Pending'}
            </p>
          </article>

          <article className="packet-material-block">
            <div className="packet-material-heading">
              <p className="upload-slot-label">Resume changes</p>
            </div>
            <p className="packet-material-copy">{resumeChangeSummary}</p>
          </article>

          <article className="packet-material-block">
            <div className="packet-material-heading">
              <p className="upload-slot-label">Cover letter summary</p>
            </div>
            <p className="packet-material-copy">{coverLetterSummary}</p>
            <p className="packet-material-status" role="status">
              <span
                aria-hidden="true"
                className={
                  coverLetterReady
                    ? 'packet-material-status-dot packet-material-status-dot--ready'
                    : 'packet-material-status-dot packet-material-status-dot--pending'
                }
              />
              {coverLetterReady ? 'Ready' : 'Pending'}
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}
