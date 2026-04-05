'use client'

import { useFormStatus } from 'react-dom'
import { RefreshCwIcon } from '@/components/ui/icons/refresh-cw-icon'

export function QueueRefreshButton() {
  const { pending } = useFormStatus()

  return (
    <button
      aria-label={pending ? 'Refreshing jobs' : 'Refresh jobs'}
      className="queue-refresh-mark"
      disabled={pending}
      title={pending ? 'Refreshing jobs' : 'Refresh jobs'}
      type="submit"
    >
      <RefreshCwIcon className="queue-refresh-icon" />
    </button>
  )
}
