import { ProfileForm } from '@/components/profile/profile-form'
import { requireActiveOperatorSelection } from '@/lib/data/operators'
import { getOperatorProfile } from '@/lib/data/operator-profile'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  await requireActiveOperatorSelection()
  const { workspace } = await getOperatorProfile()
  const { portfolioItems, profile, resumeMaster } = workspace

  return (
    <main className="page-stack">
      <section className="page-header flow-header">
        <div className="page-heading">
          <p className="panel-label">Operator settings</p>
          <h1>Settings</h1>
          <p>Keep source material current, then step into the deeper controls only when needed.</p>
        </div>
        <div className="flow-snapshot">
          <div>
            <span className="panel-label">Resume source</span>
            <strong>{resumeMaster.summaryText ? 'Present' : 'Missing'}</strong>
          </div>
          <div>
            <span className="panel-label">Portfolio</span>
            <strong>{profile.portfolioPrimaryUrl ? 'Linked' : 'Needs link'}</strong>
          </div>
          <div>
            <span className="panel-label">Library</span>
            <strong>{portfolioItems.length} portfolio items</strong>
          </div>
        </div>
      </section>

      <ProfileForm workspace={workspace} />
    </main>
  )
}
