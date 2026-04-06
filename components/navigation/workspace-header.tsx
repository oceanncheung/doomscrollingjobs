'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

import { ProfileSettingsIcon } from '@/components/navigation/profile-settings-icon'
import {
  getQueueView,
  getQueueViewHref,
  queueViews,
  type QueueView,
} from '@/lib/jobs/dashboard-queue'
import { getQueueViewLabel } from '@/lib/jobs/workflow-state'

export function WorkspaceHeader({ counts }: { counts?: Partial<Record<QueueView, number>> }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentRouteKey = `${pathname}?${searchParams.toString()}`
  const [mobileMenuState, setMobileMenuState] = useState({
    open: false,
    routeKey: currentRouteKey,
  })
  const activeView =
    pathname === '/dashboard' ? getQueueView(searchParams.get('view') ?? undefined) : null
  const profileActive = pathname === '/profile'
  const mobileMenuOpen =
    mobileMenuState.open && mobileMenuState.routeKey === currentRouteKey

  useEffect(() => {
    if (!mobileMenuOpen) {
      return undefined
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuState({
          open: false,
          routeKey: currentRouteKey,
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentRouteKey, mobileMenuOpen])

  const navigateMobileMenu = (href: string) => () => {
    setMobileMenuState({
      open: false,
      routeKey: currentRouteKey,
    })
    router.push(href)
  }

  return (
    <header className="site-header">
      <div className="site-brand">
        <Link href="/dashboard">
          <strong>Doom Scrolling Jobs</strong>
        </Link>
        <button
          aria-controls="site-mobile-menu"
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="site-mobile-menu-toggle"
          onClick={() =>
            setMobileMenuState((state) => ({
              open: !(state.open && state.routeKey === currentRouteKey),
              routeKey: currentRouteKey,
            }))
          }
          type="button"
        >
          <span className="site-mobile-menu-toggle-line" />
          <span className="site-mobile-menu-toggle-line" />
          <span className="site-mobile-menu-toggle-line" />
        </button>
        <Link
          aria-current={profileActive ? 'page' : undefined}
          aria-label="Profile settings"
          className="site-profile-avatar-link"
          href="/profile"
        >
          <span className="site-profile-mark">
            <ProfileSettingsIcon className="site-profile-icon" />
          </span>
        </Link>
      </div>

      <nav className="site-workflow-nav" aria-label="Queue views">
        {queueViews.map((view) => (
          <Link
            aria-current={activeView === view ? 'page' : undefined}
            className="site-workflow-link"
            href={getQueueViewHref(view)}
            key={view}
          >
            <span>{getQueueViewLabel(view)}</span>
            {typeof counts?.[view] === 'number' ? (
              <span className="site-workflow-count">{counts[view]}</span>
            ) : null}
          </Link>
        ))}
      </nav>

      <div
        aria-label="Mobile queue views"
        className={`site-mobile-menu${mobileMenuOpen ? ' is-open' : ''}`}
        id="site-mobile-menu"
      >
        {queueViews.map((view) => (
          <button
            aria-current={activeView === view ? 'page' : undefined}
            className="site-mobile-menu-link"
            key={view}
            onClick={navigateMobileMenu(getQueueViewHref(view))}
            type="button"
          >
            <span>{getQueueViewLabel(view)}</span>
            {typeof counts?.[view] === 'number' ? (
              <span className="site-mobile-menu-item-meta site-workflow-count">{counts[view]}</span>
            ) : null}
          </button>
        ))}
        <button
          aria-current={profileActive ? 'page' : undefined}
          className="site-mobile-menu-link site-mobile-menu-link--settings"
          onClick={navigateMobileMenu('/profile')}
          type="button"
        >
          <span>Profile Settings</span>
          <span className="site-mobile-menu-item-meta site-mobile-menu-settings-mark">
            <ProfileSettingsIcon className="site-profile-icon" />
          </span>
        </button>
      </div>
    </header>
  )
}
