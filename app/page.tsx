import { redirect } from 'next/navigation'

import { getOperatorSessionState } from '@/lib/data/operators'
import { hasSupabaseServerEnv } from '@/lib/env'

export default async function HomePage() {
  if (hasSupabaseServerEnv()) {
    const session = await getOperatorSessionState()

    if (session.needsSetup || session.needsSelection) {
      redirect('/operators')
    }
  }

  redirect('/dashboard')
}
