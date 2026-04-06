'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'

interface WorkspaceRailShellProps {
  ariaLabel?: string
  children: ReactNode
  className?: string
  collapsedLabel?: string
  collapsedPreview?: string | null
  footer?: ReactNode
  scrollClassName?: string
}

export function WorkspaceRailShell({
  ariaLabel,
  children,
  className = 'today-rail',
  collapsedLabel,
  collapsedPreview,
  footer,
  scrollClassName = 'today-rail-scroll',
}: WorkspaceRailShellProps) {
  const hasRailCollapse = Boolean(collapsedLabel)
  const [isRailCollapsed, setIsRailCollapsed] = useState(hasRailCollapse)

  return (
    <div className="dashboard-rail-column">
      <div aria-hidden="true" className="dashboard-rail-spacer" />
      <aside
        aria-label={ariaLabel}
        className={[
          className,
          hasRailCollapse ? 'has-rail-collapse' : null,
          hasRailCollapse && isRailCollapsed ? 'is-rail-collapsed' : null,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {hasRailCollapse ? (
          <div className="rail-collapse-handle">
            <button
              aria-expanded={!isRailCollapsed}
              className="rail-collapse-toggle"
              onClick={() => setIsRailCollapsed((collapsed) => !collapsed)}
              type="button"
            >
              <span className="rail-collapse-copy">
                <span className="rail-collapse-label">{collapsedLabel}</span>
                {collapsedPreview ? (
                  <span className="rail-collapse-preview">{collapsedPreview}</span>
                ) : null}
              </span>
              <span aria-hidden="true" className="rail-collapse-indicator">
                {isRailCollapsed ? '+' : '−'}
              </span>
            </button>
          </div>
        ) : null}
        <div className={scrollClassName}>{children}</div>
        {footer}
      </aside>
    </div>
  )
}
