import type { ReactNode } from 'react'

interface StageDetailGridProps {
  children: ReactNode
  className?: string
  stack?: boolean
}

interface StageDetailItemProps {
  children: ReactNode
  className?: string
  label: string
}

export function StageDetailGrid({
  children,
  className,
  stack = false,
}: StageDetailGridProps) {
  return (
    <div
      className={['detail-pair-grid', stack ? 'detail-pair-grid-stack' : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}

export function StageDetailItem({
  children,
  className,
  label,
}: StageDetailItemProps) {
  return (
    <div className={className}>
      <p className="panel-label">{label}</p>
      {children}
    </div>
  )
}

export function StageInlineLinks({ children }: { children: ReactNode }) {
  return <div className="inline-link-row">{children}</div>
}
