'use client'

import { FileUploadSlot } from '@/components/settings/file-upload-slot'

interface ApplicationMaterialsSectionProps {
  coverLetterFileName: string | null
  resumeFileName: string | null
  setCoverLetterFileName: (value: string | null) => void
  setResumeFileName: (value: string | null) => void
}

export function ApplicationMaterialsSection({
  coverLetterFileName,
  resumeFileName,
  setCoverLetterFileName,
  setResumeFileName,
}: ApplicationMaterialsSectionProps) {
  const sourceDocumentGptUrl = process.env.NEXT_PUBLIC_SOURCE_DOCUMENT_GPT_URL?.trim() ?? ''
  const canGenerateProfile = Boolean(resumeFileName && coverLetterFileName)

  return (
    <section className="panel settings-section" id="source-files">
      <div className="settings-section-header">
        <div className="settings-section-title-stack">
          <p className="panel-label">Source documents</p>
          <h2>Generate the master source for your resume and cover letter first.</h2>
        </div>
      </div>

      <div className="settings-section-subcopy">
        <p className="profile-note">
          Use the Custom GPT below to turn your current resume and cover letter into two simple
          source files for this workspace.
        </p>
        <p className="profile-note">Upload the markdown files it gives you here, then generate your profile.</p>
        <p className="panel-label">Use .md files only.</p>
      </div>

      <div className="settings-source-gpt-row inline-link-row">
        {sourceDocumentGptUrl ? (
          <a
            className="settings-source-gpt-link"
            href={sourceDocumentGptUrl}
            rel="noreferrer"
            target="_blank"
          >
            Open Custom GPT
          </a>
        ) : (
          <span className="settings-source-gpt-link settings-source-gpt-link--disabled">
            Open Custom GPT
          </span>
        )}
      </div>

      <div className="settings-source-uploads-row settings-source-uploads-row--materials">
        <div className="settings-source-uploads-materials-files settings-source-uploads-materials-files--dual">
          <FileUploadSlot
            accept=".md,.markdown,text/markdown"
            compactMaxLength={40}
            fileName={resumeFileName}
            inputName="resumePdfUpload"
            label="Source Resume (.md)"
            onRemove={() => setResumeFileName(null)}
            onUpload={(file) => setResumeFileName(file.name)}
            presentation="chip"
            showUploadIcon
          />
          <FileUploadSlot
            accept=".md,.markdown,text/markdown"
            compactMaxLength={40}
            fileName={coverLetterFileName}
            inputName="coverLetterPdfUpload"
            label="Source Cover Letter (.md)"
            onRemove={() => setCoverLetterFileName(null)}
            onUpload={(file) => setCoverLetterFileName(file.name)}
            presentation="chip"
            showUploadIcon
          />
        </div>
        <button
          className="upload-slot-chip-btn upload-slot-chip-btn--action settings-source-generate-button"
          disabled={!canGenerateProfile}
          formNoValidate
          name="intent"
          title={!canGenerateProfile ? 'Upload both source markdown files first.' : undefined}
          type="submit"
          value="generate-profile"
        >
          <span>Generate Profile</span>
        </button>
      </div>
    </section>
  )
}
