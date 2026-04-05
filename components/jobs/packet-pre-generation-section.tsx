import {
  PacketInlineNote,
  PacketRemediationCallout,
} from '@/components/jobs/packet-primitives'
import { SectionHeading } from '@/components/ui/section-heading'
import { buildPacketPreGenerationViewModel } from '@/lib/jobs/packet-view-model'

interface PacketPreGenerationSectionProps {
  generationError?: string
  isFailed: boolean
  isRunning: boolean
  /** When false, incomplete-ATS failures should not use the profile remediation callout (user has Settings material + resume source). */
  profileMaterialReady: boolean
  screeningLocked?: boolean
}

export function PacketPreGenerationSection({
  generationError,
  isFailed,
  isRunning,
  profileMaterialReady,
  screeningLocked = false,
}: PacketPreGenerationSectionProps) {
  const viewModel = buildPacketPreGenerationViewModel({
    generationError,
    isFailed,
    isRunning,
    profileMaterialReady,
    screeningLocked,
  })

  return (
    <section className="packet-section">
      <div className="packet-section-inner">
        <SectionHeading
          className="packet-section-heading"
          label={viewModel.label}
          note={viewModel.note}
          title={viewModel.title}
        />

        {viewModel.mode === 'locked' || viewModel.mode === 'profile-remediation' ? (
          <PacketRemediationCallout
            actionHref={viewModel.actionHref}
            actionLabel={viewModel.actionLabel}
            hint={viewModel.lines[1]}
            lead={viewModel.lines[0]}
          />
        ) : (
          <PacketInlineNote>
            {viewModel.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </PacketInlineNote>
        )}
      </div>
    </section>
  )
}
