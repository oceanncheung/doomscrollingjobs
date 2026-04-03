'use client'

import { useActionState } from 'react'

import { createOperator, selectOperator, type OperatorSetupActionState } from '@/app/operators/actions'
import type { OperatorRecord } from '@/lib/domain/types'

const initialState: OperatorSetupActionState = {
  message: '',
  status: 'idle',
}

interface OperatorAccessFormProps {
  activeOperatorId?: string
  operators: OperatorRecord[]
}

export function OperatorAccessForm({
  activeOperatorId,
  operators,
}: OperatorAccessFormProps) {
  const [state, formAction, isPending] = useActionState(createOperator, initialState)
  const hasOperators = operators.length > 0

  return (
    <div className="operator-access-shell">
      {hasOperators ? (
        <section className="operator-list" aria-label="Available operators">
          {operators.map((operator) => {
            const isActive = operator.id === activeOperatorId

            return (
              <form action={selectOperator} className="operator-row" key={operator.id}>
                <input name="operatorId" type="hidden" value={operator.id} />
                <button className="operator-row-button" type="submit">
                  <span className="operator-row-main">
                    <strong>{operator.displayName}</strong>
                    <span>{operator.email}</span>
                  </span>
                  <span className="operator-row-meta">{isActive ? 'Current' : 'Use this profile'}</span>
                </button>
              </form>
            )
          })}
        </section>
      ) : null}

      <section className="panel operator-setup-panel">
        <p className="panel-label">{hasOperators ? 'Add operator' : 'First operator'}</p>
        <h2>{hasOperators ? 'Create another internal operator' : 'Create the first operator'}</h2>

        <form action={formAction} className="operator-setup-form">
          <label className="field">
            <span>Display name</span>
            <input name="displayName" placeholder="Ocean" required type="text" />
          </label>

          <label className="field">
            <span>Email</span>
            <input name="email" placeholder="ocean@example.com" required type="email" />
          </label>

          <button className="button button-primary" disabled={isPending} type="submit">
            {isPending ? 'Saving...' : hasOperators ? 'Add Operator' : 'Create Operator'}
          </button>

          {state.message ? (
            <p className={`form-message ${state.status === 'error' ? 'form-message-error' : ''}`}>
              {state.message}
            </p>
          ) : null}
        </form>
      </section>
    </div>
  )
}
