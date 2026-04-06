import { PacketStatus } from '@/components/jobs/packet-primitives'
import { SectionHeading } from '@/components/ui/section-heading'

interface PacketMaterialsSectionProps {
  coverLetterChangeSummary: string
  coverLetterReady: boolean
  coverLetterSummary: string
  resumeChangeSummary: string
  resumeReady: boolean
  resumeSummary: string
}

export function PacketMaterialsSection({
  coverLetterChangeSummary,
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
            <PacketStatus ready={resumeReady} />
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
            <PacketStatus ready={coverLetterReady} />
          </article>

          <article className="packet-material-block">
            <div className="packet-material-heading">
              <p className="upload-slot-label">Cover letter changes</p>
            </div>
            <p className="packet-material-copy">{coverLetterChangeSummary}</p>
          </article>
        </div>
      </div>
    </section>
  )
}
