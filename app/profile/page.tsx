import { clearActiveOperatorSelection } from '@/app/operators/actions'
import { ProfileForm } from '@/components/profile/profile-form'
import { requireActiveOperatorSelection } from '@/lib/data/operators'
import { getOperatorProfile } from '@/lib/data/operator-profile'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  await requireActiveOperatorSelection()
  const { workspace } = await getOperatorProfile()

  return (
    <main className="page-stack">
      <form action={clearActiveOperatorSelection} className="settings-log-out-bar">
        <button className="button button-secondary button-small" type="submit">
          Log out
        </button>
      </form>
      <ProfileForm workspace={workspace} />
    </main>
  )
}
