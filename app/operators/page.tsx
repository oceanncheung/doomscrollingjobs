import { OperatorAccessForm } from '@/components/operators/operator-access-form'
import { OperatorCreateForm } from '@/components/operators/operator-create-form'
import { WorkspaceRailShell } from '@/components/navigation/workspace-rail-shell'
import { WorkspaceSurface } from '@/components/navigation/workspace-surface'
import { getOperatorSessionState } from '@/lib/data/operators'

export const dynamic = 'force-dynamic'

export default async function OperatorsPage() {
  const session = await getOperatorSessionState()
  const hasOperators = session.operators.length > 0

  return (
    <main className="page-stack">
      <WorkspaceSurface
        rail={
          <WorkspaceRailShell className="today-rail">
            <OperatorCreateForm hasOperators={hasOperators} />
          </WorkspaceRailShell>
        }
      >
          <section className="queue-meta operator-page-header">
            <div className="queue-meta-heading">
              <div>
                <p className="panel-label">Accounts</p>
                <h1>Choose an account</h1>
              </div>
            </div>
            <p>Select the active workspace for this browser session.</p>
          </section>

          {session.issue ? (
            <section className="panel">
              <p className="panel-label">Setup required</p>
              <p>
                {session.issue} Run `supabase/migrations/0005_lightweight_operators.sql` in Supabase SQL
                Editor, then reload this page.
              </p>
            </section>
          ) : null}

          <OperatorAccessForm
            activeOperatorId={session.activeOperator?.id}
            operators={session.operators}
          />
      </WorkspaceSurface>
    </main>
  )
}
