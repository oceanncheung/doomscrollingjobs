'use client'

import { useActionState } from 'react'

import { PacketHiddenFields } from '@/components/jobs/packet-hidden-fields'
import { saveApplicationPacket, type ApplicationPacketActionState } from '@/app/jobs/actions'
import { PacketFormFooterMessage } from '@/components/jobs/packet-form-footer-message'
import { PacketMaterialsSection } from '@/components/jobs/packet-materials-section'
import { PacketPreGenerationSection } from '@/components/jobs/packet-pre-generation-section'
import { PacketQuestionsSection } from '@/components/jobs/packet-questions-section'
import { type ApplicationPacketRecord } from '@/lib/domain/types'
import type { RankedJobRecord } from '@/lib/jobs/contracts'
import { buildPacketMaterialsViewModel } from '@/lib/jobs/packet-view-model'

const initialState: ApplicationPacketActionState = {
  message: '',
  status: 'idle',
}

interface ApplicationPacketFormProps {
  canSave: boolean
  disabledReason?: string
  job: RankedJobRecord
  packet: ApplicationPacketRecord
  profileMaterialReady: boolean
  screeningLocked?: boolean
  showGeneratedContent: boolean
}

export function ApplicationPacketForm({
  job,
  packet,
  profileMaterialReady,
  screeningLocked = false,
  showGeneratedContent,
}: ApplicationPacketFormProps) {
  const [state, formAction] = useActionState(saveApplicationPacket, initialState)
  const viewModel = buildPacketMaterialsViewModel(packet)

  return (
    <form action={formAction} className="packet-form" id="packet-form">
      <PacketHiddenFields job={job} packet={packet} />

      {showGeneratedContent ? (
        <>
          <PacketMaterialsSection
            coverLetterReady={viewModel.coverLetterReady}
            coverLetterSummary={viewModel.coverLetterSummary}
            resumeChangeSummary={viewModel.resumeChangeSummary}
            resumeReady={viewModel.resumeReady}
            resumeSummary={viewModel.resumeSummary}
          />
          {viewModel.showQuestionSection ? (
            <PacketQuestionsSection answers={packet.answers} readyAnswerCount={viewModel.readyAnswerCount} />
          ) : null}
        </>
      ) : (
        <PacketPreGenerationSection
          generationError={packet.generationError}
          isFailed={viewModel.isFailed}
          isRunning={viewModel.isRunning}
          profileMaterialReady={profileMaterialReady}
          screeningLocked={screeningLocked}
        />
      )}

      <PacketFormFooterMessage message={state.message} status={state.status} />
    </form>
  )
}
