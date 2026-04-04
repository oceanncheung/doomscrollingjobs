interface PacketPreGenerationSectionProps {
  generationError?: string
  isFailed: boolean
  isRunning: boolean
}

export function PacketPreGenerationSection({
  generationError,
  isFailed,
  isRunning,
}: PacketPreGenerationSectionProps) {
  const note = isRunning
    ? 'Generating tailored resume, cover letter, and answers...'
    : generationError
      ? generationError
      : 'Nothing is shown yet so this step stays focused. Generate the content first, then review it here.'

  return (
    <section className="packet-section">
      <div className="packet-section-inner">
        <div className="settings-section-header packet-section-heading">
          <div className="settings-section-title-stack">
            <p className="panel-label">Generate content</p>
            <h2>Create the resume and cover letter for this role.</h2>
            <p className="settings-section-note">
              Resume, cover letter, and any recognized application answers will appear here after you generate them.
            </p>
          </div>
        </div>

        <div className="packet-inline-note">
          <p>{note}</p>
          {isFailed ? <p className="form-message form-message-error">Generation failed. Try generating again.</p> : null}
        </div>
      </div>
    </section>
  )
}
