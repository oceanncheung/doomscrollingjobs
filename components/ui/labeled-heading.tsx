import type { ReactNode } from 'react'

interface LabeledHeadingProps {
  children?: ReactNode
  className?: string
  label: string
  stackClassName?: string
  title: string
  titleLevel?: 'h1' | 'h2' | 'h3'
}

export function LabeledHeading({
  children,
  className,
  label,
  stackClassName,
  title,
  titleLevel = 'h2',
}: LabeledHeadingProps) {
  const TitleTag = titleLevel

  return (
    <div className={className}>
      <div className={stackClassName}>
        <p className="panel-label">{label}</p>
        <TitleTag>{title}</TitleTag>
      </div>
      {children}
    </div>
  )
}
