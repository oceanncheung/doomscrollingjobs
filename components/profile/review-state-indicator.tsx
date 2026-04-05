'use client'

import type { ReviewState } from '@/lib/profile/master-assets'
import { useProfileReviewIndicators } from '@/components/profile/profile-save-message-root'
import { StatusDot } from '@/components/ui/status-indicator'

function getReviewStateLabel(state: ReviewState) {
  return state === 'ready' ? 'Ready' : 'Needs attention'
}

export function ReviewStateIndicator({
  className,
  state,
}: {
  className?: string
  state: ReviewState
}) {
  const { reviewIndicatorsVisible } = useProfileReviewIndicators()
  const tone = state === 'ready' ? 'is-ready' : 'is-attention'

  if (!reviewIndicatorsVisible) {
    return null
  }

  return (
    <StatusDot
      ariaLabel={getReviewStateLabel(state)}
      className={['settings-review-indicator', tone, className].filter(Boolean).join(' ')}
      title={getReviewStateLabel(state)}
      tone={state === 'ready' ? 'ready' : 'attention'}
    />
  )
}
