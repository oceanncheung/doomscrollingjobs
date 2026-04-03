import { OperatorAccessForm } from '@/components/operators/operator-access-form'
import { getOperatorSessionState } from '@/lib/data/operators'

export const dynamic = 'force-dynamic'

export default async function OperatorsPage() {
  const session = await getOperatorSessionState()

  return (
    <main className="page-stack">
      <section className="page-header">
        <div className="page-heading">
          <p className="panel-label">Operators</p>
          <h1>Choose An Operator</h1>
          <p>Select the active workspace, or create a new internal operator for this device.</p>
        </div>
      </section>

      {session.issue ? (
        <section className="panel">
          <p className="panel-label">Setup required</p>
          <p>{session.issue} Run `supabase/migrations/0005_lightweight_operators.sql` in Supabase SQL Editor, then reload this page.</p>
        </section>
      ) : null}

      <OperatorAccessForm
        activeOperatorId={session.activeOperator?.id}
        operators={session.operators}
      />
    </main>
  )
}
