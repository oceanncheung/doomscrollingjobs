'use client'

interface StatusDotProps {
  ariaLabel?: string
  className?: string
  title?: string
  tone: 'attention' | 'ready'
}

interface StatusIndicatorProps {
  className?: string
  dotClassName?: string
  label: string
  tone: 'attention' | 'ready'
}

function getToneClassName(tone: 'attention' | 'ready') {
  return tone === 'ready' ? 'status-indicator-dot--ready' : 'status-indicator-dot--attention'
}

export function StatusDot({ ariaLabel, className, title, tone }: StatusDotProps) {
  return (
    <span
      aria-label={ariaLabel}
      className={['status-indicator-dot', getToneClassName(tone), className].filter(Boolean).join(' ')}
      role="status"
      title={title ?? ariaLabel}
    />
  )
}

export function StatusIndicator({
  className,
  dotClassName,
  label,
  tone,
}: StatusIndicatorProps) {
  return (
    <span className={['status-indicator', className].filter(Boolean).join(' ')} role="status">
      <StatusDot className={dotClassName} tone={tone} />
      <span className="status-indicator-label">{label}</span>
    </span>
  )
}
