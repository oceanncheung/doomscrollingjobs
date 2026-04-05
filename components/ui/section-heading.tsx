import type { ReactNode } from 'react'

import { LabeledHeading } from '@/components/ui/labeled-heading'

interface SectionHeadingProps {
  children?: ReactNode
  className?: string
  label: string
  note?: ReactNode
  title: string
  titleLevel?: 'h1' | 'h2' | 'h3'
}

export function SectionHeading({
  children,
  className,
  label,
  note,
  title,
  titleLevel = 'h2',
}: SectionHeadingProps) {
  return (
    <LabeledHeading
      className={['settings-section-header', className].filter(Boolean).join(' ')}
      label={label}
      stackClassName="settings-section-title-stack"
      title={title}
      titleLevel={titleLevel}
    >
      {note ? <p className="settings-section-note">{note}</p> : null}
      {children}
    </LabeledHeading>
  )
}
