import {
  PacketInlineNote,
  PacketRemediationCallout,
} from '@/components/jobs/packet-primitives'
import { SectionHeading } from '@/components/ui/section-heading'
import {
  getPacketGenerationRemediationHint,
  getPacketGenerationUserMessage,
  isIncompleteAtsGenerationError,
} from '@/lib/jobs/packet-generation-copy'

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
  const userFacingError = getPacketGenerationUserMessage(generationError)
  const remediationHint = getPacketGenerationRemediationHint(generationError)
  const idleNote =
    'Nothing is shown yet so this step stays focused. Generate the content first, then review it here.'
  const runningNote = 'Generating tailored resume, cover letter, and answers...'

  const incompleteAts = isIncompleteAtsGenerationError(generationError)
  const showProfileRemediationCallout =
    isFailed &&
    incompleteAts &&
    !profileMaterialReady &&
    Boolean(userFacingError || remediationHint)

  const lockedNote =
    'Complete your profile in Profile before generating application materials.'

  return (
    <section className="packet-section">
      <div className="packet-section-inner">
        <SectionHeading
          className="packet-section-heading"
          label={screeningLocked ? 'Profile not ready' : 'Generate content'}
          note={
            screeningLocked
              ? 'Use Profile to upload your resume, generate the profile draft, review the extracted sections, and save once the required fields are ready. The application packet unlocks once your profile is ready.'
              : 'Resume and cover letter will appear here after generation. Application questions only show up when the ATS actually asks for them.'
          }
          title={
            screeningLocked
              ? 'Complete your profile before preparing this packet.'
              : 'Create the resume and cover letter for this role.'
          }
        />

        {screeningLocked ? (
          <PacketRemediationCallout actionHref="/profile" actionLabel="Open Profile" lead={lockedNote} />
        ) : isRunning ? (
          <PacketInlineNote>
            <p>{runningNote}</p>
          </PacketInlineNote>
        ) : showProfileRemediationCallout ? (
          <PacketRemediationCallout
            actionHref="/profile"
            actionLabel="Open Profile"
            hint={remediationHint}
            lead={userFacingError}
          />
        ) : isFailed ? (
          <PacketInlineNote>
            {incompleteAts && profileMaterialReady ? (
              <>
                <p>The application materials could not be generated yet.</p>
                <p>Try generating again.</p>
              </>
            ) : (
              <>
                {userFacingError ? <p>{userFacingError}</p> : null}
                {remediationHint ? <p>{remediationHint}</p> : null}
                {!userFacingError && !remediationHint ? (
                  <p>The application materials could not be generated yet.</p>
                ) : null}
              </>
            )}
          </PacketInlineNote>
        ) : (
          <PacketInlineNote>
            <p>{idleNote}</p>
          </PacketInlineNote>
        )}
      </div>
    </section>
  )
}
