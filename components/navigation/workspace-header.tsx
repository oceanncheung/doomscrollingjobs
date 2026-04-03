'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import type { QueueView } from '@/lib/jobs/dashboard-queue'

const queueViews = ['potential', 'saved', 'prepared', 'applied', 'archive'] as const

const labels: Record<QueueView, string> = {
  applied: 'Applied',
  archive: 'Archive',
  potential: 'Potential',
  prepared: 'Prepared',
  saved: 'Saved',
}

function getQueueView(value: string | null): QueueView {
  return queueViews.find((view) => view === value) ?? 'potential'
}

function buildQueueHref(view: QueueView) {
  return view === 'potential' ? '/dashboard' : `/dashboard?view=${view}`
}

export function WorkspaceHeader({ counts }: { counts?: Partial<Record<QueueView, number>> }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeView = pathname === '/dashboard' ? getQueueView(searchParams.get('view')) : null

  return (
    <header className="site-header">
      <Link className="site-brand" href="/dashboard">
        <strong>Doom Scrolling Jobs</strong>
        <span aria-hidden="true" className="site-profile-mark" />
      </Link>

      <nav className="site-workflow-nav" aria-label="Queue views">
        {queueViews.map((view) => (
          <Link
            aria-current={activeView === view ? 'page' : undefined}
            className="site-workflow-link"
            href={buildQueueHref(view)}
            key={view}
          >
            <span>{labels[view]}</span>
            {typeof counts?.[view] === 'number' ? (
              <span className="site-workflow-count">{counts[view]}</span>
            ) : null}
          </Link>
        ))}
      </nav>
    </header>
  )
}
