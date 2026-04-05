'use client'

import { useActionState, useEffect, useState } from 'react'

import { resetProfileWorkspaceForTesting, type ProfileActionState } from '@/app/profile/actions'

const initialState: ProfileActionState = {
  message: '',
  status: 'idle',
}

export function ProfileTestingResetButton() {
  const [state, formAction, isPending] = useActionState(resetProfileWorkspaceForTesting, initialState)
  const [dismissedSuccessMessage, setDismissedSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (state.status === 'success' && state.message) {
      const id = window.setTimeout(() => setDismissedSuccessMessage(state.message), 3000)
      return () => window.clearTimeout(id)
    }
  }, [state.message, state.status])

  const showMessage = Boolean(state.message) && (state.status !== 'success' || dismissedSuccessMessage !== state.message)

  return (
    <form
      action={formAction}
      className="profile-testing-reset"
      onSubmit={(event) => {
        if (
          !window.confirm(
            'Reset the testing workspace? This moves every job back to Potential (including saved, prepared, applied, and archived), clears application packets, and blanks the current profile materials.',
          )
        ) {
          event.preventDefault()
        }
      }}
    >
      <button className="profile-testing-reset-button" disabled={isPending} type="submit">
        {isPending ? 'Resetting…' : 'Reset Internal State'}
      </button>
      {showMessage ? (
        <p
          className={`profile-testing-reset-message ${
            state.status === 'error' ? 'profile-testing-reset-message--error' : ''
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  )
}
